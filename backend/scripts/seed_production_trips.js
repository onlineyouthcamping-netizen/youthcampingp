const mongoose = require('mongoose');
require('dotenv').config();
const Trip = require('./src/models/Trip');

const TRIPS = [
  {
    title: "Kerala Group Trip 2026",
    slug: "kerala-group-trip-2026",
    description: "Backwaters • Waterfalls • Beaches • Hills. Experience the 'God's Own Country' with our curated 7-day journey from the colonial charm of Kochi to the misty hills of Munnar, the wildlife of Thekkady, the serene backwaters of Alleppey, and the pristine beaches of Kovalam, ending at the southernmost tip of India, Kanyakumari.",
    location: "Kerala",
    price: 19799,
    duration: "7 Days / 6 Nights",
    category: "Backpacking",
    difficulty: "easy",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1580191947416-62d35a55e71d?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Kochi", icon: "plane" },
      { label: "Munnar", icon: "car" },
      { label: "Thekkady", icon: "car" },
      { label: "Alleppey", icon: "car" },
      { label: "Kovalam", icon: "car" },
      { label: "Kanyakumari", icon: "car" },
      { label: "Kochi", icon: "car" }
    ],
    highlights: [
      "Valara & Cheeyappara Waterfalls",
      "Spice Plantation Visit in Munnar",
      "Periyar Lake Cruise in Thekkady",
      "Traditional Kathakali & Kalaripayattu Performance",
      "Houseboat Backwater Experience in Alleppey",
      "Jatayu Earth Center & Varkala Beach",
      "Azhimala Shiva Temple (Tallest in Kerala)",
      "Vivekananda Rock Memorial, Kanyakumari"
    ],
    inclusions: [
      "AC Vehicle transfers for the entire trip",
      "Hotels + Optional Houseboat stays",
      "6 Breakfast + 6 Dinner (Veg)",
      "Sightseeing as per itinerary",
      "All driver charges, Toll & Parking",
      "Cultural shows (Kathakali/Kalaripayattu)",
      "Virtual Tour Manager support"
    ],
    exclusions: [
      "Flights / Train tickets to Kochi",
      "Entry tickets to monuments/parks",
      "Houseboat / Shikara cruise charges",
      "Lunch & Personal expenses",
      "Any unforeseen costs due to weather/strikes"
    ],
    itinerary: [
      { day: 1, title: "Kochi → Munnar", description: "Arrival at Kochi. Scenic drive to Munnar. Visit Valara and Cheeyappara Waterfalls.", location: "Munnar", stay: "Hotel", meals: "Dinner" },
      { day: 2, title: "Munnar Sightseeing", description: "Explore Mattupetty Dam, Echo Point, and Kundala Dam. Visit Eravikulam National Park.", location: "Munnar", stay: "Hotel", meals: "Breakfast + Dinner" },
      { day: 3, title: "Munnar → Thekkady", description: "Transfer to Thekkady. Optional Periyar Lake cruise. Evening Kathakali and Kalaripayattu show.", location: "Thekkady", stay: "Hotel", meals: "Breakfast + Dinner" },
      { day: 4, title: "Thekkady → Alleppey", description: "Drive to Alleppey for the backwater experience. Optional Houseboat or Shikara ride.", location: "Alleppey", stay: "Hotel/Houseboat", meals: "Breakfast + Dinner" },
      { day: 5, title: "Alleppey → Kovalam", description: "Visit Jatayu Earth Center and relax at Varkala Beach.", location: "Kovalam", stay: "Hotel", meals: "Breakfast + Dinner" },
      { day: 6, title: "Kanyakumari Day Trip", description: "Visit Azhimala Shiva Temple, Vivekananda Rock Memorial and Thiruvalluvar Statue.", location: "Kanyakumari", stay: "Hotel (Kovalam)", meals: "Breakfast + Dinner" },
      { day: 7, title: "Kovalam → Kochi", description: "Visit Padmanabhaswamy Temple. Return journey to Kochi for departure.", location: "Kochi", meals: "Breakfast" }
    ],
    availableDates: [
      { date: "2026-06-01", capacity: 20 }, { date: "2026-07-05", capacity: 20 }, { date: "2026-08-05", capacity: 20 }
    ],
    variants: [
      { location: "Triple Sharing", originalPrice: 24999, discountedPrice: 19799 },
      { location: "Double Sharing", originalPrice: 28999, discountedPrice: 22999 }
    ],
    addons: [
      { name: "Houseboat (Basic)", rate: 999, description: "Day cruise in backwaters." },
      { name: "Houseboat (Premium)", rate: 2499, description: "Luxury overnight stay." }
    ],
    accommodations: [
      { name: "Hill View Resort", location: "Munnar", nights: "2 Nights" },
      { name: "Wildlife Lodge", location: "Thekkady", nights: "1 Night" },
      { name: "Backwater Retreat", location: "Alleppey", nights: "1 Night" },
      { name: "Beachside Hotel", location: "Kovalam", nights: "2 Nights" }
    ],
    popupDetails: {
      carry: [
        { label: "Clothing", val: "Light cottons, Jacket for Munnar, Beachwear" },
        { label: "Essentials", val: "Sunscreen, Sunglasses, Powerbank, ID Proof" }
      ]
    }
  },
  {
    title: "Spiti Valley Road Trip (From Ahmedabad)",
    slug: "spiti-valley-road-trip-ahmedabad",
    description: "Desert Mountains • Chandratal • High Altitude Adventure. A full circuit journey from Ahmedabad via Chandigarh and Manali to the heart of Spiti. Experience the raw beauty of the Himalayas at 15,000 ft.",
    location: "Spiti Valley",
    price: 24999,
    duration: "11 Days / 10 Nights",
    category: "Road Trip",
    difficulty: "hard",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Ahmedabad", icon: "train" },
      { label: "Chandigarh", icon: "car" },
      { label: "Manali", icon: "car" },
      { label: "Kaza", icon: "car" },
      { label: "Chandratal", icon: "car" },
      { label: "Manali", icon: "car" }
    ],
    highlights: [
      "Kunzum Pass (15,000 ft)",
      "Key Monastery Exploration",
      "Hikkim - Highest Post Office",
      "Langza - Fossil Village",
      "Chandratal Lake Camping"
    ],
    inclusions: [
      "Train journey from Ahmedabad (if selected)",
      "All transfers in AC/Local Vehicles",
      "Stay in Hotels, Camps & Homestays",
      "Breakfast + Dinner included",
      "Trip Captain support"
    ],
    exclusions: [
      "Lunch & Personal expenses",
      "Entry fees to monasteries",
      "Adventure activities"
    ],
    itinerary: [
      { day: 1, title: "Ahmedabad → Chandigarh", description: "Start your journey from Ahmedabad by train. Group meetup and introduction." },
      { day: 3, title: "Chandigarh → Manali", description: "Scenic mountain drive to Manali. Overnight stay." },
      { day: 4, title: "Manali Local + Acclimatization", description: "Visit Solang Valley and Atal Tunnel. Essential for high-altitude preparation." },
      { day: 5, title: "Manali → Kaza", description: "Enter Spiti Valley via Kunzum Pass. High altitude drive." },
      { day: 6, title: "Kaza Sightseeing", description: "Visit Key Monastery, Hikkim, and Langza." },
      { day: 7, title: "Kaza Local", description: "Visit Komic and explore Fossil village." },
      { day: 8, title: "Kaza → Chandratal", description: "Visit Chandratal Lake. Overnight camping experience." },
      { day: 9, title: "Chandratal → Manali", description: "Return via rough terrain. Stay in Manali." },
      { day: 10, title: "Return Journey", description: "Manali → Chandigarh → Ahmedabad." }
    ],
    availableDates: [
      { date: "2026-05-15", capacity: 15 }, { date: "2026-06-15", capacity: 15 }, { date: "2026-07-15", capacity: 15 }
    ],
    variants: [
      { location: "With Train (Ahmedabad)", originalPrice: 34999, discountedPrice: 24999 },
      { location: "Without Train (Chandigarh)", originalPrice: 26999, discountedPrice: 18999 }
    ],
    accommodations: [
      { name: "Mountain View Hotel", location: "Manali", nights: "2 Nights" },
      { name: "Spitian Homestay", location: "Kaza", nights: "3 Nights" },
      { name: "Lakeview Camps", location: "Chandratal", nights: "1 Night" }
    ],
    popupDetails: {
      carry: [
        { label: "Clothing", val: "Heavy woollens, Thermal wear, Windbreaker" },
        { label: "Health", val: "Acclimatization medicine, Sunblock, Lip balm" }
      ]
    }
  },
  {
    title: "Bhrigu Lake Trek with Manali, Kasol & Amritsar",
    slug: "bhrigu-lake-trek-manali-kasol-amritsar",
    description: "Trek • Mountains • Riverside • Culture. A perfect blend of high-altitude trekking to Bhrigu Lake (14,000 ft) and cultural exploration in Amritsar. Experience the best of Himachal and Punjab.",
    location: "Himachal & Punjab",
    price: 14999,
    duration: "10 Days / 9 Nights",
    category: "Trekking",
    difficulty: "moderate",
    status: "published",
    isActive: true,
    heroImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=2000",
    images: [
      "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1544735716-392fe2709496?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1597037750734-450f6f406560?auto=format&fit=crop&q=80&w=800"
    ],
    route: [
      { label: "Ahmedabad", icon: "train" },
      { label: "Manali", icon: "car" },
      { label: "Bhrigu Lake", icon: "hiking" },
      { label: "Kasol", icon: "car" },
      { label: "Amritsar", icon: "car" }
    ],
    highlights: [
      "Bhrigu Lake Trek (14,000 ft)",
      "Riverside camping in Kasol",
      "Golden Temple & Wagah Border visit",
      "Snow views at summit"
    ],
    inclusions: [
      "Travel from Ahmedabad/Delhi",
      "Trek permits and Camping gear",
      "Stay in Hotels & Camps",
      "Meals during the trek",
      "Expert Trip Leader"
    ],
    exclusions: [
      "Personal gear",
      "Lunch outside trekking",
      "Entry fees to monuments"
    ],
    itinerary: [
      { day: 1, title: "Ahmedabad → Delhi", description: "Start the journey via train journey." },
      { day: 3, title: "Delhi → Manali", description: "Overnight Volvo / Tempo Traveller journey." },
      { day: 4, title: "Manali Exploration", description: "Visit Hadimba Temple and Mall Road." },
      { day: 5, title: "Trek to Base Camp", description: "Drive to Gulaba and begin the trek to base camp." },
      { day: 6, title: "Bhrigu Lake Summit", description: "Reach the mystical Bhrigu Lake. Snow views in early season." },
      { day: 7, title: "Manali → Kasol", description: "Drive to Kasol. Riverside relaxation and cafe hopping." },
      { day: 8, title: "Kasol → Amritsar", description: "Travel to the spiritual city of Amritsar." },
      { day: 9, title: "Amritsar Sightseeing", description: "Golden Temple and Wagah Border ceremony." },
      { day: 10, title: "Return Journey", description: "Back to Delhi / Ahmedabad." }
    ],
    availableDates: [
      { date: "2026-05-10", capacity: 25 }, { date: "2026-06-10", capacity: 25 }, { date: "2026-07-10", capacity: 25 }
    ],
    variants: [
      { location: "With Ahmedabad Train", originalPrice: 22999, discountedPrice: 16999 },
      { location: "Join from Delhi", originalPrice: 19999, discountedPrice: 14999 }
    ],
    accommodations: [
      { name: "Standard Hotel", location: "Manali", nights: "1 Night" },
      { name: "Alpine Camps", location: "Trek", nights: "2 Nights" },
      { name: "Riverside Hostel", location: "Kasol", nights: "1 Night" },
      { name: "Heritage Hotel", location: "Amritsar", nights: "1 Night" }
    ],
    popupDetails: {
      carry: [
        { label: "Gear", val: "Trekking shoes, Warm jackets, Gloves, Thermals" },
        { label: "Bag", val: "Backpack (30-40L), Rain cover" }
      ]
    }
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const trip of TRIPS) {
      await Trip.findOneAndUpdate(
        { slug: trip.slug },
        trip,
        { upsert: true, new: true }
      );
      console.log(`✅ ${trip.title} updated with full details!`);
    }

    console.log('\n🌟 PRODUCTION SYNC SUCCESSFUL!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  }
}

seed();
