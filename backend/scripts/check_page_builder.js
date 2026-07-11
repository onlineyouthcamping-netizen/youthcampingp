const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const page = await prisma.pageBuilder.findUnique({
    where: { name: 'home' }
  });
  console.log('PageBuilder Home sections:', JSON.stringify(page?.sections || page?.draft || [], null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
