const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trip = await prisma.trip.findFirst({
    where: { slug: 'manali-kasol-amritsar-backpacking-trip-winter' }
  });
  if (trip) {
    console.log('Trip Title:', trip.title);
    console.log('Travel Options:', JSON.stringify(trip.travelOptions, null, 2));
    console.log('Variants:', JSON.stringify(trip.variants, null, 2));
    console.log('isDirectJoinEnabled:', trip.isDirectJoinEnabled);
    console.log('directJoinOptions:', JSON.stringify(trip.directJoinOptions, null, 2));
  } else {
    console.log('Trip not found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
