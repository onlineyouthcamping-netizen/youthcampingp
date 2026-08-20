const { prisma } = require("../lib/prisma");

async function syncAllChecklistsWithSops() {
  console.log("🔄 Synchronizing Departure Checklists with Master SOPs...");

  // 1. Delete legacy dummy tasks (where taskName is one of the hardcoded defaults and sopTaskTemplateId is null)
  const legacyDummyNames = [
    "WhatsApp group created",
    "Guide confirmed",
    "Train tickets reviewed",
    "Hotel booking confirmed",
    "Packing list sent",
    "SIM/mobile advisory sent",
    "Emergency contact collected",
    "Vehicle reconfirmed",
    "Hotel reconfirmed",
    "Trip leader briefed",
    "Headcount completed",
    "Documents checked",
    "Group photo completed",
    "Daily check-in logged",
    "Incident review completed",
    "Feedback form sent",
    "Photos collected",
    "Next-trip follow-up created",
  ];

  const deletedLegacy = await prisma.opsTripChecklist.deleteMany({
    where: {
      sopTaskTemplateId: null,
      taskName: { in: legacyDummyNames },
    },
  });
  console.log(`🧹 Cleaned up ${deletedLegacy.count} legacy dummy checklist items.`);

  // 2. Find all active departures with non-cancelled bookings
  const bookings = await prisma.booking.findMany({
    where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
    select: { tripId: true, departureDate: true },
  });

  const activeDeps = Array.from(
    new Set(
      bookings
        .filter((b) => b.tripId && b.departureDate)
        .map((b) => `${b.tripId}___${b.departureDate.toISOString().substring(0, 10)}`)
    )
  ).map((k) => {
    const [tripId, depDateStr] = k.split("___");
    return { tripId, departureDate: new Date(depDateStr) };
  });

  console.log(`Found ${activeDeps.length} active departures with bookings.`);

  // 3. For each active departure, apply the trip active SOP template
  for (const dep of activeDeps) {
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [{ id: dep.tripId }, { slug: dep.tripId }, { shortName: dep.tripId }],
      },
    });
    if (!trip) continue;

    const template = await prisma.opsSopTemplate.findFirst({
      where: {
        OR: [{ tripId: trip.id }, { tripId: dep.tripId }],
      },
      include: {
        versions: {
          include: {
            taskTemplates: {
              where: { active: true },
              orderBy: [{ relativeOffset: "asc" }, { sortOrder: "asc" }],
            },
          },
        },
      },
    });

    if (!template) continue;
    const version =
      template.versions.find((v) => v.id === template.activeVersionId) ||
      template.versions[0];
    if (!version || !version.taskTemplates.length) continue;

    const existing = await prisma.opsTripChecklist.findMany({
      where: {
        tripId: dep.tripId,
        departureDate: dep.departureDate,
      },
      select: { sopTaskTemplateId: true, taskName: true },
    });

    const existingTaskIds = new Set(
      existing.map((e) => e.sopTaskTemplateId).filter(Boolean)
    );
    const existingNames = new Set(existing.map((e) => e.taskName));

    const toInsert = [];
    for (const t of version.taskTemplates) {
      if (existingTaskIds.has(t.id) || existingNames.has(t.taskName)) continue;

      let dueDate = null;
      if (t.relativeOffset !== undefined && t.relativeOffset !== null) {
        const d = new Date(dep.departureDate);
        d.setDate(d.getDate() + Number(t.relativeOffset));
        dueDate = d;
      }

      toInsert.push({
        tenantId: "default",
        tripId: dep.tripId,
        departureDate: dep.departureDate,
        sopTemplateId: template.id,
        sopVersionId: version.id,
        sopTaskTemplateId: t.id,
        source: "SOP & CHECKLIST",
        stage: t.stage || "DURING_TRIP",
        taskName: t.taskName,
        notes: t.instructions || null,
        priority: t.priority || "HIGH",
        assignedTo: t.defaultAssignee || "OPERATIONS",
        relativeOffset: t.relativeOffset,
        dueDate: dueDate,
        isCompleted: false,
        status: "Pending",
      });
    }

    if (toInsert.length > 0) {
      await prisma.opsTripChecklist.createMany({ data: toInsert });
      console.log(
        `✅ Synced ${toInsert.length} SOP tasks for departure ${dep.tripId} (${dep.departureDate.toISOString().substring(0, 10)})`
      );
    }
  }

  console.log("✨ All departure checklists are now in 100% sync with SOP templates!");
}

syncAllChecklistsWithSops()
  .catch((err) => {
    console.error("Sync failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
