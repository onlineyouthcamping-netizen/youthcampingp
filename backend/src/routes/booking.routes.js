const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  getBookingById,
  updateBooking,
  deleteBooking,
  getTrips 
} = require('../controllers/bookingController');
const { protectAny } = require('../middleware/auth');

// Apply protection to all booking routes
router.use(protectAny);

// ── ADMIN ROUTES ──
router.post("/bookings", createBooking);
router.get("/bookings", getBookings);
router.get("/bookings/trips", getTrips);
router.get("/bookings/:id", getBookingById);
router.put("/bookings/:id", updateBooking);
router.delete("/bookings/:id", deleteBooking);

module.exports = router;
