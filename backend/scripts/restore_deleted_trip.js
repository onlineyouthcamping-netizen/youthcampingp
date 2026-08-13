const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const f = path.join(__dirname, 'migrations/legacy-youthcamping/old_trips_data.json');
  if (!fs.existsSync(f)) {
    console.error('Archive file not found:', f);
    return;
  }

  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const tripData = data.find(t => (t.title || t.name || '').includes('Summer 2026'));

  if (!tripData) {
    console.error('Trip template not found in archive');
    return;
  }

  const realImages = [
    'https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg',
    'https://www.youthcamping.in/system/images/000/787/631/0bb3888fc4691faec634a98da33a1830/original/Untitled_design__22_.jpg',
    'https://www.youthcamping.in/system/images/000/787/774/d87cfa734abe02e2f9f30667d5104d45/original/Untitled_design__25_.jpg',
    'https://www.youthcamping.in/system/images/000/787/877/6d489b3b6c434fe4f28cf52029f87fee/original/Untitled_design__27_.jpg',
    'https://www.youthcamping.in/system/images/000/787/617/0584482e182e9ab64e9223acc28a6ba1/original/Untitled_design__13_.jpg',
    'https://www.youthcamping.in/system/images/000/787/886/12ef64016f1d4804482c8755b751fc41/original/Untitled_design__30_.jpg'
  ];

  const existing = await prisma.trip.findFirst({
    where: {
      OR: [
        { id: 'MKA-SUMMER-2026' },
        { title: 'Manali Kasol Summer 2026' },
        { slug: 'manali-kasol-summer-2026' }
      ]
    }
  });

  if (existing) {
    await prisma.trip.update({
      where: { id: existing.id },
      data: {
        heroImage: realImages[0],
        images: realImages,
        status: 'published'
      }
    });
    console.log('✅ UPDATED PHOTOS FOR EXISTING TRIP:', existing.id, existing.title);
    return;
  }

  const newTrip = await prisma.trip.create({
    data: {
      id: 'MKA-SUMMER-2026',
      tenantId: 'default',
      title: 'Manali Kasol Summer 2026',
      slug: 'manali-kasol-summer-2026',
      shortName: 'Manali Kasol',
      price: tripData.price || 11999,
      duration: '08 Nights / 09 Days',
      location: 'Himachal Pradesh',
      description: 'Experience the ultimate summer getaway to Manali, Kasol, Solang Valley, Atal Tunnel, Bhrigu Lake, and Amritsar Golden Temple.',
      heroImage: realImages[0],
      images: realImages,
      status: 'published',
      departureCity: 'Ahmedabad/Delhi',
      inclusions: tripData.inclusions || [],
      exclusions: tripData.exclusions || [],
      highlights: tripData.highlights || [],
      customSections: { thingsToCarry: tripData.thingsToCarry || [] },
      faqs: tripData.faqs || [],
      itinerary: tripData.itinerary || [],
      availableDates: [
        { id: 'dep-mka-sum-1', date: '2026-05-15', returnDate: '2026-05-23', status: 'available', price: 11999 },
        { id: 'dep-mka-sum-2', date: '2026-06-01', returnDate: '2026-06-09', status: 'available', price: 11999 },
        { id: 'dep-mka-sum-3', date: '2026-06-15', returnDate: '2026-06-23', status: 'available', price: 11999 },
        { id: 'dep-mka-sum-4', date: '2026-09-13', returnDate: '2026-09-21', status: 'available', price: 11999 }
      ]
    }
  });

  console.log('🎉 SUCCESSFULLY RESTORED DELETED TRIP WITH PHOTOS:', newTrip.id, '->', newTrip.title);
}

main().catch(console.error).finally(() => prisma.$disconnect());
