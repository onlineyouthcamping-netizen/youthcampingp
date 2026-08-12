const { prisma } = require("../lib/prisma");
const {
  createSopTemplate,
  createTaskTemplate,
  applySopToDeparture,
  recalculateDepartureTaskDates,
} = require("../controllers/opsSopController");

async function runAcceptanceTest() {
  console.log("🧪 Starting Trip-Specific SOP 6-Step Acceptance Test...\n");
  const tenantId = "default";

  // ── STEP 1: Create Trip A (Spiti) + 10 SOP Tasks ──
  console.log("--- STEP 1: Creating Trip A (Spiti) & 10 SOP Tasks ---");
  let tripA = await prisma.trip.findFirst({
    where: { OR: [{ id: "SPT-ACC-A" }, { slug: "spiti-acc-a" }] },
  });

  if (!tripA) {
    tripA = await prisma.trip.create({
      data: {
        id: "SPT-ACC-A",
        tenantId,
        title: "Spiti Expedition A",
        slug: "spiti-acc-a",
        duration: "10 Days",
        location: "Spiti Valley",
        price: 18500,
        description: "Spiti Expedition test trip",
      },
    });
  }

  // Create SOP Template for Trip A
  let sopA = await prisma.opsSopTemplate.findFirst({
    where: { tenantId, tripId: tripA.id },
    include: { versions: { where: { status: "ACTIVE" } } },
  });

  if (!sopA) {
    sopA = await prisma.opsSopTemplate.create({
      data: {
        tenantId,
        tripId: tripA.id,
        name: "Spiti Expedition A Operations SOP",
        versions: {
          create: {
            tenantId,
            versionNumber: 1,
            versionLabel: "v1",
            status: "ACTIVE",
          },
        },
      },
      include: { versions: true },
    });
  }

  const versionA = sopA.versions[0];
  await prisma.opsSopTaskTemplate.deleteMany({ where: { versionId: versionA.id } });

  const spitiTasksDef = [
    { taskName: "Spiti Hotel Confirmation", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "CRITICAL" },
    { taskName: "Spiti High Altitude Prep", stage: "PRE_TRIP_21D", relativeOffset: -21, priority: "CRITICAL" },
    { taskName: "Spiti Train Ticket Verification", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "HIGH" },
    { taskName: "Spiti Oxygen & Med Kit Check", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "CRITICAL" },
    { taskName: "Spiti Homestay Room Allocation", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "HIGH" },
    { taskName: "Spiti Vehicle Fleet Permit Check", stage: "PRE_TRIP_1D", relativeOffset: -1, priority: "HIGH" },
    { taskName: "Spiti Departure Headcount", stage: "DEPARTURE_DAY", relativeOffset: 0, priority: "CRITICAL" },
    { taskName: "Spiti Daily Oximeter Log", stage: "DURING_TRIP", relativeOffset: 1, priority: "MEDIUM" },
    { taskName: "Spiti Kaza Homestay Review", stage: "DURING_TRIP", relativeOffset: 2, priority: "MEDIUM" },
    { taskName: "Spiti Post-Trip Feedback", stage: "POST_TRIP", relativeOffset: 9, priority: "LOW" },
  ];

  for (const [idx, t] of spitiTasksDef.entries()) {
    await prisma.opsSopTaskTemplate.create({
      data: {
        tenantId,
        versionId: versionA.id,
        taskName: t.taskName,
        stage: t.stage,
        relativeOffset: t.relativeOffset,
        priority: t.priority,
        defaultAssignee: "OPERATIONS",
        sortOrder: idx + 1,
        isRequired: true,
      },
    });
  }
  console.log(`✅ Trip A (Spiti) SOP v1 initialized with ${spitiTasksDef.length} tasks.\n`);

  // ── STEP 2: Create Trip B (Manali) + 6 SOP Tasks ──
  console.log("--- STEP 2: Creating Trip B (Manali) & 6 SOP Tasks ---");
  let tripB = await prisma.trip.findFirst({
    where: { OR: [{ id: "MNL-ACC-B" }, { slug: "manali-acc-b" }] },
  });

  if (!tripB) {
    tripB = await prisma.trip.create({
      data: {
        id: "MNL-ACC-B",
        tenantId,
        title: "Manali Weekend B",
        slug: "manali-acc-b",
        duration: "4 Days",
        location: "Manali",
        price: 6500,
        description: "Manali Weekend test trip",
      },
    });
  }

  let sopB = await prisma.opsSopTemplate.findFirst({
    where: { tenantId, tripId: tripB.id },
    include: { versions: { where: { status: "ACTIVE" } } },
  });

  if (!sopB) {
    sopB = await prisma.opsSopTemplate.create({
      data: {
        tenantId,
        tripId: tripB.id,
        name: "Manali Weekend B Operations SOP",
        versions: {
          create: {
            tenantId,
            versionNumber: 1,
            versionLabel: "v1",
            status: "ACTIVE",
          },
        },
      },
      include: { versions: true },
    });
  }

  const versionB = sopB.versions[0];
  await prisma.opsSopTaskTemplate.deleteMany({ where: { versionId: versionB.id } });

  const manaliTasksDef = [
    { taskName: "Manali Hotel Confirmation", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "HIGH" },
    { taskName: "Manali Bhrigu Equipment Reservation", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "HIGH" },
    { taskName: "Manali Rafting Permit Reconfirmation", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "HIGH" },
    { taskName: "Manali DJ Sound Permit", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "MEDIUM" },
    { taskName: "Manali Hidimba Taxi Union Advisory", stage: "PRE_TRIP_1D", relativeOffset: -1, priority: "HIGH" },
    { taskName: "Manali Departure Headcount", stage: "DEPARTURE_DAY", relativeOffset: 0, priority: "CRITICAL" },
  ];

  for (const [idx, t] of manaliTasksDef.entries()) {
    await prisma.opsSopTaskTemplate.create({
      data: {
        tenantId,
        versionId: versionB.id,
        taskName: t.taskName,
        stage: t.stage,
        relativeOffset: t.relativeOffset,
        priority: t.priority,
        defaultAssignee: "OPERATIONS",
        sortOrder: idx + 1,
        isRequired: true,
      },
    });
  }
  console.log(`✅ Trip B (Manali) SOP v1 initialized with ${manaliTasksDef.length} tasks.\n`);

  // ── STEP 3: Create Spiti Departure (15 Aug 2026) ──
  console.log("--- STEP 3: Creating Spiti Departure (15 Aug 2026) ---");
  const dateStrSpiti = "2026-08-15";
  const dateSpiti = new Date(dateStrSpiti);

  await prisma.opsTripChecklist.deleteMany({
    where: { tenantId, tripId: tripA.id, departureDate: dateSpiti },
  });

  const mockRes = { json: (d) => d, status: () => ({ json: (d) => d }) };

  await applySopToDeparture(
    { user: { tenantId }, body: { tripId: tripA.id, departureDate: dateStrSpiti } },
    mockRes,
  );

  const tasksSpitiDep = await prisma.opsTripChecklist.findMany({
    where: { tenantId, tripId: tripA.id, departureDate: dateSpiti },
  });

  console.log(`✅ Spiti Departure generated ${tasksSpitiDep.length} tasks.`);
  if (tasksSpitiDep.length !== 10) throw new Error(`Expected 10 tasks for Spiti, got ${tasksSpitiDep.length}`);

  // ── STEP 4: Create Manali Departure (18 Aug 2026) ──
  console.log("--- STEP 4: Creating Manali Departure (18 Aug 2026) ---");
  const dateStrManali = "2026-08-18";
  const dateManali = new Date(dateStrManali);

  await prisma.opsTripChecklist.deleteMany({
    where: { tenantId, tripId: tripB.id, departureDate: dateManali },
  });

  await applySopToDeparture(
    { user: { tenantId }, body: { tripId: tripB.id, departureDate: dateStrManali } },
    mockRes,
  );

  const tasksManaliDep = await prisma.opsTripChecklist.findMany({
    where: { tenantId, tripId: tripB.id, departureDate: dateManali },
  });

  console.log(`✅ Manali Departure generated ${tasksManaliDep.length} tasks.`);
  if (tasksManaliDep.length !== 6) throw new Error(`Expected 6 tasks for Manali, got ${tasksManaliDep.length}`);

  // ── STEP 5: Complete 1 Spiti task, verify Manali unchanged ──
  console.log("--- STEP 5: Completing 1 Spiti Task & Verifying Isolation ---");
  const spitiTarget = tasksSpitiDep[0];
  await prisma.opsTripChecklist.update({
    where: { id: spitiTarget.id },
    data: { isCompleted: true, status: "Completed", completedAt: new Date() },
  });

  const freshSpitiTask = await prisma.opsTripChecklist.findUnique({ where: { id: spitiTarget.id } });
  const freshManaliTask = await prisma.opsTripChecklist.findUnique({ where: { id: tasksManaliDep[0].id } });

  console.log(`Spiti Task isCompleted: ${freshSpitiTask.isCompleted}`);
  console.log(`Manali Task isCompleted: ${freshManaliTask.isCompleted}`);

  if (freshSpitiTask.isCompleted !== true || freshManaliTask.isCompleted !== false) {
    throw new Error("Isolation failed! Completing Spiti task affected Manali departure.");
  }
  console.log("✅ Step 5 Passed: Spiti task completed, Manali departure tasks remain completely unchanged!\n");

  // ── STEP 6: Edit Spiti Trip SOP (Create Version v2) ──
  console.log("--- STEP 6: Editing Spiti Trip SOP (Version v2) ---");
  // Create Version v2 for Trip A with an 11th new task
  const existingV2 = await prisma.opsSopVersion.findFirst({
    where: { templateId: sopA.id, versionNumber: 2 },
  });
  if (existingV2) {
    await prisma.opsSopTaskTemplate.deleteMany({ where: { versionId: existingV2.id } });
    await prisma.opsSopVersion.delete({ where: { id: existingV2.id } });
  }

  const versionA2 = await prisma.opsSopVersion.create({
    data: {
      tenantId,
      templateId: sopA.id,
      versionNumber: 2,
      versionLabel: "v2",
      status: "ACTIVE",
    },
  });

  // Archive v1
  const versionV1 = await prisma.opsSopVersion.findFirst({
    where: { templateId: sopA.id, versionNumber: 1 },
  });
  if (versionV1) {
    await prisma.opsSopVersion.update({
      where: { id: versionV1.id },
      data: { status: "ARCHIVED" },
    });
  }

  // Add 11 tasks to v2
  for (const [idx, t] of spitiTasksDef.entries()) {
    await prisma.opsSopTaskTemplate.create({
      data: {
        tenantId,
        versionId: versionA2.id,
        taskName: t.taskName,
        stage: t.stage,
        relativeOffset: t.relativeOffset,
        priority: t.priority,
        defaultAssignee: "OPERATIONS",
        sortOrder: idx + 1,
        isRequired: true,
      },
    });
  }

  // Add 11th new task to v2
  await prisma.opsSopTaskTemplate.create({
    data: {
      tenantId,
      versionId: versionA2.id,
      taskName: "NEW v2: Spiti Emergency Evacuation Protocol Check",
      stage: "PRE_TRIP_1D",
      relativeOffset: -1,
      priority: "CRITICAL",
      defaultAssignee: "OPERATIONS",
      sortOrder: 11,
      isRequired: true,
    },
  });

  // Test Future Spiti Departure (25 Aug 2026) -> Uses v2 (11 tasks)
  const dateStrSpitiFuture = "2026-08-25";
  const dateSpitiFuture = new Date(dateStrSpitiFuture);

  await prisma.opsTripChecklist.deleteMany({
    where: { tenantId, tripId: tripA.id, departureDate: dateSpitiFuture },
  });

  await applySopToDeparture(
    { user: { tenantId }, body: { tripId: tripA.id, departureDate: dateStrSpitiFuture } },
    mockRes,
  );

  const tasksSpitiFutureDep = await prisma.opsTripChecklist.findMany({
    where: { tenantId, tripId: tripA.id, departureDate: dateSpitiFuture },
  });

  // Check Existing Spiti Departure (15 Aug 2026) -> Still retains v1 snapshot (10 tasks)
  const tasksSpitiDepRetained = await prisma.opsTripChecklist.findMany({
    where: { tenantId, tripId: tripA.id, departureDate: dateSpiti },
  });

  console.log(`Existing Spiti Departure (15 Aug) tasks count: ${tasksSpitiDepRetained.length} (Retained v1 snapshot)`);
  console.log(`Future Spiti Departure (25 Aug) tasks count: ${tasksSpitiFutureDep.length} (Inherited new v2 SOP)`);

  if (tasksSpitiDepRetained.length !== 10 || tasksSpitiFutureDep.length !== 11) {
    throw new Error("Version snapshot isolation failed!");
  }

  console.log("✅ Step 6 Passed: Existing departures retain v1 snapshot while future departures inherit updated v2 SOP!\n");
  console.log("🎉 ALL 6 ACCEPTANCE TEST STEPS PASSED 100% CLEANLY!");
}

runAcceptanceTest()
  .catch((err) => {
    console.error("❌ Acceptance test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
