const { prisma } = require('../src/lib/prisma');

async function main() {
  const trip = await prisma.trip.findFirst({
    where: {
      OR: [
        { id: 'MKA-2' },
        { slug: 'MKA-2' }
      ]
    },
    select: {
      id: true,
      title: true,
      availableDates: true
    }
  });
  console.log("TRIP DETAIL FOR MKA-2:", JSON.stringify(trip, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
