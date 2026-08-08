const { prisma } = require("../lib/prisma");

/**
 * Calculates a authoritative, live readiness score (0-100%) and missing items list for a departure.
 * Weights (100 pts total):
 * - Passengers & ID Docs: 15
 * - Hotel Room Allocation: 20
 * - Transport Allocation: 15
 * - Train Ticketing: 15
 * - Guide Assignment: 10
 * - Finance & Collections: 15
 * - Operational Tasks: 10
 */
exports.calculateReadiness = async (tripId, departureDateStr) => {
  let score = 0;
  const breakdown = [];
  const missingItems = [];
  const dDate = new Date(departureDateStr);

  // Fetch active bookings for this departure
  const bookings = await prisma.booking.findMany({
    where: {
      tripId,
      status: { notIn: ["rejected", "cancelled", "failed"] },
    },
    include: {
      opsVehicleAllocations: true,
      opsRoomAllocations: true,
      verification: true,
      trainTickets: true,
    },
  });

  const activeBookings = bookings.filter((b) => {
    if (!b.departureDate) return false;
    return b.departureDate.toISOString().substring(0, 10) === departureDateStr;
  });

  // Flatten active passengers
  const activePassengers = [];
  activeBookings.forEach((b) => {
    let paxObj = b.passengers;
    if (typeof paxObj === "string") {
      try {
        paxObj = JSON.parse(paxObj);
      } catch (e) {
        paxObj = {};
      }
    }
    const persons = Array.isArray(paxObj?.persons)
      ? paxObj.persons
      : Array.isArray(paxObj)
      ? paxObj
      : [];

    if (persons.length === 0) {
      activePassengers.push({
        id: `pax_${b.id}_0`,
        bookingId: b.bookingId,
        name: b.fullName || b.name || "Guest",
        phone: b.mobile || b.phone || "",
        email: b.email || "",
        gender: b.gender || "Unknown",
        aadhaar: b.aadhaarUrl || b.idProofUrl || "",
        documents: b.verification?.isIdentityVerified ? ["verified"] : [],
      });
    } else {
      persons.forEach((p, idx) => {
        activePassengers.push({
          id: p.id || `pax_${b.id}_${idx}`,
          bookingId: b.bookingId,
          name: p.name || `Traveler ${idx + 1}`,
          phone: p.phone || (idx === 0 ? b.mobile || b.phone : ""),
          email: p.email || (idx === 0 ? b.email : ""),
          gender: p.gender || "Unknown",
          aadhaar: p.aadhaarUrl || p.idProofUrl || p.aadhaar || "",
          documents: Array.isArray(p.documents) ? p.documents : [],
        });
      });
    }
  });

  const totalPaxCount = activePassengers.length || activeBookings.reduce((sum, b) => sum + (b.numberOfTravelers || 1), 0);

  // 1. PASSENGERS & ID DOCUMENTS (15 pts)
  if (totalPaxCount === 0) {
    breakdown.push({ category: "Passengers", status: "No Bookings", points: 0, max: 15 });
    missingItems.push("No active bookings found for this departure date.");
  } else {
    const verifiedDocsCount = activePassengers.filter(
      (p) => p.aadhaar || (p.documents && p.documents.length > 0)
    ).length;
    const docRatio = totalPaxCount > 0 ? verifiedDocsCount / totalPaxCount : 0;
    const paxPoints = Math.round(docRatio * 15);
    score += paxPoints;

    const unverifiedCount = totalPaxCount - verifiedDocsCount;
    if (unverifiedCount > 0) {
      missingItems.push(`${unverifiedCount} passenger(s) missing ID proof verification.`);
    }

    breakdown.push({
      category: "Passengers",
      status: unverifiedCount === 0 ? "Ready" : "Action Required",
      points: paxPoints,
      max: 15,
      details: `${verifiedDocsCount}/${totalPaxCount} ID proofs verified`,
    });
  }

  // 2. HOTELS & ROOM ALLOCATION (20 pts)
  try {
    const hotelBookings = await prisma.opsHotelBooking.findMany({
      where: { tripId, departureDate: dDate },
    });
    const roomAllocations = await prisma.opsRoomAllocation.findMany({
      where: { tripId, departureDate: dDate, allocationStatus: "ACTIVE" },
    });

    const allocatedPaxCount = new Set(roomAllocations.map((r) => `${r.bookingId}_${r.travelerName}`)).size;
    const isHotelsBooked = hotelBookings.length > 0 && hotelBookings.every((h) => h.confirmed === "CONFIRMED");

    let hotelPoints = 0;
    if (isHotelsBooked) hotelPoints += 10;
    if (totalPaxCount > 0 && allocatedPaxCount >= totalPaxCount) {
      hotelPoints += 10;
    } else if (totalPaxCount > 0) {
      hotelPoints += Math.round((allocatedPaxCount / totalPaxCount) * 10);
      missingItems.push(`${totalPaxCount - allocatedPaxCount} passenger(s) not allocated to hotel rooms.`);
    }

    if (hotelBookings.length === 0) {
      missingItems.push("Hotel bookings not confirmed for departure.");
    }

    score += hotelPoints;
    breakdown.push({
      category: "Hotels",
      status: hotelPoints === 20 ? "Ready" : "Action Required",
      points: hotelPoints,
      max: 20,
      details: `${allocatedPaxCount}/${totalPaxCount} passengers allocated in ${hotelBookings.length} hotel stay(s)`,
    });
  } catch (e) {
    breakdown.push({ category: "Hotels", status: "Error", points: 0, max: 20 });
  }

  // 3. TRANSPORT FLEET ALLOCATION (15 pts)
  try {
    const transportFleets = await prisma.opsTransportFleet.findMany({
      where: { tripId, departureDate: dDate },
    });
    const vehicleAllocations = await prisma.opsVehicleAllocation.findMany({
      where: { tripId, departureDate: dDate, allocationStatus: "ACTIVE" },
    });

    const transportAllocatedPax = new Set(vehicleAllocations.map((v) => `${v.bookingId}_${v.travelerName}`)).size;
    let transportPoints = 0;

    if (transportFleets.length > 0) transportPoints += 5;
    if (totalPaxCount > 0 && transportAllocatedPax >= totalPaxCount) {
      transportPoints += 10;
    } else if (totalPaxCount > 0) {
      transportPoints += Math.round((transportAllocatedPax / totalPaxCount) * 10);
      missingItems.push(`${totalPaxCount - transportAllocatedPax} passenger(s) not assigned to transport vehicles.`);
    }

    if (transportFleets.length === 0) {
      missingItems.push("Transport vehicle fleet not allocated.");
    }

    score += transportPoints;
    breakdown.push({
      category: "Transport",
      status: transportPoints === 15 ? "Ready" : "Action Required",
      points: transportPoints,
      max: 15,
      details: `${transportAllocatedPax}/${totalPaxCount} passengers assigned to ${transportFleets.length} vehicle(s)`,
    });
  } catch (e) {
    breakdown.push({ category: "Transport", status: "Error", points: 0, max: 15 });
  }

  // 4. TRAIN TICKETING (15 pts)
  try {
    const trainTickets = await prisma.trainTicket.findMany({
      where: {
        bookingId: { in: activeBookings.map((b) => b.id) },
      },
    });

    const confirmedTickets = trainTickets.filter((t) => t.ticketStatus === "CONFIRMED" || t.ticketStatus === "Self Booked");
    const ticketRatio = trainTickets.length > 0 ? confirmedTickets.length / trainTickets.length : 1;
    const ticketPoints = Math.round(ticketRatio * 15);
    score += ticketPoints;

    const unconfirmedTickets = trainTickets.length - confirmedTickets.length;
    if (unconfirmedTickets > 0) {
      missingItems.push(`${unconfirmedTickets} train ticket(s) pending PNR confirmation.`);
    }

    breakdown.push({
      category: "Train Ticketing",
      status: unconfirmedTickets === 0 ? "Ready" : "Action Required",
      points: ticketPoints,
      max: 15,
      details: `${confirmedTickets.length}/${trainTickets.length} train tickets confirmed`,
    });
  } catch (e) {
    breakdown.push({ category: "Train Ticketing", status: "Error", points: 0, max: 15 });
  }

  // 5. TRIP CAPTAIN / GUIDE ASSIGNMENT (10 pts)
  try {
    const guidePayments = await prisma.opsGuidePayment.findMany({
      where: { tripId, departureDate: dDate },
    });
    const tripLeaders = await prisma.opsTripLeader.findMany({
      where: { tripId, departureDate: dDate, isArchived: false },
    });

    const hasGuide = guidePayments.length > 0 || tripLeaders.length > 0;
    const guidePoints = hasGuide ? 10 : 0;
    score += guidePoints;

    if (!hasGuide) {
      missingItems.push("No Trip Captain / Guide assigned to this departure.");
    }

    breakdown.push({
      category: "Guides",
      status: hasGuide ? "Ready" : "Action Required",
      points: guidePoints,
      max: 10,
      details: hasGuide ? `${guidePayments.length + tripLeaders.length} Captain/Leader(s) assigned` : "Unassigned",
    });
  } catch (e) {
    breakdown.push({ category: "Guides", status: "Error", points: 0, max: 10 });
  }

  // 6. FINANCE & COLLECTIONS (15 pts)
  try {
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || Number(b.amount) || 0), 0);
    const totalAdvance = activeBookings.reduce((sum, b) => sum + (Number(b.advancePaid) || 0), 0);
    const totalDue = activeBookings.reduce((sum, b) => sum + (Number(b.remainingAmount) || 0), 0);

    const paidRatio = totalRevenue > 0 ? Math.min(totalAdvance / totalRevenue, 1) : 1;
    const finPoints = Math.round(paidRatio * 15);
    score += finPoints;

    if (totalDue > 0) {
      missingItems.push(`₹${totalDue.toLocaleString("en-IN")} outstanding balance remaining across ${activeBookings.length} booking(s).`);
    }

    breakdown.push({
      category: "Finance",
      status: totalDue === 0 ? "Ready" : "Action Required",
      points: finPoints,
      max: 15,
      details: `Collected ₹${totalAdvance.toLocaleString("en-IN")} / ₹${totalRevenue.toLocaleString("en-IN")} (Due: ₹${totalDue.toLocaleString("en-IN")})`,
    });
  } catch (e) {
    breakdown.push({ category: "Finance", status: "Error", points: 0, max: 15 });
  }

  // 7. OPERATIONAL TASKS & CHECKLIST (10 pts)
  try {
    const checklists = await prisma.opsTripChecklist.findMany({
      where: { tripId, departureDate: dDate },
    });

    const completedTasks = checklists.filter((c) => c.status === "COMPLETED").length;
    const taskRatio = checklists.length > 0 ? completedTasks / checklists.length : 1;
    const taskPoints = Math.round(taskRatio * 10);
    score += taskPoints;

    const pendingTasks = checklists.length - completedTasks;
    if (pendingTasks > 0) {
      missingItems.push(`${pendingTasks} pre-departure operational task(s) incomplete.`);
    }

    breakdown.push({
      category: "Tasks",
      status: pendingTasks === 0 ? "Ready" : "Action Required",
      points: taskPoints,
      max: 10,
      details: `${completedTasks}/${checklists.length} checklist items completed`,
    });
  } catch (e) {
    breakdown.push({ category: "Tasks", status: "Error", points: 0, max: 10 });
  }

  const finalScore = Math.min(Math.round(score), 100);
  const isReady = finalScore >= 95 && missingItems.length === 0;

  return {
    totalScore: finalScore,
    status: isReady ? "READY" : "ACTION_REQUIRED",
    missingItems,
    breakdown,
  };
};
