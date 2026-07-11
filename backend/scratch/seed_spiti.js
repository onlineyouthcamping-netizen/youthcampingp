const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Trip = require('../src/models/Trip');

const spitiTripData = {
  title: "Spiti Valley Full Circuit (Chandratal Lake)",
  shortName: "Spiti Full Circuit",
  location: "Spiti Valley",
  price: 19999,
  duration: "11 Days / 10 Nights",
  category: "Himalayan",
  description: "Experience the ultimate 11-day Spiti Valley circuit. From the lush valleys of Kinnaur to the high-altitude desert of Spiti, witness breathtaking landscapes, ancient monasteries, and the pristine Chandratal Lake.",
  heroImage: "/uploads/trips/spiti_hero.png",
  images: [
    "/uploads/trips/spiti_hero.png",
    "/uploads/trips/chandratal.png",
    "/uploads/trips/key_monastery.png",
    "/uploads/trips/chicham_bridge.png"
  ],
  highlights: [
    "Chandratal Lake (Moon Lake)",
    "Chicham Bridge (Asia's Highest)",
    "Key Monastery",
    "Chitkul (Last Indian Village)",
    "Hikkim (Highest Post Office)",
    "Komic (Highest Village)"
  ],
  itinerary: [
    {
      day: 1,
      title: "Ahmedabad → Chandigarh (Train)",
      description: "Overnight train journey. Route: Gujarat → Rajasthan → Haryana. Activities: Group bonding, Station food stops (Abu Road, Jaipur).",
      stay: "Train",
      meals: "None"
    },
    {
      day: 2,
      title: "Chandigarh → Shimla",
      description: "Arrival at Chandigarh (~8 AM). Road trip to Shimla. Scenic mountain drive. Mall Road exploration if time permits.",
      location: "Shimla",
      stay: "Hotel",
      meals: "Dinner"
    },
    {
      day: 3,
      title: "Shimla → Chitkul",
      description: "Drive through Kinnaur Valley. Visit Indo-Tibet route. Experience high altitude scenic drive to the last Indian village, Chitkul.",
      location: "Chitkul",
      stay: "Cottage / Hotel",
      meals: "Breakfast + Dinner"
    },
    {
      day: 4,
      title: "Chitkul → Tabo (via Nako Lake)",
      description: "Stop at Khab (Spiti + Sutlej confluence) and Nako Lake. Experience the border roads and Himalayan desert transition.",
      location: "Tabo",
      stay: "Homestay",
      meals: "Breakfast + Dinner"
    },
    {
      day: 5,
      title: "Tabo → Dhankar → Kaza",
      description: "Visit Tabo Monastery (1000 years old) and Dhankar Village (cliff monastery) with a 360° sky view. Reach Kaza, the HQ of Spiti.",
      location: "Kaza",
      stay: "Homestay",
      meals: "Breakfast + Dinner"
    },
    {
      day: 6,
      title: "Kaza Local Sightseeing",
      description: "Cover Key Monastery, Komic (Highest village ~15,050 ft), Langza (Buddha statue + fossils), and Hikkim (Highest post office).",
      location: "Kaza",
      stay: "Homestay",
      meals: "Breakfast + Dinner"
    },
    {
      day: 7,
      title: "Kaza → Kibber → Chicham → Chandratal",
      description: "Visit Kibber Village and Chicham Bridge (Asia’s highest bridge). Reach the stunning Chandratal Lake (Moon Lake).",
      location: "Chandratal",
      stay: "Camps",
      meals: "Breakfast + Dinner"
    },
    {
      day: 8,
      title: "Chandratal → Manali",
      description: "Drive through Chhatru, Atal Tunnel, and Solang Valley. Experience one of the world’s most dangerous roads.",
      location: "Manali",
      stay: "Cottage",
      meals: "Breakfast + Dinner"
    },
    {
      day: 9,
      title: "Manali Exploration",
      description: "Optional paragliding and river rafting. Sightseeing: Hadimba Temple, Mall Road, Old Manali. Travel to Jalandhar at night.",
      location: "Manali",
      stay: "Travel",
      meals: "Breakfast"
    },
    {
      day: 10,
      title: "Jalandhar → Ahmedabad (Train)",
      description: "Return train journey. Activities: Group fun, content sharing.",
      stay: "Train",
      meals: "None"
    },
    {
      day: 11,
      title: "Arrival Ahmedabad",
      description: "Rajasthan food stops (Rabdi, Chaat). Trip ends with fond memories.",
      location: "Ahmedabad",
      meals: "None"
    }
  ],
  availableDates: [
    new Date("2026-06-02"), new Date("2026-06-09"), new Date("2026-06-16"), new Date("2026-06-23"), new Date("2026-06-30"),
    new Date("2026-07-07"), new Date("2026-07-14"), new Date("2026-07-21"), new Date("2026-07-28"),
    new Date("2026-08-04"), new Date("2026-08-11"), new Date("2026-08-18"), new Date("2026-08-25"),
    new Date("2026-09-01"), new Date("2026-09-08"), new Date("2026-09-15"), new Date("2026-09-22"), new Date("2026-09-29")
  ],
  travelOptions: [
    { label: "Without Train (Chandigarh to Chandigarh)", priceDelta: 0 },
    { label: "Non-AC Sleeper", priceDelta: 1500 },
    { label: "3AC Train", priceDelta: 3500 }
  ],
  roomOptions: [
    { label: "4 Sharing", priceDelta: 0 },
    { label: "Double Sharing", priceDelta: 3000 }
  ],
  inclusions: [
    "Train tickets (round trip)",
    "Tempo Traveller / Taxi for local transport",
    "Stay (3/4 sharing)",
    "Meals (7 Breakfast + 6 Dinner)",
    "Bonfire + Music (Manali)",
    "Trekking",
    "Trip Captain",
    "Oxygen support",
    "Toll + Parking",
    "24×7 Support"
  ],
  exclusions: [
    "Personal expenses",
    "Adventure activities (Paragliding, rafting)",
    "Entry fees",
    "Heater charges",
    "Snow suits",
    "Pony rides",
    "Natural calamity costs",
    "Extra meals",
    "Inter-station transfers",
    "GST (5% extra)"
  ],
  customSections: [
    {
      label: "Stay Breakdown",
      content: "Shimla: Hotel\nChitkul: Cottage/Hotel\nTabo: Homestay\nKaza: Homestay\nChandratal: Camps\nManali: Hotel"
    },
    {
      label: "Things to Carry",
      content: "Essentials:\n- Rucksack + Day bag\n- Trekking shoes\n- Woolen socks\n- ID proof\n\nPersonal Care:\n- Sunscreen SPF 50\n- Lip balm\n- Moisturizer\n- Medicines\n\nAccessories:\n- Sunglasses\n- Power bank\n- Water bottle\n- Polybags"
    },
    {
      label: "Safety Features",
      content: "- Experienced mountain drivers\n- Certified activity vendors\n- Government-approved vehicles\n- Oxygen support\n- Hygienic stays"
    },
    {
      label: "Important Conditions",
      content: "- Chandratal depends on weather (June risk)\n- Roads may close -> itinerary flexible\n- Book 60 days early for train confirmation"
    }
  ],
  status: "published"
};

const updateSlugs = ["spiti-valley-road-trip", "spiti-valley-full-circuit-chandratal-lake"];

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    for (const slug of updateSlugs) {
      const existing = await Trip.findOne({ slug: slug });
      if (existing) {
        console.log(`Updating trip: ${slug}...`);
        await Trip.findByIdAndUpdate(existing._id, spitiTripData);
      } else {
        console.log(`Trip not found for slug: ${slug}, creating...`);
        await Trip.create({ ...spitiTripData, slug: slug });
      }
    }

    console.log('Spiti Trips updated successfully!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
