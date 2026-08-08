const roomAllocationEngine = require("../services/roomAllocationEngine");

exports.generateRoomAllocation = async (req, res, next) => {
  try {
    // We expect the passenger stats payload to be sent in the request body
    // This allows the engine to remain entirely stateless and fully decoupled from the DB.
    const passengerStats = req.body;

    if (!passengerStats || !passengerStats.summary) {
      return res.status(400).json({ success: false, message: "Invalid PassengerEngineOutput payload provided." });
    }

    const allocationResult = roomAllocationEngine.generateLogicalRooms(passengerStats);

    res.json({
      success: true,
      data: allocationResult
    });
  } catch (error) {
    next(error);
  }
};
