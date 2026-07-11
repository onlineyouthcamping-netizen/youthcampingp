const { prisma } = require('../src/lib/prisma');

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      tripId: 'SPT-1'
    },
    select: {
      id: true,
      bookingId: true,
      fullName: true,
      sourceMeta: true,
      passengers: true
    }
  });
  console.log("BOOKINGS WITH METADATA:", JSON.stringify(bookings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
