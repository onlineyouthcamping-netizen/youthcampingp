const { prisma } = require("../lib/prisma");

/**
 * Hotel Assignment Engine
 * Recommends hotel assignments for a specific Stay, applying the priority algorithm
 * and automatically splitting requirements across multiple vendors if capacity is limited.
 */
exports.generateHotelAssignments = async (stay) => {
  const { city, checkIn, checkOut, requirements } = stay;

  // Find all active hotel/camp vendors for this city
  const vendors = await prisma.opsVendor.findMany({
    where: {
      isActive: true,
      destinations: {
        some: { destinationName: { equals: city, mode: "insensitive" } }
      },
      // Assume 'hotel' or 'camp' or 'homestay' types if tracked, otherwise all vendors matching destination
    },
    include: {
      vendorRooms: true,
      hotelBookings: {
        where: {
          checkInDate: { lt: new Date(checkOut) },
          checkOutDate: { gt: new Date(checkIn) }
        }
      }
    }
  });

  if (vendors.length === 0) {
    return {
      status: "Manual Review",
      assignments: [],
      exceptions: [`No active vendors found in ${city}`]
    };
  }

  // 1. Calculate Priority Scores
  const scoredVendors = vendors.map(vendor => {
    // A. Room Rate (lower is better, max 35 pts)
    // We'll use twinRate as baseline comparison. Normal range 1000-5000.
    const baseRate = vendor.twinRate || 2500; 
    let rateScore = 35 * (1 - Math.min(baseRate / 5000, 1)); 
    if (baseRate === 0) rateScore = 0; // Penalize if no rate data

    // B. Vendor Rating (out of 5 -> max 25 pts)
    const ratingScore = (vendor.rating || 3) * 5;

    // C. Past Performance (out of 100 -> max 15 pts)
    const performanceScore = ((vendor.performanceScore || 90) / 100) * 15;

    // D. Availability Check (max 10 pts)
    // Naive check: totalRooms - active bookings
    const bookedRooms = vendor.hotelBookings.reduce((acc, b) => acc + (b.roomsBooked || 0), 0);
    const availableRooms = (vendor.totalRooms || 20) - bookedRooms;
    let availabilityScore = 0;
    
    // Sum total required rooms
    const totalRequired = Object.values(requirements).reduce((a, b) => a + b, 0);
    
    if (availableRooms >= totalRequired) {
      availabilityScore = 10;
    } else if (availableRooms > 0) {
      availabilityScore = (availableRooms / totalRequired) * 10;
    }

    // E. Complaints (subtract up to 5 pts)
    const penalty = Math.min((vendor.complaintCount || 0) * 1, 5);

    const totalScore = rateScore + ratingScore + performanceScore + availabilityScore - penalty;

    return {
      vendor,
      availableRooms: availableRooms > 0 ? availableRooms : 0,
      totalScore: parseFloat(totalScore.toFixed(2))
    };
  });

  // Sort by highest score first
  scoredVendors.sort((a, b) => b.totalScore - a.totalScore);

  const assignments = [];
  const exceptions = [];
  
  // Clone requirements to mutate
  const remainingReqs = { ...requirements };

  for (const sv of scoredVendors) {
    let roomsToTakeFromThisVendor = 0;
    let assignedReqsForThisVendor = { Twin: 0, Triple: 0, Quad: 0, Single: 0, ExtraBed: 0 };

    for (const type of Object.keys(remainingReqs)) {
      while (remainingReqs[type] > 0 && sv.availableRooms > 0) {
        assignedReqsForThisVendor[type]++;
        remainingReqs[type]--;
        sv.availableRooms--;
        roomsToTakeFromThisVendor++;
      }
    }

    if (roomsToTakeFromThisVendor > 0) {
      assignments.push({
        vendorId: sv.vendor.id,
        vendorName: sv.vendor.companyName,
        priorityScore: sv.totalScore,
        contractRate: sv.vendor.twinRate || 0,
        allocatedRooms: assignedReqsForThisVendor,
        status: "Suggested"
      });
    }

    // Check if we're done
    const totalRemaining = Object.values(remainingReqs).reduce((a, b) => a + b, 0);
    if (totalRemaining === 0) break;
  }

  const totalRemaining = Object.values(remainingReqs).reduce((a, b) => a + b, 0);
  
  if (totalRemaining > 0) {
    exceptions.push(`Insufficient hotel capacity in ${city}. Remaining: ${JSON.stringify(remainingReqs)}`);
  }

  let status = "Ready";
  if (totalRemaining > 0 || assignments.length === 0) status = "Manual Review";
  else if (assignments.length > 1) {
    // It split across multiple hotels automatically
    status = "Split Review";
    exceptions.push(`Group was automatically split across ${assignments.length} hotels in ${city}.`);
  }

  return {
    status,
    assignments,
    exceptions
  };
};
