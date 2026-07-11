require('./src/lib/env');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const requireEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

async function main() {
  const email = requireEnvironmentValue('ADMIN_EMAIL').toLowerCase();
  const password = requireEnvironmentValue('ADMIN_PASSWORD');
  
  console.log(`🚀 Seeding secure hashed admin user into database for: ${email}`);
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const existing = await prisma.admin.findUnique({
    where: { email }
  });
  
  if (existing) {
    await prisma.admin.update({
      where: { email },
      data: { password: hashedPassword, role: 'superadmin' }
    });
    console.log('✅ Admin password updated to secure hashed format successfully!');
  } else {
    await prisma.admin.create({
      data: {
        id: 'admin_master_prod',
        email,
        password: hashedPassword,
        name: 'Super Admin',
        role: 'superadmin',
        tenantId: 'default'
      }
    });
    console.log('✅ Hashed admin account seeded successfully!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
