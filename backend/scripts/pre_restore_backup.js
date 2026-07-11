const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backup() {
  console.log('Creating pre-restore backup...');
  
  const trips = await prisma.trip.findMany({ include: { bookings: true } });
  const reviews = await prisma.review.findMany();
  const blogs = await prisma.blog.findMany();
  
  const backup = { trips, reviews, blogs, timestamp: new Date().toISOString() };
  const backupPath = path.join(__dirname, 'backups', `pre_restore_backup_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`);
  
  // Ensure backups dir exists
  const dir = path.dirname(backupPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup saved to: ${backupPath}`);
  console.log(`   Trips: ${trips.length}`);
  console.log(`   Reviews: ${reviews.length}`);
  console.log(`   Blogs: ${blogs.length}`);
}

backup().catch(e => console.error(e)).finally(() => prisma.$disconnect());
