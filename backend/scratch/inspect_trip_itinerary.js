const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.findFirst({
    where: { id: 'SPT-1' },
    include: {
      itineraries: {
        include: {
          days: {
            orderBy: {
              dayNumber: 'asc'
            }
          }
        }
      }
    }
  });
  
  if (!trip) {
    console.log("Trip not found");
    return;
  }
  
  console.log(`Trip Title: ${trip.title}`);
  console.log(`Trip ID: ${trip.id}`);
  console.log(`Itineraries found: ${trip.itineraries.length}`);
  
  trip.itineraries.forEach((it, idx) => {
    console.log(`\nItinerary ${idx + 1}: ${it.title || 'Untitled'}`);
    it.days.forEach(d => {
      console.log(`  Day ${d.dayNumber}: ${d.title} (${d.location})`);
      console.log(`    Activity: ${d.activities}`);
      console.log(`    Description: ${d.description}`);
    });
  });
}

main().finally(() => prisma.$disconnect());
