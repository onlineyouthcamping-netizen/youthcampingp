const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const datesStr = ['2024-07-14', '2024-07-21', '2024-09-08', '2024-09-27', 
                 '2025-07-14', '2025-07-21', '2025-09-08', '2025-09-27',
                 '2026-07-14', '2026-07-21', '2026-09-08', '2026-09-27'];
                 
  const dates = datesStr.map(d => new Date(d));
  
  const bookings = await prisma.booking.findMany({
    where: {
      departureDate: { in: dates }
    },
    select: {
      id: true,
      bookingId: true,
      name: true,
      tripName: true,
      departureDate: true,
      status: true
    }
  });
  
  console.log("\nBookings found:", bookings.length);
  for (const b of bookings) {
    console.log(`- ${b.bookingId} (${b.name}) - ${b.tripName} - ${b.departureDate.toISOString().split('T')[0]} - ${b.status}`);
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
