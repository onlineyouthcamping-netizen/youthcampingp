const mongoose = require('mongoose');

const tripVendorSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: [true, 'Trip ID is required']
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required']
  },
  agreedCost: {
    type: Number,
    required: [true, 'Agreed cost is required'],
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Prevent duplicate assignments
tripVendorSchema.index({ tripId: 1, vendorId: 1 }, { unique: true });
tripVendorSchema.index({ tripId: 1 });

module.exports = mongoose.model('TripVendor', tripVendorSchema);
