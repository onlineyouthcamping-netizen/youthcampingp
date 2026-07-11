const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingId: { contains: '26052' } },
          { name: { contains: 'Nisarg', mode: 'insensitive' } },
          { fullName: { contains: 'Nisarg', mode: 'insensitive' } }
        ]
      }
    });
    if (booking) {
      console.log('Found Booking:', JSON.stringify(booking, null, 2));
    } else {
      console.log('No booking found for Nisarg Patel or ID 26052.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
