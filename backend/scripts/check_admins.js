const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const admins = await prisma.admin.findMany();
    console.log('Admins:', JSON.stringify(admins, null, 2));
  } catch (err) {
    console.error('Error checking database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
