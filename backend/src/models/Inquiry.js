const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: String,
  message: {
    type: String,
    required: false
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  tripTitle: String,
  date: String,
  count: Number,
  source: {
    type: String,
    default: 'website'
  },
  status: {
    type: String,
    enum: ['new', 'read', 'contacted', 'converted', 'closed'],
    default: 'new'
  },
  isDuplicate: {
    type: Boolean,
    default: false
  },
  convertedAmount: {
    type: Number,
    default: 0
  },
  firstRespondedAt: Date,
  responseTimeMinutes: Number,
  nextFollowUp: Date,
  adminNotes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Inquiry', inquirySchema);
