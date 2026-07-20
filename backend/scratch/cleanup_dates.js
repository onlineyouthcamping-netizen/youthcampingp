const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const trips = await prisma.trip.findMany({ select: { id: true, availableDates: true, title: true }});
  
  // Today's date string (e.g. 2026-07-19)
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  
  // To delete previous months entirely, we could just filter by todayStr.
  // Any date < todayStr is in the past.
  
  for (const trip of trips) {
    if (!trip.availableDates || !Array.isArray(trip.availableDates)) continue;
    
    const originalCount = trip.availableDates.length;
    const futureDates = trip.availableDates.filter(d => d.date >= todayStr);
    
    if (futureDates.length < originalCount) {
      console.log(`Trip ${trip.id} (${trip.title}): Removing ${originalCount - futureDates.length} past dates.`);
      await prisma.trip.update({
        where: { id: trip.id },
        data: { availableDates: futureDates }
      });
    } else {
      console.log(`Trip ${trip.id} (${trip.title}): No past dates found.`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
