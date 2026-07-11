const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const bookings = await p.booking.findMany();
  console.log('Total bookings:', bookings.length);
  for (const b of bookings) {
    console.log(`Booking ID: ${b.bookingId}, Trip ID: ${b.tripId}, Trip Name: ${b.tripName}`);
  }
}
main().catch(console.error).finally(() => p.$disconnect());
