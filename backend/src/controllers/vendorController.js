const { prisma } = require('../lib/prisma');

/**
 * @desc    Create vendor
 * @route   POST /api/vendors
 * @access  Private/Admin
 */
exports.createVendor = async (req, res, next) => {
  try {
    const { name, type, email, phone, location, isActive } = req.body;
    const vendor = await prisma.vendor.create({
      data: {
        name,
        type,
        email: email || null,
        phone: phone || null,
        location: location || null,
        isActive: isActive !== false,
        tenantId: req.user.tenantId
      }
    });
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vendors (Scoped by tenantId)
 * @route   GET /api/vendors
 * @access  Private/Admin
 */
exports.getVendors = async (req, res, next) => {
  try {
    const where = { tenantId: req.user.tenantId };
    if (req.query.type) where.type = req.query.type;
    if (req.query.active !== undefined) where.isActive = req.query.active === 'true';

    const vendors = await prisma.vendor.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign vendor to trip
 * @route   POST /api/vendors/trip-assign
 * @access  Private/Admin
 */
exports.assignVendorToTrip = async (req, res, next) => {
  try {
    const { tripId, vendorId, agreedCost, notes } = req.body;
    const tenantId = req.user.tenantId;

    const assignment = await prisma.tripVendor.create({
      data: { tripId, vendorId, agreedCost: Number(agreedCost), notes, tenantId },
      include: { vendor: true }
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all vendors for a trip
 * @route   GET /api/vendors/trip/:tripId
 * @access  Private/Admin
 */
exports.getVendorsForTrip = async (req, res, next) => {
  try {
    const assignments = await prisma.tripVendor.findMany({
      where: { tripId: req.params.tripId, tenantId: req.user.tenantId },
      include: { vendor: true },
      orderBy: { createdAt: 'asc' }
    });

    const totalVendorCost = assignments.reduce((sum, a) => sum + (a.agreedCost || 0), 0);
    const totalPaidToVendors = assignments.reduce((sum, a) => sum + (a.paidAmount || 0), 0);

    res.json({
      success: true,
      data: assignments,
      summary: {
        totalVendorCost,
        totalPaidToVendors,
        pendingVendorPayments: totalVendorCost - totalPaidToVendors,
        count: assignments.length
      }
    });
  } catch (error) {
    next(error);
  }
};
/**
 * @desc    Get single vendor
 * @route   GET /api/vendors/:id
 */
exports.getVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vendor
 * @route   PUT /api/vendors/:id
 */
exports.updateVendor = async (req, res, next) => {
  try {
    const { name, type, email, phone, location, isActive } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (location !== undefined) updateData.location = location || null;
    if (isActive !== undefined) updateData.isActive = isActive !== false;

    const vendor = await prisma.vendor.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: updateData
    });
    if (vendor.count === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete vendor
 * @route   DELETE /api/vendors/:id
 */
exports.deleteVendor = async (req, res, next) => {
  try {
    const result = await prisma.vendor.deleteMany({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update trip vendor assignment
 * @route   PUT /api/vendors/trip-assign/:id
 */
exports.updateTripVendor = async (req, res, next) => {
  try {
    const assignment = await prisma.tripVendor.updateMany({
      where: { id: req.params.id, tenantId: req.user.tenantId },
      data: req.body
    });
    if (assignment.count === 0) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'Assignment updated' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove trip vendor assignment
 * @route   DELETE /api/vendors/trip-assign/:id
 */
exports.removeTripVendor = async (req, res, next) => {
  try {
    const result = await prisma.tripVendor.deleteMany({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Assignment not found' });
    res.json({ success: true, message: 'Assignment removed' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bulk trip vendor assignments
 * @route   GET /api/vendors/bulk
 */
exports.getBulkTripVendors = async (req, res, next) => {
  try {
    const { tripIds } = req.query;
    let where = { tenantId: req.user.tenantId };
    if (tripIds) {
      const ids = String(tripIds).split(',').filter(Boolean);
      where.tripId = { in: ids };
    }
    const assignments = await prisma.tripVendor.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: 'asc' }
    });

    const byTrip = {};
    assignments.forEach(a => {
      if (!byTrip[a.tripId]) byTrip[a.tripId] = [];
      byTrip[a.tripId].push(a);
    });

    res.json({
      success: true,
      data: byTrip
    });
  } catch (error) {
    next(error);
  }
};

// ── NEW: OPS VENDOR & RATES DIRECTORY DIRECT OPERATIONS ──

// Get all OpsVendors (with search, pagination and type filter)
exports.getOpsVendors = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const { type, city, active, search } = req.query;

    const where = { tenantId };
    if (type) where.type = type;
    if (city) where.location = { contains: String(city), mode: 'insensitive' };
    if (active !== undefined) where.isActive = active === 'true';
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { vendorCode: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const vendors = await prisma.opsVendor.findMany({
      where,
      include: {
        accommodationRates: true,
        transportRates: true,
        additionalCharges: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

// Get single OpsVendor
exports.getOpsVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.opsVendor.findFirst({
      where: { id: req.params.id, tenantId: req.user?.tenantId || 'default' },
      include: {
        accommodationRates: true,
        transportRates: true,
        additionalCharges: true
      }
    });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// Create OpsVendor
exports.createOpsVendor = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const { vendorName, vendorType, vendorCode, contactPerson, primaryPhone, alternatePhone, state, city, address, notes, totalRooms, roomTypes, sharingTypes, doubleRate, tripleRate, quadRate, roomCategories } = req.body;
    
    // Compute total rooms and room categories
    let computedTotalRooms = totalRooms ? parseInt(totalRooms) : 0;
    let computedRoomTypes = roomTypes || "";
    if (roomCategories && Array.isArray(roomCategories) && roomCategories.length > 0) {
      computedTotalRooms = 0;
      const categoryNames = [];
      roomCategories.forEach(cat => {
        const rCount = parseInt(cat.totalRoomsCount || 0);
        computedTotalRooms += rCount;
        if (cat.categoryName) {
          if (cat.flatRate) {
            categoryNames.push(`${cat.categoryName} (${rCount} Rms, Max ${cat.maxCapacity || 4} Pax)`);
          } else {
            categoryNames.push(`${cat.categoryName} (${rCount} Rms)`);
          }
        }
      });
      computedRoomTypes = categoryNames.join(", ");
    }

    const vendor = await prisma.opsVendor.create({
      data: {
        tenantId,
        name: vendorName,
        type: vendorType,
        vendorCode: vendorCode || null,
        contactPerson: contactPerson || null,
        phone: primaryPhone || null,
        alternatePhone: alternatePhone || null,
        state: state || null,
        location: city || null,
        address: address || null,
        notes: notes || null,
        isActive: true,
        totalRooms: computedTotalRooms || null,
        roomTypes: computedRoomTypes || null,
        sharingTypes: sharingTypes || null
      }
    });

    // Save individual room categories to OpsVendorHotelRate
    if (roomCategories && Array.isArray(roomCategories) && roomCategories.length > 0) {
      for (const cat of roomCategories) {
        await prisma.opsVendorHotelRate.create({
          data: {
            tenantId,
            vendorId: vendor.id,
            rateName: cat.categoryName || "Standard",
            rateType: cat.flatRate ? "FAMILY_ROOM" : "PER_ROOM_PER_NIGHT",
            doubleRate: parseFloat(cat.doubleRate || 0),
            tripleRate: parseFloat(cat.tripleRate || 0),
            quadRate: parseFloat(cat.quadRate || 0),
            singleRate: parseFloat(cat.totalRoomsCount || 0), 
            extraBedRate: 0, 
            childWithBed: 0, 
            childWithoutBed: parseFloat(cat.maxCapacity || 0), // person capacity
            mealPlanRate: parseFloat(cat.flatRate || 0), // family flat rate
            taxPercent: 0, 
            isActive: true
          }
        });
      }
    }

    // Automatically link to matching Trip based on location
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [
          { slug: city ? city.toLowerCase() : 'spiti-valley-road-trip' },
          { location: { contains: city || 'Shimla', mode: 'insensitive' } },
          { slug: 'spiti-valley-road-trip' }
        ]
      }
    });

    if (trip) {
      const tripVendor = await prisma.opsTripVendor.create({
        data: {
          tripId: trip.id,
          vendorId: vendor.id,
          category: vendor.type,
          active: true
        }
      });

      const addRate = async (sharing, amount) => {
        if (amount === undefined || amount === null) return;
        await prisma.opsTripVendorRate.create({
          data: {
            tripVendorId: tripVendor.id,
            city: city || null,
            rateType: 'HOTEL',
            roomType: computedRoomTypes || 'Standard',
            sharingType: sharing,
            amount: Number(amount),
            active: true
          }
        });
      };

      await addRate('DOUBLE', doubleRate || (roomCategories?.[0]?.doubleRate));
      await addRate('TRIPLE', tripleRate || (roomCategories?.[0]?.tripleRate));
      await addRate('QUAD', quadRate || (roomCategories?.[0]?.quadRate));
    }

    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// Update OpsVendor
exports.updateOpsVendor = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const { vendorName, vendorType, vendorCode, contactPerson, primaryPhone, alternatePhone, state, city, address, notes, active, totalRooms, roomTypes, sharingTypes, doubleRate, tripleRate, quadRate, roomCategories } = req.body;

    // Compute total rooms and room categories
    let computedTotalRooms = totalRooms !== undefined ? (totalRooms ? parseInt(totalRooms) : null) : undefined;
    let computedRoomTypes = roomTypes;
    if (roomCategories && Array.isArray(roomCategories) && roomCategories.length > 0) {
      computedTotalRooms = 0;
      const categoryNames = [];
      roomCategories.forEach(cat => {
        const rCount = parseInt(cat.totalRoomsCount || 0);
        computedTotalRooms += rCount;
        if (cat.categoryName) {
          if (cat.flatRate) {
            categoryNames.push(`${cat.categoryName} (${rCount} Rms, Max ${cat.maxCapacity || 4} Pax)`);
          } else {
            categoryNames.push(`${cat.categoryName} (${rCount} Rms)`);
          }
        }
      });
      computedRoomTypes = categoryNames.join(", ");
    }

    const vendor = await prisma.opsVendor.update({
      where: { id: req.params.id },
      data: {
        name: vendorName !== undefined ? vendorName : undefined,
        type: vendorType !== undefined ? vendorType : undefined,
        vendorCode: vendorCode !== undefined ? (vendorCode || null) : undefined,
        contactPerson: contactPerson !== undefined ? (contactPerson || null) : undefined,
        phone: primaryPhone !== undefined ? (primaryPhone || null) : undefined,
        alternatePhone: alternatePhone !== undefined ? (alternatePhone || null) : undefined,
        state: state !== undefined ? (state || null) : undefined,
        location: city !== undefined ? (city || null) : undefined,
        address: address !== undefined ? (address || null) : undefined,
        notes: notes !== undefined ? (notes || null) : undefined,
        isActive: active !== undefined ? active : undefined,
        totalRooms: computedTotalRooms !== undefined ? computedTotalRooms : undefined,
        roomTypes: computedRoomTypes !== undefined ? computedRoomTypes : undefined,
        sharingTypes: sharingTypes !== undefined ? (sharingTypes || null) : undefined
      }
    });

    // Save individual room categories to OpsVendorHotelRate
    if (roomCategories && Array.isArray(roomCategories) && roomCategories.length > 0) {
      // Clear old rate records
      await prisma.opsVendorHotelRate.deleteMany({ where: { vendorId: vendor.id } });
      
      for (const cat of roomCategories) {
        await prisma.opsVendorHotelRate.create({
          data: {
            tenantId,
            vendorId: vendor.id,
            rateName: cat.categoryName || "Standard",
            rateType: cat.flatRate ? "FAMILY_ROOM" : "PER_ROOM_PER_NIGHT",
            doubleRate: parseFloat(cat.doubleRate || 0),
            tripleRate: parseFloat(cat.tripleRate || 0),
            quadRate: parseFloat(cat.quadRate || 0),
            singleRate: parseFloat(cat.totalRoomsCount || 0), 
            extraBedRate: 0, 
            childWithBed: 0, 
            childWithoutBed: parseFloat(cat.maxCapacity || 0), // person capacity
            mealPlanRate: parseFloat(cat.flatRate || 0), // family flat rate
            taxPercent: 0, 
            isActive: true
          }
        });
      }
    }


    // Upsert associated trip vendor rates
    const tripVendor = await prisma.opsTripVendor.findFirst({
      where: { vendorId: vendor.id }
    });

    if (tripVendor) {
      const upsertRate = async (sharing, amount) => {
        if (amount === undefined || amount === null) return;
        const existingRate = await prisma.opsTripVendorRate.findFirst({
          where: { tripVendorId: tripVendor.id, sharingType: sharing }
        });
        if (existingRate) {
          await prisma.opsTripVendorRate.update({
            where: { id: existingRate.id },
            data: { amount: Number(amount), active: true }
          });
        } else {
          await prisma.opsTripVendorRate.create({
            data: {
              tripVendorId: tripVendor.id,
              city: city || vendor.location || null,
              rateType: 'HOTEL',
              roomType: computedRoomTypes || vendor.roomTypes || 'Standard',
              sharingType: sharing,
              amount: Number(amount),
              active: true
            }
          });
        }
      };

      await upsertRate('DOUBLE', doubleRate || (roomCategories?.[0]?.doubleRate));
      await upsertRate('TRIPLE', tripleRate || (roomCategories?.[0]?.tripleRate));
      await upsertRate('QUAD', quadRate || (roomCategories?.[0]?.quadRate));
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

// Activate OpsVendor and all its rates
exports.activateOpsVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.$transaction(async (tx) => {
      await tx.opsVendor.update({
        where: { id },
        data: { isActive: true }
      });
      await tx.opsAccommodationRate.updateMany({
        where: { vendorId: id },
        data: { active: true }
      });
      await tx.opsTransportRate.updateMany({
        where: { vendorId: id },
        data: { active: true }
      });
      await tx.opsVendorAdditionalCharge.updateMany({
        where: { vendorId: id },
        data: { active: true }
      });
    });
    res.json({ success: true, message: 'Vendor and rates activated successfully' });
  } catch (error) {
    next(error);
  }
};

// Delete OpsVendor
exports.deleteOpsVendor = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || 'default';
    const result = await prisma.opsVendor.deleteMany({
      where: { id: req.params.id, tenantId }
    });
    if (result.count === 0) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (error) {
    next(error);
  }
};

// Accommodation rates API
exports.getAccommodationRates = async (req, res, next) => {
  try {
    const { city, sharingType, seasonType } = req.query;
    const where = { active: true };
    if (city) where.city = String(city);
    if (sharingType) where.sharingType = sharingType;
    if (seasonType) where.seasonType = seasonType;

    const rates = await prisma.opsAccommodationRate.findMany({
      where,
      include: { vendor: true },
      orderBy: { amount: 'asc' }
    });
    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};

// Create Accommodation Rate
exports.createAccommodationRate = async (req, res, next) => {
  try {
    const { vendorId, propertyName, city, roomCategory, sharingType, rateBasis, amount, mealPlan, seasonType, validFrom, validTo, minimumOccupancy, maximumOccupancy, totalRooms, notes } = req.body;
    const rate = await prisma.opsAccommodationRate.create({
      data: {
        vendorId,
        propertyName,
        city,
        roomCategory,
        sharingType,
        rateBasis,
        amount: Number(amount),
        mealPlan: mealPlan || 'EP',
        seasonType: seasonType || 'STANDARD',
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        minimumOccupancy: minimumOccupancy !== undefined ? parseInt(minimumOccupancy) : 1,
        maximumOccupancy: maximumOccupancy !== undefined ? parseInt(maximumOccupancy) : 4,
        totalRooms: totalRooms !== undefined ? parseInt(totalRooms) : 0,
        notes: notes || null,
        active: true
      }
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// Transport rates API
exports.getTransportRates = async (req, res, next) => {
  try {
    const { tripCode, vehicleType } = req.query;
    const where = { active: true };
    if (tripCode) where.tripCode = String(tripCode);
    if (vehicleType) where.vehicleType = String(vehicleType);

    const rates = await prisma.opsTransportRate.findMany({
      where,
      include: { vendor: true },
      orderBy: { totalVehicleCost: 'asc' }
    });
    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};

// Create Transport Rate
exports.createTransportRate = async (req, res, next) => {
  try {
    const { vendorId, tripCode, routeName, pickupLocation, dropLocation, numberOfDays, seasonType, vehicleType, advertisedCapacity, sellableSeats, totalVehicleCost, driverAllowance, tollParkingIncluded, extraPickupCharge, validFrom, validTo, notes } = req.body;
    const rate = await prisma.opsTransportRate.create({
      data: {
        vendorId,
        tripCode,
        routeName,
        pickupLocation,
        dropLocation,
        numberOfDays: numberOfDays !== undefined ? parseInt(numberOfDays) : 1,
        seasonType,
        vehicleType,
        advertisedCapacity: advertisedCapacity !== undefined ? parseInt(advertisedCapacity) : 17,
        sellableSeats: sellableSeats !== undefined ? parseInt(sellableSeats) : 17,
        totalVehicleCost: Number(totalVehicleCost),
        driverAllowance: driverAllowance !== undefined ? Number(driverAllowance) : 0,
        tollParkingIncluded: tollParkingIncluded === true,
        extraPickupCharge: extraPickupCharge !== undefined ? Number(extraPickupCharge) : 0,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        notes: notes || null,
        active: true
      }
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// Additional charges API
exports.getAdditionalCharges = async (req, res, next) => {
  try {
    const { tripCode, city } = req.query;
    const where = { active: true };
    if (tripCode) where.tripCode = String(tripCode);
    if (city) where.city = String(city);

    const charges = await prisma.opsVendorAdditionalCharge.findMany({
      where,
      include: { vendor: true },
      orderBy: { amount: 'asc' }
    });
    res.json({ success: true, data: charges });
  } catch (error) {
    next(error);
  }
};

// Create Additional Charge
exports.createAdditionalCharge = async (req, res, next) => {
  try {
    const { vendorId, tripCode, chargeName, chargeCategory, rateBasis, amount, unit, city, conditions } = req.body;
    const charge = await prisma.opsVendorAdditionalCharge.create({
      data: {
        vendorId,
        tripCode,
        chargeName,
        chargeCategory,
        rateBasis,
        amount: Number(amount),
        unit,
        city,
        conditions: conditions || null,
        active: true
      }
    });
    res.status(201).json({ success: true, data: charge });
  } catch (error) {
    next(error);
  }
};

// ── DEPARTURE ALLOCATIONS PERSISTENCE ──
exports.saveDepartureAllocations = async (req, res, next) => {
  try {
    const { departureId } = req.params; // string representation tripId_YYYY-MM-DD
    const { allocations = [] } = req.body;

    await prisma.$transaction(async (tx) => {
      // Clear existing allocations for this departure
      await tx.opsDepartureVendorAllocation.deleteMany({ where: { departureId } });

      // Create new allocations
      for (const a of allocations) {
        await tx.opsDepartureVendorAllocation.create({
          data: {
            departureId,
            itineraryDayId: a.itineraryDayId || null,
            vendorId: a.vendorId,
            accommodationRateId: a.accommodationRateId || null,
            transportRateId: a.transportRateId || null,
            masterRate: a.masterRate !== undefined ? Number(a.masterRate) : null,
            negotiatedRate: a.negotiatedRate !== undefined ? Number(a.negotiatedRate) : null,
            finalBookedRate: a.finalBookedRate !== undefined ? Number(a.finalBookedRate) : null,
            quantity: a.quantity !== undefined ? parseInt(a.quantity) : 1,
            numberOfRooms: a.numberOfRooms !== undefined ? parseInt(a.numberOfRooms) : 0,
            numberOfGuests: a.numberOfGuests !== undefined ? parseInt(a.numberOfGuests) : 0,
            status: a.status || 'PLANNED',
            confirmationNumber: a.confirmationNumber || null,
            confirmedAt: a.confirmedAt ? new Date(a.confirmedAt) : null,
            notes: a.notes || null
          }
        });
      }
    });

    res.json({ success: true, message: 'Departure vendor allocations saved successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getDepartureAllocations = async (req, res, next) => {
  try {
    const { departureId } = req.params;
    const allocations = await prisma.opsDepartureVendorAllocation.findMany({
      where: { departureId },
      include: {
        vendor: true,
        accommodationRate: true,
        transportRate: true
      }
    });
    res.json({ success: true, data: allocations });
  } catch (error) {
    next(error);
  }
};

exports.getVendorsByTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { category, city, active } = req.query;
    
    const trip = await prisma.trip.findFirst({
      where: {
        OR: [
          { id: tripId },
          { slug: tripId }
        ]
      }
    });

    if (!trip) {
      return res.json({ success: true, data: [] });
    }

    const where = { tripId: trip.id };
    if (category) where.category = category;
    if (active !== undefined) where.active = active === 'true';
    if (city) {
      where.vendor = {
        location: { equals: city, mode: 'insensitive' }
      };
    }

    const tripVendors = await prisma.opsTripVendor.findMany({
      where,
      include: {
        vendor: true,
        rates: {
          where: active !== undefined ? { active: active === 'true' } : undefined
        }
      }
    });
    res.json({ success: true, data: tripVendors });
  } catch (error) {
    next(error);
  }
};

exports.getVendorsByTripAndCategory = async (req, res, next) => {
  try {
    const { tripId, category } = req.params;
    const tripVendors = await prisma.opsTripVendor.findMany({
      where: { tripId, category },
      include: {
        vendor: true,
        rates: true
      }
    });
    res.json({ success: true, data: tripVendors });
  } catch (error) {
    next(error);
  }
};

exports.getVendorsByTripAndCity = async (req, res, next) => {
  try {
    const { tripId, city } = req.params;
    const tripVendors = await prisma.opsTripVendor.findMany({
      where: {
        tripId,
        vendor: {
          location: { equals: city, mode: 'insensitive' }
        }
      },
      include: {
        vendor: true,
        rates: true
      }
    });
    res.json({ success: true, data: tripVendors });
  } catch (error) {
    next(error);
  }
};

exports.getTripVendorRates = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const rates = await prisma.opsTripVendorRate.findMany({
      where: {
        tripVendor: { tripId }
      },
      include: {
        tripVendor: {
          include: { vendor: true }
        }
      }
    });
    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};

exports.createTripVendorMapping = async (req, res, next) => {
  try {
    const { tripId, vendorId, category, preferred, priority, notes } = req.body;
    const mapping = await prisma.opsTripVendor.create({
      data: {
        tripId,
        vendorId,
        category: category || 'HOTEL',
        preferred: preferred || false,
        priority: priority || 0,
        active: true,
        notes
      }
    });
    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    next(error);
  }
};

exports.createTripVendorRate = async (req, res, next) => {
  try {
    const { tripVendorId, city, rateType, roomType, sharingType, vehicleType, routeName, rateBasis, amount, seasonType, validFrom, validTo, minimumOccupancy, maximumOccupancy, sellableSeats, numberOfDays, active, notes } = req.body;
    const rate = await prisma.opsTripVendorRate.create({
      data: {
        tripVendorId,
        city,
        rateType,
        roomType,
        sharingType,
        vehicleType,
        routeName,
        rateBasis,
        amount: Number(amount || 0),
        seasonType: seasonType || 'STANDARD',
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        minimumOccupancy: minimumOccupancy !== undefined ? Number(minimumOccupancy) : 1,
        maximumOccupancy: maximumOccupancy !== undefined ? Number(maximumOccupancy) : 4,
        sellableSeats: sellableSeats !== undefined ? Number(sellableSeats) : 17,
        numberOfDays: numberOfDays !== undefined ? Number(numberOfDays) : 1,
        active: active !== undefined ? active : true,
        notes
      }
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.updateTripVendorRate = async (req, res, next) => {
  try {
    const { rateId } = req.params;
    const rate = await prisma.opsTripVendorRate.update({
      where: { id: rateId },
      data: {
        ...req.body,
        amount: req.body.amount !== undefined ? Number(req.body.amount) : undefined,
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : undefined,
        validTo: req.body.validTo ? new Date(req.body.validTo) : undefined
      }
    });
    res.json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};
