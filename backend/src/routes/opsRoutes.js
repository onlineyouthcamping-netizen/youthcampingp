const express = require('express');
const router = express.Router();
const {
  getVendors,
  createVendor,
  getDayItinerary,
  upsertDayItinerary,
  deleteDayItinerary,
  getTripExpenses,
  upsertTripExpense,
  deleteTripExpense,
  getHotelBookings,
  createHotelBooking,
  deleteHotelBooking,
  getTransportFleet,
  createTransportFleet,
  deleteTransportFleet,
  getRoomInventory,
  createRoomInventory,
  deleteRoomInventory,
  getGuidePayments,
  createGuidePayment,
  getWorkspaceSummary,
  getOpsAccountingSummary,
  getSeatConfig,
  getChecklist,
  initializeChecklist,
  completeChecklistItem,
  reopenChecklistItem,
  createChecklistItem,
  getIncidents,
  createIncident,
  resolveIncident,
  reopenIncident,
  generateAllocation,
  confirmAllocation,
  getConfirmedAllocations,
  overrideAllocation,
  getSopLibrary,
  createSopLibrary,
  updateSopLibrary,
  archiveSopLibrary,
  restoreSopLibrary,
  getTripLeader,
  assignTripLeader,
  patchTripLeader,
  archiveTripLeader,
  restoreTripLeader,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  copyActivities,
  getVendorRates,
  saveVendorRate,
  createHotelOverride,
  resetHotelOverride,
  saveManualAllocations,
  updateGuidePayment,
  deleteGuidePayment,
  updateTransportFleet,
  getTransportPassengerGroups
} = require('../controllers/opsController');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);

// Directory
router.get('/vendors', requirePermission('ops.view'), getVendors);
router.post('/vendors', requirePermission('ops.manage'), createVendor);
router.get('/vendors/:vendorId/rates', requirePermission('ops.view'), getVendorRates);
router.post('/vendors/:vendorId/rates', requirePermission('ops.manage'), saveVendorRate);

// Excel Match Grids (Scoped by departureDate in query params)
router.get('/itinerary/:tripId', requirePermission('ops.view'), getDayItinerary);
router.post('/itinerary/:tripId', requirePermission('ops.manage'), upsertDayItinerary);
router.delete('/itinerary/:id', requirePermission('ops.manage'), deleteDayItinerary);

// Activities Grid (Scoped by departureDate in query params)
router.get('/activities/:tripId', requirePermission('ops.view'), getActivities);
router.post('/activities/:tripId', requirePermission('ops.manage'), createActivity);
router.put('/activities/:tripId/:id', requirePermission('ops.manage'), updateActivity);
router.delete('/activities/:id', requirePermission('ops.manage'), deleteActivity);
router.post('/activities/:tripId/copy', requirePermission('ops.manage'), copyActivities);

router.get('/expenses/:tripId', requirePermission('ops.view'), getTripExpenses);
router.post('/expenses/:tripId', requirePermission('ops.manage'), upsertTripExpense);
router.delete('/expenses/:id', requirePermission('ops.manage'), deleteTripExpense);

// Trackers
router.get('/hotels/:tripId', requirePermission('ops.view'), getHotelBookings);
router.post('/hotels/:tripId', requirePermission('ops.manage'), createHotelBooking);
router.delete('/hotels/:id', requirePermission('ops.manage'), deleteHotelBooking);
router.post('/hotels/:tripId/override', requirePermission('ops.manage'), createHotelOverride);
router.post('/hotels/:tripId/reset-override', requirePermission('ops.manage'), resetHotelOverride);
router.get('/guides/:tripId', requirePermission('ops.view'), getGuidePayments);
router.post('/guides/:tripId', requirePermission('ops.manage'), createGuidePayment);
router.put('/guides/:id', requirePermission('ops.manage'), updateGuidePayment);
router.delete('/guides/:id', requirePermission('ops.manage'), deleteGuidePayment);

// Transport
router.get('/transport/:tripId', requirePermission('ops.view'), getTransportFleet);
router.post('/transport/:tripId', requirePermission('ops.manage'), createTransportFleet);
router.put('/transport/:id', requirePermission('ops.manage'), updateTransportFleet);
router.delete('/transport/:id', requirePermission('ops.manage'), deleteTransportFleet);
router.get('/transport/:tripId/passenger-groups', requirePermission('ops.view'), getTransportPassengerGroups);

// Summary & Seats
router.get('/summary/:tripId', requirePermission('ops.view'), getWorkspaceSummary);
router.get('/accounting-summary/:tripId', requirePermission('ops.view'), getOpsAccountingSummary);
router.get('/seats/:tripId', requirePermission('ops.view'), getSeatConfig);

// SOP & Checklists & Incidents
router.get('/checklists/:tripId', requirePermission('ops.view'), getChecklist);
router.post('/checklists/:tripId/initialize', requirePermission('ops.checklist'), initializeChecklist);
router.post('/checklists/complete', requirePermission('ops.checklist'), completeChecklistItem);
router.post('/checklists/reopen', requirePermission('ops.checklist'), reopenChecklistItem);
router.post('/checklists/create', requirePermission('ops.checklist'), createChecklistItem);
router.get('/incidents/:tripId', requirePermission('ops.view'), getIncidents);
router.post('/incidents', requirePermission('ops.checklist'), createIncident);
router.post('/incidents/:id/resolve', requirePermission('ops.checklist'), resolveIncident);
router.post('/incidents/:id/reopen', requirePermission('ops.checklist'), reopenIncident);

// SOP Library & Trip Leader Assignments
router.get('/sop-library', requirePermission('ops.view'), getSopLibrary);
router.post('/sop-library', requirePermission('ops.manage'), createSopLibrary);
router.patch('/sop-library/:id', requirePermission('ops.manage'), updateSopLibrary);
router.post('/sop-library/:id/archive', requirePermission('ops.manage'), archiveSopLibrary);
router.post('/sop-library/:id/restore', requirePermission('ops.manage'), restoreSopLibrary);
router.get('/leaders/:tripId', requirePermission('ops.view'), getTripLeader);
router.post('/leaders/:tripId', requirePermission('ops.manage'), assignTripLeader);
router.patch('/leaders/:tripId', requirePermission('ops.manage'), patchTripLeader);
router.post('/leaders/:tripId/archive', requirePermission('ops.manage'), archiveTripLeader);
router.post('/leaders/:tripId/restore', requirePermission('ops.manage'), restoreTripLeader);

// Auto Allocation Engine (Draft, Confirm, Override)
router.get('/auto-allocate/:tripId', requirePermission('ops.allocate'), generateAllocation);
router.get('/auto-allocate/:tripId/confirmed', requirePermission('ops.view'), getConfirmedAllocations);
router.post('/auto-allocate/confirm', requirePermission('ops.allocate'), confirmAllocation);
router.post('/auto-allocate/override', requirePermission('ops.allocate'), overrideAllocation);
router.post('/auto-allocate/manual-save', requirePermission('ops.allocate'), saveManualAllocations);

module.exports = router;
