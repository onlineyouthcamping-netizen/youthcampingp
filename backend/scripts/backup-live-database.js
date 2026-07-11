const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();

async function runBackup() {
  console.log("⚡ Connecting to database for backup...");
  try {
    const trips = await prisma.trip.findMany();
    console.log(`📋 Found ${trips.length} active trips in database.`);

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilePath = path.join(backupsDir, `trips_backup_${timestamp}.json`);

    fs.writeFileSync(backupFilePath, JSON.stringify(trips, null, 2), 'utf-8');
    console.log(`✅ Backup successfully saved to: ${backupFilePath}`);
  } catch (error) {
    console.error("❌ Database backup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
