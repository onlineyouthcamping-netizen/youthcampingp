const express = require("express");
const router = express.Router();
const departurePricingController = require("../controllers/departurePricingController");
const { requireAdmin } = require("../middleware/auth");

// Note: These routes are likely mounted at /api/trips/:tripId/departure-pricing
// OR they might be mounted at /api/departure-pricing with full paths here.

// Get overrides for a trip
router.get(
  "/trips/:tripId/departure-pricing",
  departurePricingController.getOverridesForTrip,
);

// Add an override to a trip (Admin only)
router.post(
  "/trips/:tripId/departure-pricing",
  requireAdmin,
  departurePricingController.createOverride,
);

// Update an override (Admin only)
router.put(
  "/departure-pricing/:id",
  requireAdmin,
  departurePricingController.updateOverride,
);

// Delete an override (Admin only)
router.delete(
  "/departure-pricing/:id",
  requireAdmin,
  departurePricingController.deleteOverride,
);

module.exports = router;
