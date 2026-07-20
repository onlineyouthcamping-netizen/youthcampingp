const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const mka = await prisma.trip.findUnique({ where: { id: 'MKA-1' }, select: { availableDates: true }});
  const spt = await prisma.trip.findUnique({ where: { id: 'SPT-1' }, select: { availableDates: true }});
  console.log("MKA DATES:\n", JSON.stringify(mka.availableDates, null, 2));
  console.log("SPT DATES:\n", JSON.stringify(spt.availableDates, null, 2));
}
run().finally(() => prisma.$disconnect());
