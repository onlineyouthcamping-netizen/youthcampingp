const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Feeding Bhrigu Lake Trek Trip...')
  
  const tripData = {
    title: "Experience Bhrigu Lake Trek with Manali, Kasol & Amritsar",
    slug: "bhrigu-lake-trek-manali-kasol-amritsar",
    location: "Himachal Pradesh",
    price: 12999,
    duration: "9 Days / 8 Nights",
    description: "Bhrigu Lake Trek with Manali, Kasol & Amritsar is a 9D/8N Himalayan backpacking adventure combining spiritual vibes, scenic valleys & high-altitude trekking.",
    category: "backpacking",
    status: "published",
    isActive: true,
    tenantId: "default",
    heroImage: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2070", // High altitude lake
    difficulty: "Moderate",
    ageLimit: "15–35 years",
    maxAltitude: "14,300 ft",
    tripType: "Backpacking + Trekking + Community Trip",
    startEnd: "Ahmedabad to Ahmedabad",
    pickupMode: "Train + Tempo Traveller",
    stickyCardPrice: 12999,
    stickyCardLabel: "Bestseller",
    
    itinerary: [
      { day: 1, title: "Train Journey to Jalandhar", description: "Departure from Ahmedabad. Group introduction. Overnight train journey." },
      { day: 2, title: "Amritsar Exploration & Drive to Kasol", description: "Visit Wagah Border Ceremony, Golden Temple, and Amritsar Market. Overnight drive to Kasol." },
      { day: 3, title: "Kasol & Parvati Valley", description: "Reach Kasol campsite. Chalal Village trek. Visit Manikaran Sahib. Bonfire & music night." },
      { day: 4, title: "Start Bhrigu Lake Trek", description: "Drive to base village. Begin trek to base camp (~10,000 ft). Scenic meadow views." },
      { day: 5, title: "Bhrigu Lake Summit Day", description: "Trek to 14,300 ft. Snow trails (seasonal). Explore Bhrigu Lake. Summit celebration." },
      { day: 6, title: "Trek Down & Manali Sightseeing", description: "Descend trek. Visit Solang Valley, Atal Tunnel, Hadimba Temple & Mall Road." },
      { day: 7, title: "Adventure Activities", description: "River Rafting (Included). Paragliding (Optional). Evening drive to Jalandhar." },
      { day: 8, title: "Return Train Journey", description: "Board train. Group games & memories." },
      { day: 9, title: "Arrival", description: "Reach your city. Trip ends with memories ❤️" }
    ],
    
    inclusions: [
      "Tempo Traveller / Cab for all transfers",
      "Round-trip train tickets",
      "Stay: Kasol, Manali, Bhrigu Camps",
      "Meals: 5 Breakfast, 5 Lunch, 5 Dinner",
      "Bhrigu Lake Trek (Certified guides)",
      "Bonfire & music night",
      "River rafting",
      "Trip Captain",
      "Sightseeing as per itinerary",
      "Toll, parking & driver charges"
    ],
    
    exclusions: [
      "Personal expenses",
      "Paragliding & paid adventure activities",
      "Entry tickets & permits",
      "Snow gear / pony rides",
      "Heater charges",
      "Meals not mentioned",
      "Intercity transfers (if joining from other cities)",
      "5% GST"
    ],

    faqs: [
      { question: "Is this trip beginner-friendly?", answer: "Yes, but basic fitness is required for trekking." },
      { question: "Is trekking compulsory?", answer: "Yes, Bhrigu Lake trek is the main highlight." },
      { question: "What about safety?", answer: "Certified guides + trained drivers + group support." },
      { question: "What kind of stays?", answer: "Hotels + cottages + high-altitude camps." }
    ],

    highlights: [
      "Bhrigu Lake Trek (14,300 ft)",
      "Kasol & Parvati Valley",
      "Manali & Solang Valley",
      "Atal Tunnel",
      "Golden Temple",
      "Wagah Border Ceremony",
      "Chalal Village Trek"
    ],

    availableDates: [
      { date: "2026-04-25", capacity: 30, bookedCount: 0 },
      { date: "2026-05-02", capacity: 30, bookedCount: 0 },
      { date: "2026-05-09", capacity: 30, bookedCount: 0 },
      { date: "2026-05-17", capacity: 30, bookedCount: 0 },
      { date: "2026-05-23", capacity: 30, bookedCount: 0 },
      { date: "2026-05-30", capacity: 30, bookedCount: 0 },
      { date: "2026-06-06", capacity: 30, bookedCount: 0 },
      { date: "2026-06-13", capacity: 30, bookedCount: 0 },
      { date: "2026-06-20", capacity: 30, bookedCount: 0 },
      { date: "2026-06-27", capacity: 30, bookedCount: 0 },
      { date: "2026-07-04", capacity: 30, bookedCount: 0 },
      { date: "2026-07-11", capacity: 30, bookedCount: 0 }
    ],

    variants: [
      { location: "Ahmedabad", duration: "9D/8N", originalPrice: 14999, discountedPrice: 12999, image: "" },
      { location: "Vadodara / Surat", duration: "9D/8N", originalPrice: 15499, discountedPrice: 13499, image: "" },
      { location: "Mumbai / Pune", duration: "9D/8N", originalPrice: 15999, discountedPrice: 13999, image: "" }
    ],

    roomOptions: [
      { label: "Quad Sharing", priceDelta: 0 },
      { label: "Triple Sharing", priceDelta: 1000 },
      { label: "Double Sharing", priceDelta: 2000 }
    ],

    travelOptions: [
      { label: "Non-AC Sleeper Train", priceDelta: 0 },
      { label: "AC 3 Tier Train", priceDelta: 2000 }
    ]
  };

  try {
    await prisma.trip.upsert({
      where: { slug: tripData.slug },
      update: tripData,
      create: tripData
    });
    console.log('✅ Bhrigu Lake Trek Trip Seeded Successfully!');
  } catch (e) {
    console.error('❌ Failed to seed trip:', e.message);
  }

  await prisma.$disconnect();
}

seed();
