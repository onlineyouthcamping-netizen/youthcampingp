const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: [true, 'Booking ID is required']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [1, 'Amount must be at least ₹1']
  },
  paymentMode: {
    type: String,
    enum: ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Other'],
    required: [true, 'Payment mode is required']
  },
  paymentDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  recordedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Prevent duplicate payments (same booking, same amount, same date within 1 minute)
paymentSchema.index({ bookingId: 1, amount: 1, paymentDate: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
