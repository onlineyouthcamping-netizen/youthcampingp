const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const page = await prisma.pageBuilder.findUnique({
      where: { name: 'home' }
    });
    console.log("=== PageBuilder 'home' ===");
    console.log(JSON.stringify(page, null, 2));

    const settings = await prisma.setting.findMany();
    console.log("=== Settings ===");
    console.log(JSON.stringify(settings, null, 2));

    const theme = await prisma.theme.findFirst({
      where: { name: 'primary' }
    });
    console.log("=== Theme 'primary' ===");
    console.log(JSON.stringify(theme, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
