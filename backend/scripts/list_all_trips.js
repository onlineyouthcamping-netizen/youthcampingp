const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const trips = await prisma.trip.findMany({ select: { id: true, title: true, slug: true, status: true } });
  console.log(JSON.stringify(trips, null, 2));
}
check().finally(() => prisma.$disconnect());
