const express = require('express');
const router = express.Router();
const {
  getFormStructure,
  submitFormData,
  saveFormConfig,
  getForms
} = require('../controllers/dynamicFormController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/:id/structure', getFormStructure);
router.post('/:id/submit', submitFormData);

// Admin routes
router.use(protect);
router.get('/', getForms);
router.post('/config', saveFormConfig);

module.exports = router;
