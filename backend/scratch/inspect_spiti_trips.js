const { prisma } = require('../src/lib/prisma');

async function main() {
  const trips = await prisma.trip.findMany({
    where: {
      id: { in: ['SPT-1', 'SPT', 'WSPT'] }
    }
  });
  console.log("TRIPS DETAIL:", JSON.stringify(trips, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
