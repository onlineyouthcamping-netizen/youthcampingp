const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. CHAKABHAI Group (Tanvi, Rajveer, Manthan)
    const chakabhaiIds = ['BK-851249', 'BK-219213', 'BK-581812'];
    console.log("Deleting old CHAKABHAI bookings...");
    await prisma.booking.deleteMany({
      where: { bookingId: { in: chakabhaiIds }, tripId: 'SPT-1' }
    });

    console.log("Creating unified CHAKABHAI group booking BK-851249...");
    await prisma.booking.create({
      data: {
        tenantId: "default",
        bookingId: 'BK-851249',
        tripId: "SPT-1",
        tripName: "Spiti Valley Road Trip",
        status: "confirmed",
        name: "Tanvi",
        fullName: "Tanvi",
        phone: "9327606091",
        mobile: "9327606091",
        email: "tanvi@test.com",
        age: 21,
        gender: "Female",
        numberOfTravelers: 3,
        baseAmount: 67000,
        totalAmount: 67000,
        amount: 67000,
        advancePaid: 30000,
        remainingAmount: 37000,
        paymentMode: "upi",
        paymentStatus: "Partially Paid",
        payment_status: "partially_paid",
        upi_reference: "CHAKABHAI",
        adminNotes: "Group Booking SR 9-11 (CHAKABHAI)",
        departureDate: new Date("2026-07-02"),
        passengers: {
          details: { gstAmount: 0, roomType: "Triple Sharing" },
          persons: [
            { name: "Tanvi", age: 21, gender: "Female", roomSharing: "Triple" },
            { name: "Rajveer", age: 19, gender: "Male", roomSharing: "Triple" },
            { name: "Manthan", age: 19, gender: "Male", roomSharing: "Triple" }
          ]
        },
        trainTicketRequired: true,
        trainTicketStatus: "CONFIRMED"
      }
    });

    // 2. YAC Group (Darshana, Jatinsinh, Rutvik, Foram)
    const yacIds = ['BK-319220', 'BK-843432', 'BK-895581', 'BK-670549'];
    console.log("Deleting old YAC bookings...");
    await prisma.booking.deleteMany({
      where: { bookingId: { in: yacIds }, tripId: 'SPT-1' }
    });

    console.log("Creating unified YAC group booking BK-319220...");
    await prisma.booking.create({
      data: {
        tenantId: "default",
        bookingId: 'BK-319220',
        tripId: "SPT-1",
        tripName: "Spiti Valley Road Trip",
        status: "confirmed",
        name: "Darshana",
        fullName: "Darshana",
        phone: "8401975612",
        mobile: "8401975612",
        email: "darshana@test.com",
        age: 22,
        gender: "Female",
        numberOfTravelers: 4,
        baseAmount: 95000,
        totalAmount: 95000,
        amount: 95000,
        advancePaid: 21000,
        remainingAmount: 74000,
        paymentMode: "upi",
        paymentStatus: "Partially Paid",
        payment_status: "partially_paid",
        upi_reference: "YAC",
        adminNotes: "Group Booking SR 12-15 (YAC)",
        departureDate: new Date("2026-07-02"),
        passengers: {
          details: { gstAmount: 0, roomType: "Quad Sharing" },
          persons: [
            { name: "Darshana", age: 22, gender: "Female", roomSharing: "Quad" },
            { name: "Jatinsinh", age: 45, gender: "Male", roomSharing: "Quad" },
            { name: "Rutvik", age: 23, gender: "Male", roomSharing: "Quad" },
            { name: "Foram", age: 23, gender: "Female", roomSharing: "Quad" }
          ]
        },
        trainTicketRequired: true,
        trainTicketStatus: "CONFIRMED"
      }
    });

    console.log("Successfully grouped remaining Spiti bookings!");
  } catch (err) {
    console.error("Error in run:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
