const mongoose = require('mongoose');

const bookingFormSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  tripName: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Travel date is required']
  },
  formUrl: {
    type: String,
    required: true
  },
  sheetUrl: {
    type: String
  },
  sheetId: String,
  formId: String,
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// One form per trip+date combination
bookingFormSchema.index({ tripName: 1, date: 1 }, { unique: true });
bookingFormSchema.index({ tripId: 1 });
bookingFormSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BookingForm', bookingFormSchema);
