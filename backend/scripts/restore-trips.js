const mongoose = require('mongoose');
require('dotenv').config();
const Trip = require('./src/models/Trip');

const trips = [
  // Vietnam (Avian Style)
  {
    title: "Explore Vietnam",
    slug: "explore-vietnam",
    location: "Hanoi, Da Nang & Ho Chi Minh",
    duration: "9 Days 8 Nights",
    price: 52600,
    originalPrice: 58000,
    category: "vietnam",
    discount: "Save 5,400",
    description: "Explore the best of Vietnam from Hanoi to Ho Chi Minh City.",
    images: ["https://images.unsplash.com/photo-1528127269322-539801943592", "https://images.unsplash.com/photo-1555661530-68c8e98db4e6"]
  },
  // Bali (Avian Style)
  {
    title: "Bali Tour Package",
    slug: "bali-tour-package",
    location: "with Lempuyang Temple",
    duration: "7 Days 6 Nights",
    price: 27950,
    originalPrice: 34950,
    category: "bali",
    discount: "Save 7,000",
    description: "Experience the spiritual beauty of Bali and its iconic temples.",
    images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4", "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8"]
  },
  // Real Sitemap Trips
  {
    title: "Jannat-e-Kashmir",
    slug: "jannat-e-kashmir",
    location: "Kashmir Valley",
    duration: "9 Nights 10 Days",
    price: 22499,
    originalPrice: 25000,
    category: "himalayan",
    description: "Kashmir, referred to as 'Paradise on Earth'.",
    images: ["https://images.unsplash.com/photo-1566833925222-630444508493"]
  },
  {
    title: "Kedarnath Badrinath",
    slug: "kedarnath-badrinath",
    location: "Uttarakhand",
    duration: "8 Nights 7 Days",
    price: 19499,
    originalPrice: 22000,
    category: "spiritual",
    description: "Sacred Chota Char Dham and Panch Kedar pilgrimage.",
    images: ["https://images.unsplash.com/photo-1626621341517-bbf3d9965121"]
  },
  {
    title: "Manali Kasol Amritsar",
    slug: "manali-kasol-amritsar",
    location: "Himachal & Punjab",
    duration: "8 Nights 9 Days",
    price: 11999,
    originalPrice: 14000,
    category: "himalayan",
    description: "Riverside camping in Kasol and Golden Temple in Amritsar.",
    images: ["https://images.unsplash.com/photo-1595054350563-397193f8e5b4"]
  },
  {
    title: "Spiti Valley Road Trip",
    slug: "spiti-valley-road-trip",
    location: "Spiti Valley",
    duration: "10 Nights 11 Days",
    price: 21499,
    originalPrice: 24000,
    category: "himalayan",
    description: "Explore quaint villages like Sangla, Chitkul, and Tabo.",
    images: ["https://images.unsplash.com/photo-1605146764691-550fc105d760"]
  },
  {
    title: "Leh Ladakh Bike Expedition 2026",
    slug: "leh-ladakh-bike-expedition",
    location: "Ladakh",
    duration: "6 Nights 7 Days",
    price: 18999,
    originalPrice: 21000,
    category: "himalayan",
    description: "Starting and ending in Leh, crossing world's highest roads.",
    images: ["https://images.unsplash.com/photo-1581793745862-99f5737672c7"]
  },
  {
    title: "Kerala Getaway",
    slug: "kerala-getaway",
    location: "Kerala",
    duration: "4 Nights 5 Days",
    price: 15999,
    originalPrice: 18000,
    category: "south-india",
    description: "Experience 'God's Own Country' backwaters and tea plantations.",
    images: ["https://images.unsplash.com/photo-1593693397690-362cb9666fc2"]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    await Trip.deleteMany({});
    await Trip.insertMany(trips);
    console.log('Full Sitemap Trip Data Restored!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
