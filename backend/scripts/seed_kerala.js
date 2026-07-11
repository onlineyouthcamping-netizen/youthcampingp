const mongoose = require('mongoose');
require('dotenv').config();
const Trip = require('./src/models/Trip');

const KERALA_TRIP = {
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
    {
      day: 1,
      title: "Kochi → Munnar",
      description: "Arrival at Kochi. Scenic drive to Munnar. Visit Valara and Cheeyappara Waterfalls. Enjoy the spice plantation visit.",
      location: "Munnar",
      stay: "Hotel in Munnar",
      meals: "Dinner",
      photos: ["https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?auto=format&fit=crop&q=80&w=800"]
    },
    {
      day: 2,
      title: "Munnar Sightseeing",
      description: "Explore Mattupetty Dam, Echo Point, and Kundala Dam. Visit Eravikulam National Park and the Rose Garden.",
      location: "Munnar",
      stay: "Hotel in Munnar",
      meals: "Breakfast + Dinner",
      photos: ["https://images.unsplash.com/photo-1590595906931-81f04f0ccebb?auto=format&fit=crop&q=80&w=800"]
    },
    {
      day: 3,
      title: "Munnar → Thekkady",
      description: "Transfer to Thekkady. Optional Periyar Lake cruise and Elephant interaction. Evening Kathakali and Kalaripayattu show.",
      location: "Thekkady",
      stay: "Hotel in Thekkady",
      meals: "Breakfast + Dinner",
      photos: ["https://images.unsplash.com/photo-1583253805413-5853f063a8a3?auto=format&fit=crop&q=80&w=800"]
    },
    {
      day: 4,
      title: "Thekkady → Alleppey",
      description: "Drive to Alleppey for the backwater experience. Enjoy an optional Houseboat or Shikara ride.",
      location: "Alleppey",
      stay: "Hotel / Houseboat in Alleppey",
      meals: "Breakfast + Dinner",
      photos: ["https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&q=80&w=800"]
    },
    {
      day: 5,
      title: "Alleppey → Kovalam",
      description: "Visit Jatayu Earth Center (World's largest bird sculpture). Relax at Varkala Beach before reaching Kovalam.",
      location: "Kovalam",
      stay: "Hotel in Kovalam",
      meals: "Breakfast + Dinner",
      photos: ["https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800"]
    },
    {
      day: 6,
      title: "Kanyakumari Day Trip",
      description: "Visit Azhimala Shiva Temple. Take a ferry to Vivekananda Rock Memorial and Thiruvalluvar Statue in Kanyakumari.",
      location: "Kovalam",
      stay: "Hotel in Kovalam",
      meals: "Breakfast + Dinner",
      photos: ["https://images.unsplash.com/photo-1580191947416-62d35a55e71d?auto=format&fit=crop&q=80&w=800"]
    },
    {
      day: 7,
      title: "Kovalam → Kochi",
      description: "Visit the holy Padmanabhaswamy Temple. Return journey to Kochi for departure.",
      location: "Kochi",
      meals: "Breakfast",
      photos: ["https://images.unsplash.com/photo-1602216056096-3c40cc0c9944?auto=format&fit=crop&q=80&w=800"]
    }
  ],
  availableDates: [
    // June 2026
    { date: "2026-06-01", capacity: 20 }, { date: "2026-06-08", capacity: 20 }, { date: "2026-06-15", capacity: 20 }, { date: "2026-06-22", capacity: 20 }, { date: "2026-06-29", capacity: 20 },
    // July 2026
    { date: "2026-07-05", capacity: 20 }, { date: "2026-07-12", capacity: 20 }, { date: "2026-07-19", capacity: 20 }, { date: "2026-07-26", capacity: 20 },
    // Aug to Jan (First 5th of each month for brevity)
    { date: "2026-08-05", capacity: 20 }, { date: "2026-09-05", capacity: 20 }, { date: "2026-10-05", capacity: 20 }, { date: "2026-11-05", capacity: 20 }, { date: "2026-12-05", capacity: 20 }, { date: "2027-01-05", capacity: 20 }
  ],
  variants: [
    { location: "Triple Sharing", originalPrice: 24999, discountedPrice: 19799 },
    { location: "Double Sharing", originalPrice: 28999, discountedPrice: 22999 }
  ],
  addons: [
    { name: "Houseboat (Basic)", rate: 999, description: "Day cruise in Alleppey backwaters." },
    { name: "Houseboat (Premium)", rate: 2499, description: "Luxury overnight stay in backwaters." },
    { name: "Extra Stay (Kochi)", rate: 999, description: "Additional night stay in Kochi." }
  ],
  accommodations: [
    { name: "Hill Resort", location: "Munnar", nights: "2 Nights", starRating: "3 Star", meals: "Breakfast & Dinner" },
    { name: "Nature Stay", location: "Thekkady", nights: "1 Night", starRating: "3 Star", meals: "Breakfast & Dinner" },
    { name: "Backwater Resort", location: "Alleppey", nights: "1 Night", starRating: "3 Star", meals: "Breakfast & Dinner" },
    { name: "Beach Resort", location: "Kovalam", nights: "2 Nights", starRating: "3 Star", meals: "Breakfast & Dinner" }
  ],
  stickyCardPrice: 19799,
  stickyCardLabel: "per person"
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Trip.findOneAndUpdate(
      { slug: KERALA_TRIP.slug },
      KERALA_TRIP,
      { upsert: true, new: true }
    );

    console.log('✅ Kerala Group Trip 2026 seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
