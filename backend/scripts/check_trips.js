const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.trip.count();
    console.log(`Total trips in database: ${count}`);
    
    if (count > 0) {
      const trips = await prisma.trip.findMany({
        select: { id: true, title: true, tenantId: true, status: true }
      });
      console.log('Sample trips:', JSON.stringify(trips, null, 2));
    }
  } catch (err) {
    console.error('Error checking database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
