const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  
  // Trip Link (Legacy & New)
  tripId: { type: String, required: true, index: true }, // Legacy Code e.g. MKA1
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', index: true }, // New Reference
  tripName: { type: String },

  // Status Flow: pending → confirmed
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending',
    index: true
  },
  
  // Personal Info (Aliased for compatibility)
  fullName: { type: String },
  name: { type: String, required: true }, 
  mobile: { type: String },
  phone: { type: String, required: true }, 
  age: { type: Number },
  gender: { type: String },
  email: { type: String },

  // Travel Info
  trainClass: { type: String },
  ticketStatus: { type: String, default: 'Not Booked' },
  roomType: { type: String },

  // Payment Info
  totalAmount: { type: Number, default: 0 },
  amount: { type: Number, required: true }, 
  advancePaid: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentMode: { type: String, default: '' },
  paymentStatus: { type: String, default: 'Pending' },

  // Other
  notes: { type: String },
  adminNotes: { type: String },

  // Passengers
  passengers: [{
    name: String,
    age: Number,
    gender: String,
    phone: String
  }]
}, {
  timestamps: true
});

// Auto-calculate remaining on save
bookingSchema.pre('save', function(next) {
  this.remainingAmount = (this.totalAmount || 0) - (this.advancePaid || 0);
  next();
});

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
