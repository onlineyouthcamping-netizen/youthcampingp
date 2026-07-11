const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    console.log(`=== ${trip.title} ===`);
    console.log(`Current Hero: ${trip.heroImage}`);
    const images = trip.images || [];
    console.log(`Total images: ${images.length}`);
    
    const logos = [];
    const unsplash = [];
    const localUploads = [];
    const cdnImages = [];
    
    images.forEach(img => {
      if (img.includes('IMG_6911.png') || img.includes('seeklogo') || img.includes('pngwing') || img.toLowerCase().includes('logo')) {
        logos.push(img);
      } else if (img.includes('unsplash.com')) {
        unsplash.push(img);
      } else if (img.startsWith('/uploads/') || img.includes('/uploads/')) {
        localUploads.push(img);
      } else {
        cdnImages.push(img);
      }
    });
    
    console.log(`- Logos/Placeholders (${logos.length}):`);
    logos.forEach(l => console.log(`  * ${l}`));
    
    console.log(`- Unsplash (${unsplash.length}):`);
    unsplash.slice(0, 3).forEach(u => console.log(`  * ${u}`));
    if (unsplash.length > 3) console.log(`  ... and ${unsplash.length - 3} more`);
    
    console.log(`- Local Uploads (${localUploads.length}):`);
    localUploads.slice(0, 3).forEach(l => console.log(`  * ${l}`));
    if (localUploads.length > 3) console.log(`  ... and ${localUploads.length - 3} more`);
    
    console.log(`- CDN/Real Photos (${cdnImages.length}):`);
    cdnImages.slice(0, 5).forEach(c => console.log(`  * ${c}`));
    if (cdnImages.length > 5) console.log(`  ... and ${cdnImages.length - 5} more`);
    console.log('\n');
  }
  await prisma.$disconnect();
}

inspect();
