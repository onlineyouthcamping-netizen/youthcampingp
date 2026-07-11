const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const page = await prisma.pageBuilder.findUnique({
    where: { name: 'home' }
  });
  console.log("--- PAGEBUILDER HOME ---");
  console.log(JSON.stringify(page, null, 2));

  const trips = await prisma.trip.findMany({
    select: { id: true, title: true, slug: true }
  });
  console.log("--- TRIPS ---");
  console.log(JSON.stringify(trips, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
