const express = require("express");
const router = express.Router();
const departureEngineCtrl = require("../controllers/departureEngineController");
const roomAllocationCtrl = require("../controllers/roomAllocationController");
const accommodationCtrl = require("../controllers/accommodationController");
const { authenticate, requirePermission } = require("../middleware/auth");

// Departure Resolution & Auto-Creation
router.get(
  "/resolve",
  authenticate,
  requirePermission("departures.view"),
  departureEngineCtrl.resolveDeparture
);

// Departure Status Transition (Authoritative Backend Validation)
router.put(
  "/status",
  authenticate,
  requirePermission("departures.edit"),
  departureEngineCtrl.updateStatus
);

// Departure Authoritative Readiness
router.get(
  "/readiness",
  authenticate,
  requirePermission("departures.view"),
  departureEngineCtrl.getReadiness
);

// Passenger Statistics Endpoint
router.get("/:tripId/:date/passenger-stats", departureEngineCtrl.getPassengerStatistics);

// Room Allocation Engine Endpoint
router.post("/room-allocation", roomAllocationCtrl.generateRoomAllocation);

// Accommodation Planner Endpoint
router.post("/accommodation-plan", accommodationCtrl.generateAccommodationPlan);

// Hotel Assignment Endpoint
router.post("/hotel-assignment", accommodationCtrl.generateHotelAssignments);

module.exports = router;
