const passengerEngine = require("../services/passengerEngine");

exports.getPassengerStatistics = async (req, res, next) => {
  try {
    const { tripId, date } = req.params;
    
    if (!tripId || !date) {
      return res.status(400).json({ success: false, message: "Missing tripId or date" });
    }

    const stats = await passengerEngine.calculatePassengerStatistics(tripId, date);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
