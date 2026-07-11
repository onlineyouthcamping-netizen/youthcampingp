require('./src/utils/testSafety').assertReadOnlyTestSafety();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.setting.findFirst({
    where: { key: 'theme' } // Or whichever key holds the navbar settings
  });
  console.log('Theme Settings:', JSON.stringify(settings, null, 2));
  
  const allSettings = await prisma.setting.findMany();
  console.log('All Settings keys:', allSettings.map(s => s.key));
}

main().catch(console.error).finally(() => prisma.$disconnect());
