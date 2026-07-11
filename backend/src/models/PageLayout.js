const mongoose = require('mongoose');

const pageLayoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }, // 'home', 'about', etc
  sections: [{
    id: String, // uuid
    name: String, // internal name
    type: { 
      type: String 
    },
    order: Number,
    visible: Boolean,
    locked: { type: Boolean, default: false },
    content: mongoose.Schema.Types.Mixed, // flexible JSON per section type
    draft: mongoose.Schema.Types.Mixed   // unpublished draft content
  }],
  isDraft: {
    type: Boolean,
    default: true
  },
  publishedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('PageLayout', pageLayoutSchema);
