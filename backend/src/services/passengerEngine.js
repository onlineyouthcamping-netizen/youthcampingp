const { prisma } = require("../lib/prisma");

/**
 * Passenger Engine Service
 * Analyzes all bookings for a given departure to compute demographics, group profiles, counts, and readiness.
 */

const getAge = (ageStr) => {
  const age = parseInt(ageStr, 10);
  return isNaN(age) ? 0 : age;
};

exports.calculatePassengerStatistics = async (tripId, departureDateStr) => {
  const bookings = await prisma.booking.findMany({
    where: {
      tripId,
      status: { notIn: ["rejected", "cancelled", "failed"] }
    },
    include: {
      opsVehicleAllocations: true
    }
  });

  const targetDateKey = String(departureDateStr || "").substring(0, 10);
  const activeBookings = bookings.filter((b) => {
    if (!b.departureDate) return false;
    const dateStr =
      b.departureDate instanceof Date
        ? b.departureDate.toISOString().substring(0, 10)
        : String(b.departureDate).substring(0, 10);
    return dateStr === targetDateKey;
  });

  const payload = {
    summary: {
      total: 0,
      adults: 0,
      children: 0,
      seniors: 0,
      guides: 0,
      drivers: 0
    },
    groups: {
      couples: [],
      families: [],
      male: [],
      female: []
    },
    warnings: [],
    readiness: {
      status: "Ready",
      reason: ""
    }
  };

  const allPassengersMap = new Map(); // to help link couples across bookings if needed, but mostly within

  activeBookings.forEach(booking => {
    let bookingPassengers = [];
    
    // Primary passenger
    if (booking.name) {
      bookingPassengers.push({
        id: `pax_${booking.id}_0`,
        bookingId: booking.id,
        name: booking.name,
        age: getAge(booking.age),
        gender: booking.gender || "Unknown",
        roomType: "Unknown",
        coupleWith: "",
        isPrimary: true
      });
    }

    // Co-passengers
    let paxObj = booking.passengers;
    if (typeof paxObj === 'string') {
      try { paxObj = JSON.parse(paxObj); } catch(e) { paxObj = {}; }
    }
    
    const coPaxList = Array.isArray(paxObj?.persons) ? paxObj.persons : (Array.isArray(paxObj) ? paxObj : []);
    
    coPaxList.forEach((p, idx) => {
      bookingPassengers.push({
        id: `pax_${booking.id}_${idx + 1}`,
        bookingId: booking.id,
        name: p.name || `Unknown_${idx}`,
        age: getAge(p.age),
        gender: p.gender || "Unknown",
        roomType: p.roomType || paxObj?.details?.roomType || "Unknown",
        coupleWith: p.coupleWith || paxObj?.details?.coupleWith || "",
        isPrimary: false
      });
    });

    const paxIdsInBooking = bookingPassengers.map(p => p.id);

    // Family Logic
    if (bookingPassengers.length >= 3 && bookingPassengers.some(p => p.age > 0 && p.age <= 12)) {
      payload.groups.families.push({
        bookingId: booking.id,
        passengerIds: paxIdsInBooking
      });
    }
    
    // Couple Logic (Pairing within the same booking for simplicity, as most couples book together)
    let matchedInBooking = new Set();
    bookingPassengers.forEach(p => {
      payload.summary.total += 1;
      
      const genderStr = p.gender.toLowerCase();
      if (genderStr === "male" || genderStr === "m") payload.groups.male.push(p.id);
      else if (genderStr === "female" || genderStr === "f") payload.groups.female.push(p.id);
      else payload.warnings.push(`⚠ Passenger ${p.name} missing gender`);

      if (p.age > 0) {
        if (p.age <= 12) payload.summary.children += 1;
        else payload.summary.adults += 1;
        
        if (p.age >= 60) payload.summary.seniors += 1;
      } else {
        payload.summary.adults += 1;
        payload.warnings.push(`⚠ Passenger ${p.name} missing age/DOB`);
      }

      // Check Couples within this booking
      if ((p.roomType === "Couple" || p.roomType === "Double") && p.coupleWith && !matchedInBooking.has(p.id)) {
        const partner = bookingPassengers.find(other => 
          other.id !== p.id && other.name.trim().toLowerCase() === p.coupleWith.trim().toLowerCase()
        );
        
        if (partner) {
          matchedInBooking.add(p.id);
          matchedInBooking.add(partner.id);
          payload.groups.couples.push({
            bookingId: booking.id,
            passengerIds: [p.id, partner.id]
          });
        } else {
          payload.warnings.push(`⚠ Couple partner not found for ${p.name} (Looking for: ${p.coupleWith})`);
        }
      }
    });

    // Check Duplicate passenger names in same booking (simple heuristic)
    const nameSet = new Set();
    bookingPassengers.forEach(p => {
      if (nameSet.has(p.name.toLowerCase())) {
        payload.warnings.push(`⚠ Duplicate passenger name in booking: ${p.name}`);
      }
      nameSet.add(p.name.toLowerCase());
    });
  });

  // Guides and Drivers
  const tripLeaders = await prisma.opsTripLeader.findMany({
    where: {
      tripId,
      departureDate: new Date(departureDateStr + "T00:00:00.000Z") // OpsTripLeader uses DateTime @db.Date
    }
  });

  payload.summary.guides = tripLeaders.length;

  const vehicleAllocations = await prisma.opsVehicleAllocation.findMany({
    where: {
      tripId,
      departureDate: new Date(departureDateStr)
    }
  });

  const uniqueFleets = new Set(vehicleAllocations.map(a => a.fleetId));
  payload.summary.drivers = uniqueFleets.size;

  // Readiness Calculation
  if (payload.warnings.length > 0) {
    payload.readiness.status = "Incomplete";
    
    // Group warnings for better readability
    const missingAge = payload.warnings.filter(w => w.includes("missing age")).length;
    const missingGender = payload.warnings.filter(w => w.includes("missing gender")).length;
    
    let reasonParts = [];
    if (missingAge > 0) reasonParts.push(`${missingAge} passengers missing age`);
    if (missingGender > 0) reasonParts.push(`${missingGender} missing gender`);
    if (payload.warnings.length > missingAge + missingGender) {
       reasonParts.push(`${payload.warnings.length - (missingAge + missingGender)} other issues`);
    }
    
    payload.readiness.reason = reasonParts.join(", ");
  } else {
    payload.readiness.status = "Ready";
    payload.readiness.reason = "100%";
  }

  return payload;
};
