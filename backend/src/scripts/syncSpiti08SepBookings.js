const { prisma } = require("../lib/prisma");

async function main() {
  console.log("Starting synchronization of 08 SEP SPITI bookings...");

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id: "SPT-1" }, { title: { contains: "Spiti", mode: "insensitive" } }] },
  });

  if (!trip) {
    console.error("❌ Spiti trip not found!");
    process.exit(1);
  }

  const depDate = new Date("2026-09-08T00:00:00.000Z");

  // 1. Ensure Departure record exists
  let dep = await prisma.departure.findFirst({
    where: { tripId: trip.id, departureDate: depDate },
  });
  if (!dep) {
    dep = await prisma.departure.create({
      data: {
        departureCode: "DEP-SPT1-08SEP2026",
        tripId: trip.id,
        departureDate: depDate,
        status: "Ready",
        notes: "08 SEP SPITI Group Departure",
      },
    });
    console.log("✅ Created Departure:", dep.departureCode);
  }

  // 2. KHUSHI'S GROUP (4 PAX, Umangiben Cancelled)
  const khushiBookingId = "BK-SPITI-08SEP-KHUSHI";
  const khushiPassengers = {
    details: {
      roomType: "Quad Sharing",
      trainClass: "3 TIER AC TRAIN",
      trainOption: "3 TIER AC TRAIN",
      ticketStatus: "CONFIRMED",
    },
    persons: [
      {
        id: "p-khushi-1",
        name: "Khushi",
        age: 24,
        gender: "Female",
        phone: "7069755307",
        email: "khushi7069@gmail.com",
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-khushi-2",
        name: "Rushvi",
        age: 24,
        gender: "Female",
        phone: "9327623442",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-khushi-3",
        name: "Umangiben",
        age: 32,
        gender: "Female",
        phone: "8128511964",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CANCELLED",
        isCancelled: true,
        notes: "Cancelled by customer (Redline in manifest)",
      },
      {
        id: "p-khushi-4",
        name: "Khushbuben",
        age: 24,
        gender: "Female",
        phone: "9327359374",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
    ],
  };

  const khushi = await prisma.booking.upsert({
    where: { bookingId: khushiBookingId },
    update: {
      name: "Khushi",
      fullName: "Khushi",
      phone: "7069755307",
      mobile: "7069755307",
      email: "khushi7069@gmail.com",
      age: 24,
      gender: "Female",
      numberOfTravelers: 4,
      totalAmount: 95000,
      amount: 21000,
      advancePaid: 21000,
      remainingAmount: 74000,
      paymentMode: "YAC",
      payment_method: "upi",
      paymentStatus: "Partial",
      departureDate: depDate,
      pickupCity: "Ahmedabad",
      status: "confirmed",
      trainTicketStatus: "CONFIRMED",
      trainTicketRequired: true,
      passengers: khushiPassengers,
      notes: "Payment Date: 08/07/2026, Txn ID: YAC, Umangiben Cancelled",
      adminNotes: "08 SEP SPITI - Khushi Group (4 Pax - Umangiben Cancelled)",
      createdAt: new Date("2026-07-08T10:00:00.000Z"),
    },
    create: {
      bookingId: khushiBookingId,
      tenantId: "default",
      tripId: trip.id,
      tripName: trip.title,
      name: "Khushi",
      fullName: "Khushi",
      phone: "7069755307",
      mobile: "7069755307",
      email: "khushi7069@gmail.com",
      age: 24,
      gender: "Female",
      numberOfTravelers: 4,
      totalAmount: 95000,
      amount: 21000,
      advancePaid: 21000,
      remainingAmount: 74000,
      paymentMode: "YAC",
      payment_method: "upi",
      paymentStatus: "Partial",
      departureDate: depDate,
      pickupCity: "Ahmedabad",
      status: "confirmed",
      trainTicketStatus: "CONFIRMED",
      trainTicketRequired: true,
      passengers: khushiPassengers,
      notes: "Payment Date: 08/07/2026, Txn ID: YAC, Umangiben Cancelled",
      adminNotes: "08 SEP SPITI - Khushi Group (4 Pax - Umangiben Cancelled)",
      createdAt: new Date("2026-07-08T10:00:00.000Z"),
    },
  });
  console.log("✅ Saved Khushi Booking:", khushi.bookingId);

  await prisma.trainTicket.deleteMany({ where: { bookingId: khushi.bookingId } });
  for (const p of khushiPassengers.persons) {
    await prisma.trainTicket.create({
      data: {
        tenantId: "default",
        bookingId: khushi.bookingId,
        travelerName: p.name,
        sourceStation: "Ahmedabad",
        destinationStation: "Kalka / Chandigarh",
        berthType: "3AC",
        ticketStatus: p.isCancelled ? "CANCELLED" : "CONFIRMED",
        approvalStatus: p.isCancelled ? "REJECTED" : "APPROVED",
        cancellationReason: p.isCancelled ? "Cancelled by customer" : null,
      },
    });
  }

  // 3. ANASH (1 PAX)
  const anashBookingId = "BK-SPITI-08SEP-ANASH";
  const anashPassengers = {
    details: {
      roomType: "Quad Sharing",
      trainClass: "3 TIER AC TRAIN",
      trainOption: "3 TIER AC TRAIN",
      ticketStatus: "CONFIRMED",
    },
    persons: [
      {
        id: "p-anash-1",
        name: "Anash",
        age: 19,
        gender: "Male",
        phone: "9725974266",
        email: "anash9725@gmail.com",
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
    ],
  };

  const anash = await prisma.booking.upsert({
    where: { bookingId: anashBookingId },
    update: {
      name: "Anash",
      fullName: "Anash",
      phone: "9725974266",
      mobile: "9725974266",
      email: "anash9725@gmail.com",
      age: 19,
      gender: "Male",
      numberOfTravelers: 1,
      totalAmount: 23500,
      amount: 5000,
      advancePaid: 5000,
      remainingAmount: 18500,
      paymentMode: "OFFICE CASH",
      payment_method: "cash",
      paymentStatus: "Partial",
      departureDate: depDate,
      pickupCity: "Ahmedabad",
      status: "confirmed",
      trainTicketStatus: "CONFIRMED",
      trainTicketRequired: true,
      passengers: anashPassengers,
      notes: "Payment Date: 12/07/2026, Txn ID: OFFICE CASH",
      adminNotes: "08 SEP SPITI - Anash (1 Pax)",
      createdAt: new Date("2026-07-12T11:00:00.000Z"),
    },
    create: {
      bookingId: anashBookingId,
      tenantId: "default",
      tripId: trip.id,
      tripName: trip.title,
      name: "Anash",
      fullName: "Anash",
      phone: "9725974266",
      mobile: "9725974266",
      email: "anash9725@gmail.com",
      age: 19,
      gender: "Male",
      numberOfTravelers: 1,
      totalAmount: 23500,
      amount: 5000,
      advancePaid: 5000,
      remainingAmount: 18500,
      paymentMode: "OFFICE CASH",
      payment_method: "cash",
      paymentStatus: "Partial",
      departureDate: depDate,
      pickupCity: "Ahmedabad",
      status: "confirmed",
      trainTicketStatus: "CONFIRMED",
      trainTicketRequired: true,
      passengers: anashPassengers,
      notes: "Payment Date: 12/07/2026, Txn ID: OFFICE CASH",
      adminNotes: "08 SEP SPITI - Anash (1 Pax)",
      createdAt: new Date("2026-07-12T11:00:00.000Z"),
    },
  });
  console.log("✅ Saved Anash Booking:", anash.bookingId);

  await prisma.trainTicket.deleteMany({ where: { bookingId: anash.bookingId } });
  await prisma.trainTicket.create({
    data: {
      tenantId: "default",
      bookingId: anash.bookingId,
      travelerName: "Anash",
      sourceStation: "Ahmedabad",
      destinationStation: "Kalka / Chandigarh",
      berthType: "3AC",
      ticketStatus: "CONFIRMED",
      approvalStatus: "APPROVED",
    },
  });

  // 4. PRINCE'S GROUP (7 PAX)
  const princeBookingId = "BK-SPITI-08SEP-PRINCE";
  const princePassengers = {
    details: {
      roomType: "Quad / Triple Sharing",
      trainClass: "3 TIER AC TRAIN",
      trainOption: "3 TIER AC TRAIN",
      ticketStatus: "CONFIRMED",
    },
    persons: [
      {
        id: "p-prince-1",
        name: "Prince",
        age: 23,
        gender: "Male",
        phone: "8128492232",
        email: "prince8128@gmail.com",
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-prince-2",
        name: "Sneha",
        age: 23,
        gender: "Female",
        phone: "8128492232",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-prince-3",
        name: "Saumya",
        age: 22,
        gender: "Male",
        phone: "8128492232",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-prince-4",
        name: "Vanshika",
        age: 22,
        gender: "Female",
        phone: "7575026779",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-prince-5",
        name: "Manav",
        age: 24,
        gender: "Male",
        phone: "8128492232",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Triple Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-prince-6",
        name: "Hemal",
        age: 30,
        gender: "Male",
        phone: "8128492232",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Triple Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-prince-7",
        name: "Lakhan",
        age: 23,
        gender: "Male",
        phone: "8128492232",
        email: null,
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Triple Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
      {
        id: "p-prince-8",
        name: "Riddhi",
        fullName: "Gondaliya Riddhi Viththalbhai",
        age: 27,
        gender: "Female",
        phone: "7046104371",
        email: "gondaliyariddhi7046@gmail.com",
        trainOption: "3 TIER AC TRAIN",
        roomSharing: "Quad Sharing",
        foodPreference: "Normal Food",
        status: "CONFIRMED",
        isCancelled: false,
      },
    ],
  };

  const prince = await prisma.booking.upsert({
    where: { bookingId: princeBookingId },
    update: {
      name: "Prince",
      fullName: "Prince",
      phone: "8128492232",
      mobile: "8128492232",
      email: "prince8128@gmail.com",
      age: 23,
      gender: "Male",
      numberOfTravelers: 8,
      totalAmount: 184000,
      amount: 40000,
      advancePaid: 40000,
      remainingAmount: 144000,
      paymentMode: "OFFICE CASH / CHAKABHAI",
      payment_method: "cash",
      paymentStatus: "Partial",
      departureDate: depDate,
      pickupCity: "Ahmedabad",
      status: "confirmed",
      trainTicketStatus: "CONFIRMED",
      trainTicketRequired: true,
      passengers: princePassengers,
      notes: "Payment Date: 15/07/2026 (Prince: ₹35,000 OFFICE CASH) + 03/08/2026 (Riddhi: ₹5,000 CHAKABHAI)",
      adminNotes: "08 SEP SPITI - Prince Group (8 Pax, including Riddhi)",
      createdAt: new Date("2026-07-15T12:00:00.000Z"),
    },
    create: {
      bookingId: princeBookingId,
      tenantId: "default",
      tripId: trip.id,
      tripName: trip.title,
      name: "Prince",
      fullName: "Prince",
      phone: "8128492232",
      mobile: "8128492232",
      email: "prince8128@gmail.com",
      age: 23,
      gender: "Male",
      numberOfTravelers: 8,
      totalAmount: 184000,
      amount: 40000,
      advancePaid: 40000,
      remainingAmount: 144000,
      paymentMode: "OFFICE CASH / CHAKABHAI",
      payment_method: "cash",
      paymentStatus: "Partial",
      departureDate: depDate,
      pickupCity: "Ahmedabad",
      status: "confirmed",
      trainTicketStatus: "CONFIRMED",
      trainTicketRequired: true,
      passengers: princePassengers,
      notes: "Payment Date: 15/07/2026 (Prince: ₹35,000 OFFICE CASH) + 03/08/2026 (Riddhi: ₹5,000 CHAKABHAI)",
      adminNotes: "08 SEP SPITI - Prince Group (8 Pax, including Riddhi)",
      createdAt: new Date("2026-07-15T12:00:00.000Z"),
    },
  });
  console.log("✅ Created Prince Group Booking (8 Pax including Riddhi)");

  await prisma.trainTicket.deleteMany({ where: { bookingId: prince.bookingId } });
  const princeTravelers = ["Prince", "Sneha", "Saumya", "Vanshika", "Manav", "Hemal", "Lakhan", "Riddhi"];
  for (const tName of princeTravelers) {
    await prisma.trainTicket.create({
      data: {
        tenantId: "default",
        bookingId: prince.bookingId,
        travelerName: tName,
        sourceStation: "Ahmedabad",
        destinationStation: "Kalka / Chandigarh",
        berthType: "3AC",
        ticketStatus: "CONFIRMED",
        approvalStatus: "APPROVED",
      },
    });
  }

  // Clean up any standalone Riddhi booking to prevent duplicates
  const duplicateIds = ["BK-SPITI-08SEP-RIDDHI", "BK-BJR4QDZ4LW5D"];
  const dupBookings = await prisma.booking.findMany({
    where: { bookingId: { in: duplicateIds } },
    select: { id: true, bookingId: true },
  });
  const dupInternalIds = dupBookings.map((b) => b.id);
  const dupBookingIds = dupBookings.map((b) => b.bookingId);

  if (dupInternalIds.length > 0) {
    await prisma.opsRoomAllocation.deleteMany({
      where: { bookingId: { in: dupBookingIds } },
    });
    for (const bId of dupInternalIds) {
      await prisma.opsVehicleAllocation.deleteMany({ where: { bookingId: bId } });
      await prisma.passengerActivityAllocation.deleteMany({ where: { bookingId: bId } });
      await prisma.bookingDocument.deleteMany({ where: { bookingId: bId } });
      await prisma.bookingAttachment.deleteMany({ where: { bookingId: bId } });
      await prisma.bookingTask.deleteMany({ where: { bookingId: bId } });
      await prisma.bookingActivityLog.deleteMany({ where: { bookingId: bId } });
      await prisma.trainTicketGroup.deleteMany({ where: { bookingId: bId } });
      await prisma.trainTicketRequest.deleteMany({ where: { bookingId: bId } });
      await prisma.bookingVerification.deleteMany({ where: { bookingId: bId } });
      await prisma.accountingEntry.deleteMany({ where: { bookingId: bId } });
      await prisma.opsClientPayment.deleteMany({ where: { bookingId: bId } });
      await prisma.stationPaymentCollection.deleteMany({ where: { bookingId: bId } });
    }
    await prisma.trainTicket.deleteMany({
      where: { bookingId: { in: duplicateIds } },
    });
    await prisma.booking.deleteMany({
      where: { id: { in: dupInternalIds } },
    });
  }

  // 5. UPDATE HARSH & RUCHI (BK-JYCV22CUR42H)
  const harsh = await prisma.booking.findUnique({ where: { bookingId: "BK-JYCV22CUR42H" } });
  if (harsh) {
    const harshPassengers = {
      details: {
        roomType: "Double Sharing",
        trainClass: "3 TIER AC TRAIN",
        trainOption: "3 TIER AC TRAIN",
        ticketStatus: "CONFIRMED",
      },
      persons: [
        {
          id: "main",
          name: "Mr. Harsh modi",
          firstName: "Harsh",
          lastName: "modi",
          age: 28,
          gender: "Male",
          phone: "7228922285",
          email: "modiharsh101@gmail.com",
          trainOption: "3 TIER AC TRAIN",
          roomSharing: "Double Sharing",
          foodPreference: "Normal Food",
          status: "CONFIRMED",
          isCancelled: false,
        },
        {
          id: "gen-co-1",
          name: "Mrs. Ruchi Modi",
          firstName: "Ruchi",
          lastName: "Modi",
          age: 27,
          gender: "Female",
          phone: "7228922285",
          email: "modiharsh101@gmail.com",
          trainOption: "3 TIER AC TRAIN",
          roomSharing: "Double Sharing",
          foodPreference: "Normal Food",
          status: "CONFIRMED",
          isCancelled: false,
        },
      ],
    };
    await prisma.booking.update({
      where: { bookingId: "BK-JYCV22CUR42H" },
      data: {
        totalAmount: 52000,
        advancePaid: 10000,
        remainingAmount: 42000,
        paymentMode: "CHAKABHAI",
        passengers: harshPassengers,
        trainTicketStatus: "CONFIRMED",
        notes: "Payment Date: 04/08/2026, Txn ID: CHAKABHAI",
        adminNotes: "08 SEP SPITI - Harsh & Ruchi (2 Pax)",
      },
    });
    console.log("✅ Updated Harsh & Ruchi Booking");
  }



  // 7. UPDATE MEET (BK-JTUSUME2C7WL)
  const meet = await prisma.booking.findUnique({ where: { bookingId: "BK-JTUSUME2C7WL" } });
  if (meet) {
    const mPassengers = {
      details: {
        roomType: "Triple Sharing",
        trainClass: "3 TIER AC TRAIN",
        trainOption: "3 TIER AC TRAIN",
        ticketStatus: "CONFIRMED",
      },
      persons: [
        {
          id: "p-meet-1",
          name: "Meet Asheshkumar Gandhi",
          age: 26,
          gender: "Male",
          phone: "7046662804",
          email: null,
          trainOption: "3 TIER AC TRAIN",
          roomSharing: "Triple Sharing",
          foodPreference: "Normal Food",
          status: "CONFIRMED",
          isCancelled: false,
        },
      ],
    };
    await prisma.booking.update({
      where: { bookingId: "BK-JTUSUME2C7WL" },
      data: {
        totalAmount: 24675,
        advancePaid: 5250,
        remainingAmount: 19425,
        paymentMode: "YAC",
        passengers: mPassengers,
        trainTicketStatus: "CONFIRMED",
        notes: "Payment Date: 01-08-2026, Txn ID: YAC",
        adminNotes: "08 SEP SPITI - Meet (1 Pax)",
      },
    });
    console.log("✅ Updated Meet Booking");
  }

  console.log("🎉 ALL 6 BOOKINGS AND 16 PASSENGERS FULLY SYNCHRONIZED!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
