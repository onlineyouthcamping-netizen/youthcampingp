const { prisma } = require("../lib/prisma");

/**
 * GET /api/finance/audit
 * Query financial audit logs with entity, action, and date filters.
 */
async function getAuditLogs(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { entityType, action, actorUserId, bookingId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (entityType && entityType !== "ALL") where.entityType = entityType;
    if (action && action !== "ALL") where.action = action;
    if (actorUserId) where.actorUserId = actorUserId;
    if (bookingId) where.bookingId = bookingId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching audit logs:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch audit logs" });
  }
}

/**
 * GET /api/finance/audit/reports/trail-by-entity
 * Chronological change history for a specific entity with optional CSV export.
 */
async function getTrailByEntity(req, res) {
  try {
    const tenantId = req.user?.tenantId || req.admin?.tenantId || "default";
    const { entityType, entityId, format } = req.query;

    if (!entityType || !entityId) {
      return res.status(400).json({ success: false, message: "entityType and entityId are required" });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: "asc" },
    });

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="audit_trail_${entityType}_${entityId}.csv"`
      );

      const header = "Timestamp,ActorID,ChangedBy,Action,Summary,IPAddress\n";
      const rows = logs
        .map((l) => {
          const time = new Date(l.createdAt).toISOString();
          const actor = l.actorUserId || "";
          const user = (l.changedBy || "").replace(/"/g, '""');
          const act = l.action || "";
          const sum = (l.changeSummary || "").replace(/"/g, '""');
          const ip = l.ipAddress || "";
          return `"${time}","${actor}","${user}","${act}","${sum}","${ip}"`;
        })
        .join("\n");

      return res.send(header + rows);
    }

    return res.json({
      success: true,
      entityType,
      entityId,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("❌ Error fetching audit trail by entity:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch audit trail" });
  }
}

module.exports = {
  getAuditLogs,
  getTrailByEntity,
};
