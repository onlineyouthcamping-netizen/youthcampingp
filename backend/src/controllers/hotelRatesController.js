const prisma = require('../lib/prisma');

/**
 * Fetch all rates for a specific hotel and year (defaults to 2027)
 * GET /api/hotel-rates/:hotel_id?year=2027
 */
exports.getRates = async (req, res) => {
  try {
    const { hotel_id } = req.params;
    const year = parseInt(req.query.year) || 2027;

    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(hotel_id) },
    });

    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const rates = await prisma.hotelRate.findMany({
      where: {
        hotelId: parseInt(hotel_id),
        year: year,
      },
      orderBy: { month: 'asc' },
    });

    // Format the rates to match expected response
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const formattedRates = rates.map(rate => ({
      id: rate.id,
      month: rate.month,
      month_name: monthNames[rate.month - 1],
      double_sharing_per_room: rate.doubleRoom,
      double_sharing_per_pax: rate.doublePax,
      triple_sharing_per_room: rate.tripleRoom,
      triple_sharing_per_pax: rate.triplePax,
      quad_sharing_per_room: rate.quadRoom,
      quad_sharing_per_pax: rate.quadPax,
    }));

    res.json({
      success: true,
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      year,
      rates: formattedRates
    });
  } catch (error) {
    console.error('Error fetching hotel rates:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Create or bulk-import hotel rates
 * POST /api/hotel-rates/create
 */
exports.createRates = async (req, res) => {
  try {
    const { hotel_id, destination_id, rates } = req.body;

    if (!hotel_id || !destination_id || !Array.isArray(rates)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    // Delete existing rates for those months to prevent duplicates, or use upsert
    // For simplicity, we can loop and upsert
    let createdCount = 0;
    const upsertedRates = [];

    for (const rate of rates) {
      const year = rate.year || 2027;
      const r = await prisma.hotelRate.upsert({
        where: {
          hotelId_destinationId_month_year: {
            hotelId: parseInt(hotel_id),
            destinationId: parseInt(destination_id),
            month: rate.month,
            year: year
          }
        },
        update: {
          doubleRoom: rate.double_sharing_per_room,
          doublePax: rate.double_sharing_per_pax,
          tripleRoom: rate.triple_sharing_per_room,
          triplePax: rate.triple_sharing_per_pax,
          quadRoom: rate.quad_sharing_per_room,
          quadPax: rate.quad_sharing_per_pax,
          updatedAt: new Date(),
        },
        create: {
          hotelId: parseInt(hotel_id),
          destinationId: parseInt(destination_id),
          month: rate.month,
          year: year,
          doubleRoom: rate.double_sharing_per_room,
          doublePax: rate.double_sharing_per_pax,
          tripleRoom: rate.triple_sharing_per_room,
          triplePax: rate.triple_sharing_per_pax,
          quadRoom: rate.quad_sharing_per_room,
          quadPax: rate.quad_sharing_per_pax,
        }
      });
      upsertedRates.push(r);
      createdCount++;
    }

    res.json({
      success: true,
      created_count: createdCount,
      rates: upsertedRates
    });
  } catch (error) {
    console.error('Error creating hotel rates:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Update a single month's rates
 * PATCH /api/hotel-rates/:rate_id
 */
exports.updateRate = async (req, res) => {
  try {
    const { rate_id } = req.params;
    const updates = req.body;

    const rate = await prisma.hotelRate.update({
      where: { id: rate_id },
      data: {
        doubleRoom: updates.double_sharing_per_room,
        doublePax: updates.double_sharing_per_pax,
        tripleRoom: updates.triple_sharing_per_room,
        triplePax: updates.triple_sharing_per_pax,
        quadRoom: updates.quad_sharing_per_room,
        quadPax: updates.quad_sharing_per_pax,
      }
    });

    res.json({ success: true, updated_rate: rate });
  } catch (error) {
    console.error('Error updating hotel rate:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Delete rates for a month
 * DELETE /api/hotel-rates/:rate_id
 */
exports.deleteRate = async (req, res) => {
  try {
    const { rate_id } = req.params;
    
    await prisma.hotelRate.delete({
      where: { id: rate_id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting hotel rate:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
