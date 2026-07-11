/**
 * Seed a complete, release-ready trip: "Spiti Valley Expedition"
 * Idempotent: checks for existing slug before inserting.
 * Run: node scripts/seed_spiti_trip.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TRIP_DATA = {
  id: 'cmqoq9epp00005ve80ucqkke0',
  tenantId: 'default',
  title: 'Spiti Valley Expedition',
  shortName: 'Spiti',
  slug: 'spiti-valley-expedition',
  location: 'Himachal Pradesh',
  price: 18000,
  duration: '9 Days / 8 Nights',
  description: 'A breathtaking journey through the cold desert of Spiti Valley — crossing high mountain passes, visiting ancient monasteries, and staying in remote villages perched above 4000m.',
  category: 'himalayan',
  isActive: true,
  status: 'published',
  heroImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  images: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80'
  ],

  // --- DEPARTURE DATES ---
  availableDates: [
    { date: '2026-07-10', capacity: 16, spotsLeft: 12 },
    { date: '2026-07-25', capacity: 16, spotsLeft: 10 },
    { date: '2026-08-08', capacity: 16, spotsLeft: 14 },
    { date: '2026-08-22', capacity: 16, spotsLeft: 8 },
    { date: '2026-09-05', capacity: 16, spotsLeft: 16 },
    { date: '2026-09-19', capacity: 16, spotsLeft: 16 }
  ],

  // --- VARIANTS (city-wise pricing with deductions) ---
  variants: [
    { location: 'Delhi',     originalPrice: 18000, discountedPrice: 18000, skipDays: 0, pickupPoint: 'Majnu Ka Tilla, Delhi' },
    { location: 'Chandigarh', originalPrice: 18000, discountedPrice: 17000, skipDays: 0, pickupPoint: 'ISBT Chandigarh' },
    { location: 'Mumbai',    originalPrice: 18000, discountedPrice: 16500, skipDays: 1, pickupPoint: 'Bandra Terminus' },
    { location: 'Ahmedabad', originalPrice: 18000, discountedPrice: 17000, skipDays: 1, pickupPoint: 'Kalupur Railway Station' },
    { location: 'Direct Join', originalPrice: 18000, discountedPrice: 15500, skipDays: 2, pickupPoint: 'Kaza Bus Stand, Spiti' }
  ],

  // --- PICKUP CITIES (drives city selector in booking form) ---
  pickupCities: [
    { cityName: 'Delhi',      deductionAmount: 0,    skipDays: 0, pickupPoint: 'Majnu Ka Tilla, Delhi' },
    { cityName: 'Chandigarh', deductionAmount: 1000, skipDays: 0, pickupPoint: 'ISBT Chandigarh' },
    { cityName: 'Mumbai',     deductionAmount: 1500, skipDays: 1, pickupPoint: 'Bandra Terminus' },
    { cityName: 'Ahmedabad',  deductionAmount: 1000, skipDays: 1, pickupPoint: 'Kalupur Railway Station' },
    { cityName: 'Direct Join', deductionAmount: 2500, skipDays: 2, pickupPoint: 'Kaza Bus Stand, Spiti' }
  ],

  // --- DAY-WISE ITINERARY ---
  itinerary: [
    { day: 1, title: 'Delhi → Shimla (Overnight Drive)', location: 'Delhi / Shimla', stay: 'Hotel / Bus', meals: 'None', description: 'Board the expedition vehicle at Majnu Ka Tilla at 6 PM. Night drive to Shimla via NH-44.' },
    { day: 2, title: 'Shimla → Narkanda → Nako', location: 'Kinnaur', stay: 'Homestay', meals: 'Breakfast + Dinner', description: 'Drive through Kinnaur valley, cross Khab confluence, reach Nako village near Kinnaur-Spiti border.' },
    { day: 3, title: 'Nako → Tabo → Kaza', location: 'Spiti Valley', stay: 'Hotel', meals: 'Breakfast + Dinner', description: 'Visit the ancient Tabo Monastery (1000 years old), explore Dhankar Fort, arrive in Kaza.' },
    { day: 4, title: 'Kaza Acclimatization + Local Sightseeing', location: 'Kaza', stay: 'Hotel', meals: 'Breakfast + Dinner', description: 'Rest day. Visit Key Monastery, Kibber village (one of the world\'s highest motorable villages).' },
    { day: 5, title: 'Kaza → Chandratal Lake', location: 'Chandratal', stay: 'Campsite', meals: 'All Meals', description: 'Drive to the stunning Chandratal (Moon Lake) at 4,250m. Camp by the lakeshore under the stars.' },
    { day: 6, title: 'Chandratal → Kunzum Pass → Manali', location: 'Manali', stay: 'Hotel', meals: 'Breakfast + Dinner', description: 'Cross Kunzum Pass (4,590m), descend into Lahaul, drive to Manali.' },
    { day: 7, title: 'Manali Exploration', location: 'Manali', stay: 'Hotel', meals: 'Breakfast', description: 'Free day in Manali. Visit Hadimba Temple, Mall Road, and local markets.' },
    { day: 8, title: 'Manali → Chandigarh (Overnight Drive)', location: 'Chandigarh', stay: 'Bus', meals: 'None', description: 'Evening departure from Manali, overnight Volvo to Chandigarh.' },
    { day: 9, title: 'Chandigarh → Home', location: 'Chandigarh', stay: 'None', meals: 'None', description: 'Morning arrival at Chandigarh ISBT. Trip concludes. Safe travels!' }
  ],

  // --- HIGHLIGHTS ---
  highlights: [
    'Chandratal Lake (Moon Lake) at 4,250m',
    'Key Monastery – Spiti\'s largest Buddhist monastery',
    'Kunzum Pass (4,590m) – gateway to Spiti',
    'Kibber Village – one of the world\'s highest motorable villages',
    'Ancient Tabo Monastery (1000 years old)',
    'Dhankar Fort – perched above the confluence',
    'Camping under stars at Chandratal'
  ],

  inclusions: [
    'Accommodation (hotels + camping)',
    'All meals as per itinerary',
    'Transportation by private vehicle (Delhi-Kaza-Manali-Chandigarh)',
    'Experienced trip captain',
    'All permits and entry fees',
    'First aid and emergency support',
    'Bonfire evenings'
  ],

  exclusions: [
    'Personal travel insurance',
    'Airfare or train tickets to Delhi',
    'Personal expenses and tips',
    'Any activity costs not mentioned in inclusions',
    'GST (charged separately at 5%)'
  ],

  faqs: [
    { question: 'What is the fitness level required?', answer: 'Moderate fitness. No prior trekking experience needed, but you should be comfortable with long drives at high altitude.' },
    { question: 'When is the best time to visit Spiti?', answer: 'July to September is ideal — roads are open and weather is stable. Chandratal is accessible only from June to October.' },
    { question: 'Is altitude sickness a concern?', answer: 'Spiti crosses 4000m+. We include an acclimatization day in Kaza and our team is trained in altitude sickness management.' },
    { question: 'What is the cancellation policy?', answer: '60+ days: Full refund. 30-60 days: 50% refund. Under 30 days: No refund. Bookings can be transferred to another batch.' }
  ],

  // GST configuration — 5% on booking amount
  // (read by booking page as tripData.gstPercentage)
  // NOTE: gstPercentage is not a Prisma field; it's served via seo/customSections
  // The booking page falls back to 5% — we store it in stickyCardLabel convention
  stickyCardPrice: 5000,
  stickyCardLabel: 'Book for just ₹5,000',

  // SEO
  seo: {
    title: 'Spiti Valley Expedition 2026 | 9 Days Tour | YouthCamping',
    description: 'Join our 9-day Spiti Valley group expedition. Visit Chandratal Lake, Key Monastery, Kunzum Pass. Departures from Delhi, Mumbai, Ahmedabad.',
    keywords: 'spiti valley tour, spiti expedition 2026, chandratal lake, key monastery, kunzum pass, group trip spiti'
  },

  departureCity: 'Delhi',
  maxGroupSize: 16,
  difficulty: 'Moderate',
  ageLimit: '18-45',
  tripType: 'Group Tour',
  maxAltitude: '4590m (Kunzum Pass)',

  bookingUrl: null, // booking goes through /book?tripId=<id> on frontend
  order: 1
};

async function main() {
  const existing = await prisma.trip.findUnique({ where: { slug: TRIP_DATA.slug } });

  if (existing) {
    console.log(`\n⚠️  Trip "${TRIP_DATA.slug}" already exists (id: ${existing.id}). Updating...`);
    const updated = await prisma.trip.update({
      where: { slug: TRIP_DATA.slug },
      data: TRIP_DATA
    });
    console.log(`✅ Updated trip: ${updated.id} — "${updated.title}"`);
    console.log(`   slug: ${updated.slug}`);
    console.log(`   status: ${updated.status}`);
    console.log(`   availableDates count: ${updated.availableDates?.length ?? 0}`);
    console.log(`   variants count: ${updated.variants?.length ?? 0}`);
    console.log(`   itinerary days: ${updated.itinerary?.length ?? 0}`);
    return updated;
  }

  const trip = await prisma.trip.create({ data: TRIP_DATA });
  console.log(`\n✅ Created trip: ${trip.id} — "${trip.title}"`);
  console.log(`   slug: ${trip.slug}`);
  console.log(`   status: ${trip.status}`);
  console.log(`   availableDates count: ${trip.availableDates?.length ?? 0}`);
  console.log(`   variants count: ${trip.variants?.length ?? 0}`);
  console.log(`   itinerary days: ${trip.itinerary?.length ?? 0}`);
  return trip;
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Error:', e.message);
    prisma.$disconnect();
    process.exit(1);
  });
