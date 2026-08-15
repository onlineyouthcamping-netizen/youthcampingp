const CONFIRMED_ROOM_FIELDS = new Set(["roomNo", "roomNumber"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findConfirmedRoomFields(body = {}) {
  const found = [];
  if (body.roomAllocation !== undefined) found.push("roomAllocation");

  const passengers = isPlainObject(body.passengers) ? body.passengers : {};
  const details = isPlainObject(passengers.details) ? passengers.details : {};
  if (details.roomAllocation !== undefined) {
    found.push("passengers.details.roomAllocation");
  }

  const personsRoomDetails = isPlainObject(details.personsRoomDetails)
    ? details.personsRoomDetails
    : {};
  for (const [travelerName, roomDetails] of Object.entries(personsRoomDetails)) {
    if (!isPlainObject(roomDetails)) continue;
    for (const field of CONFIRMED_ROOM_FIELDS) {
      if (roomDetails[field] !== undefined) {
        found.push(
          `passengers.details.personsRoomDetails.${travelerName}.${field}`,
        );
      }
    }
  }
  return found;
}

function mergePersonsRoomDetails(existing = {}, incoming = {}) {
  const merged = { ...(isPlainObject(existing) ? existing : {}) };
  for (const [travelerName, details] of Object.entries(
    isPlainObject(incoming) ? incoming : {},
  )) {
    if (!isPlainObject(details)) continue;
    const preferenceOnly = { ...details };
    for (const field of CONFIRMED_ROOM_FIELDS) delete preferenceOnly[field];
    merged[travelerName] = {
      ...(isPlainObject(merged[travelerName]) ? merged[travelerName] : {}),
      ...preferenceOnly,
    };
  }
  return merged;
}

function mergePassengerPreferences(existingPassengers, incomingPassengers) {
  const existing = Array.isArray(existingPassengers)
    ? { details: {}, persons: existingPassengers }
    : isPlainObject(existingPassengers)
      ? existingPassengers
      : {};
  const incoming = isPlainObject(incomingPassengers) ? incomingPassengers : {};
  const existingDetails = isPlainObject(existing.details)
    ? existing.details
    : {};
  const incomingDetails = isPlainObject(incoming.details)
    ? incoming.details
    : {};

  const details = {
    ...existingDetails,
    ...incomingDetails,
    personsRoomDetails: mergePersonsRoomDetails(
      existingDetails.personsRoomDetails,
      incomingDetails.personsRoomDetails,
    ),
  };

  return {
    ...existing,
    ...incoming,
    details,
    persons: Array.isArray(incoming.persons)
      ? incoming.persons
      : Array.isArray(existing.persons)
        ? existing.persons
        : [],
  };
}

function mirrorConfirmedRooms(existingPassengers, allocations = []) {
  const existing = mergePassengerPreferences(existingPassengers, {});
  const details = { ...(existing.details || {}) };
  const personsRoomDetails = {
    ...(isPlainObject(details.personsRoomDetails)
      ? details.personsRoomDetails
      : {}),
  };

  for (const allocation of allocations) {
    if (!allocation?.travelerName) continue;
    personsRoomDetails[allocation.travelerName] = {
      ...(isPlainObject(personsRoomDetails[allocation.travelerName])
        ? personsRoomDetails[allocation.travelerName]
        : {}),
      roomNo: allocation.roomNumber,
    };
  }

  return {
    ...existing,
    details: {
      ...details,
      personsRoomDetails,
    },
  };
}

module.exports = {
  findConfirmedRoomFields,
  mergePersonsRoomDetails,
  mergePassengerPreferences,
  mirrorConfirmedRooms,
};
