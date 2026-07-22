const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const templates = await prisma.trainTemplate.findMany({
      where: {
        tenantId: 'default',
        tripId: 'SPT-1',
        isActive: true,
        departureDate: { in: [null, new Date('undefined')] }
      }
    });
    console.log("Success:", templates.length);
  } catch(e) {
    console.log("Error:", e.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
