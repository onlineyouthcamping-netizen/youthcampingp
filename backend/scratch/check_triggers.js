const { prisma } = require('../src/lib/prisma');

async function main() {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers;
    `);
    console.log('Triggers found:', result);
  } catch (e) {
    console.error('Error fetching triggers:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
