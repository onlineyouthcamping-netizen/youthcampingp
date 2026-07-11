const { prisma } = require('../src/lib/prisma');

async function main() {
  const page = await prisma.page.findFirst({
    where: { slug: 'home' }
  });
  console.log("PAGE SECTIONS:", JSON.stringify(page?.sections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
