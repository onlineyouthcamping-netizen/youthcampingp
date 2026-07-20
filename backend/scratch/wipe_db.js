const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Fetching all table names from public schema...");
  const tables = await prisma.$queryRawUnsafe(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename != '_prisma_migrations';
  `);

  if (!tables || tables.length === 0) {
    console.log("No tables found to wipe.");
    return;
  }

  const tableNames = tables.map(t => `"${t.tablename}"`);
  console.log(`Truncating ${tableNames.length} tables...`);

  const truncateQuery = `TRUNCATE TABLE ${tableNames.join(', ')} CASCADE;`;
  
  await prisma.$executeRawUnsafe(truncateQuery);
  console.log("All tables truncated successfully.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
