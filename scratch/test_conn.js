const { prisma } = require('../backend/src/lib/prisma');

async function test() {
  try {
    console.log('Connecting to database via Prisma...');
    const count = await prisma.trip.count();
    console.log(`Database connectivity: SUCCESS! Found ${count} trips.`);
  } catch (err) {
    console.error('Database connectivity: FAILED!');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
