const prisma = require('../lib/prisma');

/**
 * Helper function to extract month from date string
 */
function getMonthFromDate(dateString) {
  const d = new Date(dateString);
  return d.getMonth() + 1; // 1-12
}

/**
 * Compute single leg cost
 * POST /api/hotel-calculator/compute
 */
exports.computeCost = async (req, res) => {
  try {
    const { 
      hotel_id, 
      check_in_date, 
      check_out_date, 
      adults_count, 
      children_count, 
      sharing_type, 
      pricing_mode,
      year: explicitYear
    } = req.body;

    const checkInDate = new Date(check_in_date);
    const checkOutDate = new Date(check_out_date);
    const month = checkInDate.getMonth() + 1;
    const year = explicitYear || checkInDate.getFullYear();

    // Nights calculation
    const diffTime = Math.abs(checkOutDate - checkInDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res.status(400).json({ success: false, message: 'Check-out must be after check-in' });
    }

    let hotelName = `Hotel ID ${hotel_id}`;
    let rate = null;

    if (prisma.hotel) {
      const h = await prisma.hotel.findUnique({ where: { id: parseInt(hotel_id) || 1 } }).catch(() => null);
      if (h) hotelName = h.name;
    } else if (prisma.opsVendor) {
      const v = await prisma.opsVendor.findUnique({ where: { id: String(hotel_id) } }).catch(() => null);
      if (v) hotelName = v.name;
    }

    if (prisma.hotelRate) {
      rate = await prisma.hotelRate.findFirst({
        where: { hotelId: parseInt(hotel_id) || 1, month, year }
      }).catch(() => null);
    }

    // Default rate values if not yet configured in DB
    if (!rate) {
      rate = {
        doubleRoom: 3750,
        doublePax: 1875,
        tripleRoom: 5900,
        triplePax: 1967,
        quadRoom: 7200,
        quadPax: 1800
      };
    }

    const adults = parseInt(adults_count) || 0;
    const children = parseInt(children_count) || 0;
    const totalPax = adults + children;

    if (totalPax <= 0) {
      return res.status(400).json({ success: false, message: 'Add at least 1 participant' });
    }

    let capacity = 2;
    let ratePerRoom = 0;
    let ratePerPax = 0;

    switch (sharing_type) {
      case 'Triple':
        capacity = 3;
        ratePerRoom = rate.tripleRoom;
        ratePerPax = rate.triplePax;
        break;
      case 'Quad':
        capacity = 4;
        ratePerRoom = rate.quadRoom;
        ratePerPax = rate.quadPax;
        break;
      case 'Double':
      default:
        capacity = 2;
        ratePerRoom = rate.doubleRoom;
        ratePerPax = rate.doublePax;
        break;
    }

    const roomsNeeded = Math.ceil(totalPax / capacity);
    let totalPerNight = 0;
    let costPerPaxFinal = 0;
    
    let adultsCostPerNight = 0;
    let childrenCostPerNight = 0;
    let amountPerNight = 0;

    if (pricing_mode === 'per_room') {
      totalPerNight = roomsNeeded * ratePerRoom;
      costPerPaxFinal = Math.round((totalPerNight * nights) / totalPax);
      // Rough breakdown for display if per room (divide evenly)
      const roomCostPerPax = Math.round(totalPerNight / totalPax);
      adultsCostPerNight = adults * roomCostPerPax;
      childrenCostPerNight = children * roomCostPerPax;
      amountPerNight = ratePerRoom;
    } else {
      // per_pax
      adultsCostPerNight = adults * ratePerPax;
      childrenCostPerNight = children * ratePerPax;
      totalPerNight = adultsCostPerNight + childrenCostPerNight;
      costPerPaxFinal = ratePerPax * nights;
      amountPerNight = ratePerPax;
    }

    const grandTotal = totalPerNight * nights;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const response = {
      success: true,
      calculation: {
        hotel_id: hotel_id,
        hotel_name: hotelName,
        check_in_date,
        check_out_date,
        nights,
        check_in_month: monthNames[month - 1],
        check_in_month_number: month,
        
        group_composition: {
          adults,
          children,
          total_pax: totalPax
        },
        
        sharing_config: {
          type: sharing_type,
          capacity_per_room: capacity,
          rooms_needed: roomsNeeded
        },
        
        rates: {
          per_room: ratePerRoom,
          per_pax: ratePerPax,
          pricing_mode
        },
        
        cost_breakdown: {
          adults_cost_per_night: adultsCostPerNight,
          children_cost_per_night: childrenCostPerNight,
          total_per_night: totalPerNight,
          nights,
          subtotal: grandTotal,
          taxes: 0,
          grand_total: grandTotal,
          cost_per_pax: costPerPaxFinal
        },
        
        summary: {
          line_items: [
            {
              description: pricing_mode === 'per_pax' ? `${adults} Adults × ₹${amountPerNight.toLocaleString()}` : `${roomsNeeded} Rooms × ₹${amountPerNight.toLocaleString()} (Adult portion)`,
              quantity: nights,
              amount_per_night: adultsCostPerNight,
              total: adultsCostPerNight * nights
            }
          ],
          display_total: `₹${grandTotal.toLocaleString('en-IN')}`
        },

        sharing_wise_per_person: {
          double: {
            sharing: "Double Sharing (2 Pax)",
            room_rate_per_night: rate.doubleRoom,
            cost_per_pax_per_night: rate.doublePax || Math.round(rate.doubleRoom / 2),
            cost_per_pax_total_stay: (rate.doublePax || Math.round(rate.doubleRoom / 2)) * nights,
            capacity: 2
          },
          triple: {
            sharing: "Triple Sharing (3 Pax)",
            room_rate_per_night: rate.tripleRoom,
            cost_per_pax_per_night: rate.triplePax || Math.round(rate.tripleRoom / 3),
            cost_per_pax_total_stay: (rate.triplePax || Math.round(rate.tripleRoom / 3)) * nights,
            capacity: 3
          },
          quad: {
            sharing: "Quad Sharing (4 Pax)",
            room_rate_per_night: rate.quadRoom,
            cost_per_pax_per_night: rate.quadPax || Math.round(rate.quadRoom / 4),
            cost_per_pax_total_stay: (rate.quadPax || Math.round(rate.quadRoom / 4)) * nights,
            capacity: 4
          }
        }
      }
    };

    if (children > 0) {
      response.calculation.summary.line_items.push({
        description: pricing_mode === 'per_pax' ? `${children} Children × ₹${amountPerNight.toLocaleString()}` : `${roomsNeeded} Rooms × ₹${amountPerNight.toLocaleString()} (Child portion)`,
        quantity: nights,
        amount_per_night: childrenCostPerNight,
        total: childrenCostPerNight * nights
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Error computing hotel cost:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Bulk calculate costs for multi-leg trips
 * POST /api/hotel-calculator/bulk-calculate
 */
exports.bulkCalculate = async (req, res) => {
  try {
    const { trip_id, legs } = req.body;
    
    let totalNights = 0;
    let accommodationTotal = 0;
    const legResults = [];
    const legTotals = [];
    
    // Process legs
    for (const leg of legs) {
      // Logic from computeCost but modularized (duplicating for speed/simplicity here, can be refactored)
      const checkInDate = new Date(leg.check_in_date);
      const checkOutDate = new Date(leg.check_out_date);
      const month = checkInDate.getMonth() + 1;
      const year = checkInDate.getFullYear();
      
      const diffTime = Math.abs(checkOutDate - checkInDate);
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const rate = await prisma.hotelRate.findFirst({
        where: { hotelId: parseInt(leg.hotel_id), month, year }
      });

      if (!rate) {
        throw new Error(`Rates not found for hotel ${leg.hotel_id} in month ${month}`);
      }

      const adults = leg.adults || 0;
      const children = leg.children || 0;
      const totalPax = adults + children;
      
      let capacity = 2;
      let ratePerRoom = 0;
      let ratePerPax = 0;

      switch (leg.sharing_type) {
        case 'Triple': capacity = 3; ratePerRoom = rate.tripleRoom; ratePerPax = rate.triplePax; break;
        case 'Quad': capacity = 4; ratePerRoom = rate.quadRoom; ratePerPax = rate.quadPax; break;
        case 'Double': default: capacity = 2; ratePerRoom = rate.doubleRoom; ratePerPax = rate.doublePax; break;
      }
      
      const roomsNeeded = Math.ceil(totalPax / capacity);
      let totalPerNight = 0;
      
      if (leg.pricing_mode === 'per_room') {
        totalPerNight = roomsNeeded * ratePerRoom;
      } else {
        totalPerNight = totalPax * ratePerPax;
      }
      
      const grandTotal = totalPerNight * nights;
      
      legTotals.push(grandTotal);
      accommodationTotal += grandTotal;
      totalNights += nights;
      
      legResults.push({
        hotel_id: leg.hotel_id,
        check_in_date: leg.check_in_date,
        check_out_date: leg.check_out_date,
        nights,
        total: grandTotal
      });
    }

    res.json({
      success: true,
      trip_summary: {
        trip_id,
        total_nights: totalNights,
        leg_totals: legTotals,
        accommodation_total: accommodationTotal,
        cost_per_pax: Math.round(accommodationTotal / (legs[0].adults + legs[0].children))
      },
      legs: legResults
    });

  } catch (error) {
    console.error('Error in bulk calculate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
