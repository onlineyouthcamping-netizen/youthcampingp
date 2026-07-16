const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Cleaning up previous seed bookings for Spiti Valley SPT-1, 21 July departure...");

    // Clean up our individual entries
    const targetBookingIds = [
      'BK-800001', 'BK-800002', 'BK-800003', 'BK-800004', 'BK-800005',
      'BK-800006', 'BK-800007', 'BK-800008', 'BK-800009', 'BK-800010', 'BK-800011',
      'BK-800021', 'BK-800022', 'BK-800023', 'BK-800024'
    ];

    const bookings = await prisma.booking.findMany({
      where: {
        tripId: 'SPT-1',
        bookingId: { in: targetBookingIds }
      },
      select: { id: true, bookingId: true }
    });

    const ids = bookings.map(b => b.id);
    const friendlyBookingIds = bookings.map(b => b.bookingId);

    if (ids.length > 0) {
      await prisma.opsRoomAllocation.deleteMany({ where: { bookingId: { in: friendlyBookingIds } } }).catch(() => {});
      await prisma.opsVehicleAllocation.deleteMany({ where: { bookingId: { in: friendlyBookingIds } } }).catch(() => {});
      await prisma.bookingActivityLog.deleteMany({ where: { bookingId: { in: ids } } }).catch(() => {});
      await prisma.accountingEntry.deleteMany({ where: { bookingId: { in: ids } } }).catch(() => {});
      await prisma.booking.deleteMany({ where: { id: { in: ids } } });
      console.log("Cleared existing target bookings.");
    }

    // New 21st July Spiti Spreadsheet Grouped Bookings:
    // Booking Group 1 (1-3): Meetkumar, Rahul, Tarang
    // Booking Group 2 (4-5): Nirav & Jayshree (Couple)
    // Booking Group 3 (6-10): Jainish, Namankumar, Harsh, Dhruv, Omkumar
    // Booking Group 4 (11): Prithviraj
    const groupedBookings = [
      {
        bookingId: 'BK-800021',
        leadName: "MEETKUMAR",
        age: 21,
        gender: "MALE",
        phone: "9106076839",
        pickupCity: "Ahmedabad",
        advancePaid: 15000,
        remainingAmount: 55500,
        upiReference: "UPI",
        roomNo: "Room 1",
        roomType: "Triple Sharing",
        persons: [
          { name: "MEETKUMAR", age: 21, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 1" },
          { name: "RAHUL", age: 27, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 1" },
          { name: "TARANG", age: 26, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 1" }
        ]
      },
      {
        bookingId: 'BK-800022',
        leadName: "NIRAV",
        age: 25,
        gender: "MALE",
        phone: "6351405947",
        pickupCity: "Ahmedabad",
        advancePaid: 10000,
        remainingAmount: 43000,
        upiReference: "CHAKABHAI AC",
        roomNo: "Room 2",
        roomType: "Couple",
        coupleWith: "JAYSHREE",
        persons: [
          { name: "NIRAV", age: 25, gender: "MALE", roomType: "Couple", coupleWith: "JAYSHREE", roomNo: "Room 2" },
          { name: "JAYSHREE", age: 30, gender: "FEMALE", roomType: "Couple", coupleWith: "NIRAV", roomNo: "Room 2" }
        ]
      },
      {
        bookingId: 'BK-800023',
        leadName: "jainish",
        age: 19,
        gender: "MALE",
        phone: "8160399755",
        pickupCity: "Ahmedabad",
        advancePaid: 25000,
        remainingAmount: 90000,
        upiReference: "OFFICE CASH",
        roomNo: "Room 3",
        roomType: "Triple Sharing",
        persons: [
          { name: "jainish", age: 19, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 3" },
          { name: "Namankumar", age: 18, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 3" },
          { name: "Harsh", age: 18, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 3" },
          { name: "Dhruv", age: 19, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 4" },
          { name: "Omkumar", age: 19, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 4" }
        ]
      },
      {
        bookingId: 'BK-800024',
        leadName: "Prithviraj",
        age: 18,
        gender: "MALE",
        phone: "9875948006",
        pickupCity: "Ahmedabad",
        advancePaid: 5250,
        remainingAmount: 18500,
        upiReference: "YAC",
        roomNo: "Room 4",
        roomType: "Triple Sharing",
        persons: [
          { name: "Prithviraj", age: 18, gender: "MALE", roomType: "Triple Sharing", roomNo: "Room 4" }
        ]
      }
    ];

    for (const b of groupedBookings) {
      const totalAmount = b.advancePaid + b.remainingAmount;
      const personsRoomDetails = {};
      b.persons.forEach(p => {
        personsRoomDetails[p.name] = {
          roomType: p.roomType,
          coupleWith: p.coupleWith || "",
          roomNo: p.roomNo
        };
      });

      // Filter co-passengers (excluding lead passenger)
      const coPassengers = b.persons.filter(p => p.name !== b.leadName);

      await prisma.booking.create({
        data: {
          tenantId: "default",
          bookingId: b.bookingId,
          tripId: "SPT-1",
          tripName: "Spiti Valley Road Trip",
          status: "confirmed",
          name: b.leadName,
          fullName: b.leadName,
          phone: b.phone,
          mobile: b.phone,
          email: `${b.leadName.toLowerCase().replace(/\s+/g, '')}@test.com`,
          age: b.age,
          gender: b.gender,
          numberOfTravelers: b.persons.length,
          pickupCity: b.pickupCity,
          baseAmount: totalAmount,
          totalAmount,
          amount: totalAmount,
          advancePaid: b.advancePaid,
          remainingAmount: b.remainingAmount,
          paymentMode: "upi",
          paymentStatus: b.remainingAmount === 0 && b.advancePaid > 0 ? "Fully Paid" : b.advancePaid > 0 ? "Partially Paid" : "Unpaid",
          payment_status: b.remainingAmount === 0 && b.advancePaid > 0 ? "paid" : b.advancePaid > 0 ? "partially_paid" : "unpaid",
          upi_reference: b.upiReference,
          departureDate: new Date("2026-07-21T00:00:00.000Z"), // 21 July 2026 Spiti Valley Departure
          passengers: {
            details: {
              gstAmount: 0,
              personsRoomDetails: personsRoomDetails
            },
            persons: coPassengers
          },
          trainTicketRequired: true,
          trainTicketStatus: "CONFIRMED"
        }
      });
      console.log(`Successfully created Group Booking ${b.bookingId} for ${b.leadName} (${b.persons.length} Passengers)`);
    }

    console.log("All 4 grouped bookings successfully created from spreadsheet data for July 21 departure!");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
