const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching all trips in the database...');
  const trips = await prisma.trip.findMany({
    select: { id: true, title: true }
  });
  console.log('Trips in DB:', trips);
}

main().catch(console.error).finally(() => prisma.$disconnect());
