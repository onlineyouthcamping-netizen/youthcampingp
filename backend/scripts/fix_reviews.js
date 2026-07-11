const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/youth-camping');
  const Review = require('./src/models/Review');
  const Trip = require('./src/models/Trip');

  const bhriguTrip = await Trip.findOne({ slug: /bhrigu/i });
  if (bhriguTrip) {
    console.log(`Found Bhrigu Trip: ${bhriguTrip._id}`);
    const result = await Review.updateMany(
      { tripName: /Bhrigu/i },
      { tripId: bhriguTrip._id }
    );
    console.log(`Updated Bhrigu Reviews: ${result.modifiedCount}`);
  }

  const spitiTrip = await Trip.findOne({ slug: /spiti/i });
  if (spitiTrip) {
    const result = await Review.updateMany(
      { tripName: /Spiti/i },
      { tripId: spitiTrip._id }
    );
    console.log(`Updated Spiti Reviews: ${result.modifiedCount}`);
  }

  process.exit();
}

fix();
