const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.attraction.count();
  console.log('Attraction count:', count);
  const items = await prisma.attraction.findMany({ take: 5 });
  console.log('Sample items:', JSON.stringify(items, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
