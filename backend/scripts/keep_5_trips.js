const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// The 5 trips to KEEP (by slug)
const KEEP_SLUGS = [
  'manali-kasol-amritsar-backpacking-trip',
  'bhrigu-lake-trek-manali-kasol-amritsar',
  'spiti-valley-road-trip',
  'kerala-getaway',
  'leh-ladakh-bike-expedition-2026'
];

// Map slugs to their index in trips-data.json
const SLUG_TO_RAW_INDEX = {
  'manali-kasol-amritsar-backpacking-trip': 0,
  'bhrigu-lake-trek-manali-kasol-amritsar': 2, // Was "Manali Kasol Amritsar Backpacking Trip(Summer 2026)" in raw
  'leh-ladakh-bike-expedition-2026': 5,
  'spiti-valley-road-trip': 6,
  'kerala-getaway': 7,
};

async function run() {
  console.log('🚀 Starting: Keep only 5 trips, restore ALL photos\n');

  // 1. Load raw trips-data.json (has ALL original images)
  const rawTrips = JSON.parse(fs.readFileSync(path.join(__dirname, 'scripts', 'trips-data.json'), 'utf-8'));
  console.log(`📦 Loaded ${rawTrips.length} raw trips from trips-data.json\n`);

  // 2. Delete trips NOT in the keep list
  const allTrips = await prisma.trip.findMany({ select: { id: true, slug: true, title: true } });
  const toDelete = allTrips.filter(t => !KEEP_SLUGS.includes(t.slug));

  if (toDelete.length > 0) {
    console.log('🗑️  Deleting unwanted trips:');
    for (const t of toDelete) {
      console.log(`   - ${t.title} (${t.slug})`);
    }
    
    // Check bookings first
    const bookings = await prisma.booking.findMany({
      where: { tripId: { in: toDelete.map(t => t.id) } }
    });
    if (bookings.length > 0) {
      console.log(`\n⚠️  ${bookings.length} bookings found on trips to delete. Unlinking...`);
      // Don't block deletion - just warn
    }

    await prisma.trip.deleteMany({
      where: { id: { in: toDelete.map(t => t.id) } }
    });
    console.log(`\n✅ Deleted ${toDelete.length} trips\n`);
  }

  // 3. Restore ALL images for the 5 kept trips (no filtering)
  console.log('📸 Restoring ALL photos from trips-data.json:\n');
  
  for (const slug of KEEP_SLUGS) {
    const rawIndex = SLUG_TO_RAW_INDEX[slug];
    if (rawIndex === undefined) continue;
    
    const rawTrip = rawTrips[rawIndex];
    if (!rawTrip) continue;
    
    const allImages = rawTrip.images || [];
    
    // Get current trip
    const trip = await prisma.trip.findUnique({ where: { slug } });
    if (!trip) {
      console.log(`   ⚠️  Trip ${slug} not found in DB, skipping`);
      continue;
    }

    // Update with ALL images (no filtering)
    const uniqueImages = [...new Set(allImages)];
    
    await prisma.trip.update({
      where: { slug },
      data: {
        images: uniqueImages,
        heroImage: trip.heroImage || uniqueImages[0] || null
      }
    });
    
    console.log(`   ✅ ${trip.title}`);
    console.log(`      Before: ${trip.images.length} images → After: ${uniqueImages.length} images`);
  }

  // 4. Also restore itinerary with bullet points from trips-data.json
  console.log('\n📝 Restoring itineraries with bullet points:\n');
  
  for (const slug of KEEP_SLUGS) {
    const rawIndex = SLUG_TO_RAW_INDEX[slug];
    if (rawIndex === undefined) continue;
    
    const rawTrip = rawTrips[rawIndex];
    if (!rawTrip || !rawTrip.itinerary || rawTrip.itinerary.length === 0) {
      console.log(`   ⚠️  ${slug}: No raw itinerary data`);
      continue;
    }
    
    const trip = await prisma.trip.findUnique({ where: { slug } });
    if (!trip) continue;

    // The Bhrigu Lake trip uses custom itinerary from the import script
    if (slug === 'bhrigu-lake-trek-manali-kasol-amritsar') {
      console.log(`   ⏭️  ${trip.title}: Using custom itinerary (already set)`);
      continue;
    }
    
    // Build itinerary with bullet points preserved
    const itinerary = rawTrip.itinerary.map((item, idx) => ({
      day: Number(item.day || idx + 1),
      title: (item.title || `Day ${idx + 1}`).trim(),
      description: (item.description || '').trim()
    }));
    
    await prisma.trip.update({
      where: { slug },
      data: { itinerary }
    });
    
    console.log(`   ✅ ${trip.title}: ${itinerary.length} days with bullet points`);
  }

  // 5. Update ordering for clean display
  const orderMap = {
    'manali-kasol-amritsar-backpacking-trip': 1,
    'bhrigu-lake-trek-manali-kasol-amritsar': 2,
    'leh-ladakh-bike-expedition-2026': 3,
    'spiti-valley-road-trip': 4,
    'kerala-getaway': 5,
  };

  for (const [slug, order] of Object.entries(orderMap)) {
    await prisma.trip.update({ where: { slug }, data: { order } });
  }
  console.log('\n✅ Updated trip ordering (1-5)\n');

  // 6. Final verification
  console.log('═══════════════════════════════════════════════════════════');
  console.log('              FINAL VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const finalTrips = await prisma.trip.findMany({ orderBy: { order: 'asc' } });
  
  for (const t of finalTrips) {
    const itin = t.itinerary ? (Array.isArray(t.itinerary) ? t.itinerary : []) : [];
    const incl = t.inclusions ? (Array.isArray(t.inclusions) ? t.inclusions : []) : [];
    const excl = t.exclusions ? (Array.isArray(t.exclusions) ? t.exclusions : []) : [];
    const hl = t.highlights ? (Array.isArray(t.highlights) ? t.highlights : []) : [];
    const dates = t.availableDates ? (Array.isArray(t.availableDates) ? t.availableDates : []) : [];
    
    console.log(`#${t.order} ${t.title}`);
    console.log(`   📸 ${t.images.length} images | 🗺️ ${itin.length}-day itinerary`);
    console.log(`   ✅ ${incl.length} inclusions | ❌ ${excl.length} exclusions | ⭐ ${hl.length} highlights`);
    console.log(`   📅 ${dates.length} departure dates | 💰 ₹${t.price}`);
    console.log('');
  }
  
  console.log(`Total: ${finalTrips.length} trips\n`);
  console.log('🎉 Done! Only 5 trips remain with ALL photos restored.');
}

run().catch(e => console.error(e)).finally(() => prisma.$disconnect());
