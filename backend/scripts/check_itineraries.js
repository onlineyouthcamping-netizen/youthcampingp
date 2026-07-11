const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    if (trip.itinerary && Array.isArray(trip.itinerary)) {
      for (const day of trip.itinerary) {
        if (day.description && (day.description.includes('Manali') || day.description.includes('Delhi'))) {
          console.log(`Trip: ${trip.title} (Slug: ${trip.slug})`);
          console.log(`Day ${day.day}: ${day.title}`);
          console.log(`Description:\n${day.description}\n---------------------------------\n`);
        }
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
