/**
 * MASTER SEED SCRIPT — Seeds the full YouthCamping database
 * Run: node scripts/seed-all.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Page = require('../src/models/Page');
const Review = require('../src/models/Review');

const MONGO_URI = process.env.MONGODB_URI;

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected!\n');

  // ─── 1. SEED HOME PAGE ────────────────────────────────────────
  console.log('📄 Seeding Home Page...');
  await Page.deleteMany({ slug: 'home' });

  await Page.create({
    title: 'Home',
    slug: 'home',
    status: 'published',
    isSystem: true,
    sections: [
      {
        id: 'hero-1',
        type: 'videohero',
        isVisible: true,
        data: {
          title: 'Explore The World',
          subtitle: 'Premium group trips crafted for unforgettable memories',
          url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
          image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80'
        }
      },
      {
        id: 'stats-1',
        type: 'stats',
        isVisible: true,
        data: {
          title: 'Our Impact',
          items: [
            { label: 'Happy Travelers', value: '10,000+' },
            { label: 'Group Trips', value: '500+' },
            { label: 'Destinations', value: '25+' },
            { label: 'Review Rating', value: '4.9/5' }
          ]
        }
      },
      {
        id: 'trips-1',
        type: 'trips',
        isVisible: true,
        data: {
          title: 'Trending Trips'
        }
      },
      {
        id: 'banner-1',
        type: 'banner',
        isVisible: true,
        data: {
          title: "Winter Trips",
          subtitle: 'Kashmir • Spiti Valley • Kasol Manali',
          image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80'
        }
      },
      {
        id: 'grid-1',
        type: 'grid',
        isVisible: true,
        data: {
          title: 'Our Packages',
          subtitle: 'Global Expeditions',
          count: 6
        }
      },
      {
        id: 'blogs-1',
        type: 'blogs',
        isVisible: true,
        data: {
          title: 'Watch & Read'
        }
      },
      {
        id: 'reviews-1',
        type: 'reviews',
        isVisible: true,
        data: {
          title: 'Satisfied Travelers'
        }
      }
    ]
  });
  console.log('  ✅ Home page created with 7 sections\n');

  // ─── 2. SEED REVIEWS ──────────────────────────────────────────
  console.log('⭐ Seeding Reviews...');
  const existingReviews = await Review.countDocuments();
  if (existingReviews < 5) {
    await Review.deleteMany({});
    await Review.insertMany([
      {
        userName: 'Bhumit Rabadiya',
        userImage: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=200',
        rating: 5,
        comment: 'Thank you for crafting a trip that perfectly matched our style and interests. Your attention to detail made all the difference!',
        tripName: 'Thailand Trip',
        isFeatured: true
      },
      {
        userName: 'Janak Chauhan',
        userImage: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=200',
        rating: 5,
        comment: 'Just few weeks back I took the trip to Spiti Valley with YouthCamping and believe me I had an amazing expedition of lifetime.',
        tripName: 'Spiti Valley',
        isFeatured: true
      },
      {
        userName: 'Aditi Raval',
        userImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        rating: 5,
        comment: 'The Kashmir trip was absolutely magical. The itinerary was well planned and the guides were super helpful. Best trip of my life!',
        tripName: 'Kashmir Trip',
        isFeatured: true
      },
      {
        userName: 'Harsh Patel',
        userImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        rating: 5,
        comment: 'Dubai trip was beyond expectations! From desert safari to Burj Khalifa night visit, everything was perfectly organized.',
        tripName: 'Dubai Adventure',
        isFeatured: true
      },
      {
        userName: 'Khushi Varia',
        userImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        rating: 5,
        comment: 'Ladakh trip was a dream come true. The landscapes, the people, the food — everything was out of this world. Highly recommend!',
        tripName: 'Ladakh Expedition',
        isFeatured: true
      },
      {
        userName: 'Avdhesh Kumar',
        userImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        rating: 5,
        comment: 'Second time traveling with YouthCamping and they never disappoint. The Manali backpacking trip was epic. Amazing group vibes!',
        tripName: 'Manali Backpacking',
        isFeatured: true
      },
      {
        userName: 'Priya Sharma',
        userImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
        rating: 5,
        comment: 'Vietnam trip was absolutely stunning. From Ha Long Bay to the food streets of Hanoi — every moment was memorable!',
        tripName: 'Vietnam Explorer',
        isFeatured: true
      },
      {
        userName: 'Rahul Mehta',
        userImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        rating: 5,
        comment: 'The Bali trip is something else! The team took care of everything from start to finish. I came back completely refreshed.',
        tripName: 'Bali Trip',
        isFeatured: true
      }
    ]);
    console.log('  ✅ 8 featured reviews created\n');
  } else {
    console.log(`  ⏭️  Skipped (${existingReviews} reviews already exist)\n`);
  }

  // ─── DONE ─────────────────────────────────────────────────────
  console.log('🎉 Seeding complete! Your frontend should now display:');
  console.log('   → VideoHero with cinematic title');
  console.log('   → Stats bar (10k+ travelers, 500+ trips...)');
  console.log('   → Trending Trips slider');
  console.log('   → Winter Banner');
  console.log('   → Trip Grid');
  console.log('   → Blog section');
  console.log('   → Reviews section');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
