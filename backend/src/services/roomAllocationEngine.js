/**
 * Room Allocation Engine
 * Hardened semi-automatic allocation engine respecting:
 * 1. Intentional same-booking sharing priority (same booking co-travelers stay together; gender does NOT split them).
 * 2. Passenger requested sharing preference (Single, Double Sharing, Triple Sharing, Quad Sharing).
 * 3. Same-gender grouping for unrelated passengers (Male+Male, Female+Female).
 * 4. Physical room capacity limits (e.g. Max Occupancy = 4).
 * 5. Track requestedSharing vs actualOccupancy & reason.
 */

exports.generateLogicalRooms = (passengerStats) => {
  const logicalRooms = [];
  const allocationCounts = {
    Twin: 0,
    Triple: 0,
    Quad: 0,
    Single: 0,
    ExtraBed: 0,
  };
  const exceptions = [];
  let roomCounter = 1;

  const createRoom = (type, capacity, passengers, reason, requestedSharing = null) => {
    const roomId = `RM-${roomCounter.toString().padStart(3, "0")}`;
    const actualOccupancy = passengers.length;
    logicalRooms.push({
      roomId,
      type,
      capacity,
      actualOccupancy,
      requestedSharing: requestedSharing || `${type} Sharing`,
      reason,
      passengers,
      allocationSource: "AUTO",
    });
    roomCounter++;

    if (allocationCounts[type] !== undefined) {
      allocationCounts[type]++;
    } else {
      allocationCounts[type] = 1;
    }
  };

  const assignedPassengerIds = new Set();
  const allPassengers = passengerStats.allPassengers || [];

  // Group passengers by bookingId to preserve intentional same-booking sharing
  const bookingGroupsMap = new Map();
  allPassengers.forEach((pax) => {
    if (!bookingGroupsMap.has(pax.bookingId)) {
      bookingGroupsMap.set(pax.bookingId, []);
    }
    bookingGroupsMap.get(pax.bookingId).push(pax);
  });

  // 1. PROCESS INTENTIONAL SAME-BOOKING GROUPS (2+ PAX)
  bookingGroupsMap.forEach((groupPax, bId) => {
    if (groupPax.length >= 2) {
      // Group booked together — allocate together regardless of gender
      let unassignedInGroup = groupPax.filter((p) => !assignedPassengerIds.has(p.id));

      while (unassignedInGroup.length > 0) {
        if (unassignedInGroup.length === 2) {
          const pair = unassignedInGroup.slice(0, 2);
          createRoom(
            "Twin",
            2,
            pair,
            `Same-Booking Group (${bId})`,
            pair[0].roomSharing || "Double Sharing"
          );
          pair.forEach((p) => assignedPassengerIds.add(p.id));
          unassignedInGroup = [];
        } else if (unassignedInGroup.length === 3) {
          const trio = unassignedInGroup.slice(0, 3);
          createRoom(
            "Triple",
            3,
            trio,
            `Same-Booking Group (${bId})`,
            trio[0].roomSharing || "Triple Sharing"
          );
          trio.forEach((p) => assignedPassengerIds.add(p.id));
          unassignedInGroup = [];
        } else if (unassignedInGroup.length === 4) {
          const quad = unassignedInGroup.slice(0, 4);
          createRoom(
            "Quad",
            4,
            quad,
            `Same-Booking Group (${bId})`,
            quad[0].roomSharing || "Quad Sharing"
          );
          quad.forEach((p) => assignedPassengerIds.add(p.id));
          unassignedInGroup = [];
        } else if (unassignedInGroup.length > 4) {
          const pref = unassignedInGroup[0]?.roomSharing;
          let chunkSize = 4;
          if (pref === "Triple Sharing" || unassignedInGroup.length % 3 === 0) {
            chunkSize = 3;
          } else if (pref === "Double Sharing" || unassignedInGroup.length % 2 === 0) {
            chunkSize = 2;
          }

          const chunk = unassignedInGroup.slice(0, chunkSize);
          const roomType = chunkSize === 3 ? "Triple" : chunkSize === 2 ? "Twin" : "Quad";
          createRoom(
            roomType,
            chunkSize,
            chunk,
            `Same-Booking Group (${bId})`,
            pref || `${roomType} Sharing`
          );
          chunk.forEach((p) => assignedPassengerIds.add(p.id));
          unassignedInGroup = unassignedInGroup.slice(chunkSize);
        } else {
          // 1 pax left in group
          break; // leave to solo pooling
        }
      }
    }
  });

  // 2. UNRELATED SOLO PASSENGERS — GROUP BY GENDER & SHARING PREFERENCE
  const unassignedPax = allPassengers.filter((p) => !assignedPassengerIds.has(p.id));
  const males = unassignedPax.filter((p) => p.gender?.toUpperCase() === "MALE" || p.gender?.toUpperCase() === "M");
  const females = unassignedPax.filter((p) => p.gender?.toUpperCase() === "FEMALE" || p.gender?.toUpperCase() === "F");
  const others = unassignedPax.filter(
    (p) => !males.includes(p) && !females.includes(p)
  );

  const groupUnrelatedPool = (pool, genderLabel) => {
    let list = [...pool];

    // First process Quad requested sharing
    const quadReq = list.filter((p) => p.roomSharing === "Quad Sharing");
    while (quadReq.length >= 4) {
      const chunk = quadReq.slice(0, 4);
      createRoom("Quad", 4, chunk, `Unrelated ${genderLabel} Quad Group`, "Quad Sharing");
      chunk.forEach((p) => {
        assignedPassengerIds.add(p.id);
        list = list.filter((item) => item.id !== p.id);
      });
    }

    // Next process Triple requested sharing
    let remainingTriple = list.filter((p) => p.roomSharing === "Triple Sharing" || !p.roomSharing);
    while (remainingTriple.length >= 3) {
      const chunk = remainingTriple.slice(0, 3);
      createRoom("Triple", 3, chunk, `Unrelated ${genderLabel} Triple Group`, "Triple Sharing");
      chunk.forEach((p) => {
        assignedPassengerIds.add(p.id);
        list = list.filter((item) => item.id !== p.id);
      });
      remainingTriple = list.filter((p) => p.roomSharing === "Triple Sharing" || !p.roomSharing);
    }

    // Next process Double requested sharing
    let remainingDouble = list.filter((p) => p.roomSharing === "Double Sharing");
    while (remainingDouble.length >= 2) {
      const pair = remainingDouble.slice(0, 2);
      createRoom("Twin", 2, pair, `Unrelated ${genderLabel} Twin Group`, "Double Sharing");
      pair.forEach((p) => {
        assignedPassengerIds.add(p.id);
        list = list.filter((item) => item.id !== p.id);
      });
      remainingDouble = list.filter((p) => p.roomSharing === "Double Sharing");
    }

    // Remaining unassigned in pool
    while (list.length >= 3) {
      const chunk = list.slice(0, 3);
      createRoom("Triple", 3, chunk, `Unrelated ${genderLabel} Group`, chunk[0]?.roomSharing || "Triple Sharing");
      chunk.forEach((p) => {
        assignedPassengerIds.add(p.id);
        list = list.filter((item) => item.id !== p.id);
      });
    }

    if (list.length === 2) {
      const pair = list.slice(0, 2);
      createRoom("Twin", 2, pair, `Unrelated ${genderLabel} Group`, pair[0]?.roomSharing || "Double Sharing");
      pair.forEach((p) => assignedPassengerIds.add(p.id));
      list = [];
    } else if (list.length === 1) {
      const solo = list[0];
      const req = solo.roomSharing || "Single";
      createRoom("Single", 1, [solo], `Solo ${genderLabel} (Single Occupancy)`, req);
      assignedPassengerIds.add(solo.id);
      list = [];
    }
  };

  groupUnrelatedPool(females, "Female");
  groupUnrelatedPool(males, "Male");
  groupUnrelatedPool(others, "Other");

  return {
    logicalRooms,
    summary: {
      totalRooms: logicalRooms.length,
      totalAssigned: assignedPassengerIds.size,
      totalUnassigned: allPassengers.length - assignedPassengerIds.size,
      breakdown: allocationCounts,
    },
    exceptions,
  };
};
