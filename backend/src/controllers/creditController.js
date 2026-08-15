const { prisma } = require("../lib/prisma");
const { logAction } = require("../utils/auditLogger");

/**
 * GET /api/finance/credits/:refundId
 * Return credit note amount, total usage, remaining balance, and validity status.
 */
async function getCreditNoteDetails(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { refundId } = req.params;

    const refund = await prisma.refundTransaction.findFirst({
      where: { id: refundId, tenantId },
      include: {
        booking: {
          select: {
            bookingId: true,
            fullName: true,
            name: true,
            phone: true,
            tripName: true,
          },
        },
        creditUsages: {
          include: {
            targetBooking: {
              select: {
                bookingId: true,
                fullName: true,
                name: true,
                tripName: true,
              },
            },
            appliedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!refund) {
      return res.status(404).json({ success: false, message: "Credit note / refund transaction not found" });
    }

    if (refund.creditNoteAmount <= 0) {
      return res.status(400).json({ success: false, message: "This transaction does not have a credit note component" });
    }

    const totalUsed = refund.creditUsages.reduce((sum, u) => sum + (Number(u.amountUsed) || 0), 0);
    const remainingBalance = Math.max(0, refund.creditNoteAmount - totalUsed);

    const now = new Date();
    const isExpired = refund.creditNoteValidityEnd ? new Date(refund.creditNoteValidityEnd) < now : false;

    return res.json({
      success: true,
      data: {
        refundId: refund.id,
        bookingId: refund.bookingId,
        customerName: refund.booking?.fullName || refund.booking?.name,
        originalCreditAmount: refund.creditNoteAmount,
        totalUsed,
        remainingBalance,
        validityStart: refund.creditNoteValidityStart,
        validityEnd: refund.creditNoteValidityEnd,
        status: isExpired ? "EXPIRED" : refund.creditNoteStatus,
        isExpired,
        usages: refund.creditUsages,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching credit note details:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch credit note details" });
  }
}

/**
 * PATCH /api/finance/credits/:refundId/apply
 * Atomically applies credit note balance to a target booking.
 * Rules:
 * - Validate expiry
 * - Validate remaining balance
 * - Prevent overuse
 * - Atomic transaction
 */
async function applyCreditNote(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const appliedById = req.user?.id || req.admin?.id;
    const { refundId } = req.params;
    const { targetBookingId, amountToUse, notes } = req.body;

    if (!targetBookingId) {
      return res.status(400).json({ success: false, message: "targetBookingId is required" });
    }

    const requestedAmount = Number(amountToUse);
    if (!requestedAmount || requestedAmount <= 0) {
      return res.status(400).json({ success: false, message: "amountToUse must be a positive number" });
    }

    const refund = await prisma.refundTransaction.findFirst({
      where: { id: refundId, tenantId },
      include: { creditUsages: true },
    });

    if (!refund) {
      return res.status(404).json({ success: false, message: "Credit note transaction not found" });
    }

    if (refund.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: `Credit note cannot be used because refund status is ${refund.status} (must be COMPLETED)`,
      });
    }

    if (refund.creditNoteAmount <= 0) {
      return res.status(400).json({ success: false, message: "This transaction does not have credit note funds" });
    }

    const now = new Date();
    if (refund.creditNoteValidityEnd && new Date(refund.creditNoteValidityEnd) < now) {
      return res.status(400).json({
        success: false,
        message: `Credit note expired on ${new Date(refund.creditNoteValidityEnd).toLocaleDateString("en-IN")}`,
      });
    }

    const totalPreviouslyUsed = refund.creditUsages.reduce((sum, u) => sum + (Number(u.amountUsed) || 0), 0);
    const balanceBefore = Math.max(0, refund.creditNoteAmount - totalPreviouslyUsed);

    if (balanceBefore <= 0) {
      return res.status(400).json({ success: false, message: "Credit note is fully exhausted" });
    }

    // Overuse prevention rule
    if (requestedAmount > balanceBefore) {
      return res.status(400).json({
        success: false,
        message: `Requested credit amount (₹${requestedAmount}) exceeds remaining balance (₹${balanceBefore})`,
      });
    }

    const targetBooking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: targetBookingId }, { bookingId: targetBookingId }],
        tenantId,
      },
    });

    if (!targetBooking) {
      return res.status(404).json({ success: false, message: "Target booking not found" });
    }

    const balanceAfter = balanceBefore - requestedAmount;
    const newStatus = balanceAfter === 0 ? "EXHAUSTED" : "PARTIALLY_USED";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create CreditNoteUsage
      const usage = await tx.creditNoteUsage.create({
        data: {
          tenantId,
          refundTransactionId: refund.id,
          targetBookingId: targetBooking.bookingId,
          amountUsed: requestedAmount,
          balanceBefore,
          balanceAfter,
          appliedById,
          notes: notes || `Credit applied from refund #${refund.id}`,
        },
      });

      // 2. Update parent RefundTransaction status
      await tx.refundTransaction.update({
        where: { id: refund.id },
        data: {
          creditNoteStatus: newStatus,
        },
      });

      // 3. Update target booking financials
      const currentAdvance = Number(targetBooking.advancePaid || 0);
      const updatedAdvance = currentAdvance + requestedAmount;
      const totalCost = Number(targetBooking.totalAmount || targetBooking.amount || 0);
      const remainingDue = Math.max(0, totalCost - updatedAdvance);

      await tx.booking.update({
        where: { bookingId: targetBooking.bookingId },
        data: {
          advancePaid: updatedAdvance,
          remainingAmount: remainingDue,
          paymentStatus: remainingDue === 0 ? "Paid" : "Partial",
          adminNotes: targetBooking.adminNotes
            ? `${targetBooking.adminNotes}\n[Credit Note Applied]: ₹${requestedAmount} from Refund #${refund.id}`
            : `[Credit Note Applied]: ₹${requestedAmount} from Refund #${refund.id}`,
        },
      });

      return usage;
    });

    await logAction({
      tenantId,
      actorUserId: appliedById,
      bookingId: targetBooking.bookingId,
      action: "APPLY",
      entityType: "CREDIT",
      entityId: result.id,
      changeSummary: `Applied ₹${requestedAmount} credit from Refund #${refund.id} to Booking #${targetBooking.bookingId}. Remaining credit balance: ₹${balanceAfter}`,
      newValue: result,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Staff",
    });

    return res.json({
      success: true,
      message: `Credit note applied successfully! ₹${requestedAmount} credited to booking #${targetBooking.bookingId}`,
      data: {
        usageId: result.id,
        amountApplied: requestedAmount,
        balanceBefore,
        balanceAfter,
        creditNoteStatus: newStatus,
        targetBookingId: targetBooking.bookingId,
      },
    });
  } catch (error) {
    console.error("❌ Error applying credit note:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to apply credit note" });
  }
}

/**
 * GET /api/finance/credits/active
 * Return all active credit notes with balance and impending expiry warnings (< 30 days).
 */
async function getActiveCreditNotes(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const refunds = await prisma.refundTransaction.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        creditNoteAmount: { gt: 0 },
        creditNoteStatus: { in: ["ACTIVE", "PARTIALLY_USED"] },
        OR: [{ creditNoteValidityEnd: null }, { creditNoteValidityEnd: { gte: now } }],
      },
      include: {
        booking: {
          select: {
            bookingId: true,
            fullName: true,
            name: true,
            phone: true,
            tripName: true,
          },
        },
        creditUsages: true,
      },
      orderBy: { creditNoteValidityEnd: "asc" },
    });

    const activeCredits = refunds
      .map((r) => {
        const totalUsed = r.creditUsages.reduce((sum, u) => sum + (Number(u.amountUsed) || 0), 0);
        const remainingBalance = Math.max(0, r.creditNoteAmount - totalUsed);

        const expiryDate = r.creditNoteValidityEnd ? new Date(r.creditNoteValidityEnd) : null;
        const isExpiringSoon = expiryDate ? expiryDate <= thirtyDaysFromNow : false;

        return {
          refundId: r.id,
          bookingId: r.bookingId,
          customerName: r.booking?.fullName || r.booking?.name,
          customerPhone: r.booking?.phone,
          tripName: r.booking?.tripName,
          originalCreditAmount: r.creditNoteAmount,
          totalUsed,
          remainingBalance,
          validityStart: r.creditNoteValidityStart,
          validityEnd: r.creditNoteValidityEnd,
          status: r.creditNoteStatus,
          isExpiringSoon,
        };
      })
      .filter((c) => c.remainingBalance > 0);

    return res.json({
      success: true,
      count: activeCredits.length,
      data: activeCredits,
    });
  } catch (error) {
    console.error("❌ Error fetching active credit notes:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch active credit notes" });
  }
}

module.exports = {
  getCreditNoteDetails,
  applyCreditNote,
  getActiveCreditNotes,
};
