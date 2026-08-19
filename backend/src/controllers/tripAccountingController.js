const { prisma } = require("../lib/prisma");
const { logAction } = require("../utils/auditLogger");

function isGuideExpenseType(assignmentType) {
  return (
    assignmentType === "EXPENSE" ||
    String(assignmentType || "").startsWith("EXPENSE_")
  );
}

/**
 * GET /api/finance/trip-accounting/:tripId
 * Real-time Trip P&L aggregating net revenues and vendor/operational costs.
 */
async function getTripPnL(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { tripId } = req.params;
    const { departureDate } = req.query;

    const trip = await prisma.trip.findFirst({
      where: {
        OR: [{ id: tripId }, { slug: tripId }],
        tenantId,
      },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    // 1. Fetch all bookings for this trip
    const bookingWhere = {
      tenantId,
      tripId: trip.id,
      status: { notIn: ["cancelled", "rejected"] },
    };
    if (departureDate) {
      bookingWhere.departureDate = new Date(departureDate);
    }

    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      select: {
        id: true,
        numberOfTravelers: true,
        totalAmount: true,
        amount: true,
        advancePaid: true,
        refundTransactions: {
          where: { status: "COMPLETED" },
          select: { id: true, refundAmount: true, creditNoteAmount: true },
        },
        couponRedemptions: {
          select: { id: true, discountAmount: true },
        },
        creditNoteUsages: {
          select: { id: true, amountUsed: true },
        },
      },
    });

    const totalPax = bookings.reduce(
      (sum, b) => sum + (Number(b.numberOfTravelers) || 1),
      0,
    );
    const grossSellingPrice = bookings.reduce(
      (sum, b) => sum + (Number(b.totalAmount || b.amount) || 0),
      0,
    );
    const totalCollected = bookings.reduce(
      (sum, b) => sum + (Number(b.advancePaid) || 0),
      0,
    );
    const totalDue = Math.max(0, grossSellingPrice - totalCollected);

    const totalCashRefunds = bookings.reduce(
      (sum, b) =>
        sum +
        b.refundTransactions.reduce(
          (rSum, r) => rSum + Number(r.refundAmount || 0),
          0,
        ),
      0,
    );
    const totalCreditsIssued = bookings.reduce(
      (sum, b) =>
        sum +
        b.refundTransactions.reduce(
          (rSum, r) => rSum + Number(r.creditNoteAmount || 0),
          0,
        ),
      0,
    );
    const totalCouponDiscounts = bookings.reduce(
      (sum, b) =>
        sum +
        b.couponRedemptions.reduce(
          (cSum, c) => cSum + Number(c.discountAmount || 0),
          0,
        ),
      0,
    );

    const netRevenue = Math.max(
      0,
      grossSellingPrice - totalCouponDiscounts - totalCashRefunds,
    );

    // 2. Fetch direct vendor, guide, and ticketing costs with targeted field selection
    const [
      vendors,
      guidePayments,
      miscExpenses,
      tripExpenses,
      financeTickets,
      trainTickets,
      opsVendorPayments,
    ] = await Promise.all([
      prisma.tripVendor.findMany({
        where: { tripId: trip.id, tenantId },
        select: {
          id: true,
          agreedCost: true,
          paidAmount: true,
        },
      }),
      prisma.opsGuidePayment.findMany({
        where: { tripId: trip.id, tenantId },
        select: {
          id: true,
          agreedAmount: true,
          advancePaid: true,
          balanceAmount: true,
        },
      }),
      prisma.opsMiscExpense.findMany({
        where: { tripId: trip.id, tenantId },
        select: { id: true, amount: true, category: true },
      }),
      prisma.opsTripExpense.findMany({
        where: { tripId: trip.id, tenantId },
        select: { id: true, amount: true, category: true },
      }),
      prisma.ticket.findMany({
        where: {
          tenantId,
          booking: { tripId: trip.id },
        },
        select: { id: true, cost: true, bookingId: true },
      }),
      prisma.trainTicket.findMany({
        where: {
          tenantId,
          booking: { tripId: trip.id },
          ticketStatus: { not: "CANCELLED" },
        },
        select: { id: true, netCost: true, totalCost: true, ticketAmount: true, expectedTicketAmount: true, bookingId: true },
      }),
      prisma.opsVendorPayment.findMany({
        where: {
          tenantId,
          tripId: trip.id,
          status: { not: "Rejected" },
        },
        select: {
          id: true,
          agreedAmount: true,
          advancePaid: true,
          remainingPayable: true,
          category: true,
        },
      }),
    ]);

    const vendorContractCost =
      vendors.reduce((sum, v) => sum + (Number(v.agreedCost) || 0), 0) +
      opsVendorPayments.reduce(
        (sum, v) => sum + (Number(v.agreedAmount) || 0),
        0,
      );
    const vendorPaid =
      vendors.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0) +
      opsVendorPayments.reduce(
        (sum, v) => sum + (Number(v.advancePaid) || 0),
        0,
      );
    const actualGuidePayments = guidePayments.filter(
      (payment) => !isGuideExpenseType(payment.assignmentType),
    );
    const guideExpenses = guidePayments.filter((payment) =>
      isGuideExpenseType(payment.assignmentType),
    );
    const guideCost = actualGuidePayments.reduce(
      (sum, g) => sum + (Number(g.agreedAmount) || 0),
      0,
    );
    const guidePaid = actualGuidePayments.reduce(
      (sum, g) => sum + (Number(g.advancePaid) || 0),
      0,
    );
    const guideExpenseCost = guideExpenses.reduce(
      (sum, expense) => sum + (Number(expense.agreedAmount) || 0),
      0,
    );
    const guideExpensePaid = guideExpenses.reduce(
      (sum, expense) => sum + (Number(expense.advancePaid) || 0),
      0,
    );
    const miscCost = miscExpenses.reduce(
      (sum, m) => sum + (Number(m.amount) || 0),
      0,
    );
    const tripActivityCost = tripExpenses.reduce(
      (sum, t) => sum + (Number(t.totalAmount) || 0),
      0,
    );
    let template = trip.trainTicketTemplate;
    if (typeof template === "string") {
      try {
        template = JSON.parse(template);
      } catch (_) {}
    }
    const templateExpectedPerPax =
      Number(template?.totalExpectedCostPerPassenger) || 0;
    const ticketCalculatedExpected = trainTickets.reduce(
      (sum, t) => sum + (Number(t.expectedTicketAmount) || 0),
      0,
    );
    const expectedTrainCost =
      ticketCalculatedExpected > 0
        ? ticketCalculatedExpected
        : templateExpectedPerPax * totalPax;
    const actualTrainCost = trainTickets.reduce(
      (sum, t) => sum + (Number(t.ticketAmount) || 0),
      0,
    );
    const trainCostVariance = actualTrainCost - expectedTrainCost;

    const ticketingCost =
      financeTickets.reduce((sum, t) => sum + (Number(t.cost) || 0), 0) +
      actualTrainCost;

    const totalDirectCost =
      vendorContractCost +
      guideCost +
      guideExpenseCost +
      miscCost +
      tripActivityCost +
      ticketingCost;
    const grossProfit = netRevenue - totalDirectCost;
    const profitMargin =
      netRevenue > 0
        ? Math.round((grossProfit / netRevenue) * 100 * 10) / 10
        : 0;

    return res.json({
      success: true,
      data: {
        tripId: trip.id,
        tripTitle: trip.title,
        departureDate: departureDate || "All Departures",
        passengerSummary: {
          totalBookings: bookings.length,
          totalPax,
        },
        revenue: {
          grossSellingPrice,
          totalCouponDiscounts,
          totalCashRefunds,
          totalCreditsIssued,
          netRevenue,
          totalCollected,
          totalDue,
        },
        trainTicketing: {
          expectedTrainCost,
          actualTrainCost,
          trainCostVariance,
          expectedCostPerPax: templateExpectedPerPax,
        },
        directCosts: {
          vendorContractCost,
          vendorPaid,
          guideCost,
          guidePaid,
          guideExpenseCost,
          guideExpensePaid,
          miscCost,
          tripActivityCost,
          expectedTrainCost,
          actualTrainCost,
          trainCostVariance,
          ticketingCost,
          totalDirectCost,
        },
        profitability: {
          grossProfit,
          profitMarginPercent: profitMargin,
          isProfitable: grossProfit >= 0,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error calculating Trip P&L:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to calculate Trip P&L" });
  }
}

/**
 * POST /api/finance/trip-accounting/snapshot
 * Close and create immutable snapshot of Trip P&L for closed departures.
 */
async function snapshotTripPnL(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const closedById = req.user?.id || req.admin?.id;
    const { tripId, departureDate } = req.body;

    if (!tripId) {
      return res.status(400).json({ success: false, message: "tripId is required" });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId,
        tripId,
        departureDate: departureDate ? new Date(departureDate) : undefined,
      },
      select: {
        id: true,
        bookingId: true,
        departureDate: true,
        totalAmount: true,
        amount: true,
        advancePaid: true,
        refundTransactions: {
          where: { status: "COMPLETED" },
          select: { id: true, refundAmount: true, creditNoteAmount: true },
        },
        couponRedemptions: {
          select: { id: true, discountAmount: true },
        },
        creditNoteUsages: {
          select: { id: true, amountUsed: true },
        },
      },
    });

    const now = new Date();
    const snapshots = [];

    for (const b of bookings) {
      const gross = Number(b.totalAmount || b.amount || 0);
      const paid = Number(b.advancePaid || 0);
      const couponDisc = b.couponRedemptions.reduce((s, c) => s + Number(c.discountAmount || 0), 0);
      const creditApplied = b.creditNoteUsages.reduce((s, c) => s + Number(c.amountUsed || 0), 0);
      const cashRef = b.refundTransactions.reduce((s, r) => s + Number(r.refundAmount || 0), 0);
      const creditIss = b.refundTransactions.reduce((s, r) => s + Number(r.creditNoteAmount || 0), 0);
      const net = Math.max(0, gross - couponDisc - cashRef);

      const snapshot = await prisma.tripAccounting.upsert({
        where: { bookingId: b.bookingId },
        update: {
          tripId,
          departureDate: b.departureDate,
          sellingPrice: gross,
          couponDiscount: couponDisc,
          creditNoteApplied: creditApplied,
          netRevenue: net,
          totalPaid: paid,
          balanceDue: Math.max(0, gross - paid),
          cashRefund: cashRef,
          creditIssued: creditIss,
          isSnapshotClosed: true,
          snapshotClosedAt: now,
        },
        create: {
          tenantId,
          bookingId: b.bookingId,
          tripId,
          departureDate: b.departureDate,
          sellingPrice: gross,
          couponDiscount: couponDisc,
          creditNoteApplied: creditApplied,
          netRevenue: net,
          totalPaid: paid,
          balanceDue: Math.max(0, gross - paid),
          cashRefund: cashRef,
          creditIssued: creditIss,
          isSnapshotClosed: true,
          snapshotClosedAt: now,
        },
      });

      snapshots.push(snapshot);
    }

    await logAction({
      tenantId,
      actorUserId: closedById,
      action: "APPROVE",
      entityType: "STATUS",
      changeSummary: `Closed financial P&L snapshot for trip #${tripId} (${snapshots.length} bookings closed)`,
      newValue: { count: snapshots.length, tripId, departureDate },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Finance Controller",
    });

    return res.json({
      success: true,
      message: `P&L snapshot closed for ${snapshots.length} bookings`,
      data: snapshots,
    });
  } catch (error) {
    console.error("❌ Error creating P&L snapshot:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create P&L snapshot" });
  }
}

module.exports = {
  getTripPnL,
  snapshotTripPnL,
};
