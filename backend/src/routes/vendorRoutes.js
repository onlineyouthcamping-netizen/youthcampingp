const express = require('express');
const router = express.Router();
const {
  createVendor,
  getVendors,
  getVendor,
  updateVendor,
  deleteVendor,
  assignVendorToTrip,
  getVendorsForTrip,
  updateTripVendor,
  removeTripVendor,
  getBulkTripVendors
} = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');

// All vendor routes are admin-only
router.use(protect);

// Vendor CRUD
router.post('/', createVendor);
router.get('/', getVendors);
router.get('/bulk', getBulkTripVendors);
router.get('/:id', getVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

// Trip-Vendor assignment
router.post('/trip-assign', assignVendorToTrip);
router.get('/trip/:tripId', getVendorsForTrip);
router.put('/trip-assign/:id', updateTripVendor);
router.delete('/trip-assign/:id', removeTripVendor);

module.exports = router;
