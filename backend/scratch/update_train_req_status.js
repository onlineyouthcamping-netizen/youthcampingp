const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.trainTicketRequest.updateMany({
    where: { 
      status: { not: 'ISSUED' }
    },
    data: {
      status: 'ISSUED' // Wait, the UI might check 'ISSUED' or 'APPROVED'
    }
  });
  console.log(`Updated ${result.count} TrainTicketRequest records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
