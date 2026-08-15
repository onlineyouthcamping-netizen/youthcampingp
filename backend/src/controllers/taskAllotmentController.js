const { prisma } = require("../lib/prisma");
const { logAction } = require("../utils/auditLogger");

/**
 * POST /api/finance/tasks
 * Create an operational task allotment.
 */
async function createTask(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const assignedById = req.user?.id || req.admin?.id;
    const {
      title,
      description,
      taskType = "OTHER",
      priority = "MEDIUM",
      assignedToId,
      bookingId,
      tripId,
      vendorId,
      serviceId,
      deadline,
    } = req.body;

    if (!title || !assignedToId) {
      return res.status(400).json({ success: false, message: "title and assignedToId are required" });
    }

    let matchedBookingId = null;
    if (bookingId) {
      const booking = await prisma.booking.findFirst({
        where: {
          OR: [{ id: bookingId }, { bookingId }],
          tenantId,
        },
      });
      if (booking) matchedBookingId = booking.bookingId;
    }

    const task = await prisma.taskAllotment.create({
      data: {
        tenantId,
        title,
        description: description || null,
        taskType,
        priority,
        status: "PENDING",
        assignedToId,
        assignedById,
        bookingId: matchedBookingId,
        tripId: tripId || null,
        vendorId: vendorId || null,
        serviceId: serviceId || null,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });

    await logAction({
      tenantId,
      actorUserId: assignedById,
      bookingId: matchedBookingId,
      action: "CREATE",
      entityType: "TASK",
      entityId: task.id,
      changeSummary: `Created task '${task.title}' assigned to ${task.assignedTo?.name || "Staff"} (Priority: ${task.priority})`,
      newValue: task,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      changedBy: req.admin?.name || req.user?.name || "Staff",
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("❌ Error creating task allotment:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create task" });
  }
}

/**
 * GET /api/finance/tasks
 * Filter and query tasks.
 */
async function getTasks(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { assignedToId, status, priority, bookingId, taskType, isOverdue, page = 1, limit = 30 } = req.query;

    const where = { tenantId };
    if (assignedToId && assignedToId !== "ALL") {
      where.assignedToId = assignedToId;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (priority && priority !== "ALL") {
      where.priority = priority;
    }
    if (taskType && taskType !== "ALL") {
      where.taskType = taskType;
    }
    if (bookingId) {
      where.OR = [{ bookingId }, { booking: { bookingId } }];
    }
    if (isOverdue === "true") {
      where.deadline = { lt: new Date() };
      where.status = { notIn: ["COMPLETED", "CANCELLED"] };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, tasks] = await Promise.all([
      prisma.taskAllotment.count({ where }),
      prisma.taskAllotment.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          assignedBy: { select: { id: true, name: true, email: true } },
          booking: { select: { bookingId: true, fullName: true, tripName: true } },
          comments: {
            include: { author: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: tasks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch tasks" });
  }
}

/**
 * PATCH /api/finance/tasks/:id/status
 * Update task status.
 */
async function updateTaskStatus(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const updaterId = req.user?.id || req.admin?.id;
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "status is required" });
    }

    const existing = await prisma.taskAllotment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const updateData = {
      status,
      completedAt: status === "COMPLETED" ? new Date() : existing.completedAt,
    };

    const updated = await prisma.$transaction(async (tx) => {
      const resTask = await tx.taskAllotment.update({
        where: { id },
        data: updateData,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      if (note && note.trim()) {
        await tx.taskComment.create({
          data: {
            tenantId,
            taskId: id,
            authorId: updaterId,
            comment: `[Status changed to ${status}]: ${note.trim()}`,
          },
        });
      }

      return resTask;
    });

    await logAction({
      tenantId,
      actorUserId: updaterId,
      bookingId: existing.bookingId,
      action: "UPDATE",
      entityType: "TASK",
      entityId: id,
      changeSummary: `Task '${existing.title}' status changed from ${existing.status} to ${status}`,
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
      message: "Task status updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error updating task status:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update task status" });
  }
}

/**
 * POST /api/finance/tasks/:id/comments
 * Add an auditable comment to a task.
 */
async function addTaskComment(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const authorId = req.user?.id || req.admin?.id;
    const { id } = req.params;
    const { comment, isInternal = true } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    const task = await prisma.taskAllotment.findFirst({
      where: { id, tenantId },
    });

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const newComment = await prisma.taskComment.create({
      data: {
        tenantId,
        taskId: id,
        authorId,
        comment: comment.trim(),
        isInternal,
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (error) {
    console.error("❌ Error adding task comment:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to add comment" });
  }
}

/**
 * GET /api/finance/tasks/dashboard
 * Calculate task KPIs: overdue count, completion rate, workload by person.
 */
async function getTaskDashboard(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const now = new Date();

    const tasks = await prisma.taskAllotment.findMany({
      where: { tenantId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    const totalTasks = tasks.length;
    const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
    const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
    const blockedCount = tasks.filter((t) => t.status === "BLOCKED").length;
    const cancelledCount = tasks.filter((t) => t.status === "CANCELLED").length;

    const overdueCount = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now && t.status !== "COMPLETED" && t.status !== "CANCELLED"
    ).length;

    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // Workload breakdown by assigned person
    const workloadMap = new Map();
    for (const task of tasks) {
      const personId = task.assignedToId;
      const personName = task.assignedTo?.name || "Unassigned";

      if (!workloadMap.has(personId)) {
        workloadMap.set(personId, {
          personId,
          personName,
          total: 0,
          pending: 0,
          inProgress: 0,
          completed: 0,
          overdue: 0,
        });
      }

      const item = workloadMap.get(personId);
      item.total++;
      if (task.status === "PENDING") item.pending++;
      if (task.status === "IN_PROGRESS") item.inProgress++;
      if (task.status === "COMPLETED") item.completed++;
      if (task.deadline && new Date(task.deadline) < now && task.status !== "COMPLETED" && task.status !== "CANCELLED") {
        item.overdue++;
      }
    }

    const workloadByPerson = Array.from(workloadMap.values()).sort((a, b) => b.total - a.total);

    return res.json({
      success: true,
      data: {
        totalTasks,
        pendingCount,
        inProgressCount,
        completedCount,
        blockedCount,
        cancelledCount,
        overdueCount,
        completionRate,
        workloadByPerson,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching task dashboard:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch task dashboard" });
  }
}

module.exports = {
  createTask,
  getTasks,
  updateTaskStatus,
  addTaskComment,
  getTaskDashboard,
};
