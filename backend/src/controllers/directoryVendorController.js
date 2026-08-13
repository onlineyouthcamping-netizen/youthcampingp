const { prisma } = require("../lib/prisma");
const pricingEngine = require("../utils/vendorPricingEngine");

// ── 1. MAIN DIRECTORY VENDOR CRUD ──

exports.getDirectoryAnalytics = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";

    // Counts on OpsVendor
    const totalVendors = await prisma.opsVendor.count({ where: { tenantId } });
    const activeVendors = await prisma.opsVendor.count({
      where: { tenantId, isActive: true },
    });
    const gstRegisteredCount = await prisma.opsVendor.count({
      where: { tenantId, gstin: { not: null, not: "" } },
    });
    const preferredCount = await prisma.opsVendor.count({
      where: { tenantId, isPreferred: true },
    });

    // Group by category/type
    const categoryGroups = await prisma.opsVendor.groupBy({
      by: ["type"],
      where: { tenantId },
      _count: { id: true },
    });

    const categoryCounts = {};
    categoryGroups.forEach((g) => {
      categoryCounts[g.type] = g._count.id;
    });

    // Recent activity log from OpsVendorTimeline
    const recentActivity = await prisma.opsVendorTimeline.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { vendor: { select: { id: true, name: true, type: true } } },
    });

    res.json({
      success: true,
      data: {
        totalVendors,
        activeVendors,
        gstRegisteredCount,
        preferredCount,
        categoryCounts,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getDirectoryDestinations = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";

    const vendors = await prisma.opsVendor.findMany({
      where: { tenantId },
      select: { city: true, state: true, location: true },
      distinct: ["city"],
    });

    const destinations = vendors
      .map((v) => v.city || v.location)
      .filter(Boolean)
      .sort();

    res.json({ success: true, data: Array.from(new Set(destinations)) });
  } catch (error) {
    next(error);
  }
};

const ACCOMMODATION_TYPES = [
  "HOTEL",
  "HOMESTAY",
  "CAMP",
  "RESORT",
  "HOSTEL",
  "GUEST_HOUSE",
  "VILLA",
  "COTTAGE",
  "APARTMENT",
  "DORMITORY",
  "LUXURY_TENT",
];
const TRANSPORT_TYPES = ["TRANSPORT"];
const ACTIVITIES_TYPES = ["ACTIVITIES"];
const RESTAURANT_TYPES = ["RESTAURANT", "FOOD"];
const GUIDE_TYPES = ["GUIDE"];
const OTHER_TYPES = ["OTHER"];

exports.getDirectoryVendors = async (req, res, next) => {
  try {
    const {
      type,
      category,
      state,
      city,
      isActive,
      search,
      destination,
      tripId,
      page = 1,
      limit = 10,
    } = req.query;
    const tenantId = req.user?.tenantId || "default";
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Use AND array so each dimension of filtering is fully independent
    const andClauses = [];

    // ── 1. Tenant scope ──────────────────────────────────────
    if (tenantId === "default") {
      andClauses.push({ tenantId: "default" });
    } else {
      andClauses.push({ OR: [{ tenantId }, { tenantId: "default" }] });
    }

    // ── 2. Trip-scoped filter ────────────────────────────────
    // ONLY show vendors explicitly assigned via OpsTripVendor — no city guessing
    if (tripId && tripId !== "ALL" && tripId !== "GLOBAL") {
      andClauses.push({
        tripVendors: { some: { tripId } },
      });
    }

    // ── 3. Category / Type filter ────────────────────────────
    const activeType = type || category;
    if (activeType && activeType !== "ALL") {
      const parts = activeType
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);

      let resolvedTypes = [...parts];
      if (parts.includes("ACCOMMODATION")) {
        resolvedTypes = [...resolvedTypes.filter((t) => t !== "ACCOMMODATION"), ...ACCOMMODATION_TYPES];
      }
      if (parts.includes("RESTAURANTS")) {
        resolvedTypes = [...resolvedTypes.filter((t) => t !== "RESTAURANTS"), ...RESTAURANT_TYPES];
      }
      if (parts.includes("OTHER")) {
        resolvedTypes = [...resolvedTypes.filter((t) => t !== "OTHER"), ...OTHER_TYPES];
      }

      if (resolvedTypes.length > 1) {
        andClauses.push({ type: { in: resolvedTypes } });
      } else if (resolvedTypes.length === 1) {
        andClauses.push({ type: resolvedTypes[0] });
      }
    }

    // ── 4. State filter ──────────────────────────────────────
    if (state && state !== "ALL") {
      andClauses.push({ state });
    }

    // ── 5. Destination / City filter ─────────────────────────
    const activeDest = destination || city;
    if (activeDest && activeDest !== "ALL") {
      andClauses.push({
        OR: [
          { city: { contains: activeDest, mode: "insensitive" } },
          { location: { contains: activeDest, mode: "insensitive" } },
          { area: { contains: activeDest, mode: "insensitive" } },
          { destinations: { some: { name: { contains: activeDest, mode: "insensitive" } } } },
        ],
      });
    }

    // ── 6. Active status filter ──────────────────────────────
    if (isActive === "false" || isActive === false) {
      andClauses.push({ isActive: false });
    } else if (isActive !== "ALL" && isActive !== "all" && isActive !== "both") {
      andClauses.push({ isActive: true }); // Default: active only
    }

    // ── 7. Full-text search ──────────────────────────────────
    if (search && search.trim()) {
      const q = search.trim();
      andClauses.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { contactPerson: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { alternatePhone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { gstin: { contains: q, mode: "insensitive" } },
          { panNumber: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { state: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const where = andClauses.length === 1 ? andClauses[0] : { AND: andClauses };

    // ── Base scope for category tab counts ──
    // Use only tenant + trip scope clauses (exclude type/search/destination clauses)
    const baseScopeClauses = andClauses.slice(0, tripId && tripId !== "ALL" && tripId !== "GLOBAL" ? 2 : 1);
    // Also add active-status clause if present (always include it in count scope)
    const activeClause = andClauses.find((c) => c.isActive !== undefined);
    if (activeClause) baseScopeClauses.push(activeClause);
    const baseScopeWhere = baseScopeClauses.length === 1 ? baseScopeClauses[0] : { AND: baseScopeClauses };

    const [
      vendors,
      total,
      accommodationCount,
      transportCount,
      activitiesCount,
      restaurantsCount,
      guidesCount,
      otherCount,
    ] = await Promise.all([
      prisma.opsVendor.findMany({
        where,
        include: {
          vendorRooms: true,
          seasonalRates: true,
          destinations: true,
          vendorContacts: true,
          contracts: true,
          vehicleMaster: true,
          routePricingGroups: { include: { vehicleRates: true } },
          transportFleet: true,
          transportRates: true,
          tripVendors: {
            include: { trip: { select: { id: true, title: true } } },
          },
        },
        skip,
        take: limitNum,
        orderBy: { name: "asc" },
      }),
      prisma.opsVendor.count({ where }),
      prisma.opsVendor.count({ where: { ...baseScopeWhere, type: { in: ACCOMMODATION_TYPES } } }),
      prisma.opsVendor.count({ where: { ...baseScopeWhere, type: { in: TRANSPORT_TYPES } } }),
      prisma.opsVendor.count({ where: { ...baseScopeWhere, type: { in: ACTIVITIES_TYPES } } }),
      prisma.opsVendor.count({ where: { ...baseScopeWhere, type: { in: RESTAURANT_TYPES } } }),
      prisma.opsVendor.count({ where: { ...baseScopeWhere, type: { in: GUIDE_TYPES } } }),
      prisma.opsVendor.count({ where: { ...baseScopeWhere, type: { in: OTHER_TYPES } } }),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;
    const startIndex = total === 0 ? 0 : skip + 1;
    const endIndex = Math.min(skip + limitNum, total);

    const formattedVendors = vendors.map((v) => {
      if (v.guideRates && typeof v.guideRates === "string") {
        try {
          v.guideRates = JSON.parse(v.guideRates);
        } catch {}
      }
      return v;
    });

    res.json({
      success: true,
      data: formattedVendors,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages,
        startIndex,
        endIndex,
      },
      categoryCounts: {
        total,
        accommodation: accommodationCount,
        transport: transportCount,
        activities: activitiesCount,
        restaurants: restaurantsCount,
        guides: guidesCount,
        other: otherCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vendors/trips
 * Returns list of created trips for the trip selector
 */
exports.getTripVendorTrips = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const tenantWhere = !tenantId || tenantId === "default" ? {} : { OR: [{ tenantId }, { tenantId: "default" }] };
    const trips = await prisma.trip.findMany({
      where: tenantWhere,
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        duration: true,
        itinerary: true,
        _count: {
          select: { opsTripVendors: true },
        },
      },
      orderBy: { title: "asc" },
    });

    const formattedTrips = trips.map((t) => ({
      ...t,
      _count: {
        tripVendors: t._count?.opsTripVendors || 0,
      },
    }));

    res.json({
      success: true,
      data: formattedTrips,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/vendors/trips/:tripId/destinations
 * Returns actual itinerary destinations for a given trip
 */
exports.getTripDestinations = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, title: true, location: true, itinerary: true },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const destinationsSet = new Set();

    if (trip.location) {
      trip.location.split("/").forEach((loc) => {
        const clean = loc.trim();
        if (clean && !clean.toLowerCase().includes("no stay") && !clean.toLowerCase().includes("enroute")) {
          destinationsSet.add(clean);
        }
      });
    }

    if (Array.isArray(trip.itinerary)) {
      trip.itinerary.forEach((item) => {
        const stay = item.stay || item.location || "";
        if (stay && stay !== "—") {
          stay.split("/").forEach((loc) => {
            const clean = loc.trim();
            if (
              clean &&
              !clean.toLowerCase().includes("no stay") &&
              !clean.toLowerCase().includes("enroute") &&
              !clean.toLowerCase().includes("train") &&
              !clean.toLowerCase().includes("return") &&
              !clean.toLowerCase().includes("arrival") &&
              !clean.toLowerCase().includes("departure") &&
              !clean.toLowerCase().includes("visit ") &&
              !clean.toLowerCase().includes("trek")
            ) {
              destinationsSet.add(clean);
            }
          });
        }
      });
    }

    res.json({
      success: true,
      data: Array.from(destinationsSet),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/vendors/trips/:tripId/assign
 * Map a master vendor to a trip (creates OpsTripVendor mapping)
 */
exports.assignVendorToTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { vendorId, category, destinationId, notes, preferred } = req.body;
    const tenantId = req.user?.tenantId || "default";

    if (!vendorId) {
      return res.status(400).json({ success: false, message: "vendorId is required" });
    }

    // Verify vendor exists
    const vendor = await prisma.opsVendor.findUnique({ where: { id: vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    // Determine category if not provided
    const cat = category || vendor.type || "OTHER";

    // Upsert trip-vendor mapping (no duplication of master vendor)
    const mapping = await prisma.opsTripVendor.upsert({
      where: {
        tripId_vendorId_category: {
          tripId,
          vendorId,
          category: cat,
        },
      },
      update: {
        preferred: preferred !== undefined ? preferred : true,
        notes: notes || undefined,
        destinationId: destinationId || undefined,
      },
      create: {
        tripId,
        vendorId,
        category: cat,
        preferred: preferred !== undefined ? preferred : true,
        notes: notes || null,
        destinationId: destinationId || null,
      },
    });

    // Write Audit Log
    const auditLogger = require("../utils/auditLogger");
    await auditLogger.logAction({
      tenantId,
      actorUserId: req.user?.id || req.user?.userId || "system",
      action: "TRIP_VENDOR_ASSIGNED",
      entityType: "OpsTripVendor",
      entityId: mapping.id,
      afterData: {
        tripId,
        vendorId,
        vendorName: vendor.name,
        category: cat,
        destinationId,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Vendor ${vendor.name} assigned to trip successfully`,
      data: mapping,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/vendors/trips/:tripId/remove/:vendorId
 * Unmap a vendor from a trip (removes ONLY the OpsTripVendor mapping record!)
 */
exports.removeVendorFromTrip = async (req, res, next) => {
  try {
    const { tripId, vendorId } = req.params;
    const tenantId = req.user?.tenantId || "default";

    // Find mapping record
    const mappings = await prisma.opsTripVendor.findMany({
      where: { tripId, vendorId },
    });

    if (mappings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Vendor mapping for this trip not found",
      });
    }

    // Delete mapping records ONLY — master OpsVendor remains intact!
    await prisma.opsTripVendor.deleteMany({
      where: { tripId, vendorId },
    });

    // Write Audit Log
    const auditLogger = require("../utils/auditLogger");
    await auditLogger.logAction({
      tenantId,
      actorUserId: req.user?.id || req.user?.userId || "system",
      action: "TRIP_VENDOR_REMOVED",
      entityType: "OpsTripVendor",
      entityId: mappings[0].id,
      beforeData: {
        tripId,
        vendorId,
        removedMappingsCount: mappings.length,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Vendor removed from trip (master record preserved)",
    });
  } catch (error) {
    next(error);
  }
};

exports.getDirectoryVendor = async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: "vendorId is required" });
    }

    let vendor = null;
    try {
      vendor = await prisma.opsVendor.findUnique({
        where: { id: vendorId },
        include: {
          vendorRooms: true,
          seasonalRates: true,
          destinations: true,
          vendorContacts: true,
          contracts: true,
          tripVendors: {
            include: { trip: { select: { id: true, title: true } } },
          },
        },
      });
    } catch (relError) {
      console.warn("getDirectoryVendor relation query failed, using direct query fallback:", relError?.message);
      vendor = await prisma.opsVendor.findUnique({
        where: { id: vendorId },
      });
    }

    if (!vendor) {
      return res
        .status(404)
        .json({ success: false, message: "Vendor not found" });
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    console.error("getDirectoryVendor error:", error);
    next(error);
  }
};

exports.createDirectoryVendor = async (req, res, next) => {
  try {
    const {
      vendorCode,
      name,
      type,
      accommodationType,
      contactPerson,
      // Accept both field name variants from frontend form
      phone: phoneRaw,
      contactNumber,       // frontend form sends this
      alternatePhone: altPhoneRaw,
      alternateNumber,     // frontend form sends this
      whatsappNumber,
      email,
      gstin,
      panNumber,
      state,
      city,
      area,
      address,
      paymentTerms,
      creditDays,
      priority,
      rating,
      preferred,
      bankName,
      accountNumber,
      ifscCode,
      notes,
      contacts = [],
      tripId,
    } = req.body;

    const phone = phoneRaw || contactNumber || null;
    const alternatePhone = altPhoneRaw || alternateNumber || null;
    const tenantId = req.user?.tenantId || "default";

    if (!name) {
      return res.status(400).json({ success: false, message: "Vendor name is required" });
    }
    if (!type) {
      return res.status(400).json({ success: false, message: "Vendor type is required" });
    }

    const vendor = await prisma.opsVendor.create({
      data: {
        tenantId,
        vendorCode: vendorCode || `VND-${Date.now()}`,
        name,
        type: type || "HOTEL",
        accommodationType: accommodationType || undefined,
        contactPerson: contactPerson || undefined,
        phone: phone || undefined,
        alternatePhone: alternatePhone || undefined,
        whatsappNumber: whatsappNumber || undefined,
        email: email || undefined,
        gstin: gstin || undefined,
        panNumber: panNumber || undefined,
        state: state || undefined,
        city: city || undefined,
        area: area || undefined,
        address: address || undefined,
        paymentTerms: paymentTerms || undefined,
        creditDays: creditDays ? parseInt(creditDays) : undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
        ifscCode: ifscCode || undefined,
        notes: notes || undefined,
        isPreferred: preferred === true || preferred === "true",
        isActive: true,
        vendorContacts: contacts.length > 0 ? {
          create: contacts.map((c) => ({
            name: c.name || c.contactName,
            role: c.role || c.designation || "General Contact",
            phone: c.phone,
            whatsapp: c.whatsapp || c.phone,
            email: c.email || null,
            isPrimary: c.isPrimary || false,
          })),
        } : undefined,
      },
      include: { vendorContacts: true },
    });

    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    console.error("createDirectoryVendor error:", error);
    next(error);
  }
};

exports.updateDirectoryVendor = async (req, res, next) => {
  try {
    const {
      name,
      type,
      accommodationType,
      contactPerson,
      phone,
      alternatePhone,
      whatsappNumber,
      email,
      gstin,
      panNumber,
      state,
      city,
      area,
      address,
      fullAddress,
      paymentTerms,
      creditDays,
      bankName,
      accountNumber,
      ifscCode,
      starRating,
      checkInTime,
      checkOutTime,
      mealPlans,
      amenities,
      tags,
      notes,
      isActive,
      isPreferred,
    } = req.body;

    const vendor = await prisma.opsVendor.update({
      where: { id: req.params.vendorId },
      data: {
        name: name || undefined,
        type: type || undefined,
        accommodationType: accommodationType || undefined,
        contactPerson: contactPerson || undefined,
        phone: phone || undefined,
        alternatePhone: alternatePhone || undefined,
        whatsappNumber: whatsappNumber || undefined,
        email: email || undefined,
        gstin: gstin || undefined,
        panNumber: panNumber || undefined,
        state: state || undefined,
        city: city || undefined,
        area: area || undefined,
        address: address || fullAddress || undefined,
        fullAddress: fullAddress || address || undefined,
        paymentTerms: paymentTerms || undefined,
        creditDays: creditDays ? parseInt(creditDays) : undefined,
        bankName: bankName || undefined,
        accountNumber: accountNumber || undefined,
        ifscCode: ifscCode || undefined,
        starRating: starRating ? parseInt(starRating) : undefined,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        mealPlans: mealPlans || undefined,
        amenities: amenities || undefined,
        tags: tags
          ? typeof tags === "string"
            ? tags
            : JSON.stringify(tags)
          : undefined,
        guideRates: req.body.guideRates
          ? typeof req.body.guideRates === "string"
            ? req.body.guideRates
            : JSON.stringify(req.body.guideRates)
          : undefined,
        notes: notes || undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isPreferred: isPreferred !== undefined ? isPreferred : undefined,
      },
    });

    if (vendor.guideRates && typeof vendor.guideRates === "string") {
      try {
        vendor.guideRates = JSON.parse(vendor.guideRates);
      } catch {}
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

exports.deleteDirectoryVendor = async (req, res, next) => {
  try {
    const vendorId = req.params.vendorId;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: "vendorId is required" });
    }

    // Inactivate instead of hard delete to preserve historical pricing integrity
    const vendor = await prisma.opsVendor.update({
      where: { id: vendorId },
      data: { isActive: false },
    });
    res.json({
      success: true,
      message: "Vendor deactivated successfully",
      data: vendor,
    });
  } catch (error) {
    console.error("deleteDirectoryVendor error:", error);
    next(error);
  }
};

// ── 2. RATES CREATION ENPOINTS ──

exports.createDirectoryRoomRate = async (req, res, next) => {
  try {
    const { rates } = req.body;
    if (rates && Array.isArray(rates)) {
      await prisma.directoryVendorRoomRate.deleteMany({
        where: { vendorId: req.params.vendorId },
      });
      const created = [];
      for (const r of rates) {
        const rate = await prisma.directoryVendorRoomRate.create({
          data: {
            vendorId: req.params.vendorId,
            roomCategory: r.roomCategory || "Standard",
            sharingType: r.sharingType || "DOUBLE",
            rateBasis: r.rateBasis || "PER_ROOM_PER_NIGHT",
            amount: Number(r.amount || 0),
            availableRooms: r.availableRooms
              ? parseInt(r.availableRooms)
              : null,
            mealPlan: r.mealPlan || "EP",
            season: r.season || "ALL",
          },
        });
        created.push(rate);
      }
      return res.status(201).json({ success: true, data: created });
    }

    const {
      propertyName,
      roomCategory,
      sharingType,
      standardOccupancy,
      maximumOccupancy,
      mixedOccupancyAllowed,
      rateBasis,
      amount,
      extraAdultRate,
      extraChildRate,
      guideRoomRate,
      availableRooms,
      mealPlan,
      season,
      validFrom,
      validTo,
      taxIncluded,
      taxPercent,
      minimumRooms,
      cancellationPolicy,
      blackoutDates,
    } = req.body;

    const rate = await prisma.directoryVendorRoomRate.create({
      data: {
        vendorId: req.params.vendorId,
        propertyName,
        roomCategory,
        sharingType,
        standardOccupancy: parseInt(standardOccupancy || 2),
        maximumOccupancy: parseInt(maximumOccupancy || 3),
        mixedOccupancyAllowed: mixedOccupancyAllowed !== false,
        rateBasis,
        amount: Number(amount),
        extraAdultRate: extraAdultRate ? Number(extraAdultRate) : null,
        extraChildRate: extraChildRate ? Number(extraChildRate) : null,
        guideRoomRate: guideRoomRate ? Number(guideRoomRate) : null,
        availableRooms: availableRooms ? parseInt(availableRooms) : null,
        mealPlan,
        season,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        taxIncluded: taxIncluded === true,
        taxPercent: taxPercent ? Number(taxPercent) : 0,
        minimumRooms: minimumRooms ? parseInt(minimumRooms) : null,
        cancellationPolicy,
        blackoutDates: blackoutDates || null,
      },
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryTransportRate = async (req, res, next) => {
  try {
    const { rates } = req.body;
    if (rates && Array.isArray(rates)) {
      await prisma.directoryVendorTransportRate.deleteMany({
        where: { vendorId: req.params.vendorId },
      });
      const created = [];
      for (const r of rates) {
        const rate = await prisma.directoryVendorTransportRate.create({
          data: {
            vendorId: req.params.vendorId,
            routeName: r.routeName || "",
            vehicleType: r.vehicleType || "17 Seater",
            seatCapacity: parseInt(r.seatCapacity || 17),
            rateBasis: r.rateBasis || "PER_VEHICLE",
            amount: Number(r.amount || 0),
            extraCharge: Number(r.extraCharge || 0),
            season: r.season || "ALL",
          },
        });
        created.push(rate);
      }
      return res.status(201).json({ success: true, data: created });
    }

    const {
      routeName,
      pickupLocation,
      dropLocation,
      vehicleType,
      seatCapacity,
      rateBasis,
      amount,
      extraCharge,
      extraKmRate,
      extraHourRate,
      nightHaltRate,
      tollIncluded,
      parkingIncluded,
      fuelIncluded,
      driverAllowanceIncluded,
      stateTaxIncluded,
      backupVehicleAvailable,
      season,
      validFrom,
      validTo,
      cancellationPolicy,
    } = req.body;

    const rate = await prisma.directoryVendorTransportRate.create({
      data: {
        vendorId: req.params.vendorId,
        routeName,
        pickupLocation,
        dropLocation,
        vehicleType,
        seatCapacity: parseInt(seatCapacity || 17),
        rateBasis,
        amount: Number(amount),
        extraCharge: extraCharge ? Number(extraCharge) : 0,
        extraKmRate: extraKmRate ? Number(extraKmRate) : null,
        extraHourRate: extraHourRate ? Number(extraHourRate) : null,
        nightHaltRate: nightHaltRate ? Number(nightHaltRate) : null,
        tollIncluded: tollIncluded === true,
        parkingIncluded: parkingIncluded === true,
        fuelIncluded: fuelIncluded !== false,
        driverAllowanceIncluded: driverAllowanceIncluded === true,
        stateTaxIncluded: stateTaxIncluded === true,
        backupVehicleAvailable: backupVehicleAvailable !== false,
        season,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        cancellationPolicy,
      },
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryFoodRate = async (req, res, next) => {
  try {
    const {
      mealType,
      menuDescription,
      isVeg,
      ratePerPerson,
      minimumPax,
      maximumPax,
      packedMeal,
      guideMealRate,
      driverMealRate,
      taxIncluded,
      taxPercent,
      validFrom,
      validTo,
      cancellationPolicy,
    } = req.body;

    const rate = await prisma.directoryVendorFoodRate.create({
      data: {
        vendorId: req.params.vendorId,
        mealType,
        menuDescription,
        isVeg: isVeg !== false,
        ratePerPerson: Number(ratePerPerson),
        minimumPax: minimumPax ? parseInt(minimumPax) : null,
        maximumPax: maximumPax ? parseInt(maximumPax) : null,
        packedMeal: packedMeal === true,
        guideMealRate: guideMealRate ? Number(guideMealRate) : null,
        driverMealRate: driverMealRate ? Number(driverMealRate) : null,
        taxIncluded: taxIncluded === true,
        taxPercent: taxPercent ? Number(taxPercent) : 0,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        cancellationPolicy,
      },
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryGuideRate = async (req, res, next) => {
  try {
    const {
      serviceName,
      serviceLocation,
      languages,
      specialization,
      dailyRate,
      travelCharge,
      foodCharge,
      stayCharge,
      maximumGroupSize,
      emergencySupport,
      idVerified,
      policeVerified,
      validFrom,
      validTo,
    } = req.body;

    const rate = await prisma.directoryVendorGuideRate.create({
      data: {
        vendorId: req.params.vendorId,
        serviceName,
        serviceLocation,
        languages,
        specialization,
        dailyRate: Number(dailyRate),
        travelCharge: travelCharge ? Number(travelCharge) : 0,
        foodCharge: foodCharge ? Number(foodCharge) : 0,
        stayCharge: stayCharge ? Number(stayCharge) : 0,
        maximumGroupSize: maximumGroupSize ? parseInt(maximumGroupSize) : null,
        emergencySupport: emergencySupport === true,
        idVerified: idVerified === true,
        policeVerified: policeVerified === true,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
      },
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryMiscCharge = async (req, res, next) => {
  try {
    const { charges } = req.body;
    if (charges && Array.isArray(charges)) {
      await prisma.directoryVendorMiscCharge.deleteMany({
        where: { vendorId: req.params.vendorId },
      });
      const created = [];
      for (const c of charges) {
        const rate = await prisma.directoryVendorMiscCharge.create({
          data: {
            vendorId: req.params.vendorId,
            chargeName: c.chargeName || "",
            chargeType: c.chargeType || "",
            amount: Number(c.amount || 0),
            unit: c.unit || "FLAT",
          },
        });
        created.push(rate);
      }
      return res.status(201).json({ success: true, data: created });
    }

    const { chargeName, chargeType, amount, unit, validFrom, validTo, notes } =
      req.body;

    const rate = await prisma.directoryVendorMiscCharge.create({
      data: {
        vendorId: req.params.vendorId,
        chargeName,
        chargeType,
        amount: Number(amount),
        unit,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        notes,
      },
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// ── 3. LOCATION SEARCH & TRIP MAPPING ──

exports.searchVendorsByLocation = async (req, res, next) => {
  try {
    const { state, city, type } = req.query;
    const where = { isActive: true };
    if (state) where.state = state;
    if (city) where.city = city;
    if (type && type !== "ALL") {
      const parts = type
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        where.type = { in: parts };
      } else if (parts.length === 1) {
        where.type = parts[0];
      }
    }

    const vendors = await prisma.directoryVendor.findMany({
      where,
      include: {
        roomRates: true,
        transportRates: true,
        foodRates: true,
        guideRates: true,
        miscCharges: true,
      },
    });
    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

exports.getTripVendorOptions = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    // Find all vendors mapping to this trip location or category
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip)
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });

    const vendors = await prisma.directoryVendor.findMany({
      where: {
        isActive: true,
        OR: [
          { city: { contains: trip.destination || "", mode: "insensitive" } },
          { state: { contains: trip.state || "", mode: "insensitive" } },
        ],
      },
      include: {
        roomRates: true,
        transportRates: true,
        foodRates: true,
        guideRates: true,
        miscCharges: true,
      },
    });

    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

exports.saveTripVendorMappings = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { mappings = [] } = req.body;

    // Delete existing mapped vendors for this trip to overwrite
    await prisma.directoryTripVendorMapping.deleteMany({
      where: { tripId },
    });

    const createdMappings = [];
    for (const m of mappings) {
      const mapping = await prisma.directoryTripVendorMapping.create({
        data: {
          tripId,
          departureDate: m.departureDate ? new Date(m.departureDate) : null,
          dayNumber: m.dayNumber ? parseInt(m.dayNumber) : null,
          serviceDate: m.serviceDate ? new Date(m.serviceDate) : null,
          vendorId: m.vendorId,
          serviceType: m.serviceType,
          destination: m.destination || null,
          roomRateId: m.roomRateId || null,
          transportRateId: m.transportRateId || null,
          foodRateId: m.foodRateId || null,
          guideRateId: m.guideRateId || null,
          miscChargeId: m.miscChargeId || null,
          quantity: m.quantity ? parseInt(m.quantity) : 1,
          paxCount: m.paxCount ? parseInt(m.paxCount) : null,
          numberOfNights: m.numberOfNights ? parseInt(m.numberOfNights) : null,
          numberOfDays: m.numberOfDays ? parseInt(m.numberOfDays) : null,
          numberOfVehicles: m.numberOfVehicles
            ? parseInt(m.numberOfVehicles)
            : 1,
          isPrimary: m.isPrimary !== false,
          quotedAmount: m.quotedAmount ? Number(m.quotedAmount) : null,
          confirmedAmount: m.confirmedAmount ? Number(m.confirmedAmount) : null,
          confirmationNo: m.confirmationNo || null,
          status: m.status || "PLANNED",
          instructions: m.instructions || null,
        },
      });
      createdMappings.push(mapping);
    }

    res.status(201).json({ success: true, data: createdMappings });
  } catch (error) {
    next(error);
  }
};

// ── 4. COSTING ENGINE EXECUTION & SNAPSHOTTING ──

exports.calculateVendorCosting = async (req, res, next) => {
  try {
    const {
      paxCount,
      accommodations = [],
      transports = [],
      foodItems = [],
      guideItems = [],
      miscCharges = [],
      contingencyPercent = 0,
    } = req.body;

    const calculation = pricingEngine.calculateTripCost({
      paxCount: parseInt(paxCount),
      accommodations,
      transports,
      foodItems,
      guideItems,
      miscCharges,
      contingencyPercent: Number(contingencyPercent),
    });

    res.json({ success: true, data: calculation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createCostingSnapshot = async (req, res, next) => {
  try {
    const {
      tripId,
      departureDate,
      paxCount,
      calculationData,
      vendorRatesData,
    } = req.body;

    const snapshot = await prisma.directoryTripCostSnapshot.create({
      data: {
        tripId,
        departureDate: departureDate ? new Date(departureDate) : null,
        paxCount: parseInt(paxCount),
        vendorCost: Number(calculationData.finalVendorCost || 0),
        costPerPerson: Number(calculationData.costPerPerson || 0),
        calculationData: calculationData || {},
        vendorRatesData: vendorRatesData || {},
        createdById: req.user?.id || "admin",
      },
    });

    res.status(201).json({ success: true, data: snapshot });
  } catch (error) {
    next(error);
  }
};

// ── 5. VENDOR PAYMENTS CRUD ──

exports.getVendorPayments = async (req, res, next) => {
  try {
    const { vendorId, paymentStatus } = req.query;
    const where = {};
    if (vendorId) where.vendorId = vendorId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const payments = await prisma.directoryVendorPayment.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

exports.createVendorPayment = async (req, res, next) => {
  try {
    const {
      vendorId,
      tripId,
      departureDate,
      invoiceAmount,
      advanceAmount = 0,
      paidAmount = 0,
      dueDate,
      paymentDate,
      paymentMode,
      transactionRef,
      remarks,
    } = req.body;

    const parsedInvoice = Number(invoiceAmount);
    const parsedAdvance = Number(advanceAmount);
    const parsedPaid = Number(paidAmount);
    const totalPaid = parsedAdvance + parsedPaid;
    const remainingBalance = parsedInvoice - totalPaid;

    let paymentStatus = "PENDING";
    if (totalPaid >= parsedInvoice) {
      paymentStatus = "PAID";
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIAL";
    }

    const payment = await prisma.directoryVendorPayment.create({
      data: {
        vendorId,
        tripId: tripId || null,
        departureDate: departureDate ? new Date(departureDate) : null,
        invoiceAmount: parsedInvoice,
        advanceAmount: parsedAdvance,
        paidAmount: parsedPaid,
        remainingBalance: remainingBalance,
        paymentStatus,
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMode,
        transactionRef,
        approvedBy: req.user?.id || "admin",
        remarks,
      },
      include: { vendor: true },
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

exports.updateVendorPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const {
      advanceAmount,
      paidAmount,
      paymentMode,
      transactionRef,
      paymentStatus,
      remarks,
    } = req.body;

    const currentPayment = await prisma.directoryVendorPayment.findUnique({
      where: { id: paymentId },
    });
    if (!currentPayment)
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found" });

    const newAdvance =
      advanceAmount !== undefined
        ? Number(advanceAmount)
        : Number(currentPayment.advanceAmount);
    const newPaid =
      paidAmount !== undefined
        ? Number(paidAmount)
        : Number(currentPayment.paidAmount);
    const invoice = Number(currentPayment.invoiceAmount);
    const totalPaid = newAdvance + newPaid;
    const remaining = invoice - totalPaid;

    let calculatedStatus = paymentStatus || "PENDING";
    if (!paymentStatus) {
      if (totalPaid >= invoice) {
        calculatedStatus = "PAID";
      } else if (totalPaid > 0) {
        calculatedStatus = "PARTIAL";
      }
    }

    const payment = await prisma.directoryVendorPayment.update({
      where: { id: paymentId },
      data: {
        advanceAmount: newAdvance,
        paidAmount: newPaid,
        remainingBalance: remaining,
        paymentStatus: calculatedStatus,
        paymentMode,
        transactionRef,
        remarks,
      },
      include: { vendor: true },
    });

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};
