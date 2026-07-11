require('./src/utils/testSafety').assertReadOnlyTestSafety();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying Spiti trip details...');
  try {
    const trip = await prisma.trip.findFirst({
      where: { title: { contains: 'Spiti', mode: 'insensitive' } }
    });
    console.log('Spiti Trip details in database:', trip);
  } catch (error) {
    console.error('ERROR querying Spiti trip:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
