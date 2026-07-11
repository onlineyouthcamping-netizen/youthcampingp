const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true
    }
  });
  console.log("Admins in DB:");
  console.log(JSON.stringify(admins, null, 2));
}

main().finally(() => prisma.$disconnect());
