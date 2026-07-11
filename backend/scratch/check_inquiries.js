const { prisma } = require('../src/lib/prisma');

async function run() {
  try {
    const count = await prisma.inquiry.count();
    console.log('Total inquiries count:', count);
    const inquiries = await prisma.inquiry.findMany({ take: 10 });
    console.log('Sample inquiries:', JSON.stringify(inquiries, null, 2));
  } catch (error) {
    console.error('Error fetching inquiries:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
