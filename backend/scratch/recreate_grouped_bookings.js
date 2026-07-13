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

    const groupPersons = [
      { name: "Jeel", age: 23, gender: "Male" },
      { name: "Vatsal", age: 22, gender: "Male" },
      { name: "Shubham", age: 23, gender: "Male" },
      { name: "Diya", age: 19, gender: "Female" },
      { name: "Yashvi", age: 19, gender: "Female" },
      { name: "Janki", age: 21, gender: "Female" },
      { name: "Nishit", age: 24, gender: "Male" }
    ];

    const groupRoomDetails = {
      personsRoomDetails: {
        "Jeel": { roomType: "Triple Sharing", coupleWith: "", roomNo: "Room 2" },
        "Vatsal": { roomType: "Triple Sharing", coupleWith: "", roomNo: "Room 2" },
        "Shubham": { roomType: "Triple Sharing", coupleWith: "", roomNo: "Room 2" },
        "Diya": { roomType: "Triple Sharing", coupleWith: "", roomNo: "Room 3" },
        "Yashvi": { roomType: "Triple Sharing", coupleWith: "", roomNo: "Room 3" },
        "Janki": { roomType: "Couple", coupleWith: "Nishit", roomNo: "Room 1" },
        "Nishit": { roomType: "Couple", coupleWith: "Janki", roomNo: "Room 1" }
      }
    };

    // 1. Group Booking (BK-520063) for 1 to 7
    const groupTotal = 35000 + 132000;
    await prisma.booking.create({
      data: {
        tenantId: "default",
        bookingId: "BK-520063",
        tripId: "SPT-1",
        tripName: "Spiti Valley Road Trip",
        status: "confirmed",
        name: "Jeel",
        fullName: "Jeel",
        phone: "8469449663",
        mobile: "8469449663",
        email: "jeel@test.com",
        age: 23,
        gender: "Male",
        numberOfTravelers: 7,
        pickupCity: "Ahmedabad",
        baseAmount: groupTotal,
        totalAmount: groupTotal,
        amount: groupTotal,
        advancePaid: 35000,
        remainingAmount: 132000,
        paymentMode: "upi",
        paymentStatus: "Partially Paid",
        payment_status: "partially_paid",
        upi_reference: "UPI DEVARSH",
        departureDate: new Date("2026-07-14"),
        passengers: {
          details: {
            gstAmount: 0,
            personsRoomDetails: groupRoomDetails.personsRoomDetails
          },
          persons: groupPersons
        },
        trainTicketRequired: true,
        trainTicketStatus: "CONFIRMED"
      }
    });
    console.log("Successfully created Group Booking BK-520063 for Jeel and team (1 to 7)");

    // 2. Solo Bookings (8 to 15)
    const solos = [
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
        roomNo: "Room 4"
      },
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
        roomNo: "Room 4"
      },
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
        roomNo: "Room 5"
      },
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
        roomNo: "Room 5"
      },
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
        roomNo: "Room 7"
      },
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
        roomNo: "Room 6"
      },
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
        roomNo: "Room 6"
      },
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
        roomNo: "Room 7"
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
      console.log(`Successfully created Solo Booking ${b.bookingId} for ${b.name}`);
    }

    console.log("Group and solos successfully created!");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
