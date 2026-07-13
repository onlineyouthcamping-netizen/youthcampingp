const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Cleaning up target booking BK-851249...");
    
    const existing = await prisma.booking.findMany({
      where: {
        tripId: 'SPT-1',
        bookingId: { in: ['BK-851249', 'BK-851250', 'BK-851251'] }
      },
      select: { id: true, bookingId: true }
    });

    const ids = existing.map(b => b.id);
    const friendlyIds = existing.map(b => b.bookingId);

    if (ids.length > 0) {
      await prisma.opsRoomAllocation.deleteMany({ where: { bookingId: { in: friendlyIds } } }).catch(() => {});
      await prisma.opsVehicleAllocation.deleteMany({ where: { bookingId: { in: friendlyIds } } }).catch(() => {});
      await prisma.bookingActivityLog.deleteMany({ where: { bookingId: { in: ids } } }).catch(() => {});
      await prisma.accountingEntry.deleteMany({ where: { bookingId: { in: ids } } }).catch(() => {});
      await prisma.booking.deleteMany({ where: { id: { in: ids } } });
      console.log("Old bookings cleared.");
    }

    const solos = [
      {
        bookingId: 'BK-851249',
        name: "Tanvi",
        age: 21,
        gender: "Female",
        phone: "9327606091",
        pickupCity: "Ahmedabad",
        advancePaid: 10000,
        remainingAmount: 12333,
        upiReference: "TANVI_UPI",
        roomNo: "Room 4"
      },
      {
        bookingId: 'BK-851250',
        name: "Rajveer",
        age: 19,
        gender: "Male",
        phone: "9327606092",
        pickupCity: "Ahmedabad",
        advancePaid: 10000,
        remainingAmount: 12333,
        upiReference: "RAJVEER_UPI",
        roomNo: "Room 5"
      },
      {
        bookingId: 'BK-851251',
        name: "Manthan",
        age: 19,
        gender: "Male",
        phone: "9327606093",
        pickupCity: "Chandigarh",
        advancePaid: 20000,
        remainingAmount: 0,
        upiReference: "MANTHAN_FULL",
        roomNo: "Room 5"
      }
    ];

    for (const b of solos) {
      const totalAmount = b.advancePaid + b.remainingAmount;
      const personsRoomDetails = {
        [b.name]: { roomType: "Friends", coupleWith: "", roomNo: b.roomNo }
      };

      await prisma.booking.create({
        data: {
          tenantId: "default",
          bookingId: b.bookingId,
          tripId: "SPT-1",
          tripName: "Spiti Valley Road Trip",
          status: "confirmed",
          name: b.name,
          fullName: b.name,
          phone: b.phone,
          mobile: b.phone,
          email: `${b.name.toLowerCase()}@test.com`,
          age: b.age,
          gender: b.gender,
          numberOfTravelers: 1,
          pickupCity: b.pickupCity,
          baseAmount: totalAmount,
          totalAmount,
          amount: totalAmount,
          advancePaid: b.advancePaid,
          remainingAmount: b.remainingAmount,
          paymentMode: "upi",
          paymentStatus: b.remainingAmount === 0 ? "Fully Paid" : "Partially Paid",
          payment_status: b.remainingAmount === 0 ? "paid" : "partially_paid",
          upi_reference: b.upiReference,
          departureDate: new Date("2026-07-14"),
          passengers: {
            details: {
              gstAmount: 0,
              personsRoomDetails: personsRoomDetails
            },
            persons: [
              { name: b.name, age: b.age, gender: b.gender }
            ]
          },
          trainTicketRequired: true,
          trainTicketStatus: "CONFIRMED"
        }
      });
      console.log(`Created Solo Booking ${b.bookingId} for ${b.name}`);
    }

    console.log("Solos successfully corrected!");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
