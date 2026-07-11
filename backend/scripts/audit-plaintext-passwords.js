const { prisma } = require('../src/lib/prisma');

async function main() {
  try {
    console.log('--- ADMIN PASSWORD PLAIN-TEXT AUDIT ---');
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, password: true }
    });

    let nonBcryptAdmins = 0;
    admins.forEach(admin => {
      if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
        nonBcryptAdmins++;
        console.log(`[PLAINTEXT ADMIN] ID: ${admin.id}, Email: ${admin.email}`);
      }
    });

    console.log(`\nAudit Complete. Total non-bcrypt Admin accounts: ${nonBcryptAdmins}`);
  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
