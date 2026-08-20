const { prisma } = require("../lib/prisma");

const SPITI_TASKS = [
  // PRE-TRIP 30D (T-30)
  { taskName: "Train tickets reviewed & status verified", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "CRITICAL", defaultAssignee: "TICKETING", instructions: "Audit all PNRs. Never promise uncertain train confirmation to pax." },
  { taskName: "Never promise uncertain train confirmation to pax", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "HIGH", defaultAssignee: "SALES_EXEC", instructions: "Ensure sales team communicates waitlist rules clearly." },
  { taskName: "Hotel booking confirmed across all Spiti stops", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Confirm vouchers for Shimla, Chitkul, Tabo, Kaza, Chandratal, Manali." },
  { taskName: "Vehicle fleet & tempo traveller permits pre-booked", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "HIGH", defaultAssignee: "TRANSPORT_DESK", instructions: "Ensure hill driving permits & commercial RC are verified." },

  // PRE-TRIP 21D (T-21)
  { taskName: "Under-18 participants identified & list compiled", stage: "PRE_TRIP_21D", relativeOffset: -21, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Collect ID proofs & verify age for minor pax." },
  { taskName: "Guardian contact collected for under-18 participants", stage: "PRE_TRIP_21D", relativeOffset: -21, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Obtain emergency consent form signed by parents/guardians." },
  { taskName: "Solo travellers identified for engagement planning", stage: "PRE_TRIP_21D", relativeOffset: -21, priority: "MEDIUM", defaultAssignee: "SALES_EXEC", instructions: "Flag solo pax to lead guide for icebreaking & room pairing." },

  // PRE-TRIP 14D (T-14)
  { taskName: "Oxygen cylinder & emergency medical kit prepared", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "CRITICAL", defaultAssignee: "OPERATIONS", instructions: "Verify oxygen canisters, Diamox stock, pulse oximeters." },
  { taskName: "Emergency contacts & hospital directory compiled", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Kaza & Rampur hospital emergency contacts attached." },
  { taskName: "Paid room upgrade requests verified", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Cross-check double sharing vs 4-sharing upgrade payments." },

  // PRE-TRIP 7D (T-7)
  { taskName: "High-altitude advisory & medical disclosure sent to pax", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "CRITICAL", defaultAssignee: "OPERATIONS", instructions: "Send AMS advisory & hydration guidelines via WhatsApp." },
  { taskName: "4-sharing room arrangement & floor mattress policy communicated", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "HIGH", defaultAssignee: "SALES_EXEC", instructions: "Set expectations regarding Homestay accommodations in Kaza." },
  { taskName: "Hotel toiletries & towel availability disclosure sent", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Remind pax to carry personal towels & warm toiletries." },
  { taskName: "Luggage weight & soft bag responsibility communicated", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Advise pax to carry rucksacks instead of heavy hard suitcases." },

  // PRE-TRIP 3D (T-3)
  { taskName: "Room allocation list prepared & shared with hotels", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "CRITICAL", defaultAssignee: "OPERATIONS", instructions: "Finalize gender-wise 4-sharing room distribution." },
  { taskName: "Guide confirmed & detailed itinerary briefing completed", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Brief lead guide on high-altitude medical protocol & route." },
  { taskName: "Solo traveller engagement briefing given to lead guide", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Instruct guide to include solo travellers in daily seat rotation." },
  { taskName: "Minor participant list & guardian numbers shared with guide", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Provide emergency contact sheet to lead tour guide." },
  { taskName: "Seat rotation instruction confirmed with driver & guide", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Enforce daily Tempo Traveller seat rotation policy." },

  // PRE-TRIP 1D (T-1)
  { taskName: "Hotel reconfirmed for Day 1 & Day 2", stage: "PRE_TRIP_1D", relativeOffset: -1, priority: "CRITICAL", defaultAssignee: "OPERATIONS", instructions: "Call hotel reception for check-in timing & dinner prep." },
  { taskName: "Vehicle reconfirmed & driver contact added to ops list", stage: "PRE_TRIP_1D", relativeOffset: -1, priority: "HIGH", defaultAssignee: "TRANSPORT_DESK", instructions: "Confirm vehicle arrival at reporting station." },
  { taskName: "Guide phone number & WhatsApp link sent to pax", stage: "PRE_TRIP_1D", relativeOffset: -1, priority: "HIGH", defaultAssignee: "SALES_EXEC", instructions: "Broadcast lead guide contact details to passenger group." },

  // DEPARTURE DAY (T0)
  { taskName: "Passenger headcount completed at reporting point", stage: "DEPARTURE_DAY", relativeOffset: 0, priority: "CRITICAL", defaultAssignee: "LEAD_GUIDE", instructions: "Verify all pax presence against final manifest." },
  { taskName: "Identity documents & permits checked", stage: "DEPARTURE_DAY", relativeOffset: 0, priority: "HIGH", defaultAssignee: "LEAD_GUIDE", instructions: "Verify Aadhaar / Passport copies for Inner Line Permits." },
  { taskName: "Group introduction & icebreaking activity conducted", stage: "DEPARTURE_DAY", relativeOffset: 0, priority: "MEDIUM", defaultAssignee: "LEAD_GUIDE", instructions: "Introduce guide, driver, and conduct group orientation." },
  { taskName: "Minor participant handover to lead guide logged", stage: "DEPARTURE_DAY", relativeOffset: 0, priority: "HIGH", defaultAssignee: "LEAD_GUIDE", instructions: "Log guardian contact confirmation for under-18 pax." },

  // DURING TRIP (T+1 to T+8)
  { taskName: "Daily passenger health & oxygen level check", stage: "DURING_TRIP", relativeOffset: 1, priority: "CRITICAL", defaultAssignee: "LEAD_GUIDE", instructions: "Record pulse oximeter readings at Kaza (12,000 ft)." },
  { taskName: "Hotel room allocation & hot water check at Kaza", stage: "DURING_TRIP", relativeOffset: 4, priority: "HIGH", defaultAssignee: "LEAD_GUIDE", instructions: "Ensure solar water heaters & blankets are functional." },
  { taskName: "Seat rotation policy enforcement check", stage: "DURING_TRIP", relativeOffset: 3, priority: "MEDIUM", defaultAssignee: "LEAD_GUIDE", instructions: "Rotate front and back seats in Tempo Traveller." },
  { taskName: "Food quality & hygiene check at homestays", stage: "DURING_TRIP", relativeOffset: 5, priority: "MEDIUM", defaultAssignee: "LEAD_GUIDE", instructions: "Inspect meal freshness and drinking water supply." },

  // POST TRIP (T+9 to T+10)
  { taskName: "Post-trip passenger feedback calls initiated", stage: "POST_TRIP", relativeOffset: 9, priority: "HIGH", defaultAssignee: "SALES_EXEC", instructions: "Collect Google reviews & trip ratings." },
  { taskName: "Guide performance & hotel vendor debrief", stage: "POST_TRIP", relativeOffset: 10, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Review incident logs and vendor service quality." },
];

const MANALI_TASKS = [
  // PRE-TRIP 30D (T-30)
  { taskName: "Hotel booking confirmed in Manali, Kasol & Amritsar", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Confirm room inventory & meal inclusions." },
  { taskName: "Transport tempo traveller fleet confirmed", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "HIGH", defaultAssignee: "TRANSPORT_DESK", instructions: "Verify 17-seater / 26-seater pushback vehicles." },

  // PRE-TRIP 14D (T-14)
  { taskName: "Bhrigu Lake trek rental items confirmed", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Reserve trek boots, jackets, and trekking poles." },
  { taskName: "Bhrigu trek timing & weather advisory reviewed", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Check forest department permit status." },
  { taskName: "Bike rental vendor location & rates confirmed", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Pre-book Himalayan 411 bikes for Solang valley drive." },
  { taskName: "Kullu river rafting status & closure refund policy checked", stage: "PRE_TRIP_14D", relativeOffset: -14, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Verify water level guidelines issued by local authority." },

  // PRE-TRIP 7D (T-7)
  { taskName: "Hidimba temple vehicle restriction & local cab union checked", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "HIGH", defaultAssignee: "TRANSPORT_DESK", instructions: "Arrange green tax & local union Auto/Alto for Mall Road." },
  { taskName: "DJ / Sound speaker arrangement confirmed for Kasol camp", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Confirm music permits & silence deadline (10 PM)." },
  { taskName: "No-alcohol policy in tempo traveller briefed to pax", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "HIGH", defaultAssignee: "SALES_EXEC", instructions: "Send vehicle discipline advisory in WhatsApp group." },

  // PRE-TRIP 3D (T-3)
  { taskName: "Driver briefing on route, speed limits & food stops", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "CRITICAL", defaultAssignee: "OPERATIONS", instructions: "Brief driver on Himachal highway check-posts & timing." },
  { taskName: "Campfire & DJ night confirmation with Kasol campsite", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Verify wood supply and bonfire arrangements." },

  // PRE-TRIP 1D (T-1)
  { taskName: "Tempo pickup points & driver contact shared with pax", stage: "PRE_TRIP_1D", relativeOffset: -1, priority: "HIGH", defaultAssignee: "SALES_EXEC", instructions: "Broadcast pickup schedule for Delhi/Chandigarh." },

  // DEPARTURE DAY (T0)
  { taskName: "Headcount & luggage tagging at pickup point", stage: "DEPARTURE_DAY", relativeOffset: 0, priority: "CRITICAL", defaultAssignee: "LEAD_GUIDE", instructions: "Verify pax count before starting night journey." },

  // DURING TRIP
  { taskName: "Tempo break monitoring & driver route adherence", stage: "DURING_TRIP", relativeOffset: 1, priority: "HIGH", defaultAssignee: "LEAD_GUIDE", instructions: "Ensure 15-minute rest breaks every 3 hours." },
  { taskName: "Solang Valley adventure activity timing & voucher check", stage: "DURING_TRIP", relativeOffset: 4, priority: "HIGH", defaultAssignee: "LEAD_GUIDE", instructions: "Coordinate paragliding & ropeway queues." },

  // POST TRIP
  { taskName: "Driver & hotel vendor feedback survey", stage: "POST_TRIP", relativeOffset: 9, priority: "MEDIUM", defaultAssignee: "OPERATIONS", instructions: "Collect customer satisfaction feedback." },
];

const KERALA_TASKS = [
  { taskName: "Alleppey houseboat private booking confirmed", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "CRITICAL", defaultAssignee: "OPERATIONS", instructions: "Verify AC operational timing (9 PM to 6 AM) & meal menu." },
  { taskName: "Ernakulam Junction train station handover protocol ready", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Coordinate taxi driver holding YouthCamping placarding." },
  { taskName: "Munnar tea plantation & Mattupetty dam permits verified", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "MEDIUM", defaultAssignee: "LEAD_GUIDE", instructions: "Check opening hours and entry tickets." },
  { taskName: "Thekkady spice plantation tour & Kathakali show pre-booked", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Confirm seat reservation for cultural performance." },
];

const KASHMIR_TASKS = [
  { taskName: "Gulmarg Gondola Phase 1 & Phase 2 tickets pre-booked", stage: "PRE_TRIP_30D", relativeOffset: -30, priority: "CRITICAL", defaultAssignee: "OPERATIONS", instructions: "Book official JK Cable Car tickets online in advance." },
  { taskName: "Pahalgam local union cab policy briefed to pax", stage: "PRE_TRIP_7D", relativeOffset: -7, priority: "HIGH", defaultAssignee: "SALES_EXEC", instructions: "Explain local cab requirement for Aru & Betaab valley." },
  { taskName: "Srinagar Dal Lake Shikara ride & houseboat check-in confirmed", stage: "PRE_TRIP_3D", relativeOffset: -3, priority: "HIGH", defaultAssignee: "OPERATIONS", instructions: "Verify houseboat heating / electric blankets." },
];

async function seedSops() {
  console.log("🌱 Starting Real Trip SOP Seeder...");
  const tenantId = "default";

  // Fetch all trips in database
  const trips = await prisma.trip.findMany();
  console.log(`Found ${trips.length} trips in database.`);

  for (const trip of trips) {
    const tid = trip.id.toLowerCase();
    const title = trip.title.toLowerCase();

    let taskList = [];
    let sopName = `${trip.title} Master SOP`;

    if (tid.includes("spt") || title.includes("spiti")) {
      taskList = SPITI_TASKS;
      sopName = "Spiti Valley Road Trip SOP";
    } else if (tid.includes("mka") || title.includes("manali") || title.includes("kasol")) {
      taskList = MANALI_TASKS;
      sopName = "Manali Kasol Kullu Adventure SOP";
    } else if (tid.includes("ker") || tid.includes("krl") || title.includes("kerala")) {
      taskList = KERALA_TASKS;
      sopName = "Kerala Backwaters & Tea Gardens SOP";
    } else if (tid.includes("ksh") || title.includes("kashmir")) {
      taskList = KASHMIR_TASKS;
      sopName = "Kashmir Paradise Road Trip SOP";
    } else {
      taskList = MANALI_TASKS; // Default fallback template
    }

    // Upsert Master SOP Template
    let template = await prisma.opsSopTemplate.findFirst({
      where: { tenantId, tripId: trip.id },
    });

    if (!template) {
      template = await prisma.opsSopTemplate.create({
        data: {
          tenantId,
          tripId: trip.id,
          name: sopName,
          description: `Standard Operating Procedure for ${trip.title}`,
        },
      });
    }

    // Upsert Active Version 1
    let version = await prisma.opsSopVersion.findFirst({
      where: { templateId: template.id, versionNumber: 1 },
    });

    if (!version) {
      version = await prisma.opsSopVersion.create({
        data: {
          tenantId,
          templateId: template.id,
          versionNumber: 1,
          versionLabel: "v1",
          status: "ACTIVE",
          activatedAt: new Date(),
        },
      });
    }

    if (template.activeVersionId !== version.id) {
      await prisma.opsSopTemplate.update({
        where: { id: template.id },
        data: { activeVersionId: version.id },
      });
    }

    // Populate Task Templates
    for (let i = 0; i < taskList.length; i++) {
      const taskDef = taskList[i];
      const existing = await prisma.opsSopTaskTemplate.findFirst({
        where: {
          tenantId,
          versionId: version.id,
          taskName: taskDef.taskName,
        },
      });

      if (!existing) {
        await prisma.opsSopTaskTemplate.create({
          data: {
            tenantId,
            versionId: version.id,
            taskName: taskDef.taskName,
            stage: taskDef.stage,
            relativeOffset: taskDef.relativeOffset,
            priority: taskDef.priority,
            isRequired: true,
            defaultAssignee: taskDef.defaultAssignee,
            instructions: taskDef.instructions,
            sortOrder: i + 1,
            active: true,
          },
        });
      }
    }

    console.log(`✅ Seeded ${taskList.length} SOP tasks for "${trip.title}" (${sopName})`);
  }

  console.log("✨ Trip SOP Seeder finished successfully!");
}

seedSops()
  .catch((err) => {
    console.error("Seeder failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
