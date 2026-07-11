const mongoose = require('mongoose');
const slugify = require('slugify');

const attractionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  image: String,
  description: String,
  location: String,
  altitude: String,
  bestTime: String,
  category: {
    type: String,
    default: 'nature'
  },
  visitingHours: String,
  entryFee: String,
  etiquette: [String],
  faqs: [{
    question: String,
    answer: String
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

attractionSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Attraction', attractionSchema);
