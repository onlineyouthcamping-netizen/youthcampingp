const { prisma } = require('../src/lib/prisma');

async function main() {
  const trips = await prisma.trip.findMany({
    where: { isActive: true }
  });

  console.log("TRIPS AND THEIR AVAILABLE DATES:");
  trips.forEach(t => {
    console.log(`\nTrip: ${t.title} (${t.id})`);
    console.log(`- Available Dates:`, t.availableDates);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
