require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');

const spitiTrip = {
  title: "Spiti Valley Full Circuit (Chandratal Lake)",
  slug: "spiti-valley-full-circuit",
  description: "Your story in the high-altitude desert of Spiti. Join the ultimate 11-day community expedition covering Shimla, Kinnaur, Spiti Valley, and Manali. From the last Indian village Chitkul to the magical Moon Lake (Chandratal), experience the raw beauty of the Himalayas.",
  location: "Spiti Valley, Himachal Pradesh",
  duration: "11 Days / 10 Nights",
  category: "Group Expedition",
  price: 21499,
  heroImage: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c?q=80&w=2070",
  images: [
    "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c",
    "https://images.unsplash.com/photo-1533130061792-64b345e4a833",
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3"
  ],
  maxGroupSize: 12,
  difficulty: "moderate",
  ageGroup: "18-35 years",
  maxAltitude: "15,000 ft",
  tripType: "Group Expedition",
  startEnd: "Shimla to Manali",
  pickupMode: "Tempo Traveller (12 Seater)",
  departureCity: "Ahmedabad",
  status: "published",
  route: [
    { label: "Shimla Arrival", icon: "car" },
    { label: "Sangla Valley", icon: "car" },
    { label: "Chitkul Last Village", icon: "car" },
    { label: "Kalpa Viewpoint", icon: "car" },
    { label: "Tabo Monastery", icon: "car" },
    { label: "Dhankar Fort", icon: "car" },
    { label: "Kaza Base", icon: "car" },
    { label: "Hikkim Post Office", icon: "car" },
    { label: "Chicham Bridge", icon: "car" },
    { label: "Chandratal Lake", icon: "car" },
    { label: "Rohtang Pass", icon: "car" },
    { label: "Manali Finish", icon: "car" }
  ],
  attractions: [
    { name: "Chandratal Lake", image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c", slug: "chandratal" },
    { name: "Key Monastery", image: "https://images.unsplash.com/photo-1533130061792-64b345e4a833", slug: "key-monastery" },
    { name: "Chitkul Village", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23", slug: "chitkul" },
    { name: "Hikkim Post Office", image: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3", slug: "hikkim" }
  ],
  popupDetails: {
    cancellation: [
      { label: "Before more than 40 days of Departure", val: "10% deduction" },
      { label: "Before 21 to 40 days of Departure", val: "25% deduction" },
      { label: "Before 11 to 20 days of Departure", val: "40% deduction" },
      { label: "Before 2 to 10 days of Departure", val: "60% deduction" },
      { label: "In the last 48 hours of Departure", val: "90% deduction" }
    ],
    terms: [
      "Itinerary subject to change based on weather.",
      "Valid ID proof is mandatory.",
      "Decision of trip captain is final."
    ],
    carry: [
      { label: "Clothing", val: "Heavy woolens, Thermals, 5 pairs of socks" },
      { label: "Footwear", val: "Sturdy trekking shoes, Slippers" },
      { label: "Personal", val: "Sunscreen, Lip balm, Power bank" }
    ],
    etiquette: [
      { title: "Eco Friendly", desc: "Do not litter in the mountains." },
      { title: "Local Respect", desc: "Ask before taking photos of locals." }
    ]
  },
  highlights: [
    "Visit Chitkul - The Last Indian Village",
    "Explore 1000-year old Tabo Monastery",
    "Send a postcard from Hikkim - World's Highest Post Office",
    "Stay in high-altitude homestays in Kaza",
    "Crossing Asia's highest bridge - Chicham Bridge",
    "Camping under the stars at Chandratal Lake"
  ],
  itinerary: [
    {
      day: 1,
      title: "Ahmedabad → Chandigarh (The Journey Begins)",
      description: "Departure from Ahmedabad by non-AC Sleeper/3AC train. Enjoy group bonding and station food stops through Rajasthan and Haryana.",
      location: "On Train",
      activities: ["Group Bonding", "Ice Breaking"],
      stay: "Overnight Train Journey",
      meals: "None"
    },
    {
      day: 2,
      title: "Chandigarh → Shimla (The Gateway)",
      description: "Arrive in Chandigarh morning (~8 AM). Board the tempo traveller for a scenic mountain drive towards Shimla. Mall Road exploration in the evening.",
      location: "Shimla",
      activities: ["Scenic Drive", "Mall Road Walk"],
      stay: "Hotel",
      meals: "Dinner",
      photos: ["https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6"]
    },
    {
      day: 3,
      title: "Shimla → Chitkul (Kinnaur Valley)",
      description: "Travel through the Indo-Tibet route into the Kinnaur Valley. Reach Chitkul, the last Indian village before the Tibet border.",
      location: "Chitkul",
      activities: ["Village Walk", "River Visit"],
      stay: "Cottage/Hotel",
      meals: "Breakfast + Dinner",
      photos: ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23"]
    },
    {
      day: 4,
      title: "Chitkul → Tabo (The Himalayan Desert)",
      description: "Witness the confluence of Spiti and Sutlej at Khab. Visit Nako Lake and transition into the cold desert landscape of Spiti.",
      location: "Tabo",
      activities: ["Nako Lake Visit", "Khab Confluence"],
      stay: "Homestay",
      meals: "Breakfast + Dinner"
    },
    {
      day: 5,
      title: "Tabo → Dhankar → Kaza",
      description: "Explore the 1000-year-old Tabo Monastery. Visit the cliffside Dhankar Monastery for a 360-degree sky view before reaching Kaza.",
      location: "Kaza",
      activities: ["Monastery Tour", "Cliff Trek"],
      stay: "Homestay",
      meals: "Breakfast + Dinner"
    },
    {
      day: 6,
      title: "Kaza Local Sightseeing (Extreme Altitudes)",
      description: "Visit Key Monastery, Komic (Highest Village), Langza (Buddha Statue), and Hikkim (Highest Post Office).",
      location: "Kaza",
      activities: ["Key Monastery", "Post Office Visit", "Fossil Hunting"],
      stay: "Homestay",
      meals: "Breakfast + Dinner"
    },
    {
      day: 7,
      title: "Kaza → Kibber → Chicham → Chandratal",
      description: "Cross Asia's highest bridge at Chicham. Reach the magical Moon Lake - Chandratal for an unforgettable camping experience.",
      location: "Chandratal Lake",
      activities: ["Chicham Bridge Crossing", "Lakeside Walk"],
      stay: "Luxury Camps",
      meals: "Breakfast + Dinner"
    },
    {
      day: 8,
      title: "Chandratal → Manali",
      description: "Drive through the adventurous roads of Chhatru and cross the Atal Tunnel to reach Manali. Relax in Manali cottages.",
      location: "Manali",
      activities: ["Off-roading", "Atal Tunnel Drive"],
      stay: "Cottage",
      meals: "Breakfast + Dinner"
    },
    {
      day: 9,
      title: "Manali Exploration & Return",
      description: "Explore Old Manali, Hadimba Temple, and local markets. Late evening departure for Jalandhar station.",
      location: "Manali",
      activities: ["Hadimba Temple", "Old Manali Cafe Crawl"],
      stay: "Night Journey",
      meals: "Breakfast"
    },
    {
      day: 10,
      title: "Jalandhar → Ahmedabad (Heading Home)",
      description: "Board the return train. Relive the trip memories with group games and content sharing.",
      location: "On Train",
      activities: ["Photo Sharing", "Games"],
      stay: "Overnight Train Journey",
      meals: "None"
    },
    {
      day: 11,
      title: "Arrival in Ahmedabad",
      description: "Reach Ahmedabad with a bag full of memories. Trip ends.",
      location: "Ahmedabad",
      activities: ["Group Farewell"],
      stay: "Home",
      meals: "None"
    }
  ],
  inclusions: [
    "Train tickets (Round trip)",
    "Tempo Traveller / Taxi for local transport",
    "Stay in Hotels, Homestays & Camps (3/4 sharing)",
    "7 Breakfast & 6 Dinner (Pure Veg)",
    "Bonfire & Music in Manali",
    "Trip Captain & Local Guides",
    "Oxygen Support & First Aid",
    "Toll, Parking & Permits"
  ],
  exclusions: [
    "Personal expenses & extra meals",
    "Adventure activities (Paragliding, Rafting)",
    "Entry fees to monuments",
    "Heater & Snow suit charges",
    "GST (5%)",
    "Natural calamity costs"
  ],
  faqs: [
    { question: "What is the best time to visit?", answer: "June to September is the best time as roads are clear and Chandratal is accessible." },
    { question: "Is Spiti safe for beginners?", answer: "Yes, but be prepared for high altitude and basic homestays." },
    { question: "What about mobile connectivity?", answer: "BSNL/Jio works in Kaza, but expect no network in most other villages." }
  ],
  availableDates: [
    { date: "2026-06-02" }, { date: "2026-06-09" }, { date: "2026-06-16" }, { date: "2026-06-23" }, { date: "2026-06-30" },
    { date: "2026-07-07" }, { date: "2026-07-14" }, { date: "2026-07-21" }, { date: "2026-07-28" },
    { date: "2026-08-04" }, { date: "2026-08-11" }, { date: "2026-08-18" }, { date: "2026-08-25" },
    { date: "2026-09-01" }, { date: "2026-09-08" }, { date: "2026-09-15" }, { date: "2026-09-22" }, { date: "2026-09-29" }
  ],
  variants: [
    { location: "Ahmedabad (Sleeper)", duration: "11D/10N", originalPrice: 23000, discountedPrice: 21499, image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c" },
    { location: "Ahmedabad (3AC)", duration: "11D/10N", originalPrice: 25000, discountedPrice: 23499, image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c" },
    { location: "Chandigarh to Chandigarh", duration: "10D/9N", originalPrice: 22000, discountedPrice: 19999, image: "https://images.unsplash.com/photo-1582239014603-7b3b7548d80c" }
  ],
  addons: [
    { name: "Double Sharing Upgrade", rate: 3000, description: "Upgrade to private room for 2 people throughout the trip.", minQuantity: 1, maxQuantity: 2 }
  ]
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB...');
    
    // Check if trip already exists
    const existing = await Trip.findOne({ slug: spitiTrip.slug });
    if (existing) {
      console.log('Trip already exists, updating...');
      await Trip.findByIdAndUpdate(existing._id, spitiTrip);
    } else {
      await Trip.create(spitiTrip);
      console.log('New Spiti Trip created!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
