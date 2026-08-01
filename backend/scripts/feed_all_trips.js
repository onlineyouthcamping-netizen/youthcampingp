const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tripsToFeed = [
  {
    title: "Kedarnath Badrinath - Tungnath & Rishikesh",
    shortName: "KTR-1",
    slug: "kedarnath-badrinath-tungnath-rishikesh",
    location: "Uttarakhand",
    price: 16500,
    duration: "08D/07N",
    category: "Backpacking",
    order: 5,
    description: "Sacred Chota Char Dham and Panch Kedar pilgrimage to Kedarnath, Badrinath, Tungnath, and Rishikesh.",
    status: "published",
    heroImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200",
      "https://images.unsplash.com/photo-1589802829985-817e51171b92?q=80&w=1200"
    ],
    inclusions: [
      "Transfers from Haridwar/Rishikesh",
      "Hotel & Guesthouse Stay",
      "Breakfast & Dinner",
      "Trek Captain & Guide",
      "Permits & Registration"
    ],
    exclusions: ["Personal expenses", "Helicopter charges", "GST (5%)"],
    availableDates: [
      { date: "2026-05-10", capacity: 30 },
      { date: "2026-05-25", capacity: 30 },
      { date: "2026-06-10", capacity: 30 },
      { date: "2026-09-15", capacity: 30 }
    ],
    variants: [
      { location: "Haridwar to Haridwar", duration: "08D/07N", discountedPrice: 16500 },
      { location: "Rishikesh to Rishikesh", duration: "08D/07N", discountedPrice: 15999 }
    ]
  },
  {
    title: "Kedarnath Tungnath & Rishikesh Trip",
    shortName: "KTR-2",
    slug: "kedarnath-tungnath-rishikesh-trip",
    location: "Uttarakhand",
    price: 12999,
    duration: "06D/05N",
    category: "Backpacking",
    order: 6,
    description: "Spiritual trek to Kedarnath temple, Tungnath highest Shiva temple, Chandrashila summit, and Rishikesh Ganga Aarti.",
    status: "published",
    heroImage: "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=1200",
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200"
    ],
    inclusions: [
      "Transfers from Rishikesh",
      "Accommodation in Sonprayag & Kedarnath",
      "Breakfast & Dinner",
      "Trek Coordinator"
    ],
    exclusions: ["Personal expenses", "Pony/Palki charges", "GST (5%)"],
    availableDates: [
      { date: "2026-05-12", capacity: 30 },
      { date: "2026-05-26", capacity: 30 },
      { date: "2026-06-12", capacity: 30 }
    ],
    variants: [
      { location: "Rishikesh to Rishikesh", duration: "06D/05N", discountedPrice: 12999 },
      { location: "Delhi to Delhi", duration: "07D/06N", discountedPrice: 14999 }
    ]
  },
  {
    title: "Leh Ladakh Bike Expedition 2026",
    shortName: "LEH-1",
    slug: "leh-ladakh-bike-expedition-2026",
    location: "Ladakh",
    price: 11999,
    duration: "07D/06N",
    category: "Bike Expedition",
    order: 7,
    description: "Ultimate high-altitude motorcycling adventure through Khardung La, Nubra Valley, Turtuk, and Pangong Tso Lake.",
    status: "published",
    heroImage: "https://images.unsplash.com/photo-1566324810848-18e474eb4d0b?q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1566324810848-18e474eb4d0b?q=80&w=1200",
      "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=1200"
    ],
    inclusions: [
      "Himalayan 411cc / 450cc Bike Rental",
      "Fuel for entire itinerary",
      "Backup vehicle & Mechanic",
      "Hotel & Deluxe Camp Stays",
      "Inner Line Permits & Environmental Fee"
    ],
    exclusions: ["Rider personal gear", "Security deposit", "GST (5%)"],
    availableDates: [
      { date: "2026-06-01", capacity: 20 },
      { date: "2026-06-15", capacity: 20 },
      { date: "2026-07-01", capacity: 20 },
      { date: "2026-07-15", capacity: 20 }
    ],
    variants: [
      { location: "Leh to Leh (Dual Rider)", duration: "07D/06N", discountedPrice: 11999 },
      { location: "Leh to Leh (Solo Rider)", duration: "07D/06N", discountedPrice: 16999 },
      { location: "Seat in Backup SUV", duration: "07D/06N", discountedPrice: 13999 }
    ]
  },
  {
    title: "Jannat-e-Kashmir Backpacking Trip",
    shortName: "KSH-1",
    slug: "jannat-e-kashmir-backpacking-trip",
    location: "Kashmir",
    price: 11999,
    duration: "06D/05N",
    category: "Backpacking",
    order: 8,
    description: "Experience God's canvas in Kashmir — Srinagar houseboats, Shikara ride on Dal Lake, Gulmarg snow meadows, Sonamarg, and Pahalgam valley.",
    status: "published",
    heroImage: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1200",
      "https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=1200"
    ],
    inclusions: [
      "Srinagar Airport Pickup & Drop",
      "1 Night Luxury Houseboat Stay",
      "4 Nights Hotel Stay",
      "Shikara Ride on Dal Lake",
      "Breakfast & Dinner",
      "Private Tempo Traveller Transfers"
    ],
    exclusions: ["Gondola Phase 1 & 2 tickets", "Pony rides", "GST (5%)"],
    availableDates: [
      { date: "2026-04-15", capacity: 25 },
      { date: "2026-05-05", capacity: 25 },
      { date: "2026-05-20", capacity: 25 },
      { date: "2026-06-10", capacity: 25 }
    ],
    variants: [
      { location: "Srinagar to Srinagar", duration: "06D/05N", discountedPrice: 11999 },
      { location: "Jammu to Jammu", duration: "08D/07N", discountedPrice: 14999 }
    ]
  },
  {
    title: "Shimla Manali Dalhousie Dharamshala",
    shortName: "SMDD-1",
    slug: "shimla-manali-dalhousie-dharamshala",
    location: "Himachal Pradesh",
    price: 17999,
    duration: "08D/07N",
    category: "Himachal",
    order: 9,
    description: "Complete Grand Himachal Tour across colonial Shimla, scenic Manali, Tibetan Dharamshala & Dalai Lama Temple, and mini-Switzerland Khajjiar.",
    status: "published",
    heroImage: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=1200",
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200"
    ],
    inclusions: [
      "Delhi to Delhi Transfers by AC Vehicle",
      "7 Nights Hotel Accommodations",
      "Daily Breakfast & Dinner",
      "All Sightseeing & Toll Taxes",
      "Trip Coordinator"
    ],
    exclusions: ["Adventure activity fees", "Personal expenses", "GST (5%)"],
    availableDates: [
      { date: "2026-05-15", capacity: 30 },
      { date: "2026-06-01", capacity: 30 },
      { date: "2026-06-20", capacity: 30 }
    ],
    variants: [
      { location: "Delhi to Delhi", duration: "08D/07N", discountedPrice: 17999 },
      { location: "Chandigarh to Chandigarh", duration: "08D/07N", discountedPrice: 16499 }
    ]
  },
  {
    title: "Shimla Manali Kullu",
    shortName: "SMK-1",
    slug: "shimla-manali-kullu",
    location: "Himachal Pradesh",
    price: 11999,
    duration: "06D/05N",
    category: "Himachal",
    order: 10,
    description: "Classic Himachal getaway to Ridge Shimla, Solang Valley Manali, Atal Tunnel, and river rafting & paragliding adventure in Kullu.",
    status: "published",
    heroImage: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=1200",
    images: [
      "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=1200"
    ],
    inclusions: [
      "Delhi to Delhi Volvo Bus / Tempo Traveller",
      "5 Nights Hotel Stay",
      "Breakfast & Dinner",
      "Solang Valley & Atal Tunnel excursion"
    ],
    exclusions: ["Rafting & Paragliding charges", "GST (5%)"],
    availableDates: [
      { date: "2026-05-05", capacity: 35 },
      { date: "2026-05-20", capacity: 35 },
      { date: "2026-06-10", capacity: 35 }
    ],
    variants: [
      { location: "Delhi to Delhi", duration: "06D/05N", discountedPrice: 11999 },
      { location: "Ahmedabad to Ahmedabad", duration: "08D/07N", discountedPrice: 14499 }
    ]
  }
];

async function seedAll() {
  console.log('🌱 Feeding extracted trips into database...');
  for (const t of tripsToFeed) {
    const existing = await prisma.trip.findFirst({
      where: {
        OR: [
          { slug: t.slug },
          { shortName: t.shortName }
        ]
      }
    });

    if (existing) {
      const updated = await prisma.trip.update({
        where: { id: existing.id },
        data: {
          ...t,
          shortName: t.shortName,
          order: t.order,
          status: 'published',
          tenantId: 'default'
        }
      });
      console.log(`✅ Updated trip [${updated.shortName}]: ${updated.title}`);
    } else {
      const created = await prisma.trip.create({
        data: {
          ...t,
          shortName: t.shortName,
          order: t.order,
          status: 'published',
          tenantId: 'default'
        }
      });
      console.log(`🎉 Created new trip [${created.shortName}]: ${created.title}`);
    }
  }

  const all = await prisma.trip.findMany({
    orderBy: { order: 'asc' },
    select: { id: true, shortName: true, title: true, price: true, duration: true, order: true }
  });
  console.log(`\n✨ Database feeding complete! Total active trips in DB: ${all.length}`);
  console.table(all);
}

seedAll()
  .catch(err => console.error('❌ Error feeding trips:', err))
  .finally(() => prisma.$disconnect());
