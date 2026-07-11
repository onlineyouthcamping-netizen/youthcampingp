const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    console.log(`Trip: ${trip.title} (Slug: ${trip.slug})`);
    if (trip.itinerary && Array.isArray(trip.itinerary)) {
      console.log(`Itinerary Length: ${trip.itinerary.length}`);
      console.log('Sample Day:', JSON.stringify(trip.itinerary[0], null, 2));
    } else {
      console.log('Itinerary is not an array or null:', typeof trip.itinerary);
    }
    console.log('---------------------------------\n');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
