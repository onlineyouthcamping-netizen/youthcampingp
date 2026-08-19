const { prisma } = require("../lib/prisma");
const { logAction } = require("../utils/auditLogger");

/**
 * POST /api/finance/refunds
 * Create a new refund / credit note request. Initial status: PENDING_APPROVAL.
 */
async function createRefundRequest(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const createdById = req.user?.id || req.admin?.id;
    const {
      bookingId,
      refundReason = "CUSTOMER_CANCELLATION",
      refundReasonText,
      refundMethod = "CASH_REFUND", // CASH_REFUND | CREDIT_NOTE | HYBRID
      refundAmount = 0,
      creditNoteAmount = 0,
      refundPolicyApplied,
      gatewayMetadata,
    } = req.body;

    if (!bookingId) {
      return res.status(400).json({ success: false, message: "bookingId is required" });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: bookingId }, { bookingId: bookingId }],
        tenantId,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Use only advancePaid — never fall back to booking.amount (the full trip price)
    const originalPaid = Number(booking.advancePaid) || 0;
    const numCash = Number(refundAmount) || 0;
    const numCredit = Number(creditNoteAmount) || 0;
    const totalRequested = numCash + numCredit;

    if (totalRequested <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total refund amount (cash + credit note) must be greater than 0",
      });
    }

    if (originalPaid <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot create a refund for a booking with ₹0 paid. No payment has been collected.",
      });
    }

    if (totalRequested > originalPaid) {
      return res.status(400).json({
        success: false,
        message: `Total refund requested (₹${totalRequested}) exceeds total paid amount (₹${originalPaid})`,
      });
    }

    const refund = await prisma.refundTransaction.create({
      data: {
        tenantId,
        bookingId: booking.bookingId,
        originalAmountPaid: originalPaid,
        refundReason,
        refundReasonText: refundReasonText || null,
        refundMethod,
        refundAmount: numCash,
        creditNoteAmount: numCredit,
        creditNoteStatus: numCredit > 0 ? "PENDING_APPROVAL" : "NONE",
        refundPolicyApplied: refundPolicyApplied || "Standard Cancellation Policy",
        status: "PENDING_APPROVAL",
        gatewayMetadata: gatewayMetadata || null,
        createdById,
      },
    });

    await logAction({
      tenantId,
      actorUserId: createdById,
      bookingId: booking.bookingId,
      action: "CREATE",
      entityType: "REFUND",
      entityId: refund.id,
      changeSummary: `Refund request created for booking #${booking.bookingId}: ₹${numCash} Cash + ₹${numCredit} Credit Note`,
      newValue: refund,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Staff",
    });

    return res.status(201).json({
      success: true,
      message: "Refund request submitted for Finance verification",
      data: refund,
    });
  } catch (error) {
    console.error("❌ Error creating refund request:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create refund request" });
  }
}

/**
 * GET /api/finance/refunds
 * List refund history with status and booking filters.
 */
async function getRefunds(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { bookingId, status, refundMethod, page = 1, limit = 20 } = req.query;

    const where = { tenantId };
    if (bookingId) {
      where.OR = [{ bookingId }, { booking: { bookingId } }, { booking: { id: bookingId } }];
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (refundMethod && refundMethod !== "ALL") {
      where.refundMethod = refundMethod;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, refunds] = await Promise.all([
      prisma.refundTransaction.count({ where }),
      prisma.refundTransaction.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              bookingId: true,
              fullName: true,
              name: true,
              phone: true,
              tripName: true,
              totalAmount: true,
              advancePaid: true,
              departureDate: true,
            },
          },
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          approvedBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          creditUsages: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: refunds,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching refunds:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch refunds" });
  }
}

/**
 * PATCH /api/finance/refunds/:id/approve
 * Finance Controller approves and settles refund / credit note issuance.
 * Rule: Creator cannot self-approve.
 */
async function approveRefund(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const approverId = req.user?.id || req.admin?.id;
    const { id } = req.params;
    const { refundReference, notes, validityMonths = 12 } = req.body;

    const refund = await prisma.refundTransaction.findFirst({
      where: { id, tenantId },
      include: { booking: true },
    });

    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund transaction not found" });
    }

    if (refund.status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        success: false,
        message: `Refund is already in ${refund.status} status and cannot be approved`,
      });
    }

    // Separation of Duties: Creator cannot approve own request
    if (refund.createdById === approverId) {
      return res.status(403).json({
        success: false,
        message: "Separation of Duties violation: You cannot approve a refund request that you created",
      });
    }

    const now = new Date();
    const validityEnd = new Date(now);
    validityEnd.setMonth(validityEnd.getMonth() + Number(validityMonths));

    const updateData = {
      status: "COMPLETED",
      approvedById: approverId,
      approvedDate: now,
      refundDate: now,
      refundReference: refundReference || refund.refundReference || `REF-${id.slice(-6).toUpperCase()}`,
      rejectionReason: null,
    };

    if (refund.creditNoteAmount > 0) {
      updateData.creditNoteStatus = "ACTIVE";
      updateData.creditNoteValidityStart = now;
      updateData.creditNoteValidityEnd = validityEnd;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const resTx = await tx.refundTransaction.update({
        where: { id },
        data: updateData,
      });

      // Update booking notes / history
      if (refund.bookingId) {
        await tx.booking.update({
          where: { bookingId: refund.bookingId },
          data: {
            adminNotes: refund.booking?.adminNotes
              ? `${refund.booking.adminNotes}\n[Refund Approved]: ₹${refund.refundAmount} Cash (Ref: ${updateData.refundReference}) + ₹${refund.creditNoteAmount} Credit Note`
              : `[Refund Approved]: ₹${refund.refundAmount} Cash (Ref: ${updateData.refundReference}) + ₹${refund.creditNoteAmount} Credit Note`,
          },
        });
      }

      return resTx;
    });

    await logAction({
      tenantId,
      actorUserId: approverId,
      bookingId: refund.bookingId,
      action: "APPROVE",
      entityType: "REFUND",
      entityId: id,
      changeSummary: `Refund #${id} approved by Finance Controller: ₹${refund.refundAmount} Cash + ₹${refund.creditNoteAmount} Credit Note`,
      beforeData: refund,
      afterData: updated,
      oldValue: refund,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Finance Controller",
    });

    return res.json({
      success: true,
      message: "Refund approved and completed successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error approving refund:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to approve refund" });
  }
}

/**
 * PATCH /api/finance/refunds/:id/reject
 * Reject a refund request with reason.
 */
async function rejectRefund(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const rejecterId = req.user?.id || req.admin?.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    const refund = await prisma.refundTransaction.findFirst({
      where: { id, tenantId },
    });

    if (!refund) {
      return res.status(404).json({ success: false, message: "Refund transaction not found" });
    }

    if (refund.status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        success: false,
        message: `Refund is already in ${refund.status} status and cannot be rejected`,
      });
    }

    const updated = await prisma.refundTransaction.update({
      where: { id },
      data: {
        status: "REJECTED",
        creditNoteStatus: "CANCELLED",
        approvedById: rejecterId,
        approvedDate: new Date(),
        rejectionReason: reason.trim(),
      },
    });

    await logAction({
      tenantId,
      actorUserId: rejecterId,
      bookingId: refund.bookingId,
      action: "REJECT",
      entityType: "REFUND",
      entityId: id,
      changeSummary: `Refund #${id} rejected by Finance Controller: ${reason.trim()}`,
      beforeData: refund,
      afterData: updated,
      oldValue: refund,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Finance Controller",
    });

    return res.json({
      success: true,
      message: "Refund request rejected",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error rejecting refund:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to reject refund" });
  }
}

module.exports = {
  createRefundRequest,
  getRefunds,
  approveRefund,
  rejectRefund,
};
