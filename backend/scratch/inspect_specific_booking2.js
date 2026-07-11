const { prisma } = require('../src/lib/prisma');

async function main() {
  const booking = await prisma.booking.findUnique({
    where: { id: 'cmrdd068v3vuvh9cpnt' }
  });
  console.log("BOOKING DETAIL:", JSON.stringify(booking, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
