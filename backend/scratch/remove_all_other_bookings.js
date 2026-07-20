const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const datesStr = ['2026-07-14', '2026-07-21', '2026-09-08', '2026-09-27'];
  const keepDates = datesStr.map(d => new Date(d));
  
  console.log("Finding all other bookings to remove...");
  // Find bookings whose departureDate is NOT in the keepDates
  const bookings = await prisma.booking.findMany({
    where: {
      departureDate: { notIn: keepDates }
    },
    select: { id: true, bookingId: true }
  });
  
  const bookingIds = bookings.map(b => b.id);
  const bookingRefIds = bookings.map(b => b.bookingId);
  
  if (bookingIds.length > 0) {
    console.log(`Deleting ${bookingIds.length} bookings...`);
    
    // Delete restricted models manually if any exist
    await prisma.opsRoomAllocation.deleteMany({
      where: { bookingId: { in: bookingRefIds } }
    }).catch(e => console.log('opsRoomAllocation delete:', e.message));
    
    await prisma.opsVehicleAllocation.deleteMany({
      where: { bookingId: { in: bookingRefIds } }
    }).catch(e => console.log('opsVehicleAllocation delete:', e.message));

    await prisma.booking.deleteMany({
      where: { id: { in: bookingIds } }
    });
    console.log("Bookings deleted successfully.");
  } else {
    console.log("No other bookings found.");
  }

  console.log("Updating trips to keep only these availableDates...");
  const trips = await prisma.trip.findMany({
    where: {
      title: { in: ['Spiti Valley Road Trip', 'Manali Kasol Amritsar Backpacking Trip'] }
    }
  });

  for (const t of trips) {
    if (t.availableDates && Array.isArray(t.availableDates)) {
      // KEEP only the dates in datesStr
      const filteredDates = t.availableDates.filter(d => datesStr.includes(d.date));
      if (filteredDates.length !== t.availableDates.length) {
        await prisma.trip.update({
          where: { id: t.id },
          data: { availableDates: filteredDates }
        });
        console.log(`Updated trip: ${t.title}`);
      }
    }
  }

  console.log("Done.");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
