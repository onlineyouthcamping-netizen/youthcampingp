const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const trips = await prisma.trip.findMany({ select: { id: true, title: true }});
  console.log(JSON.stringify(trips, null, 2));
}
run().finally(() => prisma.$disconnect());
