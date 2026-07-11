const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    const trips = await prisma.trip.findMany();
    for (const trip of trips) {
      let updated = false;
      const images = trip.images.map(img => {
        if (img.endsWith('}')) {
          updated = true;
          return img.slice(0, -1);
        }
        return img;
      });

      if (updated) {
        await prisma.trip.update({
          where: { id: trip.id },
          data: { images }
        });
        console.log(`Fixed images for trip: ${trip.id}`);
      }
    }
    console.log('Finished fixing images');
  } catch (err) {
    console.error('Error fixing database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fix();
