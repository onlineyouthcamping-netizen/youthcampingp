const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany();
  console.log("=== CHECKING TRIP IMAGES ===");
  for (const trip of trips) {
    console.log(`Trip: ${trip.title} (Slug: ${trip.slug})`);
    console.log(`  Hero Image: ${trip.heroImage}`);
    if (trip.images && Array.isArray(trip.images)) {
      console.log(`  Images (${trip.images.length}):`, trip.images.slice(0, 3));
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
