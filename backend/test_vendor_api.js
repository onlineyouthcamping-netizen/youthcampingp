const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.findFirst();
  if (!trip) return;
  const mappings = await prisma.tripVendorMapping.findMany({
    where: { tripId: trip.id },
    include: { vendor: true }
  });
  console.log(`Trip ${trip.id} Vendor Mappings:`, JSON.stringify(mappings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
