const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prefix = '439fedb5';
  console.log(`🔍 Querying booking link with prefix: ${prefix}...`);
  const link = await prisma.bookingLink.findFirst({
    where: { tokenPrefix: prefix }
  });
  console.log('Result:', link);
}

main().catch(console.error).finally(() => prisma.$disconnect());
