/**
 * Room Allocation Engine
 * Consumes Passenger Engine Output and generates a Logical Room Plan.
 */

exports.generateLogicalRooms = (passengerStats) => {
  const logicalRooms = [];
  const allocation = {
    Twin: 0,
    Triple: 0,
    Quad: 0,
    Single: 0,
    ExtraBed: 0
  };
  const exceptions = [];
  let roomCounter = 1;

  const createRoom = (type, occupancy, passengers, reason) => {
    const roomId = `TMP-${roomCounter.toString().padStart(3, '0')}`;
    logicalRooms.push({
      roomId,
      type,
      occupancy,
      hotelAssigned: false,
      passengers,
      reason
    });
    roomCounter++;
    
    // Update allocation totals
    if (allocation[type] !== undefined) {
      allocation[type]++;
    } else {
      allocation[type] = 1;
    }
  };

  const assignedPassengers = new Set();

  // 1. Couples
  if (passengerStats.groups?.couples) {
    for (const couple of passengerStats.groups.couples) {
      createRoom("Twin", 2, couple.passengerIds, "Couple");
      couple.passengerIds.forEach(id => assignedPassengers.add(id));
    }
  }

  // 2. Families
  if (passengerStats.groups?.families) {
    for (const family of passengerStats.groups.families) {
      const pIds = family.passengerIds.filter(id => !assignedPassengers.has(id));
      if (pIds.length === 0) continue; // Already assigned as couples mostly

      if (pIds.length === 2) {
        createRoom("Twin", 2, pIds, "Family");
      } else if (pIds.length === 3) {
        createRoom("Triple", 3, pIds, "Family");
      } else if (pIds.length === 4) {
        createRoom("Quad", 4, pIds, "Family");
      } else if (pIds.length > 4) {
        // Split family of 5+
        exceptions.push(`Family of ${pIds.length} requires manual split. Defaulting to Quad + Single/Extra`);
        const quadIds = pIds.slice(0, 4);
        const remIds = pIds.slice(4);
        createRoom("Quad", 4, quadIds, "Family");
        if (remIds.length === 1) {
          createRoom("Single", 1, remIds, "Family Remainder (Suggested Extra Bed)");
          allocation.ExtraBed++; // Suggest an extra bed conceptually
        } else if (remIds.length === 2) {
          createRoom("Twin", 2, remIds, "Family Remainder");
        } else {
          // Fallback
          createRoom("Triple", remIds.length, remIds, "Family Remainder");
        }
      } else if (pIds.length === 1) {
        createRoom("Single", 1, pIds, "Family (1 pax remaining)");
      }
      pIds.forEach(id => assignedPassengers.add(id));
    }
  }

  // Grouping Function for remaining males/females
  const groupRemaining = (ids, label) => {
    let unassigned = ids.filter(id => !assignedPassengers.has(id));
    
    // Prioritize triples (or twins if preferred, standard is triple for students/youth)
    while (unassigned.length >= 3) {
      const roomPax = unassigned.slice(0, 3);
      createRoom("Triple", 3, roomPax, `${label} Group`);
      roomPax.forEach(id => assignedPassengers.add(id));
      unassigned = unassigned.slice(3);
    }
    
    if (unassigned.length === 2) {
      const roomPax = unassigned.slice(0, 2);
      createRoom("Twin", 2, roomPax, `${label} Group`);
      roomPax.forEach(id => assignedPassengers.add(id));
      unassigned = [];
    }
    
    if (unassigned.length === 1) {
      const pId = unassigned[0];
      exceptions.push(`Only one ${label.toLowerCase()} passenger remaining (ID: ${pId})`);
      createRoom("Single", 1, [pId], `Odd ${label} (Suggest Single or Extra Bed)`);
      assignedPassengers.add(pId);
    }
  };

  // 3. Female Groups
  if (passengerStats.groups?.female) {
    groupRemaining(passengerStats.groups.female, "Female");
  }

  // 4. Male Groups
  if (passengerStats.groups?.male) {
    groupRemaining(passengerStats.groups.male, "Male");
  }

  // 5. Guides
  const guidesCount = passengerStats.summary?.guides || 0;
  if (guidesCount > 0) {
    const twinRooms = Math.floor(guidesCount / 2);
    const singleRooms = guidesCount % 2;
    for (let i = 0; i < twinRooms; i++) createRoom("Twin", 2, [], "Guides");
    for (let i = 0; i < singleRooms; i++) createRoom("Single", 1, [], "Guide");
  }

  // 6. Drivers
  const driversCount = passengerStats.summary?.drivers || 0;
  if (driversCount > 0) {
    for (let i = 0; i < driversCount; i++) {
      createRoom("DriverRoom", 1, [], "Driver");
    }
  }

  // Validation
  const readiness = {
    status: exceptions.length > 0 ? "Manual Review" : "Ready",
    exceptions
  };

  return {
    allocation,
    logicalRooms,
    readiness
  };
};
