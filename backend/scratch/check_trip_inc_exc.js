const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [
          { id: 'MKA-1' },
          { slug: 'MKA-1' }
        ]
      },
      select: { id: true, title: true, inclusions: true, exclusions: true }
    });
    console.log('Trip details in DB:', JSON.stringify(trip, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
