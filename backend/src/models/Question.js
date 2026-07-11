const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a question title'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Please add options'],
    validate: {
      validator: function(v) {
        return v.length >= 2;
      },
      message: 'A question must have at least 2 options'
    }
  },
  answer: {
    type: String,
    required: [true, 'Please add an answer']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    default: 'General'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);
