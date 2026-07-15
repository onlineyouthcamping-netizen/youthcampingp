const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    const booking = await prisma.booking.findFirst({
      where: { bookingId: 'BK-520063' }
    });
    if (!booking) {
      console.log("Jeel booking not found!");
      return;
    }
    console.log("Booking found:", booking.bookingId);
    console.log("passengers type:", typeof booking.passengers);
    console.log("passengers value:", JSON.stringify(booking.passengers, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
