const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
  console.log('🧹 Cleaning duplicate trips (order=999 with only 1 image)...\n');
  
  // Find all trips
  const allTrips = await prisma.trip.findMany({
    select: { id: true, title: true, slug: true, order: true, images: true },
    orderBy: { order: 'asc' }
  });
  
  // Group by similar title
  const titleMap = {};
  for (const t of allTrips) {
    const key = t.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!titleMap[key]) titleMap[key] = [];
    titleMap[key].push(t);
  }
  
  const toDelete = [];
  
  for (const [key, trips] of Object.entries(titleMap)) {
    if (trips.length > 1) {
      // Keep the one with more images (the restored one)
      const sorted = trips.sort((a, b) => b.images.length - a.images.length);
      const keep = sorted[0];
      const remove = sorted.slice(1);
      
      console.log(`📌 "${keep.title}" (slug: ${keep.slug}) — KEEP (${keep.images.length} images)`);
      for (const r of remove) {
        console.log(`   🗑️  "${r.title}" (slug: ${r.slug}) — DELETE (${r.images.length} images)`);
        toDelete.push(r.id);
      }
    }
  }
  
  if (toDelete.length > 0) {
    // Check for bookings linked to these trips
    const bookings = await prisma.booking.findMany({
      where: { tripId: { in: toDelete } },
      select: { id: true, tripId: true }
    });
    
    if (bookings.length > 0) {
      console.log(`\n⚠️  WARNING: ${bookings.length} bookings linked to duplicate trips. Skipping delete.`);
    } else {
      await prisma.trip.deleteMany({ where: { id: { in: toDelete } } });
      console.log(`\n✅ Deleted ${toDelete.length} duplicate trips`);
    }
  } else {
    console.log('No duplicates found.');
  }
  
  // Show final state
  console.log('\n📊 Final trip list:');
  const final = await prisma.trip.findMany({
    select: { title: true, slug: true, order: true, images: true },
    orderBy: { order: 'asc' }
  });
  
  final.forEach((t, i) => {
    console.log(`  ${i+1}. [#${t.order}] ${t.title} (${t.images.length} images) — ${t.slug}`);
  });
}

cleanDuplicates().catch(e => console.error(e)).finally(() => prisma.$disconnect());
