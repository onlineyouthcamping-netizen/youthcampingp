const { prisma } = require("../lib/prisma");
const { normalizeDepartureDateIndia } = require("./opsController");

/**
 * Calculate actual due date given a departure date (T0) and relative offset in days (e.g. -30, -7, 0, 1)
 */
function calculateDueDate(departureDate, relativeOffset = 0) {
  if (!departureDate || isNaN(departureDate.getTime())) return null;
  const d = new Date(departureDate.getTime());
  d.setDate(d.getDate() + relativeOffset);
  return d;
}

// ─────────────────────────────────────────────────────────
// 1. SOP TEMPLATE & VERSION MANAGERS
// ─────────────────────────────────────────────────────────

// GET /api/ops/sops - List all SOP templates with active version details
exports.getSopTemplates = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const templates = await prisma.opsSopTemplate.findMany({
      where: { tenantId },
      include: {
        trip: {
          select: {
            id: true,
            title: true,
            slug: true,
            duration: true,
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            taskTemplates: {
              orderBy: [{ stage: "asc" }, { sortOrder: "asc" }],
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: templates });
  } catch (err) {
    console.error("getSopTemplates error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/ops/sops/by-trip/:tripId - Get SOP for a specific tripId
exports.getSopByTrip = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const { tripId } = req.params;

    // Resolve trip ID by id or slug
    const trip = await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [{ id: tripId }, { slug: tripId }, { shortName: tripId }],
      },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const template = await prisma.opsSopTemplate.findFirst({
      where: { tenantId, tripId: trip.id },
      include: {
        trip: true,
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            taskTemplates: {
              orderBy: [{ relativeOffset: "asc" }, { sortOrder: "asc" }],
            },
          },
        },
      },
    });

    return res.json({ success: true, data: template });
  } catch (err) {
    console.error("getSopByTrip error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ops/sops - Create a new SOP master template for a trip
exports.createSopTemplate = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const { tripId, name, description } = req.body;

    if (!tripId || !name) {
      return res.status(400).json({ success: false, message: "tripId and name are required" });
    }

    const template = await prisma.$transaction(async (tx) => {
      const tmpl = await tx.opsSopTemplate.create({
        data: {
          tenantId,
          tripId,
          name,
          description: description || null,
        },
      });

      // Automatically create Version 1 (v1)
      const v1 = await tx.opsSopVersion.create({
        data: {
          tenantId,
          templateId: tmpl.id,
          versionNumber: 1,
          versionLabel: "v1",
          status: "ACTIVE",
          createdById: req.user?.id || null,
          activatedAt: new Date(),
        },
      });

      // Update active version link
      await tx.opsSopTemplate.update({
        where: { id: tmpl.id },
        data: { activeVersionId: v1.id },
      });

      return tmpl;
    });

    return res.status(201).json({ success: true, data: template });
  } catch (err) {
    console.error("createSopTemplate error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ops/sops/:templateId/versions - Create a new version for an SOP
exports.createSopVersion = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const { templateId } = req.params;
    const { copyFromVersionId } = req.body;

    const template = await prisma.opsSopTemplate.findUnique({
      where: { id: templateId },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: "SOP Template not found" });
    }

    const nextVersionNum = (template.versions[0]?.versionNumber || 0) + 1;

    const newVersion = await prisma.$transaction(async (tx) => {
      const version = await tx.opsSopVersion.create({
        data: {
          tenantId,
          templateId,
          versionNumber: nextVersionNum,
          versionLabel: `v${nextVersionNum}`,
          status: "DRAFT",
          createdById: req.user?.id || null,
        },
      });

      // Copy task templates from previous version if requested
      if (copyFromVersionId) {
        const sourceTasks = await tx.opsSopTaskTemplate.findMany({
          where: { versionId: copyFromVersionId },
        });

        for (const t of sourceTasks) {
          await tx.opsSopTaskTemplate.create({
            data: {
              tenantId,
              versionId: version.id,
              taskName: t.taskName,
              description: t.description,
              stage: t.stage,
              relativeOffset: t.relativeOffset,
              priority: t.priority,
              isRequired: t.isRequired,
              defaultAssignee: t.defaultAssignee,
              instructions: t.instructions,
              verificationReq: t.verificationReq,
              sortOrder: t.sortOrder,
              active: t.active,
            },
          });
        }
      }

      return version;
    });

    return res.status(201).json({ success: true, data: newVersion });
  } catch (err) {
    console.error("createSopVersion error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/ops/sops/versions/:versionId/activate - Activate an SOP version
exports.activateSopVersion = async (req, res) => {
  try {
    const { versionId } = req.params;

    const version = await prisma.opsSopVersion.findUnique({
      where: { id: versionId },
      include: { template: true, taskTemplates: true },
    });

    if (!version) {
      return res.status(404).json({ success: false, message: "SOP Version not found" });
    }

    if (version.taskTemplates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot activate an SOP version without any task templates",
      });
    }

    await prisma.$transaction(async (tx) => {
      // Archive other versions
      await tx.opsSopVersion.updateMany({
        where: { templateId: version.templateId, id: { not: versionId } },
        data: { status: "ARCHIVED" },
      });

      // Set target version ACTIVE
      await tx.opsSopVersion.update({
        where: { id: versionId },
        data: { status: "ACTIVE", activatedAt: new Date() },
      });

      // Link to master template
      await tx.opsSopTemplate.update({
        where: { id: version.templateId },
        data: { activeVersionId: versionId },
      });
    });

    return res.json({ success: true, message: `Activated SOP version ${version.versionLabel}` });
  } catch (err) {
    console.error("activateSopVersion error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 2. SOP TASK TEMPLATE MANAGERS
// ─────────────────────────────────────────────────────────

// POST /api/ops/sops/versions/:versionId/tasks - Create task template inside SOP version
exports.createTaskTemplate = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const { versionId } = req.params;
    const {
      taskName,
      description,
      stage,
      relativeOffset,
      priority,
      isRequired,
      defaultAssignee,
      instructions,
      verificationReq,
      sortOrder,
    } = req.body;

    if (!taskName || !taskName.trim()) {
      return res.status(400).json({ success: false, message: "taskName is required" });
    }

    // Verify version exists
    const version = await prisma.opsSopVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) {
      return res.status(404).json({ success: false, message: `SOP Version ${versionId} not found` });
    }

    // Safe number parsing to prevent Prisma NaN errors
    const numOffset = parseInt(relativeOffset, 10);
    const safeOffset = isNaN(numOffset) ? -7 : numOffset;

    const numSort = parseInt(sortOrder, 10);
    const safeSort = isNaN(numSort) ? 0 : numSort;

    const task = await prisma.opsSopTaskTemplate.create({
      data: {
        tenantId,
        versionId,
        taskName: taskName.trim(),
        description: description || null,
        stage: stage || "PRE_TRIP_7D",
        relativeOffset: safeOffset,
        priority: priority || "MEDIUM",
        isRequired: isRequired !== undefined ? Boolean(isRequired) : true,
        defaultAssignee: defaultAssignee || "OPERATIONS",
        instructions: instructions || null,
        verificationReq: verificationReq || null,
        sortOrder: safeSort,
      },
    });

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    console.error("createTaskTemplate error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create task template" });
  }
};

// PUT /api/ops/sops/tasks/:taskId - Edit task template
exports.updateTaskTemplate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const data = req.body;

    const updateData = {};
    if (data.taskName !== undefined) updateData.taskName = data.taskName.trim();
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.relativeOffset !== undefined) {
      const parsed = parseInt(data.relativeOffset, 10);
      if (!isNaN(parsed)) updateData.relativeOffset = parsed;
    }
    if (data.stage !== undefined) {
      updateData.stage = data.stage;
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isRequired !== undefined) updateData.isRequired = Boolean(data.isRequired);
    if (data.defaultAssignee !== undefined) updateData.defaultAssignee = data.defaultAssignee;
    if (data.instructions !== undefined) updateData.instructions = data.instructions || null;
    if (data.verificationReq !== undefined) updateData.verificationReq = data.verificationReq || null;
    if (data.sortOrder !== undefined) {
      const parsedSort = parseInt(data.sortOrder, 10);
      if (!isNaN(parsedSort)) updateData.sortOrder = parsedSort;
    }
    if (data.active !== undefined) updateData.active = Boolean(data.active);

    const task = await prisma.opsSopTaskTemplate.update({
      where: { id: taskId },
      data: updateData,
    });

    return res.json({ success: true, data: task });
  } catch (err) {
    console.error("updateTaskTemplate error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update task template" });
  }
};

// DELETE /api/ops/sops/tasks/:taskId - Delete task template
exports.deleteTaskTemplate = async (req, res) => {
  try {
    const { taskId } = req.params;
    await prisma.opsSopTaskTemplate.delete({
      where: { id: taskId },
    });
    return res.json({ success: true, message: "Task template deleted" });
  } catch (err) {
    console.error("deleteTaskTemplate error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ops/sops/preview-schedule - Preview task due dates for a sample departure date
exports.previewSopSchedule = async (req, res) => {
  try {
    const { versionId, departureDate: rawDate } = req.body;
    if (!versionId || !rawDate) {
      return res.status(400).json({ success: false, message: "versionId and departureDate are required" });
    }

    const departureDate = normalizeDepartureDateIndia(rawDate);
    const version = await prisma.opsSopVersion.findUnique({
      where: { id: versionId },
      include: {
        taskTemplates: {
          where: { active: true },
          orderBy: [{ relativeOffset: "asc" }, { sortOrder: "asc" }],
        },
      },
    });

    if (!version) {
      return res.status(404).json({ success: false, message: "SOP version not found" });
    }

    const schedule = version.taskTemplates.map((t) => {
      const dueDate = calculateDueDate(departureDate, t.relativeOffset);
      return {
        taskTemplateId: t.id,
        taskName: t.taskName,
        stage: t.stage,
        relativeOffset: t.relativeOffset,
        offsetLabel: t.relativeOffset === 0 ? "T0 (Departure Day)" : t.relativeOffset < 0 ? `T${t.relativeOffset}` : `T+${t.relativeOffset}`,
        dueDate: dueDate ? dueDate.toISOString().substring(0, 10) : null,
        priority: t.priority,
        isRequired: t.isRequired,
        defaultAssignee: t.defaultAssignee,
      };
    });

    return res.json({ success: true, data: schedule });
  } catch (err) {
    console.error("previewSopSchedule error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────
// 3. TASK INSTANCE GENERATION & DATE ENGINE
// ─────────────────────────────────────────────────────────

// POST /api/ops/sops/apply-to-departure - Idempotently generate task instances for a departure
exports.applySopToDeparture = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const { tripId: rawTripId, departureDate: rawDate, versionId } = req.body;

    if (!rawTripId || !rawDate) {
      return res.status(400).json({ success: false, message: "tripId and departureDate are required" });
    }

    const departureDate = normalizeDepartureDateIndia(rawDate);
    if (!departureDate || isNaN(departureDate.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid departureDate" });
    }

    // Resolve trip record
    const trip = await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [{ id: rawTripId }, { slug: rawTripId }, { shortName: rawTripId }],
      },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip record not found" });
    }

    // Find active version
    let sopVersion = null;
    if (versionId) {
      sopVersion = await prisma.opsSopVersion.findUnique({
        where: { id: versionId },
        include: { taskTemplates: { where: { active: true } }, template: true },
      });
    } else {
      const template = await prisma.opsSopTemplate.findFirst({
        where: { tenantId, tripId: trip.id },
        include: {
          versions: {
            where: { status: "ACTIVE" },
            include: { taskTemplates: { where: { active: true } } },
          },
        },
      });
      sopVersion = template?.versions[0] ? { ...template.versions[0], template } : null;
    }

    if (!sopVersion || sopVersion.taskTemplates.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active SOP version with task templates found for trip "${trip.title}"`,
      });
    }

    // Idempotent generation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find existing departure task instances
      const existingTasks = await tx.opsTripChecklist.findMany({
        where: {
          tenantId,
          tripId: trip.id,
          departureDate,
        },
      });

      const existingTaskTemplateIds = new Set(
        existingTasks.map((t) => t.sopTaskTemplateId).filter(Boolean)
      );

      let createdCount = 0;
      let skippedCount = 0;

      for (const t of sopVersion.taskTemplates) {
        if (existingTaskTemplateIds.has(t.id)) {
          skippedCount++;
          continue;
        }

        const dueDate = calculateDueDate(departureDate, t.relativeOffset);
        const isOverdue = dueDate && dueDate < new Date() && t.relativeOffset < 0;

        await tx.opsTripChecklist.create({
          data: {
            tenantId,
            tripId: trip.id,
            departureDate,
            sopTemplateId: sopVersion.templateId,
            sopVersionId: sopVersion.id,
            sopTaskTemplateId: t.id,
            source: "SOP",
            stage: t.stage,
            taskName: t.taskName,
            relativeOffset: t.relativeOffset,
            isRequired: t.isRequired,
            sortOrder: t.sortOrder,
            assignedTo: t.defaultAssignee || "OPERATIONS",
            priority: t.priority,
            dueDate,
            status: isOverdue ? "Overdue" : "Pending",
            notes: t.description || t.instructions || null,
          },
        });
        createdCount++;
      }

      return {
        tripId: trip.id,
        departureDate: departureDate.toISOString().substring(0, 10),
        createdCount,
        skippedCount,
        totalExisting: existingTasks.length,
        versionLabel: sopVersion.versionLabel,
      };
    });

    return res.json({
      success: true,
      message: `Generated ${result.createdCount} departure tasks from SOP ${result.versionLabel} (${result.skippedCount} duplicates skipped)`,
      data: result,
    });
  } catch (err) {
    console.error("applySopToDeparture error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/ops/sops/recalculate-dates - Recalculate pending task due dates when departure date moves
exports.recalculateDepartureTaskDates = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const { tripId: rawTripId, oldDepartureDate: rawOldDate, newDepartureDate: rawNewDate } = req.body;

    if (!rawTripId || !rawOldDate || !rawNewDate) {
      return res.status(400).json({ success: false, message: "tripId, oldDepartureDate, and newDepartureDate are required" });
    }

    const oldDate = normalizeDepartureDateIndia(rawOldDate);
    const newDate = normalizeDepartureDateIndia(rawNewDate);

    // Resolve trip record
    const trip = await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [{ id: rawTripId }, { slug: rawTripId }, { shortName: rawTripId }],
      },
    });

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip record not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find all tasks for the old departure date
      const tasks = await tx.opsTripChecklist.findMany({
        where: {
          tenantId,
          tripId: trip.id,
          departureDate: oldDate,
        },
      });

      let updatedCount = 0;
      let preservedCompletedCount = 0;

      for (const t of tasks) {
        if (t.isCompleted) {
          // Preserve completed historical task dates
          await tx.opsTripChecklist.update({
            where: { id: t.id },
            data: { departureDate: newDate },
          });
          preservedCompletedCount++;
        } else {
          // Recalculate pending SOP task due dates
          const offset = t.relativeOffset !== null && t.relativeOffset !== undefined ? t.relativeOffset : 0;
          const newDueDate = calculateDueDate(newDate, offset);
          const isOverdue = newDueDate && newDueDate < new Date() && offset < 0;

          await tx.opsTripChecklist.update({
            where: { id: t.id },
            data: {
              departureDate: newDate,
              dueDate: newDueDate,
              status: isOverdue ? "Overdue" : "Pending",
            },
          });
          updatedCount++;
        }
      }

      return { updatedCount, preservedCompletedCount };
    });

    return res.json({
      success: true,
      message: `Updated ${result.updatedCount} pending tasks to new departure date (preserved ${result.preservedCompletedCount} completed tasks)`,
      data: result,
    });
  } catch (err) {
    console.error("recalculateDepartureTaskDates error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
