const mongoose = require('mongoose');
require('dotenv').config();
const Trip = require('../src/models/Trip');
const slugify = require('slugify');

const tripsData = [
  {
    title: "Manali Kasol Amritsar Backpacking Trip",
    location: "Manali, Himachal Pradesh",
    price: 11999,
    duration: "9 Days",
    category: "adventure",
    status: "published",
    description: "Experience the magic of the Himalayas with our Manali Kasol Amritsar Backpacking Trip. From the serene landscapes of Kasol to the spiritual vibe of Amritsar, this trip is perfect for adventure seekers.",
    images: ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80"],
    heroImage: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    title: "Winter Spiti Road Trip",
    location: "Spiti Valley, Himachal Pradesh",
    price: 19999,
    duration: "10 Days",
    category: "road-trip",
    status: "published",
    description: "An epic winter expedition in the Spiti Valley. Witness the white desert, frozen lakes, and ancient monasteries in sub-zero temperatures. A must for every road trip lover.",
    images: ["https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80"],
    heroImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    title: "Kedarnath Badrinath - Tungnath & Rishikesh",
    location: "Uttarakhand",
    price: 19499,
    duration: "7 Days",
    category: "trekking",
    status: "published",
    description: "A spiritual and adventurous journey to the heart of the Himalayas. Visit the holy shrines of Kedarnath and Badrinath, trek to Tungnath, and experience the energy of Rishikesh.",
    images: ["https://images.unsplash.com/photo-1589136142550-c7443ec96855?auto=format&fit=crop&q=80"],
    heroImage: "https://images.unsplash.com/photo-1589136142550-c7443ec96855?auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    title: "Leh Ladakh Bike Expedition 2026",
    location: "Ladakh",
    price: 18999,
    duration: "7 Days",
    category: "road-trip",
    status: "published",
    description: "The ultimate bike expedition. Ride through the highest motorable passes in the world, witness the beauty of Pangong Lake, and explore the rugged landscapes of Ladakh.",
    images: ["https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80"],
    heroImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    title: "Spiti Valley Road Trip",
    location: "Spiti Valley",
    price: 21499,
    duration: "11 Days",
    category: "road-trip",
    status: "published",
    description: "Explore the remote Spiti Valley on this 11-day road trip. Visit Hikkim, Langza, Kaza, and the stunning Chandrataal Lake. A journey into the high-altitude cold desert.",
    images: ["https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80"],
    heroImage: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80",
    isActive: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const data of tripsData) {
      const slug = slugify(data.title, { lower: true, strict: true });
      
      // Delete if exists with same slug or title
      await Trip.deleteMany({ $or: [{ title: data.title }, { slug: slug }] });
      
      const trip = new Trip({
        ...data,
        slug: slug
      });
      
      await trip.save();
      console.log(`Seeded: ${data.title}`);
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDB();
