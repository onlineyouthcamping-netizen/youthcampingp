require('dotenv').config();
const mongoose = require('mongoose');
const Trip = require('./models/Trip');

const trips = [
  {
    title: 'Zanskar Valley Road Trip from Delhi',
    location: 'with Suraj Tal & Baralacha La',
    price: 21800,
    duration: '6 Days 5 Nights',
    description: 'An epic journey through the heart of the Himalayas, crossing high mountain passes and visiting the pristine Zanskar Valley.',
    images: ['https://images.unsplash.com/photo-1544621245-09893d567909'],
    status: 'published',
    isFeatured: true
  },
  {
    title: 'Phu Quoc Group Trip',
    location: 'Beaches, Adventure & Island Hopping',
    price: 32800,
    duration: '5 Days 4 Nights',
    description: 'Experience the tropical paradise of Phu Quoc with its white sand beaches, turquoise waters, and vibrant nightlife.',
    images: ['https://images.unsplash.com/photo-1528127269322-539801943592'],
    status: 'published',
    isFeatured: true
  },
  {
    title: '6D Vietnam Group Trip',
    location: 'Hanoi, Da Nang & Hoi An',
    price: 48800,
    duration: '6 Days 5 Nights',
    description: 'A cultural immersion through Vietnam, from the bustling streets of Hanoi to the ancient charm of Hoi An.',
    images: ['https://images.unsplash.com/photo-1500382017468-9049fee5c0ce'],
    status: 'published',
    isFeatured: true
  },
  {
    title: 'Winter Spiti Group Trip from Delhi',
    location: 'with Chitkul Stay',
    price: 17800,
    duration: '7 Days 6 Nights',
    description: 'Witness the winter wonderland of Spiti Valley, visit remote monasteries, and experience the local hospitality in sub-zero temperatures.',
    images: ['https://images.unsplash.com/photo-1506461883276-594a12b11cf3'],
    status: 'published',
    isFeatured: true
  },
  {
    title: 'Kasol Manali Group Trip from Delhi',
    location: 'with Sissu & Atal Tunnel',
    price: 8800,
    duration: '4 Days 3 Nights',
    description: 'A perfect getaway to the Parvati Valley and Manali, featuring the scenic Atal Tunnel and the peaceful village of Sissu.',
    images: ['https://images.unsplash.com/photo-1598214817158-99ed26703f83'],
    status: 'published',
    isFeatured: true
  },
  {
    title: 'Bali Island Hopping Adventure',
    location: 'Ubud, Nusa Penida & Seminyak',
    price: 55000,
    duration: '7 Days 6 Nights',
    description: 'Explore the diverse landscapes of Bali, from the lush jungles of Ubud to the dramatic cliffs of Nusa Penida.',
    images: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4'],
    status: 'published',
    isFeatured: true
  }
];

const seedTrips = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for Trip Seeding...');

    await Trip.deleteMany();
    await Trip.insertMany(trips);
    console.log('Iconic Trips Seeded Successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedTrips();
