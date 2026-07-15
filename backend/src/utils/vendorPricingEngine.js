const ROOM_OCCUPANCY = {
  SINGLE: 1,
  DOUBLE: 2,
  TRIPLE: 3,
  QUAD: 4,
  FAMILY: 4,
  DORMITORY: 6,
  GROUP: 1,
};

function money(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid monetary value: ${value}`);
  }
  return number;
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Distributes passengers into rooms as evenly as possible.
 * Returns passenger count in each room.
 * e.g., distributePassengers(10, 3) => [4, 3, 3]
 */
function distributePassengers(passengerCount, roomCount) {
  if (!Number.isInteger(passengerCount) || passengerCount <= 0) {
    throw new Error("Passenger count must be greater than zero.");
  }

  if (!Number.isInteger(roomCount) || roomCount <= 0) {
    throw new Error("Room count must be greater than zero.");
  }

  const baseOccupancy = Math.floor(passengerCount / roomCount);
  const remainder = passengerCount % roomCount;

  return Array.from(
    { length: roomCount },
    (_, index) => baseOccupancy + (index < remainder ? 1 : 0)
  );
}

/**
 * Calculates an accommodation allocation.
 */
function calculateAccommodationAllocation(allocation) {
  const {
    rateBasis,
    sharingType,
    paxCount,
    numberOfNights = 1,
    numberOfRooms,
    maxRoomCapacity = null,
    taxIncluded = false,
    taxPercent = 0,
  } = allocation;

  const amount = money(allocation.amount);

  if (!paxCount || paxCount <= 0) {
    throw new Error("Accommodation pax count must be greater than zero.");
  }
  if (numberOfNights <= 0) {
    throw new Error("Number of nights must be greater than zero.");
  }

  let subtotal = 0;
  let calculatedRooms = 0;
  let roomDistribution = [];

  if (rateBasis === "PER_PERSON_PER_NIGHT") {
    subtotal = amount * paxCount * numberOfNights;
  } else if (rateBasis === "PER_ROOM_PER_NIGHT") {
    const defaultOccupancy = ROOM_OCCUPANCY[sharingType] || 2;
    const occupancyLimit = maxRoomCapacity ? Number(maxRoomCapacity) : defaultOccupancy;

    if (numberOfRooms) {
      calculatedRooms = numberOfRooms;
      roomDistribution = distributePassengers(paxCount, calculatedRooms);
      const limitExceeded = roomDistribution.some(pax => pax > occupancyLimit);
      if (limitExceeded) {
        throw new Error(`Room capacity exceeded! Max capacity per room is ${occupancyLimit}. Allocation ${JSON.stringify(roomDistribution)} requires more rooms.`);
      }
    } else {
      calculatedRooms = Math.ceil(paxCount / defaultOccupancy);
      roomDistribution = distributePassengers(paxCount, calculatedRooms);
      const limitExceeded = roomDistribution.some(pax => pax > occupancyLimit);
      if (limitExceeded) {
        calculatedRooms = Math.ceil(paxCount / occupancyLimit);
        roomDistribution = distributePassengers(paxCount, calculatedRooms);
      }
    }

    subtotal = amount * calculatedRooms * numberOfNights;
  } else if (rateBasis === "FLAT_PACKAGE") {
    subtotal = amount;
    calculatedRooms = numberOfRooms || 1;
  } else {
    throw new Error(`Unsupported accommodation rate basis: ${rateBasis}`);
  }

  const tax = taxIncluded || !taxPercent ? 0 : subtotal * (money(taxPercent) / 100);
  const total = subtotal + tax;

  return {
    sharingType,
    paxCount,
    numberOfNights,
    numberOfRooms: calculatedRooms,
    roomDistribution,
    subtotal: roundMoney(subtotal),
    tax: roundMoney(tax),
    total: roundMoney(total),
    costPerPerson: roundMoney(total / paxCount),
  };
}

/**
 * Calculates transport vehicle splits.
 */
function calculateTransportCost({
  amount,
  extraCharge = 0,
  seatCapacity,
  paxCount,
  vehicleCount,
  rateBasis = "PER_VEHICLE",
  numberOfDays = 1,
  estimatedKm = 0,
}) {
  if (!paxCount || paxCount <= 0) {
    throw new Error("Transport pax count must be greater than zero.");
  }

  const baseAmount = money(amount);
  const additionalCharge = money(extraCharge);

  let requiredVehicles = vehicleCount || 1;
  let total = 0;

  if (rateBasis === "PER_VEHICLE") {
    if (!seatCapacity || seatCapacity <= 0) {
      throw new Error("Seat capacity is required for per-vehicle rates.");
    }
    requiredVehicles = vehicleCount || Math.ceil(paxCount / seatCapacity);
    total = (baseAmount + additionalCharge) * requiredVehicles;
  } else if (rateBasis === "PER_DAY") {
    requiredVehicles = vehicleCount || Math.ceil(paxCount / seatCapacity);
    total = (baseAmount * numberOfDays + additionalCharge) * requiredVehicles;
  } else if (rateBasis === "PER_KM") {
    requiredVehicles = vehicleCount || Math.ceil(paxCount / seatCapacity);
    total = (baseAmount * estimatedKm + additionalCharge) * requiredVehicles;
  } else if (rateBasis === "FLAT_PACKAGE") {
    total = baseAmount + additionalCharge;
  } else {
    throw new Error(`Unsupported transport rate basis: ${rateBasis}`);
  }

  return {
    requiredVehicles,
    subtotal: roundMoney(total),
    costPerPerson: roundMoney(total / paxCount),
  };
}

/**
 * Calculates miscellaneous split charges.
 */
function calculateMiscCharge({
  amount,
  unit,
  paxCount,
  tripDays = 1,
  numberOfRooms = 0,
  numberOfNights = 0,
  numberOfVehicles = 1,
}) {
  const chargeAmount = money(amount);
  let total = 0;

  switch (unit) {
    case "PER_PERSON":
      total = chargeAmount * paxCount;
      break;
    case "PER_PERSON_PER_DAY":
      total = chargeAmount * paxCount * tripDays;
      break;
    case "PER_GROUP_PER_DAY":
      total = chargeAmount * tripDays;
      break;
    case "PER_ROOM_PER_NIGHT":
      total = chargeAmount * numberOfRooms * numberOfNights;
      break;
    case "PER_VEHICLE":
      total = chargeAmount * numberOfVehicles;
      break;
    case "PER_DAY":
      total = chargeAmount * tripDays;
      break;
    case "FLAT":
      total = chargeAmount;
      break;
    default:
      throw new Error(`Unsupported miscellaneous unit: ${unit}`);
  }

  return {
    unit,
    total: roundMoney(total),
    costPerPerson: roundMoney(total / paxCount),
  };
}

/**
 * Compiles full trip vendor pricing summary.
 */
function calculateTripCost({
  paxCount,
  accommodations = [],
  transports = [],
  foodItems = [],
  guideItems = [],
  miscCharges = [],
  contingencyPercent = 0,
}) {
  if (!paxCount || paxCount <= 0) {
    throw new Error("Trip pax count must be greater than zero.");
  }

  const accommodationResults = accommodations.map(calculateAccommodationAllocation);
  const accommodationTotal = accommodationResults.reduce((sum, item) => sum + item.total, 0);

  const transportResults = transports.map((transport) =>
    calculateTransportCost({
      ...transport,
      paxCount,
    })
  );
  const transportTotal = transportResults.reduce((sum, item) => sum + item.subtotal, 0);

  const foodTotal = foodItems.reduce((sum, item) => {
    const meals = item.quantity || 1;
    return sum + money(item.ratePerPerson) * paxCount * meals;
  }, 0);

  const guideTotal = guideItems.reduce((sum, item) => {
    const days = item.numberOfDays || 1;
    return (
      sum +
      money(item.dailyRate) * days +
      money(item.travelCharge) +
      money(item.foodCharge) * days +
      money(item.stayCharge) * days
    );
  }, 0);

  const totalRooms = accommodationResults.reduce((sum, item) => sum + (item.numberOfRooms || 0), 0);
  const totalNights = accommodationResults.reduce((sum, item) => sum + (item.numberOfNights || 0), 0);
  const totalVehicles = transportResults.reduce((sum, item) => sum + item.requiredVehicles, 0);

  const miscellaneousResults = miscCharges.map((charge) =>
    calculateMiscCharge({
      ...charge,
      paxCount,
      numberOfRooms: totalRooms,
      numberOfNights: totalNights,
      numberOfVehicles: totalVehicles,
    })
  );
  const miscellaneousTotal = miscellaneousResults.reduce((sum, item) => sum + item.total, 0);

  const baseVendorCost = accommodationTotal + transportTotal + foodTotal + guideTotal + miscellaneousTotal;
  const contingency = baseVendorCost * (money(contingencyPercent) / 100);
  const finalVendorCost = baseVendorCost + contingency;

  return {
    paxCount,
    breakdown: {
      accommodation: roundMoney(accommodationTotal),
      transport: roundMoney(transportTotal),
      food: roundMoney(foodTotal),
      guide: roundMoney(guideTotal),
      miscellaneous: roundMoney(miscellaneousTotal),
      contingency: roundMoney(contingency),
    },
    allocations: {
      accommodation: accommodationResults,
      transport: transportResults,
      miscellaneous: miscellaneousResults,
    },
    baseVendorCost: roundMoney(baseVendorCost),
    finalVendorCost: roundMoney(finalVendorCost),
    costPerPerson: roundMoney(finalVendorCost / paxCount),
  };
}

module.exports = {
  distributePassengers,
  calculateAccommodationAllocation,
  calculateTransportCost,
  calculateMiscCharge,
  calculateTripCost,
  ROOM_OCCUPANCY,
};
