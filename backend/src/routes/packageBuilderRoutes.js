const express = require('express');
const router = express.Router();
const {
  getStates,
  createState,
  updateState,
  deleteState,
  getCities,
  createCity,
  updateCity,
  deleteCity,
  getHotels,
  createHotel,
  updateHotel,
  deleteHotel,
  getHotelTariffs,
  createHotelTariff,
  deleteHotelTariff,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleTariffs,
  createVehicleTariff,
  deleteVehicleTariff,
  getTransferRoutes,
  createTransferRoute,
  updateTransferRoute,
  deleteTransferRoute,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getPackageVendors,
  createPackageVendor,
  updatePackageVendor,
  deletePackageVendor,
  getMasterDashboardStats,
  getPackageDrafts,
  createPackageDraft,
  getPackageDraft,
  updatePackageDraft,
  deletePackageDraft,
  duplicatePackageDraft,
  addItineraryDay,
  updateItineraryDay,
  deleteItineraryDay,
  reorderItineraryDays,
  duplicateItineraryDay,
  addItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  reorderItineraryItems,
  recalculatePackagePrice,
  generateQuote,
  convertToBooking,
  getPackageActivityLogs
} = require('../controllers/packageBuilderController');
const { protect, requirePermission } = require('../middleware/auth');

router.use(protect);

// ── Master Data: States ──
router.get('/master/states', requirePermission('packages.view'), getStates);
router.post('/master/states', requirePermission('packages.manage'), createState);
router.put('/master/states/:id', requirePermission('packages.manage'), updateState);
router.delete('/master/states/:id', requirePermission('packages.manage'), deleteState);

// ── Master Data: Cities ──
router.get('/master/cities', requirePermission('packages.view'), getCities);
router.post('/master/cities', requirePermission('packages.manage'), createCity);
router.put('/master/cities/:id', requirePermission('packages.manage'), updateCity);
router.delete('/master/cities/:id', requirePermission('packages.manage'), deleteCity);

// ── Master Data: Hotels ──
router.get('/master/hotels', requirePermission('packages.view'), getHotels);
router.post('/master/hotels', requirePermission('packages.manage'), createHotel);
router.put('/master/hotels/:id', requirePermission('packages.manage'), updateHotel);
router.delete('/master/hotels/:id', requirePermission('packages.manage'), deleteHotel);
router.get('/master/hotels/:id/tariffs', requirePermission('packages.view'), getHotelTariffs);
router.post('/master/hotels/:id/tariffs', requirePermission('packages.manage'), createHotelTariff);
router.delete('/master/hotels/:id/tariffs/:tariffId', requirePermission('packages.manage'), deleteHotelTariff);

// ── Master Data: Vehicles ──
router.get('/master/vehicles', requirePermission('packages.view'), getVehicles);
router.post('/master/vehicles', requirePermission('packages.manage'), createVehicle);
router.put('/master/vehicles/:id', requirePermission('packages.manage'), updateVehicle);
router.delete('/master/vehicles/:id', requirePermission('packages.manage'), deleteVehicle);
router.get('/master/vehicles/:id/tariffs', requirePermission('packages.view'), getVehicleTariffs);
router.post('/master/vehicles/:id/tariffs', requirePermission('packages.manage'), createVehicleTariff);
router.delete('/master/vehicles/:id/tariffs/:tariffId', requirePermission('packages.manage'), deleteVehicleTariff);

// ── Master Data: Transfer Routes ──
router.get('/master/transfer-routes', requirePermission('packages.view'), getTransferRoutes);
router.post('/master/transfer-routes', requirePermission('packages.manage'), createTransferRoute);
router.put('/master/transfer-routes/:id', requirePermission('packages.manage'), updateTransferRoute);
router.delete('/master/transfer-routes/:id', requirePermission('packages.manage'), deleteTransferRoute);

// ── Master Data: Activities ──
router.get('/master/activities', requirePermission('packages.view'), getActivities);
router.post('/master/activities', requirePermission('packages.manage'), createActivity);
router.put('/master/activities/:id', requirePermission('packages.manage'), updateActivity);
router.delete('/master/activities/:id', requirePermission('packages.manage'), deleteActivity);

// ── Master Data: Meal Plans ──
router.get('/master/meal-plans', requirePermission('packages.view'), getMealPlans);
router.post('/master/meal-plans', requirePermission('packages.manage'), createMealPlan);
router.put('/master/meal-plans/:id', requirePermission('packages.manage'), updateMealPlan);
router.delete('/master/meal-plans/:id', requirePermission('packages.manage'), deleteMealPlan);

// ── Master Data: Vendors ──
router.get('/master/vendors', requirePermission('packages.view'), getPackageVendors);
router.post('/master/vendors', requirePermission('packages.manage'), createPackageVendor);
router.put('/master/vendors/:id', requirePermission('packages.manage'), updatePackageVendor);
router.delete('/master/vendors/:id', requirePermission('packages.manage'), deletePackageVendor);

// ── Master Data: Stats ──
router.get('/master/stats', requirePermission('packages.view'), getMasterDashboardStats);

// ── Package Drafts ──
router.get('/packages', requirePermission('packages.view'), getPackageDrafts);
router.post('/packages', requirePermission('packages.view'), createPackageDraft);
router.get('/packages/:id', requirePermission('packages.view'), getPackageDraft);
router.put('/packages/:id', requirePermission('packages.view'), updatePackageDraft);
router.delete('/packages/:id', requirePermission('packages.view'), deletePackageDraft);
router.post('/packages/:id/duplicate', requirePermission('packages.view'), duplicatePackageDraft);

// ── Package Drafts: Itinerary Days ──
router.post('/packages/:id/days', requirePermission('packages.view'), addItineraryDay);
router.put('/packages/:id/days/:dayId', requirePermission('packages.view'), updateItineraryDay);
router.delete('/packages/:id/days/:dayId', requirePermission('packages.view'), deleteItineraryDay);
router.put('/packages/:id/days/reorder', requirePermission('packages.view'), reorderItineraryDays);
router.post('/packages/:id/days/:dayId/duplicate', requirePermission('packages.view'), duplicateItineraryDay);

// ── Package Drafts: Itinerary Items ──
router.post('/packages/:id/days/:dayId/items', requirePermission('packages.view'), addItineraryItem);
router.put('/packages/:id/days/:dayId/items/:itemId', requirePermission('packages.view'), updateItineraryItem);
router.delete('/packages/:id/days/:dayId/items/:itemId', requirePermission('packages.view'), deleteItineraryItem);
router.put('/packages/:id/days/:dayId/items/reorder', requirePermission('packages.view'), reorderItineraryItems);

// ── Package Drafts: Actions ──
router.post('/packages/:id/recalculate', requirePermission('packages.view'), recalculatePackagePrice);
router.post('/packages/:id/generate-quote', requirePermission('packages.view'), generateQuote);
router.post('/packages/:id/convert-to-booking', requirePermission('packages.manage'), convertToBooking);

// ── Package Drafts: Activity Logs ──
router.get('/packages/:id/activity-logs', requirePermission('packages.view'), getPackageActivityLogs);

module.exports = router;
