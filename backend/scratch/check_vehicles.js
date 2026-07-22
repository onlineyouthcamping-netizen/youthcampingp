const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transports = await prisma.tripVendor.findMany({
    where: { tripId: 'SPT-1', vendorType: 'transport' }
  });
  console.log("Transports:");
  console.log(JSON.stringify(transports, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
