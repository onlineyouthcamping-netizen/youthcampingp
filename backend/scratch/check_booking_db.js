const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    select: { id: true, bookingId: true, name: true, baseAmount: true, gstAmount: true, totalAmount: true }
  });
  console.log("DATABASE BOOKINGS:", JSON.stringify(bookings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
