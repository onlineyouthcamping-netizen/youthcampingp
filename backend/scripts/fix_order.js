const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixOrder() {
  try {
    const result = await prisma.trip.updateMany({
      where: { order: 0 },
      data: { order: 999 }
    });
    console.log(`✅ Updated ${result.count} trips with default order 999`);
  } catch (error) {
    console.error('❌ Error updating trips:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOrder();
