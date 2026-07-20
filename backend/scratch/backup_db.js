const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function run() {
  const backupDir = path.join(__dirname, 'backup_' + Date.now());
  fs.mkdirSync(backupDir);

  // Get all model names from Prisma
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$') && typeof prisma[k].findMany === 'function');
  
  console.log(`Backing up ${models.length} tables...`);
  
  for (const model of models) {
    try {
      const data = await prisma[model].findMany();
      fs.writeFileSync(path.join(backupDir, `${model}.json`), JSON.stringify(data, null, 2));
      console.log(`Backed up ${data.length} records for ${model}`);
    } catch (e) {
      console.error(`Error backing up ${model}: ${e.message}`);
    }
  }
  
  console.log(`Backup completed successfully in ${backupDir}`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
