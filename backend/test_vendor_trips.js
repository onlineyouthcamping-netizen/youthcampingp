const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.findFirst();
  if (!trip) return console.log("No trips");
  
  const tripVendors = await prisma.tripVendor.findMany({
    where: { tripId: trip.id },
    include: { vendor: true }
  });
  
  console.log(`Trip ${trip.id} vendors:`, JSON.stringify(tripVendors, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
