const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: { tripId: 'SPT-1' },
    select: { bookingId: true, trainTicketStatus: true }
  });
  console.log(bookings);
}

main().catch(console.error).finally(() => prisma.$disconnect());
