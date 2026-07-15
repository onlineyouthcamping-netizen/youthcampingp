const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    const bookings = await prisma.booking.findMany({
      where: { tripId: 'SPT-1' }
    });
    console.log(`Found ${bookings.length} bookings for SPT-1:`);
    bookings.forEach(b => {
      console.log(`- ${b.bookingId}: ${b.fullName || b.name} (Pax: ${b.numberOfTravelers}, Departure: ${b.departureDate?.toISOString()})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
