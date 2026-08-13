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
    console.log('Trip already exists:', existing.id, existing.title);
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
      heroImage: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200',
      images: [
        'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200',
        'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1200'
      ],
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

  console.log('🎉 SUCCESSFULLY RESTORED DELETED TRIP:', newTrip.id, '->', newTrip.title);
}

main().catch(console.error).finally(() => prisma.$disconnect());
