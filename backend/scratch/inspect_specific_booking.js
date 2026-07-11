const { prisma } = require('../src/lib/prisma');

async function main() {
  const booking = await prisma.booking.findFirst({
    where: {
      bookingId: 'BK-FIVFSP137WGF'
    }
  });
  console.log("BOOKING DETAIL:", JSON.stringify(booking, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
