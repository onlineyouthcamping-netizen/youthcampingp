const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a blog title'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  author: {
    type: String,
    required: [true, 'Please provide an author name'],
    default: 'Expedition Team'
  },
  authorImage: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: [true, 'Please provide blog content']
  },
  image: {
    type: String,
    required: [true, 'Please provide a featured image URL']
  },
  readTime: {
    type: String,
    default: '5 MIN READ'
  },
  videoUrl: {
    type: String,
    default: ''
  },
  hasVideo: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create slug from title before saving if not provided
blogSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
