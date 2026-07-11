const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  userImage: {
    type: String,
    default: 'https://i.pravatar.cc/150?u=default'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  instagram: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || (v.startsWith('https://instagram.com/') && v.length > 22);
      },
      message: props => `${props.value} is not a valid Instagram URL!`
    }
  },
  city: {
    type: String,
    required: [true, 'City is required for the reviewer']
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  tripName: String,
  isFeatured: {
    type: Boolean,
    default: false
  },
  photos: [String],
  tripType: {
    type: String,
    default: 'Joined Group Trip'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
