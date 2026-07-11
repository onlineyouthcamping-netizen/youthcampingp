const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });

const prisma = new PrismaClient();

async function checkTrips() {
  try {
    console.log('DATABASE_URL is:', process.env.DATABASE_URL);
    const trips = await prisma.trip.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        tenantId: true
      }
    });
    console.log('Total trips in DB:', trips.length);
    console.log(JSON.stringify(trips, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrips();
