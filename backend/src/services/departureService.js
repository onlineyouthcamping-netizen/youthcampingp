const { prisma } = require("../lib/prisma");

const ALLOWED_STATUSES = [
  "Planning",
  "Ready",
  "Confirmed",
  "In Progress",
  "Completed",
  "Cancelled",
];

const VALID_TRANSITIONS = {
  Planning: ["Ready", "Cancelled"],
  Ready: ["Confirmed", "Planning", "Cancelled"],
  Confirmed: ["In Progress", "Planning", "Cancelled"],
  "In Progress": ["Completed", "Cancelled"],
  Completed: ["Cancelled"],
  Cancelled: ["Planning"],
};

/**
 * Format stable departure code.
 * E.g. DEP-SPITI-VALLEY-2026-08-15
 */
function generateDepartureCode(tripSlugOrId, dateStr) {
  const cleanSlug = String(tripSlugOrId || "trip")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const cleanDate = dateStr.substring(0, 10);
  return `DEP-${cleanSlug.toUpperCase()}-${cleanDate}`;
}

/**
 * Resolves an existing Departure record or automatically creates one.
 */
async function resolveOrCreateDeparture(tripId, departureDateStr, tenantId = "default") {
  const dDate = new Date(departureDateStr);
  if (isNaN(dDate.getTime())) {
    throw new Error(`Invalid departure date string: ${departureDateStr}`);
  }

  // 1. Try to find by unique (tripId, departureDate)
  let dep = await prisma.departure.findUnique({
    where: {
      tripId_departureDate: {
        tripId,
        departureDate: dDate,
      },
    },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
        },
      },
      confirmedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (dep) return dep;

  // 2. Lookup trip info for code generation
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { id: true, slug: true, title: true },
  });

  if (!trip) {
    throw new Error(`Trip not found for ID: ${tripId}`);
  }

  const departureCode = generateDepartureCode(trip.slug || trip.title || tripId, departureDateStr);

  // 3. Upsert departure atomically
  dep = await prisma.departure.upsert({
    where: {
      tripId_departureDate: {
        tripId,
        departureDate: dDate,
      },
    },
    update: {},
    create: {
      tenantId,
      departureCode,
      tripId,
      departureDate: dDate,
      status: "Planning",
    },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          slug: true,
          location: true,
        },
      },
      confirmedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return dep;
}

/**
 * Validates whether a status transition is permitted.
 */
function validateStatusTransition(currentStatus, targetStatus) {
  if (!ALLOWED_STATUSES.includes(targetStatus)) {
    throw new Error(`Invalid departure status '${targetStatus}'. Allowed: ${ALLOWED_STATUSES.join(", ")}`);
  }

  if (currentStatus === targetStatus) return true;

  const allowedTargets = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedTargets.includes(targetStatus)) {
    throw new Error(
      `Cannot transition departure status from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${allowedTargets.join(", ") || "None"}`
    );
  }
  return true;
}

/**
 * Updates a departure's status with backend validation and audit logging.
 */
async function updateDepartureStatus(tripId, departureDateStr, targetStatus, options = {}) {
  const { notes, actorId, tenantId = "default" } = options;

  const currentDep = await resolveOrCreateDeparture(tripId, departureDateStr, tenantId);

  validateStatusTransition(currentDep.status, targetStatus);

  const updateData = {
    status: targetStatus,
    notes: notes !== undefined ? notes : currentDep.notes,
  };

  if (targetStatus === "Confirmed" && currentDep.status !== "Confirmed") {
    updateData.confirmedAt = new Date();
    if (actorId) updateData.confirmedById = actorId;
  }

  const updatedDep = await prisma.departure.update({
    where: { id: currentDep.id },
    data: updateData,
    include: {
      trip: {
        select: { id: true, title: true, slug: true },
      },
      confirmedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  // Log Audit Entry
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorId: actorId || null,
        actorRole: "admin",
        action: "UPDATE_DEPARTURE_STATUS",
        entity: "Departure",
        entityId: updatedDep.id,
        description: `Changed departure status for ${updatedDep.departureCode} from ${currentDep.status} to ${targetStatus}`,
        metadata: {
          previousStatus: currentDep.status,
          newStatus: targetStatus,
          notes,
        },
      },
    });
  } catch (logErr) {
    console.error("[DEPARTURE_AUDIT_LOG_ERR]", logErr.message);
  }

  return updatedDep;
}

module.exports = {
  ALLOWED_STATUSES,
  VALID_TRANSITIONS,
  generateDepartureCode,
  resolveOrCreateDeparture,
  validateStatusTransition,
  updateDepartureStatus,
};
