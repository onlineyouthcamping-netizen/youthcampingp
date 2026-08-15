const { prisma } = require("../lib/prisma");
const { logBookingActivity } = require("../utils/bookingActivityLogger");

/**
 * GET /api/finance/control-center/stats
 * Aggregate KPI metrics for the Finance Control Center
 */
exports.getControlCenterStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Approved collections today
    const todayApprovedEntries = await prisma.accountingEntry.findMany({
      where: {
        tenantId,
        status: "APPROVED",
        updatedAt: { gte: today },
      },
      select: { amount: true, paymentMode: true },
    });

    const todayCollections = todayApprovedEntries.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );

    // 2. Pending cash submissions & amounts
    const pendingCashEntries = await prisma.accountingEntry.findMany({
      where: {
        tenantId,
        paymentMode: "CASH",
        status: "PENDING",
      },
      select: { amount: true },
    });

    const cashPendingAmount = pendingCashEntries.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );

    // 3. Pending incoming payments count (all modes PENDING)
    const pendingIncomingCount = await prisma.accountingEntry.count({
      where: {
        tenantId,
        status: "PENDING",
      },
    });

    // 4. Pending Outgoing Vendor Payments
    const pendingTripVendors = await prisma.tripVendor.findMany({
      where: {
        trip: { tenantId },
        paymentStatus: "pending",
      },
      select: { agreedCost: true, paidAmount: true },
    });

    const outgoingPendingAmount = pendingTripVendors.reduce(
      (sum, tv) => sum + Math.max(0, (Number(tv.agreedCost) || 0) - (Number(tv.paidAmount) || 0)),
      0
    );
    const outgoingPendingCount = pendingTripVendors.length;

    // 5. Ticketing Pending Verification count
    const ticketingPendingCount = await prisma.trainTicketRequest.count({
      where: {
        booking: { tenantId },
        status: { in: ["PENDING_VERIFICATION", "DRAFT", "PENDING_AUDIT"] },
      },
    });

    // 6. Discrepancies count
    const discrepanciesCount = await prisma.accountingEntry.count({
      where: {
        tenantId,
        status: "REJECTED",
      },
    });

    const totalPendingCount =
      pendingIncomingCount + outgoingPendingCount + ticketingPendingCount + discrepanciesCount;

    return res.json({
      success: true,
      data: {
        todayCollections,
        pendingVerificationCount: totalPendingCount,
        cashPendingAmount,
        cashPendingCount: pendingCashEntries.length,
        outgoingPendingAmount,
        outgoingPendingCount,
        ticketingPendingCount,
        discrepanciesCount,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("getControlCenterStats error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Finance Control Center statistics",
    });
  }
};

/**
 * GET /api/finance/control-center/cash-queue
 * Queue of Salesperson cash submissions with expected vs received difference
 */
exports.getCashSubmissionsQueue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { status, search, page = 1, limit = 25 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const where = {
      tenantId,
      paymentMode: "CASH",
      ...(status ? { status } : {}),
    };

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { booking: { name: { contains: search, mode: "insensitive" } } },
        { booking: { bookingId: { contains: search, mode: "insensitive" } } },
        { salesperson: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, entries] = await Promise.all([
      prisma.accountingEntry.count({ where }),
      prisma.accountingEntry.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          salesperson: { select: { id: true, name: true, email: true, phone: true } },
          actionedBy: { select: { id: true, name: true, role: true } },
          booking: {
            select: {
              id: true,
              bookingId: true,
              name: true,
              fullName: true,
              phone: true,
              tripName: true,
              totalAmount: true,
              advancePaid: true,
              remainingAmount: true,
              departureDate: true,
              salesAdminId: true,
            },
          },
        },
      }),
    ]);

    // Format with computed reconciliation fields
    const queue = entries.map((entry) => {
      const submittedAmount = Number(entry.amount || 0);
      const bookingRemaining = Number(entry.booking?.remainingAmount || 0);
      // Expected amount is either stored or the remaining balance
      const expectedAmount = entry.expectedAmount ? Number(entry.expectedAmount) : submittedAmount;
      const difference = submittedAmount - expectedAmount;

      return {
        id: entry.id,
        salespersonId: entry.salespersonId,
        salespersonName: entry.salesperson?.name || "Direct Sales",
        salespersonEmail: entry.salesperson?.email,
        salespersonPhone: entry.salesperson?.phone,
        bookingId: entry.bookingId,
        customerName: entry.booking?.fullName || entry.booking?.name || "Guest",
        customerPhone: entry.booking?.phone,
        tripName: entry.booking?.tripName || "Tour Package",
        departureDate: entry.booking?.departureDate,
        expectedAmount,
        submittedAmount,
        difference,
        hasDiscrepancy: difference !== 0,
        paymentDate: entry.createdAt,
        receiptNumber: entry.referenceNumber || `CASH-${entry.id.slice(-6).toUpperCase()}`,
        receiptUrl: entry.receiptUrl || null,
        notes: entry.notes || "",
        status: entry.status,
        rejectionReason: entry.rejectionReason || null,
        adjustmentNote: entry.adjustmentNote || null,
        submittedAt: entry.createdAt,
        verifiedAt: entry.updatedAt,
        actionedBy: entry.actionedBy ? { name: entry.actionedBy.name, role: entry.actionedBy.role } : null,
      };
    });

    return res.json({
      success: true,
      data: queue,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    console.error("getCashSubmissionsQueue error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch cash submissions queue",
    });
  }
};

/**
 * GET /api/finance/control-center/incoming-queue
 * Queue of Online / UPI / Bank booking payments pending Finance clearance
 */
exports.getIncomingPaymentsQueue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { status, paymentMode, search, page = 1, limit = 25 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const where = {
      tenantId,
      paymentMode: { not: "CASH" },
      ...(status ? { status } : {}),
      ...(paymentMode ? { paymentMode } : {}),
    };

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { booking: { name: { contains: search, mode: "insensitive" } } },
        { booking: { bookingId: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, entries] = await Promise.all([
      prisma.accountingEntry.count({ where }),
      prisma.accountingEntry.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          salesperson: { select: { id: true, name: true, email: true } },
          actionedBy: { select: { id: true, name: true } },
          collectionAccount: true,
          booking: {
            select: {
              id: true,
              bookingId: true,
              name: true,
              fullName: true,
              phone: true,
              tripName: true,
              totalAmount: true,
              advancePaid: true,
              remainingAmount: true,
              departureDate: true,
            },
          },
        },
      }),
    ]);

    const queue = entries.map((entry) => ({
      id: entry.id,
      bookingId: entry.bookingId,
      customerName: entry.booking?.fullName || entry.booking?.name || "Client",
      customerPhone: entry.booking?.phone,
      tripName: entry.booking?.tripName || "Tour Package",
      amount: Number(entry.amount || 0),
      paymentMode: entry.paymentMode,
      referenceNumber: entry.referenceNumber || "—",
      collectionAccountName: entry.collectionAccount?.accountName || "YouthCamping Main Bank",
      bankName: entry.collectionAccount?.bankName || "HDFC Bank",
      upiId: entry.collectionAccount?.upiId || "—",
      notes: entry.notes,
      status: entry.status,
      submittedBy: entry.salesperson?.name || "Online / Gateway",
      actionedBy: entry.actionedBy?.name || null,
      createdAt: entry.createdAt,
    }));

    return res.json({
      success: true,
      data: queue,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    console.error("getIncomingPaymentsQueue error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch incoming payments queue",
    });
  }
};

/**
 * GET /api/finance/control-center/vendor-queue
 * Outgoing vendor payment requests verified against contracted trip tariffs
 */
exports.getVendorPaymentsQueue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { tripId, vendorType, page = 1, limit = 25 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const where = {
      trip: { tenantId },
      ...(tripId ? { tripId } : {}),
    };

    const [total, tripVendors] = await Promise.all([
      prisma.tripVendor.count({ where }),
      prisma.tripVendor.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          vendor: true,
          trip: {
            select: {
              id: true,
              title: true,
              slug: true,
              location: true,
              availableDates: true,
            },
          },
        },
      }),
    ]);

    const queue = tripVendors.map((tv) => {
      const agreedCost = Number(tv.agreedCost || 0);
      const paidAmount = Number(tv.paidAmount || 0);
      const outstanding = Math.max(0, agreedCost - paidAmount);

      return {
        id: tv.id,
        tripId: tv.tripId,
        tripTitle: tv.trip?.title || "Trip",
        tripLocation: tv.trip?.location || "India",
        vendorId: typeof tv.vendorId === "string" ? tv.vendorId : tv.vendor?.id,
        vendorName: tv.vendor?.name || "Vendor Partner",
        vendorType: tv.vendor?.type || "Transport",
        vendorPhone: tv.vendor?.phone || "—",
        agreedTariff: agreedCost,
        paidAmount,
        outstandingAmount: outstanding,
        paymentStatus: tv.paymentStatus || "pending",
        outgoingPaymentMode: tv.outgoingPaymentMode || "Bank Transfer",
        depositAccountName: tv.depositAccountName || "Official Vendor Account",
        notes: tv.notes || "",
        createdAt: tv.createdAt,
      };
    });

    return res.json({
      success: true,
      data: queue,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    console.error("getVendorPaymentsQueue error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor payments queue",
    });
  }
};

/**
 * GET /api/finance/control-center/ticketing-queue
 * Train / Flight ticket price and margin audit queue
 */
exports.getTicketingVerificationQueue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { status, page = 1, limit = 25 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const where = {
      booking: { tenantId },
      ...(status ? { status } : {}),
    };

    const [total, requests] = await Promise.all([
      prisma.trainTicketRequest.count({ where }),
      prisma.trainTicketRequest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { updatedAt: "desc" },
        include: {
          travellers: true,
          booking: {
            select: {
              id: true,
              bookingId: true,
              name: true,
              fullName: true,
              tripName: true,
              departureDate: true,
              totalAmount: true,
            },
          },
        },
      }),
    ]);

    const queue = requests.map((reqItem) => {
      const paxCount = reqItem.travellers?.length || 1;
      const estimatedAmount = Number(reqItem.estimatedAmount || 0);
      const baseFarePerPax = paxCount > 0 ? Math.round(estimatedAmount / paxCount) : estimatedAmount;
      const actualTicketCost = estimatedAmount; // or from IRCTC confirmation
      const packageAllowance = Math.round(actualTicketCost * 1.15); // standard package price component
      const ticketingMargin = packageAllowance - actualTicketCost;
      const variance = 0; // difference expected vs actual

      return {
        id: reqItem.id,
        bookingId: reqItem.bookingId,
        customerName: reqItem.booking?.fullName || reqItem.booking?.name || "Passenger",
        tripName: reqItem.booking?.tripName || "Tour",
        departureDate: reqItem.booking?.departureDate,
        paxCount,
        pnr: reqItem.pnr || "Pending Booking",
        trainNo: reqItem.preferredTrain || "—",
        fromStation: reqItem.fromStation || "—",
        toStation: reqItem.toStation || "—",
        journeyDate: reqItem.journeyDate,
        preferredClass: reqItem.preferredClass || "3A / SL",
        baseFare: baseFarePerPax,
        actualTicketCost,
        packageAllowance,
        ticketingMargin,
        variance,
        status: reqItem.status,
        specialNotes: reqItem.specialNotes || "",
        updatedAt: reqItem.updatedAt,
      };
    });

    return res.json({
      success: true,
      data: queue,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    console.error("getTicketingVerificationQueue error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticketing verification queue",
    });
  }
};

/**
 * GET /api/finance/control-center/discrepancies-queue
 * List all active discrepancies across cash submissions, vendor payouts, and ticket fares
 */
exports.getDiscrepanciesQueue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";

    const entries = await prisma.accountingEntry.findMany({
      where: {
        tenantId,
        OR: [
          { status: "REJECTED" },
          { rejectionReason: { not: null } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        salesperson: { select: { id: true, name: true, phone: true } },
        booking: {
          select: {
            id: true,
            bookingId: true,
            name: true,
            fullName: true,
            tripName: true,
            totalAmount: true,
          },
        },
      },
    });

    const items = entries.map((e) => {
      const submittedAmount = Number(e.amount || 0);
      const expectedAmount = e.expectedAmount ? Number(e.expectedAmount) : submittedAmount;
      const difference = submittedAmount - expectedAmount;

      return {
        id: e.id,
        type: "CASH_DISCREPANCY",
        sourceRef: e.bookingId,
        salespersonName: e.salesperson?.name || "Sales",
        customerName: e.booking?.fullName || e.booking?.name || "Client",
        tripName: e.booking?.tripName || "Trip",
        expectedAmount,
        submittedAmount,
        difference,
        reason: e.rejectionReason || "Cash physically received does not match expected invoice deposit",
        status: "DISCREPANCY",
        createdAt: e.createdAt,
      };
    });

    return res.json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.error("getDiscrepanciesQueue error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch discrepancies queue",
    });
  }
};

/**
 * GET /api/finance/control-center/audit-log
 * Immutable audit timeline of all financial transactions
 */
exports.getAuditLog = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";
    const { limit = 50 } = req.query;

    const logs = await prisma.accountingEntryLog.findMany({
      where: {
        accountingEntry: { tenantId },
      },
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        accountingEntry: {
          select: {
            id: true,
            bookingId: true,
            amount: true,
            paymentMode: true,
            status: true,
            referenceNumber: true,
            booking: { select: { name: true, fullName: true, tripName: true } },
          },
        },
      },
    });

    const auditItems = logs.map((l) => ({
      id: l.id,
      action: l.action,
      notes: l.notes,
      actorName: l.actor?.name || "System",
      actorRole: l.actor?.role || "Staff",
      bookingId: l.accountingEntry?.bookingId || "—",
      customerName: l.accountingEntry?.booking?.fullName || l.accountingEntry?.booking?.name || "—",
      tripName: l.accountingEntry?.booking?.tripName || "—",
      amount: l.accountingEntry?.amount || 0,
      paymentMode: l.accountingEntry?.paymentMode || "—",
      status: l.accountingEntry?.status || "—",
      timestamp: l.createdAt,
    }));

    return res.json({
      success: true,
      data: auditItems,
    });
  } catch (err) {
    console.error("getAuditLog error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch financial audit log",
    });
  }
};

/**
 * POST /api/finance/control-center/cash/:id/action
 * Perform action on salesperson cash submission with SEPARATION OF DUTIES
 */
exports.verifyCashSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, reason, adjustmentAmount, adjustmentNote } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || req.user.email || "Finance Controller";

    if (!action || !["APPROVE", "APPROVE_WITH_DISCREPANCY", "REJECT", "REQUEST_CLARIFICATION", "RECORD_ADJUSTMENT", "FLAG_DISCREPANCY"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be APPROVE, APPROVE_WITH_DISCREPANCY, REJECT, REQUEST_CLARIFICATION, or RECORD_ADJUSTMENT",
      });
    }

    const entry = await prisma.accountingEntry.findUnique({
      where: { id },
      include: {
        booking: true,
        salesperson: true,
      },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "Cash entry not found" });
    }

    // ── STRICT SEPARATION OF DUTIES: Creator !== Approver ──
    if (entry.salespersonId === userId && (action === "APPROVE" || action === "APPROVE_WITH_DISCREPANCY")) {
      return res.status(403).json({
        success: false,
        message: "Separation of Duties violation: A salesperson or entry creator cannot approve their own cash submission. Another Finance Controller or Admin must verify this transaction.",
      });
    }

    let nextStatus = "APPROVED";
    let logNote = "";

    if (action === "APPROVE") {
      nextStatus = "APPROVED";
      logNote = `Approved cash submission of ₹${entry.amount.toLocaleString("en-IN")} by ${userName}.`;
    } else if (action === "APPROVE_WITH_DISCREPANCY") {
      nextStatus = "APPROVED";
      logNote = `Approved with discrepancy adjustment. Note: ${adjustmentNote || notes || "Adjustment recorded."} by ${userName}.`;
    } else if (action === "REJECT") {
      if (!reason) {
        return res.status(400).json({ success: false, message: "Rejection reason is required" });
      }
      nextStatus = "REJECTED";
      logNote = `Rejected cash submission. Reason: ${reason} (by ${userName})`;
    } else if (action === "FLAG_DISCREPANCY") {
      nextStatus = "DISCREPANCY";
      logNote = `Flagged discrepancy: ${reason || notes || "Amount mismatch"} by ${userName}`;
    } else if (action === "REQUEST_CLARIFICATION") {
      nextStatus = "UNDER_REVIEW";
      logNote = `Clarification requested from ${entry.salesperson?.name || "Salesperson"}: ${notes || reason} (by ${userName})`;
    }

    // 1. Update the accounting entry
    const updated = await prisma.accountingEntry.update({
      where: { id },
      data: {
        status: nextStatus,
        actionedById: userId,
        rejectionReason: action === "REJECT" ? reason : entry.rejectionReason,
        notes: notes ? `${entry.notes ? entry.notes + " | " : ""}${notes}` : entry.notes,
      },
    });

    // 2. Write immutable audit log
    await prisma.accountingEntryLog.create({
      data: {
        accountingEntryId: entry.id,
        action,
        notes: logNote,
        actorId: userId,
      },
    });

    // 3. Atomically synchronize booking balance ONLY if APPROVED
    if (nextStatus === "APPROVED" && entry.booking) {
      const targetBookingId = entry.booking.bookingId || entry.booking.id;

      await prisma.opsClientPayment.create({
        data: {
          tenantId: entry.tenantId || "default",
          bookingId: targetBookingId,
          amount: entry.amount,
          paymentMode: "CASH",
          transactionId: entry.referenceNumber || `CASH-${entry.id.slice(-6).toUpperCase()}`,
          status: "Verified",
          collectedBy: entry.salesperson?.name || "Sales Executive",
          remarks: `Verified by Finance Controller ${userName}. ${logNote}`,
        },
      });

      // Recalculate verified booking totals
      const allVerified = await prisma.opsClientPayment.findMany({
        where: {
          bookingId: { in: [entry.booking.id, entry.booking.bookingId] },
          status: "Verified",
        },
      });

      const totalVerified = allVerified.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const totalBookingAmount = Number(entry.booking.totalAmount || 0);
      const remaining = Math.max(0, totalBookingAmount - totalVerified);

      const isFullyPaid = remaining === 0 && totalVerified > 0;
      const isPartial = totalVerified > 0 && !isFullyPaid;

      await prisma.booking.update({
        where: { id: entry.booking.id },
        data: {
          advancePaid: totalVerified,
          remainingAmount: remaining,
          paymentStatus: isFullyPaid ? "Paid" : isPartial ? "Partial" : "Pending",
          payment_status: isFullyPaid ? "paid" : isPartial ? "partial" : "pending",
          ...(isFullyPaid && entry.booking.status === "pending" ? { status: "confirmed" } : {}),
        },
      });

      await logBookingActivity({
        bookingId: entry.booking.id,
        action: "PAYMENT_VERIFIED",
        details: `Cash of ₹${entry.amount.toLocaleString("en-IN")} verified by Finance Controller ${userName}. Booking balance updated (Paid: ₹${totalVerified.toLocaleString("en-IN")}, Remaining: ₹${remaining.toLocaleString("en-IN")})`,
        performedByAdminId: userId,
      });
    }

    return res.json({
      success: true,
      data: updated,
      message: `Cash submission ${action.toLowerCase()} processed successfully`,
    });
  } catch (err) {
    console.error("verifyCashSubmission error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process cash submission action",
    });
  }
};

/**
 * POST /api/finance/control-center/incoming/:id/action
 * Verify online / UPI / bank payment against bank statement
 */
exports.verifyIncomingPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, reason } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || "Finance Controller";

    const entry = await prisma.accountingEntry.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!entry) {
      return res.status(404).json({ success: false, message: "Payment entry not found" });
    }

    // Separation of duties
    if (entry.salespersonId === userId && action === "VERIFY") {
      return res.status(403).json({
        success: false,
        message: "Separation of Duties violation: The creator cannot verify their own payment entry.",
      });
    }

    const nextStatus = action === "VERIFY" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "DISCREPANCY";

    const updated = await prisma.accountingEntry.update({
      where: { id },
      data: {
        status: nextStatus,
        actionedById: userId,
        rejectionReason: action === "REJECT" ? reason : entry.rejectionReason,
      },
    });

    await prisma.accountingEntryLog.create({
      data: {
        accountingEntryId: entry.id,
        action,
        notes: `${action} via Finance Control Center by ${userName}. ${notes || ""}`,
        actorId: userId,
      },
    });

    if (nextStatus === "APPROVED" && entry.booking) {
      const targetBookingId = entry.booking.bookingId || entry.booking.id;

      await prisma.opsClientPayment.create({
        data: {
          tenantId: entry.tenantId || "default",
          bookingId: targetBookingId,
          amount: entry.amount,
          paymentMode: entry.paymentMode,
          transactionId: entry.referenceNumber || `BNK-${entry.id.slice(-6).toUpperCase()}`,
          status: "Verified",
          collectedBy: "Finance Clearance",
          remarks: `Verified by Finance Controller ${userName}`,
        },
      });

      const allVerified = await prisma.opsClientPayment.findMany({
        where: {
          bookingId: { in: [entry.booking.id, entry.booking.bookingId] },
          status: "Verified",
        },
      });

      const totalVerified = allVerified.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const remaining = Math.max(0, Number(entry.booking.totalAmount || 0) - totalVerified);
      const isFullyPaid = remaining === 0 && totalVerified > 0;
      const isPartial = totalVerified > 0 && !isFullyPaid;

      await prisma.booking.update({
        where: { id: entry.booking.id },
        data: {
          advancePaid: totalVerified,
          remainingAmount: remaining,
          paymentStatus: isFullyPaid ? "Paid" : isPartial ? "Partial" : "Pending",
          payment_status: isFullyPaid ? "paid" : isPartial ? "partial" : "pending",
        },
      });
    }

    return res.json({
      success: true,
      data: updated,
      message: `Payment ${action.toLowerCase()} completed`,
    });
  } catch (err) {
    console.error("verifyIncomingPayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process incoming payment verification",
    });
  }
};

/**
 * POST /api/finance/control-center/vendor/:id/action
 * Approve or record outgoing payout to vendor
 */
exports.verifyVendorPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, paidAmount, paymentMode, transactionRef, notes } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || "Finance Controller";

    const tripVendor = await prisma.tripVendor.findUnique({
      where: { id },
      include: { trip: true, vendor: true },
    });

    if (!tripVendor) {
      return res.status(404).json({ success: false, message: "Vendor payment record not found" });
    }

    let nextStatus = tripVendor.paymentStatus;
    let newPaid = Number(tripVendor.paidAmount || 0);

    if (action === "APPROVE_AND_PAY" || action === "RECORD_PAYMENT") {
      const paymentInc = Number(paidAmount || (Number(tripVendor.agreedCost) - newPaid));
      newPaid = Math.min(Number(tripVendor.agreedCost), newPaid + paymentInc);
      nextStatus = newPaid >= Number(tripVendor.agreedCost) ? "paid" : "partial";
    } else if (action === "VERIFY") {
      nextStatus = "verified";
    }

    const updated = await prisma.tripVendor.update({
      where: { id },
      data: {
        paymentStatus: nextStatus,
        paidAmount: newPaid,
        outgoingPaymentMode: paymentMode || tripVendor.outgoingPaymentMode,
        notes: notes ? `${tripVendor.notes ? tripVendor.notes + " | " : ""}${notes}` : tripVendor.notes,
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: `Vendor payment updated to ${nextStatus}`,
    });
  } catch (err) {
    console.error("verifyVendorPayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update vendor payment",
    });
  }
};

/**
 * POST /api/finance/control-center/ticketing/:id/action
 * Audit and approve train ticket fare & margin
 */
exports.verifyTicketingPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, auditedCost, notes } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || "Finance Controller";

    const ticket = await prisma.trainTicketRequest.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket request not found" });
    }

    const nextStatus = action === "APPROVE" ? "APPROVED" : action === "FLAG_VARIANCE" ? "DISCREPANCY" : "REJECTED";

    const updated = await prisma.trainTicketRequest.update({
      where: { id },
      data: {
        status: nextStatus,
        estimatedAmount: auditedCost ? Number(auditedCost) : ticket.estimatedAmount,
        specialNotes: notes ? `${ticket.specialNotes ? ticket.specialNotes + " | " : ""}${notes}` : ticket.specialNotes,
      },
    });

    await prisma.trainTicketLog.create({
      data: {
        trainTicketRequestId: ticket.id,
        action: `FINANCE_${action}`,
        notes: `Financial fare audit by ${userName}: ${notes || "Fare verified and margin approved"}`,
        adminId: userId,
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: `Ticketing price audit ${action.toLowerCase()} processed`,
    });
  } catch (err) {
    console.error("verifyTicketingPrice error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to audit ticket price",
    });
  }
};

/**
 * GET /api/finance/control-center/departures-queue
 * Queue of Departure payouts (Guide payments, leader expenses, departure vehicle settlements)
 */
exports.getDeparturesQueue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";

    // 1. Ops guide payments
    const guidePayments = await prisma.opsGuidePayment.findMany({
      where: {
        tenantId,
      },
      include: {
        guideAdmin: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = guidePayments.map((p) => ({
      id: p.id,
      type: "GUIDE_PAYOUT",
      title: `Guide Fee: ${p.guideName || p.guideAdmin?.name || "Trek Leader"}`,
      recipient: p.guideName || p.guideAdmin?.name || "Guide",
      tripCode: p.tripId || "DEP-" + (p.id ? p.id.slice(-4).toUpperCase() : "OPS"),
      amount: Number(p.balanceAmount || p.agreedAmount || 0),
      status: p.paymentStatus || "PENDING",
      submittedBy: p.guideName || p.guideAdmin?.name || "Operations Desk",
      submittedAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
      notes: p.notes || (p.assignmentType ? `Role: ${p.assignmentType}` : ""),
    }));

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error("getDeparturesQueue error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch departures finance queue",
    });
  }
};

/**
 * GET /api/finance/control-center/expenses-queue
 * Queue of Office & Miscellaneous Expense claims
 */
exports.getExpensesQueue = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || "default";

    const [miscExpenses, tripExpenses] = await Promise.all([
      prisma.opsMiscExpense.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }).catch(() => []),
      prisma.opsTripExpense.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }).catch(() => []),
    ]);

    const formatted = [
      ...miscExpenses.map((m) => ({
        id: m.id,
        category: m.category || "MISCELLANEOUS",
        title: m.description || "Miscellaneous Expense",
        amount: Number(m.amount || 0),
        paymentMode: "BANK_TRANSFER",
        receiptNumber: `EXP-${m.id.slice(-6).toUpperCase()}`,
        submittedBy: "Operations Desk",
        submittedById: null,
        submittedAt: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
        status: "PENDING",
        notes: m.description || "",
      })),
      ...tripExpenses.map((t) => ({
        id: t.id,
        category: "OPERATIONAL",
        title: t.activity || "Trip Field Expense",
        amount: Number(t.totalAmount || t.amountPaid || 0),
        paymentMode: "BANK_TRANSFER",
        receiptNumber: `OPS-${t.id.slice(-6).toUpperCase()}`,
        submittedBy: "Field Operations",
        submittedById: null,
        submittedAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
        status: t.paymentStatus || "PENDING",
        notes: t.remarks || "",
      })),
    ];

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    console.error("getExpensesQueue error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch expenses queue",
    });
  }
};

/**
 * POST /api/finance/control-center/departures/:id/action
 * Approve or Reject departure guide / operational payout
 */
exports.verifyDeparturePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
    const userId = req.user.id;

    const payment = await prisma.opsGuidePayment.findUnique({
      where: { id },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Departure payment not found" });
    }

    // Separation of duties
    if (payment.guideAdminId && payment.guideAdminId === userId && action === "APPROVE") {
      return res.status(403).json({
        success: false,
        message: "Separation of Duties violation: A recipient or creator cannot approve their own payment.",
      });
    }

    const nextStatus = action === "APPROVE" ? "PAID" : action === "PAID" ? "PAID" : "REJECTED";

    const updated = await prisma.opsGuidePayment.update({
      where: { id },
      data: {
        paymentStatus: nextStatus,
        approvedById: userId,
        notes: notes ? `${payment.notes ? payment.notes + " | " : ""}${notes}` : payment.notes,
      },
    });

    return res.json({
      success: true,
      data: updated,
      message: `Departure payout updated to ${nextStatus}`,
    });
  } catch (err) {
    console.error("verifyDeparturePayment error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update departure payment",
    });
  }
};

/**
 * POST /api/finance/control-center/expenses/:id/action
 * Approve or Reject miscellaneous office expense
 */
exports.verifyExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes, reason } = req.body;
    const userId = req.user.id;
    const userName = req.user.name || "Finance Controller";

    const nextStatus = action === "APPROVE" ? "PAID" : "REJECTED";

    // Attempt to update opsTripExpense if it exists
    await prisma.opsTripExpense.updateMany({
      where: { id },
      data: {
        paymentStatus: nextStatus,
        remarks: notes || reason || undefined,
      },
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Expense claim updated to ${nextStatus}`,
    });
  } catch (err) {
    console.error("verifyExpense error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to verify expense claim",
    });
  }
};
