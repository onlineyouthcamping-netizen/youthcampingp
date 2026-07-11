const mongoose = require('mongoose');

const bookingTripSchema = new mongoose.Schema({
  tripCode: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true,
    index: true
  }, // e.g. MKA1, KED1, SPITI1
  tripName: { 
    type: String, 
    required: true, 
    trim: true 
  }, // e.g. Manali Kasol
  isActive: { 
    type: Boolean, 
    default: true 
  },
  formLink: {
    type: String
  }, // auto-generated shareable link
  price: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BookingTrip', bookingTripSchema);
