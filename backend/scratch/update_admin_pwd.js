const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const updated = await prisma.admin.update({
    where: { email: 'admin@test.com' },
    data: { password: hashedPassword }
  });
  console.log("Updated Admin password successfully:", updated.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
