const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tripId = 'MKA2';
  console.log(`🔍 Querying trip with ID: ${tripId}...`);
  const trip = await prisma.trip.findFirst({
    where: { id: tripId }
  });
  console.log('Result:', trip);
}

main().catch(console.error).finally(() => prisma.$disconnect());
