const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const tripData = {
  title: "Kasol, Manali & Amritsar Expedition",
  shortName: "Kasol Manali Amritsar",
  slug: "kasol-manali-amritsar-expedition-2026",
  route: [
    { label: "Ahmedabad", icon: "train" },
    { label: "Jalandhar", icon: "train" },
    { label: "Amritsar", icon: "car" },
    { label: "Kasol", icon: "car" },
    { label: "Kullu", icon: "car" },
    { label: "Manali", icon: "car" },
    { label: "Sissu", icon: "car" }
  ],
  pickupMode: "Ahmedabad to Jalandhar by Train | Rest by Tempo Traveller",
  location: "Himachal & Punjab",
  price: 11999,
  duration: "8 Nights 9 Days",
  category: "himalayan",
  description: "Explore the best of Himachal and Punjab with our specially curated Kasol, Manali & Amritsar Expedition. The journey starts with a train ride from Ahmedabad to Jalandhar, followed by a comfortable Tempo Traveller circuit through the mystical Parvati Valley, adventure-packed Kullu & Manali, and the serene Golden Temple in Amritsar.",
  heroImage: "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=2070&auto=format&fit=crop",
  images: [
    "https://images.unsplash.com/photo-1597037750734-450f6f406560?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599661046289-e318978505c1?q=80&w=2070&auto=format&fit=crop"
  ],
  highlights: [
    "Golden Temple", "Wagah Border", "Kasol Camping", "Chalal Trek", "Bijli Mahadev Trek", 
    "River Rafting", "Paragliding", "Solang Valley Snow", "Atal Tunnel Ride", "Sissu Lake", 
    "Jogini Waterfall", "Old Manali Cafes"
  ],
  attractions: [
    { name: "Golden Temple", image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c", slug: "golden-temple" },
    { name: "Wagah Border", image: "https://images.unsplash.com/photo-1590483734724-383b853b3178", slug: "wagah-border" },
    { name: "Kasol Riverside", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23", slug: "kasol-riverside" },
    { name: "Bijli Mahadev", image: "https://images.unsplash.com/photo-1599661046289-e318978505c1", slug: "bijli-mahadev" },
    { name: "Atal Tunnel", image: "https://images.unsplash.com/photo-1597037750734-450f6f406560", slug: "atal-tunnel" },
    { name: "Sissu Lake", image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c", slug: "sissu-lake" }
  ],
  activities: [
    { name: "River Rafting", image: "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6", slug: "river-rafting" },
    { name: "Paragliding", image: "https://images.unsplash.com/photo-1517400508447-f8dd518b86db", slug: "paragliding" },
    { name: "Camping", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4", slug: "camping" },
    { name: "Trekking", image: "https://images.unsplash.com/photo-1551632811-561732d1e306", slug: "trekking" }
  ],
  inclusions: [
    "Ahmedabad ↔ Jalandhar Train Tickets",
    "Tempo Traveller transfers for the entire circuit",
    "4-sharing stays",
    "Bonfire & music",
    "Trekking & adventure activities",
    "Meals: 5 Breakfasts, 5 Lunches, 4 Dinners",
    "Trip Captain",
    "8 KM River Rafting",
    "Toll & parking charges"
  ],
  exclusions: [
    "Personal expenses",
    "5% GST",
    "Double Sharing Extra: ₹1999 per person",
    "Paragliding charges (self-paid)",
    "Heater charges",
    "Snow suit rent",
    "Entry fees",
    "Pony rides",
    "Solang Valley activities",
    "4x4 vehicles for snow zones"
  ],
  itinerary: [
    { day: 1, title: "Ahmedabad to Jalandhar (Train)", activities: ["Meet representative at Ahmedabad station", "Overnight train journey starts"] },
    { day: 2, title: "Amritsar Arrival (TT Starts)", activities: ["Reach Jalandhar/Amritsar", "Tempo Traveller Pickup", "Wagah Border Ceremony", "Golden Temple", "Night Drive to Kasol"] },
    { day: 3, title: "Kasol & Parvati Valley Exploration", activities: ["Reach Kasol via TT", "Chalal Village hike", "Visit Manikaran Gurudwara", "Bonfire & Music"], stay: "Kasol Camps/Cottages" },
    { day: 4, title: "Bijli Mahadev Trek", activities: ["Early morning trek", "360° mountain views", "Drive to Kullu via TT"], stay: "Swiss Camp, Kullu" },
    { day: 5, title: "Adventure Day (Rafting & Paragliding)", activities: ["8 KM river rafting (included)", "Paragliding (self-paid)", "Drive to Manali via TT"], stay: "Manali Hotel/Cottage" },
    { day: 6, title: "Solang Valley, Atal Tunnel & Sissu", activities: ["Solang Valley snow activities", "Atal Tunnel crossing via TT", "Sissu Lake visit"], stay: "Manali Hotel/Cottage" },
    { day: 7, title: "Jogini Waterfall & Manali Sightseeing", activities: ["Jogini Waterfall Trek", "Old Manali & Mall Road", "Night drive to Jalandhar via TT"] },
    { day: 8, title: "Return Train Journey (Jalandhar to Ahmedabad)", activities: ["Board return train to Ahmedabad"] },
    { day: 9, title: "Arrival at Ahmedabad", activities: ["Reach home safely"] }
  ],
  availableDates: [
    { date: "2026-05-02" }, { date: "2026-05-09" }, { date: "2026-05-17" }, { date: "2026-05-23" }, { date: "2026-05-30" },
    { date: "2026-06-06" }, { date: "2026-06-13" }, { date: "2026-06-20" }, { date: "2026-06-27" },
    { date: "2026-07-04" }, { date: "2026-07-11" }, { date: "2026-07-18" }, { date: "2026-07-25" },
    { date: "2026-08-02" }, { date: "2026-08-09" }, { date: "2026-08-17" }, { date: "2026-08-23" }, { date: "2026-08-30" },
    { date: "2026-09-06" }, { date: "2026-09-13" }, { date: "2026-09-20" }, { date: "2026-09-27" },
    { date: "2026-10-04" }, { date: "2026-10-11" }, { date: "2026-10-18" }, { date: "2026-10-25" }
  ],
  variants: [
    { location: "Jalandhar", price: 11999 },
    { location: "Ahmedabad/Gandhinagar (3AC Train)", price: 14999 },
    { location: "Ahmedabad/Gandhinagar (Sleeper)", price: 12999 },
    { location: "Vadodara/Surat (Sleeper)", price: 13499 },
    { location: "Mumbai (Sleeper)", price: 13999 },
    { location: "Delhi (Without Amritsar)", price: 14999 }
  ],
  accommodations: [
    { name: "Kasol Camps", location: "Kasol", nights: "1 Night", type: "Camping", roomType: "Quad Sharing", meals: "Breakfast & Dinner", image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4" },
    { name: "Kullu Swiss Camps", location: "Kullu", nights: "1 Night", type: "Camp", roomType: "Quad Sharing", meals: "Breakfast & Dinner", image: "https://images.unsplash.com/photo-1537735319941-58e95d447465" },
    { name: "Manali Hotel", location: "Manali", nights: "2 Nights", type: "Hotel", roomType: "Quad Sharing", meals: "Breakfast & Dinner", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945" }
  ],
  faqs: [
    { question: "What should I carry?", answer: "Rucksack, Trekking shoes, Thermals, Winter jacket, Power bank, and original ID proof." }
  ],
  popupDetails: {
    title: "Summer Special Offer",
    content: "Book now and get a free adventure activity upgrade!",
    buttonText: "Inquire Now"
  },
  status: "published"
};

async function seed() {
  try {
    console.log("🚀 Starting trip feed...");
    const trip = await prisma.trip.upsert({
      where: { slug: tripData.slug },
      update: tripData,
      create: tripData,
    });
    console.log(`✅ Successfully fed trip: ${trip.title}`);
    console.log(`🔗 URL: /trips/${trip.slug}`);
  } catch (error) {
    console.error("❌ Feed failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
