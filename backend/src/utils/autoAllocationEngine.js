const { prisma } = require('../lib/prisma');

/**
 * Executes vehicle and room auto-allocation for a given departure
 * @param {Array} bookings List of bookings for the trip departure
 * @param {Array} fleet List of available transport fleet (tempos/cars)
 * @returns {Object} { vehicleAllocations, roomAllocations, flags, whatsappTempoText, whatsappRoomText }
 */
async function runAutoAllocation(bookings, fleet, roomInventory) {
  const flags = [];
  const vehicleAllocations = [];
  const roomAllocations = [];

  // 1. Flatten all travelers into traveler items with group metadata
  const travelers = [];
  bookings.forEach((b) => {
    const groupId = b.sourceBookingLinkId || b.bookingId;
    let passList = Array.isArray(b.passengers) ? b.passengers : [];
    if (passList.length === 0) {
      passList = [{ name: b.fullName || b.name, gender: b.gender, age: b.age }];
    }

    passList.forEach((p, idx) => {
      const rawGender = (p.gender || b.gender || '').trim().toLowerCase();
      let parsedGender = 'UNKNOWN';
      if (rawGender.startsWith('m')) parsedGender = 'Male';
      else if (rawGender.startsWith('f')) parsedGender = 'Female';

      travelers.push({
        travelerId: `${b.bookingId}-${idx}`,
        bookingId: b.bookingId,
        groupId,
        name: p.name || p.fullName || b.name,
        gender: parsedGender,
        age: p.age || b.age,
        groupSize: passList.length,
        roomSharing: p.roomPreference || p.roomSharing || b.roomSharing || 'Triple Sharing'
      });
    });
  });

  // ── VEHICLE ALLOCATION (Rules 1, 2, 3) ──
  const groupMap = {};
  travelers.forEach((t) => {
    if (!groupMap[t.groupId]) groupMap[t.groupId] = [];
    groupMap[t.groupId].push(t);
  });

  const sortedGroupIds = Object.keys(groupMap).sort((a, b) => groupMap[b].length - groupMap[a].length);

  const fleetStatus = fleet.map((f) => ({
    ...f,
    remainingSeats: f.capacity,
    assignedTravelers: []
  }));

  sortedGroupIds.forEach((gId) => {
    const groupMembers = groupMap[gId];
    const gSize = groupMembers.length;

    let assignedFleet = fleetStatus.find((f) => f.remainingSeats >= gSize);

    if (assignedFleet) {
      groupMembers.forEach((t) => {
        assignedFleet.assignedTravelers.push(t);
        assignedFleet.remainingSeats -= 1;
        vehicleAllocations.push({
          fleetId: assignedFleet.id,
          bookingId: t.bookingId,
          travelerName: t.name,
          seatNumber: assignedFleet.capacity - assignedFleet.remainingSeats
        });
      });
    } else {
      if (gSize >= 5) {
        flags.push(`🚨 Group (${groupMembers[0].name} & ${gSize - 1} others) exceeds single vehicle capacity — manual review recommended.`);
      }
      groupMembers.forEach((t) => {
        let availFleet = fleetStatus.find((f) => f.remainingSeats > 0);
        if (availFleet) {
          availFleet.assignedTravelers.push(t);
          availFleet.remainingSeats -= 1;
          vehicleAllocations.push({
            fleetId: availFleet.id,
            bookingId: t.bookingId,
            travelerName: t.name,
            seatNumber: availFleet.capacity - availFleet.remainingSeats
          });
        } else {
          flags.push(`⚠️ Capacity overflow: No vehicle capacity left for traveler ${t.name} (${t.bookingId}).`);
        }
      });
    }
  });

  // ── ROOM ALLOCATION (Rules 4, 5, 6) ──
  // Separate travelers into groups vs solos
  const soloTravelers = travelers.filter((t) => t.groupSize === 1);
  const soloBoys = soloTravelers.filter((t) => t.gender === 'Male');
  const soloGirls = soloTravelers.filter((t) => t.gender === 'Female');
  const soloUnknowns = soloTravelers.filter((t) => t.gender === 'UNKNOWN');

  soloUnknowns.forEach((t) => {
    flags.push(`🚨 TRAVELER_GENDER_MISSING: Traveler ${t.name} (${t.bookingId}) has unknown gender — automatic room allocation blocked.`);
  });

  // Check unknown gender in groups
  sortedGroupIds.forEach((gId) => {
    const groupMembers = groupMap[gId];
    if (groupMembers.length > 1) {
      groupMembers.forEach((t) => {
        if (t.gender === 'UNKNOWN') {
          flags.push(`🚨 TRAVELER_GENDER_MISSING: Traveler ${t.name} (${t.bookingId}) has unknown gender.`);
        }
      });
    }
  });

  // Collect multi-person groups
  const multiGroups = sortedGroupIds
    .map(gId => groupMap[gId])
    .filter(g => g.length > 1);

  // ── Helper to chunk arrays into groups of max size ──
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // ── Split multi-person groups into subgroups based on roomSharing preference ──
  const subgroups = [];
  multiGroups.forEach(groupMembers => {
    const males = groupMembers.filter(m => m.gender === 'Male');
    const females = groupMembers.filter(m => m.gender === 'Female');
    const others = groupMembers.filter(m => m.gender !== 'Male' && m.gender !== 'Female');

    [males, females, others].forEach(genderGroup => {
      if (genderGroup.length === 0) return;

      const doubleGroup = genderGroup.filter(m => m.roomSharing === 'Double Sharing');
      const tripleGroup = genderGroup.filter(m => m.roomSharing === 'Triple Sharing');
      const quadGroup = genderGroup.filter(m => m.roomSharing === 'Quad Sharing');
      const remaining = genderGroup.filter(m => 
        m.roomSharing !== 'Double Sharing' && 
        m.roomSharing !== 'Triple Sharing' && 
        m.roomSharing !== 'Quad Sharing'
      );

      // Chunk double sharing into subgroups of 2
      chunkArray(doubleGroup, 2).forEach(chunk => subgroups.push(chunk));

      // Chunk triple sharing into subgroups of 3
      chunkArray(tripleGroup, 3).forEach(chunk => subgroups.push(chunk));

      // Chunk quad sharing into subgroups of 4
      chunkArray(quadGroup, 4).forEach(chunk => subgroups.push(chunk));

      // For remaining: use group's size or fallback to 3
      const defaultCapacity = genderGroup.length === 2 ? 2 : 3;
      chunkArray(remaining, defaultCapacity).forEach(chunk => subgroups.push(chunk));
    });
  });

  if (Array.isArray(roomInventory) && roomInventory.length > 0) {
    // ── INVENTORY-BASED ROOM ALLOCATION ──
    // Build room slots from inventory
    const roomSlots = roomInventory.map(r => ({
      id: r.id,
      roomLabel: r.roomLabel,
      roomType: r.roomType,
      genderGroup: (r.genderGroup || 'GROUP').toUpperCase(),
      capacity: r.capacity || 2,
      hotelName: r.hotelName,
      remaining: r.capacity || 2,
      assigned: []
    }));

    // Sort roomSlots by trip hotel priority (primary hotel first, secondary hotel second, etc.)
    // This ensures rooms from Hotel #1 are filled before moving to Hotel #2
    const tripId = bookings[0]?.tripId;
    if (tripId) {
      try {
        const mappings = await prisma.directoryTripVendorMapping.findMany({
          where: { tripId, serviceType: 'HOTEL' },
          include: { vendor: true },
          orderBy: [
            { isPrimary: 'desc' },
            { id: 'asc' }
          ]
        });
        
        const hotelPriority = mappings.map(m => m.vendor.name.toLowerCase());
        
        roomSlots.sort((a, b) => {
          const idxA = hotelPriority.indexOf((a.hotelName || '').toLowerCase());
          const idxB = hotelPriority.indexOf((b.hotelName || '').toLowerCase());
          const valA = idxA === -1 ? 999 : idxA;
          const valB = idxB === -1 ? 999 : idxB;
          return valA - valB;
        });

        if (hotelPriority.length > 0) {
          flags.push(`ℹ️ Hotel priority order: ${hotelPriority.join(' → ')}. Rooms filled in order — overflow moves to next hotel.`);
        }
      } catch (err) {
        console.error("Failed to prioritize roomSlots by trip vendor mappings:", err);
      }
    }

    // Helper: find a room slot matching gender with enough remaining capacity
    const findRoom = (genderGroup, count, prefCapacity = null) => {
      if (prefCapacity) {
        const match = roomSlots.find(r => r.genderGroup === genderGroup && r.remaining >= count && r.capacity === prefCapacity);
        if (match) return match;
      }
      return roomSlots.find(r => r.genderGroup === genderGroup && r.remaining >= count);
    };

    // Helper to check if a room slot can accept a traveler of a given gender
    const canAcceptGender = (room, gender) => {
      if (room.assigned.length === 0) return true;
      return room.assigned.every(member => member.gender === gender);
    };

    // Step 1: Assign multi-person subgroups to GROUP/COUPLE rooms
    subgroups.forEach(subgroupMembers => {
      let room = null;
      const size = subgroupMembers.length;
      
      const prefCapacity = subgroupMembers[0].roomSharing === 'Double Sharing' ? 2 : 
                           subgroupMembers[0].roomSharing === 'Triple Sharing' ? 3 : 4;

      if (prefCapacity === 2) {
        // For couples / duos (Double Sharing): prioritize TWIN rooms (capacity 2), then fallback
        room = findRoom('COUPLE', size, 2)
              || findRoom('GROUP', size, 2)
              || findRoom('FAMILY', size, 2)
              || findRoom('COUPLE', size)
              || findRoom('GROUP', size)
              || findRoom('FAMILY', size);
      } else {
        // For Triple/Quad Sharing: prioritize TRIPLE/QUAD rooms, then fallback
        room = findRoom('GROUP', size, prefCapacity)
              || findRoom('FAMILY', size, prefCapacity)
              || findRoom('COUPLE', size, prefCapacity)
              || findRoom('GROUP', size)
              || findRoom('FAMILY', size)
              || findRoom('COUPLE', size);
      }

      // If no matching gender group room fits, fallback to any room with capacity (matching preference capacity first)
      if (!room) {
        room = roomSlots.find(r => r.remaining >= size && r.capacity === prefCapacity)
              || roomSlots.find(r => r.remaining >= size);
      }

      if (room) {
        subgroupMembers.forEach(t => {
          room.assigned.push(t);
          room.remaining -= 1;
          roomAllocations.push({
            roomNumber: room.roomLabel,
            roomType: room.roomType,
            genderGroup: room.genderGroup,
            bookingId: t.bookingId,
            travelerName: t.name
          });
        });
        
        // Exclusivity: if subgroup matches or exceeds their preferred capacity, room is private
        if (subgroupMembers.length >= prefCapacity) {
          room.remaining = 0;
        }
      } else {
        flags.push(`⚠️ No room with ${subgroupMembers.length} capacity for subgroup (${subgroupMembers[0].name} & ${subgroupMembers.length - 1} others) — needs manual assignment.`);
      }
    });

    // Step 2: Assign solo boys to BOYS rooms or compatible rooms
    soloBoys.forEach(t => {
      let room = findRoom('BOYS', 1);
      if (!room) {
        room = roomSlots.find(r => r.remaining >= 1 && r.genderGroup !== 'GIRLS' && canAcceptGender(r, 'Male'));
      }
      if (room) {
        room.assigned.push(t);
        room.remaining -= 1;
        roomAllocations.push({
          roomNumber: room.roomLabel,
          roomType: room.roomType,
          genderGroup: room.genderGroup,
          bookingId: t.bookingId,
          travelerName: t.name
        });
      } else {
        flags.push(`⚠️ No BOYS room capacity left for ${t.name} (${t.bookingId}) — needs manual assignment.`);
      }
    });

    // Step 3: Assign solo girls to GIRLS rooms or compatible rooms
    soloGirls.forEach(t => {
      let room = findRoom('GIRLS', 1);
      if (!room) {
        room = roomSlots.find(r => r.remaining >= 1 && r.genderGroup !== 'BOYS' && canAcceptGender(r, 'Female'));
      }
      if (room) {
        room.assigned.push(t);
        room.remaining -= 1;
        roomAllocations.push({
          roomNumber: room.roomLabel,
          roomType: room.roomType,
          genderGroup: room.genderGroup,
          bookingId: t.bookingId,
          travelerName: t.name
        });
      } else {
        flags.push(`⚠️ No GIRLS room capacity left for ${t.name} (${t.bookingId}) — needs manual assignment.`);
      }
    });

    // Add summary of room utilization
    roomSlots.forEach(r => {
      if (r.assigned.length === 0 && r.capacity > 0) {
        flags.push(`ℹ️ Room ${r.roomLabel} (${r.roomType} - ${r.genderGroup}) is empty — ${r.capacity} beds unused.`);
      }
    });

  } else {
    // ── FALLBACK: Auto-generate room numbers (upgraded with virtual slots) ──
    let roomCounter = 101;
    const virtualRooms = [];

    // Step 1: Create virtual rooms for all multi-person subgroups
    subgroups.forEach(subgroupMembers => {
      const roomNum = `Room ${roomCounter++}`;
      const prefCapacity = subgroupMembers[0].roomSharing === 'Double Sharing' ? 2 : 
                           subgroupMembers[0].roomSharing === 'Triple Sharing' ? 3 : 4;
      
      const virtualRoom = {
        roomLabel: roomNum,
        roomType: subgroupMembers.length === 2 ? 'TWIN' : subgroupMembers.length === 3 ? 'TRIPLE' : 'QUAD/FAMILY',
        genderGroup: 'GROUP',
        capacity: prefCapacity,
        remaining: prefCapacity - subgroupMembers.length,
        assigned: [...subgroupMembers]
      };

      // Exclusivity: if subgroup matches or exceeds preferred capacity, room is private
      if (subgroupMembers.length >= prefCapacity) {
        virtualRoom.remaining = 0;
      }

      virtualRooms.push(virtualRoom);
    });

    // Step 2: Assign solo boys to existing compatible rooms, or create new twin/single rooms
    soloBoys.forEach(t => {
      let room = virtualRooms.find(r => r.remaining >= 1 && r.assigned.every(m => m.gender === 'Male'));
      if (room) {
        room.assigned.push(t);
        room.remaining -= 1;
      } else {
        const roomNum = `Room ${roomCounter++}`;
        virtualRooms.push({
          roomLabel: roomNum,
          roomType: 'TWIN',
          genderGroup: 'BOYS',
          capacity: 2,
          remaining: 1,
          assigned: [t]
        });
      }
    });

    // Step 3: Assign solo girls to existing compatible rooms, or create new twin/single rooms
    soloGirls.forEach(t => {
      let room = virtualRooms.find(r => r.remaining >= 1 && r.assigned.every(m => m.gender === 'Female'));
      if (room) {
        room.assigned.push(t);
        room.remaining -= 1;
      } else {
        const roomNum = `Room ${roomCounter++}`;
        virtualRooms.push({
          roomLabel: roomNum,
          roomType: 'TWIN',
          genderGroup: 'GIRLS',
          capacity: 2,
          remaining: 1,
          assigned: [t]
        });
      }
    });

    // Populate roomAllocations and add warning flags for single/unpaired solos
    virtualRooms.forEach(room => {
      room.assigned.forEach(t => {
        roomAllocations.push({
          roomNumber: room.roomLabel,
          roomType: room.roomType,
          genderGroup: room.genderGroup,
          bookingId: t.bookingId,
          travelerName: t.name
        });
      });

      if (room.assigned.length === 1 && (room.genderGroup === 'BOYS' || room.genderGroup === 'GIRLS')) {
        flags.push(`⚠️ 1 solo ${room.genderGroup === 'BOYS' ? 'male' : 'female'} (${room.assigned[0].name}) unallocated to twin room — needs manual room assignment.`);
      }
    });
  }

  // ── WHATSAPP TEXT FORMATTING ──
  const whatsappTempoText = buildWhatsappTempoText(vehicleAllocations, fleetStatus, flags);

  let whatsappRoomText = `🏨 *HOTEL ROOM ALLOCATION LIST*\n\n`;
  const roomMap = {};
  roomAllocations.forEach((r) => {
    if (!roomMap[r.roomNumber]) roomMap[r.roomNumber] = { type: r.roomType, gender: r.genderGroup, members: [] };
    roomMap[r.roomNumber].members.push(r.travelerName);
  });

  Object.entries(roomMap).forEach(([roomNum, details]) => {
    const genderLabel = details.gender === 'BOYS' ? 'Boys' : details.gender === 'GIRLS' ? 'Girls' : details.gender === 'COUPLE' ? 'Couple' : 'Group';
    whatsappRoomText += `*${roomNum}* — ${details.members.join(", ")} (${genderLabel})\n`;
  });

  return {
    vehicleAllocations,
    roomAllocations,
    flags,
    whatsappTempoText,
    whatsappRoomText
  };
}

function buildWhatsappTempoText(vehicleAllocations = [], fleetStatus = [], flags = []) {
  let whatsappTempoText = `🚌 *TEMPO & VEHICLE ALLOCATION LIST*\n\n`;

  // Group allocations by fleetId
  const fleetMap = {};
  vehicleAllocations.forEach(va => {
    if (!fleetMap[va.fleetId]) fleetMap[va.fleetId] = [];
    fleetMap[va.fleetId].push(va);
  });

  fleetStatus.forEach((f, idx) => {
    const allocs = fleetMap[f.id] || [];
    const names = allocs.map(t => t.travelerName);
    whatsappTempoText += `*Tempo ${idx + 1}* — ${names.join(", ")}\n`;
  });

  if (flags.length > 0) {
    whatsappTempoText += `\n🚨 *FLAGS (${flags.length} issues need manual review)*\n`;
    flags.forEach((flag, fIdx) => {
      whatsappTempoText += `${fIdx + 1}. ${flag.replace(/^🚨\s*|^⚠️\s*|^ℹ️\s*/, "")}\n`;
    });
  }

  return whatsappTempoText.trim();
}

module.exports = {
  runAutoAllocation,
  buildWhatsappTempoText
};
