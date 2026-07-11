const { prisma } = require('../src/lib/prisma');

async function main() {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true, email: true, password: true }
    });
    
    const users = await prisma.user.findMany({
      select: { id: true, email: true, password: true }
    });
    
    const isBcrypt = (password) => {
      if (!password) return false;
      return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
    };
    
    console.log('--- AUDIT REPORT: ADMIN ACCOUNTS ---');
    let nonBcryptAdmins = 0;
    admins.forEach(admin => {
      if (!isBcrypt(admin.password)) {
        nonBcryptAdmins++;
        console.log(`[NON-BCRYPT ADMIN] ID: ${admin.id}, Email: ${admin.email}`);
      }
    });
    console.log(`Total non-bcrypt Admin accounts: ${nonBcryptAdmins}`);
    
    console.log('\n--- AUDIT REPORT: USER ACCOUNTS ---');
    let nonBcryptUsers = 0;
    users.forEach(user => {
      if (!isBcrypt(user.password)) {
        nonBcryptUsers++;
        console.log(`[NON-BCRYPT USER] ID: ${user.id}, Email: ${user.email}`);
      }
    });
    console.log(`Total non-bcrypt User accounts: ${nonBcryptUsers}`);
  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
