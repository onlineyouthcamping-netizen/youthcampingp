const { prisma } = require("../lib/prisma");

function isGuideExpenseType(assignmentType) {
  return (
    assignmentType === "EXPENSE" ||
    String(assignmentType || "").startsWith("EXPENSE_")
  );
}

/**
 * Helper to safely extract YYYY-MM-DD from Date or string.
 */
function formatDateKey(val) {
  if (!val) return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    return val.toISOString().substring(0, 10);
  }
  const s = String(val).trim();
  if (s.length >= 10) return s.substring(0, 10);
  return s;
}

/**
 * Helper to resolve all trip aliases (id, slug, shortName) for querying.
 */
async function resolveTripIdentifiers(tripId) {
  const ids = [tripId];
  try {
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [
          { id: tripId },
          { slug: tripId },
          { slug: tripId.toLowerCase() },
          { shortName: tripId },
          { shortName: tripId.toUpperCase() },
          { title: { contains: tripId, mode: "insensitive" } },
        ],
      },
      select: { id: true, slug: true, shortName: true },
    });
    if (trip) {
      if (trip.id) ids.push(trip.id);
      if (trip.slug) ids.push(trip.slug);
      if (trip.shortName) ids.push(trip.shortName);
    }
  } catch (e) {
    // ignore query failure, fallback to tripId
  }
  return Array.from(new Set(ids.filter(Boolean)));
}

/**
 * Calculates an authoritative, live readiness score (0-100%) and missing items list for a departure.
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
  const targetDateKey = formatDateKey(departureDateStr);
  const dDate = new Date(departureDateStr);

  const tripIdentifiers = await resolveTripIdentifiers(tripId);

  // Fetch active bookings for this departure
  let bookings = [];
  try {
    bookings = await prisma.booking.findMany({
      where: {
        tripId: { in: tripIdentifiers },
        status: { notIn: ["rejected", "cancelled", "failed"] },
      },
      include: {
        opsVehicleAllocations: true,
        opsRoomAllocations: true,
        verification: true,
        trainTickets: true,
      },
    });
  } catch (err) {
    console.warn("[readinessEngine] Error fetching bookings:", err.message);
  }

  const activeBookings = bookings.filter((b) => {
    return formatDateKey(b.departureDate) === targetDateKey;
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
        bookingId: b.bookingId || b.id,
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
          bookingId: b.bookingId || b.id,
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

  const totalPaxCount =
    activePassengers.length ||
    activeBookings.reduce((sum, b) => sum + (b.numberOfTravelers || 1), 0);

  // 1. PASSENGERS & ID DOCUMENTS (15 pts)
  if (totalPaxCount === 0) {
    breakdown.push({
      category: "Passengers",
      status: "No Bookings",
      points: 0,
      max: 15,
    });
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
      missingItems.push(
        `${unverifiedCount} passenger(s) missing ID proof verification.`
      );
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
      where: {
        tripId: { in: tripIdentifiers },
        ...(isNaN(dDate.getTime()) ? {} : { departureDate: dDate }),
      },
    });
    const roomAllocations = await prisma.opsRoomAllocation.findMany({
      where: {
        tripId: { in: tripIdentifiers },
        ...(isNaN(dDate.getTime()) ? {} : { departureDate: dDate }),
        allocationStatus: "ACTIVE",
      },
    });

    const allocatedPaxCount = new Set(
      roomAllocations.map((r) => `${r.bookingId}_${r.travelerName}`)
    ).size;
    const isHotelsBooked =
      hotelBookings.length > 0 &&
      hotelBookings.every((h) => h.confirmed === "CONFIRMED");

    let hotelPoints = 0;
    if (isHotelsBooked) hotelPoints += 10;
    if (totalPaxCount > 0 && allocatedPaxCount >= totalPaxCount) {
      hotelPoints += 10;
    } else if (totalPaxCount > 0) {
      hotelPoints += Math.round((allocatedPaxCount / totalPaxCount) * 10);
      missingItems.push(
        `${totalPaxCount - allocatedPaxCount} passenger(s) not allocated to hotel rooms.`
      );
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
      where: {
        tripId: { in: tripIdentifiers },
        ...(isNaN(dDate.getTime()) ? {} : { departureDate: dDate }),
      },
    });
    const vehicleAllocations = await prisma.opsVehicleAllocation.findMany({
      where: {
        tripId: { in: tripIdentifiers },
        ...(isNaN(dDate.getTime()) ? {} : { departureDate: dDate }),
        allocationStatus: "ACTIVE",
      },
    });

    const transportAllocatedPax = new Set(
      vehicleAllocations.map((v) => `${v.bookingId}_${v.travelerName}`)
    ).size;
    let transportPoints = 0;

    if (transportFleets.length > 0) transportPoints += 5;
    if (totalPaxCount > 0 && transportAllocatedPax >= totalPaxCount) {
      transportPoints += 10;
    } else if (totalPaxCount > 0) {
      transportPoints += Math.round(
        (transportAllocatedPax / totalPaxCount) * 10
      );
      missingItems.push(
        `${totalPaxCount - transportAllocatedPax} passenger(s) not assigned to transport vehicles.`
      );
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
    breakdown.push({
      category: "Transport",
      status: "Error",
      points: 0,
      max: 15,
    });
  }

  // 4. TRAIN TICKETING (15 pts)
  try {
    const bookingIds = activeBookings.map((b) => b.id);
    const trainTickets =
      bookingIds.length > 0
        ? await prisma.trainTicket.findMany({
            where: {
              bookingId: { in: bookingIds },
            },
          })
        : [];

    const confirmedTickets = trainTickets.filter(
      (t) =>
        t.ticketStatus === "CONFIRMED" || t.ticketStatus === "Self Booked"
    );
    const ticketRatio =
      trainTickets.length > 0
        ? confirmedTickets.length / trainTickets.length
        : 1;
    const ticketPoints = Math.round(ticketRatio * 15);
    score += ticketPoints;

    const unconfirmedTickets = trainTickets.length - confirmedTickets.length;
    if (unconfirmedTickets > 0) {
      missingItems.push(
        `${unconfirmedTickets} train ticket(s) pending PNR confirmation.`
      );
    }

    breakdown.push({
      category: "Train Ticketing",
      status: unconfirmedTickets === 0 ? "Ready" : "Action Required",
      points: ticketPoints,
      max: 15,
      details: `${confirmedTickets.length}/${trainTickets.length} train tickets confirmed`,
    });
  } catch (e) {
    breakdown.push({
      category: "Train Ticketing",
      status: "Error",
      points: 0,
      max: 15,
    });
  }

  // 5. TRIP CAPTAIN / GUIDE ASSIGNMENT (10 pts)
  try {
    const guidePayments = await prisma.opsGuidePayment.findMany({
      where: {
        tripId: { in: tripIdentifiers },
        ...(isNaN(dDate.getTime()) ? {} : { departureDate: dDate }),
      },
    });
    const tripLeaders = await prisma.opsTripLeader.findMany({
      where: {
        tripId: { in: tripIdentifiers },
        ...(isNaN(dDate.getTime()) ? {} : { departureDate: dDate }),
        archivedAt: null,
      },
    });

    const actualGuidePayments = guidePayments.filter(
      (payment) => !isGuideExpenseType(payment.assignmentType)
    );
    const hasGuide =
      actualGuidePayments.length > 0 || tripLeaders.length > 0;
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
      details: hasGuide
        ? `${actualGuidePayments.length + tripLeaders.length} Captain/Leader(s) assigned`
        : "Unassigned",
    });
  } catch (e) {
    breakdown.push({ category: "Guides", status: "Error", points: 0, max: 10 });
  }

  // 6. FINANCE & COLLECTIONS (15 pts)
  try {
    const totalRevenue = activeBookings.reduce(
      (sum, b) =>
        sum + (Number(b.totalAmount) || Number(b.amount) || 0),
      0
    );
    const totalAdvance = activeBookings.reduce(
      (sum, b) => sum + (Number(b.advancePaid) || 0),
      0
    );

    const paidRatio =
      totalRevenue > 0 ? Math.min(totalAdvance / totalRevenue, 1) : 1;
    const finPoints = Math.round(paidRatio * 15);
    score += finPoints;

    const remainingDue = totalRevenue - totalAdvance;
    if (remainingDue > 0) {
      missingItems.push(
        `₹${remainingDue.toLocaleString("en-IN")} customer balance payment outstanding.`
      );
    }

    breakdown.push({
      category: "Finance",
      status: remainingDue <= 0 ? "Ready" : "Action Required",
      points: finPoints,
      max: 15,
      details: `₹${totalAdvance.toLocaleString("en-IN")} collected of ₹${totalRevenue.toLocaleString("en-IN")} total revenue`,
    });
  } catch (e) {
    breakdown.push({ category: "Finance", status: "Error", points: 0, max: 15 });
  }

  // 7. OPERATIONAL CHECKLIST TASKS (10 pts)
  try {
    const checklistModel = prisma.opsTripChecklist || prisma.opsChecklist;
    const checklists = checklistModel
      ? await checklistModel.findMany({
          where: {
            tripId: { in: tripIdentifiers },
            ...(isNaN(dDate.getTime()) ? {} : { departureDate: dDate }),
          },
        })
      : [];

    const completedTasks = checklists.filter(
      (c) => c.status === "COMPLETED"
    ).length;
    const taskRatio =
      checklists.length > 0 ? completedTasks / checklists.length : 1;
    const taskPoints = Math.round(taskRatio * 10);
    score += taskPoints;

    const pendingTasks = checklists.length - completedTasks;
    if (pendingTasks > 0) {
      missingItems.push(
        `${pendingTasks} pre-departure operational task(s) incomplete.`
      );
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

/**
 * Gets detailed passenger statistics and raw passenger list for downstream engines (e.g. room allocation).
 */
exports.getDeparturePassengerStats = async (tripId, departureDateStr) => {
  const targetDateKey = formatDateKey(departureDateStr);
  const tripIdentifiers = await resolveTripIdentifiers(tripId);

  let bookings = [];
  try {
    bookings = await prisma.booking.findMany({
      where: {
        tripId: { in: tripIdentifiers },
        status: { notIn: ["rejected", "cancelled", "failed"] },
      },
      include: {
        opsVehicleAllocations: true,
        opsRoomAllocations: true,
        verification: true,
        trainTickets: true,
      },
    });
  } catch (err) {
    console.warn("[readinessEngine] Error in getDeparturePassengerStats:", err.message);
  }

  const activeBookings = bookings.filter((b) => {
    return formatDateKey(b.departureDate) === targetDateKey;
  });

  const allPassengers = [];
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

    const roomSharingPref =
      b.roomSharing || paxObj?.details?.roomType || "Double Sharing";

    if (persons.length === 0) {
      allPassengers.push({
        id: `pax_${b.id}_0`,
        bookingId: b.bookingId || b.id,
        name: b.fullName || b.name || "Guest",
        phone: b.mobile || b.phone || "",
        email: b.email || "",
        gender: b.gender || "Male",
        roomSharing: roomSharingPref,
      });
    } else {
      persons.forEach((p, idx) => {
        allPassengers.push({
          id: p.id || `pax_${b.id}_${idx}`,
          bookingId: b.bookingId || b.id,
          name: p.name || `Traveler ${idx + 1}`,
          phone: p.phone || (idx === 0 ? b.mobile || b.phone : ""),
          email: p.email || (idx === 0 ? b.email : ""),
          gender: p.gender || "Male",
          roomSharing: p.roomSharing || roomSharingPref,
        });
      });
    }
  });

  return {
    totalParticipants: allPassengers.length,
    activeBookingsCount: activeBookings.length,
    allPassengers,
  };
};
