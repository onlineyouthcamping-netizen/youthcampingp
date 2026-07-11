const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
  logo: { 
    url: String, 
    alt: String 
  },
  navbarLinks: [{ 
    label: String, 
    href: String, 
    order: Number 
  }],
  footer: { 
    tagline: String, 
    copyright: String, 
    columns: mongoose.Schema.Types.Mixed 
  },
  social: { 
    instagram: String, 
    facebook: String, 
    youtube: String, 
    whatsapp: String 
  },
  contact: { 
    phone: String, 
    email: String, 
    address: String 
  },
  bookingForm: {
    roomSharingOptions: [{
      label: { type: String, default: 'Twin Sharing' },
      priceAdjustment: { type: Number, default: 2000 }
    }, {
      label: { type: String, default: 'Triple Sharing' },
      priceAdjustment: { type: Number, default: 1000 }
    }, {
      label: { type: String, default: 'Quad Sharing' },
      priceAdjustment: { type: Number, default: 0 }
    }],
    trainOptions: [{
      label: { type: String, default: '3AC' },
      priceAdjustment: { type: Number, default: 2500 }
    }, {
      label: { type: String, default: 'Non AC' },
      priceAdjustment: { type: Number, default: 0 }
    }, {
      label: { type: String, default: 'No Train' },
      priceAdjustment: { type: Number, default: -1500 }
    }],
    submitButtonText: { type: String, default: 'Confirm Booking' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
