const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: 'SPT-1' }
    });
    console.log(JSON.stringify({
      id: trip.id,
      title: trip.title,
      slug: trip.slug,
      itinerary: trip.itinerary
    }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
