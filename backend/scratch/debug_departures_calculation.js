const { prisma } = require('../src/lib/prisma');

async function main() {
  const trips = await prisma.trip.findMany();
  const bookings = await prisma.booking.findMany();

  console.log(`Loaded ${trips.length} trips and ${bookings.length} bookings.`);

  const list = [];
  trips.forEach(trip => {
    let datesArr = [];
    if (Array.isArray(trip.availableDates)) {
      datesArr = trip.availableDates;
    } else if (typeof trip.availableDates === 'string') {
      try {
        datesArr = JSON.parse(trip.availableDates);
      } catch (e) {}
    }

    if (datesArr.length > 0) {
      console.log(`Trip: ${trip.title} has ${datesArr.length} dates.`);
    }

    datesArr.forEach(d => {
      if (!d || !d.date) return;
      const depDate = new Date(d.date);
      // Let's use the exact local system date from metadata: 2026-07-09
      const today = new Date("2026-07-09T17:40:39");
      today.setHours(0,0,0,0);
      depDate.setHours(0,0,0,0);
      
      const diffTime = depDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log(`  Date: ${d.date}, diffDays: ${diffDays}`);
      
      if (diffDays < -2) {
        console.log(`    Filtered out (past date)`);
        return;
      }

      console.log(`    -> KEPT!`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
