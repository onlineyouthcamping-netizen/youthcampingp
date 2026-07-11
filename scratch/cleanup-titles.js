const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all trips...');
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    console.log(`Trip ID: ${trip.id}, Title: "${trip.title}", Slug: "${trip.slug}"`);
    if (trip.title.includes('(Sync')) {
      const cleanTitle = trip.title.split(' (Sync')[0].trim();
      console.log(`Updating trip ${trip.id}: "${trip.title}" -> "${cleanTitle}"`);
      await prisma.trip.update({
        where: { id: trip.id },
        data: { title: cleanTitle }
      });
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
