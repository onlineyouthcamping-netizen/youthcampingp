const { prisma } = require('../src/lib/prisma');

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public';
    `);
    console.log('Functions found:', result);
  } catch (e) {
    console.error('Error fetching functions:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
