const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const pages = await prisma.pageBuilder.findMany();
  for (const page of pages) {
    console.log(`Page: ${page.name}`);
    console.log(`- sections:`, JSON.stringify(page.sections, null, 2));
    console.log(`- draft:`, JSON.stringify(page.draft, null, 2));
  }
}

inspect().catch(console.error).finally(() => prisma.$disconnect());
