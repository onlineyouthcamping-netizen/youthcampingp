const { prisma } = require('../src/lib/prisma');

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      bookingId: {
        contains: 'NGF'
      }
    }
  });
  console.log("MATCHING NGF BOOKINGS:", JSON.stringify(bookings.map(b => ({
    id: b.id,
    bookingId: b.bookingId,
    fullName: b.fullName
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
