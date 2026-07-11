const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    if (trip.attractions) {
      console.log(`Trip: ${trip.title} (${trip.slug})`);
      console.log('Attractions:', JSON.stringify(trip.attractions, null, 2));
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
