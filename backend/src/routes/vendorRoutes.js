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
  getBulkTripVendors,
  // New Ops Vendor & Rates CRUD
  getOpsVendors,
  getOpsVendor,
  createOpsVendor,
  updateOpsVendor,
  activateOpsVendor,
  deleteOpsVendor,
  getAccommodationRates,
  createAccommodationRate,
  getTransportRates,
  createTransportRate,
  getAdditionalCharges,
  createAdditionalCharge,
  getDepartureAllocations,
  saveDepartureAllocations,
  getVendorsByTrip,
  getVendorsByTripAndCategory,
  getVendorsByTripAndCity,
  getTripVendorRates,
  createTripVendorMapping,
  createTripVendorRate,
  updateTripVendorRate
} = require('../controllers/vendorController');

const {
  getImportPreview,
  confirmImport
} = require('../controllers/vendorImportController');

const { protect, requirePermission } = require('../middleware/auth');

// All vendor routes require authentication
router.use(protect);

// Excel Import wizard
router.get('/import/preview', requirePermission('vendors.import'), getImportPreview);
router.post('/import/preview', requirePermission('vendors.import'), getImportPreview);
router.post('/import/confirm', requirePermission('vendors.import'), confirmImport);

// Trip-wise mapping & rates routes
router.get('/trips/:tripId', requirePermission('vendors.view'), getVendorsByTrip);
router.get('/trips/:tripId/categories/:category', requirePermission('vendors.view'), getVendorsByTripAndCategory);
router.get('/trips/:tripId/cities/:city', requirePermission('vendors.view'), getVendorsByTripAndCity);
router.get('/trips/:tripId/rates', requirePermission('vendors.view'), getTripVendorRates);
router.post('/trip-mapping', requirePermission('vendors.trip.assign'), createTripVendorMapping);
router.post('/rates', requirePermission('vendors.rate.manage'), createTripVendorRate);
router.put('/rates/:rateId', requirePermission('vendors.rate.manage'), updateTripVendorRate);

// ── NEW: DIRECTORY VENDOR SYSTEM ROUTING ──
const dirCtrl = require('../controllers/directoryVendorController');

// Search & options
router.get('/directory/search/by-location', requirePermission('vendors.view'), dirCtrl.searchVendorsByLocation);
router.get('/directory/trips/:tripId/options', requirePermission('vendors.view'), dirCtrl.getTripVendorOptions);
router.post('/directory/trips/:tripId/mappings', requirePermission('vendors.mapping.manage'), dirCtrl.saveTripVendorMappings);

// Costing & Snapshots
router.post('/directory/costing/calculate', requirePermission('vendors.costing.calculate'), dirCtrl.calculateVendorCosting);
router.post('/directory/costing/snapshot', requirePermission('vendors.costing.calculate'), dirCtrl.createCostingSnapshot);

// Payments CRUD
router.get('/directory/payments', requirePermission('vendors.payments.view'), dirCtrl.getVendorPayments);
router.post('/directory/payments', requirePermission('vendors.payments.manage'), dirCtrl.createVendorPayment);
router.patch('/directory/payments/:paymentId', requirePermission('vendors.payments.manage'), dirCtrl.updateVendorPayment);

// Rates CRUD
router.post('/directory/:vendorId/room-rates', requirePermission('vendors.rates.manage'), dirCtrl.createDirectoryRoomRate);
router.post('/directory/:vendorId/transport-rates', requirePermission('vendors.rates.manage'), dirCtrl.createDirectoryTransportRate);
router.post('/directory/:vendorId/food-rates', requirePermission('vendors.rates.manage'), dirCtrl.createDirectoryFoodRate);
router.post('/directory/:vendorId/guide-rates', requirePermission('vendors.rates.manage'), dirCtrl.createDirectoryGuideRate);
router.post('/directory/:vendorId/misc-charges', requirePermission('vendors.rates.manage'), dirCtrl.createDirectoryMiscCharge);

// Non-namespaced Rates CRUD aliases
router.post('/:vendorId/room-rates', requirePermission('vendors.rates.manage'), dirCtrl.createDirectoryRoomRate);
router.post('/:vendorId/transport-rates', requirePermission('vendors.rates.manage'), dirCtrl.createDirectoryTransportRate);
router.post('/:vendorId/misc-charges', requirePermission('vendors.rates.manage'), dirCtrl.createDirectoryMiscCharge);

// Main Directory Vendor CRUD
router.get('/directory', requirePermission('vendors.view'), dirCtrl.getDirectoryVendors);
router.post('/directory', requirePermission('vendors.create'), dirCtrl.createDirectoryVendor);
router.get('/directory/:vendorId', requirePermission('vendors.view'), dirCtrl.getDirectoryVendor);
router.patch('/directory/:vendorId', requirePermission('vendors.edit'), dirCtrl.updateDirectoryVendor);
router.delete('/directory/:vendorId', requirePermission('vendors.deactivate'), dirCtrl.deleteDirectoryVendor);

// Ops Vendor Directory CRUD
router.get('/ops', requirePermission('vendors.view'), getOpsVendors);
router.get('/ops/:id', requirePermission('vendors.view'), getOpsVendor);
router.post('/ops', requirePermission('vendors.create'), createOpsVendor);
router.put('/ops/:id', requirePermission('vendors.edit'), updateOpsVendor);
router.post('/ops/:id/activate', requirePermission('vendors.activate'), activateOpsVendor);
router.delete('/ops/:id', requirePermission('vendors.delete'), deleteOpsVendor);

// Rates Directory
router.get('/rates/accommodation', requirePermission('vendors.view'), getAccommodationRates);
router.post('/rates/accommodation', requirePermission('vendors.create'), createAccommodationRate);
router.get('/rates/transport', requirePermission('vendors.view'), getTransportRates);
router.post('/rates/transport', requirePermission('vendors.create'), createTransportRate);
router.get('/rates/additional-charges', requirePermission('vendors.view'), getAdditionalCharges);
router.post('/rates/additional-charges', requirePermission('vendors.create'), createAdditionalCharge);

// Departure Allocation Persistence
router.get('/departures/:departureId/allocations', requirePermission('vendors.view'), getDepartureAllocations);
router.post('/departures/:departureId/allocations', requirePermission('ops.vendor.allocate'), saveDepartureAllocations);

// Legacy/Existing Vendor CRUD
router.post('/', createVendor);
router.get('/', getVendors);
router.get('/bulk', getBulkTripVendors);
router.get('/:id', getVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

// Legacy/Existing Trip-Vendor assignment
router.post('/trip-assign', assignVendorToTrip);
router.get('/trip/:tripId', getVendorsForTrip);
router.put('/trip-assign/:id', updateTripVendor);
router.delete('/trip-assign/:id', removeTripVendor);

module.exports = router;
