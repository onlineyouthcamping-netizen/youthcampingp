const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.setting.findMany();
    console.log("DB Settings:", settings);
  } catch (err) {
    console.error("Error querying Setting table:", err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
