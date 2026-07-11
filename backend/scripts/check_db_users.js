const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.admin.findMany();
  console.log("=== Seeded Admins in Database ===");
  users.forEach(user => {
    console.log(`Email: ${user.email}, Role: ${user.role}, Active: ${user.status || user.isActive || 'N/A'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
