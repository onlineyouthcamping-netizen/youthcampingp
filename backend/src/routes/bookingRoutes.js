const express = require('express');
const router = express.Router();
const {
  submitBookingForm,
  getTripInfo,
  getAllBookings,
  getBookingById,
  getBookingPublic,
  confirmBooking,
  updateBooking,
  deleteBooking,
  createBooking,
  getMyBookings,
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  searchByPhone,
  confirmPayment,
  updateBookingUpi,
  getBookingActivityLogs,
  getColleagues,
  getBookingTasks,
  createBookingTask,
  updateBookingTask,
  uploadPassengerDocument,
  downloadPassengerDocument,
  deletePassengerDocument
} = require('../controllers/bookingController');
const documentUpload = require('../middleware/documentUpload');
const { 
  authenticate,
  requirePermission,
  enforceOwnership
} = require('../middleware/auth');
const { guardBookingUpdateFields } = require('../middleware/fieldGuard');
const { stripFinancialFieldsForGuides } = require('../middleware/financialStripper');
const { validate, createBookingSchema } = require('../validators');

const rateLimit = require('express-rate-limit');

const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { success: false, message: "Too many requests. Try again later." }
});

// ── PUBLIC (Client Form) ──
router.get('/trip-info/:tripCode', getTripInfo);
router.post('/submit/:tripCode', submitBookingForm);
router.get('/my-bookings/search', lookupLimiter, searchByPhone);
router.get('/lookup/:bookingId', lookupLimiter, getBookingPublic);

// ── ADMIN: Trip Management ──
router.get('/trips', authenticate, requirePermission('trips.view'), stripFinancialFieldsForGuides, getAllTrips);
router.post('/trips', authenticate, requirePermission('trips.create'), createTrip);
router.put('/trips/:id', authenticate, requirePermission('trips.edit'), enforceOwnership('trip'), updateTrip);
router.delete('/trips/:id', authenticate, requirePermission('trips.delete'), enforceOwnership('trip'), deleteTrip);

// ── ADMIN: Booking Management ──
router.get('/', authenticate, requirePermission('bookings.view'), stripFinancialFieldsForGuides, getAllBookings);
// PUBLIC: customer booking submissions (can also be created by sales/admin manually)
router.post('/', (req, res, next) => {
  // If request has Authorization header, authenticate it first, otherwise bypass
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, validate(createBookingSchema), createBooking);

router.post('/create', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticate(req, res, next);
  }
  next();
}, validate(createBookingSchema), createBooking);

router.get('/colleagues/list', authenticate, getColleagues);
router.put('/tasks/:taskId', authenticate, updateBookingTask);

router.get('/my-bookings', authenticate, getMyBookings);

router.get('/:id', authenticate, requirePermission('bookings.view'), enforceOwnership('booking'), stripFinancialFieldsForGuides, getBookingById);
router.put('/:id/confirm', authenticate, requirePermission('bookings.approve'), enforceOwnership('booking'), confirmBooking);
router.put('/:id', authenticate, requirePermission('bookings.edit'), enforceOwnership('booking'), guardBookingUpdateFields, updateBooking);
router.patch('/:id/confirm-payment', authenticate, requirePermission('payments.edit'), enforceOwnership('booking'), confirmPayment);
router.patch('/:id', authenticate, requirePermission('bookings.edit'), enforceOwnership('booking'), guardBookingUpdateFields, updateBookingUpi);
router.get('/:id/activity-logs', authenticate, requirePermission('bookings.view'), enforceOwnership('booking'), getBookingActivityLogs);
router.get('/:id/tasks', authenticate, requirePermission('bookings.view'), enforceOwnership('booking'), getBookingTasks);
router.post('/:id/tasks', authenticate, requirePermission('bookings.edit'), enforceOwnership('booking'), createBookingTask);
router.post('/:id/passengers/:passengerId/document', authenticate, documentUpload.single('document'), uploadPassengerDocument);
router.get('/:id/passengers/:passengerId/document', authenticate, downloadPassengerDocument);
router.delete('/:id/passengers/:passengerId/document', authenticate, deletePassengerDocument);
router.delete('/:id', authenticate, requirePermission('bookings.delete'), enforceOwnership('booking'), deleteBooking);

module.exports = router;
