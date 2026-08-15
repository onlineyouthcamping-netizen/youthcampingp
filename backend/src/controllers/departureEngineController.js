const departureService = require("../services/departureService");
const readinessEngine = require("../services/readinessEngine");

/**
 * GET /api/departures/resolve?tripId=...&date=...
 * Resolves or auto-creates a departure for a tripId and date.
 */
exports.resolveDeparture = async (req, res, next) => {
  try {
    const { tripId, date } = req.query;
    if (!tripId || !date) {
      return res.status(400).json({ success: false, message: "Query params 'tripId' and 'date' are required." });
    }

    const departure = await departureService.resolveOrCreateDeparture(tripId, date, req.user?.tenantId || "default");
    const readiness = await readinessEngine.calculateReadiness(tripId, date);

    res.json({
      success: true,
      data: {
        departure,
        readiness,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/departures/status
 * Body: { tripId, date, status, notes }
 * Enforces backend status transition validation and audit logging.
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { tripId, date, status, notes } = req.body;
    if (!tripId || !date || !status) {
      return res.status(400).json({ success: false, message: "Fields 'tripId', 'date', and 'status' are required." });
    }

    const updatedDeparture = await departureService.updateDepartureStatus(tripId, date, status, {
      notes,
      actorId: req.user?.id || req.user?.adminId,
      tenantId: req.user?.tenantId || "default",
    });

    const readiness = await readinessEngine.calculateReadiness(tripId, date);

    res.json({
      success: true,
      message: `Departure status updated to '${status}'`,
      data: {
        departure: updatedDeparture,
        readiness,
      },
    });
  } catch (error) {
    if (error.message.includes("Invalid departure status") || error.message.includes("Cannot transition")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

/**
 * GET /api/departures/readiness?tripId=...&date=...
 * Authoritative live readiness endpoint.
 */
exports.getReadiness = async (req, res, next) => {
  try {
    const { tripId, date } = req.query;
    if (!tripId || !date) {
      return res.status(400).json({ success: false, message: "Query params 'tripId' and 'date' are required." });
    }

    const readiness = await readinessEngine.calculateReadiness(tripId, date);

    res.json({
      success: true,
      data: readiness,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/departures/passenger-statistics/:tripId/:date
 */
exports.getPassengerStatistics = async (req, res, next) => {
  try {
    const { tripId, date } = req.params;
    if (!tripId || !date) {
      return res.status(400).json({ success: false, message: "Missing tripId or date" });
    }

    const [readiness, paxData] = await Promise.all([
      readinessEngine.calculateReadiness(tripId, date),
      readinessEngine.getDeparturePassengerStats(tripId, date),
    ]);

    const allPax = paxData.allPassengers || [];
    const malePax = allPax.filter((p) => String(p.gender || "").toLowerCase().startsWith("m"));
    const femalePax = allPax.filter((p) => String(p.gender || "").toLowerCase().startsWith("f"));
    const twinPax = allPax.filter((p) => {
      const rs = String(p.roomSharing || "").toLowerCase();
      return rs.includes("double") || rs.includes("twin");
    });
    const twinPairs = Math.floor(twinPax.length / 2);

    const stats = {
      summary: {
        total: allPax.length,
        men: malePax.length,
        women: femalePax.length,
        twinPairs,
        guides: 1,
        drivers: 1,
      },
      groups: {
        male: malePax,
        female: femalePax,
        pairs: Array(twinPairs).fill(null),
      },
      readiness: {
        status: readiness.status === "READY" ? "Ready" : "Action Required",
        reason: readiness.status === "READY" ? "Manifest Verified" : `${readiness.missingItems?.length || 0} Action Items`,
      },
      warnings: readiness.missingItems || [],
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
