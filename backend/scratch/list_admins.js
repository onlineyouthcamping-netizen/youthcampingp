const { prisma } = require('../src/lib/prisma');

async function main() {
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  });
  console.log("ADMIN ACCOUNTS:");
  console.log(admins);
}

main().catch(console.error).finally(() => prisma.$disconnect());
