const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'YouthCamping'
  },
  contactEmail: {
    type: String,
    default: 'youthcampingmedia@gmail.com'
  },
  contactPhone: {
    type: String,
    default: '+919924246267'
  },
  address: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'INR'
  },
  socialLinks: {
    facebook: { type: String, default: 'https://facebook.com/youthcamping/' },
    instagram: { type: String, default: 'https://instagram.com/youthcamping.online/' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: 'https://youtube.com/channel/UC378U1Xiw7ZWCdj84FFVFtw' },
    linkedin: { type: String, default: 'https://linkedin.com/company/youthcamping-online' }
  },
  logo: {
    type: String,
    default: ''
  },
  favicon: {
    type: String,
    default: ''
  },
  theme: {
    primaryColor: { type: String, default: '#FF5B00' },
    accentColor: { type: String, default: '#00CBD0' },
    borderRadius: { type: Number, default: 20 },
    primaryFont: { type: String, default: 'Montserrat' },
    handwritingFont: { type: String, default: 'Dancing Script' },
    headerTitle: { type: String, default: 'YouthCamping' }
  },
  dimensions: {
    heroHeight: { type: Number, default: 650 },
    containerWidth: { type: Number, default: 1280 },
    sectionSpacing: { type: Number, default: 80 }
  },
  organization: {
    name: { type: String, default: 'YouthCamping' },
    logo: { type: String, default: '' },
    website: { type: String, default: 'https://youthcamping.online' },
    supportEmail: { type: String, default: 'youthcampingmedia@gmail.com' },
    supportPhone: { type: String, default: '+919924246267' },
    mailingAddress: { type: String, default: 'A - 738, Money Plant High Street, IIM Road, Ahmedabad, Gujarat 380015' }
  },
  seo: {
    metaTitle: { type: String, default: 'YouthCamping - Adventure & Travel' },
    metaDescription: { type: String, default: 'Experience the best adventure tours and camping trips with YouthCamping.' },
    googleAnalyticsId: { type: String, default: '' },
    googleSearchConsoleId: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    robotsTxt: { type: String, default: '' },
    schemaEnabled: { type: Boolean, default: true },
    redirects: [{
      from: { type: String, required: true },
      to: { type: String, required: true },
      type: { type: String, enum: ['301', '302'], default: '301' }
    }]
  },
  inquiryPopup: {
    enabled: { type: Boolean, default: true },
    delay: { type: Number, default: 15 },
    cooldown: { type: Number, default: 900 }
  },
  smtp: {
    host: { type: String, default: 'smtp.gmail.com' },
    port: { type: Number, default: 587 },
    user: { type: String, default: '' },
    pass: { type: String, default: '' },
    isEnabled: { type: Boolean, default: false }
  },
  taxes: [{
    name: { type: String, required: true },
    registrationNumber: String,
    startDate: Date,
    endDate: Date,
    amount: { type: Number, required: true },
    amountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
    leviedOn: { type: String, enum: ['all', 'specific', 'filter'], default: 'all' },
    isEnabled: { type: Boolean, default: true }
  }],
  tripCustomFields: [{
    label: { type: String, required: true },
    type: { type: String, enum: ['rich-text', 'html', 'video', 'text'], default: 'rich-text' },
    helpText: String,
    isRequired: { type: Boolean, default: false }
  }],
  navigation: {
    headerLinks: [{
      label: { type: String, default: '' },
      url: { type: String, default: '' },
      isExternal: { type: Boolean, default: false },
      items: [{ label: String, url: String }]
    }]
  },
  footer: {
    columns: [{
      title: { type: String, default: '' },
      type: { type: String, enum: ['links', 'text', 'contact', 'social'], default: 'links' },
      content: { type: String, default: '' },
      links: [{ label: String, url: String }]
    }],
    copyrightText: { type: String, default: '© 2026 YouthCamping. All rights reserved.' }
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);
