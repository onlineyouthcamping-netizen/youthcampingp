const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.findFirst({
    where: { slug: 'manali-kasol-amritsar-backpacking-trip' }
  });
  if (!trip) {
    console.log("Trip not found");
    return;
  }
  console.log(`=== Trip: ${trip.title} ===`);
  trip.itinerary.forEach((day) => {
    console.log(`Day ${day.day}: ${day.title}`);
    console.log(`Description: ${day.description}`);
    console.log(`Activities: ${JSON.stringify(day.activities)}`);
    console.log('-'.repeat(40));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
