const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emails = ['admin@youthcamping.in', 'admin@test.com'];
  for (const email of emails) {
    const updated = await prisma.admin.updateMany({
      where: { email },
      data: { role: 'superadmin' }
    });
    console.log(`Updated ${email} status:`, updated);
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
