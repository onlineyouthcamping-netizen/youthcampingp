/**
 * Resolve advisory transport tariffs from Ops-owned rate tables only.
 * Never use DirectoryVendorTransportRate with OpsVendor IDs.
 */

function normalizeLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function labelsMatch(a, b) {
  const left = normalizeLabel(a);
  const right = normalizeLabel(b);
  if (!left || !right) return !left && !right ? true : !left || !right;
  return left === right;
}

/**
 * Flatten OpsRoutePricingGroup + OpsVehicleRate rows into a matchable rate list.
 */
function mapVehicleRatesFromGroups(groups = []) {
  const byVendor = {};
  for (const group of groups) {
    if (!group?.vendorId) continue;
    if (!byVendor[group.vendorId]) byVendor[group.vendorId] = [];
    for (const vr of group.vehicleRates || []) {
      byVendor[group.vendorId].push({
        source: "OpsVehicleRate",
        rateId: vr.id,
        routeName: group.routeName || null,
        vehicleType: vr.vehicle?.vehicleName || vr.vehicleNameSnapshot || null,
        capacity: vr.vehicle?.advertisedCapacity ?? vr.sellableSeats ?? null,
        sellableSeats: vr.sellableSeats ?? null,
        amount: Number(vr.totalVehicleAmount || 0),
        rateBasis: "PER_VEHICLE",
      });
    }
  }
  return byVendor;
}

/**
 * Flatten trip-scoped vendor rates. These intentionally precede vendor catalog
 * rates because they represent the negotiated terms for this trip.
 */
function mapTripVendorRates(tripVendors = [], departureDate = null) {
  const byVendor = {};
  const serviceDate = departureDate ? new Date(departureDate) : null;

  for (const tripVendor of tripVendors) {
    if (!tripVendor?.vendorId) continue;
    if (!byVendor[tripVendor.vendorId]) byVendor[tripVendor.vendorId] = [];

    for (const rate of tripVendor.rates || []) {
      if (rate.active === false) continue;
      if (String(rate.rateType || "").toUpperCase() !== "TRANSPORT") continue;
      if (
        serviceDate &&
        ((rate.validFrom && serviceDate < new Date(rate.validFrom)) ||
          (rate.validTo && serviceDate > new Date(rate.validTo)))
      ) {
        continue;
      }

      byVendor[tripVendor.vendorId].push({
        source: "OpsTripVendorRate",
        rateId: rate.id,
        routeName: rate.routeName || null,
        vehicleType: rate.vehicleType || null,
        capacity: rate.sellableSeats ?? null,
        sellableSeats: rate.sellableSeats ?? null,
        amount: Number(rate.amount || 0),
        rateBasis: rate.rateBasis || "PER_VEHICLE",
      });
    }
  }
  return byVendor;
}

/**
 * Flatten legacy OpsTransportRate rows.
 */
function mapLegacyTransportRates(rates = []) {
  const byVendor = {};
  for (const rate of rates) {
    if (!rate?.vendorId) continue;
    if (!byVendor[rate.vendorId]) byVendor[rate.vendorId] = [];
    byVendor[rate.vendorId].push({
      source: "OpsTransportRate",
      rateId: rate.id,
      routeName: rate.routeName || null,
      vehicleType: rate.vehicleType || null,
      capacity: rate.advertisedCapacity ?? null,
      sellableSeats: rate.sellableSeats ?? null,
      amount: Number(rate.totalVehicleCost || 0),
      rateBasis: "PER_VEHICLE",
    });
  }
  return byVendor;
}

/**
 * Merge rate maps: OpsVehicleRate first, then OpsTransportRate as secondary catalog.
 */
function mergeRateMaps(primary = {}, secondary = {}) {
  const merged = { ...primary };
  for (const [vendorId, rates] of Object.entries(secondary)) {
    if (!merged[vendorId]) {
      merged[vendorId] = [...rates];
    } else {
      merged[vendorId] = [...merged[vendorId], ...rates];
    }
  }
  return merged;
}

/**
 * Pick the best matching rate for a fleet row without mutating snapshot fields.
 */
function matchTariffForVehicle(vehicle, rates = []) {
  if (!Array.isArray(rates) || rates.length === 0) return null;

  const routeExact = rates.find(
    (r) =>
      (!vehicle.route || !r.routeName || labelsMatch(r.routeName, vehicle.route)) &&
      (!vehicle.vehicleType || labelsMatch(r.vehicleType, vehicle.vehicleType)),
  );
  if (routeExact) return routeExact;

  const vehicleOnly = rates.find(
    (r) => !vehicle.vehicleType || labelsMatch(r.vehicleType, vehicle.vehicleType),
  );
  return vehicleOnly || null;
}

function toTariffPayload(match) {
  if (!match) return null;
  return {
    amount: Number(match.amount || 0),
    rateBasis: match.rateBasis || "PER_VEHICLE",
    source: match.source,
    rateId: match.rateId,
    sellableSeats: match.sellableSeats ?? null,
  };
}

/**
 * Attach additive `tariff` to fleet rows. Does not mutate totalAmount.
 */
function attachTariffsToFleet(fleet = [], ratesByVendor = {}) {
  return fleet.map((veh) => {
    const rates = ratesByVendor[veh.vendorId] || [];
    const match = matchTariffForVehicle(veh, rates);
    return {
      ...veh,
      tariff: toTariffPayload(match),
    };
  });
}

module.exports = {
  normalizeLabel,
  labelsMatch,
  mapTripVendorRates,
  mapVehicleRatesFromGroups,
  mapLegacyTransportRates,
  mergeRateMaps,
  matchTariffForVehicle,
  toTariffPayload,
  attachTariffsToFleet,
};
