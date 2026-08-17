const { prisma } = require("../lib/prisma");
const bookingCountCache = new Map();
const { syncBookingToSheets } = require("../utils/googleSheetsSync");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { generateBookingId } = require("../utils/bookingIdGenerator");
const { logAction } = require("../utils/auditLogger");
const { logBookingActivity } = require("../utils/bookingActivityLogger");
const { verifySignedPayload } = require("./bookingLinkController");
const cache = require("../lib/cache");
const { hasPermission } = require("../config/permissions");
const { PAYMENT_STATUS, normalizePaymentStatus } = require("../utils/paymentStatus");
const { validateBookingStatusTransition, BOOKING_STATUS } = require("../utils/bookingStatus");
const { resolveTenantId } = require("../utils/tenantContext");
const {
  findConfirmedRoomFields,
  mergePassengerPreferences,
} = require("../utils/roomAllocationAuthority");

// Helper to safely parse dates and avoid crashes with "Invalid Date"
const safeParseDate = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
};

// Safe age validation — ensures age is an integer between 1 and 120
function sanitizeAge(val) {
  if (val === undefined || val === null || val === "" || val === "N/A") return null;
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 1 || num > 120) return null;
  return num;
}

// Safe monetary amount validation — rejects NaN, Infinity, negative, and non-finite values
function validateAmount(value, label = "amount") {
  if (value === undefined || value === null) {
    const err = new Error(`${label} is required`);
    err.statusCode = 400;
    throw err;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    const err = new Error(
      `Invalid ${label}: must be a non-negative finite number`,
    );
    err.statusCode = 400;
    throw err;
  }
  return num;
}

const sha256 = (value) =>
  crypto.createHash("sha256").update(String(value)).digest("hex");

const getIpHash = (req) => {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.ip ||
    "";
  return ip ? sha256(ip) : null;
};

const parseJsonArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

const formatDateStr = (dateVal) => {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

async function verifyAndCalculateBooking(trip, body, isAdmin, tx = prisma) {
  // 1. Verify trip status (for public users)
  if (!isAdmin) {
    if (trip.status !== "published" || trip.isActive === false) {
      throw new Error("This trip is currently unavailable for booking");
    }
  }

  // 2. Verify departureDate
  if (!body.departureDate && !body.travelDate) {
    throw new Error("Departure date is required");
  }
  const rawDate = body.departureDate || body.travelDate;
  const targetDateStr = formatDateStr(rawDate);
  if (!targetDateStr) {
    throw new Error("Invalid departure date format");
  }

  // Check if date is in the past
  const depDate = new Date(targetDateStr);
  if (!isAdmin) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (depDate < today) {
      throw new Error("Departure date cannot be in the past");
    }
  }

  // Check if date exists in availableDates
  const availableDates = parseJsonArray(trip.availableDates);
  let dateEntry = null;
  for (const entry of availableDates) {
    const entryDateStr = typeof entry === "string" ? entry : entry?.date;
    if (formatDateStr(entryDateStr) === targetDateStr) {
      dateEntry = entry;
      break;
    }
  }

  if (!dateEntry) {
    throw new Error("Selected departure date is not available for this trip");
  }

  // Check capacity rules if available
  const numberOfTravelers =
    body.passengers && Array.isArray(body.passengers)
      ? body.passengers.length
      : 1;
  if (
    dateEntry &&
    typeof dateEntry === "object" &&
    dateEntry.capacity !== undefined
  ) {
    const capacity = Number(dateEntry.capacity) || 0;

    // Count existing bookings for this departure date
    const gteDate = new Date(depDate);
    gteDate.setHours(0, 0, 0, 0);
    const lteDate = new Date(depDate);
    lteDate.setHours(23, 59, 59, 999);

    const bookedCount = await tx.booking.aggregate({
      where: {
        tripId: trip.id,
        departureDate: {
          gte: gteDate,
          lte: lteDate,
        },
        status: { notIn: ["cancelled", "rejected"] },
      },
      _sum: {
        numberOfTravelers: true,
      },
    });

    const totalBooked = bookedCount._sum.numberOfTravelers || 0;
    if (totalBooked + numberOfTravelers > capacity) {
      throw new Error(
        `This departure is fully booked. Only ${Math.max(0, capacity - totalBooked)} spots remaining.`,
      );
    }
  }

  // 3. Resolve joining city / variant flexibly
  const rawPickupCity = String(body.pickupCity || "Delhi").trim();
  const normalizedTarget = rawPickupCity.toLowerCase();
  let selectedCityObj = null;

  // Search variants
  const variants = parseJsonArray(trip.variants);
  const vMatch = variants.find((v) => {
    const loc = String(
      v.location || v.cityName || v.name || v.variantName || v.city || "",
    )
      .trim()
      .toLowerCase();
    return (
      loc === normalizedTarget ||
      (loc.length > 0 &&
        (loc.includes(normalizedTarget) || normalizedTarget.includes(loc)))
    );
  });

  if (vMatch) {
    const locName =
      vMatch.location ||
      vMatch.cityName ||
      vMatch.name ||
      vMatch.variantName ||
      rawPickupCity;
    const variantPrice = Math.round(
      Number(vMatch.discountedPrice) || Number(vMatch.originalPrice) || 0,
    );
    selectedCityObj = {
      cityName: locName,
      price:
        variantPrice > 0 ? variantPrice : Math.round(Number(trip.price) || 0),
      skipDays: Number(vMatch.skipDays) || 0,
      excludeTravel: vMatch.excludeTravel === true,
    };
  }

  // Search pickupCities
  if (!selectedCityObj) {
    const pickupCities = parseJsonArray(trip.pickupCities);
    const cMatch = pickupCities.find((c) => {
      const loc = String(c.cityName || c.location || c.name || "")
        .trim()
        .toLowerCase();
      return (
        loc === normalizedTarget ||
        (loc.length > 0 &&
          (loc.includes(normalizedTarget) || normalizedTarget.includes(loc)))
      );
    });

    if (cMatch) {
      const deduction = Math.round(Number(cMatch.deductionAmount) || 0);
      selectedCityObj = {
        cityName: cMatch.cityName || cMatch.location || rawPickupCity,
        price: Math.round(Math.max(0, (Number(trip.price) || 0) - deduction)),
        skipDays: Number(cMatch.skipDays) || 0,
        excludeTravel: false,
      };
    }
  }

  // Graceful default if city is custom or not mapped
  if (!selectedCityObj) {
    selectedCityObj = {
      cityName: rawPickupCity,
      price: Math.round(Number(trip.price) || 0),
      skipDays: 0,
      excludeTravel: false,
    };
  }

  // Apply Departure Date Pricing Overrides
  const override = await tx.tripDeparturePriceOverride.findUnique({
    where: {
      tripId_departureDate: {
        tripId: trip.id,
        departureDate: targetDateStr,
      },
    },
  });

  if (override && override.isActive) {
    if (override.overrideType === "FIXED_PRICE") {
      selectedCityObj.price = override.amount;
    } else if (override.overrideType === "EXTRA_CHARGE") {
      selectedCityObj.price += override.amount;
    }
  }

  // 4. Calculate prices
  let originalTotalBase = 0;
  const passengers =
    body.passengers &&
    Array.isArray(body.passengers) &&
    body.passengers.length > 0
      ? body.passengers
      : [
          {
            name: body.name || body.fullName || "Lead",
            trainOption: body.trainClass || "Sleeper",
            roomSharing: body.roomType || "Triple Sharing",
          },
        ];
  const bookingItemsSnapshot = [];
  passengers.forEach((p, index) => {
    let travelerPrice = selectedCityObj.price;

    // Helper functions to match options robustly
    const matchTrainClass = (label, train) => {
      if (!label || !train) return false;
      label = label.toLowerCase().trim();
      train = train.toLowerCase().trim();
      if (label === train) return true;
      if (
        train.includes("3ac") ||
        train.includes("3-tier") ||
        train.includes("3c")
      ) {
        if (train.includes("non ac") || train.includes("non-ac")) return false;
        return label.includes("3ac") || label.includes("3-tier");
      }
      if (train.includes("sleeper")) return label.includes("sleeper");
      return false;
    };

    const matchRoomType = (label, room) => {
      if (!label || !room) return false;
      label = label.toLowerCase().trim();
      room = room.toLowerCase().trim();
      if (label === room) return true;
      if (label.includes(room) || room.includes(label)) return true;
      if (room.includes("double") || room.includes("couple"))
        return label.includes("double") || label.includes("couple");
      if (room.includes("triple")) return label.includes("triple");
      if (room.includes("quad")) return label.includes("quad");
      return false;
    };

    // Train option adjustment
    let trainDelta = 0;
    let trainLabel = p.trainOption;
    if (selectedCityObj.excludeTravel !== true) {
      const trainOptions =
        trip.travelOptions &&
        Array.isArray(trip.travelOptions) &&
        trip.travelOptions.length > 0
          ? trip.travelOptions
          : [];
      const tOpt = trainOptions.find((opt) =>
        matchTrainClass(opt.label, p.trainOption),
      );
      if (tOpt) {
        trainDelta = Math.round(Number(tOpt.priceDelta) || 0);
        trainLabel = tOpt.label;
      }
    }
    travelerPrice += trainDelta;

    // Room sharing option adjustment
    let roomDelta = 0;
    let roomLabel = p.roomSharing;
    const roomOptions =
      trip.roomOptions &&
      Array.isArray(trip.roomOptions) &&
      trip.roomOptions.length > 0
        ? trip.roomOptions
        : [];
    const rOpt = roomOptions.find((opt) =>
      matchRoomType(opt.label, p.roomSharing),
    );
    if (rOpt) {
      roomDelta = Math.round(Number(rOpt.priceDelta) || 0);
      roomLabel = rOpt.label;
    }
    travelerPrice += roomDelta;

    // Generate snapshot item rows for this passenger
    const pName =
      p.name || (index === 0 && (body.name || body.fullName)) || "Lead";
    const routeStr = selectedCityObj.cityName
      ? ` (${selectedCityObj.cityName}→Himachal)`
      : "";
    bookingItemsSnapshot.push({
      id: `transport-${p.id || index}-${index}`,
      personId: p.id || `p-${index}`,
      category: "transport",
      variantName: trainLabel,
      name: `Transport - ${trainLabel}${routeStr} [${pName}]`,
      rate: selectedCityObj.price + trainDelta,
      qty: 1,
    });

    bookingItemsSnapshot.push({
      id: `accom-${p.id || index}-${index}`,
      personId: p.id || `p-${index}`,
      category: "accommodation",
      variantName: roomLabel,
      name: `Accommodation - Room ${index + 1}: ${roomLabel} [${pName}]`,
      rate: roomDelta,
      qty: 1,
    });

    originalTotalBase += Math.round(travelerPrice);
  });

  const netBase = Math.round(originalTotalBase);
  const gstRate = (trip.gstPercentage ?? 5) / 100;
  const fullPackageGst = Math.round(netBase * gstRate);
  const fullPackageTotal = Math.round(netBase + fullPackageGst);

  let gstAmount = 0;
  let depositGst = 0;
  let finalTotal = 0;
  let advancePaid = 0;
  let remainingBalance = 0;

  // Resolve customDepositPerPax if booking link is used
  let customDepositPerPax = null;
  if (body.sourceBookingLinkId || body.sourceBookingLinkToken) {
    let sourceLink = null;
    if (body.sourceBookingLinkToken) {
      const tokenHash = sha256(String(body.sourceBookingLinkToken));
      sourceLink = await tx.bookingLink.findFirst({
        where: { tokenHash, tenantId: trip.tenantId || "default" },
      });
    } else {
      sourceLink = await tx.bookingLink.findFirst({
        where: {
          id: body.sourceBookingLinkId,
          tenantId: trip.tenantId || "default",
        },
      });
    }
    if (sourceLink && sourceLink.customAmount) {
      customDepositPerPax = Math.round(sourceLink.customAmount);
    }
  }

  const paymentMode = body.paymentMode || "Partial Payment";
  if (paymentMode === "Full Payment") {
    gstAmount = Math.round(fullPackageGst);
    depositGst = Math.round(fullPackageGst);
    finalTotal = Math.round(fullPackageTotal);
    advancePaid = Math.round(finalTotal);
    remainingBalance = 0;
  } else {
    // Partial Payment
    const depositPerPax =
      customDepositPerPax && customDepositPerPax > 0
        ? customDepositPerPax
        : 2000;
    const partialBaseAmount = Math.round(depositPerPax * numberOfTravelers);
    depositGst = Math.round(partialBaseAmount * gstRate);
    gstAmount = Math.round(fullPackageGst);
    finalTotal = Math.round(partialBaseAmount + depositGst);
    advancePaid = Math.round(finalTotal);
    remainingBalance = Math.round(fullPackageTotal - finalTotal);
  }

  // paymentStatus resolution:
  // If not admin, we force paymentStatus to 'Pending' (never allow Paid or Partial directly without admin verification)
  let paymentStatus = "Pending";
  if (isAdmin && body.paymentStatus) {
    paymentStatus = body.paymentStatus;
  }

  return {
    baseAmount: Math.round(netBase),
    // gstAmount = FULL PACKAGE GST (total tax liability for the trip).
    // depositGst = GST included in the current payment (deposit GST for partial payments,
    //   full package GST for full payments).
    gstAmount: Math.round(fullPackageGst),
    depositGst: Math.round(depositGst),
    totalAmount: Math.round(fullPackageTotal),
    amount: Math.round(finalTotal),
    advancePaid: Math.round(advancePaid),
    remainingAmount: Math.round(remainingBalance),
    paymentStatus,
    pickupCity: selectedCityObj.cityName,
    skipDays: selectedCityObj.skipDays,
    adjustedPrice: Math.round(selectedCityObj.price),
    bookingItems: bookingItemsSnapshot,
  };
}

// ────────────────────────────────────────────
// BOOKING MANAGEMENT
// ────────────────────────────────────────────

exports.getBookings = async (req, res, next) => {
  const start = Date.now();
  try {
    const {
      status,
      tripId,
      paymentStatus,
      payment_status,
      search,
      salesAdminId,
      balanceOnly,
      bookingStart,
      bookingEnd,
      depStart,
      depEnd,
    } = req.query;

    // 1. Pagination parameters parse
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 25;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const userTenant = req.user?.tenantId || "default";
    const where = {
      tenantId:
        userTenant === "default" ? "default" : { in: [userTenant, "default"] },
    };

    // 2. Map status filters
    if (status && status !== "all") {
      if (status === "confirmed") {
        where.status = "confirmed";
      } else if (status === "pending") {
        where.status = { not: "confirmed" };
      } else {
        where.status = status;
      }
    }

    if (tripId && tripId !== "all") where.tripId = tripId;
    if (paymentStatus && paymentStatus !== "all")
      where.paymentStatus = paymentStatus;
    if (payment_status && payment_status !== "all")
      where.payment_status = payment_status;

    if (balanceOnly === "true" || balanceOnly === true) {
      where.remainingAmount = { gt: 0 };
    }

    const authCheckTime = Date.now();
    if (salesAdminId && salesAdminId !== "all") {
      where.salesAdminId = salesAdminId;
    }
    const authDuration = Date.now() - authCheckTime;

    // Search query map
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
        { bookingId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Created Date Range
    if (bookingStart || bookingEnd) {
      where.createdAt = {};
      if (bookingStart) where.createdAt.gte = new Date(bookingStart);
      if (bookingEnd) {
        const end = new Date(bookingEnd);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Departure Date Range
    if (depStart || depEnd) {
      where.departureDate = {};
      if (depStart) where.departureDate.gte = new Date(depStart);
      if (depEnd) {
        const end = new Date(depEnd);
        end.setHours(23, 59, 59, 999);
        where.departureDate.lte = end;
      }
    }

    // 3. Database query parallel execution
    const cacheKey = `booking_count_${JSON.stringify(where)}`;
    let totalPromise;
    const cachedCount = bookingCountCache.get(cacheKey);
    if (cachedCount && Date.now() < cachedCount.expiresAt) {
      totalPromise = Promise.resolve(cachedCount.count);
    } else {
      totalPromise = prisma.booking.count({ where }).then((c) => {
        bookingCountCache.set(cacheKey, {
          count: c,
          expiresAt: Date.now() + 30000,
        });
        return c;
      });
    }

    const isCompact =
      req.query.compact === "true" || req.query.compact === true;

    const queryStart = Date.now();
    const [totalCount, bookings] = await Promise.all([
      totalPromise,
      prisma.booking.findMany({
        where,
        select: isCompact
          ? {
              id: true,
              bookingId: true,
              tripId: true,
              tripName: true,
              status: true,
              name: true,
              fullName: true,
              mobile: true,
              email: true,
              numberOfTravelers: true,
              totalAmount: true,
              advancePaid: true,
              remainingAmount: true,
              paymentStatus: true,
              payment_status: true,
              departureDate: true,
              createdAt: true,
              salesAdminId: true,
              passengers: true,
              pickupCity: true,
            }
          : {
              id: true,
              bookingId: true,
              tripId: true,
              tripName: true,
              status: true,
              name: true,
              fullName: true,
              mobile: true,
              email: true,
              age: true,
              gender: true,
              numberOfTravelers: true,
              totalAmount: true,
              advancePaid: true,
              remainingAmount: true,
              paymentMode: true,
              paymentStatus: true,
              payment_status: true,
              payment_method: true,
              upi_reference: true,
              notes: true,
              departureDate: true,
              createdAt: true,
              salesAdminId: true,
              salesAdmin: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              baseAmount: true,
              gstAmount: true,
              sourceMeta: true,
              passengers: true,
              trainTicketStatus: true,
              trainTicketRequired: true,
              sourceBookingLink: {
                select: {
                  id: true,
                  tokenPrefix: true,
                  expiresAt: true,
                  status: true,
                  shareUrl: true,
                },
              },
            },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const queryDuration = Date.now() - queryStart;

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const resBody = {
      success: true,
      count: bookings.length,
      data: bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };

    if (process.env.ENABLE_PERFORMANCE_METRICS === "true") {
      const duration = Date.now() - start;
      const payloadBytes = Buffer.byteLength(JSON.stringify(resBody));
      console.log(
        `[METRICS] getBookings - Total: ${duration}ms, Auth: ${authDuration}ms, Query: ${queryDuration}ms, Rows: ${bookings.length}, Payload: ${payloadBytes} bytes`,
      );
    }

    res.status(200).json(resBody);
  } catch (error) {
    next(error);
  }
};

// Alias for bookingRoutes.js
exports.getAllBookings = exports.getBookings;

exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || "default";

    let booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id }, { bookingId: id }],
        tenantId,
      },
      include: {
        sourceBookingLink: {
          select: {
            id: true,
            tokenPrefix: true,
            expiresAt: true,
            status: true,
            shareUrl: true,
          },
        },
        documents: true,
      },
    });

    if (!booking) {
      booking = await prisma.booking.findFirst({
        where: {
          OR: [{ id }, { bookingId: id }],
        },
        include: {
          sourceBookingLink: {
            select: {
              id: true,
              tokenPrefix: true,
              expiresAt: true,
              status: true,
              shareUrl: true,
            },
          },
          documents: true,
        },
      });
    }

    if (!booking) {
      console.warn(`⚠️ [getBookingById] Booking ${id} not found`);
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    let extra = {};
    let persons = [];
    if (booking.passengers) {
      let parsed = booking.passengers;
      if (typeof booking.passengers === "string") {
        try {
          parsed = JSON.parse(booking.passengers);
        } catch (e) {
          console.error("Failed to parse passengers JSON:", e);
        }
      }
      if (Array.isArray(parsed)) {
        persons = parsed;
      } else if (parsed && typeof parsed === "object") {
        extra = parsed.details || {};
        persons = parsed.persons || [];
      }
    }

    // Connected ecosystem operational summary lookup
    let opsSummary = null;
    try {
      const authScope =
        req.user?.role === "sales"
          ? `sales-${req.user.id}`
          : req.user?.role || "admin";
      opsSummary = await buildBookingOpsSummary(booking, tenantId, authScope);
    } catch (opsErr) {
      console.error("Failed to build opsSummary:", opsErr);
    }

    const mappedBooking = {
      ...booking,
      ...extra,
      ticketStatus:
        booking.trainTicketStatus || extra.ticketStatus || "NOT BOOKED",
      passengers: persons,
      opsSummary,
    };

    res.json({ success: true, data: mappedBooking });
  } catch (error) {
    console.error(`🔥 [getBookingById Error] ID: ${req.params.id}:`, error);
    next(error);
  }
};

async function buildBookingOpsSummary(booking, tenantId, authScope = "admin") {
  try {
    const bookingId = booking.bookingId;
    const cacheKey = `admin:summary:booking:${tenantId}:${bookingId}:${authScope}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }

    const tripId = booking.tripId;
    const departureDate = booking.departureDate;

    const [
      ticketReq,
      accountingTotals,
      seatConfig,
      roomAllocCount,
      vehicleAllocCount,
      completedChecklistCount,
    ] = await Promise.all([
      prisma.trainTicketRequest.findFirst({
        where: { tenantId, bookingId },
        select: { status: true, _count: { select: { travellers: true } } },
      }),
      prisma.accountingEntry.groupBy({
        by: ["status"],
        where: { tenantId, bookingId },
        _sum: { amount: true },
      }),
      tripId && departureDate
        ? prisma.opsSeatConfig.findFirst({
            where: { tenantId, tripId, departureDate },
            select: { blockedSeats: true },
          })
        : null,
      tripId && departureDate
        ? prisma.opsRoomAllocation.count({
            where: { tripId, departureDate, bookingId, allocationStatus: "ACTIVE" },
          })
        : 0,
      tripId && departureDate
        ? prisma.opsVehicleAllocation.count({
            where: { tripId, departureDate, bookingId, allocationStatus: "ACTIVE" },
          })
        : 0,
      tripId && departureDate
        ? prisma.opsTripChecklist.count({
            where: { tenantId, tripId, departureDate, isCompleted: true },
          })
        : 0,
    ]);

    const ticketSummary = {
      status: ticketReq ? ticketReq.status : "NOT_CREATED",
      totalTravelers: ticketReq?._count.travellers || 0,
      approved: ticketReq && ticketReq.status === "APPROVED" ? 1 : 0,
      pending:
        ticketReq &&
        (ticketReq.status === "PENDING_VERIFICATION" ||
          ticketReq.status === "DRAFT")
          ? 1
          : 0,
      cancelled: ticketReq && ticketReq.status === "CANCELLED" ? 1 : 0,
    };

    const accountingByStatus = Object.fromEntries(
      accountingTotals.map((row) => [row.status, row._sum.amount || 0]),
    );
    const approvedCollection = accountingByStatus.APPROVED || 0;
    const pendingCollection = accountingByStatus.PENDING || 0;
    const bookingTotal = booking.totalAmount || 0;
    const remainingAmount = Math.max(0, bookingTotal - approvedCollection);
    const derivedCollectionStatus =
      approvedCollection >= bookingTotal
        ? "Paid"
        : approvedCollection > 0
          ? "Partially Paid"
          : "Pending";

    const accountingSummary = {
      bookingTotal,
      approvedCollection,
      pendingCollection,
      remainingAmount,
      derivedCollectionStatus,
    };

    // 3. Operations Summary
    const opsSummaryData = {
      departureWorkspaceState: departureDate ? "ACTIVE" : "NO_DATE",
      seatState: seatConfig
        ? seatConfig.blockedSeats > 0
          ? "BLOCKED"
          : "CONFIGURED"
        : "AVAILABLE",
      roomAllocationState: roomAllocCount > 0 ? "ALLOCATED" : "UNASSIGNED",
      vehicleAllocationState:
        vehicleAllocCount > 0 ? "ALLOCATED" : "UNASSIGNED",
      sopCompletedCount: completedChecklistCount,
    };

    let alertCount = ticketSummary.pending > 0 ? 1 : 0;
    if (remainingAmount > 0) {
      const now = new Date();
      if (departureDate) {
        const diffDays = Math.ceil(
          (new Date(departureDate) - now) / (1000 * 60 * 60 * 24),
        );
        if (diffDays <= 7) alertCount += 1;
      }
    }

    const result = {
      bookingLinkSource: booking.sourceBookingLink
        ? booking.sourceBookingLink.tokenPrefix
        : "Direct / Manual",
      salespersonOwner: booking.salesAdminId || "Unassigned",
      travelerCount: booking.numberOfTravelers || 1,
      ticketSummary,
      accountingSummary,
      operationsSummary: opsSummaryData,
      alertCount,
    };

    await cache.set(cacheKey, result, 15); // Cache for 15s
    return result;
  } catch (err) {
    console.error("buildBookingOpsSummary error:", err);
    return null;
  }
}

const parseCookies = (req) => {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURIComponent(parts.join("="));
    });
  }
  return list;
};

// PUBLIC: Lookup booking by user-facing bookingId (e.g. BK-087017) — for confirmation page
exports.getBookingPublic = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    let isAuthorized = false;

    // Check admin auth from Authorization header
    if (req.headers.authorization) {
      try {
        const authHeader = req.headers.authorization || "";
        if (authHeader.startsWith("Bearer ")) {
          const token = authHeader.slice("Bearer ".length).trim();
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const admin = await prisma.admin.findUnique({
            where: { id: decoded.id },
          });
          if (admin && admin.isActive) {
            isAuthorized = true;
          }
        }
      } catch (err) {
        // Ignore auth error, proceed to cookie check
      }
    }

    // Check confirm_token cookie
    if (!isAuthorized) {
      const cookies = parseCookies(req);
      const token = cookies[`confirm_token_${bookingId}`];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.bookingId === bookingId) {
            isAuthorized = true;
          }
        } catch (err) {
          // Token expired or invalid
        }
      }
    }

    // Fetch booking
    let booking = await prisma.booking.findFirst({
      where: { bookingId: String(bookingId) },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    // Map co-travelers to safe list (only name, gender, age)
    let persons = [];
    if (booking.passengers && typeof booking.passengers === "object") {
      const rawPersons = Array.isArray(booking.passengers)
        ? booking.passengers
        : booking.passengers.persons || [];
      persons = rawPersons.map((p) => ({
        name: p.name,
        gender: p.gender,
        age: p.age ? Number(p.age) : null,
      }));
    }

    // Return strictly whitelisted fields required by confirmation page
    const publicData = {
      id: booking.id,
      bookingId: booking.bookingId,
      tripName: booking.tripName,
      tripId: booking.tripId,
      status: booking.status,
      name: booking.name,
      gender: booking.gender,
      age: booking.age,
      departureDate: booking.departureDate,
      pickupCity: booking.pickupCity,
      passengers: persons,
    };

    res.json({ success: true, data: publicData });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const {
      name,
      fullName,
      phone,
      mobile,
      tripId: inputTripId,
      status,
      paymentMode,
      notes,
      email,
      departureDate,
      pickupCity,
      skipDays,
      adjustedPrice,
      joiningDate,
      sourceBookingLinkId,
      sourceBookingLinkToken,
      sourceBookingLinkPayload,
      sourceBookingLinkSignature,
    } = req.body;
    const targetName = name || fullName;
    const targetPhone = phone || mobile;

    const tenantId = req.user?.tenantId || "default";

    if (!targetName || !targetPhone || !inputTripId) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Required fields missing: Name, Phone, and Trip are mandatory",
        });
    }

    let tripId = inputTripId;
    let targetTrip = await prisma.trip.findFirst({
      where: { id: tripId, tenantId },
    });

    if (!targetTrip) {
      // Fallback: Resolve by slug or title
      targetTrip = await prisma.trip.findFirst({
        where: {
          OR: [
            { slug: inputTripId },
            { title: inputTripId },
            ...(req.body.tripName
              ? [{ title: req.body.tripName }, { slug: req.body.tripName }]
              : []),
          ],
          tenantId,
        },
      });
      if (targetTrip) {
        tripId = targetTrip.id;
      } else {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Selected Trip is invalid or no longer exists in the system",
          });
      }
    }

    const isAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "superadmin");

    // For non-admin callers (public/sales without financial permission),
    // financial state is decided server-side from actual payment records.
    // Client-supplied payment status / amounts are NEVER accepted.
    const canSetFinancials =
      isAdmin ||
      (req.user && hasPermission(req.user, "bookings.financial_edit"));
    const clientPaymentStatus = canSetFinancials ? req.body.paymentStatus : null;

    // Optional link attribution + expiry enforcement
    let sourceLink = null;
    let linkMetadata = null;
    if (
      sourceBookingLinkId ||
      sourceBookingLinkToken ||
      sourceBookingLinkPayload
    ) {
      if (sourceBookingLinkToken) {
        const tokenHash = sha256(String(sourceBookingLinkToken));
        sourceLink = await prisma.bookingLink.findFirst({
          where: { tokenHash, tenantId },
        });
      } else if (sourceBookingLinkId) {
        sourceLink = await prisma.bookingLink.findFirst({
          where: { id: sourceBookingLinkId, tenantId },
        });
      }

      if (sourceBookingLinkPayload && sourceBookingLinkSignature) {
        linkMetadata = verifySignedPayload(
          sourceBookingLinkPayload,
          sourceBookingLinkSignature,
        );
      }

      if (!sourceLink) {
        return res
          .status(410)
          .json({
            success: false,
            message: "Booking link is invalid or no longer available",
          });
      }

      const now = Date.now();
      if (sourceLink.status === "used" || sourceLink.completedCount > 0) {
        return res
          .status(410)
          .json({
            success: false,
            message: "This booking link has already been used",
          });
      }

      if (
        sourceLink.status === "deactivated" ||
        sourceLink.status === "revoked"
      ) {
        return res
          .status(410)
          .json({
            success: false,
            message: "This booking link has been deactivated",
          });
      }

      if (
        sourceLink.status !== "active" ||
        (sourceLink.expiresAt && sourceLink.expiresAt.getTime() < now)
      ) {
        await prisma.bookingLink.update({
          where: { id: sourceLink.id },
          data: { status: "expired" },
        });
        return res
          .status(410)
          .json({ success: false, message: "Booking link has expired" });
      }

      // Basic integrity check (link trip should match the booking trip)
      if (String(sourceLink.tripId) !== String(tripId)) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Trip mismatch for this booking link",
          });
      }
    }

    let booking;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        let currentBookingId;
        if (req.body.bookingId && attempts === 0) {
          if (!isAdmin) {
            // Ignore manual booking ID for non-admins and generate securely
            currentBookingId = generateBookingId();
          } else {
            // Validate manual ID format
            if (!/^BK-[0-9A-Z]{12}$/.test(req.body.bookingId)) {
              return res
                .status(400)
                .json({
                  success: false,
                  message:
                    "Invalid manual booking ID format. Must match /^BK-[0-9A-Z]{12}$/",
                });
            }
            // Check for duplicates in database before insertion
            const existing = await prisma.booking.findUnique({
              where: { bookingId: req.body.bookingId },
            });
            if (existing) {
              return res
                .status(400)
                .json({
                  success: false,
                  message: "Manual booking ID already exists in the system",
                });
            }
            currentBookingId = req.body.bookingId;
          }
        } else {
          currentBookingId = generateBookingId();
        }

        booking = await prisma.$transaction(async (tx) => {
          // Recompute and check capacity inside transaction context
          const calculations = await verifyAndCalculateBooking(
            targetTrip,
            req.body,
            isAdmin,
            tx,
          );

          const linkedName = linkMetadata?.customerName || targetName;
          const linkedPhone = linkMetadata?.customerPhone || targetPhone;
          const linkedEmail = linkMetadata?.customerEmail || email || null;
          const linkedTravelerCount =
            linkMetadata?.travelerCount || req.body.passengers?.length || 1;

          const created = await tx.booking.create({
            data: {
              tenantId,
              bookingId: currentBookingId,
              name: linkedName,
              fullName: linkedName,
              phone: linkedPhone,
              mobile: linkedPhone,
              tripId,
              tripName: targetTrip ? targetTrip.title : "Manual Booking",
              amount: canSetFinancials ? calculations.amount : 0,
              totalAmount: calculations.totalAmount,
              // Collected money is decided from verified payment records only.
              // Public callers (or sales without financial_edit) get 0 collected
              // and UNPAID; amounts are recomputed when a payment is verified.
              advancePaid: canSetFinancials ? calculations.advancePaid : 0,
              remainingAmount: calculations.totalAmount,
              status: "pending",
              // Canonical payment status. A brand-new booking has no verified
              // payment records yet → always UNPAID regardless of what the
              // client sent (financial fields are server-authoritative).
              paymentStatus: canSetFinancials && clientPaymentStatus
                ? normalizePaymentStatus(clientPaymentStatus)
                : PAYMENT_STATUS.UNPAID,
              paymentMode: paymentMode || "UPI",
              notes: notes || req.body.specialRequests || "",
              adminNotes: req.body.specialRequests || notes || "",
              email: linkedEmail,
              departureDate: departureDate ? new Date(departureDate) : null,
              pickupCity: calculations.pickupCity || null,
              skipDays: calculations.skipDays,
              adjustedPrice: calculations.adjustedPrice,
              age: sanitizeAge(
                req.body.age ||
                  (Array.isArray(req.body.passengers) &&
                    req.body.passengers[0]?.age) ||
                  (req.body.passengers?.persons &&
                    req.body.passengers.persons[0]?.age),
              ),
              gender:
                req.body.gender ||
                (Array.isArray(req.body.passengers) &&
                  req.body.passengers[0]?.gender) ||
                (req.body.passengers?.persons &&
                  req.body.passengers.persons[0]?.gender) ||
                null,
              numberOfTravelers: req.body.passengers?.length || 1,
              baseAmount: calculations.baseAmount,
              gstAmount: calculations.gstAmount,
              depositGst: calculations.depositGst,
              passengers: {
                details: {
                  trainClass: req.body.trainClass,
                  ticketStatus: req.body.ticketStatus,
                  roomType: req.body.roomType,
                  basePrice: calculations.adjustedPrice,
                  gstAmount: calculations.gstAmount,
                  depositGst: calculations.depositGst,
                },
                persons: req.body.passengers || [],
              },
              sourceBookingLinkId: sourceLink ? sourceLink.id : null,
              salesAdminId: sourceLink
                ? sourceLink.createdByAdminId
                : req.user
                  ? req.user.role === "sales"
                    ? req.user.id
                    : req.body.salesAdminId || null
                  : null,
              sourceMeta: sourceLink
                ? {
                    tripId: sourceLink.tripId,
                    tripName: sourceLink.tripName,
                    departureDate: sourceLink.departureDate,
                    pickupCity: sourceLink.pickupCity,
                    paymentMode: sourceLink.paymentMode,
                    customAmount: sourceLink.customAmount,
                    expiresAt: sourceLink.expiresAt,
                  }
                : null,
            },
          });

          if (sourceLink) {
            await tx.bookingLink.update({
              where: { id: sourceLink.id },
              data: {
                status: "used",
                completedCount: { increment: 1 },
                lastCompletedAt: new Date(),
              },
            });

            await tx.bookingLinkEvent.create({
              data: {
                tenantId,
                bookingLinkId: sourceLink.id,
                type: "booking_created",
                ipHash: getIpHash(req),
                userAgent: req.headers["user-agent"]?.toString(),
              },
            });
          }

          return created;
        });
        break;
      } catch (error) {
        attempts++;
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("bookingId") &&
          attempts < maxAttempts
        ) {
          console.warn(
            `[BOOKING_COLLISION] Retrying admin booking creation. Attempt: ${attempts}`,
          );
          continue;
        }
        if (attempts >= maxAttempts) {
          throw new Error(
            "Server failed to generate a unique booking ID after multiple attempts.",
          );
        }
        throw error;
      }
    }

    if (!isAdmin) {
      const confirmToken = jwt.sign(
        { bookingId: booking.bookingId },
        process.env.JWT_SECRET,
        { expiresIn: "24h" },
      );
      res.cookie(`confirm_token_${booking.bookingId}`, confirmToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: `/api/bookings/lookup/${booking.bookingId}`,
      });
    }

    await logBookingActivity({
      bookingId: booking.id,
      action: "CREATE",
      details: `Booking created for ${booking.name} (Trip: ${booking.tripName || "Manual Booking"})`,
      performedByAdminId: req.user ? req.user.id : null,
    });

    // Trigger simulated email confirmation log automatically on booking creation ONLY if confirmed
    if (
      booking.status === "Confirmed" ||
      booking.status === "confirmed" ||
      booking.paymentStatus === "Paid" ||
      booking.paymentStatus === "paid"
    ) {
      try {
        const { sendEmail, templates } = require("../lib/email");
        const templateData = templates.confirmation(booking);
        await sendEmail({
          to: booking.email || "info@youthcamping.com",
          subject: templateData.subject,
          html: templateData.html,
          type: "confirmation",
          bookingId: booking.id,
          prisma,
          attachments: [],
        });
        console.log(
          `📧 Automatically logged booking confirmation email for booking ${booking.bookingId}`,
        );
      } catch (emailErr) {
        console.error(
          "Failed to trigger automatic booking confirmation email:",
          emailErr.message,
        );
      }
    }

    res
      .status(201)
      .json({
        success: true,
        data: booking,
        message: "Booking created successfully",
      });
  } catch (error) {
    next(error);
  }
};

exports.updateBooking = async (req, res, next) => {
  try {
    const { email, reason, ...updateData } = req.body;
    delete updateData.id;
    delete updateData.tenantId;

    // Add email back to updateData if it exists
    if (email !== undefined) updateData.email = email;

    // Only touch passengers json mapping if custom fields or passengers array are explicitly present
    const confirmedRoomFields = findConfirmedRoomFields(req.body);
    if (confirmedRoomFields.length > 0) {
      return res.status(409).json({
        success: false,
        code: "CONFIRMED_ROOM_VIA_OPS_REQUIRED",
        message:
          "Confirmed room numbers must be saved via POST /ops/auto-allocate/manual-save. Booking updates may only change room preferences (roomType, coupleWith, groupId).",
        fields: confirmedRoomFields,
      });
    }

    const hasPassengerCustomFields = [
      "trainClass",
      "ticketStatus",
      "roomType",
      "basePrice",
      "foodPreference",
      "mealPreference",
      "dietary",
      "guideAssignment",
      "pickupStatus",
      "travelStatus",
      "participantNotes",
      "passengers",
    ].some((field) => req.body[field] !== undefined);

    if (hasPassengerCustomFields) {
      let existingBooking = await prisma.booking.findFirst({
        where: { id: req.params.id, tenantId: req.user?.tenantId || "default" },
      });
      if (!existingBooking) {
        existingBooking = await prisma.booking.findFirst({
          where: { id: req.params.id },
        });
      }

      let currentPassengers = existingBooking?.passengers || {};
      if (typeof currentPassengers === "string") {
        try {
          currentPassengers = JSON.parse(currentPassengers);
        } catch (e) {
          currentPassengers = {};
        }
      }

      // Nested preference payload: deep-merge without wiping unrelated keys
      if (
        req.body.passengers &&
        typeof req.body.passengers === "object" &&
        !Array.isArray(req.body.passengers)
      ) {
        updateData.passengers = mergePassengerPreferences(
          currentPassengers,
          req.body.passengers,
        );
      } else {
        let safeDetails = {};
        let safePersons = [];
        if (Array.isArray(currentPassengers)) {
          safePersons = currentPassengers;
        } else if (currentPassengers && typeof currentPassengers === "object") {
          safeDetails =
            currentPassengers.details &&
            typeof currentPassengers.details === "object" &&
            !Array.isArray(currentPassengers.details)
              ? currentPassengers.details
              : {};
          safePersons = Array.isArray(currentPassengers.persons)
            ? currentPassengers.persons
            : [];
        }

        updateData.passengers = {
          details: {
            ...safeDetails,
            ...(req.body.trainClass !== undefined && {
              trainClass: req.body.trainClass,
            }),
            ...(req.body.ticketStatus !== undefined && {
              ticketStatus: req.body.ticketStatus,
            }),
            ...(req.body.roomType !== undefined && {
              roomType: req.body.roomType,
            }),
            ...(req.body.basePrice !== undefined && {
              basePrice: req.body.basePrice,
            }),
            ...(req.body.gstAmount !== undefined && {
              gstAmount: req.body.gstAmount,
            }),
            ...(req.body.foodPreference !== undefined && {
              foodPreference: req.body.foodPreference,
            }),
            ...(req.body.mealPreference !== undefined && {
              mealPreference: req.body.mealPreference,
            }),
            ...(req.body.dietary !== undefined && { dietary: req.body.dietary }),
            ...(req.body.guideAssignment !== undefined && {
              guideAssignment: req.body.guideAssignment,
            }),
            ...(req.body.pickupStatus !== undefined && {
              pickupStatus: req.body.pickupStatus,
            }),
            ...(req.body.travelStatus !== undefined && {
              travelStatus: req.body.travelStatus,
            }),
            ...(req.body.participantNotes !== undefined && {
              participantNotes: req.body.participantNotes,
            }),
          },
          persons: Array.isArray(req.body.passengers)
            ? req.body.passengers
            : safePersons,
        };
      }
    }

    if (updateData.ticketStatus !== undefined) {
      updateData.trainTicketStatus = updateData.ticketStatus;
    }
    delete updateData.trainClass;
    delete updateData.ticketStatus;
    delete updateData.roomType;
    delete updateData.foodPreference;
    delete updateData.mealPreference;
    delete updateData.dietary;
    delete updateData.roomAllocation;
    delete updateData.guideAssignment;
    delete updateData.pickupStatus;
    delete updateData.travelStatus;
    delete updateData.participantNotes;

    if (updateData.basePrice !== undefined) {
      updateData.baseAmount =
        updateData.basePrice !== null ? parseFloat(updateData.basePrice) : null;
      delete updateData.basePrice;
    }
    if (updateData.gstAmount !== undefined) {
      updateData.gstAmount =
        updateData.gstAmount !== null ? parseFloat(updateData.gstAmount) : null;
    }
    if (req.body.passengers && Array.isArray(req.body.passengers)) {
      updateData.numberOfTravelers = req.body.passengers.length;
      if (req.body.passengers.length > 0) {
        const lead = req.body.passengers[0];
        if (updateData.name === undefined && lead.name)
          updateData.name = lead.name;
        if (updateData.phone === undefined && lead.phone)
          updateData.phone = lead.phone;
        if (updateData.email === undefined && lead.email)
          updateData.email = lead.email;
        if (updateData.gender === undefined && lead.gender)
          updateData.gender = lead.gender;
        if (updateData.age === undefined && lead.age)
          updateData.age = sanitizeAge(lead.age);
      }
    }

    if (updateData.advancePaid !== undefined)
      updateData.advancePaid = Number(updateData.advancePaid) || 0;
    if (updateData.totalAmount !== undefined)
      updateData.totalAmount = Number(updateData.totalAmount) || 0;
    if (updateData.amount !== undefined)
      updateData.amount = Number(updateData.amount) || 0;
    if (updateData.remainingAmount !== undefined)
      updateData.remainingAmount = Number(updateData.remainingAmount) || 0;
    if (updateData.age !== undefined)
      updateData.age = sanitizeAge(updateData.age);
    if (
      updateData.departureDate !== undefined &&
      updateData.departureDate !== null &&
      updateData.departureDate !== ""
    ) {
      const d = new Date(updateData.departureDate);
      if (!isNaN(d.getTime())) updateData.departureDate = d;
      else delete updateData.departureDate;
    } else if (updateData.departureDate === "") {
      delete updateData.departureDate;
    }
    if (updateData.skipDays !== undefined)
      updateData.skipDays = parseInt(updateData.skipDays) || 0;
    if (updateData.adjustedPrice !== undefined)
      updateData.adjustedPrice = parseFloat(updateData.adjustedPrice) || null;
    if (
      updateData.joiningDate !== undefined &&
      updateData.joiningDate !== null &&
      updateData.joiningDate !== ""
    ) {
      const d = new Date(updateData.joiningDate);
      if (!isNaN(d.getTime())) updateData.joiningDate = d;
      else delete updateData.joiningDate;
    } else if (updateData.joiningDate === "") {
      updateData.joiningDate = null;
    }

    // Handle tripId change to sync tripName
    if (updateData.tripId) {
      let targetTrip = await prisma.trip.findFirst({
        where: {
          id: updateData.tripId,
          tenantId: req.user?.tenantId || "default",
        },
      });
      if (!targetTrip) {
        targetTrip = await prisma.trip.findFirst({
          where: { id: updateData.tripId },
        });
      }
      if (targetTrip) {
        updateData.tripName = targetTrip.title;
      }
    }

    let beforeBooking = await prisma.booking.findFirst({
      where: { id: req.params.id, tenantId: req.user?.tenantId || "default" },
    });
    if (!beforeBooking) {
      beforeBooking = await prisma.booking.findFirst({
        where: { id: req.params.id },
      });
    }
    if (!beforeBooking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (updateData.departureDate !== undefined) {
      const nextDate = safeParseDate(updateData.departureDate);
      const prevDate = beforeBooking.departureDate
        ? new Date(beforeBooking.departureDate)
        : null;
      const nextKey = nextDate ? nextDate.toISOString().slice(0, 10) : null;
      const prevKey = prevDate && !isNaN(prevDate.getTime())
        ? prevDate.toISOString().slice(0, 10)
        : null;
      if (nextKey !== prevKey) {
        return res.status(409).json({
          success: false,
          code: "BOOKING_TRANSFER_REQUIRED",
          message:
            "Changing a booking departureDate requires a dedicated booking transfer. To reschedule the whole departure, use PUT /api/departures/reschedule.",
        });
      }
    }

    // Status changes through the generic update endpoint must obey the
    // booking lifecycle rules (use /bookings/:id/status for transitions).
    if (updateData.status !== undefined && updateData.status !== beforeBooking.status) {
      const transitionError = validateBookingStatusTransition(
        beforeBooking.status,
        updateData.status,
      );
      if (transitionError) {
        return res.status(400).json({ success: false, message: transitionError });
      }
    }

    const ALLOWED_BOOKING_FIELDS = new Set([
      "tripId",
      "tripName",
      "status",
      "name",
      "fullName",
      "phone",
      "mobile",
      "email",
      "age",
      "gender",
      "numberOfTravelers",
      "baseAmount",
      "gstAmount",
      "depositGst",
      "totalAmount",
      "amount",
      "advancePaid",
      "remainingAmount",
      "paymentMode",
      "paymentStatus",
      "payment_status",
      "payment_method",
      "upi_reference",
      "notes",
      "adminNotes",
      "sourceBookingLinkId",
      "salesAdminId",
      "sourceMeta",
      "departureDate",
      "pickupCity",
      "skipDays",
      "adjustedPrice",
      "joiningDate",
      "reminderSent",
      "passengers",
      "trainTicketRequired",
      "trainTicketStatus",
    ]);

    const sanitizedData = {};
    for (const key of Object.keys(updateData)) {
      if (ALLOWED_BOOKING_FIELDS.has(key)) {
        sanitizedData[key] = updateData[key];
      }
    }

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: sanitizedData,
    });

    // Log audit log (normalize Decimal/Number comparison using String())
    const isReassignment =
      updateData.salesAdminId !== undefined &&
      updateData.salesAdminId !== beforeBooking.salesAdminId;
    const isPriceGstChange =
      (updateData.baseAmount !== undefined &&
        String(updateData.baseAmount) !== String(beforeBooking.baseAmount)) ||
      (updateData.gstAmount !== undefined &&
        String(updateData.gstAmount) !== String(beforeBooking.gstAmount));
    const isPaymentUpdate =
      updateData.paymentStatus !== undefined &&
      updateData.paymentStatus !== beforeBooking.paymentStatus;

    let logActionType = "booking_update";
    if (isReassignment) logActionType = "sales_ownership_reassignment";
    else if (isPriceGstChange) logActionType = "price_gst_change";
    else if (isPaymentUpdate) logActionType = "payment_update";

    try {
      await logAction({
        tenantId: req.user?.tenantId || "default",
        actorUserId: req.user?.id || "system",
        action: logActionType,
        entityType: "booking",
        entityId: req.params.id,
        beforeData: beforeBooking,
        afterData: updateData,
        ipAddress: req.ip || null,
      });

      let activityDetails = `Booking details updated for ${booking.name || beforeBooking.name || req.params.id}`;
      if (updateData.status && updateData.status !== beforeBooking.status) {
        activityDetails = `Booking status changed from '${beforeBooking.status}' to '${updateData.status}'`;
      } else if (isReassignment) {
        activityDetails = `Sales owner reassigned to ${updateData.salesAdminId}`;
      } else if (isPaymentUpdate) {
        activityDetails = `Payment status changed from '${beforeBooking.paymentStatus}' to '${updateData.paymentStatus}'`;
      } else if (isPriceGstChange) {
        activityDetails = `Pricing updated (Base: ₹${updateData.baseAmount ?? beforeBooking.baseAmount}, GST: ₹${updateData.gstAmount ?? beforeBooking.gstAmount})`;
      }

      await logBookingActivity({
        bookingId: req.params.id,
        action: updateData.status ? "STATUS_CHANGE" : "DETAILS_UPDATE",
        details: activityDetails,
        performedByAdminId: req.user?.id || "system",
      });

      const authScope =
        req.user?.role === "sales"
          ? `sales-${req.user?.id}`
          : req.user?.role || "admin";
      if (req.user?.tenantId && beforeBooking?.bookingId) {
        await cache.del(
          `admin:summary:booking:${req.user.tenantId}:${beforeBooking.bookingId}:${authScope}`,
        );
        if (authScope !== "admin") {
          await cache.del(
            `admin:summary:booking:${req.user.tenantId}:${beforeBooking.bookingId}:admin`,
          );
        }
      }
    } catch (logErr) {
      console.error("Non-critical logging error in updateBooking:", logErr);
    }

    res.json({ success: true, message: "Booking updated", data: booking });
  } catch (error) {
    next(error);
  }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const isPermanent = req.query.permanent === "true";
    const role = req.user?.role;

    // Superadmin, admin, founder, owner can delete any booking regardless of tenantId
    const whereCondition = role === "superadmin" || role === "admin" || role === "founder" || role === "owner"
      ? { OR: [{ id }, { bookingId: id }] }
      : { OR: [{ id, tenantId }, { bookingId: id, tenantId }] };

    const booking = await prisma.booking.findFirst({
      where: whereCondition,
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    if (isPermanent) {
      // Permanent hard delete
      const bookingIds = Array.from(new Set([id, booking.id, booking.bookingId].filter(Boolean)));

      const safeDelete = async (fn, name) => {
        try { await fn(); } catch(e) { console.warn(`[DELETE] ${name} skip/error:`, e.message); }
      };

      // These two models have onDelete: Restrict in schema.prisma, so they MUST be deleted manually before deleting Booking.
      // Other models have onDelete: Cascade or SetNull, so the database will handle them automatically.
      await safeDelete(() => prisma.opsVehicleAllocation.deleteMany({ where: { bookingId: { in: bookingIds } } }), "opsVehicleAllocation");
      await safeDelete(() => prisma.opsRoomAllocation.deleteMany({ where: { bookingId: { in: bookingIds } } }), "opsRoomAllocation");

      await prisma.booking.delete({ where: { id: booking.id } });

      console.log(`[DELETE] Booking ${booking.id} (${booking.bookingId}) permanently deleted by ${req.user?.email}`);
      return res.json({ success: true, message: "Booking permanently deleted successfully" });
    }


    // Spec: "reject" should move to Cancelled state (not hard-delete),
    // so the booking lifecycle remains auditable.
    // Note: payment status is intentionally left untouched — rejection is a
    // booking-status operation, not a financial one.
    await prisma.booking.updateMany({
      where: { id, tenantId },
      data: {
        status: "cancelled",
      },
    });

    await logAction({
      tenantId,
      actorUserId: req.user.id,
      action: "booking_rejection",
      entityType: "booking",
      entityId: id,
      beforeData: booking,
      afterData: { status: "cancelled" },
      ipAddress: req.ip || null,
    });

    await logBookingActivity({
      bookingId: id,
      action: "STATUS_CHANGE",
      details: "Booking cancelled (deleted)",
      performedByAdminId: req.user.id,
    });

    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("🔥 [deleteBooking Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete booking. Please try again later.",
    });
  }
};

exports.confirmBooking = async (req, res, next) => {
  try {
    const {
      totalAmount,
      advancePaid,
      paymentMode,
      paymentStatus,
      email,
      trainTicketStatus,
    } = req.body;

    let targetTotal, targetAdvance;
    try {
      targetTotal = validateAmount(totalAmount, "totalAmount");
      targetAdvance = validateAmount(advancePaid, "advancePaid");
    } catch (valErr) {
      return res.status(400).json({ success: false, message: valErr.message });
    }
    if (targetAdvance > targetTotal) {
      return res
        .status(400)
        .json({
          success: false,
          message: "advancePaid cannot exceed totalAmount",
        });
    }

    // Financial values set here must pass through server-side validation.
    // paymentStatus is normalized to the canonical vocabulary (UNPAID/PARTIAL/PAID/REFUNDED).
    const canonicalPaymentStatus = normalizePaymentStatus(
      paymentStatus || (targetAdvance > 0 ? PAYMENT_STATUS.PARTIAL : PAYMENT_STATUS.UNPAID),
    );
    // advancePaid > 0 with a full payment → PAID; remaining amount decides PARTIAL vs PAID.
    const resolvedPaymentStatus =
      targetAdvance > 0 && targetAdvance >= targetTotal
        ? PAYMENT_STATUS.PAID
        : targetAdvance > 0
          ? PAYMENT_STATUS.PARTIAL
          : canonicalPaymentStatus;

    const role = req.user?.role;
    const where = { id: req.params.id, tenantId: req.user.tenantId };
    /* all sales allowed */

    const beforeBooking = await prisma.booking.findFirst({ where });
    if (!beforeBooking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    const updatePayload = {
      status: "confirmed",
      totalAmount: targetTotal,
      advancePaid: targetAdvance,
      remainingAmount: targetTotal - targetAdvance,
      paymentMode,
      paymentStatus: resolvedPaymentStatus,
      payment_status: resolvedPaymentStatus.toLowerCase(),
      email: email || undefined,
      trainTicketStatus: trainTicketStatus || undefined,
    };

    const booking = await prisma.booking.updateMany({
      where,
      data: updatePayload,
    });

    await logAction({
      tenantId: req.user.tenantId,
      actorUserId: req.user.id,
      action: "booking_approval",
      entityType: "booking",
      entityId: req.params.id,
      beforeData: beforeBooking,
      afterData: updatePayload,
      ipAddress: req.ip || null,
    });

    await logBookingActivity({
      bookingId: req.params.id,
      action: "STATUS_CHANGE",
      details: `Booking status set to confirmed (Total: ₹${totalAmount}, Advance Paid: ₹${targetAdvance} via ${paymentMode})`,
      performedByAdminId: req.user.id,
    });

    if (targetAdvance > 0) {
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId: req.params.id, tenantId: req.user.tenantId },
      });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            bookingId: req.params.id,
            amount: targetAdvance,
            paymentMode: paymentMode || "UPI",
            tenantId: req.user.tenantId,
            status: "success",
          },
        });
      }
    }

    // Sync to Google Sheets
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });
    if (updatedBooking) {
      syncBookingToSheets(updatedBooking).catch((err) =>
        console.error("[SHEETS_SYNC_SILENT_ERR]", err.message),
      );
    }

    res.json({ success: true, message: "Booking confirmed" });
  } catch (error) {
    next(error);
  }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const where = { tenantId };
    if (req.user?.email) {
      where.email = req.user.email;
    }
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    next(error);
  }
};

exports.searchByPhone = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message:
      "Public search by phone number is disabled for security and privacy reasons.",
  });
};

// ────────────────────────────────────────────
// TRIP DROPDOWN (for booking forms)
// ────────────────────────────────────────────

const tripsCache = new Map(); // tenantId -> { data, expiresAt }
const TRIPS_CACHE_TTL = 5 * 60 * 1000;

exports.getTrips = async (req, res, next) => {
  try {
    const userTenant = req.user?.tenantId || "default";
    const whereTenant =
      userTenant === "default" ? "default" : { in: [userTenant, "default"] };

    const trips = await prisma.trip.findMany({
      where: { tenantId: whereTenant },
      select: { id: true, title: true, price: true, availableDates: true },
    });
    const formatted = trips.map((t) => ({
      id: t.id,
      tripCode: t.id,
      title: t.title,
      tripName: t.title,
      price: t.price,
      availableDates: t.availableDates,
    }));
    tripsCache.set(userTenant, {
      data: formatted,
      expiresAt: Date.now() + TRIPS_CACHE_TTL,
    });

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// Aliases for bookingRoutes.js
exports.getAllTrips = exports.getTrips;

exports.createTrip = async (req, res, next) => {
  try {
    const tripCode = req.body.tripCode || req.body.id || `TRIP-${Date.now()}`;
    const tripName = req.body.tripName || req.body.title || "Untitled Trip";

    const trip = await prisma.trip.create({
      data: {
        id: tripCode,
        title: tripName,
        slug: tripCode.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        location: req.body.location || "TBD",
        duration: req.body.duration || "TBD",
        description: req.body.description || "TBD",
        tenantId: req.user?.tenantId || "default",
        price: Number(req.body.price) || 0,
      },
    });
    res.status(201).json({
      success: true,
      data: { ...trip, tripCode: trip.id, tripName: trip.title },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTrip = async (req, res, next) => {
  try {
    const { id: oldId } = req.params;
    const { tripCode, tripName, ...otherData } = req.body;
    const tenantId = req.user?.tenantId || "default";

    // Map tripName to title if provided
    const updateData = { ...otherData };
    if (tripName) updateData.title = tripName;

    // Remove unwanted fields
    delete updateData.id;
    delete updateData.tenantId;

    const newId = tripCode ? tripCode.toUpperCase() : null;

    if (newId && newId !== oldId) {
      console.log(
        `🔄 [updateTrip] Migrating Trip ID from ${oldId} to ${newId}`,
      );

      // 2. Perform Migration Transaction
      await prisma.$transaction(async (tx) => {
        const oldTrip = await tx.trip.findFirst({
          where: { id: oldId, tenantId },
        });
        if (!oldTrip) throw new Error("Original trip not found");

        // Rename old slug temporarily to avoid unique constraint error
        await tx.trip.update({
          where: { id: oldId },
          data: { slug: `${oldTrip.slug}-old-${Date.now()}` },
        });

        // Create new record
        const newTripData = {
          ...oldTrip,
          ...updateData,
          id: newId,
          tenantId,
        };
        // Ensure we don't accidentally spread relations or nested objects if they exist
        delete newTripData.bookings;
        delete newTripData.assignments;

        await tx.trip.create({ data: newTripData });

        // 3. Update related records
        // Bookings
        await tx.booking.updateMany({
          where: { tripId: oldId, tenantId },
          data: {
            tripId: newId,
            tripName: tripName || oldTrip.title,
          },
        });

        // Inquiries
        await tx.inquiry.updateMany({
          where: { tripId: oldId, tenantId },
          data: {
            tripId: newId,
            tripTitle: tripName || oldTrip.title,
          },
        });

        // Reviews
        await tx.review.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripId: newId },
        });

        // Trip Vendors
        await tx.tripVendor.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripId: newId },
        });

        // 4. Delete old record
        await tx.trip.delete({ where: { id: oldId } });
      });

      return res.json({
        success: true,
        message: "Trip Code and details updated successfully",
      });
    } else {
      // Regular update for other fields
      const trip = await prisma.trip.updateMany({
        where: { id: oldId, tenantId },
        data: updateData,
      });

      // Also sync tripName in bookings if title was updated
      if (tripName) {
        await prisma.booking.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripName },
        });
        await prisma.inquiry.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripTitle: tripName },
        });
      }

      if (trip.count === 0)
        return res
          .status(404)
          .json({ success: false, message: "Trip not found" });
      res.json({ success: true, message: "Trip updated successfully" });
    }
  } catch (error) {
    console.error("🔥 [updateTrip] Error:", error);
    next(error);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || "default";

    const trip = await prisma.trip.findFirst({
      where: { id, tenantId },
    });

    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    const activeBookingCount = await prisma.booking.count({
      where: {
        tripId: id,
        tenantId,
        status: { notIn: ["cancelled", "rejected"] },
      },
    });

    if (activeBookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete trip with ${activeBookingCount} active booking(s). Please cancel or reassign bookings first.`,
      });
    }

    await Promise.all([
      prisma.inquiry
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.review
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsSeatConfig
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsItinerary
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsAttraction
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsPackingItem
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsInclusionExclusion
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsFaq
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsTripChecklist
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsIncidentLog
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsHotelBooking
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsTransportFleet
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsGuidePayment
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsMiscExpense
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsTripExpense
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.opsTripLeader
        .deleteMany({ where: { tripId: id, tenantId } })
        .catch(() => {}),
      prisma.tripAssignment
        .deleteMany({ where: { tripId: id } })
        .catch(() => {}),
      prisma.tripVendor.deleteMany({ where: { tripId: id } }).catch(() => {}),
    ]);

    await prisma.trip.delete({
      where: { id },
    });

    res.json({ success: true, message: "Trip deleted" });
  } catch (error) {
    console.error("deleteTrip error:", error);
    res.status(500).json({ success: false, message: "Failed to delete trip" });
  }
};

// ────────────────────────────────────────────
// PUBLIC BOOKING FORM SUBMISSION
// ────────────────────────────────────────────

exports.submitBookingForm = async (req, res, next) => {
  try {
    const tripCode = req.params.tripCode;
    const tenantId = req.user?.tenantId || "default";

    // Find the trip
    let targetTrip = await prisma.trip.findFirst({
      where: { id: tripCode, tenantId },
    });

    if (!targetTrip) {
      targetTrip = await prisma.trip.findFirst({
        where: {
          OR: [{ slug: tripCode }, { title: tripCode }],
          tenantId,
        },
      });
    }

    if (!targetTrip) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Selected Trip is invalid or no longer exists in the system",
        });
    }

    let booking;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const currentBookingId = generateBookingId();
        // Explicitly construct the payload to match the schema
        booking = await prisma.$transaction(async (tx) => {
          // Re-verify calculations and capacity inside transaction context
          const calculations = await verifyAndCalculateBooking(
            targetTrip,
            req.body,
            false,
            tx,
          );

          const created = await tx.booking.create({
            data: {
              bookingId: currentBookingId,
              tenantId,
              tripId: targetTrip.id, // Set resolved ID
              tripName: targetTrip.title,
              name: req.body.fullName || req.body.name || "Unknown",
              fullName: req.body.fullName || req.body.name,
              phone: req.body.mobile || req.body.phone || "0000000000",
              mobile: req.body.mobile || req.body.phone,
              email: req.body.email || null,
              departureDate: req.body.departureDate
                ? new Date(req.body.departureDate)
                : null,
              pickupCity: calculations.pickupCity || null,
              skipDays: calculations.skipDays,
              adjustedPrice: calculations.adjustedPrice,
              joiningDate: req.body.joiningDate
                ? new Date(req.body.joiningDate)
                : null,
              age: sanitizeAge(
                req.body.age ||
                  (Array.isArray(req.body.passengers) &&
                    req.body.passengers[0]?.age) ||
                  (req.body.passengers?.persons &&
                    req.body.passengers.persons[0]?.age),
              ),
              gender:
                req.body.gender ||
                (Array.isArray(req.body.passengers) &&
                  req.body.passengers[0]?.gender) ||
                (req.body.passengers?.persons &&
                  req.body.passengers.persons[0]?.gender) ||
                null,
              numberOfTravelers: req.body.passengers?.length || 1,
              baseAmount: calculations.baseAmount,
              gstAmount: calculations.gstAmount,
              depositGst: calculations.depositGst,
              amount: calculations.amount,
              totalAmount: calculations.totalAmount,
              advancePaid: 0,
              remainingAmount: calculations.totalAmount,
              // Public submissions can never set their own status/payment
              // state — always pending + UNPAID until an admin verifies a payment.
              status: "pending",
              paymentStatus: PAYMENT_STATUS.UNPAID,
              paymentMode: null,
              notes: req.body.notes || null,
              passengers: {
                details: {
                  trainClass: req.body.trainClass,
                  ticketStatus: req.body.ticketStatus,
                  roomType: req.body.roomType,
                  basePrice: calculations.adjustedPrice,
                  gstAmount: calculations.gstAmount,
                  depositGst: calculations.depositGst,
                },
                persons: req.body.passengers || [],
              },
            },
          });
          return created;
        });
        break;
      } catch (error) {
        attempts++;
        if (
          error.code === "P2002" &&
          error.meta?.target?.includes("bookingId") &&
          attempts < maxAttempts
        ) {
          console.warn(
            `[BOOKING_COLLISION] Retrying public booking creation. Attempt: ${attempts}`,
          );
          continue;
        }
        if (attempts >= maxAttempts) {
          throw new Error(
            "Server failed to generate a unique booking ID after multiple attempts.",
          );
        }
        throw error;
      }
    }

    // Set 24 hour secure cookie to allow unauthenticated lookup on confirmation page
    const confirmToken = jwt.sign(
      { bookingId: booking.bookingId },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );
    res.cookie(`confirm_token_${booking.bookingId}`, confirmToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: `/api/bookings/lookup/${booking.bookingId}`,
    });

    // Trigger simulated email confirmation log automatically on booking submission ONLY if confirmed
    if (
      booking.status === "Confirmed" ||
      booking.status === "confirmed" ||
      booking.paymentStatus === "Paid" ||
      booking.paymentStatus === "paid"
    ) {
      try {
        const { sendEmail, templates } = require("../lib/email");
        const templateData = templates.confirmation(booking);
        await sendEmail({
          to: booking.email || "info@youthcamping.com",
          subject: templateData.subject,
          html: templateData.html,
          type: "confirmation",
          bookingId: booking.id,
          prisma,
          attachments: [],
        });
        console.log(
          `📧 Automatically logged booking confirmation email for booking ${booking.bookingId}`,
        );
      } catch (emailErr) {
        console.error(
          "Failed to trigger automatic booking confirmation email:",
          emailErr.message,
        );
      }
    }

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

exports.getTripInfo = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [{ id: req.params.tripCode }, { slug: req.params.tripCode }],
        tenantId,
      },
    });
    if (!trip)
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    res.json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || "default";

    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        payment_status: "paid",
        paymentStatus: PAYMENT_STATUS.PAID,
      },
    });

    await logAction({
      tenantId,
      actorUserId: req.user.id,
      action: "payment_update",
      entityType: "booking",
      entityId: id,
      beforeData: booking,
      afterData: { payment_status: "paid", paymentStatus: PAYMENT_STATUS.PAID },
      ipAddress: req.ip || null,
    });

    // Sync to Google Sheets
    syncBookingToSheets(updatedBooking).catch((err) =>
      console.error("[SHEETS_SYNC_SILENT_ERR]", err.message),
    );

    // Simulated WhatsApp trigger
    console.log(
      `📲 [WHATSAPP PAYMENT CONFIRMATION] Sending WhatsApp notification to customer ${booking.name} (${booking.phone}): "Your payment of ₹${booking.advancePaid || booking.totalAmount} has been confirmed! Your booking ${booking.bookingId} is now active."`,
    );

    res.json({
      success: true,
      message: "Payment confirmed and WhatsApp triggered",
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBookingUpi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { upi_reference } = req.body;
    const tenantId = req.user?.tenantId || "default";

    const booking = await prisma.booking.findFirst({
      where: { OR: [{ id }, { bookingId: id }], tenantId },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        upi_reference,
        payment_status: "pending",
        payment_method: "upi",
      },
    });

    await logAction({
      tenantId: booking.tenantId || "default",
      actorUserId: req.user?.id || null,
      action: "payment_update",
      entityType: "booking",
      entityId: booking.id,
      beforeData: booking,
      afterData: {
        upi_reference,
        payment_status: "pending",
        payment_method: "upi",
      },
      ipAddress: req.ip || null,
    });

    // Sync to Google Sheets
    syncBookingToSheets(updatedBooking).catch((err) =>
      console.error("[SHEETS_SYNC_SILENT_ERR]", err.message),
    );

    res.json({
      success: true,
      message: "UPI reference saved successfully",
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookingActivityLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    // Verify booking belongs to tenant before returning logs
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    const logs = await prisma.bookingActivityLog.findMany({
      where: { bookingId: id },
      include: {
        performedBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

exports.getColleagues = async (req, res, next) => {
  try {
    const colleagues = await prisma.admin.findMany({
      where: {
        tenantId: req.user.tenantId || "default",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: colleagues });
  } catch (error) {
    next(error);
  }
};

exports.getBookingTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    const tasks = await prisma.bookingTask.findMany({
      where: { bookingId: id },
      include: {
        assignedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

exports.createBookingTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, assignedToId, dueDate } = req.body;
    const tenantId = req.user?.tenantId || "default";

    if (!title || !assignedToId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Title and assignedToId are required",
        });
    }

    // Verify booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!booking)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });

    const task = await prisma.bookingTask.create({
      data: {
        tenantId,
        bookingId: id,
        title,
        description: description || "",
        assignedById: req.user.id,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "PENDING",
      },
      include: {
        assignedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Log in activity log
    await logBookingActivity({
      bookingId: id,
      action: "TASK_ASSIGNED",
      details: `Task "${title}" assigned to ${task.assignedTo?.name || "junior"} by ${task.assignedBy?.name || "senior"}`,
      performedByAdminId: req.user.id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

exports.updateBookingTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const tenantId = req.user?.tenantId;

    const existingTask = await prisma.bookingTask.findFirst({
      where: { id: taskId, tenantId },
      include: {
        assignedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    if (!existingTask) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const updated = await prisma.bookingTask.update({
      where: { id: taskId },
      data: { status },
      include: {
        assignedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    // Log to booking activity log
    await logBookingActivity({
      bookingId: existingTask.bookingId,
      action: "TASK_UPDATED",
      details: `Task "${existingTask.title}" status changed to ${status}`,
      performedByAdminId: req.user.id,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// PASSENGER DOCUMENT UPLOAD & DOWNLOAD
// ────────────────────────────────────────────
const supabaseStorage = require("../utils/supabaseStorage");

exports.uploadPassengerDocument = async (req, res, next) => {
  try {
    const { id: bookingId, passengerId } = req.params;
    const tenantId = req.user.tenantId || "default";

    // 1. Role-based permissions
    if (req.user.role === "guide") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Guides are not permitted to access documents.",
        });
    }

    // 2. Fetch booking to check ownership / existence
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    // 3. File validation
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    // Size limit check: 5 MB
    if (req.file.size > 5 * 1024 * 1024) {
      return res
        .status(400)
        .json({ success: false, message: "File size must be under 5 MB." });
    }

    // MimeType check (PDF, JPG, PNG)
    const allowedMimes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invalid file type. Only JPG, PNG, and PDF are allowed.",
        });
    }

    // 4. Storage execution
    const documentType = req.body.documentType || "ID Document";
    const sanitizeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `bookings/${bookingId}/passengers/${passengerId}/${Date.now()}-${sanitizeName}`;

    let uploadResult;
    try {
      uploadResult = await supabaseStorage.uploadFile(
        req.file.buffer,
        storagePath,
        req.file.mimetype,
      );
    } catch (err) {
      console.error("[UPLOAD CONTROLLER] Storage failed:", err.message);
      return res
        .status(500)
        .json({
          success: false,
          message: "Document upload failed. Please retry later.",
        });
    }

    // 5. Always create a NEW database record so multiple documents per passenger are supported
    const docData = {
      tenantId,
      bookingId,
      passengerId,
      uploadedBy: req.user.email || req.user.id,
      documentType,
      storagePath: uploadResult.storagePath,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      status: "UPLOADED",
    };

    const doc = await prisma.bookingDocument.create({
      data: docData,
    });

    // Log booking activity
    await logBookingActivity({
      bookingId,
      action: "DOCUMENT_UPLOADED",
      details: `Uploaded document "${req.file.originalname}" for passenger ${passengerId}`,
      performedByAdminId: req.user.id,
    });

    res.json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

exports.downloadPassengerDocument = async (req, res, next) => {
  try {
    const { id: bookingId, passengerId, docId } = req.params;
    const targetDocId = docId || req.query.docId;
    const tenantId = req.user.tenantId || "default";

    // 1. Role-based permissions
    if (req.user.role === "guide") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Guides are not permitted to access documents.",
        });
    }

    // 2. Fetch booking to check ownership / existence
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    // 3. Fetch document metadata
    let doc = null;
    if (targetDocId) {
      doc = await prisma.bookingDocument.findFirst({
        where: { id: String(targetDocId), bookingId, tenantId },
      });
    } else {
      doc = await prisma.bookingDocument.findFirst({
        where: { bookingId, passengerId, tenantId },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found." });
    }

    // 4. Download content
    const { buffer } = await supabaseStorage.downloadFile(doc.storagePath);

    res.setHeader("Content-Type", doc.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(doc.originalFileName)}"`,
    );
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

exports.deletePassengerDocument = async (req, res, next) => {
  try {
    const { id: bookingId, passengerId, docId } = req.params;
    const targetDocId = docId || req.query.docId;
    const tenantId = req.user.tenantId || "default";

    if (req.user.role === "guide") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Guides are not permitted to delete documents.",
        });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    let doc = null;
    if (targetDocId) {
      doc = await prisma.bookingDocument.findFirst({
        where: { id: String(targetDocId), bookingId, tenantId },
      });
    } else {
      doc = await prisma.bookingDocument.findFirst({
        where: { bookingId, passengerId, tenantId },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found." });
    }

    try {
      await supabaseStorage.deleteFile(doc.storagePath);
    } catch (err) {
      console.error("[DELETE CONTROLLER] Storage delete failed:", err.message);
    }

    await prisma.bookingDocument.delete({
      where: { id: doc.id },
    });

    await logBookingActivity({
      bookingId,
      action: "DOCUMENT_DELETED",
      details: `Deleted document "${doc.originalFileName}" for passenger ${doc.passengerId || passengerId}`,
      performedByAdminId: req.user.id,
    });

    res.json({ success: true, message: "Document removed successfully." });
  } catch (error) {
    next(error);
  }
};

exports.cancelBookingWithRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, cancellationCharges, refundAmount, refundPaymentMode } =
      req.body;
    const tenantId = resolveTenantId(req);
    const role = req.user?.role;

    const whereCondition = role === "superadmin" || role === "admin"
      ? { OR: [{ id }, { bookingId: id }] }
      : { OR: [{ id, tenantId }, { bookingId: id, tenantId }] };

    const booking = await prisma.booking.findFirst({
      where: whereCondition,
      include: { tripRef: true },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    // ── Guard: already cancelled/rejected bookings cannot be cancelled again ──
    if (booking.status === "cancelled" || booking.status === "rejected") {
      return res
        .status(409)
        .json({
          success: false,
          message: "Booking is already cancelled. No further cancellation allowed.",
        });
    }

    const charges = parseFloat(cancellationCharges) || 0;
    const requestedRefund = parseFloat(refundAmount);
    const hasRefundRequested = refundAmount !== undefined &&
      refundAmount !== null &&
      String(refundAmount).trim() !== "";
    const refund = hasRefundRequested ? requestedRefund : 0;

    // ── REFUND VALIDATION (server-authoritative, never trust the client) ──
    // Collected amount is derived from actual verified payment records.
    const paymentTotals = await sumVerifiedPaymentsForBooking(prisma, booking.id);
    const collectedFromRecords = paymentTotals.sum;
    // Legacy bookings may have advancePaid recorded without payment rows.
    const collected = Math.max(collectedFromRecords, Number(booking.advancePaid) || 0);

    if (hasRefundRequested && Number.isNaN(requestedRefund)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid refundAmount provided" });
    }

    if (hasRefundRequested && refund <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Refund amount must be greater than zero",
        });
    }

    if (hasRefundRequested && collected <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Cannot process refund: no payment was collected for this booking",
        });
    }

    const refundableAmount = Math.min(collected, Number(booking.advancePaid) || collected);
    if (hasRefundRequested && refund > refundableAmount) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Refund amount ₹${refund} exceeds collected/refundable amount ₹${refundableAmount}`,
        });
    }

    // ── Duplicate refund prevention ──
    const existingRefund = await prisma.accountingEntry.findFirst({
      where: {
        bookingId: booking.bookingId,
        referenceNumber: { contains: `REFUND-${booking.bookingId}` },
      },
    });
    if (existingRefund) {
      return res
        .status(409)
        .json({
          success: false,
          message: "A refund has already been recorded for this booking",
        });
    }

    // ── Atomic: cancel booking + cancel tickets + record refund accounting entry ──
    const refundApplied = refund > 0;
    const result = await prisma.$transaction(async (tx) => {
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "cancelled",
          paymentStatus: refundApplied ? PAYMENT_STATUS.REFUNDED : normalizePaymentStatus(booking.paymentStatus),
          notes:
            `${booking.notes || ""}\n[Cancellation Reason: ${reason || "Not provided"} | Charges: ₹${charges} | Refunded: ₹${refund} (${refundPaymentMode || "UPI"})]`.trim(),
          remainingAmount: 0,
        },
      });

      // Cancel associated train tickets
      if (booking.bookingId) {
        const trainTickets = await tx.trainTicket.findMany({
          where: { bookingId: booking.bookingId },
        });

        if (trainTickets.length > 0) {
          await tx.trainTicket.updateMany({
            where: { bookingId: booking.bookingId },
            data: {
              ticketStatus: "CANCELLED",
              cancellationReason: `Booking Cancelled: ${reason || "No reason specified"}`,
              ...(refundApplied
                ? { refundAmount: Math.min(refund / trainTickets.length, trainTickets.reduce((s, t) => s + (Number(t.cost) || 0), 0) || refund) }
                : {}),
            },
          });

          for (const ticket of trainTickets) {
            await tx.trainTicketHistory.create({
              data: {
                ticketId: ticket.id,
                action: "CANCEL",
                fromStatus: ticket.ticketStatus,
                toStatus: "CANCELLED",
                notes: `Auto-cancelled due to booking cancellation. Reason: ${reason || "None"}`,
                performedById: req.user.id,
              },
            }).catch(() => {});
          }
        }
      }

      // Record refund in accounting ledger (only after validation passed above)
      if (refundApplied && booking.bookingId) {
        let normalizedPaymentMode = "UPI";
        if (refundPaymentMode) {
          const upper = String(refundPaymentMode).toUpperCase();
          if (upper.includes("CASH")) normalizedPaymentMode = "CASH";
          else if (upper.includes("BANK") || upper.includes("NET")) normalizedPaymentMode = "BANK_TRANSFER";
          else normalizedPaymentMode = "UPI";
        }

        await tx.accountingEntry.create({
          data: {
            tenantId: booking.tenantId || tenantId || "default",
            bookingId: booking.bookingId,
            amount: refund,
            paymentMode: normalizedPaymentMode,
            referenceNumber: `REFUND-${booking.bookingId}-${Date.now()}`,
            notes: `Refund for Cancelled Booking #${booking.bookingId} (${booking.fullName || "Customer"}). Reason: ${reason || "Not specified"}`,
            status: "APPROVED",
            salespersonId: booking.salesAdminId || req.user.id,
            actionedById: req.user.id,
          },
        });
      }

      return updatedBooking;
    });

    // Log booking activity (best-effort, outside the money transaction)
    try {
      await logBookingActivity({
        bookingId: booking.id,
        action: "STATUS_CHANGE",
        details: `Booking Cancelled. Refund of ₹${refund} processed via ${refundPaymentMode || "UPI"}. Reason: ${reason || "None"}.`,
        performedByAdminId: req.user.id,
      });
    } catch (actErr) {
      console.warn("[CANCEL] Activity log warning:", actErr.message);
    }

    // Send cancellation email using the real email architecture (lib/email).
    if (booking.email) {
      try {
        const { sendEmail, templates } = require("../lib/email");
        const templateData = templates.cancellation(result);
        await sendEmail({
          to: booking.email,
          subject: templateData.subject,
          html: templateData.html,
          type: "cancellation",
          bookingId: booking.id,
          prisma,
          attachments: [],
        });
      } catch (emailErr) {
        // Never crash the cancellation, but do not silently swallow: log with full context.
        console.error("[CANCEL] Failed to send cancellation email:", {
          bookingId: booking.id,
          reason: emailErr.message,
        });
      }
    }

    return res.json({
      success: true,
      message:
        "Booking cancelled, tickets cancelled, and refund recorded successfully.",
      booking: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Plain booking status update — separate responsibility from cancellation.
 * Only mutates `status`. Never touches payments, refunds, amounts, or emails.
 *
 * Allowed transitions (see utils/bookingStatus.js):
 *   pending → confirmed, pending → cancelled, confirmed → cancelled
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = resolveTenantId(req);
    const role = req.user?.role;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "status is required" });
    }

    const whereCondition = role === "superadmin" || role === "admin"
      ? { OR: [{ id }, { bookingId: id }] }
      : { OR: [{ id, tenantId }, { bookingId: id, tenantId }] };

    const booking = await prisma.booking.findFirst({ where: whereCondition });
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    const transitionError = validateBookingStatusTransition(
      booking.status,
      status,
    );
    if (transitionError) {
      return res.status(400).json({ success: false, message: transitionError });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { status },
    });

    try {
      await logAction({
        tenantId,
        actorUserId: req.user.id,
        action: "booking_status_update",
        entityType: "booking",
        entityId: booking.id,
        beforeData: { status: booking.status },
        afterData: { status },
        ipAddress: req.ip || null,
      });

      await logBookingActivity({
        bookingId: booking.id,
        action: "STATUS_CHANGE",
        details: `Booking status changed from "${booking.status}" to "${status}"`,
        performedByAdminId: req.user.id,
      });
    } catch (logErr) {
      console.error("Non-critical logging error in updateBookingStatus:", logErr);
    }

    return res.json({
      success: true,
      message: "Booking status updated",
      data: updatedBooking,
    });
  } catch (error) {
    next(error);
  }
};
