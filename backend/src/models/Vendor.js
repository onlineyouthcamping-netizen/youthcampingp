const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['hotel', 'transport', 'guide', 'meals', 'equipment', 'other'],
    required: [true, 'Vendor type is required']
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

vendorSchema.index({ type: 1 });
vendorSchema.index({ isActive: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
