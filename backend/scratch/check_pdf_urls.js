const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const docs = await prisma.tripDocument.findMany({
      where: { tripId: 'MKA-1', category: 'Sales Guide' },
      select: { id: true, name: true, fileUrl: true, status: true, version: true }
    });
    console.log('PDFs in DB:', JSON.stringify(docs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
