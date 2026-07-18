const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await prisma.tripDocument.updateMany({
      where: {
        tripId: 'MKA-1',
        name: 'Assignment - 3.pdf',
        version: 1
      },
      data: {
        status: 'ARCHIVED'
      }
    });
    console.log('Archived old Version 1 documents count:', res.count);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
