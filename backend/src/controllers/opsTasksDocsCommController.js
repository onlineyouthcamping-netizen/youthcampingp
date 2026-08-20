const { prisma } = require("../lib/prisma");
const { normalizeDepartureDateIndia } = require("./opsController");

// Helper to construct departure filter
async function parseDepartureFilter(req, res, requireDepartureDate = true) {
  const { tripId: rawTripId } = req.params;
  const rawDate = req.query.departureDate || req.body.departureDate;

  if (requireDepartureDate && !rawDate) {
    res
      .status(400)
      .json({
        success: false,
        message: "departureDate is required for departure operations",
      });
    return null;
  }

  const departureDate = normalizeDepartureDateIndia(rawDate);
  if (
    requireDepartureDate &&
    (!departureDate || isNaN(departureDate.getTime()))
  ) {
    res
      .status(400)
      .json({ success: false, message: "Invalid departureDate format" });
    return null;
  }

  const tenantId = req.user?.tenantId || "default";

  if (!rawTripId || rawTripId === "undefined") {
    res
      .status(400)
      .json({
        success: false,
        message: "tripId is required and must be valid",
      });
    return null;
  }

  let tripId = rawTripId;
  if (rawTripId) {
    const trip = await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [{ id: rawTripId }, { slug: rawTripId }, { shortName: rawTripId }],
      },
      select: { id: true },
    });
    if (trip) tripId = trip.id;
  }

  const where = { tenantId, tripId };
  if (departureDate) where.departureDate = departureDate;

  return { tenantId, tripId, departureDate, where };
}

// ── TASKS ENDPOINTS ──
exports.getChecklistTasks = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const tasks = await prisma.opsTripChecklist.findMany({
      where: ctx.where,
      orderBy: { id: "asc" },
    });

    return res.json({ success: true, data: tasks });
  } catch (err) {
    console.error("getChecklistTasks error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch tasks" });
  }
};

exports.createChecklistTask = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const {
      taskName,
      stage,
      notes,
      assignedTo,
      priority,
      dueDate,
      status,
      remarks,
    } = req.body;
    if (!taskName || !stage) {
      return res
        .status(400)
        .json({ success: false, message: "taskName and stage are required" });
    }

    const task = await prisma.opsTripChecklist.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        stage,
        taskName,
        notes: notes || null,
        assignedTo: assignedTo || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "Pending",
        remarks: remarks || null,
        isCompleted: status === "Completed",
      },
    });

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error("createChecklistTask error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to create task" });
  }
};

exports.updateChecklistTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      taskName,
      stage,
      notes,
      assignedTo,
      priority,
      dueDate,
      status,
      remarks,
      isCompleted,
    } = req.body;

    const existing = await prisma.opsTripChecklist.findUnique({
      where: { id },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const completed =
      isCompleted !== undefined ? isCompleted : status === "Completed";

    const task = await prisma.opsTripChecklist.update({
      where: { id },
      data: {
        taskName: taskName !== undefined ? taskName : undefined,
        stage: stage !== undefined ? stage : undefined,
        notes: notes !== undefined ? notes : undefined,
        assignedTo: assignedTo !== undefined ? assignedTo : undefined,
        priority: priority !== undefined ? priority : undefined,
        dueDate:
          dueDate !== undefined
            ? dueDate
              ? new Date(dueDate)
              : null
            : undefined,
        status: status !== undefined ? status : undefined,
        remarks: remarks !== undefined ? remarks : undefined,
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
        completedById: completed ? req.user?.id || null : null,
      },
    });

    return res.json({ success: true, data: task });
  } catch (err) {
    console.error("updateChecklistTask error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update task" });
  }
};

exports.deleteChecklistTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsTripChecklist.delete({ where: { id } });
    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    console.error("deleteChecklistTask error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete task" });
  }
};

exports.getAllOperationsTasks = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { assignee, source, status, priority, tripId, search } = req.query;

    const checklistWhere = {};
    if (tenantId && tenantId !== "default") {
      checklistWhere.tenantId = tenantId;
    }
    if (tripId && tripId !== "ALL") {
      checklistWhere.tripId = tripId;
    }
    if (source && source !== "ALL" && source !== "BOOKING") {
      checklistWhere.source = source;
    }
    if (priority && priority !== "ALL") {
      checklistWhere.priority = priority;
    }
    if (status && status !== "ALL") {
      checklistWhere.status = status;
    }
    if (assignee && assignee !== "ALL") {
      checklistWhere.assignedTo = assignee;
    }
    if (search && search.trim()) {
      checklistWhere.OR = [
        { taskName: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { remarks: { contains: search, mode: "insensitive" } },
      ];
    }

    let checklistTasks = [];
    if (source !== "BOOKING") {
      // Find departures that have non-cancelled bookings to avoid showing tasks for empty/abandoned test dates
      const activeBookings = await prisma.booking.findMany({
        where: {
          tenantId: tenantId && tenantId !== "default" ? tenantId : undefined,
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        select: { tripId: true, departureDate: true },
      });

      const activeDepKeys = new Set(
        activeBookings
          .filter((b) => b.departureDate)
          .map((b) => `${b.tripId}_${new Date(b.departureDate).toISOString().substring(0, 10)}`)
      );

      const allChecklistTasks = await prisma.opsTripChecklist.findMany({
        where: checklistWhere,
        orderBy: [
          { isCompleted: "asc" },
          { dueDate: "asc" },
          { id: "desc" },
        ],
      });

      checklistTasks = allChecklistTasks.filter((c) => {
        if (!c.departureDate) return true;
        const depKey = `${c.tripId}_${new Date(c.departureDate).toISOString().substring(0, 10)}`;
        return activeDepKeys.has(depKey);
      });
    }

    let bookingTasks = [];
    if (source === "ALL" || source === "BOOKING") {
      const bWhere = {};
      if (tenantId && tenantId !== "default") {
        bWhere.tenantId = tenantId;
      }
      if (status && status !== "ALL") {
        bWhere.status = status.toUpperCase();
      }
      if (assignee && assignee !== "ALL") {
        bWhere.OR = [
          { assignedToId: assignee },
          { assignedTo: { name: { contains: assignee, mode: "insensitive" } } },
        ];
      }
      if (search && search.trim()) {
        bWhere.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { booking: { bookingId: { contains: search, mode: "insensitive" } } },
          { booking: { fullName: { contains: search, mode: "insensitive" } } },
        ];
      }

      const bRaw = await prisma.bookingTask.findMany({
        where: bWhere,
        include: {
          booking: {
            select: {
              id: true,
              bookingId: true,
              tripId: true,
              tripName: true,
              departureDate: true,
              fullName: true,
              name: true,
            },
          },
          assignedTo: { select: { id: true, name: true } },
          assignedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      bookingTasks = bRaw.map((bt) => ({
        id: bt.id,
        taskName: bt.title,
        source: "BOOKING",
        tripId: bt.booking?.tripId || "BOOKING",
        departureDate: bt.booking?.departureDate ? new Date(bt.booking.departureDate).toISOString().split("T")[0] : null,
        stage: "BOOKING_TASK",
        assignedTo: bt.assignedTo?.name || "Unassigned",
        assignedToId: bt.assignedToId,
        assignedByName: bt.assignedBy?.name || null,
        priority: "HIGH",
        dueDate: bt.dueDate ? new Date(bt.dueDate).toISOString().split("T")[0] : bt.createdAt ? new Date(bt.createdAt).toISOString().split("T")[0] : null,
        status: bt.status === "COMPLETED" ? "Completed" : bt.status === "IN_PROGRESS" ? "In Progress" : "Pending",
        isCompleted: bt.status === "COMPLETED",
        notes: `${bt.description || ""} (Booking: ${bt.booking?.bookingId || ""} - ${bt.booking?.fullName || bt.booking?.name || ""})`,
        bookingId: bt.booking?.id,
        bookingReadableId: bt.booking?.bookingId,
      }));
    }

    const combined = [...bookingTasks, ...checklistTasks];
    return res.json({ success: true, data: combined });
  } catch (err) {
    console.error("getAllOperationsTasks error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch all tasks" });
  }
};

// ── DOCUMENTS ENDPOINTS ──
exports.getOpsDocuments = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const docs = await prisma.opsDocument.findMany({
      where: ctx.where,
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error("getOpsDocuments error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch documents" });
  }
};

exports.createOpsDocument = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const { category, originalFileName, fileUrl, fileSize, remarks } = req.body;
    if (!category || !originalFileName || !fileUrl) {
      return res
        .status(400)
        .json({
          success: false,
          message: "category, originalFileName, and fileUrl are required",
        });
    }

    const doc = await prisma.opsDocument.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        category,
        uploadedById: req.user.id,
        originalFileName,
        fileUrl,
        fileSize: Number(fileSize) || 0,
        remarks: remarks || null,
        verificationStatus: "Pending",
      },
    });

    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    console.error("createOpsDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save document" });
  }
};

exports.verifyOpsDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const doc = await prisma.opsDocument.update({
      where: { id },
      data: {
        verificationStatus: status,
        remarks: remarks !== undefined ? remarks : undefined,
      },
    });

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error("verifyOpsDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to verify document" });
  }
};

exports.deleteOpsDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.opsDocument.delete({ where: { id } });
    return res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (err) {
    console.error("deleteOpsDocument error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete document" });
  }
};

// ── COMMUNICATION ENDPOINTS ──
exports.getOpsMessages = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const messages = await prisma.opsMessage.findMany({
      where: ctx.where,
      orderBy: { createdAt: "asc" },
    });

    return res.json({ success: true, data: messages });
  } catch (err) {
    console.error("getOpsMessages error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch messages" });
  }
};

exports.createOpsMessage = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    const { messageType, content, attachments, recipients } = req.body;
    if (!content) {
      return res
        .status(400)
        .json({ success: false, message: "content is required" });
    }

    const message = await prisma.opsMessage.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        senderType: "STAFF",
        senderId: req.user.id,
        senderName: req.user.name || "Operations Staff",
        messageType: messageType || "GROUP",
        content,
        attachments: attachments || null,
        recipients: recipients || null,
      },
    });

    // Automatically generate in-app notifications for all staff & admins
    try {
      if (prisma.notification) {
        const staffUsers = await prisma.admin.findMany({
          where: {
            id: { not: req.user.id },
          },
          select: { id: true, tenantId: true },
        });

        if (staffUsers.length > 0) {
          const channelName =
            messageType === "ANNOUNCEMENT"
              ? "Broadcast Announcement"
              : messageType === "STAFF"
                ? "Internal Ops"
                : "Group Board";
          const title = `📢 ${ctx.tripId} (${ctx.departureDate}): New ${channelName}`;
          const excerpt =
            content.length > 100 ? content.substring(0, 97) + "..." : content;
          const actionUrl = `/admin/departure-workspace?tab=communication&departureId=${ctx.tripId}_${ctx.departureDate}`;

          await prisma.notification.createMany({
            data: staffUsers.map((u) => ({
              tenantId: u.tenantId || ctx.tenantId || "default",
              recipientUserId: u.id,
              title,
              message: `${req.user.name || "Staff"}: ${excerpt}`,
              priority: messageType === "ANNOUNCEMENT" ? "High" : "Medium",
              module: "Operations",
              actionUrl,
            })),
          });
        }
      }
    } catch (notifErr) {
      console.error(
        "Failed to generate notifications for opsMessage:",
        notifErr,
      );
    }

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    console.error("createOpsMessage error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to send message" });
  }
};

// ── REPORTS ENDPOINT ──
exports.getOpsReportData = async (req, res) => {
  try {
    const ctx = await parseDepartureFilter(req, res, true);
    if (!ctx) return;

    // A. Passengers List
    const startOfDay = new Date(ctx.departureDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(ctx.departureDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ["cancelled", "rejected"] },
      },
      select: {
        id: true,
        bookingId: true,
        name: true,
        mobile: true,
        email: true,
        numberOfTravelers: true,
        totalAmount: true,
        advancePaid: true,
        status: true,
        paymentStatus: true,
        passengers: true,
        departureDate: true,
        tripName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // B. Client Receivables
    const clientPayments = await prisma.opsClientPayment.findMany({
      where: {
        tenantId: ctx.tenantId,
        booking: {
          tripId: ctx.tripId,
          departureDate: { gte: startOfDay, lte: endOfDay },
        },
      },
      orderBy: { paymentDate: "asc" },
    });

    // C. Vendor Payments
    const vendorPayments = await prisma.opsVendorPayment.findMany({
      where: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
      },
      orderBy: { createdAt: "asc" },
    });

    // D. Itineraries & Hotels & Transport
    const itineraries = await prisma.opsDayItinerary.findMany({
      where: ctx.where,
      orderBy: { dayTitle: "asc" },
    });

    const hotels = await prisma.opsHotelBooking.findMany({
      where: ctx.where,
      orderBy: { createdAt: "asc" },
    });

    const transports = await prisma.opsTransportFleet.findMany({
      where: ctx.where,
      orderBy: { createdAt: "asc" },
    });

    const guides = await prisma.opsGuidePayment.findMany({
      where: ctx.where,
      orderBy: { createdAt: "asc" },
    });

    const activities = await prisma.opsActivity.findMany({
      where: ctx.where,
      orderBy: { dayNumber: "asc" },
    });

    const docs = await prisma.opsDocument.findMany({
      where: ctx.where,
      orderBy: { createdAt: "asc" },
    });

    const tasks = await prisma.opsTripChecklist.findMany({
      where: ctx.where,
      orderBy: { id: "asc" },
    });

    return res.json({
      success: true,
      data: {
        bookings,
        clientPayments,
        vendorPayments,
        itineraries,
        hotels,
        transports,
        guides,
        activities,
        docs,
        tasks,
      },
    });
  } catch (err) {
    console.error("getOpsReportData error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to compile report data" });
  }
};
