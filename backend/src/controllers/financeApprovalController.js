const { prisma } = require("../lib/prisma");

function resolveTenantId(req) {
  return req.user?.tenantId || req.admin?.tenantId || req.tenantId || "default";
}

function resolveUser(req) {
  return {
    id: req.user?.id || req.admin?.id || "system",
    name: req.user?.name || req.admin?.name || req.user?.email || req.admin?.email || "Admin User",
    role: (req.user?.role || req.admin?.role || "admin").trim().toLowerCase(),
  };
}

/**
 * Validates and sanitizes proof URLs to prevent XSS, SSRF, data-URIs, and path traversal
 */
function sanitizeProofUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (trimmed.length > 2048) return null;

  // Block dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.includes("<script") ||
    lower.includes("..")
  ) {
    return null;
  }

  // Must be valid http/https URL or safe relative upload path
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("/uploads/") ||
    lower.startsWith("/media/") ||
    lower.startsWith("/api/")
  ) {
    return trimmed;
  }

  return null;
}

/**
 * Sanitizes user input text (reasons / notes)
 */
function sanitizeReason(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/[<>]/g, "").trim().substring(0, 1000);
}

/**
 * Resolves OpsClientPayment by raw ID, adv- ID, or booking reference
 */
async function resolveCollectionPayment(txOrPrisma, paymentId, tenantId) {
  if (!paymentId) return null;
  const cleanId = String(paymentId).replace(/^adv-/, "");

  let payment = await txOrPrisma.opsClientPayment.findFirst({
    where: { id: paymentId, tenantId },
    include: {
      booking: {
        select: {
          id: true,
          bookingId: true,
          tripId: true,
          tripName: true,
          fullName: true,
          name: true,
          phone: true,
          email: true,
          departureDate: true,
          totalAmount: true,
          advancePaid: true,
        },
      },
      collectionAccount: true,
    },
  });

  if (payment) return payment;

  if (cleanId !== paymentId) {
    payment = await txOrPrisma.opsClientPayment.findFirst({
      where: { id: cleanId, tenantId },
      include: {
        booking: {
          select: {
            id: true,
            bookingId: true,
            tripId: true,
            tripName: true,
            fullName: true,
            name: true,
            phone: true,
            email: true,
            departureDate: true,
            totalAmount: true,
            advancePaid: true,
          },
        },
        collectionAccount: true,
      },
    });
    if (payment) return payment;
  }

  payment = await txOrPrisma.opsClientPayment.findFirst({
    where: {
      tenantId,
      OR: [
        { bookingId: cleanId },
        { booking: { id: cleanId } },
        { booking: { bookingId: cleanId } },
      ],
    },
    include: {
      booking: {
        select: {
          id: true,
          bookingId: true,
          tripId: true,
          tripName: true,
          fullName: true,
          name: true,
          phone: true,
          email: true,
          departureDate: true,
          totalAmount: true,
          advancePaid: true,
        },
      },
      collectionAccount: true,
    },
  });

  return payment;
}

/**
 * 1️⃣ Finance Controller Reviews Collection
 * State Transition: PENDING / REJECTED -> REVIEWED_FINANCE_CONTROLLER
 * Concurrency Safe: Uses atomic conditional updateMany
 * PATCH /api/finance/collections/:paymentId/review-fc
 */
exports.reviewCollectionFC = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body || {};
    const user = resolveUser(req);
    const tenantId = resolveTenantId(req);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify existence and tenant ownership
      const payment = await resolveCollectionPayment(tx, paymentId, tenantId);

      if (!payment) {
        throw { statusCode: 404, message: "Collection payment not found or access denied" };
      }

      // Check current state machine status
      if (payment.approvalStatus === "APPROVED_FOUNDER" || payment.status === "Verified") {
        throw {
          statusCode: 400,
          message: "Payment is already approved by Founder and verified. Cannot re-review.",
        };
      }

      const previousState = {
        approvalStatus: payment.approvalStatus,
        status: payment.status,
      };

      // 2. Atomic conditional update (guarantees race condition immunity)
      const updateResult = await tx.opsClientPayment.updateMany({
        where: {
          id: payment.id,
          tenantId,
          approvalStatus: { in: ["PENDING", "REJECTED"] },
          status: { not: "Verified" },
        },
        data: {
          approvalStatus: "REVIEWED_FINANCE_CONTROLLER",
          reviewedByFinanceAt: new Date(),
          reviewedByFinanceId: user.id,
          status: "Pending Verification",
        },
      });

      if (updateResult.count === 0) {
        throw {
          statusCode: 409,
          message: "Conflict: Collection payment has already been reviewed, approved, or modified concurrently.",
        };
      }

      const updated = await tx.opsClientPayment.findUnique({
        where: { id: payment.id },
        include: { booking: true, collectionAccount: true },
      });

      // 3. Create immutable audit log
      await tx.financeAuditLog.create({
        data: {
          tenantId,
          entityType: "CUSTOMER_PAYMENT",
          entityId: payment.id,
          tripId: payment.booking?.tripId || null,
          action: "REVIEWED_FC",
          performedBy: user.id,
          performedByName: user.name,
          performedAt: new Date(),
          oldValue: JSON.stringify(previousState),
          newValue: JSON.stringify({ approvalStatus: "REVIEWED_FINANCE_CONTROLLER", status: "Pending Verification" }),
          changeDescription: `Finance Controller reviewed collection of ₹${payment.amount} for booking ${payment.bookingId} (${payment.booking?.fullName || payment.booking?.name || "Client"})`,
          reason: sanitizeReason(reason) || null,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      status: "success",
      message: "Payment reviewed by Finance Controller. Awaiting founder approval.",
      payment: result,
    });
  } catch (err) {
    console.error("reviewCollectionFC error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to review collection payment",
    });
  }
};

/**
 * 2️⃣ Founder Approves Collection (Final Sign-off)
 * State Transition: REVIEWED_FINANCE_CONTROLLER -> APPROVED_FOUNDER (status: Verified)
 * Concurrency Safe: Uses atomic conditional updateMany
 * PATCH /api/finance/collections/:paymentId/approve-founder
 */
exports.approveCollectionFounder = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, proofFileUrl } = req.body || {};
    const user = resolveUser(req);
    const tenantId = resolveTenantId(req);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify existence and tenant ownership
      const payment = await resolveCollectionPayment(tx, paymentId, tenantId);

      if (!payment) {
        throw { statusCode: 404, message: "Collection payment not found or access denied" };
      }

      // Check state machine: Allow Founder/Admin to direct-approve from PENDING or REVIEWED_FINANCE_CONTROLLER
      const isFounderOrAdmin =
        user.role === "admin" ||
        user.role === "superadmin" ||
        user.role === "founder" ||
        user.role === "owner" ||
        req.user?.isSuperuser;

      if (payment.approvalStatus === "APPROVED_FOUNDER" && payment.status === "Verified") {
        return payment;
      }

      if (payment.approvalStatus !== "REVIEWED_FINANCE_CONTROLLER" && !isFounderOrAdmin) {
        throw {
          statusCode: 400,
          message: "Payment must be reviewed by Finance Controller before Founder approval.",
        };
      }

      const rawProofUrl = proofFileUrl || payment.proofFileUrl || payment.proofUrl;
      const validProofUrl = sanitizeProofUrl(rawProofUrl);

      // Mandatory Proof Check (Skip for CASH)
      const isCash = payment.paymentMode && payment.paymentMode.toUpperCase().includes("CASH");
      if (!validProofUrl && !isCash) {
        throw {
          statusCode: 400,
          message: "Valid receipt/payment proof screenshot is required before Founder approval.",
        };
      }

      const previousState = {
        approvalStatus: payment.approvalStatus,
        status: payment.status,
      };

      // 2. Atomic conditional update (guarantees race condition immunity)
      const updateResult = await tx.opsClientPayment.updateMany({
        where: {
          id: payment.id,
          tenantId,
          approvalStatus: { in: ["REVIEWED_FINANCE_CONTROLLER", "PENDING", "REJECTED"] },
        },
        data: {
          approvalStatus: "APPROVED_FOUNDER",
          approvedByFounderAt: new Date(),
          approvedByFounderId: user.id,
          status: "Verified",
          proofFileUrl: validProofUrl,
          proofUrl: validProofUrl,
        },
      });

      if (updateResult.count === 0 && payment.approvalStatus !== "APPROVED_FOUNDER") {
        throw {
          statusCode: 409,
          message: "Conflict: Payment has already been approved or modified concurrently.",
        };
      }

      const updated = await tx.opsClientPayment.findUnique({
        where: { id: payment.id },
        include: { booking: true, collectionAccount: true },
      });

      // 3. Create immutable audit log
      await tx.financeAuditLog.create({
        data: {
          tenantId,
          entityType: "CUSTOMER_PAYMENT",
          entityId: payment.id,
          tripId: payment.booking?.tripId || null,
          action: "APPROVED_FOUNDER",
          performedBy: user.id,
          performedByName: user.name,
          performedAt: new Date(),
          oldValue: JSON.stringify(previousState),
          newValue: JSON.stringify({ approvalStatus: "APPROVED_FOUNDER", status: "Verified" }),
          changeDescription: `Founder approved ₹${payment.amount} collection for booking ${payment.bookingId}. Marked as VERIFIED.`,
          reason: sanitizeReason(reason) || null,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
        },
      });

      // 4. Update booking totals and balance
      if (payment.booking) {
        const allVerified = await tx.opsClientPayment.findMany({
          where: {
            bookingId: { in: [payment.booking.id, payment.booking.bookingId] },
            status: "Verified",
          },
        });

        const totalVerified = allVerified.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const remaining = Math.max(0, Number(payment.booking.totalAmount || 0) - totalVerified);
        const isFullyPaid = remaining === 0 && totalVerified > 0;
        const isPartial = totalVerified > 0 && !isFullyPaid;

        await tx.booking.update({
          where: { id: payment.booking.id },
          data: {
            advancePaid: totalVerified,
            remainingAmount: remaining,
            paymentStatus: isFullyPaid ? "Paid" : isPartial ? "Partial" : "Pending",
            payment_status: isFullyPaid ? "paid" : isPartial ? "partial" : "pending",
          },
        });

        // Ensure AccountingEntry is approved / created
        try {
          const rawMode = String(payment.paymentMode || "UPI").toUpperCase();
          const normalizedMode = rawMode.includes("CASH")
            ? "CASH"
            : rawMode.includes("BANK") || rawMode.includes("NEFT") || rawMode.includes("IMPS")
              ? "BANK_TRANSFER"
              : "UPI";

          const existingEntry = await tx.accountingEntry.findFirst({
            where: {
              tenantId,
              bookingId: payment.booking.bookingId || payment.booking.id,
              amount: payment.amount,
            },
          });

          if (existingEntry) {
            await tx.accountingEntry.update({
              where: { id: existingEntry.id },
              data: {
                status: "APPROVED",
                collectionAccountId: payment.collectionAccountId || existingEntry.collectionAccountId,
                actionedById: user.id,
              },
            });
          } else {
            await tx.accountingEntry.create({
              data: {
                tenantId,
                bookingId: payment.booking.bookingId || payment.booking.id,
                amount: payment.amount,
                paymentMode: normalizedMode,
                collectionAccountId: payment.collectionAccountId,
                referenceNumber: payment.transactionId || `PAY-${payment.id}`,
                notes: payment.remarks || "Verified Founder Approval",
                status: "APPROVED",
                salespersonId: payment.booking.salesAdminId,
                actionedById: user.id,
              },
            });
          }
        } catch (entryErr) {
          console.warn("AccountingEntry sync in approveCollectionFounder skipped:", entryErr.message);
        }
      }

      return updated;
    });

    return res.json({
      success: true,
      status: "success",
      message: "Payment approved by founder. Marked as VERIFIED.",
      payment: result,
    });
  } catch (err) {
    console.error("approveCollectionFounder error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to approve collection payment",
    });
  }
};

/**
 * 3️⃣ Reject Payment (Either FC or Founder)
 * State Transition: PENDING / REVIEWED_FINANCE_CONTROLLER -> REJECTED
 * Concurrency Safe: Uses atomic conditional updateMany
 * PATCH /api/finance/collections/:paymentId/reject
 */
exports.rejectCollection = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body || {};
    const user = resolveUser(req);
    const tenantId = resolveTenantId(req);

    const sanitized = sanitizeReason(reason);
    if (!sanitized || sanitized.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Rejection reason is required (minimum 3 characters)",
        message: "Rejection reason is required (minimum 3 characters)",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await resolveCollectionPayment(tx, paymentId, tenantId);

      if (!payment) {
        throw { statusCode: 404, message: "Collection payment not found or access denied" };
      }

      if (payment.approvalStatus === "APPROVED_FOUNDER" || payment.status === "Verified") {
        throw {
          statusCode: 400,
          message: "Cannot reject an already approved and verified payment.",
        };
      }

      const previousState = {
        approvalStatus: payment.approvalStatus,
        status: payment.status,
      };

      // Atomic conditional update
      const updateResult = await tx.opsClientPayment.updateMany({
        where: {
          id: payment.id,
          tenantId,
          approvalStatus: { not: "APPROVED_FOUNDER" },
          status: { not: "Verified" },
        },
        data: {
          approvalStatus: "REJECTED",
          rejectionReason: sanitized,
          rejectionAt: new Date(),
          rejectedById: user.id,
          status: "Rejected",
        },
      });

      if (updateResult.count === 0) {
        throw {
          statusCode: 409,
          message: "Conflict: Payment has already been verified or modified concurrently.",
        };
      }

      const updated = await tx.opsClientPayment.findUnique({
        where: { id: payment.id },
        include: { booking: true, collectionAccount: true },
      });

      // Create immutable audit log
      await tx.financeAuditLog.create({
        data: {
          tenantId,
          entityType: "CUSTOMER_PAYMENT",
          entityId: payment.id,
          tripId: payment.booking?.tripId || null,
          action: "REJECTED",
          performedBy: user.id,
          performedByName: user.name,
          performedAt: new Date(),
          oldValue: JSON.stringify(previousState),
          newValue: JSON.stringify({ approvalStatus: "REJECTED", status: "Rejected" }),
          changeDescription: `Payment of ₹${payment.amount} for booking ${payment.bookingId} rejected: ${sanitized}`,
          reason: sanitized,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      status: "success",
      message: "Payment rejected. Sent for correction.",
      payment: result,
    });
  } catch (err) {
    console.error("rejectCollection error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to reject collection payment",
    });
  }
};

/**
 * 4️⃣ Upload Proof / Receipt for Collection
 * Validates URLs and file types securely
 * POST /api/finance/collections/:paymentId/upload-proof
 */
exports.uploadCollectionProof = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const user = resolveUser(req);
    const tenantId = resolveTenantId(req);

    let rawUrl = req.body?.proofFileUrl || req.body?.proofUrl || req.file?.path || req.file?.location;
    const validatedUrl = sanitizeProofUrl(rawUrl);

    if (!validatedUrl) {
      return res.status(400).json({
        success: false,
        error: "Invalid or insecure proof URL provided. Must be a valid HTTPS/HTTP or upload path.",
        message: "Invalid or insecure proof URL provided. Must be a valid HTTPS/HTTP or upload path.",
      });
    }

    const fileName = req.body?.proofFileName || req.file?.originalname || "receipt.png";
    const fileType = req.body?.proofFileType || req.file?.mimetype || "image/png";

    const result = await prisma.$transaction(async (tx) => {
      const payment = await resolveCollectionPayment(tx, paymentId, tenantId);

      if (!payment) {
        throw { statusCode: 404, message: "Collection payment not found or access denied" };
      }

      const updated = await tx.opsClientPayment.update({
        where: { id: payment.id },
        data: {
          proofFileUrl: validatedUrl,
          proofUrl: validatedUrl,
          proofUploadedAt: new Date(),
          proofFileName: fileName.substring(0, 255),
          proofFileType: fileType.substring(0, 50),
        },
        include: {
          booking: true,
          collectionAccount: true,
        },
      });

      // Create immutable audit log
      await tx.financeAuditLog.create({
        data: {
          tenantId,
          entityType: "CUSTOMER_PAYMENT",
          entityId: paymentId,
          tripId: payment.booking?.tripId || null,
          action: "PROOF_UPLOADED",
          performedBy: user.id,
          performedByName: user.name,
          performedAt: new Date(),
          oldValue: JSON.stringify({ proofFileUrl: payment.proofFileUrl }),
          newValue: JSON.stringify({ proofFileUrl: validatedUrl }),
          changeDescription: `Receipt proof uploaded: ${fileName}`,
          reason: null,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      status: "success",
      message: "Proof uploaded. Ready for approval.",
      proof_url: validatedUrl,
      payment: result,
    });
  } catch (err) {
    console.error("uploadCollectionProof error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to upload proof",
    });
  }
};

/**
 * 5️⃣ Get Payment Details with Full Approval & Audit History
 * GET /api/finance/collections/:paymentId
 */
exports.getCollectionDetailsWithAudit = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const tenantId = resolveTenantId(req);

    const payment = await resolveCollectionPayment(prisma, paymentId, tenantId);

    if (!payment) {
      const cleanId = String(paymentId || "").replace(/^adv-/, "");
      const booking = await prisma.booking.findFirst({
        where: {
          tenantId,
          OR: [{ id: cleanId }, { bookingId: cleanId }],
        },
        select: {
          id: true,
          bookingId: true,
          fullName: true,
          name: true,
          phone: true,
          email: true,
          tripName: true,
          tripId: true,
          departureDate: true,
          totalAmount: true,
          advancePaid: true,
          paymentMode: true,
          createdAt: true,
        },
      });

      if (booking) {
        return res.json({
          success: true,
          payment: {
            id: paymentId,
            tenantId,
            bookingId: booking.bookingId || booking.id,
            amount: booking.advancePaid || 0,
            paymentMode: booking.paymentMode || "UPI",
            status: "Pending Verification",
            approvalStatus: "PENDING",
            paymentDate: booking.createdAt,
            booking,
            collectionAccount: null,
          },
          auditTrail: [],
          approvalChain: {
            step1_financeController: { status: "PENDING" },
            step2_founder: { status: "PENDING" },
          },
        });
      }

      // Check if it's a vendor payment ID
      const vendorPayment = await prisma.opsVendorPayment.findFirst({
        where: {
          tenantId,
          id: cleanId,
        },
        include: {
          trip: {
            select: { id: true, title: true, slug: true },
          },
          collectionAccount: true,
        },
      });

      if (vendorPayment) {
        const auditTrail = await prisma.financeAuditLog.findMany({
          where: {
            tenantId,
            entityId: vendorPayment.id,
            entityType: { in: ["VENDOR_PAYOUT", "VENDOR_PAYMENT"] },
          },
          orderBy: { performedAt: "asc" },
        });

        const balanceDue = (vendorPayment.agreedAmount || 0) - (vendorPayment.advancePaid || 0);
        const requiresFounder = vendorPayment.requiresFounderApproval || balanceDue > 50000;

        return res.json({
          success: true,
          payment: vendorPayment,
          auditTrail,
          approvalChain: {
            step1_financeController: {
              status:
                vendorPayment.approvalStatus === "REVIEWED_FINANCE_CONTROLLER" ||
                vendorPayment.approvalStatus === "APPROVED_FOUNDER"
                  ? "DONE"
                  : vendorPayment.approvalStatus === "REJECTED"
                  ? "REJECTED"
                  : "PENDING",
              approvedAt: vendorPayment.reviewedByFinanceAt,
              approvedBy: vendorPayment.reviewedByFinanceId,
            },
            step2_founder: {
              status: vendorPayment.approvalStatus === "APPROVED_FOUNDER" ? "DONE" : "PENDING",
              approvedAt: vendorPayment.approvedByFounderAt,
              approvedBy: vendorPayment.approvedByFounderId,
              required: requiresFounder,
            },
          },
        });
      }

      return res.status(404).json({ success: false, message: "Payment not found or access denied" });
    }

    const auditTrail = await prisma.financeAuditLog.findMany({
      where: {
        tenantId,
        entityId: payment.id,
        entityType: "CUSTOMER_PAYMENT",
      },
      orderBy: { performedAt: "asc" },
    });

    return res.json({
      success: true,
      payment,
      auditTrail,
      approvalChain: {
        step1_financeController: {
          status:
            payment.approvalStatus === "REVIEWED_FINANCE_CONTROLLER" ||
            payment.approvalStatus === "APPROVED_FOUNDER"
              ? "DONE"
              : payment.approvalStatus === "REJECTED"
              ? "REJECTED"
              : "PENDING",
          approvedAt: payment.reviewedByFinanceAt,
          approvedBy: payment.reviewedByFinanceId,
        },
        step2_founder: {
          status: payment.approvalStatus === "APPROVED_FOUNDER" ? "DONE" : "PENDING",
          approvedAt: payment.approvedByFounderAt,
          approvedBy: payment.approvedByFounderId,
        },
      },
    });
  } catch (err) {
    console.error("getCollectionDetailsWithAudit error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch payment details" });
  }
};

/**
 * Vendor Payment Audit Trail & Details
 * GET /api/finance/vendor-payments/:paymentId
 */
exports.getVendorPaymentDetailsWithAudit = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const tenantId = resolveTenantId(req);
    const cleanId = String(paymentId).replace(/^vnd-/, "").replace(/^adv-/, "");

    let payment = await prisma.opsVendorPayment.findFirst({
      where: {
        tenantId,
        OR: [{ id: paymentId }, { id: cleanId }],
      },
      include: {
        trip: {
          select: { id: true, title: true, slug: true },
        },
        collectionAccount: true,
      },
    });

    if (!payment) {
      if (paymentId.startsWith("hb-")) {
        const hbId = paymentId.replace("hb-", "");
        const hb = await prisma.opsHotelBooking.findFirst({
          where: { id: hbId, tenantId },
          include: { trip: { select: { id: true, title: true, slug: true } } },
        });
        if (hb) {
          payment = {
            id: paymentId,
            tenantId,
            tripId: hb.tripId,
            vendorName: hb.hotelName,
            category: "Hotels",
            serviceDescription: `${hb.roomType || "Hotel"} Stay (${hb.numberOfRooms || 1} Rooms) - ${hb.location || ""}`,
            agreedAmount: hb.totalAmount || 0,
            advancePaid: hb.advancePaid || 0,
            remainingPayable: Math.max(0, (hb.totalAmount || 0) - (hb.advancePaid || 0)),
            paymentDate: hb.departureDate || hb.createdAt,
            paymentMode: "BANK_TRANSFER",
            status: (hb.advancePaid || 0) >= (hb.totalAmount || 0) && (hb.totalAmount || 0) > 0 ? "Paid" : "Pending Approval",
            approvalStatus: (hb.advancePaid || 0) >= (hb.totalAmount || 0) && (hb.totalAmount || 0) > 0 ? "APPROVED_FOUNDER" : "PENDING",
            trip: hb.trip,
            collectionAccount: null,
            createdAt: hb.createdAt,
          };
        }
      } else if (paymentId.startsWith("fl-")) {
        const flId = paymentId.replace("fl-", "");
        const fl = await prisma.opsTransportFleet.findFirst({
          where: { id: flId, tenantId },
          include: { trip: { select: { id: true, title: true, slug: true } } },
        });
        if (fl) {
          payment = {
            id: paymentId,
            tenantId,
            tripId: fl.tripId,
            vendorName: fl.vendorName || fl.driverName || "Transport Fleet",
            category: "Transport",
            serviceDescription: `${fl.vehicleType || "Fleet Vehicle"} (${fl.vehicleNumber || "Route Fleet"})`,
            agreedAmount: fl.totalAmount || 0,
            advancePaid: fl.advancePaid || 0,
            remainingPayable: Math.max(0, (fl.totalAmount || 0) - (fl.advancePaid || 0)),
            paymentDate: fl.departureDate || fl.createdAt,
            paymentMode: "BANK_TRANSFER",
            status: (fl.advancePaid || 0) >= (fl.totalAmount || 0) && (fl.totalAmount || 0) > 0 ? "Paid" : "Pending Approval",
            approvalStatus: (fl.advancePaid || 0) >= (fl.totalAmount || 0) && (fl.totalAmount || 0) > 0 ? "APPROVED_FOUNDER" : "PENDING",
            trip: fl.trip,
            collectionAccount: null,
            createdAt: fl.createdAt,
          };
        }
      } else if (paymentId.startsWith("gp-")) {
        const gpId = paymentId.replace("gp-", "");
        const gp = await prisma.opsGuidePayment.findFirst({
          where: { id: gpId, tenantId },
          include: { trip: { select: { id: true, title: true, slug: true } } },
        });
        if (gp) {
          payment = {
            id: paymentId,
            tenantId,
            tripId: gp.tripId,
            vendorName: gp.guideName,
            category: "Guides",
            serviceDescription: `${gp.assignmentType || "Trip Leader"} (${gp.daysWorked || 1} Days)`,
            agreedAmount: gp.agreedAmount || 0,
            advancePaid: gp.advancePaid || 0,
            remainingPayable: Math.max(0, (gp.agreedAmount || 0) - (gp.advancePaid || 0)),
            paymentDate: gp.departureDate || gp.createdAt,
            paymentMode: "BANK_TRANSFER",
            status: gp.paymentStatus === "PAID" ? "Paid" : "Pending Approval",
            approvalStatus: gp.paymentStatus === "PAID" ? "APPROVED_FOUNDER" : "PENDING",
            trip: gp.trip,
            collectionAccount: null,
            createdAt: gp.createdAt,
          };
        }
      } else if (paymentId.startsWith("act-")) {
        const actId = paymentId.replace("act-", "");
        const act = await prisma.opsActivity.findFirst({
          where: { id: actId, tenantId },
          include: { trip: { select: { id: true, title: true, slug: true } } },
        });
        if (act) {
          payment = {
            id: paymentId,
            tenantId,
            tripId: act.tripId,
            vendorName: act.vendorName || act.name || "Activity Provider",
            category: act.type === "MEAL" ? "Meals" : "Activities",
            serviceDescription: `${act.name} (${act.type || "Activity"})`,
            agreedAmount: act.actualCost || act.estimatedCost || 0,
            advancePaid: 0,
            remainingPayable: act.actualCost || act.estimatedCost || 0,
            paymentDate: act.departureDate || act.createdAt,
            paymentMode: "BANK_TRANSFER",
            status: act.status === "CONFIRMED" ? "Pending Approval" : "Not Paid",
            approvalStatus: "PENDING",
            trip: act.trip,
            collectionAccount: null,
            createdAt: act.createdAt,
          };
        }
      }
    }

    if (!payment) {
      return res.status(404).json({ success: false, message: "Vendor payment not found" });
    }

    const auditTrail = await prisma.financeAuditLog.findMany({
      where: {
        tenantId,
        entityId: payment.id,
        entityType: { in: ["VENDOR_PAYOUT", "VENDOR_PAYMENT"] },
      },
      orderBy: { performedAt: "asc" },
    });

    const balanceDue = (payment.agreedAmount || 0) - (payment.advancePaid || 0);
    const requiresFounder = payment.requiresFounderApproval || balanceDue > 50000;

    return res.json({
      success: true,
      payment,
      auditTrail,
      approvalChain: {
        step1_financeController: {
          status:
            payment.approvalStatus === "REVIEWED_FINANCE_CONTROLLER" ||
            payment.approvalStatus === "APPROVED_FOUNDER"
              ? "DONE"
              : payment.approvalStatus === "REJECTED"
              ? "REJECTED"
              : "PENDING",
          approvedAt: payment.reviewedByFinanceAt,
          approvedBy: payment.reviewedByFinanceId,
        },
        step2_founder: {
          status: payment.approvalStatus === "APPROVED_FOUNDER" ? "DONE" : "PENDING",
          approvedAt: payment.approvedByFounderAt,
          approvedBy: payment.approvedByFounderId,
          required: requiresFounder,
        },
      },
    });
  } catch (err) {
    console.error("getVendorPaymentDetailsWithAudit error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch vendor payment details" });
  }
};

/**
 * 6️⃣ Finance Controller Reviews Vendor Payout
 * Calculation: remainingPayable = agreedAmount - advancePaid (from DB)
 * Boundary rules:
 *   If remainingPayable > 50,000 -> requiresFounderApproval = true
 *   If remainingPayable <= 50,000 -> FC can clear directly to Paid/Verified or review
 * PATCH /api/finance/vendor-payments/:paymentId/review-fc
 */
exports.reviewVendorPaymentFC = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, directClear } = req.body || {};
    const user = resolveUser(req);
    const tenantId = resolveTenantId(req);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.opsVendorPayment.findFirst({
        where: { id: paymentId, tenantId },
        include: { trip: true, collectionAccount: true },
      });

      if (!payment) {
        throw { statusCode: 404, message: "Vendor payment not found or access denied" };
      }

      // Calculate strictly on the server-side from database fields
      const agreed = Number(payment.agreedAmount || 0);
      const advance = Number(payment.advancePaid || 0);
      const remainingPayable = agreed - advance;
      const requiresFounder = remainingPayable > 50000;

      const previousState = {
        approvalStatus: payment.approvalStatus,
        status: payment.status,
      };

      let newApprovalStatus = "REVIEWED_FINANCE_CONTROLLER";
      let newStatus = payment.status;

      // If <= 50K and FC directClear is requested, FC can clear it directly
      if (!requiresFounder && directClear) {
        newApprovalStatus = "APPROVED_FOUNDER";
        newStatus = "Paid";
      }

      const finalAdvance = newStatus === "Paid" ? Math.max(agreed, advance) : advance;
      const finalRemaining = Math.max(0, agreed - finalAdvance);

      // Atomic conditional update
      const updateResult = await tx.opsVendorPayment.updateMany({
        where: {
          id: paymentId,
          tenantId,
          approvalStatus: { in: ["PENDING", "REJECTED", "REVIEWED_FINANCE_CONTROLLER"] },
        },
        data: {
          approvalStatus: newApprovalStatus,
          reviewedByFinanceAt: new Date(),
          reviewedByFinanceId: user.id,
          requiresFounderApproval: requiresFounder,
          status: newStatus,
          advancePaid: finalAdvance,
          remainingPayable: finalRemaining,
        },
      });

      if (updateResult.count === 0) {
        throw {
          statusCode: 409,
          message: "Conflict: Vendor payment is not in a pending review state or has already been modified.",
        };
      }

      const updated = await tx.opsVendorPayment.findUnique({
        where: { id: paymentId },
        include: { trip: true, collectionAccount: true },
      });

      // Create immutable audit log
      await tx.financeAuditLog.create({
        data: {
          tenantId,
          entityType: "VENDOR_PAYMENT",
          entityId: paymentId,
          tripId: payment.tripId,
          action: "REVIEWED_FC",
          performedBy: user.id,
          performedByName: user.name,
          performedAt: new Date(),
          oldValue: JSON.stringify(previousState),
          newValue: JSON.stringify({
            approvalStatus: newApprovalStatus,
            requiresFounderApproval: requiresFounder,
            status: newStatus,
          }),
          changeDescription: `Vendor invoice reviewed for ${payment.vendorName} (Category: ${payment.category}, Remaining: ₹${finalRemaining})${
            requiresFounder ? " [REQUIRES FOUNDER APPROVAL > ₹50,000]" : " [FC CLEARED <= ₹50,000]"
          }`,
          reason: sanitizeReason(reason) || null,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
        },
      });

      return { updated, requiresFounder, remainingPayable: finalRemaining };
    });

    // Synchronize underlying operational vendor allocations (Hotels, Transport, Guides, Activities)
    try {
      const { syncOperationalVendorRecord } = require("./paymentController");
      if (typeof syncOperationalVendorRecord === "function") {
        await syncOperationalVendorRecord(
          tenantId,
          result.updated.tripId,
          result.updated.departureDate,
          result.updated.vendorName,
          result.updated.category,
          result.updated.agreedAmount,
          result.updated.advancePaid,
          result.updated.id
        );
      }
    } catch (e) {
      console.warn("syncOperationalVendorRecord warning:", e);
    }

    return res.json({
      success: true,
      status: "success",
      message: result.requiresFounder
        ? "Reviewed. Remaining balance > ₹50,000 requires Founder approval."
        : "Reviewed. Verified & cleared by Finance Controller.",
      payment: result.updated,
      requiresFounderApproval: result.requiresFounder,
      remainingPayable: result.remainingPayable,
    });
  } catch (err) {
    console.error("reviewVendorPaymentFC error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to review vendor payout",
    });
  }
};

/**
 * 7️⃣ Founder Approves Vendor Payout
 * State Transition: REVIEWED_FINANCE_CONTROLLER -> APPROVED_FOUNDER (status: Paid)
 * Concurrency Safe: Uses atomic conditional updateMany
 * PATCH /api/finance/vendor-payments/:paymentId/approve-founder
 */
exports.approveVendorPaymentFounder = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason, invoiceFileUrl } = req.body || {};
    const user = resolveUser(req);
    const tenantId = resolveTenantId(req);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.opsVendorPayment.findFirst({
        where: { id: paymentId, tenantId },
        include: { trip: true, collectionAccount: true },
      });

      if (!payment) {
        throw { statusCode: 404, message: "Vendor payment not found or access denied" };
      }

      if (
        payment.approvalStatus !== "REVIEWED_FINANCE_CONTROLLER" &&
        payment.approvalStatus !== "PENDING"
      ) {
        if (payment.approvalStatus === "APPROVED_FOUNDER" && payment.status === "Paid") {
          throw { statusCode: 400, message: "Vendor payout is already approved and paid." };
        }
      }

      const invoiceUrl = sanitizeProofUrl(invoiceFileUrl || payment.invoiceFileUrl || payment.invoiceProof);

      const previousState = {
        approvalStatus: payment.approvalStatus,
        status: payment.status,
      };

      const agreed = Number(payment.agreedAmount || 0);
      const finalAdvance = Math.max(agreed, Number(payment.advancePaid || 0));

      // Atomic conditional update
      const updateResult = await tx.opsVendorPayment.updateMany({
        where: {
          id: paymentId,
          tenantId,
          approvalStatus: { in: ["REVIEWED_FINANCE_CONTROLLER", "PENDING"] },
        },
        data: {
          approvalStatus: "APPROVED_FOUNDER",
          approvedByFounderAt: new Date(),
          approvedByFounderId: user.id,
          status: "Paid",
          advancePaid: finalAdvance,
          remainingPayable: 0,
          invoiceFileUrl: invoiceUrl || undefined,
        },
      });

      if (updateResult.count === 0) {
        throw {
          statusCode: 409,
          message: "Conflict: Vendor payout has already been approved or modified concurrently.",
        };
      }

      const updated = await tx.opsVendorPayment.findUnique({
        where: { id: paymentId },
        include: { trip: true, collectionAccount: true },
      });

      // Create immutable audit log
      await tx.financeAuditLog.create({
        data: {
          tenantId,
          entityType: "VENDOR_PAYMENT",
          entityId: paymentId,
          tripId: payment.tripId,
          action: "APPROVED_FOUNDER",
          performedBy: user.id,
          performedByName: user.name,
          performedAt: new Date(),
          oldValue: JSON.stringify(previousState),
          newValue: JSON.stringify({ approvalStatus: "APPROVED_FOUNDER", status: "Paid" }),
          changeDescription: `Founder approved vendor payout of ₹${payment.agreedAmount} to ${payment.vendorName}`,
          reason: sanitizeReason(reason) || null,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
        },
      });

      return updated;
    });

    // Synchronize underlying operational vendor allocations (Hotels, Transport, Guides, Activities)
    try {
      const { syncOperationalVendorRecord } = require("./paymentController");
      if (typeof syncOperationalVendorRecord === "function") {
        await syncOperationalVendorRecord(
          tenantId,
          result.tripId,
          result.departureDate,
          result.vendorName,
          result.category,
          result.agreedAmount,
          result.advancePaid,
          result.id
        );
      }
    } catch (e) {
      console.warn("syncOperationalVendorRecord warning:", e);
    }

    return res.json({
      success: true,
      status: "success",
      message: "Founder approved. Vendor payout marked as processed.",
      payment: result,
    });
  } catch (err) {
    console.error("approveVendorPaymentFounder error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to approve vendor payout",
    });
  }
};

/**
 * 8️⃣ Reject Vendor Payout
 * PATCH /api/finance/vendor-payments/:paymentId/reject
 */
exports.rejectVendorPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body || {};
    const user = resolveUser(req);
    const tenantId = resolveTenantId(req);

    const sanitized = sanitizeReason(reason);
    if (!sanitized || sanitized.length < 3) {
      return res.status(400).json({
        success: false,
        error: "Rejection reason is required (minimum 3 characters)",
        message: "Rejection reason is required (minimum 3 characters)",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.opsVendorPayment.findFirst({
        where: { id: paymentId, tenantId },
        include: { trip: true },
      });

      if (!payment) {
        throw { statusCode: 404, message: "Vendor payment not found or access denied" };
      }

      if (payment.approvalStatus === "APPROVED_FOUNDER" || payment.status === "Paid") {
        throw {
          statusCode: 400,
          message: "Cannot reject an already finalized and paid vendor payout.",
        };
      }

      const previousState = {
        approvalStatus: payment.approvalStatus,
        status: payment.status,
      };

      // Atomic conditional update
      const updateResult = await tx.opsVendorPayment.updateMany({
        where: {
          id: paymentId,
          tenantId,
          approvalStatus: { not: "APPROVED_FOUNDER" },
          status: { not: "Paid" },
        },
        data: {
          approvalStatus: "REJECTED",
          rejectionReason: sanitized,
          rejectionAt: new Date(),
          rejectedById: user.id,
          status: "Rejected",
        },
      });

      if (updateResult.count === 0) {
        throw {
          statusCode: 409,
          message: "Conflict: Vendor payout has already been paid or modified concurrently.",
        };
      }

      const updated = await tx.opsVendorPayment.findUnique({
        where: { id: paymentId },
        include: { trip: true, collectionAccount: true },
      });

      // Create immutable audit log
      await tx.financeAuditLog.create({
        data: {
          tenantId,
          entityType: "VENDOR_PAYMENT",
          entityId: paymentId,
          tripId: payment.tripId,
          action: "REJECTED",
          performedBy: user.id,
          performedByName: user.name,
          performedAt: new Date(),
          oldValue: JSON.stringify(previousState),
          newValue: JSON.stringify({ approvalStatus: "REJECTED", status: "Rejected" }),
          changeDescription: `Vendor payment to ${payment.vendorName} rejected: ${sanitized}`,
          reason: sanitized,
          ipAddress: req.ip || null,
          userAgent: req.get("user-agent") || null,
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      status: "success",
      message: "Vendor payment rejected.",
      payment: result,
    });
  } catch (err) {
    console.error("rejectVendorPayment error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Failed to reject vendor payment",
    });
  }
};

/**
 * 9️⃣ Get All Pending Approvals (Dashboard)
 * GET /api/finance/approvals/pending
 */
exports.getPendingApprovals = async (req, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const user = resolveUser(req);

    const isFounderOrAdmin =
      user.role === "admin" ||
      user.role === "superadmin" ||
      user.role === "founder" ||
      user.role === "owner";

    const customerWhere = {
      tenantId,
      approvalStatus: {
        in: isFounderOrAdmin
          ? ["PENDING", "REVIEWED_FINANCE_CONTROLLER"]
          : ["PENDING"],
      },
      NOT: {
        AND: [
          { approvalStatus: "APPROVED_FOUNDER" },
          { status: "Verified" },
        ],
      },
    };

    const vendorWhere = {
      tenantId,
      approvalStatus: {
        in: isFounderOrAdmin
          ? ["PENDING", "REVIEWED_FINANCE_CONTROLLER"]
          : ["PENDING"],
      },
      NOT: {
        AND: [
          { approvalStatus: "APPROVED_FOUNDER" },
          { status: "Paid" },
        ],
      },
    };

    const [customerPayments, vendorPayments] = await Promise.all([
      prisma.opsClientPayment.findMany({
        where: customerWhere,
        orderBy: { createdAt: "desc" },
        include: {
          booking: {
            select: {
              id: true,
              bookingId: true,
              fullName: true,
              name: true,
              phone: true,
              tripName: true,
              departureDate: true,
              totalAmount: true,
            },
          },
          collectionAccount: true,
        },
      }),
      prisma.opsVendorPayment.findMany({
        where: vendorWhere,
        orderBy: { createdAt: "desc" },
        include: {
          trip: { select: { id: true, title: true, slug: true } },
          collectionAccount: true,
        },
      }),
    ]);

    const pendingFC = customerPayments.filter((c) => c.approvalStatus === "PENDING").length;
    const awaitingFounder = customerPayments.filter((c) => c.approvalStatus === "REVIEWED_FINANCE_CONTROLLER").length;
    const vendorPendingFC = vendorPayments.filter((v) => v.approvalStatus === "PENDING").length;
    const vendorAwaitingFounder = vendorPayments.filter((v) => v.approvalStatus === "REVIEWED_FINANCE_CONTROLLER" && v.requiresFounderApproval).length;

    return res.json({
      success: true,
      pendingApprovals: {
        customerCollections: customerPayments.length,
        vendorPayouts: vendorPayments.length,
        total: customerPayments.length + vendorPayments.length,
        breakdown: {
          collectionsPendingFC: pendingFC,
          collectionsAwaitingFounder: awaitingFounder,
          vendorPendingFC: vendorPendingFC,
          vendorAwaitingFounder: vendorAwaitingFounder,
        },
        items: {
          customerPayments,
          vendorPayments,
        },
      },
    });
  } catch (err) {
    console.error("getPendingApprovals error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch pending approvals" });
  }
};

/**
 * 🔟 Monthly Financial Reconciliation Report
 * Strict boundary UTC filtering to avoid month leakage
 * GET /api/finance/reconciliation/monthly/:year/:month
 */
exports.getMonthlyReconciliation = async (req, res) => {
  try {
    const { year, month } = req.params;
    const tenantId = resolveTenantId(req);

    const parsedYear = parseInt(year, 10) || new Date().getFullYear();
    const parsedMonth = parseInt(month, 10) || (new Date().getMonth() + 1);

    if (parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ success: false, message: "Invalid month: must be between 1 and 12" });
    }

    // Exact calendar month boundaries in UTC
    const startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));

    const [collections, payouts, auditLogs] = await Promise.all([
      prisma.opsClientPayment.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          booking: {
            select: { id: true, bookingId: true, fullName: true, name: true, tripName: true },
          },
          collectionAccount: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.opsVendorPayment.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          trip: { select: { id: true, title: true } },
          collectionAccount: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.financeAuditLog.findMany({
        where: {
          tenantId,
          performedAt: { gte: startDate, lte: endDate },
        },
        orderBy: { performedAt: "desc" },
        take: 500,
      }),
    ]);

    const totalCollections = collections.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalPayouts = payouts.reduce((sum, p) => sum + (p.agreedAmount || 0), 0);

    const report = {
      period: `${parsedMonth}/${parsedYear}`,
      summary: {
        totalCollections,
        totalPayouts,
        netCashFlow: totalCollections - totalPayouts,
        collectionsByStatus: {
          pending: collections.filter((c) => c.approvalStatus === "PENDING").length,
          reviewedFC: collections.filter((c) => c.approvalStatus === "REVIEWED_FINANCE_CONTROLLER").length,
          approvedFounder: collections.filter((c) => c.approvalStatus === "APPROVED_FOUNDER").length,
          rejected: collections.filter((c) => c.approvalStatus === "REJECTED").length,
        },
        payoutsByStatus: {
          pending: payouts.filter((p) => p.approvalStatus === "PENDING").length,
          reviewedFC: payouts.filter((p) => p.approvalStatus === "REVIEWED_FINANCE_CONTROLLER").length,
          approvedFounder: payouts.filter((p) => p.approvalStatus === "APPROVED_FOUNDER").length,
          rejected: payouts.filter((p) => p.approvalStatus === "REJECTED").length,
        },
      },
      collections,
      payouts,
      auditTrail: auditLogs,
    };

    return res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error("getMonthlyReconciliation error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate reconciliation report" });
  }
};
