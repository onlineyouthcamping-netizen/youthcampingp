const { prisma } = require('../src/lib/prisma');

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      bookingId: {
        contains: 'FIVFSP137'
      }
    }
  });
  console.log("MATCHING BOOKINGS:", JSON.stringify(bookings.map(b => ({
    id: b.id,
    bookingId: b.bookingId,
    fullName: b.fullName,
    numberOfTravelers: b.numberOfTravelers
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
