const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const trips = await prisma.trip.findMany();
    trips.forEach(t => {
      console.log(`Trip: ${t.title}`);
      console.log(`Slug: ${t.slug}`);
      console.log(`Hero Image: ${t.heroImage}`);
      console.log(`Images count: ${t.images?.length || 0}`);
      if (t.images) {
        t.images.forEach((img, i) => console.log(`  [${i}]: ${img}`));
      }
      console.log('---');
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
