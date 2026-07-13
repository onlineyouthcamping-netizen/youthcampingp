const { prisma } = require('../lib/prisma');
const bookingCountCache = new Map();
const { syncBookingToSheets } = require('../utils/googleSheetsSync');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { generateBookingId } = require('../utils/bookingIdGenerator');
const { logAction } = require('../utils/auditLogger');
const { logBookingActivity } = require('../utils/bookingActivityLogger');
const { verifySignedPayload } = require('./bookingLinkController');
const cache = require('../lib/cache');

// Helper to safely parse dates and avoid crashes with "Invalid Date"
const safeParseDate = (dateVal) => {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
};

// Safe monetary amount validation — rejects NaN, Infinity, negative, and non-finite values
function validateAmount(value, label = 'amount') {
  if (value === undefined || value === null) {
    const err = new Error(`${label} is required`);
    err.statusCode = 400;
    throw err;
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) {
    const err = new Error(`Invalid ${label}: must be a non-negative finite number`);
    err.statusCode = 400;
    throw err;
  }
  return num;
}

const sha256 = (value) =>
  crypto.createHash('sha256').update(String(value)).digest('hex');

const getIpHash = (req) => {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.ip || '';
  return ip ? sha256(ip) : null;
};

const FALLBACK_JOINING_POINTS = [
  { cityName: 'Delhi', deductionAmount: 0, skipDays: 0, pickupPoint: 'Majnu ka Tilla' },
  { cityName: 'Mumbai', deductionAmount: 1500, skipDays: 1, pickupPoint: 'Bandra Terminus' },
  { cityName: 'Ahmedabad', deductionAmount: 1000, skipDays: 1, pickupPoint: 'Kalupur Station' },
  { cityName: 'Bengaluru', deductionAmount: 2000, skipDays: 2, pickupPoint: 'Majestic Terminal' },
  { cityName: 'Pune', deductionAmount: 1500, skipDays: 1, pickupPoint: 'Pune Railway Station' },
  { cityName: 'Direct Join', deductionAmount: 2500, skipDays: 2, pickupPoint: 'Base Camp / Destination' }
];

const parseJsonArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
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
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

async function verifyAndCalculateBooking(trip, body, isAdmin, tx = prisma) {
  // 1. Verify trip status (for public users)
  if (!isAdmin) {
    if (trip.status !== 'published' || trip.isActive === false) {
      throw new Error('This trip is currently unavailable for booking');
    }
  }

  // 2. Verify departureDate
  if (!body.departureDate && !body.travelDate) {
    throw new Error('Departure date is required');
  }
  const rawDate = body.departureDate || body.travelDate;
  const targetDateStr = formatDateStr(rawDate);
  if (!targetDateStr) {
    throw new Error('Invalid departure date format');
  }

  // Check if date is in the past
  const depDate = new Date(targetDateStr);
  if (!isAdmin) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (depDate < today) {
      throw new Error('Departure date cannot be in the past');
    }
  }

  // Check if date exists in availableDates
  const availableDates = parseJsonArray(trip.availableDates);
  let dateEntry = null;
  for (const entry of availableDates) {
    const entryDateStr = typeof entry === 'string' ? entry : entry?.date;
    if (formatDateStr(entryDateStr) === targetDateStr) {
      dateEntry = entry;
      break;
    }
  }

  if (!dateEntry) {
    throw new Error('Selected departure date is not available for this trip');
  }

  // Check capacity rules if available
  const numberOfTravelers = (body.passengers && Array.isArray(body.passengers)) ? body.passengers.length : 1;
  if (dateEntry && typeof dateEntry === 'object' && dateEntry.capacity !== undefined) {
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
          lte: lteDate
        },
        status: { notIn: ['cancelled', 'rejected'] }
      },
      _sum: {
        numberOfTravelers: true
      }
    });

    const totalBooked = bookedCount._sum.numberOfTravelers || 0;
    if (totalBooked + numberOfTravelers > capacity) {
      throw new Error(`This departure is fully booked. Only ${Math.max(0, capacity - totalBooked)} spots remaining.`);
    }
  }

  // 3. Resolve joining city / variant flexibly
  const rawPickupCity = String(body.pickupCity || 'Delhi').trim();
  const normalizedTarget = rawPickupCity.toLowerCase();
  let selectedCityObj = null;

  // Search variants
  const variants = parseJsonArray(trip.variants);
  const vMatch = variants.find(v => {
    const loc = String(v.location || v.cityName || v.name || v.variantName || v.city || '').trim().toLowerCase();
    return loc === normalizedTarget || (loc.length > 0 && (loc.includes(normalizedTarget) || normalizedTarget.includes(loc)));
  });

  if (vMatch) {
    const locName = vMatch.location || vMatch.cityName || vMatch.name || vMatch.variantName || rawPickupCity;
    const variantPrice = Math.round(Number(vMatch.discountedPrice) || Number(vMatch.originalPrice) || 0);
    selectedCityObj = {
      cityName: locName,
      price: variantPrice > 0 ? variantPrice : Math.round(Number(trip.price) || 0),
      skipDays: Number(vMatch.skipDays) || 0,
      excludeTravel: vMatch.excludeTravel === true
    };
  }

  // Search pickupCities
  if (!selectedCityObj) {
    const pickupCities = parseJsonArray(trip.pickupCities);
    const cMatch = pickupCities.find(c => {
      const loc = String(c.cityName || c.location || c.name || '').trim().toLowerCase();
      return loc === normalizedTarget || (loc.length > 0 && (loc.includes(normalizedTarget) || normalizedTarget.includes(loc)));
    });

    if (cMatch) {
      const deduction = Math.round(Number(cMatch.deductionAmount) || 0);
      selectedCityObj = {
        cityName: cMatch.cityName || cMatch.location || rawPickupCity,
        price: Math.round(Math.max(0, (Number(trip.price) || 0) - deduction)),
        skipDays: Number(cMatch.skipDays) || 0,
        excludeTravel: false
      };
    }
  }

  // Search fallback joining points
  if (!selectedCityObj) {
    const fMatch = FALLBACK_JOINING_POINTS.find(p => {
      const loc = String(p.cityName || '').trim().toLowerCase();
      return loc === normalizedTarget || (loc.length > 0 && (loc.includes(normalizedTarget) || normalizedTarget.includes(loc)));
    });

    if (fMatch) {
      selectedCityObj = {
        cityName: fMatch.cityName,
        price: Math.round(Math.max(0, (Number(trip.price) || 0) - fMatch.deductionAmount)),
        skipDays: fMatch.skipDays,
        excludeTravel: false
      };
    }
  }

  // Graceful default if city is custom or not mapped
  if (!selectedCityObj) {
    selectedCityObj = {
      cityName: rawPickupCity,
      price: Math.round(Number(trip.price) || 0),
      skipDays: 0,
      excludeTravel: false
    };
  }

  // 4. Calculate prices
  let originalTotalBase = 0;
  const passengers = (body.passengers && Array.isArray(body.passengers) && body.passengers.length > 0)
    ? body.passengers
    : [{ name: body.name || body.fullName || 'Lead', trainOption: body.trainClass || 'Sleeper', roomSharing: body.roomType || 'Triple Sharing' }];

  passengers.forEach((p) => {
    let travelerPrice = selectedCityObj.price;

    // Train option adjustment
    if (selectedCityObj.excludeTravel !== true) {
      const trainOptions = (trip.travelOptions && Array.isArray(trip.travelOptions) && trip.travelOptions.length > 0)
        ? trip.travelOptions
        : [
            { label: 'Sleeper', priceDelta: 0 },
            { label: '3AC', priceDelta: 2000 },
            { label: 'No Train', priceDelta: -1500 }
          ];
      const tOpt = trainOptions.find(opt => opt.label === p.trainOption);
      if (tOpt) {
        travelerPrice += Math.round(Number(tOpt.priceDelta) || 0);
      }
    }

    // Room sharing option adjustment
    const roomOptions = (trip.roomOptions && Array.isArray(trip.roomOptions) && trip.roomOptions.length > 0)
      ? trip.roomOptions
      : [
          { label: 'Triple Sharing', priceDelta: 0 },
          { label: 'Double Sharing', priceDelta: 1500 },
          { label: 'Quad Sharing', priceDelta: -500 }
        ];
    const rOpt = roomOptions.find(opt => opt.label === p.roomSharing);
    if (rOpt) {
      travelerPrice += Math.round(Number(rOpt.priceDelta) || 0);
    }

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
        where: { tokenHash, tenantId: trip.tenantId || 'default' }
      });
    } else {
      sourceLink = await tx.bookingLink.findFirst({
        where: { id: body.sourceBookingLinkId, tenantId: trip.tenantId || 'default' }
      });
    }
    if (sourceLink && sourceLink.customAmount) {
      customDepositPerPax = Math.round(sourceLink.customAmount);
    }
  }

  const paymentMode = body.paymentMode || 'Partial Payment';
  if (paymentMode === 'Full Payment') {
    gstAmount = Math.round(fullPackageGst);
    depositGst = Math.round(fullPackageGst);
    finalTotal = Math.round(fullPackageTotal);
    advancePaid = Math.round(finalTotal);
    remainingBalance = 0;
  } else {
    // Partial Payment
    const depositPerPax = customDepositPerPax && customDepositPerPax > 0 ? customDepositPerPax : 2000;
    const partialBaseAmount = Math.round(depositPerPax * numberOfTravelers);
    depositGst = Math.round(partialBaseAmount * gstRate);
    gstAmount = Math.round(fullPackageGst);
    finalTotal = Math.round(partialBaseAmount + depositGst);
    advancePaid = Math.round(finalTotal);
    remainingBalance = Math.round(fullPackageTotal - finalTotal);
  }

  // paymentStatus resolution:
  // If not admin, we force paymentStatus to 'Pending' (never allow Paid or Partial directly without admin verification)
  let paymentStatus = 'Pending';
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
    adjustedPrice: Math.round(selectedCityObj.price)
  };
}

// ────────────────────────────────────────────
// BOOKING MANAGEMENT
// ────────────────────────────────────────────

exports.getBookings = async (req, res, next) => {
  const start = Date.now();
  try {
    const { status, tripId, paymentStatus, payment_status, search, salesAdminId, balanceOnly, bookingStart, bookingEnd, depStart, depEnd } = req.query;

    // 1. Pagination parameters parse
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 25;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const where = { tenantId: req.user.tenantId };

    // 2. Map status filters
    if (status && status !== 'all') {
      if (status === 'confirmed') {
        where.status = 'confirmed';
      } else if (status === 'pending') {
        where.status = { not: 'confirmed' };
      } else {
        where.status = status;
      }
    }

    if (tripId && tripId !== 'all') where.tripId = tripId;
    if (paymentStatus && paymentStatus !== 'all') where.paymentStatus = paymentStatus;
    if (payment_status && payment_status !== 'all') where.payment_status = payment_status;

    if (balanceOnly === 'true' || balanceOnly === true) {
      where.remainingAmount = { gt: 0 };
    }

    const authCheckTime = Date.now();
    // Role-based constraint: sales can only see bookings sourced from their own salesAdminId.
    if (req.user?.role === 'sales') {
      where.salesAdminId = req.user.id;
    } else if (req.user?.role === 'guide') {
      const assignments = await prisma.tripAssignment.findMany({
        where: { guideId: req.user.id }
      });
      const assignedTripIds = assignments.map(a => a.tripId);
      if (tripId && tripId !== 'all') {
        if (assignedTripIds.includes(tripId)) {
          where.tripId = tripId;
        } else {
          where.tripId = 'none';
        }
      } else {
        where.tripId = { in: assignedTripIds };
      }
    } else if (salesAdminId && salesAdminId !== 'all') {
      where.salesAdminId = salesAdminId;
    }
    const authDuration = Date.now() - authCheckTime;

    // Search query map
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { bookingId: { contains: search, mode: 'insensitive' } }
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
      totalPromise = prisma.booking.count({ where }).then(c => {
        bookingCountCache.set(cacheKey, { count: c, expiresAt: Date.now() + 30000 });
        return c;
      });
    }

    const queryStart = Date.now();
    const [totalCount, bookings] = await Promise.all([
      totalPromise,
      prisma.booking.findMany({
        where,
        select: {
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
          baseAmount: true,
          gstAmount: true,
          sourceMeta: true,
          passengers: true,
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
        orderBy: { createdAt: 'desc' }
      })
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
        hasPreviousPage
      }
    };

    if (process.env.ENABLE_PERFORMANCE_METRICS === 'true') {
      const duration = Date.now() - start;
      const payloadBytes = Buffer.byteLength(JSON.stringify(resBody));
      console.log(`[METRICS] getBookings - Total: ${duration}ms, Auth: ${authDuration}ms, Query: ${queryDuration}ms, Rows: ${bookings.length}, Payload: ${payloadBytes} bytes`);
    }

    res.status(200).json(resBody);
  } catch (error) { next(error); }
};

// Alias for bookingRoutes.js
exports.getAllBookings = exports.getBookings;

exports.getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const where = { id, tenantId };
    if (req.user?.role === 'sales') {
      where.salesAdminId = req.user.id;
    }

    const booking = await prisma.booking.findFirst({
      where,
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
      }
    });

    if (!booking) {
      console.warn(`⚠️ [getBookingById] Booking ${id} not found for tenant ${tenantId}`);
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    let extra = {};
    let persons = [];
    if (booking.passengers) {
      let parsed = booking.passengers;
      if (typeof booking.passengers === 'string') {
        try {
          parsed = JSON.parse(booking.passengers);
        } catch (e) {
          console.error("Failed to parse passengers JSON:", e);
        }
      }
      if (parsed && typeof parsed === 'object') {
        extra = parsed.details || {};
        persons = parsed.persons || [];
      }
    }

    // Connected ecosystem operational summary lookup
    const authScope = req.user?.role === 'sales' ? `sales-${req.user.id}` : (req.user?.role || 'admin');
    const opsSummary = await buildBookingOpsSummary(booking, tenantId, authScope);

    const mappedBooking = { 
      ...booking, 
      ...extra, 
      ticketStatus: booking.trainTicketStatus || extra.ticketStatus || "NOT BOOKED",
      passengers: persons, 
      opsSummary 
    };

    res.json({ success: true, data: mappedBooking });
  } catch (error) {
    console.error(`🔥 [getBookingById Error] ID: ${req.params.id}:`, error);
    next(error);
  }
};

async function buildBookingOpsSummary(booking, tenantId, authScope = 'admin') {
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

    const [ticketReq, accountingTotals, seatConfig, roomAllocCount, vehicleAllocCount, completedChecklistCount] = await Promise.all([
      prisma.trainTicketRequest.findFirst({
        where: { tenantId, bookingId },
        select: { status: true, _count: { select: { travellers: true } } }
      }),
      prisma.accountingEntry.groupBy({
        by: ['status'],
        where: { tenantId, bookingId },
        _sum: { amount: true }
      }),
      tripId && departureDate
        ? prisma.opsSeatConfig.findFirst({
            where: { tenantId, tripId, departureDate },
            select: { blockedSeats: true }
          })
        : null,
      tripId && departureDate
        ? prisma.opsRoomAllocation.count({ where: { tripId, departureDate, bookingId } })
        : 0,
      tripId && departureDate
        ? prisma.opsVehicleAllocation.count({ where: { tripId, departureDate, bookingId } })
        : 0,
      tripId && departureDate
        ? prisma.opsTripChecklist.count({ where: { tenantId, tripId, departureDate, isCompleted: true } })
        : 0
    ]);

    const ticketSummary = {
      status: ticketReq ? ticketReq.status : 'NOT_CREATED',
      totalTravelers: ticketReq?._count.travellers || 0,
      approved: ticketReq && ticketReq.status === 'APPROVED' ? 1 : 0,
      pending: ticketReq && (ticketReq.status === 'PENDING_VERIFICATION' || ticketReq.status === 'DRAFT') ? 1 : 0,
      cancelled: ticketReq && ticketReq.status === 'CANCELLED' ? 1 : 0
    };

    const accountingByStatus = Object.fromEntries(
      accountingTotals.map((row) => [row.status, row._sum.amount || 0])
    );
    const approvedCollection = accountingByStatus.APPROVED || 0;
    const pendingCollection = accountingByStatus.PENDING || 0;
    const bookingTotal = booking.totalAmount || 0;
    const remainingAmount = Math.max(0, bookingTotal - approvedCollection);
    const derivedCollectionStatus = approvedCollection >= bookingTotal ? 'Paid' : approvedCollection > 0 ? 'Partially Paid' : 'Pending';

    const accountingSummary = {
      bookingTotal,
      approvedCollection,
      pendingCollection,
      remainingAmount,
      derivedCollectionStatus
    };

    // 3. Operations Summary
    const opsSummaryData = {
      departureWorkspaceState: departureDate ? 'ACTIVE' : 'NO_DATE',
      seatState: seatConfig ? (seatConfig.blockedSeats > 0 ? 'BLOCKED' : 'CONFIGURED') : 'AVAILABLE',
      roomAllocationState: roomAllocCount > 0 ? 'ALLOCATED' : 'UNASSIGNED',
      vehicleAllocationState: vehicleAllocCount > 0 ? 'ALLOCATED' : 'UNASSIGNED',
      sopCompletedCount: completedChecklistCount
    };

    let alertCount = ticketSummary.pending > 0 ? 1 : 0;
    if (remainingAmount > 0) {
      const now = new Date();
      if (departureDate) {
        const diffDays = Math.ceil((new Date(departureDate) - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) alertCount += 1;
      }
    }

    const result = {
      bookingLinkSource: booking.sourceBookingLink ? booking.sourceBookingLink.tokenPrefix : 'Direct / Manual',
      salespersonOwner: booking.salesAdminId || 'Unassigned',
      travelerCount: booking.numberOfTravelers || 1,
      ticketSummary,
      accountingSummary,
      operationsSummary: opsSummaryData,
      alertCount
    };

    await cache.set(cacheKey, result, 15); // Cache for 15s
    return result;
  } catch (err) {
    console.error('buildBookingOpsSummary error:', err);
    return null;
  }
}

const parseCookies = (req) => {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
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
        const authHeader = req.headers.authorization || '';
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.slice('Bearer '.length).trim();
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const admin = await prisma.admin.findUnique({
            where: { id: decoded.id }
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
      where: { bookingId: String(bookingId) }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!isAuthorized) {
      return res.status(401).json({ success: false, message: 'Unauthorized access to booking details' });
    }

    // Map co-travelers to safe list (only name, gender, age)
    let persons = [];
    if (booking.passengers && typeof booking.passengers === 'object') {
      const rawPersons = Array.isArray(booking.passengers) ? booking.passengers : (booking.passengers.persons || []);
      persons = rawPersons.map(p => ({
        name: p.name,
        gender: p.gender,
        age: p.age ? Number(p.age) : null
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
      passengers: persons
    };

    res.json({ success: true, data: publicData });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const {
      name, fullName, phone, mobile, tripId: inputTripId, status, paymentMode, notes, email, departureDate,
      pickupCity, skipDays, adjustedPrice, joiningDate,
      sourceBookingLinkId, sourceBookingLinkToken, sourceBookingLinkPayload, sourceBookingLinkSignature
    } = req.body;
    const targetName = name || fullName;
    const targetPhone = phone || mobile;

    const tenantId = req.user?.tenantId || 'default';

    if (!targetName || !targetPhone || !inputTripId) {
      return res.status(400).json({ success: false, message: 'Required fields missing: Name, Phone, and Trip are mandatory' });
    }

    let tripId = inputTripId;
    let targetTrip = await prisma.trip.findFirst({
      where: { id: tripId, tenantId }
    });

    if (!targetTrip) {
      // Fallback: Resolve by slug or title
      targetTrip = await prisma.trip.findFirst({
        where: {
          OR: [
            { slug: inputTripId },
            { title: inputTripId },
            ...(req.body.tripName ? [{ title: req.body.tripName }, { slug: req.body.tripName }] : [])
          ],
          tenantId
        }
      });
      if (targetTrip) {
        tripId = targetTrip.id;
      } else {
        return res.status(400).json({ success: false, message: 'Selected Trip is invalid or no longer exists in the system' });
      }
    }

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');

    // Optional link attribution + expiry enforcement
    let sourceLink = null;
    let linkMetadata = null;
    if (sourceBookingLinkId || sourceBookingLinkToken || sourceBookingLinkPayload) {
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
        linkMetadata = verifySignedPayload(sourceBookingLinkPayload, sourceBookingLinkSignature);
      }

      if (!sourceLink) {
        return res.status(410).json({ success: false, message: 'Booking link is invalid or no longer available' });
      }

      const now = Date.now();
      if (sourceLink.status === 'used' || sourceLink.completedCount > 0) {
        return res.status(410).json({ success: false, message: 'This booking link has already been used' });
      }

      if (sourceLink.status === 'deactivated' || sourceLink.status === 'revoked') {
        return res.status(410).json({ success: false, message: 'This booking link has been deactivated' });
      }

      if (sourceLink.status !== 'active' || (sourceLink.expiresAt && sourceLink.expiresAt.getTime() < now)) {
        await prisma.bookingLink.update({
          where: { id: sourceLink.id },
          data: { status: 'expired' },
        });
        return res.status(410).json({ success: false, message: 'Booking link has expired' });
      }

      // Basic integrity check (link trip should match the booking trip)
      if (String(sourceLink.tripId) !== String(tripId)) {
        return res.status(400).json({ success: false, message: 'Trip mismatch for this booking link' });
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
              return res.status(400).json({ success: false, message: 'Invalid manual booking ID format. Must match /^BK-[0-9A-Z]{12}$/' });
            }
            // Check for duplicates in database before insertion
            const existing = await prisma.booking.findUnique({
              where: { bookingId: req.body.bookingId }
            });
            if (existing) {
              return res.status(400).json({ success: false, message: 'Manual booking ID already exists in the system' });
            }
            currentBookingId = req.body.bookingId;
          }
        } else {
          currentBookingId = generateBookingId();
        }

        booking = await prisma.$transaction(async (tx) => {
          // Recompute and check capacity inside transaction context
          const calculations = await verifyAndCalculateBooking(targetTrip, req.body, isAdmin, tx);

          const linkedName = linkMetadata?.customerName || targetName;
          const linkedPhone = linkMetadata?.customerPhone || targetPhone;
          const linkedEmail = linkMetadata?.customerEmail || email || null;
          const linkedTravelerCount = linkMetadata?.travelerCount || req.body.passengers?.length || 1;

          const created = await tx.booking.create({
            data: {
              tenantId,
              bookingId: currentBookingId,
              name: linkedName, fullName: linkedName,
              phone: linkedPhone, mobile: linkedPhone,
              tripId,
              tripName: targetTrip ? targetTrip.title : 'Manual Booking',
              amount: calculations.amount,
              totalAmount: calculations.totalAmount,
              advancePaid: calculations.advancePaid,
              remainingAmount: calculations.remainingAmount,
              status: 'pending',
              paymentStatus: 'Pending / Manual Verification',
              paymentMode: paymentMode || 'UPI',
              notes: notes || '',
              email: linkedEmail,
              departureDate: departureDate ? new Date(departureDate) : null,
              pickupCity: calculations.pickupCity || null,
              skipDays: calculations.skipDays,
              adjustedPrice: calculations.adjustedPrice,
              joiningDate: joiningDate ? new Date(joiningDate) : null,
              age: req.body.age ? parseInt(req.body.age) : null,
              gender: req.body.gender || null,
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
              salesAdminId: sourceLink ? sourceLink.createdByAdminId : (req.user ? (req.user.role === 'sales' ? req.user.id : req.body.salesAdminId || null) : null),
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
                status: 'used',
                completedCount: { increment: 1 },
                lastCompletedAt: new Date(),
              },
            });

            await tx.bookingLinkEvent.create({
              data: {
                tenantId,
                bookingLinkId: sourceLink.id,
                type: 'booking_created',
                ipHash: getIpHash(req),
                userAgent: req.headers['user-agent']?.toString(),
              },
            });
          }

          return created;
        });
        break;
      } catch (error) {
        attempts++;
        if (error.code === 'P2002' && error.meta?.target?.includes('bookingId') && attempts < maxAttempts) {
          console.warn(`[BOOKING_COLLISION] Retrying admin booking creation. Attempt: ${attempts}`);
          continue;
        }
        if (attempts >= maxAttempts) {
          throw new Error('Server failed to generate a unique booking ID after multiple attempts.');
        }
        throw error;
      }
    }

    if (!isAdmin) {
      const confirmToken = jwt.sign({ bookingId: booking.bookingId }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.cookie(`confirm_token_${booking.bookingId}`, confirmToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: `/api/bookings/lookup/${booking.bookingId}`
      });
    }

    await logBookingActivity({
      bookingId: booking.id,
      action: 'CREATE',
      details: `Booking created for ${booking.name} (Trip: ${booking.tripName || 'Manual Booking'})`,
      performedByAdminId: req.user ? req.user.id : null
    });

    // Trigger simulated email confirmation log automatically on booking creation ONLY if confirmed
    if (booking.status === 'Confirmed' || booking.status === 'confirmed' || booking.paymentStatus === 'Paid' || booking.paymentStatus === 'paid') {
      try {
        const { sendEmail, templates } = require('../lib/email');
        const templateData = templates.confirmation(booking);
        await sendEmail({
          to: booking.email || 'info@youthcamping.com',
          subject: templateData.subject,
          html: templateData.html,
          type: 'confirmation',
          bookingId: booking.id,
          prisma,
          attachments: []
        });
        console.log(`📧 Automatically logged booking confirmation email for booking ${booking.bookingId}`);
      } catch (emailErr) {
        console.error('Failed to trigger automatic booking confirmation email:', emailErr.message);
      }
    }

    res.status(201).json({ success: true, data: booking, message: 'Booking created successfully' });
  } catch (error) { next(error); }
};

exports.updateBooking = async (req, res, next) => {
  try {
    const { email, reason, ...updateData } = req.body;
    delete updateData.id; delete updateData.tenantId;

    // Add email back to updateData if it exists
    if (email !== undefined) updateData.email = email;

    // Explicitly handle passengers json mapping if custom fields are present
    const existingBooking = await prisma.booking.findFirst({
      where: { id: req.params.id, tenantId: req.user?.tenantId }
    });
    let currentPassengers = existingBooking?.passengers || { details: {}, persons: [] };
    if (typeof currentPassengers === 'string') {
      try {
        currentPassengers = JSON.parse(currentPassengers);
      } catch (e) {
        currentPassengers = { details: {}, persons: [] };
      }
    }
    if (currentPassengers && !currentPassengers.details) {
      currentPassengers = { details: currentPassengers, persons: [] };
    }

    updateData.passengers = {
      details: {
        ...currentPassengers.details,
        trainClass: updateData.trainClass !== undefined ? updateData.trainClass : currentPassengers.details.trainClass,
        ticketStatus: updateData.ticketStatus !== undefined ? updateData.ticketStatus : currentPassengers.details.ticketStatus,
        roomType: updateData.roomType !== undefined ? updateData.roomType : currentPassengers.details.roomType,
        basePrice: updateData.basePrice !== undefined ? updateData.basePrice : currentPassengers.details.basePrice,
        gstAmount: updateData.gstAmount !== undefined ? updateData.gstAmount : currentPassengers.details.gstAmount,
        foodPreference: req.body.foodPreference !== undefined ? req.body.foodPreference : currentPassengers.details.foodPreference,
        mealPreference: req.body.mealPreference !== undefined ? req.body.mealPreference : currentPassengers.details.mealPreference,
        dietary: req.body.dietary !== undefined ? req.body.dietary : currentPassengers.details.dietary,
        roomAllocation: req.body.roomAllocation !== undefined ? req.body.roomAllocation : currentPassengers.details.roomAllocation,
        guideAssignment: req.body.guideAssignment !== undefined ? req.body.guideAssignment : currentPassengers.details.guideAssignment,
        pickupStatus: req.body.pickupStatus !== undefined ? req.body.pickupStatus : currentPassengers.details.pickupStatus,
        travelStatus: req.body.travelStatus !== undefined ? req.body.travelStatus : currentPassengers.details.travelStatus,
        participantNotes: req.body.participantNotes !== undefined ? req.body.participantNotes : currentPassengers.details.participantNotes,
      },
      persons: updateData.passengers !== undefined ? updateData.passengers : currentPassengers.persons
    };

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
      updateData.baseAmount = updateData.basePrice !== null ? parseFloat(updateData.basePrice) : null;
      delete updateData.basePrice;
    }
    if (updateData.gstAmount !== undefined) {
      updateData.gstAmount = updateData.gstAmount !== null ? parseFloat(updateData.gstAmount) : null;
    }
    if (req.body.passengers && Array.isArray(req.body.passengers)) {
      updateData.numberOfTravelers = req.body.passengers.length;
    }

    if (updateData.advancePaid !== undefined) updateData.advancePaid = Number(updateData.advancePaid) || 0;
    if (updateData.totalAmount !== undefined) updateData.totalAmount = Number(updateData.totalAmount) || 0;
    if (updateData.amount !== undefined) updateData.amount = Number(updateData.amount) || 0;
    if (updateData.remainingAmount !== undefined) updateData.remainingAmount = Number(updateData.remainingAmount) || 0;
    if (updateData.age !== undefined && updateData.age !== null) updateData.age = parseInt(updateData.age) || null;
    if (updateData.departureDate !== undefined && updateData.departureDate !== null) {
      updateData.departureDate = new Date(updateData.departureDate);
    }
    if (updateData.skipDays !== undefined) updateData.skipDays = parseInt(updateData.skipDays) || 0;
    if (updateData.adjustedPrice !== undefined) updateData.adjustedPrice = parseFloat(updateData.adjustedPrice) || null;
    if (updateData.joiningDate !== undefined && updateData.joiningDate !== null && updateData.joiningDate !== "") {
      updateData.joiningDate = new Date(updateData.joiningDate);
    } else if (updateData.joiningDate === "") {
      updateData.joiningDate = null;
    }

    // Handle tripId change to sync tripName
    if (updateData.tripId) {
      const targetTrip = await prisma.trip.findFirst({
        where: { id: updateData.tripId, tenantId: req.user.tenantId }
      });
      if (targetTrip) {
        updateData.tripName = targetTrip.title;
      }
    }

    const role = req.user?.role;
    const where = { id: req.params.id, tenantId: req.user.tenantId };
    if (role === 'sales') {
      where.salesAdminId = req.user.id;
    }

    const beforeBooking = await prisma.booking.findFirst({ where });
    if (!beforeBooking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const booking = await prisma.booking.updateMany({ where, data: updateData });

    // Log audit log (normalize Decimal/Number comparison using String())
    const isReassignment = updateData.salesAdminId !== undefined && updateData.salesAdminId !== beforeBooking.salesAdminId;
    const isPriceGstChange = (updateData.baseAmount !== undefined && String(updateData.baseAmount) !== String(beforeBooking.baseAmount)) ||
                             (updateData.gstAmount !== undefined && String(updateData.gstAmount) !== String(beforeBooking.gstAmount));
    const isPaymentUpdate = (updateData.paymentStatus !== undefined && updateData.paymentStatus !== beforeBooking.paymentStatus);

    let logActionType = 'booking_update';
    if (isReassignment) logActionType = 'sales_ownership_reassignment';
    else if (isPriceGstChange) logActionType = 'price_gst_change';
    else if (isPaymentUpdate) logActionType = 'payment_update';

    await logAction({
      tenantId: req.user.tenantId,
      actorUserId: req.user.id,
      action: logActionType,
      entityType: 'booking',
      entityId: req.params.id,
      beforeData: beforeBooking,
      afterData: updateData,
      ipAddress: req.ip || null
    });

    // Log to booking activity log
    const detailParts = [];
    if (updateData.status && updateData.status !== beforeBooking.status) detailParts.push(`status changed to ${updateData.status}`);
    if (updateData.totalAmount !== undefined && updateData.totalAmount !== beforeBooking.totalAmount) detailParts.push(`total amount changed to ₹${updateData.totalAmount}`);
    if (updateData.advancePaid !== undefined && updateData.advancePaid !== beforeBooking.advancePaid) detailParts.push(`advance paid changed to ₹${updateData.advancePaid}`);
    if (updateData.paymentStatus && updateData.paymentStatus !== beforeBooking.paymentStatus) detailParts.push(`payment status changed to ${updateData.paymentStatus}`);
    if (updateData.salesAdminId && updateData.salesAdminId !== beforeBooking.salesAdminId) detailParts.push(`salesperson reassigned`);
    if (updateData.notes !== undefined && updateData.notes !== beforeBooking.notes) detailParts.push(`notes updated`);
    if (req.body.passengers !== undefined) detailParts.push(`co-travelers updated`);
    if (updateData.departureDate !== undefined) {
      const newDepStr = formatDateStr(updateData.departureDate);
      const oldDepStr = formatDateStr(beforeBooking.departureDate);
      if (newDepStr !== oldDepStr) {
        const reasonSuffix = reason ? ` (Reason: ${reason})` : '';
        detailParts.push(`departure date changed to ${newDepStr}${reasonSuffix}`);
      }
    }
    
    const activityDetails = detailParts.length > 0 ? `Booking updated: ${detailParts.join(', ')}` : 'Booking details updated';

    await logBookingActivity({
      bookingId: req.params.id,
      action: updateData.status ? 'STATUS_CHANGE' : 'DETAILS_UPDATE',
      details: activityDetails,
      performedByAdminId: req.user.id
    });

    const authScope = req.user?.role === 'sales' ? `sales-${req.user.id}` : (req.user?.role || 'admin');
    await cache.del(`admin:summary:booking:${req.user.tenantId}:${beforeBooking.bookingId}:${authScope}`);
    if (authScope !== 'admin') {
      await cache.del(`admin:summary:booking:${req.user.tenantId}:${beforeBooking.bookingId}:admin`);
    }

    res.json({ success: true, message: 'Booking updated' });
  } catch (error) { next(error); }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const role = req.user?.role;
    const where = { id, tenantId };
    if (role === 'sales') {
      where.salesAdminId = req.user.id;
    }

    const booking = await prisma.booking.findFirst({
      where,
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Spec: "reject" should move to Cancelled state (not hard-delete),
    // so the booking lifecycle remains auditable.
    await prisma.booking.updateMany({
      where,
      data: {
        status: 'cancelled',
        paymentStatus: 'Cancelled',
      },
    });

    await logAction({
      tenantId,
      actorUserId: req.user.id,
      action: 'booking_rejection',
      entityType: 'booking',
      entityId: id,
      beforeData: booking,
      afterData: { status: 'cancelled', paymentStatus: 'Cancelled' },
      ipAddress: req.ip || null
    });

    await logBookingActivity({
      bookingId: id,
      action: 'STATUS_CHANGE',
      details: 'Booking cancelled (deleted)',
      performedByAdminId: req.user.id
    });

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('🔥 [deleteBooking Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking. Please try again later.'
    });
  }
};

exports.confirmBooking = async (req, res, next) => {
  try {
    const { totalAmount, advancePaid, paymentMode, paymentStatus, email, trainTicketStatus } = req.body;

    let targetTotal, targetAdvance;
    try {
      targetTotal = validateAmount(totalAmount, 'totalAmount');
      targetAdvance = validateAmount(advancePaid, 'advancePaid');
    } catch (valErr) {
      return res.status(400).json({ success: false, message: valErr.message });
    }
    if (targetAdvance > targetTotal) {
      return res.status(400).json({ success: false, message: 'advancePaid cannot exceed totalAmount' });
    }

    const role = req.user?.role;
    const where = { id: req.params.id, tenantId: req.user.tenantId };
    if (role === 'sales') {
      where.salesAdminId = req.user.id;
    }

    const beforeBooking = await prisma.booking.findFirst({ where });
    if (!beforeBooking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const updatePayload = {
      status: 'confirmed',
      totalAmount: targetTotal,
      advancePaid: targetAdvance,
      remainingAmount: targetTotal - targetAdvance,
      paymentMode,
      paymentStatus,
      email: email || undefined,
      trainTicketStatus: trainTicketStatus || undefined
    };

    const booking = await prisma.booking.updateMany({
      where,
      data: updatePayload
    });

    await logAction({
      tenantId: req.user.tenantId,
      actorUserId: req.user.id,
      action: 'booking_approval',
      entityType: 'booking',
      entityId: req.params.id,
      beforeData: beforeBooking,
      afterData: updatePayload,
      ipAddress: req.ip || null
    });

    await logBookingActivity({
      bookingId: req.params.id,
      action: 'STATUS_CHANGE',
      details: `Booking status set to confirmed (Total: ₹${totalAmount}, Advance Paid: ₹${targetAdvance} via ${paymentMode})`,
      performedByAdminId: req.user.id
    });

    if (targetAdvance > 0) {
      const existingPayment = await prisma.payment.findFirst({
        where: { bookingId: req.params.id, tenantId: req.user.tenantId }
      });
      if (!existingPayment) {
        await prisma.payment.create({
          data: {
            bookingId: req.params.id,
            amount: targetAdvance,
            paymentMode: paymentMode || 'UPI',
            tenantId: req.user.tenantId,
            status: 'success'
          }
        });
      }
    }

    // Sync to Google Sheets
    const updatedBooking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (updatedBooking) {
      syncBookingToSheets(updatedBooking).catch(err => console.error('[SHEETS_SYNC_SILENT_ERR]', err.message));
    }

    res.json({ success: true, message: 'Booking confirmed' });
  } catch (error) { next(error); }
};

exports.getMyBookings = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const where = { tenantId };
    if (req.user?.email) {
      where.email = req.user.email;
    }
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) { next(error); }
};

exports.searchByPhone = async (req, res, next) => {
  return res.status(403).json({
    success: false,
    message: 'Public search by phone number is disabled for security and privacy reasons.'
  });
};

// ────────────────────────────────────────────
// TRIP DROPDOWN (for booking forms)
// ────────────────────────────────────────────

const tripsCache = new Map(); // tenantId -> { data, expiresAt }
const TRIPS_CACHE_TTL = 5 * 60 * 1000;

exports.getTrips = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    const cached = tripsCache.get(tenantId);
    if (cached && Date.now() < cached.expiresAt) {
      return res.status(200).json({ success: true, data: cached.data });
    }

    const trips = await prisma.trip.findMany({
      where: { tenantId },
      select: { id: true, title: true, price: true, availableDates: true }
    });
    const formatted = trips.map(t => ({ id: t.id, tripCode: t.id, title: t.title, tripName: t.title, price: t.price, availableDates: t.availableDates }));
    tripsCache.set(tenantId, { data: formatted, expiresAt: Date.now() + TRIPS_CACHE_TTL });

    res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (error) { next(error); }
};

// Aliases for bookingRoutes.js
exports.getAllTrips = exports.getTrips;

exports.createTrip = async (req, res, next) => {
  try {
    const tripCode = req.body.tripCode || req.body.id || `TRIP-${Date.now()}`;
    const tripName = req.body.tripName || req.body.title || 'Untitled Trip';

    const trip = await prisma.trip.create({
      data: {
        id: tripCode,
        title: tripName,
        slug: tripCode.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        location: req.body.location || 'TBD',
        duration: req.body.duration || 'TBD',
        description: req.body.description || 'TBD',
        tenantId: req.user.tenantId,
        price: Number(req.body.price) || 0
      }
    });
    res.status(201).json({
      success: true,
      data: { ...trip, tripCode: trip.id, tripName: trip.title }
    });
  } catch (error) { next(error); }
};

exports.updateTrip = async (req, res, next) => {
  try {
    const { id: oldId } = req.params;
    const { tripCode, tripName, ...otherData } = req.body;
    const tenantId = req.user.tenantId;

    // Map tripName to title if provided
    const updateData = { ...otherData };
    if (tripName) updateData.title = tripName;

    // Remove unwanted fields
    delete updateData.id;
    delete updateData.tenantId;

    const newId = tripCode ? tripCode.toUpperCase() : null;

    if (newId && newId !== oldId) {
      console.log(`🔄 [updateTrip] Migrating Trip ID from ${oldId} to ${newId}`);

      // 2. Perform Migration Transaction
      await prisma.$transaction(async (tx) => {
        const oldTrip = await tx.trip.findFirst({ where: { id: oldId, tenantId } });
        if (!oldTrip) throw new Error('Original trip not found');

        // Rename old slug temporarily to avoid unique constraint error
        await tx.trip.update({
          where: { id: oldId },
          data: { slug: `${oldTrip.slug}-old-${Date.now()}` }
        });

        // Create new record
        const newTripData = {
          ...oldTrip,
          ...updateData,
          id: newId,
          tenantId
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
            tripName: tripName || oldTrip.title
          }
        });

        // Inquiries
        await tx.inquiry.updateMany({
          where: { tripId: oldId, tenantId },
          data: {
            tripId: newId,
            tripTitle: tripName || oldTrip.title
          }
        });

        // Reviews
        await tx.review.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripId: newId }
        });

        // Trip Vendors
        await tx.tripVendor.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripId: newId }
        });

        // 4. Delete old record
        await tx.trip.delete({ where: { id: oldId } });
      });

      return res.json({ success: true, message: 'Trip Code and details updated successfully' });
    } else {
      // Regular update for other fields
      const trip = await prisma.trip.updateMany({
        where: { id: oldId, tenantId },
        data: updateData
      });

      // Also sync tripName in bookings if title was updated
      if (tripName) {
        await prisma.booking.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripName }
        });
        await prisma.inquiry.updateMany({
          where: { tripId: oldId, tenantId },
          data: { tripTitle: tripName }
        });
      }

      if (trip.count === 0) return res.status(404).json({ success: false, message: 'Trip not found' });
      res.json({ success: true, message: 'Trip updated successfully' });
    }
  } catch (error) {
    console.error('🔥 [updateTrip] Error:', error);
    next(error);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || 'default';

    const trip = await prisma.trip.findFirst({
      where: { id, tenantId }
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const activeBookingCount = await prisma.booking.count({
      where: { tripId: id, tenantId, status: { notIn: ['cancelled', 'rejected'] } }
    });

    if (activeBookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete trip with ${activeBookingCount} active booking(s). Please cancel or reassign bookings first.`
      });
    }

    await Promise.all([
      prisma.inquiry.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.review.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsSeatConfig.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsItinerary.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsAttraction.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsPackingItem.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsInclusionExclusion.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsFaq.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsTripChecklist.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsIncidentLog.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsHotelBooking.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsTransportFleet.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsGuidePayment.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsMiscExpense.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsTripExpense.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.opsTripLeader.deleteMany({ where: { tripId: id, tenantId } }).catch(() => {}),
      prisma.tripAssignment.deleteMany({ where: { tripId: id } }).catch(() => {}),
      prisma.tripVendor.deleteMany({ where: { tripId: id } }).catch(() => {})
    ]);

    await prisma.trip.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    console.error('deleteTrip error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete trip' });
  }
};

// ────────────────────────────────────────────
// PUBLIC BOOKING FORM SUBMISSION
// ────────────────────────────────────────────

exports.submitBookingForm = async (req, res, next) => {
  try {
    const tripCode = req.params.tripCode;
    const tenantId = req.user?.tenantId || 'default';

    // Find the trip
    let targetTrip = await prisma.trip.findFirst({
      where: { id: tripCode, tenantId }
    });

    if (!targetTrip) {
      targetTrip = await prisma.trip.findFirst({
        where: {
          OR: [
            { slug: tripCode },
            { title: tripCode }
          ],
          tenantId
        }
      });
    }

    if (!targetTrip) {
      return res.status(400).json({ success: false, message: 'Selected Trip is invalid or no longer exists in the system' });
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
          const calculations = await verifyAndCalculateBooking(targetTrip, req.body, false, tx);

          const created = await tx.booking.create({
            data: {
              bookingId: currentBookingId,
              tenantId,
              tripId: targetTrip.id, // Set resolved ID
              tripName: targetTrip.title,
              name: req.body.fullName || req.body.name || 'Unknown',
              fullName: req.body.fullName || req.body.name,
              phone: req.body.mobile || req.body.phone || '0000000000',
              mobile: req.body.mobile || req.body.phone,
              email: req.body.email || null,
              departureDate: req.body.departureDate ? new Date(req.body.departureDate) : null,
              pickupCity: calculations.pickupCity || null,
              skipDays: calculations.skipDays,
              adjustedPrice: calculations.adjustedPrice,
              joiningDate: req.body.joiningDate ? new Date(req.body.joiningDate) : null,
              age: req.body.age ? parseInt(req.body.age) : null,
              gender: req.body.gender || null,
              numberOfTravelers: req.body.passengers?.length || 1,
              baseAmount: calculations.baseAmount,
              gstAmount: calculations.gstAmount,
              depositGst: calculations.depositGst,
              amount: calculations.amount,
              totalAmount: calculations.totalAmount,
              advancePaid: calculations.advancePaid,
              remainingAmount: calculations.remainingAmount,
              status: req.body.status || 'pending',
              paymentStatus: calculations.paymentStatus,
              paymentMode: req.body.paymentMode || null,
              notes: req.body.notes || null,
              passengers: {
                details: {
                  trainClass: req.body.trainClass,
                  ticketStatus: req.body.ticketStatus,
                  roomType: req.body.roomType,
                  basePrice: calculations.adjustedPrice,
                  gstAmount: calculations.gstAmount,
                  depositGst: calculations.depositGst
                },
                persons: req.body.passengers || []
              }
            }
          });
          return created;
        });
        break;
      } catch (error) {
        attempts++;
        if (error.code === 'P2002' && error.meta?.target?.includes('bookingId') && attempts < maxAttempts) {
          console.warn(`[BOOKING_COLLISION] Retrying public booking creation. Attempt: ${attempts}`);
          continue;
        }
        if (attempts >= maxAttempts) {
          throw new Error('Server failed to generate a unique booking ID after multiple attempts.');
        }
        throw error;
      }
    }

    // Set 24 hour secure cookie to allow unauthenticated lookup on confirmation page
    const confirmToken = jwt.sign({ bookingId: booking.bookingId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.cookie(`confirm_token_${booking.bookingId}`, confirmToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: `/api/bookings/lookup/${booking.bookingId}`
    });

    // Trigger simulated email confirmation log automatically on booking submission ONLY if confirmed
    if (booking.status === 'Confirmed' || booking.status === 'confirmed' || booking.paymentStatus === 'Paid' || booking.paymentStatus === 'paid') {
      try {
        const { sendEmail, templates } = require('../lib/email');
        const templateData = templates.confirmation(booking);
        await sendEmail({
          to: booking.email || 'info@youthcamping.com',
          subject: templateData.subject,
          html: templateData.html,
          type: 'confirmation',
          bookingId: booking.id,
          prisma,
          attachments: []
        });
        console.log(`📧 Automatically logged booking confirmation email for booking ${booking.bookingId}`);
      } catch (emailErr) {
        console.error('Failed to trigger automatic booking confirmation email:', emailErr.message);
      }
    }

    res.status(201).json({ success: true, data: booking });
  } catch (error) { next(error); }
};

exports.getTripInfo = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [{ id: req.params.tripCode }, { slug: req.params.tripCode }],
        tenantId
      }
    });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
    res.json({ success: true, data: trip });
  } catch (error) { next(error); }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId || 'default';

    const booking = await prisma.booking.findFirst({
      where: { id, tenantId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        payment_status: 'confirmed',
        paymentStatus: 'Paid'
      }
    });

    await logAction({
      tenantId,
      actorUserId: req.user.id,
      action: 'payment_update',
      entityType: 'booking',
      entityId: id,
      beforeData: booking,
      afterData: { payment_status: 'confirmed', paymentStatus: 'Paid' },
      ipAddress: req.ip || null
    });

    // Sync to Google Sheets
    syncBookingToSheets(updatedBooking).catch(err => console.error('[SHEETS_SYNC_SILENT_ERR]', err.message));

    // Simulated WhatsApp trigger
    console.log(`📲 [WHATSAPP PAYMENT CONFIRMATION] Sending WhatsApp notification to customer ${booking.name} (${booking.phone}): "Your payment of ₹${booking.advancePaid || booking.totalAmount} has been confirmed! Your booking ${booking.bookingId} is now active."`);

    res.json({ success: true, message: 'Payment confirmed and WhatsApp triggered', data: updatedBooking });
  } catch (error) { next(error); }
};

exports.updateBookingUpi = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { upi_reference } = req.body;
    const tenantId = req.user?.tenantId || 'default';

    const booking = await prisma.booking.findFirst({
      where: { OR: [{ id }, { bookingId: id }], tenantId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        upi_reference,
        payment_status: 'pending',
        payment_method: 'upi'
      }
    });

    await logAction({
      tenantId: booking.tenantId || 'default',
      actorUserId: req.user?.id || null,
      action: 'payment_update',
      entityType: 'booking',
      entityId: booking.id,
      beforeData: booking,
      afterData: { upi_reference, payment_status: 'pending', payment_method: 'upi' },
      ipAddress: req.ip || null
    });

    // Sync to Google Sheets
    syncBookingToSheets(updatedBooking).catch(err => console.error('[SHEETS_SYNC_SILENT_ERR]', err.message));

    res.json({ success: true, message: 'UPI reference saved successfully', data: updatedBooking });
  } catch (error) { next(error); }
};

exports.getBookingActivityLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    // Verify booking belongs to tenant before returning logs
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      select: { id: true }
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const logs = await prisma.bookingActivityLog.findMany({
      where: { bookingId: id },
      include: {
        performedBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
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
        tenantId: req.user.tenantId || 'default',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      },
      orderBy: { name: 'asc' }
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
      select: { id: true }
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const tasks = await prisma.bookingTask.findMany({
      where: { bookingId: id },
      include: {
        assignedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
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
    const tenantId = req.user?.tenantId || 'default';

    if (!title || !assignedToId) {
      return res.status(400).json({ success: false, message: 'Title and assignedToId are required' });
    }

    // Verify booking exists and belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      select: { id: true }
    });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const task = await prisma.bookingTask.create({
      data: {
        tenantId,
        bookingId: id,
        title,
        description: description || '',
        assignedById: req.user.id,
        assignedToId,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING'
      },
      include: {
        assignedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // Log in activity log
    await logBookingActivity({
      bookingId: id,
      action: 'TASK_ASSIGNED',
      details: `Task "${title}" assigned to ${task.assignedTo?.name || 'junior'} by ${task.assignedBy?.name || 'senior'}`,
      performedByAdminId: req.user.id
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
        assignedTo: { select: { id: true, name: true } }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const updated = await prisma.bookingTask.update({
      where: { id: taskId },
      data: { status },
      include: {
        assignedBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    // Log to booking activity log
    await logBookingActivity({
      bookingId: existingTask.bookingId,
      action: 'TASK_UPDATED',
      details: `Task "${existingTask.title}" status changed to ${status}`,
      performedByAdminId: req.user.id
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────
// PASSENGER DOCUMENT UPLOAD & DOWNLOAD
// ────────────────────────────────────────────
const supabaseStorage = require('../utils/supabaseStorage');

exports.uploadPassengerDocument = async (req, res, next) => {
  try {
    const { id: bookingId, passengerId } = req.params;
    const tenantId = req.user.tenantId || 'default';

    // 1. Role-based permissions
    if (req.user.role === 'guide') {
      return res.status(403).json({ success: false, message: 'Guides are not permitted to access documents.' });
    }

    // 2. Fetch booking to check ownership / existence
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Sales role permission check: must own the booking
    if (req.user.role === 'sales' && booking.salesAdminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to upload documents for this booking.' });
    }

    // 3. File validation
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    // Size limit check: 1 MB
    if (req.file.size > 1024 * 1024) {
      return res.status(400).json({ success: false, message: 'File size must be under 1 MB.' });
    }

    // MimeType check (PDF, JPG, PNG)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Invalid file type. Only JPG, PNG, and PDF are allowed.' });
    }

    // 4. Storage execution
    const documentType = req.body.documentType || 'ID Document';
    const sanitizeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `bookings/${bookingId}/passengers/${passengerId}/${Date.now()}-${sanitizeName}`;

    let uploadResult;
    try {
      uploadResult = await supabaseStorage.uploadFile(req.file.buffer, storagePath, req.file.mimetype);
    } catch (err) {
      console.error('[UPLOAD CONTROLLER] Storage failed:', err.message);
      return res.status(500).json({ success: false, message: 'Document upload failed. Please retry later.' });
    }

    // 5. Database record creation or update
    const existingDoc = await prisma.bookingDocument.findFirst({
      where: { bookingId, passengerId, tenantId }
    });

    let doc;
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
      status: 'UPLOADED'
    };

    if (existingDoc) {
      doc = await prisma.bookingDocument.update({
        where: { id: existingDoc.id },
        data: docData
      });
    } else {
      doc = await prisma.bookingDocument.create({
        data: docData
      });
    }

    // Log booking activity
    await logBookingActivity({
      bookingId,
      action: 'DOCUMENT_UPLOADED',
      details: `Uploaded document "${req.file.originalname}" for passenger ${passengerId}`,
      performedByAdminId: req.user.id
    });

    res.json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

exports.downloadPassengerDocument = async (req, res, next) => {
  try {
    const { id: bookingId, passengerId } = req.params;
    const tenantId = req.user.tenantId || 'default';

    // 1. Role-based permissions
    if (req.user.role === 'guide') {
      return res.status(403).json({ success: false, message: 'Guides are not permitted to access documents.' });
    }

    // 2. Fetch booking to check ownership / existence
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Sales role permission check: must own the booking
    if (req.user.role === 'sales' && booking.salesAdminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to view documents for this booking.' });
    }

    // 3. Fetch document metadata
    const doc = await prisma.bookingDocument.findFirst({
      where: { bookingId, passengerId, tenantId }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // 4. Download content
    const { buffer } = await supabaseStorage.downloadFile(doc.storagePath);

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.originalFileName)}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

exports.deletePassengerDocument = async (req, res, next) => {
  try {
    const { id: bookingId, passengerId } = req.params;
    const tenantId = req.user.tenantId || 'default';

    if (req.user.role === 'guide') {
      return res.status(403).json({ success: false, message: 'Guides are not permitted to delete documents.' });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, tenantId }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role === 'sales' && booking.salesAdminId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete documents for this booking.' });
    }

    const doc = await prisma.bookingDocument.findFirst({
      where: { bookingId, passengerId, tenantId }
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    try {
      await supabaseStorage.deleteFile(doc.storagePath);
    } catch (err) {
      console.error('[DELETE CONTROLLER] Storage delete failed:', err.message);
    }

    await prisma.bookingDocument.delete({
      where: { id: doc.id }
    });

    await logBookingActivity({
      bookingId,
      action: 'DOCUMENT_DELETED',
      details: `Deleted document "${doc.originalFileName}" for passenger ${passengerId}`,
      performedByAdminId: req.user.id
    });

    res.json({ success: true, message: 'Document removed successfully.' });
  } catch (error) {
    next(error);
  }
};
