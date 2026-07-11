const {
  assertMutatingTestSafety,
  requireEnvironmentValue,
} = require('./src/utils/testSafety');

assertMutatingTestSafety();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding E2E Admins...');
  
  const admins = [
    {
      email: requireEnvironmentValue('TEST_ADMIN_EMAIL'),
      password: requireEnvironmentValue('TEST_ADMIN_PASSWORD'),
      name: 'Isolated Test Admin',
      role: 'superadmin'
    },
    {
      email: requireEnvironmentValue('TEST_SECONDARY_ADMIN_EMAIL'),
      password: requireEnvironmentValue('TEST_SECONDARY_ADMIN_PASSWORD'),
      name: 'Isolated Secondary Test Admin',
      role: 'superadmin'
    }
  ];

  for (const a of admins) {
    const hashedPassword = await bcrypt.hash(a.password, 10);
    await prisma.admin.upsert({
      where: { email: a.email },
      update: { password: hashedPassword, role: a.role },
      create: {
        email: a.email,
        password: hashedPassword,
        name: a.name,
        role: a.role,
        tenantId: 'default'
      }
    });
    console.log(`✅ Seeded admin: ${a.email}`);
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
