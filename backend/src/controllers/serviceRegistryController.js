const { prisma } = require("../lib/prisma");
const { logAction } = require("../utils/auditLogger");

/**
 * POST /api/finance/services
 * Register a new auxiliary booking service.
 */
async function createService(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const createdById = req.user?.id || req.admin?.id;
    const {
      bookingId,
      serviceType = "TRAIN", // TRAIN | FLIGHT | VISA | HOTEL | INSURANCE | TRANSPORT | OTHER
      serviceName,
      vendorId,
      costPrice = 0,
      sellingPrice = 0,
      confirmationRef,
      notes,
      assignedStaffId,
    } = req.body;

    if (!bookingId || !serviceName) {
      return res.status(400).json({ success: false, message: "bookingId and serviceName are required" });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: bookingId }, { bookingId }],
        tenantId,
      },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const service = await prisma.serviceRegistry.create({
      data: {
        tenantId,
        bookingId: booking.bookingId,
        serviceType,
        serviceName,
        vendorId: vendorId || null,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        confirmationRef: confirmationRef || null,
        notes: notes || null,
        assignedStaffId: assignedStaffId || null,
        status: "PENDING",
      },
    });

    await logAction({
      tenantId,
      actorUserId: createdById,
      bookingId: booking.bookingId,
      action: "CREATE",
      entityType: "SERVICE",
      entityId: service.id,
      changeSummary: `Registered auxiliary service '${service.serviceName}' (${service.serviceType}) for booking #${booking.bookingId}`,
      newValue: service,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Staff",
    });

    return res.status(201).json({
      success: true,
      message: "Service registered successfully",
      data: service,
    });
  } catch (error) {
    console.error("❌ Error creating service in registry:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to register service" });
  }
}

/**
 * PATCH /api/finance/services/:id
 * Update or verify a service entry. Verification generates an audit event.
 */
async function updateService(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const updaterId = req.user?.id || req.admin?.id;
    const { id } = req.params;
    const {
      status,
      serviceName,
      costPrice,
      sellingPrice,
      confirmationRef,
      notes,
      assignedStaffId,
    } = req.body;

    const existing = await prisma.serviceRegistry.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Service entry not found" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (serviceName) updateData.serviceName = serviceName;
    if (costPrice !== undefined) updateData.costPrice = Number(costPrice);
    if (sellingPrice !== undefined) updateData.sellingPrice = Number(sellingPrice);
    if (confirmationRef !== undefined) updateData.confirmationRef = confirmationRef;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedStaffId !== undefined) updateData.assignedStaffId = assignedStaffId;

    if (status === "VERIFIED" && existing.status !== "VERIFIED") {
      updateData.verifiedById = updaterId;
      updateData.verifiedAt = new Date();
    }

    const updated = await prisma.serviceRegistry.update({
      where: { id },
      data: updateData,
    });

    await logAction({
      tenantId,
      actorUserId: updaterId,
      bookingId: existing.bookingId,
      action: status === "VERIFIED" ? "VERIFY" : "UPDATE",
      entityType: "SERVICE",
      entityId: id,
      changeSummary: `Service '${updated.serviceName}' status updated to ${updated.status}`,
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
      message: "Service updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error updating service registry entry:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update service" });
  }
}

/**
 * GET /api/finance/bookings/:id/services
 * Get all registered services for a booking.
 */
async function getBookingServices(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { id } = req.params;

    const services = await prisma.serviceRegistry.findMany({
      where: {
        OR: [{ bookingId: id }, { booking: { id } }],
        tenantId,
      },
      include: {
        assignedStaff: {
          select: { id: true, name: true, email: true },
        },
        verifiedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("❌ Error fetching booking services:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch services" });
  }
}

module.exports = {
  createService,
  updateService,
  getBookingServices,
};
