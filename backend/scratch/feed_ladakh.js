const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ladakhTripBase = {
  location: "Ladakh",
  price: 19999,
  duration: "7 Days / 6 Nights",
  description: "High Passes • Double-Humped Camels • Last Indian Village. A classic Ladakh bike journey. Ride through the highest motorable road at Khardung La (18,380 ft), visit the desert sand dunes of Hunder in Nubra, drive to Turtuk on the Baltistan border, and gaze at the blue waters of Pangong Lake.",
  category: "Bike Expedition",
  difficulty: "hard",
  status: "published",
  isActive: true,
  heroImage: "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=2000",
  images: [
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800"
  ],
  route: [
    { label: "Leh", icon: "plane" },
    { label: "Nubra Valley", icon: "car" },
    { label: "Turtuk", icon: "car" },
    { label: "Pangong Lake", icon: "car" },
    { label: "Leh", icon: "car" }
  ],
  highlights: [
    "Confluence of Indus & Zanskar (Sangam)",
    "Magnetic Hill & Gurudwara Pathar Sahib",
    "Khardung La Pass (18,380 ft)",
    "Maitreya Buddha & Diskit Monastery",
    "Balti Village Exploration at Turtuk",
    "Sunset and stargazing at Pangong Lake",
    "Chang La Pass (17,800 ft)"
  ],
  inclusions: [
    "Accommodations for 06 Nights in Hotels along with Camps/Cottages and Homestays on Triple/Quad sharing Basis",
    "All meals mentioned in the itinerary (6 Breakfast & 6 Dinner)",
    "Bike Rent for 5 Days (Leh to Leh) (Himalayan 411 CC)",
    "Fuel for the bike as per itinerary",
    "Mechanical & Luggage Backup vehicle (MUV/Traveler/Bolero Camper)",
    "24X7 customer support by trip captain",
    "All inner line permits for the trip",
    "Riding Jacket, Helmet, Gloves, and Knee Pads",
    "First aid kit & Oxygen Cylinder in backup vehicle",
    "Complementary Bonfire Night",
    "Group Pickup and Drop Facilities from Leh Airport",
    "RE mechanic with spare parts enroute"
  ],
  exclusions: [
    "5% GST",
    "Early check-in at the hotel",
    "Any personal expenses or shopping",
    "Additional accommodation/food costs incurred due to travel delays",
    "Cost Of Any Spare Part used due to accidental damage when bike is with rider",
    "Cost to transfer or tow bike if dropped on the way",
    "Vehicle servicing or maintenance cost",
    "Any lunch and other meals not mentioned in inclusions",
    "Airfare / Rail fare to Leh",
    "Parking and monument entry fees during sightseeing",
    "Additional Costs due to Flight Cancellations, Landslides, Roadblocks, and natural calamities"
  ],
  availableDates: [
    { date: "2026-05-09", capacity: 15 }, { date: "2026-05-23", capacity: 15 },
    { date: "2026-06-06", capacity: 15 }, { date: "2026-06-20", capacity: 15 },
    { date: "2026-07-04", capacity: 15 }, { date: "2026-07-18", capacity: 15 },
    { date: "2026-08-04", capacity: 15 }, { date: "2026-08-18", capacity: 15 },
    { date: "2026-09-05", capacity: 15 }, { date: "2026-09-26", capacity: 15 }
  ],
  variants: [
    { location: "RE Himalayan (Solo Rider)", originalPrice: 29999, discountedPrice: 24999 },
    { location: "RE Himalayan (With Pillion)", originalPrice: 24999, discountedPrice: 19999 }
  ],
  addons: [
    { name: "Double Sharing Upgrade", rate: 2500, description: "Upgrade to double sharing room for the entire trip." }
  ],
  accommodations: [
    { name: "Standard Leh Hotel", location: "Leh", nights: "3 Nights" },
    { name: "Nubra Valley Camps", location: "Nubra Valley", nights: "2 Nights" },
    { name: "Pangong Lakeside Camps", location: "Pangong Lake", nights: "1 Night" }
  ],
  popupDetails: {
    carry: [
      { label: "Clothing", val: "Thermal inners, heavy winter jacket, woolen sweater, gloves, raincoat, woolen socks" },
      { label: "Essentials", val: "Sunglasses (UV protected), sunscreen SPF 50+, lip balm, personal medication, power bank" }
    ],
    gears: [
      {
        category: "Provided Riding Gears",
        items: [
          { item: "Riding Jacket", price: "Free" },
          { item: "Helmet", price: "Free" },
          { item: "Knee Pads & Gloves", price: "Free" },
          { item: "RE Himalayan Bike & Fuel", price: "Included" }
        ]
      }
    ],
    cancellation: [
      { label: "Before 45 days", val: "80% refund" },
      { label: "Before 30 days", val: "50% refund" },
      { label: "Before 15 days", val: "25% refund" },
      { label: "Within 15 days", val: "No refund" },
      { label: "Advance booking amount", val: "Non-refundable" }
    ],
    terms: [
      "Only people of age 12 to 35 years are allowed",
      "5% GST applicable on all packages",
      "Any accidental damage cost to the bike is to be borne by the rider directly."
    ],
    etiquette: [
      { title: "Acclimatization", desc: "Strictly rest on Day 1 to avoid AMS." },
      { title: "Eco-ride", desc: "Do not throw litter or plastic bottles near the lakes." }
    ],
    showRentedGears: true
  },
  faqs: [
    { question: "Why is the first day strictly for acclimatization?", answer: "Leh is located at 11,500 ft. Adapting to the high altitude is crucial to prevent Acute Mountain Sickness (AMS). Rest, hydration, and minimal activity on Day 1 are mandatory." },
    { question: "Is fuel included in the package?", answer: "Yes, fuel for the bike as per the standard itinerary is included in the package." },
    { question: "Do you provide medical support?", answer: "Yes, we carry a first aid kit and have an oxygen cylinder available in our backup vehicle 24/7." },
    { question: "Is there electricity at Nubra and Pangong Camps?", answer: "Due to the remote location and high altitude, electricity at Nubra and Pangong camps is only available for a few hours (usually 7 PM to 11 PM)." }
  ],
  itinerary: [
    {
      day: 1,
      title: "Leh Arrival - Acclimatization Day",
      description: "• Welcome to the land of high passes! Meet the group at Leh Airport\n• Transfer to hotel via private vehicle (pickup from 9 AM to 12 PM)\n• Complete rest and acclimatization to high altitude\n• Stay hydrated and avoid physical exertion\n• Evening briefing about biking rules by the trip captain",
      stay: "Hotel stay in Leh",
      meals: "Dinner Included"
    },
    {
      day: 2,
      title: "Leh Local Sightseeing (50-60 KMS)",
      description: "• Post breakfast, bike allocation and briefing session\n• Ride to Sangam, the confluence of Indus and Zanskar rivers\n• Visit the holy Gurudwara Pathar Sahib\n• Explore the gravity-defying Magnetic Hill\n• Visit the historic Hall of Fame and the peaceful Shanti Stupa\n• Spend the evening shopping or café hopping at Leh Market",
      stay: "Hotel stay in Leh",
      meals: "Breakfast & Dinner Included"
    },
    {
      day: 3,
      title: "Leh to Nubra Valley (130 KMS)",
      description: "• Ride via the world-famous Khardung La Pass (18,380 ft)\n• Visit Diskit Monastery and see the giant 106-foot Maitreya Buddha\n• Explore Hunder Sand Dunes and enjoy a double-humped camel ride (optional)\n• Check in to Nubra Valley camps\n• Hot bucket of water provided for freshening up in morning",
      stay: "Camp stay in Nubra valley",
      meals: "Breakfast & Dinner Included"
    },
    {
      day: 4,
      title: "Nubra to Turtuk (170 KMS)",
      description: "• Epic ride to Turtuk, the last village on the Indo-Pak border\n• Walk through the beautiful Balti village and apricot orchards\n• Visit the Shyok River and Balti Museum\n• Return to Nubra Valley camps by evening",
      stay: "Camp stay in Nubra valley",
      meals: "Breakfast & Dinner Included"
    },
    {
      day: 5,
      title: "Nubra Valley to Pangong (180 KMS)",
      description: "• Ride to Pangong Lake via the Shyok route, enjoying scenic river vistas\n• Arrive at Pangong Lake (14,270 ft) and explore the lakeside\n• Witness the beautiful sunset and changing colors of the lake\n• Cozy camping stay near Pangong Lake under a clear starry night",
      stay: "Camp stay near Pangong",
      meals: "Breakfast & Dinner Included"
    },
    {
      day: 6,
      title: "Pangong to Leh (150 KMS)",
      description: "• Capture the freezing early morning views of Pangong Lake\n• Ride back to Leh via the challenging Chang La Pass (17,800 ft)\n• Visit Shey Palace and the grand Thiksey Monastery enroute (subject to time)\n• Reach Leh, check in, and enjoy a farewell dinner",
      stay: "Hotel stay in Leh",
      meals: "Breakfast & Dinner Included"
    },
    {
      day: 7,
      title: "Departure to Leh Airport | Tour Ends",
      description: "• Final breakfast with the group and checkout\n• Drop off at Leh Airport (fixed drop at 9:00 AM)\n• Tour concludes with high-altitude memories and new friendships",
      stay: "",
      meals: "Breakfast Included"
    }
  ],
  stickyCardPrice: 19999,
  stickyCardLabel: "per person",
  tenantId: "default",
  order: 3
};

async function main() {
  console.log("🚀 Restoring/seeding ONLY Leh Ladakh trip...");

  const tripsToUpsert = [
    {
      ...ladakhTripBase,
      title: "Leh Ladakh Bike Trip with Turtuk — 7D/6N",
      slug: "leh-ladakh-bike-trip-with-turtuk-7d-6n",
      shortName: "Leh Ladakh Bike Expedition 2026",
    },
    {
      ...ladakhTripBase,
      title: "Leh Ladakh Bike Expedition 2026",
      slug: "leh-ladakh-bike-expedition-2026",
      shortName: null,
    }
  ];

  for (const trip of tripsToUpsert) {
    const upserted = await prisma.trip.upsert({
      where: { slug: trip.slug },
      update: trip,
      create: trip
    });
    console.log(`✅ Upserted Ladakh trip: "${upserted.title}" (slug: "${upserted.slug}")`);
  }

  console.log("🎉 Seeding of Ladakh trip complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
