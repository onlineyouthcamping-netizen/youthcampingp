const { prisma } = require('../src/lib/prisma');

async function main() {
  const trips = await prisma.trip.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      isActive: true,
      availableDates: true
    }
  });

  console.log("TRIPS LIST WITH STATUS:");
  trips.forEach(t => {
    if (t.availableDates && JSON.stringify(t.availableDates) !== '[]') {
      console.log(`Trip: ${t.title} (${t.id}) | Status: ${t.status} | IsActive: ${t.isActive}`);
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
