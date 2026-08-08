const accommodationPlanner = require("../services/accommodationPlanner");
const hotelAssignmentEngine = require("../services/hotelAssignmentEngine");

exports.generateAccommodationPlan = async (req, res, next) => {
  try {
    const { tripId, departureDateStr, allocationRequirements } = req.body;
    
    if (!tripId || !departureDateStr) {
      return res.status(400).json({ success: false, message: "Missing tripId or departureDateStr" });
    }

    const stays = await accommodationPlanner.generateAccommodationPlan(tripId, departureDateStr, allocationRequirements || {});
    
    res.json({ success: true, data: stays });
  } catch (error) {
    next(error);
  }
};

exports.generateHotelAssignments = async (req, res, next) => {
  try {
    const { stay } = req.body; // Expects a 'stay' object outputted by accommodation planner

    if (!stay || !stay.city || !stay.checkIn || !stay.checkOut || !stay.requirements) {
      return res.status(400).json({ success: false, message: "Invalid stay object provided." });
    }

    const assignments = await hotelAssignmentEngine.generateHotelAssignments(stay);
    
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};
