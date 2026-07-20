const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const backupDir = path.join(__dirname, 'backup_1784449482285');

async function run() {
  console.log("Disabling foreign key constraints for restore...");
  await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} tables to restore.`);

  for (const file of files) {
    const model = file.replace('.json', '');
    const dataPath = path.join(backupDir, file);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    if (data.length > 0) {
      console.log(`Restoring ${data.length} records into ${model}...`);
      try {
        // Handle batch insertion, some tables might have auto-increment IDs but here they are CUIDs mostly
        // For Postgres, Prisma createMany preserves the provided IDs.
        await prisma[model].createMany({
          data: data,
          skipDuplicates: true
        });
      } catch (e) {
        console.error(`Error restoring ${model}: ${e.message}`);
      }
    }
  }

  console.log("Re-enabling foreign key constraints...");
  await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
  console.log("Restore complete!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
