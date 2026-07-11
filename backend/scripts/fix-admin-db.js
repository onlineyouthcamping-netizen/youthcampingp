require('./src/lib/env');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const requireEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

async function main() {
  const email = requireEnvironmentValue('ADMIN_EMAIL').toLowerCase();
  const plainPassword = requireEnvironmentValue('ADMIN_PASSWORD');
  const hashed = await bcrypt.hash(plainPassword, 10);
  await prisma.admin.update({ where: { email }, data: { password: hashed } });
  console.log('Admin password hashed successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
