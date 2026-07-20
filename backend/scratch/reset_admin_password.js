const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@youthcamping.online';
  const newPassword = 'password123';
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  const updatedAdmin = await prisma.admin.update({
    where: { email },
    data: { password: hashedPassword }
  });
  
  console.log(`Password successfully reset for ${email} to: ${newPassword}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
