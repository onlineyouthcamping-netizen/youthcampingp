const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Delete all existing bookings for SPT-1 on departureDate 2026-07-02
    console.log("Cleaning up target bookings...");
    const targetBookingIds = [
      'BK-520063', 'BK-895468', 'BK-807357', 'BK-111060', 
      'BK-643693', 'BK-951966', 'BK-851249', 'BK-319220'
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

    console.log(`Found ${ids.length} bookings to delete.`);

    if (ids.length > 0) {
      await prisma.opsRoomAllocation.deleteMany({ where: { bookingId: { in: friendlyBookingIds } } }).catch((err) => console.error("Error deleting room allocs:", err));
      await prisma.opsVehicleAllocation.deleteMany({ where: { bookingId: { in: friendlyBookingIds } } }).catch((err) => console.error("Error deleting vehicle allocs:", err));
      await prisma.bookingActivityLog.deleteMany({ where: { bookingId: { in: ids } } }).catch(() => {});
      await prisma.accountingEntry.deleteMany({ where: { bookingId: { in: ids } } }).catch(() => {});
      
      await prisma.booking.deleteMany({
        where: { id: { in: ids } }
      });
    }

    console.log("Creating correct 8 bookings (15 passengers)...");

    const bookingsToCreate = [
      // Booking 1: Jeel (1 Pax)
      {
        bookingId: 'BK-520063',
        name: "Jeel",
        age: 23,
        gender: "Male",
        phone: "8469449663",
        advancePaid: 5000,
        remainingAmount: 18000,
        upiReference: "UPI DEVARSH",
        persons: [{ name: "Jeel", age: 23, gender: "Male" }]
      },
      // Booking 2: Vatsal (2 Pax)
      {
        bookingId: 'BK-895468',
        name: "Vatsal",
        age: 22,
        gender: "Male",
        phone: "8140106004",
        advancePaid: 10000,
        remainingAmount: 36000,
        upiReference: "UPI DEVARSH",
        persons: [
          { name: "Vatsal", age: 22, gender: "Male" },
          { name: "Shubham", age: 23, gender: "Male" }
        ]
      },
      // Booking 3: Diya (1 Pax)
      {
        bookingId: 'BK-807357',
        name: "Diya",
        age: 19,
        gender: "Female",
        phone: "9054367893",
        advancePaid: 5000,
        remainingAmount: 18000,
        upiReference: "UPI DEVARSH",
        persons: [{ name: "Diya", age: 19, gender: "Female" }]
      },
      // Booking 4: Yashvi (1 Pax)
      {
        bookingId: 'BK-111060',
        name: "Yashvi",
        age: 19,
        gender: "Female",
        phone: "9428018748",
        advancePaid: 5000,
        remainingAmount: 18000,
        upiReference: "UPI",
        persons: [{ name: "Yashvi", age: 19, gender: "Female" }]
      },
      // Booking 5: Janki + Nishit Couple Booking (2 Pax)
      {
        bookingId: 'BK-643693',
        name: "Janki",
        age: 21,
        gender: "Female",
        phone: "9054057893",
        advancePaid: 10000,
        remainingAmount: 42000, // 18000 (Janki) + 24000 (Nishit)
        upiReference: "UPI DEVARSH",
        adminNotes: "Couple Room requested",
        persons: [
          { name: "Janki", age: 21, gender: "Female" },
          { name: "Nishit", age: 24, gender: "Male" }
        ],
        roomDetails: {
          personsRoomDetails: {
            "Janki": { roomType: "Couple", coupleWith: "Nishit", roomNo: "Room 1" },
            "Nishit": { roomType: "Couple", coupleWith: "Janki", roomNo: "Room 1" }
          }
        }
      },
      // Booking 6: Manasvi (1 Pax)
      {
        bookingId: 'BK-951966',
        name: "Manasvi",
        age: 27,
        gender: "Female",
        phone: "8238101523",
        advancePaid: 5000,
        remainingAmount: 18750,
        upiReference: "UPI",
        persons: [{ name: "Manasvi", age: 27, gender: "Female" }]
      },
      // Booking 7: Tanvi + Rajveer + Manthan (3 Pax)
      {
        bookingId: 'BK-851249',
        name: "Tanvi",
        age: 21,
        gender: "Female",
        phone: "9327606091",
        advancePaid: 30000,
        remainingAmount: 37000,
        upiReference: "CHAKABHAI",
        persons: [
          { name: "Tanvi", age: 21, gender: "Female" },
          { name: "Rajveer", age: 19, gender: "Male" },
          { name: "Manthan", age: 19, gender: "Male" }
        ]
      },
      // Booking 8: Darshana + Jatinsinh + Rutvik + Foram (4 Pax)
      {
        bookingId: 'BK-319220',
        name: "Darshana",
        age: 22,
        gender: "Female",
        phone: "8401975612",
        advancePaid: 21000,
        remainingAmount: 74000,
        upiReference: "YAC",
        persons: [
          { name: "Darshana", age: 22, gender: "Female" },
          { name: "Jatinsinh", age: 45, gender: "Male" },
          { name: "Rutvik", age: 23, gender: "Male" },
          { name: "Foram", age: 23, gender: "Female" }
        ]
      }
    ];

    for (const b of bookingsToCreate) {
      const totalAmount = b.advancePaid + b.remainingAmount;
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
          numberOfTravelers: b.persons.length,
          baseAmount: totalAmount,
          totalAmount,
          amount: totalAmount,
          advancePaid: b.advancePaid,
          remainingAmount: b.remainingAmount,
          paymentMode: "upi",
          paymentStatus: b.remainingAmount === 0 ? "Fully Paid" : "Partially Paid",
          payment_status: b.remainingAmount === 0 ? "paid" : "partially_paid",
          upi_reference: b.upiReference,
          adminNotes: b.adminNotes || null,
          departureDate: new Date("2026-07-02"),
          passengers: {
            details: {
              gstAmount: 0,
              personsRoomDetails: b.roomDetails?.personsRoomDetails || {}
            },
            persons: b.persons
          },
          trainTicketRequired: true,
          trainTicketStatus: "CONFIRMED"
        }
      });
      console.log(`Created Booking ${b.bookingId} for ${b.name}`);
    }

    console.log("All 8 bookings (15 passengers) successfully setup!");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
