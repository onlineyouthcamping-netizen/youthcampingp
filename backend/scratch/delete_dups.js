const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const mka2Bookings = await prisma.booking.count({ where: { tripId: 'MKA-2' } });
  console.log('MKA-2 bookings count:', mka2Bookings);
  
  if (mka2Bookings === 0) {
    await prisma.trip.delete({ where: { id: 'MKA-2' } });
    console.log('Deleted MKA-2');
  } else {
    console.log('Cannot delete MKA-2, it has bookings!');
  }
}
run().finally(() => prisma.$disconnect());
