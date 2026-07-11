const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const booking = await prisma.booking.findUnique({
      where: { bookingId: 'BK-520063' }
    });
    console.log(JSON.stringify(booking, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
