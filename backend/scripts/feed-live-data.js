const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./src/models/Trip');

// Common dynamic options for all trips to match the premium UI
const DEFAULT_TRAVEL = [
  { label: "Non-AC Sleeper Train", priceDelta: 0, description: "Budget friendly overnight journey in reserved sleeper class." },
  { label: "AC Sleeper Train", priceDelta: 2000, description: "Comfortable air-conditioned sleeper coach for a restful night." },
  { label: "Semi-Sleeper Volvo", priceDelta: 1500, description: "Luxury push-back seating with climate control and charging points." }
];

const DEFAULT_ROOMS = [
  { label: "Quad Sharing", priceDelta: 0 },
  { label: "Triple Sharing", priceDelta: 1000 },
  { label: "Double Sharing", priceDelta: 2500 }
];

const DEFAULT_ADDONS = [
  { name: "Rental Gear (Trekking Pole & Shoes)", rate: 500, description: "Professional grade gear for a safer trek.", minQuantity: 1, maxQuantity: 2 },
  { name: "Extra Meal Package", rate: 1200, description: "Includes lunch for all days of the trip.", minQuantity: 1, maxQuantity: 10 }
];

const trips = [
  {
    title: "Manali Kasol Amritsar Backpacking Trip",
    slug: "manali-kasol-amritsar-adventure-trip-140500",
    description: "Get ready for an unforgettable journey through Northern India! Begin with a train journey to Jalandhar. Explore cultural richness at Wagah Border and the serene Golden Temple in Amritsar. Next, venture to Kasol for riverside camping and immerse yourself in the vibrant Kasol market.",
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg",
    price: 11999,
    location: "Himachal & Punjab",
    duration: "8 Nights 9 Days",
    category: "Backpacking",
    images: [
      "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg",
      "https://images.unsplash.com/photo-1597037750734-450f6f406560",
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23"
    ],
    highlights: [
      "Wagah Border ceremony",
      "Golden Temple Amritsar & langar prasad",
      "Riverside camping in Kasol",
      "Manikaran Gurudwara hot springs",
      "Bijli Mahadev Trek (360° views)",
      "Atal Tunnel crossing",
      "River rafting in Kullu"
    ],
    inclusions: [
      "Train journey (Sleeper class)",
      "Tempo Traveller transfers",
      "Accommodation (Hotel/Camp)",
      "Breakfast & Dinner",
      "Trip coordinator",
      "Local sightseeing",
      "River rafting"
    ],
    exclusions: ["Personal expenses", "Entry tickets", "GST (5%)", "Travel Insurance"],
    availableDates: [
      { date: "2026-05-01", capacity: 99 },
      { date: "2026-05-15", capacity: 50 },
      { date: "2026-06-05", capacity: 99 },
      { date: "2026-06-20", capacity: 99 }
    ],
    variants: [
      { location: "Ahmedabad", duration: "11 Days", originalPrice: 15400, discountedPrice: 11999 },
      { location: "Delhi", duration: "7 Days", originalPrice: 13500, discountedPrice: 9999 },
      { location: "Surat", duration: "11 Days", originalPrice: 15800, discountedPrice: 12499 }
    ],
    travelOptions: DEFAULT_TRAVEL,
    roomOptions: DEFAULT_ROOMS,
    addons: DEFAULT_ADDONS,
    itinerary: [
      { day: 1, title: "Departure", location: "Home City", activities: ["Train Journey"], description: "Meet the team at the station." },
      { day: 2, title: "Amritsar Arrival", location: "Amritsar", activities: ["Wagah Border", "Golden Temple"], description: "Explore holy city." },
      { day: 3, title: "Kasol Vibe", location: "Kasol", activities: ["Parvati Valley walk"], description: "Riverside meditation." },
      { day: 4, title: "Manali Magic", location: "Manali", activities: ["Mall Road"], description: "Snowy peaks." }
    ],
    status: "published"
  },
  {
    title: "Winter Spiti Road Trip",
    slug: "winter-spiti-road-trip",
    description: "Spiti in winter is a world straight out of a postcard — blanketed in pristine white snow, frozen rivers, and towering peaks.",
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/862/062/b7cb9dc7ccc9fe863f0f009c4fe1746f/original/Website_Itinerary_Ohotos__2_.png",
    price: 19999,
    location: "Spiti Valley",
    duration: "9 Nights 10 Days",
    category: "Road Trip",
    images: [
      "https://vl-prod-static.b-cdn.net/system/images/000/862/062/b7cb9dc7ccc9fe863f0f009c4fe1746f/original/Website_Itinerary_Ohotos__2_.png",
      "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c"
    ],
    highlights: ["Frozen Spiti River", "Key Monastery in snow", "Hikkim (14k ft)", "Chandrataal in Winter", "Tibetan Homestays"],
    inclusions: ["All transfers via 4x4 or Tempo", "Homestays + Meals", "Permits", "Guide"],
    exclusions: ["GST", "Flight/Train to Chandigarh"],
    availableDates: [
      { date: "2026-10-10", capacity: 15 },
      { date: "2026-11-05", capacity: 15 }
    ],
    variants: [
      { location: "Chandigarh", duration: "8 Days", originalPrice: 24000, discountedPrice: 19999 },
      { location: "Delhi", duration: "10 Days", originalPrice: 28000, discountedPrice: 23999 }
    ],
    travelOptions: [
      { label: "Force Traveller", priceDelta: 0, description: "Classic mountain cruiser." },
      { label: "Luxury SUV (Innova)", priceDelta: 5000, description: "Maximum comfort on rough roads." }
    ],
    roomOptions: DEFAULT_ROOMS,
    status: "published"
  },
  {
    title: "Kedarnath Tungnath & Rishikesh Trip",
    slug: "kedarnath-trek-v2",
    description: "Sacred Chota Char Dham and Panch Kedar pilgrimage. Breathtaking views and spiritual peace at world's highest Shiva temple.",
    heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/748/925/95ce9359f68bd2d93dee6aa2e3a18d17/original/Untitled_design__11_.png",
    price: 16500,
    location: "Uttarakhand",
    duration: "5 Nights 6 Days",
    category: "Pilgrimage",
    highlights: ["Kedarnath Darshan", "Tungnath (highest Shiva temple)", "Chandrashila Summit", "Ganga Aarti"],
    availableDates: [
      { date: "2026-05-10", capacity: 99 },
      { date: "2026-05-25", capacity: 99 }
    ],
    variants: [
      { location: "Delhi", duration: "6 Days", originalPrice: 19500, discountedPrice: 16500 },
      { location: "Haridwar", duration: "5 Days", originalPrice: 17000, discountedPrice: 14000 }
    ],
    travelOptions: DEFAULT_TRAVEL,
    roomOptions: DEFAULT_ROOMS,
    itinerary: [
      { day: 1, title: "Rishikesh Arrival", location: "Rishikesh", activities: ["Temple visit"], description: "Holy dip." },
      { day: 2, title: "To Sonprayag", location: "Sonprayag", activities: ["Drive"], description: "Base camp." },
      { day: 3, title: "The Trek", location: "Kedarnath", activities: ["Trek"], description: "Spiritual climb." }
    ],
    status: "published"
  }
];

async function seed() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for live feed...");
    
    // We update rather than wipe, or wipe if preferred. 
    // User said 'feed', I'll clear first to make it a fresh import.
    await Trip.deleteMany({});
    console.log("Cleared existing database.");

    for (const t of trips) {
      await new Trip(t).save();
      console.log(`✅ Seeded: ${t.title}`);
    }

    console.log("\n🚀 DATABASE FEED COMPLETE!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
