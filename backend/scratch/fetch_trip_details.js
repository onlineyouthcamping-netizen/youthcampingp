const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const t = await prisma.trip.findUnique({ where: { id: 'MKA2' } });
  console.log('TRIP FIELDS:');
  console.log(JSON.stringify({
    title: t.title,
    pickupCities: t.pickupCities,
    variants: t.variants,
    travelOptions: t.travelOptions,
    roomOptions: t.roomOptions
  }, null, 2));
}

run()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
