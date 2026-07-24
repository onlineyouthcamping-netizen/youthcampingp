const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'hemal.patel@youthcamping.online';
  const password = process.env.ADMIN_PASSWORD || 'YouthCamping@2026';
  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      password: hash,
      role: 'superadmin',
      isActive: true
    },
    create: {
      email,
      name: 'Hemal Patel',
      password: hash,
      role: 'superadmin',
      isActive: true,
      tenantId: 'default'
    }
  });

  console.log(`✅ Super Admin Account Ready!`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Error creating super admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
