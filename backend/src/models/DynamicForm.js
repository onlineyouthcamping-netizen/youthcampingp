const mongoose = require('mongoose');

const DynamicFormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a form name'],
    unique: true
  },
  sheetId: {
    type: String,
    required: [true, 'Please add a Google Sheet ID']
  },
  appsScriptUrl: {
    type: String,
    required: [true, 'Please add the Apps Script Web App URL']
  },
  fields: [{
    header: String,
    label: String,
    type: {
      type: String,
      enum: ['text', 'email', 'phone', 'number', 'date', 'select', 'textarea'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    },
    visible: {
      type: Boolean,
      default: true
    },
    options: [String], // For 'select' type
    order: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('DynamicForm', DynamicFormSchema);
