const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const count = await prisma.trip.count();
  console.log("Trip count:", count);
}
run().finally(() => prisma.$disconnect());
