const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: { 
      tripId: 'SPT-1', 
      departureDate: new Date('2026-07-21') 
    },
    select: { bookingId: true, passengers: true }
  });
  console.dir(bookings, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
