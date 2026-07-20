const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const trips = await prisma.trip.findMany({
    where: {
      title: { in: ['Spiti Valley Road Trip', 'Manali Kasol Amritsar Backpacking Trip'] }
    },
    select: {
      id: true,
      title: true,
      availableDates: true
    }
  });
  
  for (const t of trips) {
    console.log(`\nTrip: ${t.title}`);
    console.log(JSON.stringify(t.availableDates, null, 2));
  }
}

run().finally(() => prisma.$disconnect());
