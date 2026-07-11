const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin@123', salt);

  await prisma.user.upsert({
    where: { email: 'admin@travelos.com' },
    update: {
        password: hashedPassword,
        role: 'ADMIN'
    },
    create: {
      name: 'Super Admin',
      email: 'admin@travelos.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });

  console.log('Admin seeded: admin@travelos.com / admin@123');
}

main().finally(() => prisma.$disconnect());
