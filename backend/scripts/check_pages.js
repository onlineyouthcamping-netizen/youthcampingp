const { prisma } = require('./src/lib/prisma');

async function check() {
  const pages = await prisma.pageBuilder.findMany();
  console.log(JSON.stringify(pages, null, 2));
  await prisma.$disconnect();
}

check();
