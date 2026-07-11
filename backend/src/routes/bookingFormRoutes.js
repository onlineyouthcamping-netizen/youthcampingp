const express = require('express');
const router = express.Router();
const {
  createBookingForm,
  getBookingForms,
  lookupBookingForm,
  deleteBookingForm,
  updateBookingForm,
  getShareMessage,
  createPublicBooking
} = require('../controllers/bookingFormController');
const { protect } = require('../middleware/auth');

// Public route for form submission
router.post('/public-submit', createPublicBooking);

// All other routes are admin-only
router.use(protect);

router.post('/create', createBookingForm);
router.get('/', getBookingForms);
router.get('/lookup', lookupBookingForm);
router.put('/:id', updateBookingForm);
router.post('/share-message', getShareMessage);

router.delete('/:id', deleteBookingForm);

module.exports = router;
