const { prisma } = require('../lib/prisma');
const { logBookingActivity } = require('../utils/bookingActivityLogger');

// Helper to check booking ownership for sales
const checkBookingOwnership = async (bookingId, user) => {
  if (['superadmin', 'admin', 'finance', 'operations', 'BOOKING_VERIFIER'].includes(user.role)) {
    return true;
  }
  if (user.role === 'sales') {
    const booking = await prisma.booking.findFirst({
      where: { bookingId, tenantId: user.tenantId }
    });
    if (!booking) return false;
    return booking.salesAdminId === user.id;
  }
  return false;
};

/**
 * GET /api/accounting/entries
 * Fetch manual ledger entries with filters
 */
exports.getEntries = async (req, res) => {
  try {
    const { status, salespersonId, paymentMode, bookingId, search } = req.query;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = [25, 50, 100].includes(requestedLimit) ? requestedLimit : 25;
    const skip = (page - 1) * limit;

    const where = {
      tenantId: req.user.tenantId || 'default'
    };

    // Role-based security scoping
    if (req.user.role === 'sales') {
      where.salespersonId = req.user.id;
    } else if (salespersonId) {
      where.salespersonId = salespersonId;
    }

    const summaryWhere = { ...where };

    if (status) {
      where.status = status;
    }
    if (paymentMode) {
      where.paymentMode = paymentMode;
    }
    if (bookingId) {
      where.bookingId = bookingId;
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { booking: { name: { contains: search, mode: 'insensitive' } } },
        { booking: { fullName: { contains: search, mode: 'insensitive' } } },
        { booking: { bookingId: { contains: search, mode: 'insensitive' } } },
        { booking: { tripName: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [totalCount, entries, statusTotals] = await Promise.all([
      prisma.accountingEntry.count({ where }),
      prisma.accountingEntry.findMany({
        where,
        select: {
          id: true,
          tenantId: true,
          bookingId: true,
          amount: true,
          paymentMode: true,
          referenceNumber: true,
          status: true,
          notes: true,
          rejectionReason: true,
          salespersonId: true,
          actionedById: true,
          createdAt: true,
          updatedAt: true,
          booking: {
            select: {
              bookingId: true,
              name: true,
              fullName: true,
              tripName: true,
              totalAmount: true,
              adjustedPrice: true,
              numberOfTravelers: true,
              salesAdminId: true
            }
          },
          salesperson: { select: { id: true, name: true, email: true } },
          actionedBy: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.accountingEntry.groupBy({
        by: ['status'],
        where: summaryWhere,
        _sum: { amount: true },
      }),
    ]);

    const totals = { APPROVED: 0, PENDING: 0, REJECTED: 0 };
    for (const row of statusTotals) totals[row.status] = row._sum.amount || 0;

    return res.json({
      success: true,
      data: entries,
      summary: totals,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    });
  } catch (err) {
    console.error('getEntries error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch accounting entries' });
  }
};

exports.getEntryHistory = async (req, res) => {
  try {
    const entry = await prisma.accountingEntry.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId || 'default' },
      select: { id: true },
    });
    if (!entry) return res.status(404).json({ success: false, message: 'Accounting entry not found' });

    const history = await prisma.accountingEntryLog.findMany({
      where: { accountingEntryId: entry.id },
      select: {
        id: true,
        accountingEntryId: true,
        action: true,
        notes: true,
        actorId: true,
        createdAt: true,
        actor: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error('getEntryHistory error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch accounting history' });
  }
};

/**
 * POST /api/accounting/entries
 * Submit a manual payment received for manager approval
 */
exports.createEntry = async (req, res) => {
  try {
    const { bookingId, amount, paymentMode, referenceNumber, notes } = req.body;

    if (!bookingId || !amount || !paymentMode) {
      return res.status(400).json({ success: false, message: 'bookingId, amount, and paymentMode are required' });
    }

    // 1. Verify salesperson owns this booking or has admin rights
    const hasAccess = await checkBookingOwnership(bookingId, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this booking' });
    }

    // 2. Prevent fake/ghost duplicate entry check (same amount, mode, ref inside 5 mins)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingDuplicate = await prisma.accountingEntry.findFirst({
      where: {
        bookingId,
        amount: parseFloat(amount),
        paymentMode,
        referenceNumber: referenceNumber || null,
        createdAt: { gte: fiveMinsAgo }
      }
    });

    if (existingDuplicate) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate payment entry detected. Please wait 5 minutes before submitting the same payment.'
      });
    }

    // 3. Create the pending entry
    const entry = await prisma.accountingEntry.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        bookingId,
        amount: parseFloat(amount),
        paymentMode,
        referenceNumber,
        notes,
        status: 'PENDING',
        salespersonId: req.user.role === 'sales' ? req.user.id : req.body.salespersonId || req.user.id
      }
    });

    // 4. Write immutable history log
    await prisma.accountingEntryLog.create({
      data: {
        accountingEntryId: entry.id,
        action: 'SUBMIT',
        notes: `Submitted payment entry of ₹${amount} via ${paymentMode}`,
        actorId: req.user.id
      }
    });

    const bookingRecord = await prisma.booking.findUnique({ where: { bookingId } });
    if (bookingRecord) {
      await logBookingActivity({
        bookingId: bookingRecord.id,
        action: 'PAYMENT_SUBMITTED',
        details: `Ledger payment of ₹${amount} via ${paymentMode} submitted for approval by salesperson ${req.user.name || 'System'}`,
        performedByAdminId: req.user.id
      });
    }

    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error('createEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create accounting entry' });
  }
};

/**
 * POST /api/accounting/entries/:id/approve
 * Manager/Admin approves a pending payment entry
 */
exports.approveEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.accountingEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Accounting entry not found' });
    }

    if (entry.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot approve entry with status ${entry.status}` });
    }

    // Update status
    const updated = await prisma.accountingEntry.update({
      where: { id },
      data: {
        status: 'APPROVED',
        actionedById: req.user.id
      }
    });

    // Write immutable history log
    await prisma.accountingEntryLog.create({
      data: {
        accountingEntryId: entry.id,
        action: 'APPROVE',
        notes: 'Approved payment entry',
        actorId: req.user.id
      }
    });

    const bookingRecord = await prisma.booking.findUnique({ where: { bookingId: updated.bookingId } });
    if (bookingRecord) {
      await logBookingActivity({
        bookingId: bookingRecord.id,
        action: 'PAYMENT_APPROVED',
        details: `Ledger payment of ₹${updated.amount} approved by manager ${req.user.name || 'System'}`,
        performedByAdminId: req.user.id
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('approveEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve entry' });
  }
};

/**
 * POST /api/accounting/entries/:id/reject
 * Manager/Admin rejects a pending payment entry
 */
exports.rejectEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const entry = await prisma.accountingEntry.findUnique({
      where: { id }
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Accounting entry not found' });
    }

    if (entry.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Cannot reject entry with status ${entry.status}` });
    }

    // Update status
    const updated = await prisma.accountingEntry.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        actionedById: req.user.id
      }
    });

    // Write immutable history log
    await prisma.accountingEntryLog.create({
      data: {
        accountingEntryId: entry.id,
        action: 'REJECT',
        notes: `Rejected payment entry. Reason: ${reason}`,
        actorId: req.user.id
      }
    });

    const bookingRecord = await prisma.booking.findUnique({ where: { bookingId: updated.bookingId } });
    if (bookingRecord) {
      await logBookingActivity({
        bookingId: bookingRecord.id,
        action: 'PAYMENT_REJECTED',
        details: `Ledger payment of ₹${updated.amount} rejected by manager ${req.user.name || 'System'}. Reason: ${reason}`,
        performedByAdminId: req.user.id
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('rejectEntry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject entry' });
  }
};

/**
 * GET /api/accounting/reports
 * Fetch financial statistics, collections, trends
 */
exports.getReports = async (req, res) => {
  try {
    const { tripId, salespersonId, paymentMode, startDate, endDate } = req.query;

    const where = {
      tenantId: req.user.tenantId || 'default'
    };

    // Filter by dates if provided
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (salespersonId) {
      where.salespersonId = salespersonId;
    }
    if (paymentMode) {
      where.paymentMode = paymentMode;
    }

    if (tripId) {
      where.booking = { tripId };
    }

    // Fetch approved and pending entries separately to calculate aggregates
    const entries = await prisma.accountingEntry.findMany({
      where,
      include: {
        booking: {
          select: {
            bookingId: true,
            tripId: true,
            tripName: true,
            totalAmount: true,
            salesAdminId: true
          }
        },
        salesperson: { select: { id: true, name: true } }
      }
    });

    // 1. Total pending collections
    const pendingTotal = entries
      .filter(e => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.amount, 0);

    // 2. Revenue grouped by trip
    const tripRevenueMap = {};
    // 3. Salesperson collections
    const salesPerformanceMap = {};
    // 4. Monthly revenue trend
    const monthlyTrendMap = {};

    // Grouping breakdowns for Cash and Online collections
    const cashDatewise = {};
    const cashTripwise = {};
    const onlineDatewise = {};
    const onlineTripwise = {};

    entries.forEach(e => {
      if (e.status === 'APPROVED') {
        const amount = e.amount;
        const tripName = e.booking?.tripName || 'Unknown Trip';
        const dateStr = new Date(e.createdAt).toISOString().split('T')[0];

        // Standard stats
        tripRevenueMap[tripName] = (tripRevenueMap[tripName] || 0) + amount;

        const spName = e.salesperson?.name || 'Unknown Sales';
        salesPerformanceMap[spName] = (salesPerformanceMap[spName] || 0) + amount;

        const date = new Date(e.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTrendMap[monthKey] = (monthlyTrendMap[monthKey] || 0) + amount;

        // Cash vs Online breakdowns
        const isCash = e.paymentMode === 'CASH';
        if (isCash) {
          cashDatewise[dateStr] = (cashDatewise[dateStr] || 0) + amount;
          cashTripwise[tripName] = (cashTripwise[tripName] || 0) + amount;
        } else {
          onlineDatewise[dateStr] = (onlineDatewise[dateStr] || 0) + amount;
          onlineTripwise[tripName] = (onlineTripwise[tripName] || 0) + amount;
        }
      }
    });

    // Format reports
    const revenuePerTrip = Object.entries(tripRevenueMap).map(([tripName, amount]) => ({ tripName, amount }));
    const salespersonCollection = Object.entries(salesPerformanceMap).map(([salespersonName, amount]) => ({ salespersonName, amount }));
    const monthlyRevenue = Object.entries(monthlyTrendMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const cashCollectionDatewise = Object.entries(cashDatewise)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.date.localeCompare(a.date));
    const cashCollectionTripwise = Object.entries(cashTripwise).map(([tripName, amount]) => ({ tripName, amount }));
    
    const onlineCollectionDatewise = Object.entries(onlineDatewise)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.date.localeCompare(a.date));
    const onlineCollectionTripwise = Object.entries(onlineTripwise).map(([tripName, amount]) => ({ tripName, amount }));

    return res.json({
      success: true,
      data: {
        pendingTotal,
        revenuePerTrip,
        salespersonCollection,
        monthlyRevenue,
        cashCollectionDatewise,
        cashCollectionTripwise,
        onlineCollectionDatewise,
        onlineCollectionTripwise
      }
    });
  } catch (err) {
    console.error('getReports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch accounting reports' });
  }
};
