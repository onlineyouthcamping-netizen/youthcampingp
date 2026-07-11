const { prisma } = require('../src/lib/prisma');

async function run() {
  try {
    const count = await prisma.trip.count();
    console.log('Total trips count:', count);
    const trips = await prisma.trip.findMany({ take: 10 });
    console.log('Sample trips:', JSON.stringify(trips.map(t => ({ id: t.id, title: t.title, status: t.status })), null, 2));
  } catch (error) {
    console.error('Error fetching trips:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
