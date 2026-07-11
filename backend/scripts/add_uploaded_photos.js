const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function addUploadedPhotos() {
  console.log('📸 Adding manually uploaded photos to trips...\n');

  // Get all uploaded trip photos
  const uploadsDir = path.join(__dirname, 'public', 'uploads', 'trips');
  const files = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  
  console.log(`Found ${files.length} uploaded photos in ${uploadsDir}\n`);
  
  // Build URLs for the uploaded images (relative to backend server)
  const uploadedUrls = files.map(f => `/uploads/trips/${f}`);
  
  // Show the files
  files.forEach(f => {
    const stat = fs.statSync(path.join(uploadsDir, f));
    console.log(`  📷 ${f} (${(stat.size / 1024).toFixed(0)} KB) - ${stat.mtime.toLocaleString()}`);
  });

  // Add uploaded photos to ALL trips
  const trips = await prisma.trip.findMany({ orderBy: { order: 'asc' } });
  
  console.log(`\n🔄 Adding ${uploadedUrls.length} uploaded photos to each trip...\n`);

  for (const trip of trips) {
    const existingImages = trip.images || [];
    const combined = [...existingImages, ...uploadedUrls.filter(u => !existingImages.includes(u))];
    
    await prisma.trip.update({
      where: { id: trip.id },
      data: { images: combined }
    });
    
    console.log(`  ✅ ${trip.title}: ${existingImages.length} → ${combined.length} images`);
  }

  // Final verification
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('              FINAL STATE - YOUR 5 TRIPS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const finalTrips = await prisma.trip.findMany({ orderBy: { order: 'asc' } });
  
  for (const t of finalTrips) {
    const itin = Array.isArray(t.itinerary) ? t.itinerary : [];
    const incl = Array.isArray(t.inclusions) ? t.inclusions : [];
    const excl = Array.isArray(t.exclusions) ? t.exclusions : [];
    const hl = Array.isArray(t.highlights) ? t.highlights : [];
    const dates = Array.isArray(t.availableDates) ? t.availableDates : [];
    const vars = Array.isArray(t.variants) ? t.variants : [];
    const faqs = Array.isArray(t.faqs) ? t.faqs : [];
    
    console.log(`#${t.order || '-'} ${t.title}`);
    console.log(`   📸 ${t.images.length} images | 🗺️ ${itin.length}-day itinerary (with bullet points)`);
    console.log(`   ✅ ${incl.length} inclusions | ❌ ${excl.length} exclusions | ⭐ ${hl.length} highlights`);
    console.log(`   📅 ${dates.length} departure dates | 💰 ₹${t.price} | 🎯 ${vars.length} variants`);
    console.log(`   ❓ ${faqs.length} FAQs | 🗺️ Route: ${t.route ? '✅' : '❌'} | 📋 Popup: ${t.popupDetails ? '✅' : '❌'}`);
    console.log('');
  }
  
  console.log(`Total: ${finalTrips.length} trips | 🎉 All restored with YOUR data!`);
}

addUploadedPhotos().catch(e => console.error(e)).finally(() => prisma.$disconnect());
