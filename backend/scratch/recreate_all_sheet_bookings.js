const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Cleaning up all Spiti Valley target bookings...");
    
    const targetBookingIds = [
      'BK-520063', 'BK-895468', 'BK-807357', 'BK-111060', 
      'BK-643693', 'BK-643694', 'BK-951966', 'BK-851249', 
      'BK-851250', 'BK-851251', 'BK-319220', 'BK-319221', 
      'BK-319222', 'BK-319223'
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

    const sheetBookings = [
      // 1. Jeel (Solo)
      {
        bookingId: 'BK-520063',
        name: "Jeel",
        age: 23,
        gender: "Male",
        phone: "8469449663",
        pickupCity: "Ahmedabad",
        advancePaid: 5000,
        remainingAmount: 18000,
        upiReference: "UPI DEVARSH",
        roomNo: "Room 2",
        persons: [{ name: "Jeel", age: 23, gender: "Male" }]
      },
      // 2. Vatsal & Shubham (Group)
      {
        bookingId: 'BK-895468',
        name: "Vatsal",
        age: 22,
        gender: "Male",
        phone: "8140106004",
        pickupCity: "Ahmedabad",
        advancePaid: 10000,
        remainingAmount: 36000,
        upiReference: "UPI DEVARSH",
        roomNo: "Room 2",
        persons: [
          { name: "Vatsal", age: 22, gender: "Male" },
          { name: "Shubham", age: 23, gender: "Male" }
        ]
      },
      // 3. Diya (Solo)
      {
        bookingId: 'BK-807357',
        name: "Diya",
        age: 19,
        gender: "Female",
        phone: "9054367893",
        pickupCity: "Ahmedabad",
        advancePaid: 5000,
        remainingAmount: 18000,
        upiReference: "UPI DEVARSH",
        roomNo: "Room 3",
        persons: [{ name: "Diya", age: 19, gender: "Female" }]
      },
      // 4. Yashvi (Solo)
      {
        bookingId: 'BK-111060',
        name: "Yashvi",
        age: 19,
        gender: "Female",
        phone: "9428018748",
        pickupCity: "Ahmedabad",
        advancePaid: 5000,
        remainingAmount: 18000,
        upiReference: "UPI",
        roomNo: "Room 3",
        persons: [{ name: "Yashvi", age: 19, gender: "Female" }]
      },
      // 5. Janki (Solo, Room 1 Couple)
      {
        bookingId: 'BK-643693',
        name: "Janki",
        age: 21,
        gender: "Female",
        phone: "9054057893",
        pickupCity: "Ahmedabad",
        advancePaid: 5000,
        remainingAmount: 18000,
        upiReference: "UPI DEVARSH",
        roomNo: "Room 1",
        roomType: "Couple",
        coupleWith: "Nishit",
        persons: [{ name: "Janki", age: 21, gender: "Female" }]
      },
      // 6. Nishit (Solo, Room 1 Couple)
      {
        bookingId: 'BK-643694',
        name: "Nishit",
        age: 24,
        gender: "Male",
        phone: "9998507722",
        pickupCity: "Ahmedabad",
        advancePaid: 5000,
        remainingAmount: 24000,
        upiReference: "UPI DEVARSH",
        roomNo: "Room 1",
        roomType: "Couple",
        coupleWith: "Janki",
        persons: [{ name: "Nishit", age: 24, gender: "Male" }]
      },
      // 7. Manasvi (Solo)
      {
        bookingId: 'BK-951966',
        name: "Manasvi",
        age: 27,
        gender: "Female",
        phone: "8238101523",
        pickupCity: "Ahmedabad",
        advancePaid: 5000,
        remainingAmount: 19250,
        upiReference: "UPI",
        roomNo: "Room 4",
        persons: [{ name: "Manasvi", age: 27, gender: "Female" }]
      },
      // 8. Tanvi (Solo)
      {
        bookingId: 'BK-851249',
        name: "Tanvi",
        age: 21,
        gender: "Female",
        phone: "9327606091",
        pickupCity: "Ahmedabad",
        advancePaid: 5000,
        remainingAmount: 18500,
        upiReference: "CHAKABHAI",
        roomNo: "Room 4",
        persons: [{ name: "Tanvi", age: 21, gender: "Female" }]
      },
      // 9. Rajveer (Solo)
      {
        bookingId: 'BK-851250',
        name: "Rajveer",
        age: 19,
        gender: "Male",
        phone: "7861982461",
        pickupCity: "Ahmedabad",
        advancePaid: 5000,
        remainingAmount: 18500,
        upiReference: "CHAKABHAI",
        roomNo: "Room 5",
        persons: [{ name: "Rajveer", age: 19, gender: "Male" }]
      },
      // 10. Manthan (Solo)
      {
        bookingId: 'BK-851251',
        name: "Manthan",
        age: 19,
        gender: "Male",
        phone: "9023145489",
        pickupCity: "Chandigarh",
        advancePaid: 20000,
        remainingAmount: 0,
        upiReference: "CHAKABHAI",
        roomNo: "Room 5",
        persons: [{ name: "Manthan", age: 19, gender: "Male" }]
      },
      // 11. Darshana (Solo)
      {
        bookingId: 'BK-319220',
        name: "Darshana",
        age: 22,
        gender: "Female",
        phone: "8401975612",
        pickupCity: "Ahmedabad",
        advancePaid: 5250,
        remainingAmount: 18500,
        upiReference: "YAC",
        roomNo: "Room 7",
        persons: [{ name: "Darshana", age: 22, gender: "Female" }]
      },
      // 12. Jatinsinh (Solo)
      {
        bookingId: 'BK-319221',
        name: "Jatinsinh",
        age: 45,
        gender: "Male",
        phone: "9825731498",
        pickupCity: "Ahmedabad",
        advancePaid: 5250,
        remainingAmount: 18500,
        upiReference: "YAC",
        roomNo: "Room 6",
        persons: [{ name: "Jatinsinh", age: 45, gender: "Male" }]
      },
      // 13. Rutvik (Solo)
      {
        bookingId: 'BK-319222',
        name: "Rutvik",
        age: 23,
        gender: "Male",
        phone: "6354482523",
        pickupCity: "Ahmedabad",
        advancePaid: 5250,
        remainingAmount: 18500,
        upiReference: "YAC",
        roomNo: "Room 6",
        persons: [{ name: "Rutvik", age: 23, gender: "Male" }]
      },
      // 14. Foram (Solo)
      {
        bookingId: 'BK-319223',
        name: "Foram",
        age: 23,
        gender: "Female",
        phone: "9913396791",
        pickupCity: "Ahmedabad",
        advancePaid: 5250,
        remainingAmount: 18500,
        upiReference: "YAC",
        roomNo: "Room 7",
        persons: [{ name: "Foram", age: 23, gender: "Female" }]
      }
    ];

    for (const b of sheetBookings) {
      const totalAmount = b.advancePaid + b.remainingAmount;
      
      // BuildpersonsRoomDetails mapping
      const personsRoomDetails = {};
      b.persons.forEach(p => {
        personsRoomDetails[p.name] = {
          roomType: b.roomType || "Friends",
          coupleWith: b.coupleWith || "",
          roomNo: b.roomNo
        };
      });

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
            persons: b.persons
          },
          trainTicketRequired: true,
          trainTicketStatus: "CONFIRMED"
        }
      });
      console.log(`Successfully created Booking ${b.bookingId} for ${b.name}`);
    }

    console.log("All 14 bookings successfully created from spreadsheet data!");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
