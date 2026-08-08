const { prisma } = require("../lib/prisma");

/**
 * Accommodation Planner Service
 * Parses the Trip Itinerary and groups consecutive stay days into logical Stays,
 * attaching the required room allocation for each stay.
 */
exports.generateAccommodationPlan = async (tripId, departureDateStr, allocationRequirements) => {
  // 1. Fetch the default itinerary for the trip
  const itinerary = await prisma.itinerary.findFirst({
    where: { tripId, isDefault: true },
    include: { days: true }
  });

  if (!itinerary) {
    return [];
  }

  // 2. Sort days numerically
  const sortedDays = itinerary.days.sort((a, b) => {
    return parseInt(a.dayNumber, 10) - parseInt(b.dayNumber, 10);
  });

  const stays = [];
  let currentStay = null;

  // Assuming departureDateStr is "YYYY-MM-DD"
  const departureDate = new Date(departureDateStr);

  sortedDays.forEach((day, index) => {
    const city = (day.stay || "").trim();
    const isNoStay = !city || city === "—" || city.toLowerCase() === "no stay";

    const currentDate = new Date(departureDate);
    currentDate.setDate(departureDate.getDate() + index);

    if (isNoStay) {
      if (currentStay) {
        stays.push(currentStay);
        currentStay = null;
      }
    } else {
      if (currentStay && currentStay.city === city) {
        currentStay.nights += 1;
        currentStay.dayNumbers.push(day.dayNumber);
        // Update checkOut date to the next day
        const outDate = new Date(currentDate);
        outDate.setDate(currentDate.getDate() + 1);
        currentStay.checkOut = outDate.toISOString().substring(0, 10);
      } else {
        if (currentStay) {
          stays.push(currentStay);
        }
        const outDate = new Date(currentDate);
        outDate.setDate(currentDate.getDate() + 1);
        currentStay = {
          stayId: `stay_${index + 1}`,
          city,
          dayNumbers: [day.dayNumber],
          checkIn: currentDate.toISOString().substring(0, 10),
          checkOut: outDate.toISOString().substring(0, 10),
          nights: 1,
          requirements: allocationRequirements || {}
        };
      }
    }
  });

  if (currentStay) {
    stays.push(currentStay);
  }

  return stays;
};
