const { prisma } = require("../lib/prisma");

// ── VEHICLE MASTER ─────────────────────────────────────────────────────────────

exports.getVendorVehicles = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const vehicles = await prisma.opsVendorVehicle.findMany({
      where: { vendorId, isActive: true },
      orderBy: { advertisedCapacity: "desc" },
    });
    res.json({ success: true, data: vehicles });
  } catch (error) { next(error); }
};

exports.createVendorVehicle = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const tenantId = req.user?.tenantId || "default";
    const { vehicleName, vehicleCode, plateNumber, vehicleCategory, advertisedCapacity, sellableSeats, hasAC, fuelType, luggageCapacity, notes } = req.body;

    if (!vehicleName) return res.status(400).json({ success: false, message: "vehicleName is required" });
    const adCap = parseInt(advertisedCapacity) || 0;
    const sells = parseInt(sellableSeats) || 0;
    if (adCap <= 0) return res.status(400).json({ success: false, message: "advertisedCapacity must be > 0" });
    if (sells <= 0) return res.status(400).json({ success: false, message: "sellableSeats must be > 0" });
    if (sells > adCap) return res.status(400).json({ success: false, message: "sellableSeats cannot exceed advertisedCapacity" });

    const vehicle = await prisma.opsVendorVehicle.create({
      data: {
        tenantId, vendorId,
        vehicleName,
        vehicleCode: vehicleCode || null,
        plateNumber: plateNumber || null,
        vehicleCategory: vehicleCategory || "TEMPO_TRAVELLER",
        advertisedCapacity: adCap,
        sellableSeats: sells,
        hasAC: hasAC !== false && hasAC !== "false",
        fuelType: fuelType || "Diesel",
        luggageCapacity: luggageCapacity || null,
        notes: notes || null,
        isActive: true,
      },
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) { console.error("createVendorVehicle:", error); next(error); }
};

exports.updateVendorVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { vehicleName, vehicleCode, plateNumber, vehicleCategory, advertisedCapacity, sellableSeats, hasAC, fuelType, luggageCapacity, notes, isActive } = req.body;

    const adCap = advertisedCapacity ? parseInt(advertisedCapacity) : undefined;
    const sells = sellableSeats ? parseInt(sellableSeats) : undefined;
    if (adCap !== undefined && sells !== undefined && sells > adCap) {
      return res.status(400).json({ success: false, message: "sellableSeats cannot exceed advertisedCapacity" });
    }

    const vehicle = await prisma.opsVendorVehicle.update({
      where: { id: vehicleId },
      data: {
        vehicleName: vehicleName || undefined,
        vehicleCode: vehicleCode !== undefined ? vehicleCode : undefined,
        plateNumber: plateNumber !== undefined ? plateNumber : undefined,
        vehicleCategory: vehicleCategory || undefined,
        advertisedCapacity: adCap,
        sellableSeats: sells,
        hasAC: hasAC !== undefined ? (hasAC !== false && hasAC !== "false") : undefined,
        fuelType: fuelType || undefined,
        luggageCapacity: luggageCapacity !== undefined ? luggageCapacity : undefined,
        notes: notes !== undefined ? notes : undefined,
        isActive: isActive !== undefined ? (isActive === true || isActive === "true") : undefined,
      },
    });
    res.json({ success: true, data: vehicle });
  } catch (error) { next(error); }
};

exports.deleteVendorVehicle = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const activeRates = await prisma.opsVehicleRate.count({ where: { vehicleId, isActive: true } });
    if (activeRates > 0) {
      return res.status(409).json({ success: false, message: `Cannot delete — vehicle has ${activeRates} active rate(s). Deactivate those first.` });
    }
    await prisma.opsVendorVehicle.update({ where: { id: vehicleId }, data: { isActive: false } });
    res.json({ success: true, message: "Vehicle deactivated" });
  } catch (error) { next(error); }
};

// ── ROUTE PRICING GROUPS ──────────────────────────────────────────────────────

exports.getRoutePricingGroups = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const groups = await prisma.opsRoutePricingGroup.findMany({
      where: { vendorId },
      include: {
        vehicleRates: {
          where: { isActive: true },
          include: {
            vehicle: { select: { id: true, vehicleName: true, vehicleCategory: true, advertisedCapacity: true, sellableSeats: true, plateNumber: true, vehicleCode: true } },
          },
          orderBy: { vehicle: { advertisedCapacity: "desc" } },
        },
      },
      orderBy: [{ routeName: "asc" }, { pickupLocation: "asc" }],
    });
    res.json({ success: true, data: groups });
  } catch (error) { next(error); }
};

exports.createRoutePricingGroup = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    const tenantId = req.user?.tenantId || "default";
    const { routeName, tripName, pickupLocation, dropLocation, destination, season, durationDays, durationNights, pickupDropIncluded, validFrom, validTo, notes } = req.body;

    if (!routeName) return res.status(400).json({ success: false, message: "routeName is required" });
    if (!pickupLocation) return res.status(400).json({ success: false, message: "pickupLocation is required" });
    if (!dropLocation) return res.status(400).json({ success: false, message: "dropLocation is required" });

    const group = await prisma.opsRoutePricingGroup.create({
      data: {
        tenantId, vendorId, routeName,
        tripName: tripName || null,
        pickupLocation, dropLocation,
        destination: destination || null,
        season: season || null,
        durationDays: durationDays ? parseInt(durationDays) : 1,
        durationNights: durationNights ? parseInt(durationNights) : 0,
        pickupDropIncluded: pickupDropIncluded !== false && pickupDropIncluded !== "false",
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        notes: notes || null,
        isActive: true,
      },
      include: { vehicleRates: { include: { vehicle: true } } },
    });
    res.status(201).json({ success: true, data: group });
  } catch (error) { next(error); }
};

exports.updateRoutePricingGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { routeName, tripName, pickupLocation, dropLocation, destination, season, durationDays, durationNights, pickupDropIncluded, validFrom, validTo, notes, isActive } = req.body;

    const group = await prisma.opsRoutePricingGroup.update({
      where: { id: groupId },
      data: {
        routeName: routeName || undefined,
        tripName: tripName !== undefined ? tripName : undefined,
        pickupLocation: pickupLocation || undefined,
        dropLocation: dropLocation || undefined,
        destination: destination !== undefined ? destination : undefined,
        season: season !== undefined ? season : undefined,
        durationDays: durationDays ? parseInt(durationDays) : undefined,
        durationNights: durationNights !== undefined ? parseInt(durationNights) : undefined,
        pickupDropIncluded: pickupDropIncluded !== undefined ? (pickupDropIncluded !== false && pickupDropIncluded !== "false") : undefined,
        validFrom: validFrom !== undefined ? (validFrom ? new Date(validFrom) : null) : undefined,
        validTo: validTo !== undefined ? (validTo ? new Date(validTo) : null) : undefined,
        notes: notes !== undefined ? notes : undefined,
        isActive: isActive !== undefined ? (isActive === true || isActive === "true") : undefined,
      },
      include: { vehicleRates: { include: { vehicle: true } } },
    });
    res.json({ success: true, data: group });
  } catch (error) { next(error); }
};

exports.deleteRoutePricingGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    await prisma.opsVehicleRate.deleteMany({ where: { routePricingGroupId: groupId } });
    await prisma.opsRoutePricingGroup.deleteMany({ where: { id: groupId } });
    res.json({ success: true, message: "Route pricing group deleted successfully" });
  } catch (error) { next(error); }
};

exports.duplicateRoutePricingGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const tenantId = req.user?.tenantId || "default";
    const original = await prisma.opsRoutePricingGroup.findUnique({ where: { id: groupId }, include: { vehicleRates: true } });
    if (!original) return res.status(404).json({ success: false, message: "Group not found" });

    const { id, createdAt, updatedAt, vehicleRates, ...groupData } = original;
    const newGroup = await prisma.opsRoutePricingGroup.create({
      data: {
        ...groupData, tenantId,
        routeName: `${groupData.routeName} (Copy)`,
        isActive: false,
        vehicleRates: {
          create: vehicleRates.map(({ id: _id, createdAt: _ca, updatedAt: _ua, routePricingGroupId: _rpgId, ...rateData }) => ({
            ...rateData, tenantId,
          })),
        },
      },
      include: { vehicleRates: { include: { vehicle: true } } },
    });
    res.status(201).json({ success: true, data: newGroup });
  } catch (error) { next(error); }
};

// ── VEHICLE RATES ──────────────────────────────────────────────────────────────

exports.addVehicleRate = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const tenantId = req.user?.tenantId || "default";
    const { vehicleId, totalVehicleAmount, sellableSeats, negotiatedPP, minimumPassengers, maximumPassengers, extraPickupDropAmount, extraDayAmount, notes } = req.body;

    if (!vehicleId) return res.status(400).json({ success: false, message: "vehicleId is required" });
    if (totalVehicleAmount === undefined || parseFloat(totalVehicleAmount) < 0) {
      return res.status(400).json({ success: false, message: "totalVehicleAmount must be >= 0" });
    }

    const vehicle = await prisma.opsVendorVehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found in master" });

    const seats = sellableSeats ? parseInt(sellableSeats) : vehicle.sellableSeats;
    if (seats <= 0) return res.status(400).json({ success: false, message: "sellableSeats must be > 0" });

    const amount = parseFloat(totalVehicleAmount);
    const suggestedPP = parseFloat((amount / seats).toFixed(2));

    // Upsert logic — reactivate if soft-deleted
    const existing = await prisma.opsVehicleRate.findUnique({
      where: { routePricingGroupId_vehicleId: { routePricingGroupId: groupId, vehicleId } },
    });
    if (existing && existing.isActive) {
      return res.status(409).json({ success: false, message: `"${vehicle.vehicleName}" already has an active rate in this group` });
    }

    const rateData = {
      vehicleNameSnapshot: vehicle.vehicleName,
      totalVehicleAmount: amount,
      sellableSeats: seats,
      suggestedPP,
      negotiatedPP: negotiatedPP !== undefined && negotiatedPP !== "" ? parseFloat(negotiatedPP) : null,
      minimumPassengers: minimumPassengers ? parseInt(minimumPassengers) : 1,
      maximumPassengers: maximumPassengers ? parseInt(maximumPassengers) : null,
      extraPickupDropAmount: extraPickupDropAmount ? parseFloat(extraPickupDropAmount) : 0,
      extraDayAmount: extraDayAmount ? parseFloat(extraDayAmount) : 0,
      notes: notes || null,
      isActive: true,
    };

    let rate;
    if (existing) {
      rate = await prisma.opsVehicleRate.update({ where: { id: existing.id }, data: rateData, include: { vehicle: true } });
    } else {
      rate = await prisma.opsVehicleRate.create({
        data: { tenantId, routePricingGroupId: groupId, vehicleId, ...rateData },
        include: { vehicle: true },
      });
    }
    res.status(201).json({ success: true, data: rate });
  } catch (error) { console.error("addVehicleRate:", error); next(error); }
};

exports.updateVehicleRate = async (req, res, next) => {
  try {
    const { rateId } = req.params;
    const { totalVehicleAmount, sellableSeats, negotiatedPP, minimumPassengers, maximumPassengers, extraPickupDropAmount, extraDayAmount, notes, isActive } = req.body;

    const existing = await prisma.opsVehicleRate.findUnique({ where: { id: rateId } });
    if (!existing) return res.status(404).json({ success: false, message: "Rate not found" });

    const amount = totalVehicleAmount !== undefined ? parseFloat(totalVehicleAmount) : Number(existing.totalVehicleAmount);
    const seats = sellableSeats !== undefined ? parseInt(sellableSeats) : existing.sellableSeats;
    const suggestedPP = parseFloat((amount / seats).toFixed(2));

    const rate = await prisma.opsVehicleRate.update({
      where: { id: rateId },
      data: {
        totalVehicleAmount: amount,
        sellableSeats: seats,
        suggestedPP,
        negotiatedPP: negotiatedPP !== undefined ? (negotiatedPP === null || negotiatedPP === "" ? null : parseFloat(negotiatedPP)) : undefined,
        minimumPassengers: minimumPassengers !== undefined ? parseInt(minimumPassengers) : undefined,
        maximumPassengers: maximumPassengers !== undefined ? (maximumPassengers ? parseInt(maximumPassengers) : null) : undefined,
        extraPickupDropAmount: extraPickupDropAmount !== undefined ? parseFloat(extraPickupDropAmount) : undefined,
        extraDayAmount: extraDayAmount !== undefined ? parseFloat(extraDayAmount) : undefined,
        notes: notes !== undefined ? notes : undefined,
        isActive: isActive !== undefined ? (isActive === true || isActive === "true") : undefined,
      },
      include: { vehicle: true },
    });
    res.json({ success: true, data: rate });
  } catch (error) { next(error); }
};

exports.deleteVehicleRate = async (req, res, next) => {
  try {
    const { rateId } = req.params;
    await prisma.opsVehicleRate.update({ where: { id: rateId }, data: { isActive: false } });
    res.json({ success: true, message: "Vehicle rate deactivated" });
  } catch (error) { next(error); }
};

exports.lookupRateForDeparture = async (req, res, next) => {
  try {
    const { vendorId, vehicleId, routePricingGroupId, pickupLocation, dropLocation, destination, durationDays } = req.query;
    if (!vendorId) return res.status(400).json({ success: false, message: "vendorId is required" });

    const groupWhere = { vendorId, isActive: true };
    if (pickupLocation) groupWhere.pickupLocation = { contains: pickupLocation, mode: "insensitive" };
    if (dropLocation) groupWhere.dropLocation = { contains: dropLocation, mode: "insensitive" };
    if (destination) groupWhere.destination = { contains: destination, mode: "insensitive" };
    if (durationDays) groupWhere.durationDays = parseInt(durationDays);

    const where = { routePricingGroup: groupWhere, isActive: true };
    if (routePricingGroupId) where.routePricingGroupId = routePricingGroupId;
    if (vehicleId) where.vehicleId = vehicleId;

    const rates = await prisma.opsVehicleRate.findMany({
      where,
      include: {
        vehicle: true,
        routePricingGroup: {
          select: { id: true, routeName: true, tripName: true, pickupLocation: true, dropLocation: true, destination: true, season: true, durationDays: true, durationNights: true, pickupDropIncluded: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: rates });
  } catch (error) { next(error); }
};
