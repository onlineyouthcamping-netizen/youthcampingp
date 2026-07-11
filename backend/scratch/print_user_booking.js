const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const booking = await prisma.booking.findFirst({
    where: { bookingId: { contains: 'H5V', mode: 'insensitive' } }
  });
  console.log("DATABASE BOOKING VALUE FOR H5V:");
  console.log(JSON.stringify(booking, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
