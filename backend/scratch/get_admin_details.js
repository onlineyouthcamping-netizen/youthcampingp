const { prisma } = require('../src/lib/prisma');

async function main() {
  const admin = await prisma.admin.findFirst({
    where: {
      email: 'admin@youthcamping.online'
    }
  });
  console.log("ADMIN:", JSON.stringify(admin, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
