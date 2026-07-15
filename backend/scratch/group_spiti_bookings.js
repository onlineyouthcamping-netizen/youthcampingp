const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    const bookingIdsToDelete = [
      'BK-520063', // Jeel
      'BK-895468', // Vatsal
      'BK-923847', // Shubham
      'BK-807357', // Diya
      'BK-111060', // Yashvi
      'BK-643693', // Janki
      'BK-506854'  // Nishit
    ];

    console.log("Deleting old bookings...");
    const deleteRes = await prisma.booking.deleteMany({
      where: {
        bookingId: { in: bookingIdsToDelete },
        tripId: 'SPT-1'
      }
    });
    console.log(`Deleted ${deleteRes.count} bookings.`);

    console.log("Creating unified group booking BK-520063...");
    const newBooking = await prisma.booking.create({
      data: {
        tenantId: "default",
        bookingId: 'BK-520063',
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
        baseAmount: 167000,
        totalAmount: 167000,
        amount: 167000,
        advancePaid: 35000,
        remainingAmount: 132000,
        paymentMode: "upi",
        paymentStatus: "Partially Paid",
        payment_status: "partially_paid",
        upi_reference: "UPI DEVARSH",
        adminNotes: "Group Booking SR 1-7. Janki & Nishit (SR 6 & 7) allocated a Couple Room.",
        departureDate: new Date("2026-07-02"),
        passengers: {
          details: {
            gstAmount: 0,
            roomType: "Couple & Triple/Quad Sharing",
            roomAllocation: "Couple Room: Janki & Nishit; Others: Triple/Quad Sharing"
          },
          persons: [
            { name: "Jeel", age: 23, gender: "Male", roomSharing: "Triple/Quad" },
            { name: "Vatsal", age: 22, gender: "Male", roomSharing: "Triple/Quad" },
            { name: "Shubham", age: 23, gender: "Male", roomSharing: "Triple/Quad" },
            { name: "Diya", age: 19, gender: "Female", roomSharing: "Triple/Quad" },
            { name: "Yashvi", age: 19, gender: "Female", roomSharing: "Triple/Quad" },
            { name: "Janki", age: 21, gender: "Female", roomSharing: "Double/Couple" },
            { name: "Nishit", age: 24, gender: "Male", roomSharing: "Double/Couple" }
          ]
        },
        trainTicketRequired: true,
        trainTicketStatus: "CONFIRMED"
      }
    });

    console.log(`Successfully created unified booking: ${newBooking.bookingId} for ${newBooking.name}`);
  } catch (err) {
    console.error("Error in run:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
