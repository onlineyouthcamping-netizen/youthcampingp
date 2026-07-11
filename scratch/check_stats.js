const mongoose = require('mongoose');
require('dotenv').config({path: './backend/.env'});
const Booking = require('./backend/src/models/Booking');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const stats = await Booking.aggregate([
    { $group: { 
      _id: '$salesPersonName', 
      total: { $sum: 1 }, 
      revenue: { $sum: '$totalAmount' } 
    }}
  ]);
  console.log(JSON.stringify(stats, null, 2));
  process.exit(0);
}

check();
