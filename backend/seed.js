const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const password = 'Hemal@007';
  const hash = await bcrypt.hash(password, 10);

  const admin1 = await prisma.admin.upsert({
    where: { email: 'hemal.patel@youthcamping.online' },
    update: { password: hash, role: 'superadmin', isActive: true },
    create: {
      email: 'hemal.patel@youthcamping.online',
      name: 'Hemal Patel',
      password: hash,
      role: 'superadmin',
      isActive: true,
      tenantId: 'default'
    }
  });

  console.log('✅ Super Admin Account Ready:', admin1.email);
  console.log('   Password: Hemal@007');
}

main()
  .catch((e) => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
