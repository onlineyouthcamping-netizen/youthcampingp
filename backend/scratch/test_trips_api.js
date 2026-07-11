const { prisma } = require('../src/lib/prisma');

async function main() {
  const trips = await prisma.trip.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`Found ${trips.length} active trips.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
