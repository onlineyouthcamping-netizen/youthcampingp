const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        departureDate: { not: null }
      }
    });
    console.log('Sample booking departureDate:', booking ? booking.departureDate : 'No bookings with departureDate');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
