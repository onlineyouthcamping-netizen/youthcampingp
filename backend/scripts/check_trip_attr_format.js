const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const trip = await prisma.trip.findFirst({
    where: {
      slug: 'bhrigu-lake-trek-manali-kasol-amritsar'
    }
  });
  if (trip) {
    console.log('Attractions field:', JSON.stringify(trip.attractions, null, 2));
  } else {
    console.log('Trip not found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
