const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/youth-camping');
  const Review = require('./src/models/Review');
  const Trip = require('./src/models/Trip');

  const reviews = await Review.find({});
  console.log('--- ALL REVIEWS ---');
  reviews.forEach(r => {
    console.log(`User: ${r.userName}, TripName: ${r.tripName}, TripId: ${r.tripId}, Comment: ${r.comment}`);
  });

  const trips = await Trip.find({});
  console.log('\n--- ALL TRIPS ---');
  trips.forEach(t => {
    console.log(`Title: ${t.title}, ID: ${t._id}, Slug: ${t.slug}`);
  });

  process.exit();
}

check();
