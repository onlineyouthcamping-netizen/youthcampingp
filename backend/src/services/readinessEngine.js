const { prisma } = require("../lib/prisma");
const passengerEngine = require("./passengerEngine");

/**
/**
 * Calculates a live readiness score (0-100%) for a departure.
 * Weights (100 pts total):
 * - Passengers: 10
 * - Hotels: 20
 * - Transport: 15
 * - Guides: 10
 * - Activities: 10
 * - Finance: 15
 * - Tasks: 10
 * - Documents: 10
 */
exports.calculateReadiness = async (tripId, departureDateStr) => {
  let score = 0;
  const breakdown = [];

  // 1. Passengers (10 pts)
  try {
    const pStats = await passengerEngine.generatePassengerStatistics(tripId, departureDateStr);
    if (pStats.readiness === "100%") {
      score += 10;
      breakdown.push({ category: "Passengers", status: "Ready", points: 10, max: 10 });
    } else {
      const penalty = (pStats.warnings || []).length * 2;
      const pts = Math.max(10 - penalty, 0);
      score += pts;
      breakdown.push({ category: "Passengers", status: "Incomplete", points: pts, max: 10, details: pStats.warnings });
    }
  } catch (e) {
    breakdown.push({ category: "Passengers", status: "Error", points: 0, max: 10 });
  }

  // 2. Hotels (20 pts)
  try {
    const hotels = await prisma.opsHotelBooking.findMany({
      where: { tripId, departureDate: new Date(departureDateStr) }
    });

    if (hotels.length === 0) {
      breakdown.push({ category: "Hotels", status: "Unassigned", points: 0, max: 20 });
    } else {
      const totalHotels = hotels.length;
      const confirmedHotels = hotels.filter(h => h.confirmed === "CONFIRMED").length;
      const pendingHotels = hotels.filter(h => h.confirmed === "UNCONFIRMED").length;

      const pointsPerHotel = 20 / totalHotels;
      const hotelScore = (confirmedHotels * pointsPerHotel) + (pendingHotels * (pointsPerHotel * 0.5));
      
      score += hotelScore;
      breakdown.push({ 
        category: "Hotels", 
        status: confirmedHotels === totalHotels ? "Ready" : "Pending", 
        points: Math.round(hotelScore), 
        max: 20 
      });
    }
  } catch (e) {
    breakdown.push({ category: "Hotels", status: "Error", points: 0, max: 20 });
  }

  // Future Modules Mocked
  breakdown.push({ category: "Transport", status: "Pending", points: 5, max: 15 });
  score += 5;
  breakdown.push({ category: "Guides", status: "Assigned", points: 10, max: 10 });
  score += 10;
  breakdown.push({ category: "Activities", status: "Ready", points: 10, max: 10 });
  score += 10;
  breakdown.push({ category: "Finance", status: "Pending", points: 10, max: 15 });
  score += 10;
  breakdown.push({ category: "Tasks", status: "Ready", points: 10, max: 10 });
  score += 10;
  breakdown.push({ category: "Documents", status: "Ready", points: 10, max: 10 });
  score += 10;

  return {
    totalScore: Math.round(score),
    breakdown
  };
};
