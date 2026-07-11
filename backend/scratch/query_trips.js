const { prisma } = require('../src/lib/prisma');

async function main() {
  const trips = await prisma.trip.findMany({
    where: {
      slug: {
        contains: 'spiti'
      }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      isActive: true,
      price: true
    }
  });
  console.log("FOUND TRIPS:", JSON.stringify(trips, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
