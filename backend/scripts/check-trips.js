const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const trips = await prisma.trip.findMany({
      where: { status: 'published' },
      select: { title: true, availableDates: true }
    });
    console.log('--- PUBLISHED TRIPS ---');
    trips.forEach(t => {
      console.log(`Trip: ${t.title}`);
      console.log(`Dates: ${JSON.stringify(t.availableDates)}`);
      console.log('---');
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
