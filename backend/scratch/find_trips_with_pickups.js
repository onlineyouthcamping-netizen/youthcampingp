const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const trips = await prisma.trip.findMany();
  trips.forEach(t => {
    if (t.pickupCities && Array.isArray(t.pickupCities) && t.pickupCities.length > 0) {
      console.log(`Trip ID: ${t.id} (${t.title}) has pickupCities:`, JSON.stringify(t.pickupCities, null, 2));
    } else {
      console.log(`Trip ID: ${t.id} (${t.title}) has NO pickupCities.`);
    }
  });
}

run().catch(err => console.error(err)).finally(() => prisma.$disconnect());
