import { db } from "./index";
import { usersTable, tripsTable, attendanceTable, payoutsTable, assignmentsTable, guideWorkDaysTable, guideDayReportsTable } from "./schema";

async function main() {
  console.log("Seeding database...");

  // Delete all existing data
  await db.delete(guideDayReportsTable);
  await db.delete(guideWorkDaysTable);
  await db.delete(payoutsTable);
  await db.delete(assignmentsTable);
  await db.delete(attendanceTable);
  await db.delete(tripsTable);
  await db.delete(usersTable);

  console.log("Cleared old records.");

  // 1. Seed Users
  const [adminUser] = await db
    .insert(usersTable)
    .values({
      name: "Admin User",
      phone: "9999999999",
      role: "admin",
      dailyRate: 0,
    })
    .returning();

  const [rahul] = await db
    .insert(usersTable)
    .values({
      name: "Rahul Sharma",
      phone: "9876543210",
      role: "guide",
      dailyRate: 1500,
    })
    .returning();

  const [priya] = await db
    .insert(usersTable)
    .values({
      name: "Priya Patel",
      phone: "9123456789",
      role: "guide",
      dailyRate: 1500,
    })
    .returning();

  const [amit] = await db
    .insert(usersTable)
    .values({
      name: "Amit Kumar",
      phone: "9000000001",
      role: "guide",
      dailyRate: 1500,
    })
    .returning();

  console.log("Seeded users.");

  // 2. Seed Trips
  const now = new Date();
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const fiveDaysHence = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  const [trip1] = await db
    .insert(tripsTable)
    .values({
      name: "Himalayan Adventure Trek",
      location: "Manali, HP",
      startDate: tenDaysAgo,
      endDate: fiveDaysHence,
      leadGuideId: rahul.id,
      status: "active",
      allowedLatitude: 32.2396,
      allowedLongitude: 77.1887,
      allowedRadius: 3000,
    })
    .returning();

  const [trip2] = await db
    .insert(tripsTable)
    .values({
      name: "Rajasthan Desert Expedition",
      location: "Jaisalmer, RJ",
      startDate: oneMonthAgo,
      endDate: fifteenDaysAgo,
      leadGuideId: priya.id,
      status: "completed",
      allowedLatitude: 26.9157,
      allowedLongitude: 70.9083,
      allowedRadius: 3000,
    })
    .returning();

  const [trip3] = await db
    .insert(tripsTable)
    .values({
      name: "Goa Coastal Exploration",
      location: "Goa",
      startDate: tenDaysAgo,
      endDate: fiveDaysHence,
      leadGuideId: amit.id,
      status: "active",
      allowedLatitude: 15.3900,
      allowedLongitude: 74.0080,
      allowedRadius: 3000,
    })
    .returning();

  console.log("Seeded trips.");

  // 3. Seed Attendance Records
  const formatLocalDate = (d: Date) => d.toISOString().split("T")[0];

  // Seed 5 attendance records for Rahul:
  // - 4 approved days in the past
  // - 1 check-in today (pending check-out)
  for (let i = 5; i > 1; i--) {
    const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const checkIn = new Date(logDate);
    checkIn.setHours(8, 30, 0, 0);
    const checkOut = new Date(logDate);
    checkOut.setHours(17, 30, 0, 0);

    await db.insert(attendanceTable).values({
      guideId: rahul.id,
      tripId: trip1.id,
      date: formatLocalDate(logDate),
      checkInTime: checkIn,
      checkInLatitude: 32.2396,
      checkInLongitude: 77.1887,
      checkInLocationName: "Manali Base Camp",
      checkInSelfieUrl: "/uploads/selfie_sample.jpg",
      checkInDistance: 150,
      checkOutTime: checkOut,
      checkOutLatitude: 32.2396,
      checkOutLongitude: 77.1887,
      checkOutLocationName: "Manali Base Camp",
      checkOutSelfieUrl: "/uploads/selfie_sample.jpg",
      checkOutDistance: 200,
      notes: `Day ${5 - i + 1} completed successfully. Route clear.`,
      status: "approved",
      verifiedAt: now,
      verifiedBy: adminUser.id,
    });
  }

  // Seed a check-in for today (no check-out yet) -> status should be incomplete
  const todayCheckIn = new Date(now);
  todayCheckIn.setHours(8, 15, 0, 0);
  await db.insert(attendanceTable).values({
    guideId: rahul.id,
    tripId: trip1.id,
    date: formatLocalDate(now),
    checkInTime: todayCheckIn,
    checkInLatitude: 32.2410,
    checkInLongitude: 77.1895,
    checkInLocationName: "Manali Base Camp Entrance",
    checkInSelfieUrl: "/uploads/selfie_today.jpg",
    checkInDistance: 320,
    status: "incomplete",
  });

  // Seed a few records for Priya on Rajasthan Desert Trek
  for (let i = 25; i > 20; i--) {
    const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const checkIn = new Date(logDate);
    checkIn.setHours(9, 0, 0, 0);
    const checkOut = new Date(logDate);
    checkOut.setHours(18, 0, 0, 0);

    await db.insert(attendanceTable).values({
      guideId: priya.id,
      tripId: trip2.id,
      date: formatLocalDate(logDate),
      checkInTime: checkIn,
      checkInLatitude: 26.9157,
      checkInLongitude: 70.9083,
      checkInLocationName: "Sam Sand Dunes Jaisalmer",
      checkInSelfieUrl: "/uploads/selfie_sample.jpg",
      checkInDistance: 120,
      checkOutTime: checkOut,
      checkOutLatitude: 26.9157,
      checkOutLongitude: 70.9083,
      checkOutLocationName: "Sam Sand Dunes Jaisalmer",
      checkOutSelfieUrl: "/uploads/selfie_sample.jpg",
      checkOutDistance: 180,
      notes: "Desert patrol completed.",
      status: "approved",
      verifiedAt: now,
      verifiedBy: adminUser.id,
    });
  }

  // Seed attendance records for Amit Kumar:
  // - 1 rejected record (GPS mismatch) -> status should be location_mismatch
  // - 1 pending record for yesterday
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const amitCheckIn1 = new Date(twoDaysAgo);
  amitCheckIn1.setHours(8, 0, 0, 0);
  const amitCheckOut1 = new Date(twoDaysAgo);
  amitCheckOut1.setHours(17, 0, 0, 0);
  await db.insert(attendanceTable).values({
    guideId: amit.id,
    tripId: trip3.id,
    date: formatLocalDate(twoDaysAgo),
    checkInTime: amitCheckIn1,
    checkInLatitude: 20.0000, // Invalid GPS / far from Goa (Goa is approx 15.3, 74.1)
    checkInLongitude: 70.0000,
    checkInLocationName: "Unknown Location",
    checkInSelfieUrl: "/uploads/selfie_sample.jpg",
    checkInDistance: 450000,
    checkOutTime: amitCheckOut1,
    checkOutLatitude: 20.0000,
    checkOutLongitude: 70.0000,
    checkOutLocationName: "Unknown Location",
    checkOutSelfieUrl: "/uploads/selfie_sample.jpg",
    checkOutDistance: 450000,
    notes: "Tried checking in but GPS was failing.",
    status: "location_mismatch",
    verifiedAt: now,
    verifiedBy: adminUser.id,
  });

  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const amitCheckIn2 = new Date(yesterday);
  amitCheckIn2.setHours(9, 15, 0, 0);
  const amitCheckOut2 = new Date(yesterday);
  amitCheckOut2.setHours(18, 15, 0, 0);
  await db.insert(attendanceTable).values({
    guideId: amit.id,
    tripId: trip3.id,
    date: formatLocalDate(yesterday),
    checkInTime: amitCheckIn2,
    checkInLatitude: 15.3900,
    checkInLongitude: 74.0080,
    checkInLocationName: "Goa Beach Camp",
    checkInSelfieUrl: "/uploads/selfie_sample.jpg",
    checkInDistance: 120,
    checkOutTime: amitCheckOut2,
    checkOutLatitude: 15.3900,
    checkOutLongitude: 74.0080,
    checkOutLocationName: "Goa Beach Camp",
    checkOutSelfieUrl: "/uploads/selfie_sample.jpg",
    checkOutDistance: 80,
    notes: "Yesterday was coastal survey.",
    status: "pending",
  });

  console.log("Seeded attendance records.");

  // 4. Seed Assignments
  const [rahulAssignment] = await db
    .insert(assignmentsTable)
    .values({
      guideId: rahul.id,
      tripId: trip1.id,
      departureDate: formatLocalDate(tenDaysAgo),
      role: "guide",
      perDayAmount: 1500,
      allowedLatitude: 32.2396,
      allowedLongitude: 77.1887,
      allowedRadius: 3000,
    })
    .returning();

  console.log("Seeded assignment.");

  // 5. Seed Guide Work Days
  const day1Date = new Date(tenDaysAgo);
  const day2Date = new Date(tenDaysAgo.getTime() + 1 * 24 * 60 * 60 * 1000);
  const todayDate = new Date(now);

  await db.insert(guideWorkDaysTable).values([
    {
      assignmentId: rahulAssignment.id,
      tripId: trip1.id,
      guideId: rahul.id,
      dayNumber: 1,
      date: formatLocalDate(day1Date),
      location: "Manali Base Camp",
      journeyTitle: "Group Assembly & Camp Setup",
      dutyInstructions: "Reach base camp 1 hour early; check in travelers; set up tents; verify supplies.",
      reportingRequirement: "Assembly photo and tent layout status.",
      expectedCheckinLatitude: 32.2396,
      expectedCheckinLongitude: 77.1887,
      expectedCheckoutLatitude: 32.2396,
      expectedCheckoutLongitude: 77.1887,
      requiredPhotosCount: 1,
      status: "completed",
    },
    {
      assignmentId: rahulAssignment.id,
      tripId: trip1.id,
      guideId: rahul.id,
      dayNumber: 2,
      date: formatLocalDate(day2Date),
      location: "Solang Valley Trek",
      journeyTitle: "Acclimatization Walk & Briefing",
      dutyInstructions: "Lead group on 5km acclimatization trek; briefing on safety; distribute winter gear.",
      reportingRequirement: "Acclimatization trail photo.",
      expectedCheckinLatitude: 32.3167,
      expectedCheckinLongitude: 77.1750,
      expectedCheckoutLatitude: 32.3167,
      expectedCheckoutLongitude: 77.1750,
      requiredPhotosCount: 1,
      status: "completed",
    },
    {
      assignmentId: rahulAssignment.id,
      tripId: trip1.id,
      guideId: rahul.id,
      dayNumber: 10,
      date: formatLocalDate(todayDate),
      location: "Rohtang Pass Viewpoint",
      journeyTitle: "Summit Trek & High-Altitude Photography",
      dutyInstructions: "Monitor group safety at altitude; guide traveler photography; coordinate boxed lunch distribution; report team count.",
      reportingRequirement: "Rohtang Pass summit photo and lunch verification.",
      expectedCheckinLatitude: 32.3716,
      expectedCheckinLongitude: 77.2464,
      expectedCheckoutLatitude: 32.3716,
      expectedCheckoutLongitude: 77.2464,
      requiredPhotosCount: 2,
      status: "pending",
    }
  ]);

  console.log("Seeded guide work days.");
  console.log("Database seeded successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
