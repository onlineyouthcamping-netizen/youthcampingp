const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany();
  trips.forEach(trip => {
    console.log(`=== TRIP: ${trip.title} (Slug: ${trip.slug}) ===`);
    trip.itinerary.forEach(day => {
      console.log(`  Day ${day.day} (${day.title}): ${day.description.substring(0, 120)}...`);
    });
    console.log('\n');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
