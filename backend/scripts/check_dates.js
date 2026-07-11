const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const trips = await prisma.trip.findMany({
      select: { id: true, title: true, status: true, availableDates: true }
    });
    for (const t of trips) {
      console.log(`Trip: ${t.title} (${t.status})`);
      console.log(`  Dates: ${JSON.stringify(t.availableDates)}`);
    }
  } catch (err) {
    console.error('Error checking database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
