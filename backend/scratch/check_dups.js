const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const trips = await prisma.trip.findMany({ select: { id: true, title: true, status: true, slug: true }});
  console.log(trips);
}
run().finally(() => prisma.$disconnect());
