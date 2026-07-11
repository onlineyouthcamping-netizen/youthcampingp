const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany({
    select: { email: true, role: true, name: true }
  });
  console.log("Registered Admins:", admins);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
