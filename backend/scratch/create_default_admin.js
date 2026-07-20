const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function run() {
  const email = "admin@youthcamping.online";
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Creating default admin for: ${email}`);

  await prisma.admin.create({
    data: {
      email: email,
      password: hashedPassword,
      name: "Super Admin",
      role: "superadmin"
    }
  });

  console.log('✅ Default superadmin account created successfully!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
