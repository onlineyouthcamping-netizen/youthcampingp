const { prisma } = require("../lib/prisma");

const setPublicCache = (res, seconds) => {
  res.set(
    "Cache-Control",
    `public, max-age=${seconds}, stale-while-revalidate=${seconds}`,
  );
};

const toPublicDates = (availableDates) => {
  let dates = availableDates;
  if (typeof dates === "string") {
    try {
      dates = JSON.parse(dates);
    } catch (_error) {
      return [];
    }
  }

  if (!Array.isArray(dates)) return [];

  return dates
    .map((entry) => {
      if (typeof entry === "string") return { date: entry };
      if (entry && typeof entry === "object" && entry.date)
        return { date: entry.date };
      return null;
    })
    .filter(Boolean);
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

const toPublicVariantSummary = (variants) => parseJsonArray(variants);

const toPublicRouteSummary = (route) =>
  parseJsonArray(route)
    .slice(0, 2)
    .map((stop) => {
      if (typeof stop === "string") return stop;
      if (stop && typeof stop === "object" && stop.label)
        return { label: stop.label };
      return null;
    })
    .filter(Boolean);

/**
 * @desc    Get all trips (Scoped by tenantId)
 * @route   GET /api/trips
 * @access  Public
 */
exports.getTrips = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const where = {
      tenantId:
        tenantId === "default" ? "default" : { in: [tenantId, "default"] },
    };

    console.log(
      `🔍 [Trips] Fetching trips for tenant: ${tenantId}, status: ${req.query.status || "default"}`,
    );

    if (req.query.status && req.query.status !== "all") {
      where.status = req.query.status;
    }

    const select =
      req.query.compact === "true"
        ? {
            id: true,
            title: true,
            shortName: true,
            status: true,
            availableDates: true,
          }
        : undefined;

    const trips = await prisma.trip.findMany({
      where,
      select,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    console.log(`✅ [Trips] Found ${trips.length} trips`);

    res.json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    console.error("🔥 [Trips Fetch Error]:", error);
    next(error);
  }
};

/**
 * @desc    Get lightweight compact trips for dropdown selectors
 * @route   GET /api/trips/compact
 * @access  Private/Admin
 */
exports.getCompactTrips = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const where = {
      tenantId:
        tenantId === "default" ? "default" : { in: [tenantId, "default"] },
    };

    if (req.query.status && req.query.status !== "all") {
      where.status = req.query.status;
    }

    const trips = await prisma.trip.findMany({
      where,
      select: {
        id: true,
        title: true,
        shortName: true,
        slug: true,
        price: true,
        status: true,
        isActive: true,
        departureCity: true,
        travelOptions: true,
        roomOptions: true,
        pickupCities: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    res.json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    console.error("🔥 [Compact Trips Fetch Error]:", error);
    next(error);
  }
};

/**
 * Lightweight published trip cards for the public website.
 * Existing /api/trips responses remain unchanged for backwards compatibility.
 * Capacity and booked-count values are intentionally excluded from this cacheable response.
 */
exports.getPublicTripCards = async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const take = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 100))
      : undefined;
    const trips = await prisma.trip.findMany({
      where: { tenantId: "default", status: "published" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        heroImage: true,
        images: true,
        price: true,
        location: true,
        duration: true,
        category: true,
        status: true,
        availableDates: true,
        variants: true,
        route: true,
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take,
    });

    const data = trips.map((trip) => ({
      ...trip,
      availableDates: toPublicDates(trip.availableDates),
      variants: toPublicVariantSummary(trip.variants),
      route: toPublicRouteSummary(trip.route),
    }));

    setPublicCache(res, 180);
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Full published trip content for one public detail page. Cached display data
 * deliberately excludes capacity and booked-count values from departure dates.
 * The existing /api/trips/slug/:slug contract remains unchanged.
 */
exports.getPublicTripDetail = async (req, res, next) => {
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        slug: req.params.slug,
        tenantId: "default",
        status: "published",
      },
      select: {
        id: true,
        title: true,
        shortName: true,
        slug: true,
        location: true,
        price: true,
        duration: true,
        description: true,
        category: true,
        status: true,
        heroImage: true,
        images: true,
        itinerary: true,
        availableDates: true,
        variants: true,
        travelOptions: true,
        roomOptions: true,
        highlights: true,
        inclusions: true,
        exclusions: true,
        faqs: true,
        addons: true,
        maxGroupSize: true,
        difficulty: true,
        departureCity: true,
        pickupCities: true,
        ageLimit: true,
        bookingUrl: true,
        attractions: true,
        activities: true,
        accommodations: true,
        popupDetails: true,
        route: true,
        ageGroup: true,
        maxAltitude: true,
        tripType: true,
        startEnd: true,
        pickupMode: true,
        stickyCardPrice: true,
        stickyCardLabel: true,
        gstPercentage: true,
        reels: true,
        departurePriceOverrides: {
          where: { isActive: true },
        },
        tripReviews: true,
      },
    });

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    const reviewWhereOr = [{ tripId: trip.id }];
    if (trip.title) reviewWhereOr.push({ tripName: trip.title });
    if (trip.shortName) reviewWhereOr.push({ tripName: trip.shortName });

    const reviews = await prisma.review.findMany({
      where: {
        tenantId: "default",
        isActive: true,
        OR: reviewWhereOr,
      },
      select: {
        id: true,
        userName: true,
        userHandle: true,
        instagram: true,
        city: true,
        tripName: true,
        tripType: true,
        userImage: true,
        comment: true,
        rating: true,
        isFeatured: true,
        photos: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const data = {
      ...trip,
      availableDates: toPublicDates(trip.availableDates),
      reviews,
    };

    setPublicCache(res, 60);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single trip by ID or Slug
 * @route   GET /api/trips/:id
 * @access  Public
 */
exports.getTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || "default";

    const includeRelations = {
      itineraries: {
        include: {
          days: true,
        },
      },
      tripDocuments: true,
      tripSops: {
        include: {
          items: true,
        },
      },
      tripGalleries: true,
      tripNotes: true,
      departurePriceOverrides: {
        where: { isActive: true },
      },
    };

    let trip = await prisma.trip.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { title: id }, { shortName: id }],
        tenantId,
      },
      include: includeRelations,
    });

    // Fallback 1: Search without tenant restriction (handles tenantId mismatch)
    if (!trip) {
      trip = await prisma.trip.findFirst({
        where: {
          OR: [
            { id },
            { slug: id },
            { title: id },
            { shortName: id },
            { title: { contains: id, mode: "insensitive" } },
            { slug: { contains: id, mode: "insensitive" } },
          ],
        },
        include: includeRelations,
      });
    }
    if (!trip && id.includes("-")) {
      const parts = id.split("-");
      const prefix = parts[0].toUpperCase();
      trip = await prisma.trip.findFirst({
        where: {
          tenantId,
          OR: [
            { id: { startsWith: prefix, mode: "insensitive" } },
            { id: { startsWith: prefix + "-", mode: "insensitive" } },
            { slug: { startsWith: prefix.toLowerCase(), mode: "insensitive" } },
            { shortName: { startsWith: prefix, mode: "insensitive" } },
          ],
          tenantId,
        },
        include: includeRelations,
      });
    }

    if (!trip) {
      trip = await prisma.trip.findFirst({
        where: { tenantId, isActive: true },
        include: includeRelations,
      });
    }

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    // Build conditional query to fetch reviews dynamically linked to this trip
    const reviewWhereOr = [{ tripId: trip.id }];
    if (trip.title) {
      reviewWhereOr.push({ tripName: trip.title });
    }
    if (trip.shortName) {
      reviewWhereOr.push({ tripName: trip.shortName });
    }

    const reviews = await prisma.review.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: reviewWhereOr,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const tripWithReviews = {
      ...trip,
      reviews: reviews || [],
    };

    res.json({ success: true, data: tripWithReviews });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new trip
 * @route   POST /api/trips
 * @access  Private/Admin
 */
/**
 * @desc    Create new trip
 * @route   POST /api/trips
 * @access  Private/Admin
 */
const sanitizeTripData = (data) => {
  if (!data) return {};

  // Whitelist of valid scalar fields on the Trip model in DB
  const validFields = new Set([
    "title",
    "shortName",
    "slug",
    "location",
    "price",
    "duration",
    "description",
    "category",
    "isActive",
    "status",
    "heroImage",
    "images",
    "itinerary",
    "availableDates",
    "variants",
    "travelOptions",
    "roomOptions",
    "seo",
    "highlights",
    "inclusions",
    "exclusions",
    "faqs",
    "addons",
    "maxGroupSize",
    "difficulty",
    "departureCity",
    "pickupCities",
    "ageLimit",
    "bookingUrl",
    "customSections",
    "attractions",
    "activities",
    "accommodations",
    "popupDetails",
    "route",
    "ageGroup",
    "maxAltitude",
    "tripType",
    "startEnd",
    "pickupMode",
    "stickyCardPrice",
    "stickyCardLabel",
    "gstPercentage",
    "reels",
    "tripReviews",
    "itineraryVersions",
    "order",
  ]);

  const sanitized = {};
  for (const key in data) {
    if (validFields.has(key) && data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
};

exports.createTrip = async (req, res, next) => {
  try {
    const tripData = sanitizeTripData(req.body);
    const tenantId = req.user?.tenantId || "default";

    if (req.body.reviews) {
      tripData.tripReviews = req.body.reviews;
    }

    // Support manual ID (Trip Code) with duplicate check
    const customId = (
      req.body.id ||
      req.body.tripCode ||
      req.body.shortName ||
      ""
    ).trim();
    if (customId) {
      const formattedId = customId.toUpperCase().replace(/\s+/g, "-");
      const existingTrip = await prisma.trip.findFirst({
        where: { id: formattedId, tenantId },
      });
      if (existingTrip) {
        tripData.id = `${formattedId}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
      } else {
        tripData.id = formattedId;
      }
    } else {
      delete tripData.id;
    }

    // Ensure required schema field 'slug' is always present and unique
    if (!tripData.slug && tripData.title) {
      const baseSlug = tripData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
      tripData.slug = `${baseSlug}-${uniqueSuffix}`;
    } else if (!tripData.slug) {
      tripData.slug = `trip-${Date.now()}`;
    }

    // Ensure required schema field 'description' is present
    if (!tripData.description) {
      tripData.description =
        tripData.overview ||
        `${tripData.title || "Trip"} expedition in ${tripData.location || "destination"}.`;
    }

    // Default required numeric/string fields
    if (!tripData.duration) tripData.duration = "5 Days / 4 Nights";

    const trip = await prisma.trip.create({
      data: {
        ...tripData,
        tenantId,
        price: Number(tripData.price) || 0,
        stickyCardPrice: Number(tripData.stickyCardPrice) || null,
      },
    });

    if (
      req.body.departurePriceOverrides &&
      Array.isArray(req.body.departurePriceOverrides)
    ) {
      const activeOverrides = req.body.departurePriceOverrides.filter(
        (o) => o.departureDate && o.overrideType && o.amount !== undefined,
      );
      if (activeOverrides.length > 0) {
        await prisma.tripDeparturePriceOverride.createMany({
          data: activeOverrides.map((o) => ({
            tripId: trip.id,
            departureDate: o.departureDate,
            overrideType: o.overrideType,
            amount: Number(o.amount) || 0,
            reason: o.reason || "",
            isActive: o.isActive !== undefined ? o.isActive : true,
            createdBy: req.user?.id,
          })),
        });
      }
    }

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error("Error creating trip:", error);
    next(error);
  }
};

/**
 * @desc    Update trip
 * @route   PUT /api/trips/:id
 * @access  Private/Admin
 */
exports.updateTrip = async (req, res, next) => {
  try {
    const { id: oldId } = req.params;
    const tenantId = req.user.tenantId;
    const updateData = sanitizeTripData(req.body);

    if (req.body.reviews) {
      updateData.tripReviews = req.body.reviews;
    }

    const newId = (
      req.body.id ||
      req.body.tripCode ||
      req.body.shortName ||
      oldId
    ).toUpperCase();
    const tripName = updateData.title || req.body.tripName;

    delete updateData.id;
    delete updateData.tenantId;
    delete updateData.tripCode;
    delete updateData.departurePriceOverrides; // Handled manually below

    if (updateData.price !== undefined)
      updateData.price = Number(updateData.price) || 0;
    if (updateData.stickyCardPrice !== undefined)
      updateData.stickyCardPrice = Number(updateData.stickyCardPrice) || null;

    if (newId !== oldId) {
      // Wrap ID migration in a transaction to prevent race conditions
      await prisma.$transaction(async (tx) => {
        // 1. Check if new ID already exists (inside transaction for atomicity)
        const exists = await tx.trip.findFirst({
          where: { id: newId, tenantId },
        });
        if (exists)
          throw Object.assign(new Error(`Trip Code ${newId} already exists`), {
            statusCode: 400,
          });

        // 2. Update the ID using Raw SQL (triggers onUpdate: Cascade in DB)
        await tx.$executeRaw`UPDATE "Trip" SET id = ${newId} WHERE id = ${oldId} AND "tenantId" = ${tenantId}`;

        // 3. Manually update non-relational records
        await tx.inquiry.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripId: newId },
        });
        await tx.review.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripId: newId },
        });
      });

      console.log(`✅ Migrated Trip Code from ${oldId} to ${newId}`);
    }

    // Fetch current trip to perform version history logic
    const currentTrip = await prisma.trip.findUnique({
      where: { id: newId },
    });

    if (currentTrip && updateData.itinerary !== undefined) {
      const oldItinStr = JSON.stringify(currentTrip.itinerary || []);
      const newItinStr = JSON.stringify(updateData.itinerary || []);
      if (oldItinStr !== newItinStr) {
        let versions = [];
        if (currentTrip.itineraryVersions) {
          versions =
            typeof currentTrip.itineraryVersions === "string"
              ? JSON.parse(currentTrip.itineraryVersions)
              : currentTrip.itineraryVersions;
          if (!Array.isArray(versions)) {
            versions = [];
          }
        }
        const newVersionNum = versions.length + 1;
        const versionEntry = {
          version: newVersionNum,
          updatedAt: new Date(),
          updatedBy: req.user ? req.user.name || req.user.email : "System",
          itinerary: currentTrip.itinerary || [],
        };
        versions.push(versionEntry);
        updateData.itineraryVersions = versions;
        console.log(
          `Saved itinerary version ${newVersionNum} for Trip ${newId}`,
        );
      }
    }

    // 4. Update the rest of the data (id is unique PK, no tenantId needed in where)
    const trip = await prisma.trip.update({
      where: { id: newId },
      data: updateData,
    });

    // 5. Sync Departure Price Overrides
    if (
      req.body.departurePriceOverrides &&
      Array.isArray(req.body.departurePriceOverrides)
    ) {
      await prisma.tripDeparturePriceOverride.deleteMany({
        where: { tripId: newId },
      });
      const activeOverrides = req.body.departurePriceOverrides.filter(
        (o) => o.departureDate && o.overrideType && o.amount !== undefined,
      );
      if (activeOverrides.length > 0) {
        await prisma.tripDeparturePriceOverride.createMany({
          data: activeOverrides.map((o) => ({
            tripId: newId,
            departureDate: o.departureDate,
            overrideType: o.overrideType,
            amount: Number(o.amount) || 0,
            reason: o.reason || "",
            isActive: o.isActive !== undefined ? o.isActive : true,
            createdBy: req.user?.id,
          })),
        });
      }
    }

    if (tripName) {
      await prisma.booking.updateMany({
        where: { tripId: newId, tenantId },
        data: { tripName },
      });
      await prisma.inquiry.updateMany({
        where: { tripId: newId, tenantId },
        data: { tripTitle: tripName },
      });
    }

    res.json({ success: true, message: "Trip updated successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete trip
 * @route   DELETE /api/trips/:id
 * @access  Private/Admin
 */
exports.deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || "default";

    // Check if trip exists
    const trip = await prisma.trip.findFirst({
      where: { id, tenantId },
    });

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    // Check for active bookings tied to this trip
    const activeBookingCount = await prisma.booking.count({
      where: { tripId: id, status: { notIn: ["cancelled", "rejected"] } },
    });

    if (activeBookingCount > 0) {
      // Soft-archive trip status if active bookings exist
      await prisma.trip.update({
        where: { id },
        data: { status: "archived" },
      });
      return res.json({
        success: true,
        message: `Trip has ${activeBookingCount} active bookings and has been archived.`,
      });
    }

    // Clean up related operations and auxiliary models that restrict deletion
    const modelsToClean = [
      "inquiry",
      "review",
      "booking",
      "opsSeatConfig",
      "opsItinerary",
      "opsAttraction",
      "opsPackingItem",
      "opsInclusionExclusion",
      "opsFaq",
      "opsTripChecklist",
      "opsIncidentLog",
      "opsHotelBooking",
      "opsTransportFleet",
      "opsGuidePayment",
      "opsMiscExpense",
      "opsTripExpense",
      "opsTripLeader",
      "tripAssignment",
      "tripVendor",
      "opsRoomInventory",
      "opsAllocationRun",
      "opsVehicleAllocation",
      "opsRoomAllocation",
      "opsDayItinerary",
      "opsActivity",
      "opsVendorPayment",
      "opsDocument",
      "opsMessage",
      "tripDocument",
    ];

    for (const modelName of modelsToClean) {
      if (
        prisma[modelName] &&
        typeof prisma[modelName].deleteMany === "function"
      ) {
        try {
          await prisma[modelName].deleteMany({ where: { tripId: id } });
        } catch (e) {
          // ignore model delete error
        }
      }
    }

    // Delete the trip or update status if hard delete fails
    try {
      await prisma.trip.delete({ where: { id } });
    } catch (dbError) {
      await prisma.trip.update({
        where: { id },
        data: { status: "archived" },
      });
    }

    res.json({ success: true, message: "Trip removed successfully" });
  } catch (error) {
    console.error("deleteTrip error:", error);
    res.status(500).json({ success: false, message: "Failed to delete trip" });
  }
};
/**
 * @desc    Get trip by slug (Public)
 * @route   GET /api/trips/slug/:slug
 */
exports.getTripBySlug = async (req, res, next) => {
  req.params.id = req.params.slug;
  return exports.getTrip(req, res, next);
};

/**
 * @desc    Public trip lookup by id, slug, shortName, or title (no auth required)
 * @route   GET /api/trips/public/lookup/:identifier
 * @access  Public
 */
exports.getPublicTripLookup = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const tenantId = "default";

    let trip = await prisma.trip.findFirst({
      where: {
        OR: [
          { id: identifier },
          { slug: identifier },
          { shortName: identifier },
          { title: identifier },
        ],
        tenantId,
      },
      select: {
        id: true,
        title: true,
        shortName: true,
        slug: true,
        location: true,
        price: true,
        duration: true,
        description: true,
        category: true,
        status: true,
        heroImage: true,
        images: true,
        itinerary: true,
        availableDates: true,
        variants: true,
        travelOptions: true,
        roomOptions: true,
        highlights: true,
        inclusions: true,
        exclusions: true,
        faqs: true,
        addons: true,
        maxGroupSize: true,
        difficulty: true,
        departureCity: true,
        pickupCities: true,
        ageLimit: true,
        attractions: true,
        activities: true,
        accommodations: true,
        route: true,
        ageGroup: true,
        gstPercentage: true,
        departurePriceOverrides: {
          where: { isActive: true },
        },
      },
    });

    if (!trip) {
      trip = await prisma.trip.findFirst({
        where: {
          OR: [
            { title: { contains: identifier, mode: "insensitive" } },
            { slug: { contains: identifier, mode: "insensitive" } },
          ],
          tenantId,
        },
        select: {
          id: true,
          title: true,
          shortName: true,
          slug: true,
          location: true,
          price: true,
          duration: true,
          description: true,
          category: true,
          status: true,
          heroImage: true,
          images: true,
          itinerary: true,
          availableDates: true,
          variants: true,
          travelOptions: true,
          roomOptions: true,
          highlights: true,
          inclusions: true,
          exclusions: true,
          faqs: true,
          addons: true,
          maxGroupSize: true,
          difficulty: true,
          departureCity: true,
          pickupCities: true,
          ageLimit: true,
          attractions: true,
          activities: true,
          accommodations: true,
          route: true,
          ageGroup: true,
          gstPercentage: true,
          departurePriceOverrides: {
            where: { isActive: true },
          },
        },
      });
    }

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    // Fetch reviews
    const reviewWhereOr = [{ tripId: trip.id }];
    if (trip.title) reviewWhereOr.push({ tripName: trip.title });
    if (trip.shortName) reviewWhereOr.push({ tripName: trip.shortName });

    const reviews = await prisma.review.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: reviewWhereOr,
      },
      select: {
        id: true,
        userName: true,
        comment: true,
        rating: true,
        tripName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    setPublicCache(res, 60);
    res.json({
      success: true,
      data: {
        ...trip,
        availableDates: toPublicDates(trip.availableDates),
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Shuffle trips order
 * @route   POST /api/trips/shuffle
 * @access  Private/Admin
 */
exports.shuffleTrips = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const trips = await prisma.trip.findMany({ where: { tenantId } });

    // Generate random order for each trip
    const updates = trips.map((trip, index) => {
      return prisma.trip.update({
        where: { id: trip.id },
        data: { order: Math.floor(Math.random() * 1000000) },
      });
    });

    await prisma.$transaction(updates);

    res.json({ success: true, message: "Trips shuffled successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk update trips order
 * @route   POST /api/trips/bulk-order
 * @access  Private/Admin
 */
exports.bulkUpdateTripOrder = async (req, res, next) => {
  try {
    const { orderMap } = req.body;
    if (!orderMap)
      return res
        .status(400)
        .json({ success: false, message: "orderMap is required" });

    const updates = Object.entries(orderMap).map(([id, order]) => {
      return prisma.trip.update({
        where: { id },
        data: { order: Number(order) },
      });
    });

    await prisma.$transaction(updates);

    res.json({ success: true, message: "Trips order updated successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Seed Live Data Stub
 */
exports.seedLiveData = async (req, res) => {
  res.json({
    success: true,
    message: "Seeding logic disabled in production/dev",
  });
};

exports.getTripDepartures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || "default";

    // Find trip by ID, slug, title, shortName, or code prefix
    let tripGlobal = await prisma.trip.findFirst({
      where: {
        OR: [{ id }, { slug: id }, { title: id }, { shortName: id }],
      },
    });

    if (!tripGlobal) {
      tripGlobal = await prisma.trip.findFirst({
        where: {
          OR: [
            { title: { contains: id, mode: "insensitive" } },
            { slug: { contains: id, mode: "insensitive" } },
            { shortName: { contains: id, mode: "insensitive" } },
          ],
        },
      });
    }

    if (!tripGlobal && id.includes("-")) {
      const prefix = id.split("-")[0].toUpperCase();
      tripGlobal = await prisma.trip.findFirst({
        where: {
          OR: [
            { id: { startsWith: prefix, mode: "insensitive" } },
            { slug: { startsWith: prefix.toLowerCase(), mode: "insensitive" } },
            { shortName: { startsWith: prefix, mode: "insensitive" } },
          ],
        },
      });
    }

    if (!tripGlobal) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    if (tripGlobal.tenantId !== tenantId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Access denied: unauthorized tenant",
        });
    }

    let dates = tripGlobal.availableDates;
    if (typeof dates === "string") {
      try {
        dates = JSON.parse(dates);
      } catch (_) {
        dates = [];
      }
    }
    if (!Array.isArray(dates)) dates = [];

    const dateStrings = dates
      .map((d) => {
        if (typeof d === "string") return d;
        if (d && typeof d === "object" && d.date) return d.date;
        return null;
      })
      .filter(Boolean);

    res.json({ success: true, data: dateStrings });
  } catch (error) {
    next(error);
  }
};
