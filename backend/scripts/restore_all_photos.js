const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

// Map: seed slug → raw trips-data.json index
// trips-data.json has the REAL photos from youthcamping.in
const SLUG_MAP = {
  'kerala-getaway-2026-5d-4n': 7,                              // Kerala Getaway
  'manali-kasol-amritsar-backpacking-trip-9d-8n': 0,           // Manali Kasol Amritsar (first one)
  'leh-ladakh-bike-trip-with-turtuk-7d-6n': 5,                // Leh Ladakh
  'spiti-valley-full-circuit-from-ahmedabad-11d-10n': 6,       // Spiti Valley
  'manali-kasol-amritsar-with-bhrigu-lake-trek-9d-8n': 2,     // Bhrigu Lake (was "Summer 2026" variant)
};

async function restorePhotos() {
  console.log('📸 Restoring ALL photos to your 5 trips...\n');
  
  // Load raw data with real photos
  const rawTrips = JSON.parse(fs.readFileSync(path.join(__dirname, 'scripts', 'trips-data.json'), 'utf-8'));
  console.log(`Loaded ${rawTrips.length} raw trips from trips-data.json\n`);

  // Get uploaded photos
  const uploadsDir = path.join(__dirname, 'public', 'uploads', 'trips');
  const uploadedFiles = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  const uploadedUrls = uploadedFiles.map(f => `/uploads/trips/${f}`);
  console.log(`Found ${uploadedUrls.length} manually uploaded photos\n`);

  const trips = await prisma.trip.findMany();
  
  for (const trip of trips) {
    const rawIndex = SLUG_MAP[trip.slug];
    
    // Start with existing seed images (unsplash placeholders)
    let allImages = [...(trip.images || [])];
    
    // Add REAL photos from trips-data.json
    if (rawIndex !== undefined && rawTrips[rawIndex]) {
      const rawImages = rawTrips[rawIndex].images || [];
      console.log(`  📂 ${trip.title}`);
      console.log(`     Raw photos from website: ${rawImages.length}`);
      
      for (const img of rawImages) {
        if (!allImages.includes(img)) {
          allImages.push(img);
        }
      }
    }
    
    // Add manually uploaded photos
    for (const url of uploadedUrls) {
      if (!allImages.includes(url)) {
        allImages.push(url);
      }
    }
    
    // Deduplicate
    allImages = [...new Set(allImages)];
    
    // Set hero image to first real photo (not unsplash)
    const realHero = allImages.find(img => 
      !img.includes('unsplash.com') && (img.includes('b-cdn.net') || img.includes('youthcamping.in'))
    ) || allImages[0];
    
    await prisma.trip.update({
      where: { id: trip.id },
      data: { 
        images: allImages,
        heroImage: realHero
      }
    });
    
    console.log(`     ✅ Total: ${allImages.length} images (was ${(trip.images || []).length})`);
    console.log('');
  }

  // Final count
  console.log('═══════════════════════════════════════════════════');
  console.log('         FINAL PHOTO COUNT');
  console.log('═══════════════════════════════════════════════════\n');
  
  const final = await prisma.trip.findMany();
  for (const t of final) {
    console.log(`  ${t.title}: ${t.images.length} photos ✅`);
  }
  console.log('\n🎉 All photos restored!');
}

restorePhotos().catch(e => console.error(e)).finally(() => prisma.$disconnect());
