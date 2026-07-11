const mongoose = require('mongoose');
const slugify = require('slugify');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  originalUrl: String,
  location: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  maxGroupSize: {
    type: Number,
    default: 20
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    default: 'moderate'
  },
  description: {
    type: String,
    required: true
  },
  departureCity: String,
  ageLimit: String,
  bookingUrl: String,
  highlights: [mongoose.Schema.Types.Mixed],

  inclusions: [String],
  exclusions: [String],
  images: [String],
  gallery: [{ 
    url: String, 
    alt: String, 
    order: Number 
  }],
  thumbnail: String,
  heroImage: String,
  itinerary: [mongoose.Schema.Types.Mixed],
  availableDates: [{
    date: Date,
    capacity: { type: Number, default: 20 },
    bookedCount: { type: Number, default: 0 },
    cutoffDays: { type: Number, default: 2 }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'himalayan'
  },
  tags: [String],
  variants: [mongoose.Schema.Types.Mixed],
  travelOptions: [mongoose.Schema.Types.Mixed],
  roomOptions: [mongoose.Schema.Types.Mixed],
  addons: [mongoose.Schema.Types.Mixed],
  faqs: [mongoose.Schema.Types.Mixed],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  customSections: [mongoose.Schema.Types.Mixed],
  bookingFormLabels: {
    joiningPoint: { type: String, default: "Joining Point" },
    travelers: { type: String, default: "Traveler Manifest" },
    travelOption: { type: String, default: "Train Ticket Option" },
    roomSharing: { type: String, default: "Room Sharing Option" }
  },
  attractions: [mongoose.Schema.Types.Mixed],
  activities: [mongoose.Schema.Types.Mixed],
  accommodations: [mongoose.Schema.Types.Mixed],
  popupDetails: {
    cancellation: [{ 
      label: String, 
      val: String 
    }],
    gears: [mongoose.Schema.Types.Mixed],
    terms: [String],
    carry: [mongoose.Schema.Types.Mixed],
    etiquette: [{
      title: String,
      desc: String
    }],
    customPolicies: [{
      label: String,
      type: { type: String, enum: ["list", "simple", "categorical"], default: "simple" },
      content: mongoose.Schema.Types.Mixed
    }]
  },
  videos: [{
    id: String,
    title: String
  }],
  reels: [{
    url: String,
    thumbnail: String,
    caption: String
  }],
  route: [{
    label: String,
    icon: { type: String, default: "car" }
  }],
  stickyCardPrice: Number,
  stickyCardLabel: String, // e.g. "per person"
  order: {
    type: Number,
    default: 0
  },
  seo: {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    focusKeyword: { type: String, trim: true },
    ogImage: { type: String },
    canonicalUrl: { type: String },
    faqSchema: [{
      question: String,
      answer: String
    }],
    internalLinks: [{
      tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
      label: String
    }]
  }
}, {
  timestamps: true
});

// Trip auto-generated fields in pre-save hook
tripSchema.pre('save', function(next) {
  // Slug
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  
  // Auto SEO Logic
  if (this.isModified('title') || this.isModified('location')) {
    if (!this.seo.metaTitle) {
      this.seo.metaTitle = `${this.title} | ${this.duration} ${this.location} Tour`;
    }
    if (!this.seo.metaDescription) {
      this.seo.metaDescription = `Book your ${this.title} at best prices. Experience ${this.location} like never before with YouthCamping. ${this.duration} of adventure and fun.`;
    }
    if (!this.seo.focusKeyword) {
      this.seo.focusKeyword = `${this.title} ${this.location}`;
    }
  }

  // Mapping status to isActive for backward compatibility
  if (this.isModified('status')) {
    this.isActive = this.status === 'published';
  }

  // Duration Normalization (remove leading zeros, e.g., '06 Days' -> '6 Days')
  if (this.isModified('duration') && this.duration) {
    this.duration = this.duration.replace(/\b0+(\d)/g, '$1');
  }
  
  next();
});

// Indexes for performance
tripSchema.index({ isActive: 1 });
tripSchema.index({ category: 1 });
tripSchema.index({ order: 1 });
tripSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
