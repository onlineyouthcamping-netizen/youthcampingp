const { prisma } = require('../lib/prisma');
const bcrypt = require('bcryptjs');

async function updatePasswords() {
  const admins = await prisma.admin.findMany();
  const results = [];

  for (const admin of admins) {
    if (admin.email === 'hemal.patel@youthcamping.online') {
      results.push({
        name: admin.name,
        role: admin.role,
        email: admin.email,
        password: 'Hemal@007 (Unchanged)'
      });
      continue;
    }

    let firstName = admin.name.split(' ')[0].toLowerCase();
    if (firstName === 'youthcamping' || firstName === 'super' || firstName === 'test') {
      firstName = 'admin';
    }

    const newPassword = `${firstName}123`;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword }
    });

    results.push({
      name: admin.name,
      role: admin.role,
      email: admin.email,
      password: newPassword
    });
  }

  console.log('UPDATED_PROFILES:', JSON.stringify(results, null, 2));
}

updatePasswords()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
