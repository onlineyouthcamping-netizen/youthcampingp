const { prisma } = require('../src/lib/prisma');

async function main() {
  const booking = await prisma.booking.findFirst({
    where: {
      bookingId: 'BK-1MCU9MJLXTV1'
    }
  });
  console.log("VIDEO BOOKING DETAIL:", JSON.stringify(booking, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
