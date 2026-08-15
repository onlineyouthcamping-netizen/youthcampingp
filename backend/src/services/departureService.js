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
        actorUserId: actorId || null,
        action: "UPDATE_DEPARTURE_STATUS",
        entityType: "Departure",
        entityId: updatedDep.id,
        beforeData: { status: currentDep.status },
        afterData: { status: targetStatus, notes },
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
  rescheduleDeparture,
  toDateKey,
  normalizeUtcDate,
};

function toDateKey(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeUtcDate(value) {
  const key = toDateKey(value);
  if (!key) return null;
  return new Date(`${key}T00:00:00.000Z`);
}

function shiftDateByDays(value, deltaDays) {
  if (!value) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d;
}

function dayDelta(oldDate, newDate) {
  return Math.round((newDate.getTime() - oldDate.getTime()) / 86400000);
}

function replaceAvailableDate(availableDates, oldKey, newKey) {
  const list = Array.isArray(availableDates) ? [...availableDates] : [];
  let found = false;
  const next = list.map((entry) => {
    if (typeof entry === "string") {
      if (toDateKey(entry) === oldKey) {
        found = true;
        return newKey;
      }
      return entry;
    }
    if (entry && typeof entry === "object") {
      if (toDateKey(entry.date) === oldKey) {
        found = true;
        return { ...entry, date: newKey };
      }
    }
    return entry;
  });
  if (!found) next.push({ date: newKey, capacity: 99, bookedCount: 0 });
  return next;
}

async function countScoped(tx, model, where) {
  if (!tx[model]) return 0;
  try {
    return await tx[model].count({ where });
  } catch {
    return 0;
  }
}

async function updateScoped(tx, model, where, data) {
  if (!tx[model]) return 0;
  try {
    const result = await tx[model].updateMany({ where, data });
    return result.count || 0;
  } catch (err) {
    throw new Error(`Failed updating ${model}: ${err.message}`);
  }
}

/**
 * Atomically reschedule a departure from oldDate → newDate.
 * Moves tripId+departureDate scoped operational rows. No merge with existing target.
 */
async function rescheduleDeparture(params = {}) {
  const {
    tripId: rawTripId,
    oldDate: rawOld,
    newDate: rawNew,
    reason,
    actorId = null,
    tenantId = "default",
    dryRun = false,
    expectedDepartureUpdatedAt = null,
  } = params;

  const oldKey = toDateKey(rawOld);
  const newKey = toDateKey(rawNew);
  if (!rawTripId || !oldKey || !newKey) {
    const err = new Error("tripId, oldDate, and newDate are required (YYYY-MM-DD)");
    err.code = "VALIDATION_ERROR";
    err.statusCode = 400;
    throw err;
  }
  if (oldKey === newKey) {
    const err = new Error("oldDate and newDate must be different");
    err.code = "VALIDATION_ERROR";
    err.statusCode = 400;
    throw err;
  }
  if (!reason || !String(reason).trim()) {
    const err = new Error("reason is required");
    err.code = "VALIDATION_ERROR";
    err.statusCode = 400;
    throw err;
  }

  const oldDate = normalizeUtcDate(oldKey);
  const newDate = normalizeUtcDate(newKey);
  const delta = dayDelta(oldDate, newDate);

  const scopedTrip =
    (await prisma.trip.findFirst({
      where: {
        tenantId,
        OR: [{ id: rawTripId }, { slug: rawTripId }, { shortName: rawTripId }],
      },
    })) ||
    (await prisma.trip.findFirst({
      where: {
        OR: [{ id: rawTripId }, { slug: rawTripId }, { shortName: rawTripId }],
      },
    }));

  if (!scopedTrip) {
    const err = new Error(`Trip not found: ${rawTripId}`);
    err.code = "NOT_FOUND";
    err.statusCode = 404;
    throw err;
  }

  const tripId = scopedTrip.id;
  const sourceDep = await prisma.departure.findUnique({
    where: { tripId_departureDate: { tripId, departureDate: oldDate } },
  });

  if (sourceDep) {
    if (["In Progress", "Completed"].includes(sourceDep.status)) {
      const err = new Error(
        `Cannot reschedule departure in status '${sourceDep.status}'`,
      );
      err.code = "DEPARTURE_STATUS_LOCKED";
      err.statusCode = 409;
      throw err;
    }
    if (
      expectedDepartureUpdatedAt &&
      sourceDep.updatedAt &&
      new Date(expectedDepartureUpdatedAt).getTime() !==
        new Date(sourceDep.updatedAt).getTime()
    ) {
      const err = new Error("Departure was modified by another user; refresh and retry");
      err.code = "CONFLICT";
      err.statusCode = 409;
      throw err;
    }
  }

  const targetDep = await prisma.departure.findUnique({
    where: { tripId_departureDate: { tripId, departureDate: newDate } },
  });
  if (targetDep) {
    const err = new Error(`Target departure already exists for ${newKey}`);
    err.code = "TARGET_EXISTS";
    err.statusCode = 409;
    throw err;
  }

  const dateWhere = { tripId, departureDate: oldDate };
  const inventoryModels = [
    "opsHotelBooking",
    "opsRoomInventory",
    "opsTransportFleet",
    "opsGuidePayment",
    "opsMiscExpense",
    "opsSeatConfig",
    "opsTripChecklist",
    "opsIncidentLog",
    "opsAllocationRun",
    "opsVehicleAllocation",
    "opsRoomAllocation",
    "opsDayItinerary",
    "opsTripExpense",
    "opsTripLeader",
    "opsActivity",
    "opsVendorPayment",
    "opsDocument",
    "opsMessage",
  ];

  const counts = {};
  for (const model of inventoryModels) {
    counts[model] = await countScoped(prisma, model, dateWhere);
  }
  counts.booking = await prisma.booking.count({ where: dateWhere });
  counts.departure = sourceDep ? 1 : 0;

  const preview = {
    tripId,
    oldDate: oldKey,
    newDate: newKey,
    deltaDays: delta,
    reason: String(reason).trim(),
    counts,
    departureId: sourceDep?.id || null,
    departureCode: sourceDep?.departureCode || null,
  };

  if (dryRun) {
    return { dryRun: true, ...preview };
  }

  const newCode = generateDepartureCode(
    scopedTrip.slug || scopedTrip.title || tripId,
    newKey,
  );
  const oldSynthetic = `${tripId}_${oldKey}`;
  const newSynthetic = `${tripId}_${newKey}`;
  const oldSyntheticHyphen = `${tripId}-${oldKey}`;
  const newSyntheticHyphen = `${tripId}-${newKey}`;

  const result = await prisma.$transaction(
    async (tx) => {
      const updates = {};

      // Primary identity
      const nextAvailable = replaceAvailableDate(
        scopedTrip.availableDates,
        oldKey,
        newKey,
      );
      await tx.trip.update({
        where: { id: tripId },
        data: { availableDates: nextAvailable },
      });
      updates.tripAvailableDates = 1;

      if (sourceDep) {
        await tx.departure.update({
          where: { id: sourceDep.id },
          data: {
            departureDate: newDate,
            departureCode: newCode,
          },
        });
        updates.departure = 1;
      } else {
        await tx.departure.create({
          data: {
            tenantId: scopedTrip.tenantId || tenantId,
            departureCode: newCode,
            tripId,
            departureDate: newDate,
            status: "Planning",
          },
        });
        updates.departure = 1;
      }

      // Price overrides (string date)
      try {
        const po = await tx.tripDeparturePriceOverride.updateMany({
          where: { tripId, departureDate: oldKey },
          data: { departureDate: newKey },
        });
        updates.tripDeparturePriceOverride = po.count || 0;
      } catch {
        updates.tripDeparturePriceOverride = 0;
      }

      // Bookings + joiningDate shift
      const bookings = await tx.booking.findMany({
        where: dateWhere,
        select: { id: true, joiningDate: true },
      });
      for (const b of bookings) {
        await tx.booking.update({
          where: { id: b.id },
          data: {
            departureDate: newDate,
            ...(b.joiningDate
              ? { joiningDate: shiftDateByDays(b.joiningDate, delta) }
              : {}),
          },
        });
      }
      updates.booking = bookings.length;

      // Active booking links (soft string date)
      try {
        const bl = await tx.bookingLink.updateMany({
          where: { tripId, departureDate: oldKey },
          data: { departureDate: newKey },
        });
        updates.bookingLink = bl.count || 0;
      } catch {
        updates.bookingLink = 0;
      }

      // Ops scoped models
      for (const model of inventoryModels) {
        updates[model] = await updateScoped(tx, model, dateWhere, {
          departureDate: newDate,
        });
      }

      // Relative service dates on selected models
      const hotels = await tx.opsHotelBooking.findMany({
        where: { tripId, departureDate: newDate },
        select: { id: true, checkIn: true, checkOut: true },
      });
      for (const h of hotels) {
        await tx.opsHotelBooking.update({
          where: { id: h.id },
          data: {
            checkIn: h.checkIn ? shiftDateByDays(h.checkIn, delta) : h.checkIn,
            checkOut: h.checkOut
              ? shiftDateByDays(h.checkOut, delta)
              : h.checkOut,
          },
        });
      }

      const guides = await tx.opsGuidePayment.findMany({
        where: { tripId, departureDate: newDate },
        select: { id: true, startDate: true, endDate: true },
      });
      for (const g of guides) {
        await tx.opsGuidePayment.update({
          where: { id: g.id },
          data: {
            startDate: g.startDate
              ? shiftDateByDays(g.startDate, delta)
              : g.startDate,
            endDate: g.endDate ? shiftDateByDays(g.endDate, delta) : g.endDate,
          },
        });
      }

      // Pending checklist due dates
      const pendingTasks = await tx.opsTripChecklist.findMany({
        where: {
          tripId,
          departureDate: newDate,
          isCompleted: false,
        },
        select: { id: true, relativeOffset: true },
      });
      for (const t of pendingTasks) {
        const offset =
          t.relativeOffset !== null && t.relativeOffset !== undefined
            ? t.relativeOffset
            : 0;
        const due = new Date(newDate);
        due.setUTCDate(due.getUTCDate() + offset);
        await tx.opsTripChecklist.update({
          where: { id: t.id },
          data: { dueDate: due },
        });
      }
      updates.checklistDueDates = pendingTasks.length;

      // Synthetic departureId on OpsDepartureVendorAllocation
      try {
        const a1 = await tx.opsDepartureVendorAllocation.updateMany({
          where: { departureId: oldSynthetic },
          data: { departureId: newSynthetic },
        });
        const a2 = await tx.opsDepartureVendorAllocation.updateMany({
          where: { departureId: oldSyntheticHyphen },
          data: { departureId: newSyntheticHyphen },
        });
        updates.opsDepartureVendorAllocation = (a1.count || 0) + (a2.count || 0);
      } catch {
        updates.opsDepartureVendorAllocation = 0;
      }

      // Directory mappings
      try {
        const dmap = await tx.directoryTripVendorMapping.updateMany({
          where: { tripId, departureDate: oldDate },
          data: { departureDate: newDate },
        });
        updates.directoryTripVendorMapping = dmap.count || 0;
      } catch {
        // may be string date
        try {
          const dmap2 = await tx.directoryTripVendorMapping.updateMany({
            where: { tripId, departureDate: oldKey },
            data: { departureDate: newKey },
          });
          updates.directoryTripVendorMapping = dmap2.count || 0;
        } catch {
          updates.directoryTripVendorMapping = 0;
        }
      }

      // Assert no movable source rows remain
      for (const model of inventoryModels) {
        const leftover = await countScoped(tx, model, dateWhere);
        if (leftover > 0) {
          throw new Error(
            `Reschedule incomplete: ${leftover} ${model} rows still on ${oldKey}`,
          );
        }
      }
      const leftoverBookings = await tx.booking.count({ where: dateWhere });
      if (leftoverBookings > 0) {
        throw new Error(
          `Reschedule incomplete: ${leftoverBookings} bookings still on ${oldKey}`,
        );
      }

      await tx.auditLog.create({
        data: {
          tenantId: scopedTrip.tenantId || tenantId,
          actorUserId: actorId || null,
          action: "RESCHEDULE_DEPARTURE",
          entityType: "Departure",
          entityId: sourceDep?.id || `${tripId}_${newKey}`,
          beforeData: { departureDate: oldKey, departureCode: sourceDep?.departureCode || null },
          afterData: {
            departureDate: newKey,
            departureCode: newCode,
            reason: String(reason).trim(),
            counts: updates,
          },
        },
      });

      return {
        tripId,
        oldDate: oldKey,
        newDate: newKey,
        departureId: sourceDep?.id || null,
        departureCode: newCode,
        syntheticDepartureId: newSynthetic,
        updates,
      };
    },
    { isolationLevel: "Serializable", maxWait: 10000, timeout: 60000 },
  );

  return { dryRun: false, ...preview, ...result };
}
