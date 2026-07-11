const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const where = {
    tenantId: 'default',
    tripId: 'SPT-1'
  };
  
  const bookings = await prisma.booking.findMany({
    where,
    select: {
      id: true,
      bookingId: true,
      tripId: true,
      departureDate: true,
      status: true
    }
  });
  
  console.log(`Prisma count: ${bookings.length}`);
  bookings.forEach(b => {
    console.log(JSON.stringify(b));
  });
}

main().finally(() => prisma.$disconnect());
