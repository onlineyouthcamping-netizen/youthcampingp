const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const trips = await prisma.trip.findMany();
    console.log('All Trips:', trips.map(t => ({ id: t.id, title: t.title })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
