const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  
  // Customer Info
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerEmail: String,

  // Trip Info
  tripTitle: { type: String, required: true },
  destination: { type: String, required: true },
  duration: String, // e.g., 5D/4N
  travelDates: {
    from: String,
    to: String
  },
  pax: { type: Number, default: 2 },

  // Pricing
  totalPrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },

  // Content Sections
  overview: String,
  itinerary: [{
    day: Number,
    title: String,
    description: String,
    photos: [String]
  }],
  inclusions: [String],
  exclusions: [String],

  // Media
  coverImage: String,
  experiencePhotos: [{
    url: String,
    name: String
  }],

  // Tiered Options (Standard vs Luxury)
  lowLevelHotels: [{
    name: String,
    location: String,
    stars: Number,
    image: String,
    photos: [String],
    description: String,
    amenities: [String],
    roomType: String
  }],
  highLevelHotels: [{
    name: String,
    location: String,
    stars: Number,
    image: String,
    photos: [String],
    description: String,
    amenities: [String],
    roomType: String
  }],
  lowLevelPrice: { type: Number, default: 0 },
  highLevelPrice: { type: Number, default: 0 },

  // Route/Travel Map
  route: [{
    label: String,
    icon: { type: String, enum: ['plane', 'car', 'train', 'ship', 'bus'] }
  }],

  // Expert Info (Legacy support & quick access)
  expert: {
    name: String,
    photo: String,
    whatsapp: String,
    designation: String,
    description: String,
    phone: String
  },

  // Admin Meta
  viewCount: { type: Number, default: 0 },
  publishedAt: Date,
  expiresAt: Date,
  expiryHours: { type: Number, default: null }, // null means no expiry

  // Payment Settings
  advanceAmount: { type: Number, default: 0 }, // 0 means payment disabled
  advanceLabel: { type: String, default: "Advance Deposit" },
  fullPaymentEnabled: { type: Boolean, default: false },

  sightseeingCount: { type: Number, default: 0 },
  reviews: [{
    name: String,
    rating: { type: Number, default: 5 },
    comment: String,
    avatar: String
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

quotationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

module.exports = mongoose.model('Quotation', quotationSchema);
