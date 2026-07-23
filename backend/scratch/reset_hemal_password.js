const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const newPassword = process.argv[2] || 'YouthCamping@2026';
  const hash = await bcrypt.hash(newPassword, 10);

  const updated = await prisma.admin.update({
    where: { email: 'hemal.patel@youthcamping.online' },
    data: {
      password: hash,
      isActive: true,
      tokenVersion: { increment: 1 }
    }
  });

  console.log(`✅ Password updated successfully for ${updated.email}! New password is: ${newPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Error resetting password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
