const { prisma } = require("../lib/prisma");
const { logAction } = require("../utils/auditLogger");

/**
 * POST /api/finance/coupons
 * Create a new coupon with limits and validity.
 */
async function createCoupon(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const createdById = req.user?.id || req.admin?.id;
    const {
      code,
      description,
      discountType = "PERCENTAGE", // PERCENTAGE | FIXED
      discountValue,
      maxDiscountAmount,
      minBookingAmount,
      applicableTripIds,
      maxUsesTotal,
      maxUsesPerUser = 1,
      validFrom,
      validUntil,
      status = "ACTIVE",
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const numValue = Number(discountValue);

    if (!numValue || numValue <= 0) {
      return res.status(400).json({ success: false, message: "discountValue must be greater than 0" });
    }

    if (discountType === "PERCENTAGE" && numValue > 100) {
      return res.status(400).json({ success: false, message: "Percentage discount cannot exceed 100%" });
    }

    const existing = await prisma.coupon.findFirst({
      where: { code: cleanCode, tenantId },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code '${cleanCode}' already exists` });
    }

    const fromDate = validFrom ? new Date(validFrom) : new Date();
    const untilDate = validUntil ? new Date(validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    if (untilDate <= fromDate) {
      return res.status(400).json({ success: false, message: "validUntil must be after validFrom" });
    }

    const coupon = await prisma.coupon.create({
      data: {
        tenantId,
        code: cleanCode,
        description: description || null,
        discountType,
        discountValue: numValue,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        minBookingAmount: minBookingAmount ? Number(minBookingAmount) : null,
        applicableTripIds: Array.isArray(applicableTripIds) && applicableTripIds.length > 0 ? applicableTripIds : null,
        maxUsesTotal: maxUsesTotal ? Number(maxUsesTotal) : null,
        maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
        validFrom: fromDate,
        validUntil: untilDate,
        status,
        createdById,
      },
    });

    await logAction({
      tenantId,
      actorUserId: createdById,
      action: "CREATE",
      entityType: "COUPON",
      entityId: coupon.id,
      changeSummary: `Created coupon code ${coupon.code} (${coupon.discountType} ${coupon.discountValue})`,
      newValue: coupon,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Staff",
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("❌ Error creating coupon:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create coupon" });
  }
}

/**
 * GET /api/finance/coupons
 * List all coupons with usage statistics.
 */
async function getCoupons(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { status, search, page = 1, limit = 25 } = req.query;

    const where = { tenantId };
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, coupons] = await Promise.all([
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { redemptions: true },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: coupons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching coupons:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch coupons" });
  }
}

/**
 * PATCH /api/finance/coupons/:id
 * Update coupon status or restrictions.
 */
async function updateCoupon(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const updatedById = req.user?.id || req.admin?.id;
    const { id } = req.params;
    const {
      status,
      description,
      maxDiscountAmount,
      minBookingAmount,
      applicableTripIds,
      maxUsesTotal,
      validFrom,
      validUntil,
    } = req.body;

    const existing = await prisma.coupon.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (minBookingAmount !== undefined) updateData.minBookingAmount = minBookingAmount ? Number(minBookingAmount) : null;
    if (applicableTripIds !== undefined) updateData.applicableTripIds = applicableTripIds;
    if (maxUsesTotal !== undefined) updateData.maxUsesTotal = maxUsesTotal ? Number(maxUsesTotal) : null;
    if (validFrom) updateData.validFrom = new Date(validFrom);
    if (validUntil) updateData.validUntil = new Date(validUntil);

    const updated = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    await logAction({
      tenantId,
      actorUserId: updatedById,
      action: "UPDATE",
      entityType: "COUPON",
      entityId: id,
      changeSummary: `Updated coupon ${updated.code} status to ${updated.status}`,
      beforeData: existing,
      afterData: updated,
      oldValue: existing,
      newValue: updated,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Staff",
    });

    return res.json({
      success: true,
      message: "Coupon updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error updating coupon:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update coupon" });
  }
}

/**
 * POST /api/finance/coupons/:code/validate
 * Authoritative backend coupon validation and discount calculation.
 * Never trusts frontend discounts.
 */
async function validateCoupon(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { code } = req.params;
    const { bookingAmount, tripId, customerPhone } = req.body;

    if (!code) {
      return res.status(400).json({ isValid: false, message: "Coupon code is required" });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await prisma.coupon.findFirst({
      where: { code: cleanCode, tenantId },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!coupon) {
      return res.status(404).json({ isValid: false, message: `Coupon code '${cleanCode}' is invalid` });
    }

    if (coupon.status !== "ACTIVE") {
      return res.status(400).json({ isValid: false, message: `Coupon code '${cleanCode}' is ${coupon.status.toLowerCase()}` });
    }

    const now = new Date();
    if (now < new Date(coupon.validFrom)) {
      return res.status(400).json({
        isValid: false,
        message: `Coupon is not yet active (valid from ${new Date(coupon.validFrom).toLocaleDateString("en-IN")})`,
      });
    }

    if (now > new Date(coupon.validUntil)) {
      return res.status(400).json({
        isValid: false,
        message: `Coupon expired on ${new Date(coupon.validUntil).toLocaleDateString("en-IN")}`,
      });
    }

    // Check usage limits
    if (coupon.maxUsesTotal && coupon.currentUsesCount >= coupon.maxUsesTotal) {
      return res.status(400).json({ isValid: false, message: "Coupon usage limit has been exhausted" });
    }

    const amount = Number(bookingAmount) || 0;
    if (coupon.minBookingAmount && amount < coupon.minBookingAmount) {
      return res.status(400).json({
        isValid: false,
        message: `Minimum booking amount of ₹${coupon.minBookingAmount.toLocaleString("en-IN")} required for this coupon`,
      });
    }

    // Check trip applicability
    if (coupon.applicableTripIds && Array.isArray(coupon.applicableTripIds) && coupon.applicableTripIds.length > 0) {
      if (!tripId || !coupon.applicableTripIds.includes(tripId)) {
        return res.status(400).json({
          isValid: false,
          message: "This coupon is not applicable to the selected trip package",
        });
      }
    }

    // Calculate actual discount on the backend
    let calculatedDiscount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      calculatedDiscount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
        calculatedDiscount = coupon.maxDiscountAmount;
      }
    } else {
      calculatedDiscount = Math.min(coupon.discountValue, amount);
    }

    // Ensure discount does not exceed booking amount
    calculatedDiscount = Math.min(calculatedDiscount, amount);
    const finalAmount = Math.max(0, amount - calculatedDiscount);

    return res.json({
      isValid: true,
      message: `Coupon '${cleanCode}' applied successfully!`,
      data: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: calculatedDiscount,
        originalAmount: amount,
        finalAmount,
        savings: calculatedDiscount,
      },
    });
  } catch (error) {
    console.error("❌ Error validating coupon:", error);
    return res.status(500).json({ isValid: false, message: error.message || "Failed to validate coupon" });
  }
}

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  validateCoupon,
};
