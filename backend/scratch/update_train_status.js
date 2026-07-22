const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.booking.updateMany({
    where: { 
      trainTicketRequired: true,
      trainTicketStatus: { not: 'CONFIRMED' }
    },
    data: {
      trainTicketStatus: 'CONFIRMED'
    }
  });
  console.log(`Updated ${result.count} bookings to CONFIRMED train status.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
