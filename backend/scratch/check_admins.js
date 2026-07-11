const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Load dotenv manually from backend/ and OVERRIDE existing env variables
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local'), override: true });
console.log('DATABASE_URL after loading backend/.env.local with override:true:', process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function checkAndSeedUsers() {
  try {
    const adminEmail = 'admin@test.com';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('testpass123', salt);

    await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        role: 'admin',
        isActive: true
      },
      create: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Test Admin',
        role: 'admin',
        isActive: true,
        tenantId: 'default'
      }
    });
    console.log('Admin upserted successfully: admin@test.com');

    const travelerEmail = 'traveler@test.com';
    await prisma.user.upsert({
      where: { email: travelerEmail },
      update: {
        password: hashedPassword,
        role: 'user'
      },
      create: {
        email: travelerEmail,
        password: hashedPassword,
        name: 'Test Traveler',
        role: 'user',
        tenantId: 'default'
      }
    });
    console.log('Traveler upserted successfully: traveler@test.com');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndSeedUsers();
