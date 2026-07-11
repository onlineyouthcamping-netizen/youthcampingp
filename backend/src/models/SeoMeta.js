const mongoose = require('mongoose');

const seoMetaSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true,
    unique: true
  }, // 'home', or tripId for trip pages
  metaTitle: String,
  metaDescription: String,
  ogImage: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SeoMeta', seoMetaSchema);
