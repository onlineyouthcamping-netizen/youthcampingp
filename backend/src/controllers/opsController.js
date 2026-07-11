const { prisma } = require('../lib/prisma');
const { runAutoAllocation } = require('../utils/autoAllocationEngine');
const opsSummaryCache = new Map();

/**
 * Shared server-side India timezone (Asia/Kolkata) normalization method for departure calendar dates.
 * Converts input timestamps or dates (e.g. 2026-07-09T18:30:00.000Z, 2026-07-10T00:00:00.000Z, 2026-07-10T05:30:00.000Z)
 * to one exact normalized India calendar Date (YYYY-MM-DDT00:00:00.000Z).
 */
function normalizeDepartureDateIndia(dateInput) {
  if (!dateInput) return null;

  // If it's already a simple YYYY-MM-DD string, parse directly in UTC to avoid any locale/Intl issues
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const directDate = new Date(`${dateInput}T00:00:00.000Z`);
    if (!isNaN(directDate.getTime())) return directDate;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const indiaDateStr = formatter.format(d); // e.g. "2026-07-10"
    const resDate = new Date(`${indiaDateStr}T00:00:00.000Z`);
    if (!isNaN(resDate.getTime())) return resDate;
  } catch (e) {
    console.error('Intl formatting error in normalizeDepartureDateIndia:', e);
  }

  // Fallback to UTC parts if Intl formatting fails
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const fallbackDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

// Helper to construct departure filter
async function parseDepartureFilter(req, res, requireDepartureDate = true) {
  const { tripId: rawTripId } = req.params;
  const rawDate = req.query.departureDate || req.body.departureDate;

  if (requireDepartureDate && !rawDate) {
    res.status(400).json({ success: false, message: 'departureDate is required for departure operations' });
    return null;
  }

  const departureDate = normalizeDepartureDateIndia(rawDate);
  if (requireDepartureDate && (!departureDate || isNaN(departureDate.getTime()))) {
    res.status(400).json({ success: false, message: 'Invalid departureDate format' });
    return null;
  }

  const tenantId = req.user?.tenantId || 'default';

  let tripId = rawTripId;
  if (rawTripId) {
    const trip = await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [
          { id: rawTripId },
          { slug: rawTripId },
          { shortName: rawTripId }
        ]
      },
      select: { id: true }
    });
    if (trip) tripId = trip.id;
  }

  const where = { tenantId, tripId };
  if (departureDate) where.departureDate = departureDate;

  let bookingWhere = { tenantId, tripId, status: { notIn: ['cancelled', 'rejected'] } };
  if (departureDate) {
    const startOfDay = new Date(departureDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(departureDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    bookingWhere.departureDate = { gte: startOfDay, lte: endOfDay };
  }

  return { tenantId, tripId, departureDate, where, bookingWhere };
}

// ── VENDORS DIRECTORY ──
exports.getVendors = async (req, res) => {
  try {
    const { type } = req.query;
    const where = { tenantId: req.user.tenantId || 'default' };
    if (type) where.type = type;

    const vendors = await prisma.opsVendor.findMany({ where, orderBy: { name: 'asc' } });
    return res.json({ success: true, data: vendors });
  } catch (err) {
    console.error('getVendors error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch vendors' });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const { name, type, contactPerson, email, phone, location, rating, notes } = req.body;
    const vendor = await prisma.opsVendor.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        name,
        type,
        contactPerson,
        email,
        phone,
        location,
        rating: rating ? parseFloat(rating) : 5.0,
        notes
      }
    });
    return res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    console.error('createVendor error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create vendor' });
  }
};

// ── DAY ITINERARY GRID ──
exports.getDayItinerary = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const items = await prisma.opsDayItinerary.findMany({ where: ctx.where, orderBy: { date: 'asc' } });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('getDayItinerary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch day itinerary' });
  }
};

exports.upsertDayItinerary = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const { id, date, dayTitle, paxCount, hotelName, hotelVerified, vehicleType, vehicleVerified, remarks, guideDriverDetails, guideVerified, checkInDone } = req.body;

    let result;
    if (id) {
      result = await prisma.opsDayItinerary.update({
        where: { id },
        data: { date: date ? new Date(date) : null, dayTitle, paxCount, hotelName, hotelVerified, vehicleType, vehicleVerified, remarks, guideDriverDetails, guideVerified, checkInDone }
      });
    } else {
      result = await prisma.opsDayItinerary.create({
        data: {
          tenantId: ctx.tenantId,
          tripId: ctx.tripId,
          departureDate: ctx.departureDate,
          date: date ? new Date(date) : null,
          dayTitle,
          paxCount: paxCount || 0,
          hotelName,
          hotelVerified: !!hotelVerified,
          vehicleType,
          vehicleVerified: !!vehicleVerified,
          remarks,
          guideDriverDetails,
          guideVerified: !!guideVerified,
          checkInDone: !!checkInDone
        }
      });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('upsertDayItinerary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save day itinerary row' });
  }
};

// ── TRIP EXPENSE GRID ──
exports.getTripExpenses = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const expenses = await prisma.opsTripExpense.findMany({ where: ctx.where, orderBy: { serviceDate: 'asc' } });
    return res.json({ success: true, data: expenses });
  } catch (err) {
    console.error('getTripExpenses error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch trip expenses' });
  }
};

exports.upsertTripExpense = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const { id, serviceDate, activity, paymentDate, totalAmount, amountPaid, remarks } = req.body;

    const tot = parseFloat(totalAmount || 0);
    const paid = parseFloat(amountPaid || 0);
    const due = tot - paid;
    const paymentStatus = due <= 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Due';

    let result;
    if (id) {
      result = await prisma.opsTripExpense.update({
        where: { id },
        data: { serviceDate: serviceDate ? new Date(serviceDate) : null, activity, paymentDate: paymentDate ? new Date(paymentDate) : null, totalAmount: tot, amountPaid: paid, dueAmount: due, paymentStatus, remarks }
      });
    } else {
      result = await prisma.opsTripExpense.create({
        data: {
          tenantId: ctx.tenantId,
          tripId: ctx.tripId,
          departureDate: ctx.departureDate,
          serviceDate: serviceDate ? new Date(serviceDate) : null,
          activity,
          paymentDate: paymentDate ? new Date(paymentDate) : null,
          totalAmount: tot,
          amountPaid: paid,
          dueAmount: due,
          paymentStatus,
          remarks
        }
      });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('upsertTripExpense error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save trip expense row' });
  }
};

exports.deleteDayItinerary = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsDayItinerary.deleteMany({ where: { id } });
    return res.json({ success: true, message: 'Itinerary row deleted' });
  } catch (err) {
    console.error('deleteDayItinerary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete itinerary row' });
  }
};

exports.deleteTripExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsTripExpense.deleteMany({ where: { id } });
    return res.json({ success: true, message: 'Expense row deleted' });
  } catch (err) {
    console.error('deleteTripExpense error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete expense row' });
  }
};

// ── HOTEL BOOKINGS TRACKER ──
exports.getHotelBookings = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const bookings = await prisma.opsHotelBooking.findMany({ where: ctx.where, include: { vendor: true } });
    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error('getHotelBookings error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch hotel bookings' });
  }
};

exports.createHotelBooking = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const { hotelName, vendorId, location, checkIn, checkOut, roomType, numberOfRooms, confirmed, totalAmount, advancePaid, contactPerson, contactPhone, notes } = req.body;

    const tot = parseFloat(totalAmount || 0);
    const adv = parseFloat(advancePaid || 0);

    let booking;
    if (req.body.id) {
      booking = await prisma.opsHotelBooking.update({
        where: { id: req.body.id },
        data: {
          vendorId: vendorId || null,
          hotelName,
          location,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          roomType,
          numberOfRooms: parseInt(numberOfRooms || 1),
          confirmed: confirmed || 'UNCONFIRMED',
          totalAmount: tot,
          advancePaid: adv,
          balanceAmount: tot - adv,
          contactPerson,
          contactPhone,
          notes
        }
      });
    } else {
      booking = await prisma.opsHotelBooking.create({
        data: {
          tenantId: ctx.tenantId,
          tripId: ctx.tripId,
          departureDate: ctx.departureDate,
          vendorId: vendorId || null,
          hotelName,
          location,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          roomType,
          numberOfRooms: parseInt(numberOfRooms || 1),
          confirmed: confirmed || 'UNCONFIRMED',
          totalAmount: tot,
          advancePaid: adv,
          balanceAmount: tot - adv,
          contactPerson,
          contactPhone,
          notes
        }
      });
    }
    
    return res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error('createHotelBooking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create hotel booking' });
  }
};

exports.deleteHotelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsHotelBooking.deleteMany({ where: { id } });
    return res.json({ success: true, message: 'Hotel booking deleted' });
  } catch (err) {
    console.error('deleteHotelBooking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete hotel booking' });
  }
};

// ── TRANSPORT FLEET TRACKER ──
exports.getTransportFleet = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const fleet = await prisma.opsTransportFleet.findMany({ where: ctx.where, include: { vendor: true } });
    return res.json({ success: true, data: fleet });
  } catch (err) {
    console.error('getTransportFleet error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch transport fleet' });
  }
};

exports.createTransportFleet = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const { vehicleType, vendorId, capacity, route, pickupPoints, dropPoints, totalAmount, advancePaid, driverName, driverPhone, notes } = req.body;

    const tot = parseFloat(totalAmount || 0);
    const adv = parseFloat(advancePaid || 0);

    let vehicle;
    if (req.body.id) {
      vehicle = await prisma.opsTransportFleet.update({
        where: { id: req.body.id },
        data: {
          vendorId: vendorId || null,
          vehicleType,
          capacity: parseInt(capacity || 13),
          route,
          pickupPoints,
          dropPoints,
          totalAmount: tot,
          advancePaid: adv,
          balanceAmount: tot - adv,
          driverName,
          driverPhone,
          notes
        }
      });
    } else {
      vehicle = await prisma.opsTransportFleet.create({
        data: {
          tenantId: ctx.tenantId,
          tripId: ctx.tripId,
          departureDate: ctx.departureDate,
          vendorId: vendorId || null,
          vehicleType,
          capacity: parseInt(capacity || 13),
          route,
          pickupPoints,
          dropPoints,
          totalAmount: tot,
          advancePaid: adv,
          balanceAmount: tot - adv,
          driverName,
          driverPhone,
          notes
        }
      });
    }
    
    return res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    console.error('createTransportFleet error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create transport fleet' });
  }
};

exports.deleteTransportFleet = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsTransportFleet.deleteMany({ where: { id } });
    return res.json({ success: true, message: 'Transport vehicle deleted' });
  } catch (err) {
    console.error('deleteTransportFleet error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete transport vehicle' });
  }
};

// ── GUIDE PAYMENTS TRACKER ──
exports.getGuidePayments = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const payments = await prisma.opsGuidePayment.findMany({
      where: ctx.where,
      include: { guideAdmin: { select: { id: true, name: true } }, vendor: true, approvedBy: { select: { id: true, name: true } } }
    });
    return res.json({ success: true, data: payments });
  } catch (err) {
    console.error('getGuidePayments error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch guide payments' });
  }
};

exports.createGuidePayment = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const { guideName, guideAdminId, vendorId, daysWorked, agreedAmount, advancePaid } = req.body;

    const agreed = parseFloat(agreedAmount || 0);
    const adv = parseFloat(advancePaid || 0);

    const payment = await prisma.opsGuidePayment.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        guideAdminId: guideAdminId || null,
        vendorId: vendorId || null,
        guideName,
        daysWorked: parseInt(daysWorked || 1),
        agreedAmount: agreed,
        advancePaid: adv,
        balanceAmount: agreed - adv
      }
    });
    return res.status(201).json({ success: true, data: payment });
  } catch (err) {
    console.error('createGuidePayment error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create guide payment' });
  }
};

// ── OPERATIONAL ACCOUNTING SUMMARY (DEPARTURE SCOPED) ──
exports.getOpsAccountingSummary = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const bookingWhere = ctx.bookingWhere;

    let hotels = [], transport = [], guides = [], misc = [], expenses = [], bookings = [];
    try {
      [hotels, transport, guides, misc, expenses, bookings] = await Promise.all([
        prisma.opsHotelBooking.findMany({ where: ctx.where }).catch(() => []),
        prisma.opsTransportFleet.findMany({ where: ctx.where }).catch(() => []),
        prisma.opsGuidePayment.findMany({ where: ctx.where }).catch(() => []),
        prisma.opsMiscExpense.findMany({ where: ctx.where }).catch(() => []),
        prisma.opsTripExpense.findMany({ where: ctx.where }).catch(() => []),
        prisma.booking.findMany({ where: bookingWhere }).catch(() => [])
      ]);
    } catch (e) {
      console.error('Sub-query fetch warning in getOpsAccountingSummary:', e);
    }

    const hotelCost = (hotels || []).reduce((s, h) => s + (Number(h.totalAmount) || 0), 0);
    const transportCost = (transport || []).reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
    const guideCost = (guides || []).reduce((s, g) => s + (Number(g.agreedAmount) || 0), 0);
    const miscCost = (misc || []).reduce((s, m) => s + (Number(m.amount) || 0), 0);
    const detailedExpensesCost = (expenses || []).reduce((s, e) => s + (Number(e.totalAmount) || 0), 0);

    const totalOpsCost = hotelCost + transportCost + guideCost + miscCost + detailedExpensesCost;

    let travelerCount = (bookings || []).reduce((s, b) => s + (Number(b.numberOfTravelers) || 1), 0);
    if (travelerCount === 0) travelerCount = 1;

    const perPersonOpsCost = totalOpsCost / travelerCount;

    // Fetch accounting entries and ticket requests for readiness summaries
    const bookingIds = (bookings || []).map(b => b.bookingId).filter(Boolean);
    let allAccounting = [];
    let ticketRequests = [];
    if (bookingIds.length > 0) {
      try {
        [allAccounting, ticketRequests] = await Promise.all([
          prisma.accountingEntry.findMany({ where: { bookingId: { in: bookingIds } } }).catch(() => []),
          prisma.trainTicketRequest.findMany({ where: { bookingId: { in: bookingIds } } }).catch(() => [])
        ]);
      } catch (e) {
        console.error('Accounting/Ticket sub-query warning:', e);
      }
    }

    const approvedAccounting = (allAccounting || []).filter(a => a && a.status === 'APPROVED');
    const totalRevenueCollected = approvedAccounting.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const profitPerTrip = totalRevenueCollected - totalOpsCost;

    const ticketReadiness = {
      pending: (ticketRequests || []).filter(t => t && (t.status === 'PENDING_VERIFICATION' || t.status === 'DRAFT')).length,
      approved: (ticketRequests || []).filter(t => t && t.status === 'APPROVED').length,
      cancelled: (ticketRequests || []).filter(t => t && t.status === 'CANCELLED').length
    };

    const pendingCollection = (allAccounting || []).filter(a => a && a.status === 'PENDING').reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const totalBookingAmount = (bookings || []).reduce((s, b) => s + (Number(b.totalAmount) || Number(b.amount) || 0), 0);
    const remainingCollection = Math.max(0, totalBookingAmount - totalRevenueCollected);

    const accountingReadiness = {
      approvedCollected: totalRevenueCollected,
      pendingCollection,
      remainingCollection,
      totalBookingAmount
    };

    return res.json({
      success: true,
      data: {
        hotelCost,
        transportCost,
        guideCost,
        miscCost,
        detailedExpensesCost,
        totalOpsCost,
        travelerCount,
        perPersonOpsCost,
        totalRevenueCollected,
        profitPerTrip,
        ticketReadiness,
        accountingReadiness
      }
    });
  } catch (err) {
    console.error('getOpsAccountingSummary fatal error:', err);
    return res.json({
      success: true,
      data: {
        hotelCost: 0, transportCost: 0, guideCost: 0, miscCost: 0, detailedExpensesCost: 0,
        totalOpsCost: 0, travelerCount: 1, perPersonOpsCost: 0, totalRevenueCollected: 0, profitPerTrip: 0,
        ticketReadiness: { pending: 0, approved: 0, cancelled: 0 },
        accountingReadiness: { approvedCollected: 0, pendingCollection: 0, remainingCollection: 0, totalBookingAmount: 0 }
      }
    });
  }
};

// ── SEAT MANAGEMENT (DEPARTURE SCOPED) ──
// Lightweight, read-only departure overview. Detailed rows remain behind their
// respective tabs and accounting/profit reports remain behind the accounting tab.
exports.getWorkspaceSummary = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const cacheKey = `ops_summary_${ctx.tripId}_${ctx.departureDate || 'all'}`;
    const cached = opsSummaryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return res.json({ success: true, data: cached.data });
    }

    const [bookingAggregate, bookingRefs, seatConfig, checklistCounts, openIncidentCount, leaders,
      hotelCounts, transportCount, roomAllocationCount, vehicleAllocationCount, latestAllocation] = await Promise.all([
      prisma.booking.aggregate({
        where: ctx.bookingWhere,
        _sum: { numberOfTravelers: true, totalAmount: true }
      }).catch(e => ({ _sum: { numberOfTravelers: 0, totalAmount: 0 } })),
      prisma.booking.findMany({ where: ctx.bookingWhere, select: { bookingId: true } }).catch(e => []),
      prisma.opsSeatConfig.findFirst({
        where: ctx.where,
        select: { id: true, totalSeatsCap: true, alertThreshold: true, blockedSeats: true }
      }).catch(e => null),
      prisma.opsTripChecklist.groupBy({
        by: ['isCompleted'], where: ctx.where, _count: { _all: true }
      }).catch(e => []),
      prisma.opsIncidentLog.count({ where: { ...ctx.where, status: 'OPEN' } }).catch(e => 0),
      prisma.opsTripLeader.findMany({
        where: { ...ctx.where, archivedAt: null },
        select: { id: true, leaderName: true, leaderPhone: true, leaderType: true, isPrimary: true },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        take: 10
      }).catch(e => []),
      prisma.opsHotelBooking.groupBy({
        by: ['confirmed'], where: ctx.where, _count: { _all: true }
      }).catch(e => []),
      prisma.opsTransportFleet.count({ where: ctx.where }).catch(e => 0),
      prisma.opsRoomAllocation.count({ where: { tripId: ctx.tripId, departureDate: ctx.departureDate } }).catch(e => 0),
      prisma.opsVehicleAllocation.count({ where: { tripId: ctx.tripId, departureDate: ctx.departureDate } }).catch(e => 0),
      prisma.opsAllocationRun.findFirst({
        where: ctx.where,
        select: { status: true, version: true },
        orderBy: { createdAt: 'desc' }
      }).catch(e => null)
    ]);

    const bookingIds = (bookingRefs || []).map((booking) => booking.bookingId).filter(Boolean);
    const [ticketCounts, accountingTotals] = bookingIds.length > 0
      ? await Promise.all([
          prisma.trainTicketRequest.groupBy({
            by: ['status'],
            where: { tenantId: ctx.tenantId, bookingId: { in: bookingIds } },
            _count: { _all: true }
          }).catch(e => []),
          prisma.accountingEntry.groupBy({
            by: ['status'],
            where: { tenantId: ctx.tenantId, bookingId: { in: bookingIds } },
            _sum: { amount: true }
          }).catch(e => [])
        ])
      : [[], []];

    const travelerCount = bookingAggregate?._sum?.numberOfTravelers || 0;
    const totalBookingAmount = bookingAggregate?._sum?.totalAmount || 0;
    const totalSeatsCap = seatConfig?.totalSeatsCap ?? 30;
    const blockedSeats = seatConfig?.blockedSeats ?? 0;
    const ticketsByStatus = Object.fromEntries((ticketCounts || []).map((row) => [row.status, row._count._all]));
    const accountingByStatus = Object.fromEntries((accountingTotals || []).map((row) => [row.status, row._sum?.amount || 0]));
    const checklistByStatus = Object.fromEntries((checklistCounts || []).map((row) => [String(row.isCompleted), row._count._all]));
    const hotelByStatus = Object.fromEntries((hotelCounts || []).map((row) => [row.confirmed, row._count._all]));
    const approvedCollections = accountingByStatus.APPROVED || 0;

    const resData = {
      acceptedTravelerCount: travelerCount,
      ticketReadiness: {
        approved: ticketsByStatus.APPROVED || 0,
        pending: (ticketsByStatus.PENDING_VERIFICATION || 0) + (ticketsByStatus.DRAFT || 0),
        cancelled: ticketsByStatus.CANCELLED || 0
      },
      approvedCollections,
      pendingCollections: accountingByStatus.PENDING || 0,
      remainingCollections: Math.max(0, totalBookingAmount - approvedCollections),
      seatAvailability: {
        configured: Boolean(seatConfig),
        totalSeatsCap,
        alertThreshold: seatConfig?.alertThreshold ?? 25,
        blockedSeats,
        seatsSold: travelerCount,
        seatsAvailable: Math.max(0, totalSeatsCap - travelerCount - blockedSeats),
        waitingList: Math.max(0, travelerCount + blockedSeats - totalSeatsCap)
      },
      hotelTransportStatus: {
        hotelsTotal: (hotelCounts || []).reduce((sum, row) => sum + (row._count?._all || 0), 0),
        hotelsConfirmed: hotelByStatus.CONFIRMED || 0,
        transportTotal: transportCount || 0
      },
      allocationState: {
        status: latestAllocation?.status || 'NOT_STARTED',
        version: latestAllocation?.version || 0,
        roomAllocations: roomAllocationCount || 0,
        vehicleAllocations: vehicleAllocationCount || 0
      },
      checklistCompletion: {
        completed: checklistByStatus.true || 0,
        total: (checklistByStatus.true || 0) + (checklistByStatus.false || 0)
      },
      blockingFlagCount: openIncidentCount || 0,
      openIncidentCount: openIncidentCount || 0,
      leaders: leaders || []
    };

    opsSummaryCache.set(cacheKey, { data: resData, expiresAt: Date.now() + 60000 });
    return res.json({ success: true, data: resData });
  } catch (err) {
    console.error('getWorkspaceSummary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch operations summary' });
  }
};

exports.getSeatConfig = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    let config = await prisma.opsSeatConfig.findFirst({
      where: { tenantId: ctx.tenantId, tripId: ctx.tripId, departureDate: ctx.departureDate }
    });

    if (!config) {
      config = await prisma.opsSeatConfig.create({
        data: { tenantId: ctx.tenantId, tripId: ctx.tripId, departureDate: ctx.departureDate, totalSeatsCap: 30, alertThreshold: 25 }
      });
    }

    const bookingWhere = ctx.bookingWhere;
    const bookings = await prisma.booking.findMany({ where: bookingWhere });
    const seatsSold = bookings.reduce((s, b) => s + (b.numberOfTravelers || 1), 0);
    const seatsAvailable = Math.max(0, config.totalSeatsCap - seatsSold - config.blockedSeats);
    const waitingList = seatsSold > config.totalSeatsCap ? seatsSold - config.totalSeatsCap : 0;

    return res.json({
      success: true,
      data: {
        ...config,
        seatsSold,
        seatsAvailable,
        waitingList
      }
    });
  } catch (err) {
    console.error('getSeatConfig error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch seat config' });
  }
};

// ── TRIP CHECKLIST & INCIDENTS ──
exports.getChecklist = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to checklist logs' });
    }

    const items = await prisma.opsTripChecklist.findMany({ 
      where: ctx.where, 
      include: { 
        completedBy: { select: { id: true, name: true } },
        activities: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { taskName: 'asc' }
    });

    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('getChecklist error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch checklist' });
  }
};

exports.initializeChecklist = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to initialize checklists' });
    }

    // Try to find the trip to get destination
    const trip = await prisma.trip.findFirst({
      where: { id: ctx.tripId }
    });
    const destination = trip?.destination || trip?.title || '';

    // Fetch active SOP templates for this destination
    const templates = await prisma.opsSOPTemplate.findMany({
      where: {
        tenantId: ctx.tenantId,
        destination: { contains: destination, mode: 'insensitive' }
      }
    });

    const defaults = [
      { stage: 'PRE_TRIP_30D', tasks: ['Hotel booking confirmed', 'Train tickets reviewed', 'Guide confirmed', 'WhatsApp group created'] },
      { stage: 'PRE_TRIP_7D', tasks: ['Packing list sent', 'SIM/mobile advisory sent', 'Emergency contact collected'] },
      { stage: 'PRE_TRIP_1D', tasks: ['Vehicle reconfirmed', 'Hotel reconfirmed', 'Trip leader briefed'] },
      { stage: 'DEPARTURE_DAY', tasks: ['Headcount completed', 'Documents checked', 'Group photo completed'] },
      { stage: 'DURING_TRIP', tasks: ['Daily check-in logged', 'Incident review completed'] },
      { stage: 'POST_TRIP', tasks: ['Feedback form sent', 'Photos collected', 'Next-trip follow-up created'] }
    ];

    const tasksToCreate = [];
    if (templates.length > 0) {
      templates.forEach(tpl => {
        tasksToCreate.push({
          stage: tpl.stage,
          taskName: tpl.taskName
        });
      });
    } else {
      defaults.forEach(dGroup => {
        dGroup.tasks.forEach(tName => {
          tasksToCreate.push({
            stage: dGroup.stage,
            taskName: tName
          });
        });
      });
    }

    // Idempotent creation: get existing tasks
    const existing = await prisma.opsTripChecklist.findMany({
      where: ctx.where,
      select: { stage: true, taskName: true }
    });

    const seedData = [];
    tasksToCreate.forEach(task => {
      const alreadyExists = existing.some(e => e.stage === task.stage && e.taskName === task.taskName);
      if (!alreadyExists) {
        seedData.push({
          tenantId: ctx.tenantId,
          tripId: ctx.tripId,
          departureDate: ctx.departureDate,
          stage: task.stage,
          taskName: task.taskName,
          isCompleted: false
        });
      }
    });

    if (seedData.length > 0) {
      await prisma.opsTripChecklist.createMany({ data: seedData });
    }

    const items = await prisma.opsTripChecklist.findMany({ 
      where: ctx.where, 
      include: { 
        completedBy: { select: { id: true, name: true } },
        activities: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { taskName: 'asc' }
    });

    return res.json({ success: true, message: 'Checklist initialized successfully', data: items });
  } catch (err) {
    console.error('initializeChecklist error:', err);
    return res.status(500).json({ success: false, message: 'Failed to initialize checklist' });
  }
};

exports.completeChecklistItem = async (req, res) => {
  try {
    const { id, notes } = req.body;
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to checklist items' });
    }
    const item = await prisma.opsTripChecklist.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });

    if (item.isCompleted) {
      return res.status(400).json({ success: false, message: 'Checklist item is already completed' });
    }

    const updated = await prisma.opsTripChecklist.update({
      where: { id },
      data: {
        isCompleted: true,
        completedById: req.user.id,
        completedAt: new Date(),
        notes: notes || item.notes
      }
    });

    await prisma.opsChecklistActivity.create({
      data: {
        tenantId: item.tenantId,
        checklistItemId: item.id,
        action: 'COMPLETE',
        previousStatus: false,
        nextStatus: true,
        notes: notes || null,
        actorId: req.user.id
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('completeChecklistItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete checklist item' });
  }
};

exports.reopenChecklistItem = async (req, res) => {
  try {
    const { id, notes } = req.body;
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to checklist items' });
    }
    const item = await prisma.opsTripChecklist.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'Checklist item not found' });

    if (!item.isCompleted) {
      return res.status(400).json({ success: false, message: 'Checklist item is already open' });
    }

    if (!notes || !notes.trim()) {
      return res.status(400).json({ success: false, message: 'Reopening a checklist item requires an explicit reason (notes)' });
    }

    const updated = await prisma.opsTripChecklist.update({
      where: { id },
      data: {
        isCompleted: false,
        completedById: null,
        completedAt: null,
        notes: notes
      }
    });

    await prisma.opsChecklistActivity.create({
      data: {
        tenantId: item.tenantId,
        checklistItemId: item.id,
        action: 'REOPEN',
        previousStatus: true,
        nextStatus: false,
        notes: notes,
        actorId: req.user.id
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('reopenChecklistItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reopen checklist item' });
  }
};

exports.createChecklistItem = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const { taskName, stage, notes } = req.body;
    if (!taskName || !stage) {
      return res.status(400).json({ success: false, message: 'taskName and stage are required' });
    }
    const item = await prisma.opsTripChecklist.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        stage,
        taskName,
        notes: notes || null,
        isCompleted: false
      }
    });
    return res.json({ success: true, data: item });
  } catch (err) {
    console.error('createChecklistItem error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create checklist item' });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to incident logs' });
    }

    const incidents = await prisma.opsIncidentLog.findMany({
      where: ctx.where,
      include: { 
        reportedBy: { select: { id: true, name: true } },
        resolvedBy: { select: { id: true, name: true } },
        activities: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ success: true, data: incidents });
  } catch (err) {
    console.error('getIncidents error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch incidents' });
  }
};

exports.createIncident = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to create incident logs' });
    }

    const { title, severity, description, incidentType } = req.body;
    const VALID_INCIDENT_TYPES = ['MEDICAL', 'LOST_LUGGAGE', 'HOTEL_ISSUE', 'TRANSPORT_ISSUE', 'GUEST_CONFLICT', 'DOCUMENT_ISSUE', 'OTHER'];
    if (incidentType && !VALID_INCIDENT_TYPES.includes(incidentType)) {
      return res.status(400).json({ success: false, message: 'Invalid incidentType value' });
    }

    const incident = await prisma.opsIncidentLog.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        title,
        severity: severity || 'MEDIUM',
        description,
        incidentType: incidentType || 'OTHER',
        status: 'OPEN',
        reportedById: req.user.id
      }
    });

    await prisma.opsIncidentActivity.create({
      data: {
        tenantId: ctx.tenantId,
        incidentId: incident.id,
        action: 'CREATE',
        notes: description,
        actorId: req.user.id
      }
    });

    return res.status(201).json({ success: true, data: incident });
  } catch (err) {
    console.error('createIncident error:', err);
    return res.status(500).json({ success: false, message: 'Failed to log incident' });
  }
};

exports.resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to resolve incidents' });
    }

    const incident = await prisma.opsIncidentLog.findUnique({ where: { id } });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident log not found' });

    const updated = await prisma.opsIncidentLog.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolution: resolution || incident.resolution,
        resolvedById: req.user.id,
        resolvedAt: new Date()
      }
    });

    await prisma.opsIncidentActivity.create({
      data: {
        tenantId: incident.tenantId,
        incidentId: incident.id,
        action: 'RESOLVE',
        notes: resolution || null,
        actorId: req.user.id
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('resolveIncident error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resolve incident' });
  }
};

exports.reopenIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to reopen incidents' });
    }

    if (!notes || !notes.trim()) {
      return res.status(400).json({ success: false, message: 'Reopening an incident requires a reason (notes)' });
    }

    const incident = await prisma.opsIncidentLog.findUnique({ where: { id } });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident log not found' });

    const updated = await prisma.opsIncidentLog.update({
      where: { id },
      data: {
        status: 'OPEN',
        resolvedById: null,
        resolvedAt: null
      }
    });

    await prisma.opsIncidentActivity.create({
      data: {
        tenantId: incident.tenantId,
        incidentId: incident.id,
        action: 'REOPEN',
        notes: notes.trim(),
        actorId: req.user.id
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('reopenIncident error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reopen incident' });
  }
};

// ── ROOM INVENTORY (Available rooms for allocation) ──
exports.getRoomInventory = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;
    const items = await prisma.opsRoomInventory.findMany({ where: ctx.where, orderBy: { roomLabel: 'asc' } });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('getRoomInventory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch room inventory' });
  }
};

exports.createRoomInventory = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to modify room inventory' });
    }

    const { roomLabel, roomType, genderGroup, capacity, hotelName, notes, quantity } = req.body;
    if (!roomLabel || !roomType || !capacity) {
      return res.status(400).json({ success: false, message: 'roomLabel, roomType, and capacity are required' });
    }

    const qty = quantity ? parseInt(quantity) : 1;
    const createdRooms = [];

    // Parse starting room number if any
    const labelMatch = roomLabel.match(/^(.*?)(\d+)$/);
    if (qty > 1 && labelMatch) {
      const prefix = labelMatch[1];
      const startNum = parseInt(labelMatch[2]);
      const totalDigits = labelMatch[2].length;

      for (let i = 0; i < qty; i++) {
        const currentNum = startNum + i;
        const currentLabel = `${prefix}${String(currentNum).padStart(totalDigits, '0')}`;
        const newRoom = await prisma.opsRoomInventory.create({
          data: {
            tenantId: ctx.tenantId,
            tripId: ctx.tripId,
            departureDate: ctx.departureDate,
            roomLabel: currentLabel,
            roomType,
            genderGroup: genderGroup || 'GROUP',
            capacity: parseInt(capacity),
            hotelName,
            notes
          }
        });
        createdRooms.push(newRoom);
      }
    } else {
      const newRoom = await prisma.opsRoomInventory.create({
        data: {
          tenantId: ctx.tenantId,
          tripId: ctx.tripId,
          departureDate: ctx.departureDate,
          roomLabel,
          roomType,
          genderGroup: genderGroup || 'GROUP',
          capacity: parseInt(capacity),
          hotelName,
          notes
        }
      });
      createdRooms.push(newRoom);
    }

    return res.status(201).json({ success: true, data: qty > 1 ? createdRooms : createdRooms[0] });
  } catch (err) {
    console.error('createRoomInventory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create room inventory' });
  }
};

exports.deleteRoomInventory = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to delete room inventory' });
    }

    await prisma.opsRoomInventory.delete({ where: { id } });
    return res.json({ success: true, message: 'Room inventory deleted successfully' });
  } catch (err) {
    console.error('deleteRoomInventory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete room inventory' });
  }
};

// ── TRAVELER SEGREGATION / AUTO-ALLOCATION ENGINE ──
exports.generateAllocation = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to run allocations' });
    }

    const bookings = await prisma.booking.findMany({
      where: ctx.bookingWhere
    });

    const fleet = await prisma.opsTransportFleet.findMany({ where: ctx.where });
    const rooms = await prisma.opsRoomInventory.findMany({ where: ctx.where });

    const result = await runAutoAllocation(bookings, fleet, rooms);

    // Get current version count to bump
    const runCount = await prisma.opsAllocationRun.count({ where: ctx.where });
    const run = await prisma.opsAllocationRun.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        version: runCount + 1,
        status: 'DRAFT',
        resultJson: result,
        actorId: req.user.id
      }
    });

    return res.json({ success: true, data: { allocationRunId: run.id, ...result } });
  } catch (err) {
    console.error('generateAllocation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate traveler allocations' });
  }
};

exports.confirmAllocation = async (req, res) => {
  try {
    const { allocationRunId, roomAllocations: reqRoomAllocs, vehicleAllocations: reqVehicleAllocs } = req.body;
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to confirm allocations' });
    }

    const run = await prisma.opsAllocationRun.findUnique({ where: { id: allocationRunId } });
    if (!run) return res.status(404).json({ success: false, message: 'Allocation draft run not found' });

    await prisma.$transaction(async (tx) => {
      let finalResult = run.resultJson;
      if (reqRoomAllocs || reqVehicleAllocs) {
        finalResult = {
          ...run.resultJson,
          roomAllocations: reqRoomAllocs || [],
          vehicleAllocations: reqVehicleAllocs || []
        };
      }

      // Mark run as CONFIRMED
      await tx.opsAllocationRun.update({
        where: { id: run.id },
        data: { 
          status: 'CONFIRMED', 
          actorId: req.user.id,
          resultJson: finalResult
        }
      });

      // Clear existing confirmed allocations for this specific departure date
      const scope = { tripId: run.tripId, departureDate: run.departureDate };
      await tx.opsVehicleAllocation.deleteMany({ where: scope });
      await tx.opsRoomAllocation.deleteMany({ where: scope });

      // Save confirmed results to vehicle allocations
      const result = run.resultJson;
      const vehicleAllocations = [];
      const roomAllocations = [];

      if (reqVehicleAllocs && reqVehicleAllocs.length > 0) {
        reqVehicleAllocs.forEach(v => {
          vehicleAllocations.push({
            tripId: run.tripId,
            departureDate: run.departureDate,
            fleetId: v.fleetId || v.vehicleId,
            bookingId: v.bookingId,
            travelerName: v.travelerName,
            seatNumber: v.seatNumber || null
          });
        });
      } else if (result.vehicles) {
        result.vehicles.forEach(v => {
          v.assignedTravelers.forEach(t => {
            vehicleAllocations.push({
              tripId: run.tripId,
              departureDate: run.departureDate,
              fleetId: v.fleetId,
              bookingId: t.bookingId,
              travelerName: t.name,
              seatNumber: t.seatNumber || null
            });
          });
        });
      }

      if (reqRoomAllocs && reqRoomAllocs.length > 0) {
        reqRoomAllocs.forEach(r => {
          roomAllocations.push({
            tripId: run.tripId,
            departureDate: run.departureDate,
            roomNumber: r.roomNumber || r.roomLabel,
            roomType: r.roomType,
            genderGroup: r.genderGroup,
            bookingId: r.bookingId,
            travelerName: r.travelerName
          });
        });
      } else if (result.rooms) {
        result.rooms.forEach(r => {
          r.assignedTravelers.forEach(t => {
            roomAllocations.push({
              tripId: run.tripId,
              departureDate: run.departureDate,
              roomNumber: r.roomLabel,
              roomType: r.roomType,
              genderGroup: r.genderGroup,
              bookingId: t.bookingId,
              travelerName: t.name
            });
          });
        });
      }

      if (vehicleAllocations.length > 0) {
        await tx.opsVehicleAllocation.createMany({ data: vehicleAllocations });
      }
      if (roomAllocations.length > 0) {
        await tx.opsRoomAllocation.createMany({ data: roomAllocations });
      }
    });

    return res.json({ success: true, message: 'Allocation successfully locked and confirmed' });
  } catch (err) {
    console.error('confirmAllocation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to lock allocation run' });
  }
};

exports.getConfirmedAllocations = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const rooms = await prisma.opsRoomAllocation.findMany({
      where: { tripId: ctx.tripId, departureDate: ctx.departureDate },
      orderBy: { roomNumber: 'asc' }
    });

    const vehicles = await prisma.opsVehicleAllocation.findMany({
      where: { tripId: ctx.tripId, departureDate: ctx.departureDate },
      orderBy: [
        { fleetId: 'asc' },
        { seatNumber: 'asc' }
      ]
    });

    return res.json({
      success: true,
      data: {
        rooms,
        vehicles
      }
    });
  } catch (err) {
    console.error('getConfirmedAllocations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch confirmed allocations' });
  }
};

exports.overrideAllocation = async (req, res) => {
  try {
    const { allocationRunId, targetType, targetId, afterValue, reason } = req.body;
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to override allocations' });
    }

    const run = await prisma.opsAllocationRun.findUnique({ where: { id: allocationRunId } });
    if (!run) return res.status(404).json({ success: false, message: 'Allocation run not found' });

    // Store manual override record
    const override = await prisma.opsAllocationOverride.create({
      data: {
        tenantId: run.tenantId,
        allocationRunId: run.id,
        targetType,
        targetId,
        beforeValue: null,
        afterValue,
        reason,
        actorId: req.user.id
      }
    });

    return res.json({ success: true, data: override });
  } catch (err) {
    console.error('overrideAllocation error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record manual override' });
  }
};

// ── SOP LIBRARY CRUD ──
exports.getSopLibrary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to SOP library' });
    }

    const { destination, includeArchived } = req.query;
    const where = { tenantId };
    
    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }

    // Default: return active only. Standard operations users see active only.
    // Superadmin and admins can request archived SOPs using includeArchived=true.
    const isAdminOrSuper = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    if (!isAdminOrSuper || includeArchived !== 'true') {
      where.isActive = true;
    }

    const items = await prisma.opsSopLibrary.findMany({ 
      where, 
      orderBy: { destination: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        archivedBy: { select: { id: true, name: true } }
      }
    });
    return res.json({ success: true, data: items });
  } catch (err) {
    console.error('getSopLibrary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch SOP library' });
  }
};

exports.createSopLibrary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || 'default';
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to create SOPs' });
    }

    const { destination, title, content } = req.body;
    if (!destination || !title || !content) {
      return res.status(400).json({ success: false, message: 'Destination, title and content are required' });
    }

    const item = await prisma.opsSopLibrary.create({
      data: {
        tenantId,
        destination,
        title,
        content,
        isActive: true,
        createdById: req.user.id,
        updatedById: req.user.id
      }
    });
    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    console.error('createSopLibrary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create SOP library item' });
  }
};

exports.updateSopLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to edit SOPs' });
    }

    const { destination, title, content } = req.body;

    const item = await prisma.opsSopLibrary.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'SOP library item not found' });

    const updated = await prisma.opsSopLibrary.update({
      where: { id },
      data: {
        destination: destination !== undefined ? destination : item.destination,
        title: title !== undefined ? title : item.title,
        content: content !== undefined ? content : item.content,
        updatedById: req.user.id
      }
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateSopLibrary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update SOP library item' });
  }
};

exports.archiveSopLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to SOP archive actions' });
    }

    const item = await prisma.opsSopLibrary.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'SOP library item not found' });

    const updated = await prisma.opsSopLibrary.update({
      where: { id },
      data: {
        isActive: false,
        archivedAt: new Date(),
        archivedById: req.user.id
      }
    });

    return res.json({ success: true, message: 'SOP library item archived successfully', data: updated });
  } catch (err) {
    console.error('archiveSopLibrary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to archive SOP library item' });
  }
};

exports.restoreSopLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to SOP restore actions' });
    }

    const item = await prisma.opsSopLibrary.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ success: false, message: 'SOP library item not found' });

    const updated = await prisma.opsSopLibrary.update({
      where: { id },
      data: {
        isActive: true,
        archivedAt: null,
        archivedById: null,
        updatedById: req.user.id
      }
    });

    return res.json({ success: true, message: 'SOP library item restored successfully', data: updated });
  } catch (err) {
    console.error('restoreSopLibrary error:', err);
    return res.status(500).json({ success: false, message: 'Failed to restore SOP library item' });
  }
};

// ── TRIP LEADER ASSIGNMENT ──
exports.getTripLeader = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role has no access to leader assignments' });
    }

    const leaders = await prisma.opsTripLeader.findMany({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        archivedAt: null
      },
      include: {
        assignedBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } },
        archivedBy: { select: { id: true, name: true } },
        activities: {
          include: { actor: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return res.json({ success: true, data: leaders });
  } catch (err) {
    console.error('getTripLeader error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch trip leaders' });
  }
};

exports.assignTripLeader = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to assign leaders' });
    }

    const { leaderName, leaderPhone, leaderType, isPrimary, notes } = req.body;
    if (!leaderName || !leaderPhone) {
      return res.status(400).json({ success: false, message: 'Leader name and phone contact are required' });
    }

    if (leaderType && !['INTERNAL', 'FREELANCE'].includes(leaderType)) {
      return res.status(400).json({ success: false, message: 'Invalid leader type value' });
    }

    const existing = await prisma.opsTripLeader.findFirst({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        leaderPhone
      }
    });

    let leader;
    await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.opsTripLeader.updateMany({
          where: {
            tenantId: ctx.tenantId,
            tripId: ctx.tripId,
            departureDate: ctx.departureDate,
            archivedAt: null
          },
          data: { isPrimary: false }
        });
      }

      if (existing) {
        leader = await tx.opsTripLeader.update({
          where: { id: existing.id },
          data: {
            leaderName,
            leaderType: leaderType || existing.leaderType,
            isPrimary: !!isPrimary,
            notes: notes !== undefined ? notes : existing.notes,
            archivedAt: null,
            archivedById: null,
            updatedById: req.user.id
          }
        });

        await tx.opsTripLeaderActivity.create({
          data: {
            tenantId: ctx.tenantId,
            leaderAssignmentId: leader.id,
            action: 'ASSIGN',
            beforeValue: existing,
            afterValue: leader,
            actorId: req.user.id,
            notes: 'Reassigned/updated trip leader'
          }
        });
      } else {
        leader = await tx.opsTripLeader.create({
          data: {
            tenantId: ctx.tenantId,
            tripId: ctx.tripId,
            departureDate: ctx.departureDate,
            leaderName,
            leaderPhone,
            leaderType: leaderType || 'INTERNAL',
            isPrimary: !!isPrimary,
            notes: notes || null,
            assignedById: req.user.id,
            updatedById: req.user.id
          }
        });

        await tx.opsTripLeaderActivity.create({
          data: {
            tenantId: ctx.tenantId,
            leaderAssignmentId: leader.id,
            action: 'ASSIGN',
            beforeValue: null,
            afterValue: leader,
            actorId: req.user.id,
            notes: 'Assigned new trip leader'
          }
        });
      }
    });

    return res.json({ success: true, data: leader });
  } catch (err) {
    console.error('assignTripLeader error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign trip leader' });
  }
};

exports.patchTripLeader = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to update leaders' });
    }

    const { id, leaderPhone: lookupPhone, leaderName, leaderPhone, leaderType, isPrimary, notes } = req.body;

    const existing = await prisma.opsTripLeader.findFirst({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        OR: [
          id ? { id } : null,
          lookupPhone ? { leaderPhone: lookupPhone } : null
        ].filter(Boolean)
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Leader assignment not found for this departure' });
    }

    if (leaderType && !['INTERNAL', 'FREELANCE'].includes(leaderType)) {
      return res.status(400).json({ success: false, message: 'Invalid leader type value' });
    }

    let updated;
    await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.opsTripLeader.updateMany({
          where: {
            tenantId: ctx.tenantId,
            tripId: ctx.tripId,
            departureDate: ctx.departureDate,
            id: { not: existing.id },
            archivedAt: null
          },
          data: { isPrimary: false }
        });
      }

      updated = await tx.opsTripLeader.update({
        where: { id: existing.id },
        data: {
          leaderName: leaderName !== undefined ? leaderName : existing.leaderName,
          leaderPhone: leaderPhone !== undefined ? leaderPhone : existing.leaderPhone,
          leaderType: leaderType !== undefined ? leaderType : existing.leaderType,
          isPrimary: isPrimary !== undefined ? !!isPrimary : existing.isPrimary,
          notes: notes !== undefined ? notes : existing.notes,
          updatedById: req.user.id
        }
      });

      await tx.opsTripLeaderActivity.create({
        data: {
          tenantId: ctx.tenantId,
          leaderAssignmentId: existing.id,
          action: 'UPDATE',
          beforeValue: existing,
          afterValue: updated,
          actorId: req.user.id,
          notes: 'Updated leader details'
        }
      });
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('patchTripLeader error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update trip leader' });
  }
};

exports.archiveTripLeader = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to archive leaders' });
    }

    const { id, leaderPhone } = req.body;

    const existing = await prisma.opsTripLeader.findFirst({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        OR: [
          id ? { id } : null,
          leaderPhone ? { leaderPhone } : null
        ].filter(Boolean)
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Leader assignment not found for this departure' });
    }

    let updated;
    await prisma.$transaction(async (tx) => {
      updated = await tx.opsTripLeader.update({
        where: { id: existing.id },
        data: {
          archivedAt: new Date(),
          archivedById: req.user.id
        }
      });

      await tx.opsTripLeaderActivity.create({
        data: {
          tenantId: ctx.tenantId,
          leaderAssignmentId: existing.id,
          action: 'ARCHIVE',
          beforeValue: existing,
          afterValue: updated,
          actorId: req.user.id,
          notes: 'Archived leader assignment'
        }
      });
    });

    return res.json({ success: true, message: 'Leader assignment archived successfully', data: updated });
  } catch (err) {
    console.error('archiveTripLeader error:', err);
    return res.status(500).json({ success: false, message: 'Failed to archive trip leader' });
  }
};

exports.restoreTripLeader = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    if (req.user?.role === 'sales') {
      return res.status(403).json({ success: false, message: 'Sales role is not allowed to restore leaders' });
    }

    const { id, leaderPhone } = req.body;

    const existing = await prisma.opsTripLeader.findFirst({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        OR: [
          id ? { id } : null,
          leaderPhone ? { leaderPhone } : null
        ].filter(Boolean)
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Leader assignment not found for this departure' });
    }

    let updated;
    await prisma.$transaction(async (tx) => {
      updated = await tx.opsTripLeader.update({
        where: { id: existing.id },
        data: {
          archivedAt: null,
          archivedById: null
        }
      });

      await tx.opsTripLeaderActivity.create({
        data: {
          tenantId: ctx.tenantId,
          leaderAssignmentId: existing.id,
          action: 'RESTORE',
          beforeValue: existing,
          afterValue: updated,
          actorId: req.user.id,
          notes: 'Restored leader assignment'
        }
      });
    });

    return res.json({ success: true, message: 'Leader assignment restored successfully', data: updated });
  } catch (err) {
    console.error('restoreTripLeader error:', err);
    return res.status(500).json({ success: false, message: 'Failed to restore trip leader' });
  }
};

module.exports = {
  normalizeDepartureDateIndia,
  ...exports
};
