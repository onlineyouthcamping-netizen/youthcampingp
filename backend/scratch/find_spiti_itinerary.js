const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany({
    where: {
      itineraries: {
        some: {}
      }
    },
    include: {
      itineraries: {
        include: {
          days: true
        }
      }
    }
  });
  
  console.log(`Found ${trips.length} Spiti trips.`);
  trips.forEach(t => {
    console.log(`Trip ID: ${t.id}, Title: ${t.title}, Itineraries: ${t.itineraries.length}`);
    t.itineraries.forEach(i => {
      console.log(`  Itinerary: ${i.title}, Days: ${i.days.length}`);
    });
  });
}

main().finally(() => prisma.$disconnect());
