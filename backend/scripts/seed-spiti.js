const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Feeding Spiti Valley Full Circuit Trip...')
  
  const tripData = {
    title: "Spiti Valley Full Circuit (Chandratal Lake)",
    slug: "spiti-valley-full-circuit-chandratal-lake",
    location: "Himachal Pradesh",
    price: 21499,
    duration: "11 Days / 10 Nights",
    description: "Experience the ultimate Himalayan road trip through the Spiti Valley Full Circuit. From the last village of India to the magical Moon Lake (Chandratal), this 11-day journey is a mix of spirituality, extreme altitudes, and breathtaking landscapes.",
    category: "backpacking",
    status: "published",
    isActive: true,
    tenantId: "default",
    heroImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=2070", // Spiti landscape
    difficulty: "Moderate",
    ageLimit: "15–35 years",
    maxAltitude: "15,050 ft (Komic)",
    tripType: "Group / Community",
    startEnd: "Ahmedabad to Ahmedabad",
    pickupMode: "Train + Tempo Traveller",
    stickyCardPrice: 21499,
    stickyCardLabel: "Grand Circuit",
    
    itinerary: [
      { day: 1, title: "Ahmedabad → Chandigarh (Train)", description: "Overnight train journey from Ahmedabad. Group bonding and station food stops." },
      { day: 2, title: "Chandigarh → Shimla", description: "Arrival in Chandigarh (~8 AM). Scenic road trip to Shimla. Mall Road exploration in the evening. Stay: Hotel (Shimla)." },
      { day: 3, title: "Shimla → Chitkul", description: "Drive through the Kinnaur Valley. Visit the last Indian village (Chitkul). Stay: Cottage / Hotel (Chitkul/Sangla)." },
      { day: 4, title: "Chitkul → Tabo (via Nako Lake)", description: "Visit Khab (Spiti + Sutlej confluence) and Nako Lake. Experience the transition into the Himalayan desert. Stay: Homestay (Tabo)." },
      { day: 5, title: "Tabo → Dhankar → Kaza", description: "Explore the 1000-year-old Tabo Monastery and Dhankar Village with its cliff monastery. Reach Kaza, the HQ of Spiti. Stay: Homestay (Kaza)." },
      { day: 6, title: "Kaza Local Sightseeing", description: "Visit Key Monastery, Komic (Highest village ~15,050 ft), Langza (Buddha statue + fossils), and Hikkim (Highest post office). Stay: Homestay (Kaza)." },
      { day: 7, title: "Kaza → Kibber → Chicham → Chandratal", description: "Visit Kibber Village and Chicham Bridge (Asia’s highest). Reach the magical Chandratal Lake ('Moon Lake'). Stay: Camps (Chandratal / Losar)." },
      { day: 8, title: "Chandratal → Manali", description: "Drive through Chhatru, Atal Tunnel, and Solang Valley. Experience one of the world's most adventurous roads. Stay: Cottage (Manali)." },
      { day: 9, title: "Manali Exploration", description: "Hadimba Temple, Mall Road, and Old Manali. Paragliding/Rafting (Optional). Night travel to Jalandhar." },
      { day: 10, title: "Jalandhar → Ahmedabad (Train)", description: "Return train journey with group fun and content sharing." },
      { day: 11, title: "Arrival Ahmedabad", description: "Rajasthan food stops and trip ends with beautiful memories." }
    ],
    
    inclusions: [
      "Train tickets (round trip)",
      "Tempo Traveller / Taxi for all local transfers",
      "Stay in Hotels, Cottages & Homestays (3/4 sharing)",
      "Meals: 7 Breakfast + 6 Dinner (Pure Veg)",
      "Bonfire + Music in Manali",
      "Trekking & Local Sightseeing",
      "Trip Captain for group support",
      "Oxygen support for high altitudes",
      "Toll, Parking & State Tax",
      "24×7 Ground Support"
    ],
    
    exclusions: [
      "Personal expenses",
      "Adventure activities (Paragliding, rafting)",
      "Entry fees to monuments/monasteries",
      "Heater charges in stays",
      "Snow suits / Pony rides",
      "Natural calamity costs (Landslides, etc.)",
      "Extra meals not mentioned",
      "Inter-station transfers",
      "5% GST"
    ],

    faqs: [
      { question: "Is this trip beginner-friendly?", answer: "Yes, but be prepared for high altitudes and long drives." },
      { question: "What about Chandratal safety?", answer: "Chandratal depends on weather; we reroute to Kalpa if roads are closed." },
      { question: "What kind of stays?", answer: "A mix of hotels, cottages, and authentic Spitian homestays." }
    ],

    highlights: [
      "Last Indian Village (Chitkul)",
      "Key Monastery",
      "Highest Post Office (Hikkim)",
      "Moon Lake (Chandratal)",
      "Chicham Bridge (Asia's Highest)",
      "Atal Tunnel & Solang Valley"
    ],

    availableDates: [
      { date: "2026-06-02", capacity: 30, bookedCount: 0 },
      { date: "2026-06-09", capacity: 30, bookedCount: 0 },
      { date: "2026-06-16", capacity: 30, bookedCount: 0 },
      { date: "2026-06-23", capacity: 30, bookedCount: 0 },
      { date: "2026-06-30", capacity: 30, bookedCount: 0 },
      { date: "2026-07-07", capacity: 30, bookedCount: 0 },
      { date: "2026-07-14", capacity: 30, bookedCount: 0 },
      { date: "2026-07-21", capacity: 30, bookedCount: 0 },
      { date: "2026-07-28", capacity: 30, bookedCount: 0 },
      { date: "2026-08-04", capacity: 30, bookedCount: 0 },
      { date: "2026-08-11", capacity: 30, bookedCount: 0 },
      { date: "2026-08-18", capacity: 30, bookedCount: 0 },
      { date: "2026-08-25", capacity: 30, bookedCount: 0 },
      { date: "2026-09-01", capacity: 30, bookedCount: 0 },
      { date: "2026-09-08", capacity: 30, bookedCount: 0 },
      { date: "2026-09-15", capacity: 30, bookedCount: 0 },
      { date: "2026-09-22", capacity: 30, bookedCount: 0 },
      { date: "2026-09-29", capacity: 30, bookedCount: 0 }
    ],

    variants: [
      { location: "Ahmedabad (Sleeper)", duration: "11D/10N", originalPrice: 23499, discountedPrice: 21499, image: "" },
      { location: "Ahmedabad (3AC)", duration: "11D/10N", originalPrice: 25499, discountedPrice: 23499, image: "" },
      { location: "Chandigarh (No Train)", duration: "11D/10N", originalPrice: 21999, discountedPrice: 19999, image: "" }
    ],

    roomOptions: [
      { label: "Quad Sharing", priceDelta: 0 },
      { label: "Triple Sharing", priceDelta: 1500 },
      { label: "Double Sharing", priceDelta: 3000 }
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
    console.log('✅ Spiti Valley Full Circuit Trip Seeded Successfully!');
  } catch (e) {
    console.error('❌ Failed to seed trip:', e.message);
  }

  await prisma.$disconnect();
}

seed();
