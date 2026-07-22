const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fleets = await prisma.opsTransportFleet.findMany({
    where: { tripId: 'SPT-1', departureDate: new Date('2026-07-21') }
  });
  console.log("Fleets for 2026-07-21:");
  console.log(JSON.stringify(fleets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
