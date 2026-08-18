/**
 * Departure operations routes — merged into opsRoutes.js via router.use().
 * Do not mount separately on /api/ops in app.js.
 *
 * Endpoints (no auth middleware):
 * - POST /api/ops/hotel-bookings/assign
 * - POST /api/ops/hotel-bookings/:id/communicate|confirm|attach
 * - GET  /api/ops/departures/:tripId/:date/dashboard
 */
const express = require("express");
const router = express.Router();
const hotelConfirmationService = require("../services/hotelConfirmationService");
const readinessEngine = require("../services/readinessEngine");

// --- Hotel Operations ---

router.post("/hotel-bookings/assign", async (req, res, next) => {
  try {
    const { tripId, departureDateStr, assignment } = req.body;
    const booking = await hotelConfirmationService.saveAssignment(tripId, departureDateStr, assignment);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

router.post("/hotel-bookings/:id/communicate", async (req, res, next) => {
  try {
    const { id } = req.params;
    const logEntry = req.body;
    const booking = await hotelConfirmationService.addCommunication(id, logEntry);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

router.post("/hotel-bookings/:id/confirm", async (req, res, next) => {
  try {
    const { id } = req.params;
    const details = req.body;
    const booking = await hotelConfirmationService.confirmHotel(id, details);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

router.post("/hotel-bookings/:id/attach", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url } = req.body; // In real life, handled by multer middleware then Cloudinary
    const booking = await hotelConfirmationService.attachFile(id, url);
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

// --- Dashboard & Readiness ---

router.get("/departures/:tripId/:date/dashboard", async (req, res, next) => {
  try {
    const { tripId, date } = req.params;
    const readiness = await readinessEngine.calculateReadiness(tripId, date);
    
    // Mocking other aggregates for the UI
    res.json({ 
      success: true, 
      data: {
        readiness,
        passengers: 42,
        paymentsProgress: "85%",
        estimatedProfit: "₹58,000"
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
