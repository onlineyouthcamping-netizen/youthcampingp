const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.trainTicket.updateMany({
    where: { 
      ticketStatus: { not: 'CONFIRMED' }
    },
    data: {
      ticketStatus: 'CONFIRMED'
    }
  });
  console.log(`Updated ${result.count} TrainTicket records to CONFIRMED.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
