const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Delete version 2 document (the one with image/upload URL)
    const delRes = await prisma.tripDocument.deleteMany({
      where: {
        tripId: 'MKA-1',
        name: 'Assignment - 3.pdf',
        version: 2
      }
    });
    console.log('Deleted version 2 documents count:', delRes.count);

    // 2. Restore version 1 document to active DRAFT status
    const updateRes = await prisma.tripDocument.updateMany({
      where: {
        tripId: 'MKA-1',
        name: 'Assignment - 3.pdf',
        version: 1
      },
      data: {
        status: 'DRAFT'
      }
    });
    console.log('Restored version 1 documents count:', updateRes.count);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
