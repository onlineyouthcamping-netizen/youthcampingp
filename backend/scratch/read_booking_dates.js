const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      tripId: 'SPT-1'
    },
    select: {
      id: true,
      departureDate: true,
      status: true
    }
  });
  console.log(`Total SPT-1 bookings in DB: ${bookings.length}`);
  bookings.forEach(b => {
    console.log(`Booking ID: ${b.id}, Departure Date: ${b.departureDate} (${typeof b.departureDate}), Status: ${b.status}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
