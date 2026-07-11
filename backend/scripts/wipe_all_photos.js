const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('../src/models/Trip');
const Blog = require('../src/models/Blog');
const Review = require('../src/models/Review');

const FALLBACK_URL = "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=2070";

async function wipeAllPhotos() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🚀 Connected to MongoDB');

    // 1. Wipe Trips
    const trips = await Trip.find({});
    console.log(`Processing ${trips.length} trips...`);
    for (const trip of trips) {
      trip.heroImage = "";
      trip.thumbnail = "";
      trip.images = [];
      trip.gallery = [];
      trip.seo = trip.seo || {};
      trip.seo.ogImage = "";
      
      const clearNested = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        for (const key in obj) {
          if (key === 'image' || key === 'img' || key === 'url' || key === 'thumbnail') {
            if (typeof obj[key] === 'string' && (obj[key].startsWith('http') || obj[key].startsWith('/uploads'))) {
              obj[key] = "";
            }
          }
          if (typeof obj[key] === 'object' && obj[key] !== null) clearNested(obj[key]);
        }
      };

      if (trip.itinerary) clearNested(trip.itinerary);
      if (trip.highlights) clearNested(trip.highlights);
      if (trip.variants) clearNested(trip.variants);
      if (trip.accommodations) clearNested(trip.accommodations);
      if (trip.customSections) clearNested(trip.customSections);
      if (trip.reels) clearNested(trip.reels);
      
      trip.markModified('itinerary');
      trip.markModified('highlights');
      trip.markModified('variants');
      trip.markModified('accommodations');
      trip.markModified('customSections');
      trip.markModified('reels');
      trip.markModified('seo');
      
      await trip.save();
    }
    console.log('✅ All Trip images wiped.');

    // 2. Wipe Blogs
    const blogRes = await Blog.updateMany({}, { $set: { image: FALLBACK_URL } }); // Blog image is required in schema
    console.log(`✅ Wiped images for ${blogRes.modifiedCount || blogRes.nModified || 'all'} blogs.`);

    // 3. Wipe Reviews
    const reviewRes = await Review.updateMany({}, { $set: { photos: [], userImage: 'https://i.pravatar.cc/150?u=default' } });
    console.log(`✅ Wiped images for ${reviewRes.modifiedCount || reviewRes.nModified || 'all'} reviews.`);

    console.log('\n✨ ALL PHOTOS REMOVED FROM DATABASE REFERENCE.');
    console.log('You can now upload fresh photos from the admin panel.');
    
    process.exit(0);
  } catch (err) {
    console.error('🚨 Error wiping photos:', err);
    process.exit(1);
  }
}

wipeAllPhotos();
