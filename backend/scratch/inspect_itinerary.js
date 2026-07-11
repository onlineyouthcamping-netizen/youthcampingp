const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const itin = await prisma.opsDayItinerary.findMany({
    where: { tripId: 'SPT-1' },
    orderBy: { date: 'asc' }
  });
  console.log(`Itinerary day count: ${itin.length}`);
  itin.forEach(d => {
    console.log(JSON.stringify(d, null, 2));
  });
}

main().finally(() => prisma.$disconnect());
