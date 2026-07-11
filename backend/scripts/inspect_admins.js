const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('--- DATABASE TABLES AUDIT ---');
  
  const admins = await prisma.admin.findMany();
  console.log(`Admins: ${admins.length}`);
  for (const a of admins) {
    console.log(`  - ${a.email} (${a.role})`);
  }

  const settings = await prisma.setting.findMany();
  console.log(`Settings: ${settings.length}`);
  for (const s of settings) {
    console.log(`  - ${s.key}`);
  }

  const themes = await prisma.theme.findMany();
  console.log(`Themes: ${themes.length}`);
  for (const t of themes) {
    console.log(`  - ${t.name}`);
  }

  const pages = await prisma.pageBuilder.findMany();
  console.log(`PageBuilders: ${pages.length}`);
  for (const p of pages) {
    console.log(`  - ${p.name}`);
  }

  const attractions = await prisma.attraction.findMany();
  console.log(`Attractions: ${attractions.length}`);
  for (const att of attractions) {
    console.log(`  - ${att.name} (${att.slug})`);
  }

  const reviews = await prisma.review.findMany();
  console.log(`Reviews: ${reviews.length}`);
  
  const blogs = await prisma.blog.findMany();
  console.log(`Blogs: ${blogs.length}`);

  const bookings = await prisma.booking.findMany();
  console.log(`Bookings: ${bookings.length}`);
}

check().catch(console.error).finally(() => prisma.$disconnect());
