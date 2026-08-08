const { prisma } = require("../lib/prisma");

// Get all price overrides for a specific trip
exports.getOverridesForTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    // Optional: filter by isActive
    const { activeOnly } = req.query;
    let where = { tripId };

    if (activeOnly === "true") {
      where.isActive = true;
    }

    const overrides = await prisma.tripDeparturePriceOverride.findMany({
      where,
      orderBy: { departureDate: "asc" },
    });

    res.status(200).json({ success: true, overrides });
  } catch (error) {
    console.error("Error fetching departure pricing overrides:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching pricing overrides",
      });
  }
};

// Create a new price override
exports.createOverride = async (req, res) => {
  try {
    const { tripId } = req.params;
    const { departureDate, overrideType, amount, reason, isActive } = req.body;

    if (!departureDate || !overrideType || amount === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (amount < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount cannot be negative" });
    }

    if (overrideType === "FIXED_PRICE" && amount <= 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Fixed price must be greater than zero",
        });
    }

    // Check if trip exists
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    // Check if an override already exists for this date
    const existingOverride = await prisma.tripDeparturePriceOverride.findUnique(
      {
        where: {
          tripId_departureDate: {
            tripId,
            departureDate,
          },
        },
      },
    );

    if (existingOverride) {
      return res
        .status(400)
        .json({
          success: false,
          message: `An override already exists for ${departureDate}`,
        });
    }

    const createdBy = req.admin ? req.admin.id : req.user ? req.user.id : null;

    const newOverride = await prisma.tripDeparturePriceOverride.create({
      data: {
        tripId,
        departureDate,
        overrideType,
        amount: Number(amount),
        reason,
        isActive: isActive !== undefined ? isActive : true,
        createdBy,
      },
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Pricing override created successfully",
        override: newOverride,
      });
  } catch (error) {
    console.error("Error creating departure pricing override:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error creating pricing override",
      });
  }
};

// Update a price override
exports.updateOverride = async (req, res) => {
  try {
    const { id } = req.params;
    const { overrideType, amount, reason, isActive } = req.body;

    const override = await prisma.tripDeparturePriceOverride.findUnique({
      where: { id },
    });
    if (!override) {
      return res
        .status(404)
        .json({ success: false, message: "Override not found" });
    }

    let updatedAmount = override.amount;
    if (amount !== undefined) {
      if (amount < 0)
        return res
          .status(400)
          .json({ success: false, message: "Amount cannot be negative" });
      if (
        (overrideType || override.overrideType) === "FIXED_PRICE" &&
        amount <= 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Fixed price must be greater than zero",
          });
      }
      updatedAmount = Number(amount);
    }

    const updatedOverride = await prisma.tripDeparturePriceOverride.update({
      where: { id },
      data: {
        overrideType: overrideType || undefined,
        amount: updatedAmount,
        reason: reason !== undefined ? reason : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    res
      .status(200)
      .json({
        success: true,
        message: "Pricing override updated successfully",
        override: updatedOverride,
      });
  } catch (error) {
    console.error("Error updating departure pricing override:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error updating pricing override",
      });
  }
};

// Delete a price override
exports.deleteOverride = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.tripDeparturePriceOverride.delete({ where: { id } });

    res
      .status(200)
      .json({
        success: true,
        message: "Pricing override deleted successfully",
      });
  } catch (error) {
    console.error("Error deleting departure pricing override:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error deleting pricing override",
      });
  }
};
