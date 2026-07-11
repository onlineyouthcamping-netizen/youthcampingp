const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking if Shubham booking already exists...");
    const existing = await prisma.booking.findFirst({
      where: {
        name: { equals: 'Shubham', mode: 'insensitive' },
        departureDate: '2026-07-14T00:00:00.000Z'
      }
    });

    if (existing) {
      console.log("Shubham booking already exists:", existing);
      return;
    }

    console.log("Inserting Shubham booking into database...");
    const newBooking = await prisma.booking.create({
      data: {
        bookingId: "BK-923847",
        tenantId: "default",
        tripId: "SPT-1",
        tripName: "Spiti Valley Road Trip",
        status: "confirmed",
        name: "Shubham",
        fullName: "Shubham",
        phone: "9999999999",
        mobile: "9999999999",
        email: "shubham@test.com",
        age: 23,
        gender: "Male",
        numberOfTravelers: 1,
        baseAmount: 23000,
        gstAmount: null,
        depositGst: null,
        totalAmount: 23000,
        amount: 23000,
        advancePaid: 0,
        remainingAmount: 23000,
        paymentMode: "upi",
        paymentStatus: "Pending",
        payment_status: "pending",
        payment_method: "upi",
        upi_reference: null,
        notes: null,
        adminNotes: null,
        sourceBookingLinkId: null,
        salesAdminId: null,
        sourceMeta: null,
        departureDate: "2026-07-14T00:00:00.000Z",
        pickupCity: null,
        skipDays: 0,
        adjustedPrice: null,
        joiningDate: null,
        reminderSent: false,
        passengers: {
          details: {
            gstAmount: 0
          },
          persons: [
            {
              age: 23,
              name: "Shubham",
              gender: "Male"
            }
          ]
        },
        trainTicketRequired: true,
        trainTicketStatus: "CONFIRMED"
      }
    });

    console.log("Successfully created booking:", newBooking);
  } catch (err) {
    console.error("Error inserting booking:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
