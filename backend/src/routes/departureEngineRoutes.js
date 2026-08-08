const express = require("express");
const router = express.Router();
const departureEngineCtrl = require("../controllers/departureEngineController");
const roomAllocationCtrl = require("../controllers/roomAllocationController");
const accommodationCtrl = require("../controllers/accommodationController");

// Passenger Statistics Endpoint
router.get("/:tripId/:date/passenger-stats", departureEngineCtrl.getPassengerStatistics);

// Room Allocation Engine Endpoint
router.post("/room-allocation", roomAllocationCtrl.generateRoomAllocation);

// Accommodation Planner Endpoint
router.post("/accommodation-plan", accommodationCtrl.generateAccommodationPlan);

// Hotel Assignment Endpoint
router.post("/hotel-assignment", accommodationCtrl.generateHotelAssignments);

module.exports = router;
