const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        tripId: 'SPT-1',
        departureDate: '2026-07-14T00:00:00.000Z'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    console.log(`Found ${bookings.length} bookings for SPT-1 on 2026-07-14:`);
    bookings.forEach((b, i) => {
      console.log(`${i+1}. Name: ${b.name}, BookingID: ${b.bookingId}, Phone: ${b.phone}, Advance: ${b.advancePaid}, Remaining: ${b.remainingAmount}, Ref: ${b.upi_reference}, TicketStatus: ${b.trainTicketStatus}`);
    });
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
