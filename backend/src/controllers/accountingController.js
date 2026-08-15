const { prisma } = require("../lib/prisma");
const { logBookingActivity } = require("../utils/bookingActivityLogger");

// Helper to check booking ownership for sales
const checkBookingOwnership = async (bookingId, user) => {
  if (
    [
      "superadmin",
      "admin",
      "finance",
      "operations",
      "BOOKING_VERIFIER",
    ].includes(user.role)
  ) {
    return true;
  }
  if (user.role === "sales") {
    const booking = await prisma.booking.findFirst({
      where: { bookingId, tenantId: user.tenantId },
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
      tenantId: req.user.tenantId || "default",
    };

    // Role-based security scoping
    if (req.user.role === "sales") {
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
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { booking: { name: { contains: search, mode: "insensitive" } } },
        { booking: { fullName: { contains: search, mode: "insensitive" } } },
        { booking: { bookingId: { contains: search, mode: "insensitive" } } },
        { booking: { tripName: { contains: search, mode: "insensitive" } } },
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
          collectionAccountId: true,
          collectionAccount: {
            select: {
              id: true,
              accountName: true,
              accountHolderName: true,
              accountType: true,
              upiId: true,
              bankName: true,
            },
          },
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
              id: true,
              bookingId: true,
              name: true,
              fullName: true,
              email: true,
              phone: true,
              mobile: true,
              tripId: true,
              tripName: true,
              totalAmount: true,
              advancePaid: true,
              remainingAmount: true,
              paymentStatus: true,
              payment_status: true,
              paymentMode: true,
              departureDate: true,
              adjustedPrice: true,
              numberOfTravelers: true,
              salesAdminId: true,
            },
          },
          salesperson: { select: { id: true, name: true, email: true } },
          actionedBy: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.accountingEntry.groupBy({
        by: ["status"],
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
    console.error("getEntries error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch accounting entries" });
  }
};

exports.getEntryHistory = async (req, res) => {
  try {
    const entry = await prisma.accountingEntry.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId || "default" },
      select: { id: true },
    });
    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Accounting entry not found" });

    const history = await prisma.accountingEntryLog.findMany({
      where: { accountingEntryId: entry.id },
      include: { actor: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error("getEntryHistory error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch entry history" });
  }
};

/**
 * POST /api/accounting/entries
 * Submit a manual payment received for manager approval
 */
exports.createEntry = async (req, res) => {
  try {
    const { bookingId, amount, paymentMode, collectionAccountId, referenceNumber, notes } = req.body;

    if (!bookingId || !amount || !paymentMode) {
      return res
        .status(400)
        .json({
          success: false,
          message: "bookingId, amount, and paymentMode are required",
        });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be a positive number" });
    }

    // 1. Verify booking exists
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ bookingId }, { id: bookingId }],
        tenantId: req.user.tenantId || "default",
      },
    });

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Target booking not found" });
    }

    const targetBookingId = booking.bookingId || booking.id;

    // 2. Verify salesperson owns this booking or has admin rights
    const hasAccess = await checkBookingOwnership(targetBookingId, req.user);
    if (!hasAccess) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Access denied: You do not own this booking",
        });
    }

    // 3. Prevent fake/ghost duplicate entry check (same amount, mode, ref inside 5 mins)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingDuplicate = await prisma.accountingEntry.findFirst({
      where: {
        bookingId: targetBookingId,
        amount: parsedAmount,
        paymentMode,
        referenceNumber: referenceNumber || null,
        createdAt: { gte: fiveMinsAgo },
      },
    });

    if (existingDuplicate) {
      return res.status(409).json({
        success: false,
        message:
          "Duplicate payment entry detected. Please wait 5 minutes before submitting the same payment.",
      });
    }

    // 4. Create the pending entry
    const entry = await prisma.accountingEntry.create({
      data: {
        tenantId: req.user.tenantId || "default",
        bookingId: targetBookingId,
        amount: parsedAmount,
        paymentMode,
        collectionAccountId: collectionAccountId || null,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        status: "PENDING",
        salespersonId:
          req.user.role === "sales"
            ? req.user.id
            : req.body.salespersonId || booking.salesAdminId || req.user.id,
      },
    });

    // 5. Write immutable history log
    await prisma.accountingEntryLog.create({
      data: {
        accountingEntryId: entry.id,
        action: "SUBMIT",
        notes: `Submitted payment entry of ₹${parsedAmount.toLocaleString("en-IN")} via ${paymentMode}`,
        actorId: req.user.id,
      },
    });

    await logBookingActivity({
      bookingId: booking.id,
      action: "PAYMENT_SUBMITTED",
      details: `Ledger payment of ₹${parsedAmount.toLocaleString("en-IN")} via ${paymentMode} submitted for approval by ${req.user.name || "System"}`,
      performedByAdminId: req.user.id,
    });

    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error("createEntry error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create accounting entry" });
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
      where: { id },
    });

    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Accounting entry not found" });
    }

    if (entry.status !== "PENDING") {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot approve entry with status ${entry.status}`,
        });
    }

    // 1. Update entry status
    const updated = await prisma.accountingEntry.update({
      where: { id },
      data: {
        status: "APPROVED",
        actionedById: req.user.id,
      },
    });

    // 2. Write immutable history log
    await prisma.accountingEntryLog.create({
      data: {
        accountingEntryId: entry.id,
        action: "APPROVE",
        notes: `Approved payment entry of ₹${entry.amount.toLocaleString("en-IN")} via ${entry.paymentMode}`,
        actorId: req.user.id,
      },
    });

    // 3. Atomically synchronize target booking and client payment receipts
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ bookingId: updated.bookingId }, { id: updated.bookingId }],
      },
    });

    if (booking) {
      const targetBookingId = booking.bookingId || booking.id;

      // Upsert verified receipt in OpsClientPayment
      await prisma.opsClientPayment.create({
        data: {
          tenantId: booking.tenantId || "default",
          bookingId: targetBookingId,
          amount: updated.amount,
          paymentMode: updated.paymentMode,
          transactionId: updated.referenceNumber || `ACC-${updated.id}`,
          status: "Verified",
          collectedBy: req.user?.name || req.user?.email || "Finance",
          remarks: updated.notes || "Approved via Accounting Hub",
        },
      });

      // Compute total verified receipts for this booking
      const allVerified = await prisma.opsClientPayment.findMany({
        where: {
          bookingId: { in: [booking.id, booking.bookingId] },
          status: "Verified",
        },
      });

      const totalVerified = allVerified.reduce((sum, r) => sum + (r.amount || 0), 0);
      const totalAmount = Number(booking.totalAmount || 0);
      const remaining = Math.max(0, totalAmount - totalVerified);

      const isFullyPaid = remaining === 0 && totalVerified > 0;
      const isPartial = totalVerified > 0 && !isFullyPaid;

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          advancePaid: totalVerified,
          remainingAmount: remaining,
          paymentStatus: isFullyPaid ? "Paid" : isPartial ? "Partial" : "Pending",
          payment_status: isFullyPaid ? "paid" : isPartial ? "partial" : "pending",
          ...(isFullyPaid && booking.status === "pending" ? { status: "confirmed" } : {}),
        },
      });

      await logBookingActivity({
        bookingId: booking.id,
        action: "PAYMENT_APPROVED",
        details: `Payment entry of ₹${updated.amount.toLocaleString("en-IN")} via ${updated.paymentMode} approved by ${req.user.name || "Finance"}. Total Paid: ₹${totalVerified.toLocaleString("en-IN")}, Remaining: ₹${remaining.toLocaleString("en-IN")}`,
        performedByAdminId: req.user.id,
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("approveEntry error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to approve entry" });
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
      return res
        .status(400)
        .json({ success: false, message: "Rejection reason is required" });
    }

    const entry = await prisma.accountingEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return res
        .status(404)
        .json({ success: false, message: "Accounting entry not found" });
    }

    if (entry.status !== "PENDING") {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot reject entry with status ${entry.status}`,
        });
    }

    // Update status
    const updated = await prisma.accountingEntry.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        actionedById: req.user.id,
      },
    });

    // Write immutable history log
    await prisma.accountingEntryLog.create({
      data: {
        accountingEntryId: entry.id,
        action: "REJECT",
        notes: `Rejected payment entry. Reason: ${reason}`,
        actorId: req.user.id,
      },
    });

    const bookingRecord = await prisma.booking.findUnique({
      where: { bookingId: updated.bookingId },
    });
    if (bookingRecord) {
      await logBookingActivity({
        bookingId: bookingRecord.id,
        action: "PAYMENT_REJECTED",
        details: `Ledger payment of ₹${updated.amount} rejected by manager ${req.user.name || "System"}. Reason: ${reason}`,
        performedByAdminId: req.user.id,
      });
    }

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("rejectEntry error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to reject entry" });
  }
};

/**
 * GET /api/accounting/reports
 * Fetch financial statistics, collections, trends
 */
exports.getReports = async (req, res) => {
  try {
    const { tripId, salespersonId, paymentMode, startDate, endDate } =
      req.query;

    const where = {
      tenantId: req.user.tenantId || "default",
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

    const [entries, paidBookings] = await Promise.all([
      prisma.accountingEntry.findMany({
        where,
        include: {
          booking: {
            select: {
              bookingId: true,
              tripId: true,
              tripName: true,
              totalAmount: true,
              salesAdminId: true,
            },
          },
          salesperson: { select: { id: true, name: true } },
        },
      }),
      prisma.booking.findMany({
        where: {
          tenantId: req.user.tenantId || "default",
          advancePaid: { gt: 0 },
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: new Date(startDate) } : {}),
                  ...(endDate ? { lte: new Date(endDate) } : {}),
                },
              }
            : {}),
          ...(salespersonId ? { salesAdminId: salespersonId } : {}),
          ...(tripId ? { tripId } : {}),
        },
        select: {
          id: true,
          bookingId: true,
          tripName: true,
          advancePaid: true,
          paymentMode: true,
          createdAt: true,
          salesAdmin: { select: { id: true, name: true } },
        },
      }),
    ]);

    // 1. Total pending collections
    const pendingTotal = entries
      .filter((e) => e.status === "PENDING")
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

    // Process direct booking payments
    paidBookings.forEach((b) => {
      const amount = Number(b.advancePaid || 0);
      if (amount <= 0) return;
      const tripName = b.tripName || "Unknown Trip";
      const dateStr = new Date(b.createdAt).toISOString().split("T")[0];

      tripRevenueMap[tripName] = (tripRevenueMap[tripName] || 0) + amount;

      const spName = b.salesAdmin?.name || "Website / Direct";
      salesPerformanceMap[spName] = (salesPerformanceMap[spName] || 0) + amount;

      const date = new Date(b.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthlyTrendMap[monthKey] = (monthlyTrendMap[monthKey] || 0) + amount;

      const isCash = b.paymentMode === "CASH";
      if (isCash) {
        cashDatewise[dateStr] = (cashDatewise[dateStr] || 0) + amount;
        cashTripwise[tripName] = (cashTripwise[tripName] || 0) + amount;
      } else {
        onlineDatewise[dateStr] = (onlineDatewise[dateStr] || 0) + amount;
        onlineTripwise[tripName] = (onlineTripwise[tripName] || 0) + amount;
      }
    });

    entries.forEach((e) => {
      if (e.status === "APPROVED") {
        const amount = e.amount;
        const tripName = e.booking?.tripName || "Unknown Trip";
        const dateStr = new Date(e.createdAt).toISOString().split("T")[0];

        // Standard stats
        tripRevenueMap[tripName] = (tripRevenueMap[tripName] || 0) + amount;

        const spName = e.salesperson?.name || "Unknown Sales";
        salesPerformanceMap[spName] =
          (salesPerformanceMap[spName] || 0) + amount;

        const date = new Date(e.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyTrendMap[monthKey] = (monthlyTrendMap[monthKey] || 0) + amount;

        // Cash vs Online breakdowns
        const isCash = e.paymentMode === "CASH";
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
    const revenuePerTrip = Object.entries(tripRevenueMap).map(
      ([tripName, amount]) => ({ tripName, amount }),
    );
    const salespersonCollection = Object.entries(salesPerformanceMap).map(
      ([salespersonName, amount]) => ({ salespersonName, amount }),
    );
    const monthlyRevenue = Object.entries(monthlyTrendMap)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const cashCollectionDatewise = Object.entries(cashDatewise)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.date.localeCompare(a.date));
    const cashCollectionTripwise = Object.entries(cashTripwise).map(
      ([tripName, amount]) => ({ tripName, amount }),
    );

    const onlineCollectionDatewise = Object.entries(onlineDatewise)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.date.localeCompare(a.date));
    const onlineCollectionTripwise = Object.entries(onlineTripwise).map(
      ([tripName, amount]) => ({ tripName, amount }),
    );

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
        onlineCollectionTripwise,
      },
    });
  } catch (err) {
    console.error("getReports error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch accounting reports" });
  }
};

/**
 * GET /api/accounting/personal-collections
 * Fetch summary of collections per Collection Account (and staff audit metadata)
 */
exports.getPersonalCollections = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";

    // Ensure default accounts exist
    const accountCount = await prisma.paymentReceivingAccount.count({
      where: { tenantId },
    });

    if (accountCount === 0) {
      await prisma.paymentReceivingAccount.createMany({
        data: [
          {
            tenantId,
            accountName: "YouthCamping Company Account",
            accountHolderName: "Youth Camping Adventures Pvt Ltd",
            accountType: "COMPANY",
            ownershipType: "COMPANY",
            paymentMethods: ["UPI", "BANK_TRANSFER", "CARD", "OTHER"],
            bankName: "HDFC Bank",
            accountNumber: "50200084920192",
            maskedAccountNumber: "XXXX0192",
            ifsc: "HDFC0001234",
            upiId: "youthcamping@hdfcbank",
            description: "Official YouthCamping primary collection account",
            isApproved: true,
            isActive: true,
          },
          {
            tenantId,
            accountName: "Nikulbhai Patel Account",
            accountHolderName: "Nikulbhai Patel",
            accountType: "INDIVIDUAL",
            ownershipType: "INDIVIDUAL",
            paymentMethods: ["UPI", "BANK_TRANSFER"],
            bankName: "State Bank of India",
            accountNumber: "38920192841",
            maskedAccountNumber: "XXXX2841",
            ifsc: "SBIN0004821",
            upiId: "nikulbhai@upi",
            description: "Individual external collection account",
            isApproved: true,
            isActive: true,
          },
          {
            tenantId,
            accountName: "Cash Collection Account",
            accountHolderName: "YouthCamping Cash Desk",
            accountType: "CASH",
            ownershipType: "COMPANY",
            paymentMethods: ["CASH"],
            description: "Physical cash collection and venue register",
            isApproved: true,
            isActive: true,
          },
        ],
      }).catch(() => null);
    }

    const accounts = await prisma.paymentReceivingAccount.findMany({
      where: { tenantId },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });

    const accountIds = accounts.map((a) => a.id);

    const [clientPayments, stationPayments, submissions] = await Promise.all([
      prisma.opsClientPayment.findMany({
        where: {
          tenantId,
          status: "Verified",
        },
        select: {
          id: true,
          collectionAccountId: true,
          amount: true,
          paymentDate: true,
          createdAt: true,
        },
      }),
      prisma.stationPaymentCollection.findMany({
        where: {
          tenantId,
          status: { not: "REVERSED" },
        },
        select: {
          id: true,
          receivingAccountId: true,
          amount: true,
          collectedAt: true,
          createdAt: true,
        },
      }),
      prisma.collectionAccountSubmission.findMany({
        where: {
          tenantId,
          accountId: { in: accountIds },
        },
        select: {
          id: true,
          accountId: true,
          amount: true,
          createdAt: true,
        },
      }),
    ]);

    const collectionsByAccount = {};
    const submissionsByAccount = {};
    const lastCollectionByAccount = {};
    const lastSubmissionByAccount = {};

    const defaultAccId = accounts[0]?.id;

    clientPayments.forEach((p) => {
      const accId = p.collectionAccountId || defaultAccId;
      if (!accId) return;
      const amt = Number(p.amount || 0);
      collectionsByAccount[accId] = (collectionsByAccount[accId] || 0) + amt;

      const dateStr = p.paymentDate
        ? new Date(p.paymentDate).toISOString()
        : p.createdAt
          ? new Date(p.createdAt).toISOString()
          : null;
      if (
        dateStr &&
        (!lastCollectionByAccount[accId] ||
          dateStr > lastCollectionByAccount[accId])
      ) {
        lastCollectionByAccount[accId] = dateStr;
      }
    });

    stationPayments.forEach((sc) => {
      const accId = sc.receivingAccountId || defaultAccId;
      if (!accId) return;
      const amt = Number(sc.amount || 0);
      collectionsByAccount[accId] = (collectionsByAccount[accId] || 0) + amt;

      const dateStr = sc.collectedAt
        ? new Date(sc.collectedAt).toISOString()
        : sc.createdAt
          ? new Date(sc.createdAt).toISOString()
          : null;
      if (
        dateStr &&
        (!lastCollectionByAccount[accId] ||
          dateStr > lastCollectionByAccount[accId])
      ) {
        lastCollectionByAccount[accId] = dateStr;
      }
    });

    submissions.forEach((sub) => {
      const accId = sub.accountId;
      const amt = Number(sub.amount || 0);
      submissionsByAccount[accId] = (submissionsByAccount[accId] || 0) + amt;

      const dateStr = sub.createdAt
        ? new Date(sub.createdAt).toISOString()
        : null;
      if (
        dateStr &&
        (!lastSubmissionByAccount[accId] ||
          dateStr > lastSubmissionByAccount[accId])
      ) {
        lastSubmissionByAccount[accId] = dateStr;
      }
    });

    const accountCollections = accounts.map((acc) => {
      const totalCollected = collectionsByAccount[acc.id] || 0;
      const totalSubmitted = submissionsByAccount[acc.id] || 0;
      const pending = Math.max(0, totalCollected - totalSubmitted);
      const status =
        pending === 0 && totalCollected > 0
          ? "Settled"
          : pending > 0
            ? "Pending"
            : "Settled";

      return {
        id: acc.id,
        name: acc.accountName,
        accountName: acc.accountName,
        accountHolderName: acc.accountHolderName,
        accountType: acc.accountType,
        paymentMethods: acc.paymentMethods || [],
        bankName: acc.bankName,
        accountNumber: acc.accountNumber,
        maskedAccountNumber: acc.maskedAccountNumber,
        ifsc: acc.ifsc,
        upiId: acc.upiId,
        description: acc.description,
        isActive: acc.isActive,
        totalCollected,
        totalSubmitted,
        pending,
        status,
        lastCollection: lastCollectionByAccount[acc.id] || null,
        lastSubmission: lastSubmissionByAccount[acc.id] || null,
      };
    });

    const summary = {
      totalCollected: accountCollections.reduce((s, p) => s + p.totalCollected, 0),
      totalSubmitted: accountCollections.reduce((s, p) => s + p.totalSubmitted, 0),
      totalPending: accountCollections.reduce((s, p) => s + p.pending, 0),
    };

    return res.json({
      success: true,
      data: accountCollections,
      summary,
    });
  } catch (err) {
    console.error("getPersonalCollections error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch collection accounts data",
    });
  }
};

/**
 * GET /api/accounting/personal-collections/:id
 * Fetch detailed ledger history for a specific Collection Account (or fallback Admin ID)
 */
exports.getPersonCollectionDetails = async (req, res) => {
  try {
    const { adminId: targetId } = req.params;
    const tenantId = req.user.tenantId || "default";

    // 1. Try resolving targetId as a Collection Account
    const account = await prisma.paymentReceivingAccount.findFirst({
      where: { id: targetId, tenantId },
    });

    if (account) {
      const [clientPayments, stationCollections, submissions] =
        await Promise.all([
          prisma.opsClientPayment.findMany({
            where: {
              tenantId,
              collectionAccountId: account.id,
              status: "Verified",
            },
            include: {
              booking: {
                select: {
                  id: true,
                  bookingId: true,
                  name: true,
                  fullName: true,
                  phone: true,
                  mobile: true,
                  email: true,
                  tripName: true,
                  departureDate: true,
                },
              },
            },
            orderBy: { paymentDate: "desc" },
          }),
          prisma.stationPaymentCollection.findMany({
            where: {
              tenantId,
              receivingAccountId: account.id,
              status: { not: "REVERSED" },
            },
            include: {
              collectedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { collectedAt: "desc" },
          }),
          prisma.collectionAccountSubmission.findMany({
            where: { tenantId, accountId: account.id },
            include: { recordedBy: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "desc" },
          }),
        ]);

      const collectionTransactions = [];

      clientPayments.forEach((p) => {
        collectionTransactions.push({
          id: `pay-${p.id}`,
          date: p.paymentDate || p.createdAt,
          bookingId: p.booking?.bookingId || p.bookingId,
          bookingDbId: p.booking?.id || p.bookingId,
          customerName: p.booking?.fullName || p.booking?.name || "Traveler",
          paymentMode: p.paymentMode || "UPI",
          amountCollected: Number(p.amount || 0),
          notes: p.remarks || "Booking Payment Receipt",
          reference: p.transactionId || `PAY-${p.id}`,
          tripName: p.booking?.tripName || "Trip",
          phone: p.booking?.phone || p.booking?.mobile || "N/A",
        });
      });

      stationCollections.forEach((sc) => {
        collectionTransactions.push({
          id: `sc-${sc.id}`,
          date: sc.collectedAt || sc.createdAt,
          bookingId: sc.bookingId,
          bookingDbId: sc.bookingId,
          customerName: sc.collectedFrom || "Passenger",
          paymentMode: sc.paymentMode || "CASH",
          amountCollected: Number(sc.amount || 0),
          notes: sc.remarks || `Station Receipt #${sc.receiptNumber}`,
          reference: sc.utrNumber || sc.receiptNumber,
          tripName: "Station Collection",
          phone: "N/A",
        });
      });

      collectionTransactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );

      const submissionTransactions = submissions.map((sub) => ({
        id: sub.id,
        date: sub.createdAt,
        amountSubmitted: sub.amount,
        paymentMode: sub.paymentMode,
        reference: sub.referenceNumber || sub.id,
        notes: sub.notes || "Fund transfer to company",
        recordedBy: sub.recordedBy?.name || "Admin",
      }));

      const totalCollected = collectionTransactions.reduce(
        (s, c) => s + c.amountCollected,
        0,
      );
      const totalSubmitted = submissionTransactions.reduce(
        (s, sub) => s + sub.amountSubmitted,
        0,
      );
      const pending = Math.max(0, totalCollected - totalSubmitted);
      const status = pending <= 0 && totalCollected > 0 ? "Settled" : "Pending";

      return res.json({
        success: true,
        data: {
          employee: {
            id: account.id,
            name: account.accountName,
            email: account.accountHolderName,
            role: account.accountType,
            accountType: account.accountType,
            upiId: account.upiId,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
          },
          summary: {
            totalCollected,
            totalSubmitted,
            pending,
            status,
          },
          collectionTransactions,
          submissionTransactions,
        },
      });
    }

    // 2. Fallback if requested with an Admin ID
    const admin = await prisma.admin.findUnique({
      where: { id: targetId },
      select: { id: true, name: true, email: true, role: true, phone: true },
    });

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Account/Employee not found" });
    }

    const [bookings, stationCollections, submissions] =
      await Promise.all([
        prisma.booking.findMany({
          where: { tenantId, salesAdminId: admin.id, advancePaid: { gt: 0 } },
          select: {
            id: true,
            bookingId: true,
            name: true,
            fullName: true,
            advancePaid: true,
            paymentMode: true,
            tripName: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.stationPaymentCollection.findMany({
          where: { tenantId, collectedByAdminId: admin.id, isReversed: false },
          select: {
            id: true,
            receiptNumber: true,
            bookingId: true,
            amount: true,
            paymentMode: true,
            collectedAt: true,
            collectedFrom: true,
            remarks: true,
            utrNumber: true,
          },
          orderBy: { collectedAt: "desc" },
        }),
        prisma.employeeCollectionSubmission.findMany({
          where: { tenantId, employeeAdminId: admin.id },
          include: { recordedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    const collectionTransactions = [];

    bookings.forEach((b) => {
      collectionTransactions.push({
        id: `bk-${b.id}`,
        date: b.createdAt,
        bookingId: b.bookingId,
        bookingDbId: b.id,
        customerName: b.fullName || b.name || "Guest",
        paymentMode: b.paymentMode || "UPI",
        amountCollected: Number(b.advancePaid || 0),
        notes: "Booking Payment",
        reference: b.bookingId,
        tripName: b.tripName || "Trip",
      });
    });

    stationCollections.forEach((sc) => {
      collectionTransactions.push({
        id: `sc-${sc.id}`,
        date: sc.collectedAt,
        bookingId: sc.bookingId,
        bookingDbId: sc.bookingId,
        customerName: sc.collectedFrom || "Passenger",
        paymentMode: sc.paymentMode || "CASH",
        amountCollected: Number(sc.amount || 0),
        notes: sc.remarks || `Station Receipt #${sc.receiptNumber}`,
        reference: sc.utrNumber || sc.receiptNumber,
        tripName: "Station Collection",
      });
    });

    collectionTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const submissionTransactions = submissions.map((sub) => ({
      id: sub.id,
      date: sub.createdAt,
      amountSubmitted: sub.amount,
      paymentMode: sub.paymentMode,
      reference: sub.referenceNumber || sub.id,
      notes: sub.notes || "",
      recordedBy: sub.recordedBy?.name || "Admin",
    }));

    const totalCollected = collectionTransactions.reduce(
      (s, c) => s + c.amountCollected,
      0,
    );
    const totalSubmitted = submissionTransactions.reduce(
      (s, sub) => s + sub.amountSubmitted,
      0,
    );
    const pending = Math.max(0, totalCollected - totalSubmitted);
    const status = pending <= 0 && totalCollected > 0 ? "Settled" : "Pending";

    return res.json({
      success: true,
      data: {
        employee: {
          id: admin.id,
          name: admin.name || admin.email.split("@")[0],
          email: admin.email,
          role: admin.role,
        },
        summary: {
          totalCollected,
          totalSubmitted,
          pending,
          status,
        },
        collectionTransactions,
        submissionTransactions,
      },
    });
  } catch (err) {
    console.error("getPersonCollectionDetails error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch account ledger details",
    });
  }
};

/**
 * POST /api/accounting/personal-collections/submit
 * Record a fund transfer/submission from a collection account to company
 */
exports.recordEmployeeSubmission = async (req, res) => {
  try {
    const { accountId, employeeAdminId, amount, paymentMode, referenceNumber, notes } =
      req.body;

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    const targetAccountId = accountId || employeeAdminId;
    if (!targetAccountId) {
      return res.status(400).json({
        success: false,
        message: "accountId is required",
      });
    }

    // Check if target is a PaymentReceivingAccount
    const account = await prisma.paymentReceivingAccount.findFirst({
      where: { id: targetAccountId, tenantId: req.user.tenantId || "default" },
    });

    if (account) {
      const submission = await prisma.collectionAccountSubmission.create({
        data: {
          tenantId: req.user.tenantId || "default",
          accountId: account.id,
          amount: numAmount,
          paymentMode: paymentMode || "BANK_TRANSFER",
          referenceNumber: referenceNumber || null,
          notes: notes || null,
          recordedByAdminId: req.user.id,
        },
        include: {
          account: { select: { id: true, accountName: true } },
          recordedBy: { select: { id: true, name: true } },
        },
      });

      return res.json({
        success: true,
        data: submission,
        message: `Transfer of ₹${numAmount.toLocaleString()} from ${account.accountName} recorded successfully`,
      });
    }

    // Fallback: Employee submission
    const employee = await prisma.admin.findUnique({
      where: { id: targetAccountId },
      select: { id: true, name: true },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Target Collection Account not found",
      });
    }

    const submission = await prisma.employeeCollectionSubmission.create({
      data: {
        tenantId: req.user.tenantId || "default",
        employeeAdminId: employee.id,
        amount: numAmount,
        paymentMode: paymentMode || "BANK_TRANSFER",
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        recordedByAdminId: req.user.id,
      },
      include: {
        recordedBy: { select: { id: true, name: true } },
        employeeAdmin: { select: { id: true, name: true } },
      },
    });

    return res.json({
      success: true,
      data: submission,
      message: `Submission of ₹${numAmount.toLocaleString()} recorded successfully`,
    });
  } catch (err) {
    console.error("recordEmployeeSubmission error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to record fund submission",
    });
  }
};
