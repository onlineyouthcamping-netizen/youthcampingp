require('./src/utils/testSafety').assertReadOnlyTestSafety();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing booking links database query...');
  try {
    const links = await prisma.bookingLink.findMany({
      take: 5
    });
    console.log('Successfully queried booking links! Count:', links.length);
    console.log('Data:', JSON.stringify(links, null, 2));
  } catch (error) {
    console.error('ERROR querying booking links:', error);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
