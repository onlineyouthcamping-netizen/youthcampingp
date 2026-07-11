const { prisma } = require('../lib/prisma');

const crypto = require('crypto');
const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function generateDraftId() {
  const bytes = crypto.randomBytes(5);
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `PKG-${id}`;
}

function generateQuoteNumber() {
  const bytes = crypto.randomBytes(5);
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `Q-2026-${id}`;
}

function calculateRoomAllocation(adults = 0, couples = 0, children = 0) {
  const coupleRooms = couples;
  let remainingAdults = Math.max(0, adults - couples * 2);
  let triples = 0;
  let doubles = 0;
  while (remainingAdults > 0) {
    if (remainingAdults >= 3) {
      triples++;
      remainingAdults -= 3;
    } else if (remainingAdults === 2) {
      doubles++;
      remainingAdults -= 2;
    } else {
      doubles++;
      remainingAdults -= 1;
    }
  }
  let childRooms = 0;
  let remainingChildren = children;
  while (remainingChildren > 0) {
    childRooms++;
    remainingChildren -= Math.min(remainingChildren, 3);
  }
  const totalRooms = coupleRooms + triples + doubles + childRooms;
  return {
    totalRooms,
    coupleRooms,
    tripleRooms: triples,
    doubleRooms: doubles,
    childRooms
  };
}

async function logPackageActivity(draftId, action, details, actorId, beforeData = null, afterData = null) {
  try {
    if (!draftId) return;
    const draft = await prisma.packageDraft.findUnique({ where: { id: draftId }, select: { tenantId: true } });
    if (!draft) return;
    await prisma.packageActivityLog.create({
      data: {
        tenantId: draft.tenantId,
        draftId,
        action,
        details,
        actorId,
        beforeData: beforeData || undefined,
        afterData: afterData || undefined
      }
    });
  } catch (error) {
    console.error('[PackageActivityLog] Error recording log:', error.message);
  }
}

function safeAmount(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function buildPagination(req) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse(data, total, page, limit) {
  return {
    success: true,
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
}

function getTenantWhere(req) {
  return { tenantId: req.user?.tenantId || 'default' };
}

function isSuperAdminOrAdmin(role) {
  return ['superadmin', 'admin'].includes(role);
}

function canAccessDraft(role) {
  return isSuperAdminOrAdmin(role);
}

// ──────────────────────────────────────────────
// STATES
// ──────────────────────────────────────────────

exports.getStates = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    const [total, data] = await Promise.all([
      prisma.packageState.count({ where }),
      prisma.packageState.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.createState = async (req, res, next) => {
  try {
    const { name, isActive } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'State name is required' });
    }
    const existing = await prisma.packageState.findUnique({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'State with this name already exists' });
    }
    const state = await prisma.packageState.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        name: name.trim(),
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json({ success: true, data: state });
  } catch (error) {
    next(error);
  }
};

exports.updateState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    const existing = await prisma.packageState.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.packageState.findUnique({ where: { name: name.trim() } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'State with this name already exists' });
      }
    }
    const state = await prisma.packageState.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.json({ success: true, data: state });
  } catch (error) {
    next(error);
  }
};

exports.deleteState = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageState.findFirst({
      where: { id, ...getTenantWhere(req) },
      include: { cities: { take: 1 } }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    if (existing.cities.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete state with existing cities. Remove all cities first.' });
    }
    await prisma.packageState.delete({ where: { id } });
    res.json({ success: true, message: 'State deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// CITIES
// ──────────────────────────────────────────────

exports.getCities = async (req, res, next) => {
  try {
    const { stateId, search, status } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };
    if (stateId) where.stateId = stateId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    const [total, data] = await Promise.all([
      prisma.packageCity.count({ where }),
      prisma.packageCity.findMany({
        where,
        include: {
          state: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.createCity = async (req, res, next) => {
  try {
    const { stateId, name, isActive } = req.body;
    if (!stateId || !name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'stateId and name are required' });
    }
    const state = await prisma.packageState.findFirst({
      where: { id: stateId, ...getTenantWhere(req) }
    });
    if (!state) {
      return res.status(404).json({ success: false, message: 'State not found' });
    }
    const city = await prisma.packageCity.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        stateId,
        name: name.trim(),
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
};

exports.updateCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stateId, name, isActive } = req.body;
    const existing = await prisma.packageCity.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    if (stateId) {
      const state = await prisma.packageState.findFirst({
        where: { id: stateId, ...getTenantWhere(req) }
      });
      if (!state) {
        return res.status(404).json({ success: false, message: 'State not found' });
      }
    }
    const city = await prisma.packageCity.update({
      where: { id },
      data: {
        ...(stateId !== undefined && { stateId }),
        ...(name !== undefined && { name: name.trim() }),
        ...(isActive !== undefined && { isActive })
      }
    });
    res.json({ success: true, data: city });
  } catch (error) {
    next(error);
  }
};

exports.deleteCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageCity.findFirst({
      where: { id, ...getTenantWhere(req) },
      include: {
        hotels: { take: 1 },
        vehicles: { take: 1 }
      }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    if (existing.hotels.length > 0 || existing.vehicles.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete city with existing hotels or vehicles. Remove them first.' });
    }
    await prisma.packageCity.delete({ where: { id } });
    res.json({ success: true, message: 'City deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// HOTELS
// ──────────────────────────────────────────────

exports.getHotels = async (req, res, next) => {
  try {
    const { cityId, stateId, category, search, status } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };
    if (cityId) where.cityId = cityId;
    if (category) where.category = category;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (stateId) {
      where.city = { stateId };
    }
    const [total, data] = await Promise.all([
      prisma.packageHotel.count({ where }),
      prisma.packageHotel.findMany({
        where,
        include: {
          city: { select: { id: true, name: true, stateId: true, state: { select: { id: true, name: true } } } },
          vendor: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.createHotel = async (req, res, next) => {
  try {
    const { cityId, name, category, roomType, maxPeoplePerRoom, mealPlan, basePrice, weekendPrice, peakSeasonPrice, extraMattressPrice, extraAdultPrice, childWithBedPrice, childWithoutBedPrice, images, vendorId, contactName, contactPhone, isActive } = req.body;
    if (!cityId || !name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'cityId and name are required' });
    }
    const city = await prisma.packageCity.findFirst({
      where: { id: cityId, ...getTenantWhere(req) }
    });
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    if (vendorId) {
      const vendor = await prisma.packageVendor.findFirst({
        where: { id: vendorId, ...getTenantWhere(req) }
      });
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
    }
    const hotel = await prisma.packageHotel.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        cityId,
        name: name.trim(),
        category: category || 'Standard',
        roomType: roomType || 'Standard',
        maxPeoplePerRoom: maxPeoplePerRoom || 2,
        mealPlan: mealPlan || 'EP',
        basePrice: safeAmount(basePrice),
        weekendPrice: safeAmount(weekendPrice, null),
        peakSeasonPrice: safeAmount(peakSeasonPrice, null),
        extraMattressPrice: safeAmount(extraMattressPrice, null),
        extraAdultPrice: safeAmount(extraAdultPrice, null),
        childWithBedPrice: safeAmount(childWithBedPrice, null),
        childWithoutBedPrice: safeAmount(childWithoutBedPrice, null),
        images: images || [],
        vendorId: vendorId || null,
        contactName,
        contactPhone,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

exports.updateHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageHotel.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    const { cityId, name, category, roomType, maxPeoplePerRoom, mealPlan, basePrice, weekendPrice, peakSeasonPrice, extraMattressPrice, extraAdultPrice, childWithBedPrice, childWithoutBedPrice, images, vendorId, contactName, contactPhone, isActive } = req.body;
    const data = {};
    if (cityId !== undefined) {
      const city = await prisma.packageCity.findFirst({
        where: { id: cityId, ...getTenantWhere(req) }
      });
      if (!city) return res.status(404).json({ success: false, message: 'City not found' });
      data.cityId = cityId;
    }
    if (name !== undefined) data.name = name.trim();
    if (category !== undefined) data.category = category;
    if (roomType !== undefined) data.roomType = roomType;
    if (maxPeoplePerRoom !== undefined) data.maxPeoplePerRoom = maxPeoplePerRoom;
    if (mealPlan !== undefined) data.mealPlan = mealPlan;
    if (basePrice !== undefined) data.basePrice = safeAmount(basePrice);
    if (weekendPrice !== undefined) data.weekendPrice = safeAmount(weekendPrice, null);
    if (peakSeasonPrice !== undefined) data.peakSeasonPrice = safeAmount(peakSeasonPrice, null);
    if (extraMattressPrice !== undefined) data.extraMattressPrice = safeAmount(extraMattressPrice, null);
    if (extraAdultPrice !== undefined) data.extraAdultPrice = safeAmount(extraAdultPrice, null);
    if (childWithBedPrice !== undefined) data.childWithBedPrice = safeAmount(childWithBedPrice, null);
    if (childWithoutBedPrice !== undefined) data.childWithoutBedPrice = safeAmount(childWithoutBedPrice, null);
    if (images !== undefined) data.images = images;
    if (vendorId !== undefined) {
      if (vendorId) {
        const vendor = await prisma.packageVendor.findFirst({ where: { id: vendorId, ...getTenantWhere(req) } });
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
      data.vendorId = vendorId || null;
    }
    if (contactName !== undefined) data.contactName = contactName;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;
    if (isActive !== undefined) data.isActive = isActive;
    const hotel = await prisma.packageHotel.update({
      where: { id },
      data
    });
    res.json({ success: true, data: hotel });
  } catch (error) {
    next(error);
  }
};

exports.deleteHotel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageHotel.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    await prisma.packageHotel.delete({ where: { id } });
    res.json({ success: true, message: 'Hotel deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// HOTEL TARIFFS
// ──────────────────────────────────────────────

exports.getHotelTariffs = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const hotel = await prisma.packageHotel.findFirst({
      where: { id: hotelId, ...getTenantWhere(req) }
    });
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    const tariffs = await prisma.packageHotelTariff.findMany({
      where: { hotelId },
      orderBy: { startDate: 'asc' }
    });
    res.json({ success: true, data: tariffs });
  } catch (error) {
    next(error);
  }
};

exports.createHotelTariff = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate, roomRate, label } = req.body;
    const hotel = await prisma.packageHotel.findFirst({
      where: { id: hotelId, ...getTenantWhere(req) }
    });
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }
    if (end < start) {
      return res.status(400).json({ success: false, message: 'endDate must be after startDate' });
    }
    const tariff = await prisma.packageHotelTariff.create({
      data: {
        hotelId,
        startDate: start,
        endDate: end,
        roomRate: safeAmount(roomRate),
        label: label || null
      }
    });
    res.status(201).json({ success: true, data: tariff });
  } catch (error) {
    next(error);
  }
};

exports.deleteHotelTariff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tariff = await prisma.packageHotelTariff.findUnique({ where: { id } });
    if (!tariff) {
      return res.status(404).json({ success: false, message: 'Tariff not found' });
    }
    const hotel = await prisma.packageHotel.findFirst({
      where: { id: tariff.hotelId, ...getTenantWhere(req) }
    });
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    await prisma.packageHotelTariff.delete({ where: { id } });
    res.json({ success: true, message: 'Tariff deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// VEHICLES
// ──────────────────────────────────────────────

exports.getVehicles = async (req, res, next) => {
  try {
    const { cityId, isAc, search, status } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };
    if (cityId) where.cityId = cityId;
    if (isAc !== undefined) where.isAc = isAc === 'true';
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [total, data] = await Promise.all([
      prisma.packageVehicle.count({ where }),
      prisma.packageVehicle.findMany({
        where,
        include: {
          city: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.createVehicle = async (req, res, next) => {
  try {
    const { cityId, name, seatingCapacity, isAc, image, vendorId, isActive } = req.body;
    if (!cityId || !name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'cityId and name are required' });
    }
    const city = await prisma.packageCity.findFirst({
      where: { id: cityId, ...getTenantWhere(req) }
    });
    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found' });
    }
    if (vendorId) {
      const vendor = await prisma.packageVendor.findFirst({
        where: { id: vendorId, ...getTenantWhere(req) }
      });
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    const vehicle = await prisma.packageVehicle.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        cityId,
        name: name.trim(),
        seatingCapacity: seatingCapacity || 4,
        isAc: isAc !== undefined ? isAc : true,
        image,
        vendorId: vendorId || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageVehicle.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    const { cityId, name, seatingCapacity, isAc, image, vendorId, isActive } = req.body;
    const data = {};
    if (cityId !== undefined) {
      const city = await prisma.packageCity.findFirst({ where: { id: cityId, ...getTenantWhere(req) } });
      if (!city) return res.status(404).json({ success: false, message: 'City not found' });
      data.cityId = cityId;
    }
    if (name !== undefined) data.name = name.trim();
    if (seatingCapacity !== undefined) data.seatingCapacity = seatingCapacity;
    if (isAc !== undefined) data.isAc = isAc;
    if (image !== undefined) data.image = image;
    if (vendorId !== undefined) {
      if (vendorId) {
        const vendor = await prisma.packageVendor.findFirst({ where: { id: vendorId, ...getTenantWhere(req) } });
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
      data.vendorId = vendorId || null;
    }
    if (isActive !== undefined) data.isActive = isActive;
    const vehicle = await prisma.packageVehicle.update({ where: { id }, data });
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageVehicle.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    await prisma.packageVehicle.delete({ where: { id } });
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// VEHICLE TARIFFS
// ──────────────────────────────────────────────

exports.getVehicleTariffs = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const vehicle = await prisma.packageVehicle.findFirst({
      where: { id: vehicleId, ...getTenantWhere(req) }
    });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    const tariffs = await prisma.packageVehicleTariff.findMany({
      where: { vehicleId },
      orderBy: { priceType: 'asc' }
    });
    res.json({ success: true, data: tariffs });
  } catch (error) {
    next(error);
  }
};

exports.createVehicleTariff = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;
    const { priceType, perDayRate, perKmRate, fixedRouteRate, minKmPerDay, driverAllowance, fuelIncluded, tollParkingIncluded, notes } = req.body;
    const vehicle = await prisma.packageVehicle.findFirst({
      where: { id: vehicleId, ...getTenantWhere(req) }
    });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    const validPriceTypes = ['PER_DAY', 'PER_KM', 'FIXED_ROUTE', 'AIRPORT', 'RAILWAY'];
    if (!priceType || !validPriceTypes.includes(priceType)) {
      return res.status(400).json({ success: false, message: `Invalid priceType. Must be one of: ${validPriceTypes.join(', ')}` });
    }
    const tariff = await prisma.packageVehicleTariff.create({
      data: {
        vehicleId,
        priceType,
        perDayRate: safeAmount(perDayRate, null),
        perKmRate: safeAmount(perKmRate, null),
        fixedRouteRate: safeAmount(fixedRouteRate, null),
        minKmPerDay: minKmPerDay || 0,
        driverAllowance: safeAmount(driverAllowance, null),
        fuelIncluded: fuelIncluded !== undefined ? fuelIncluded : true,
        tollParkingIncluded: tollParkingIncluded !== undefined ? tollParkingIncluded : false,
        notes: notes || null
      }
    });
    res.status(201).json({ success: true, data: tariff });
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicleTariff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tariff = await prisma.packageVehicleTariff.findUnique({ where: { id } });
    if (!tariff) {
      return res.status(404).json({ success: false, message: 'Tariff not found' });
    }
    const vehicle = await prisma.packageVehicle.findFirst({
      where: { id: tariff.vehicleId, ...getTenantWhere(req) }
    });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    await prisma.packageVehicleTariff.delete({ where: { id } });
    res.json({ success: true, message: 'Tariff deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// TRANSFER ROUTES
// ──────────────────────────────────────────────

exports.getTransferRoutes = async (req, res, next) => {
  try {
    const { fromCityId, toCityId, search, status } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };
    if (fromCityId) where.fromCityId = fromCityId;
    if (toCityId) where.toCityId = toCityId;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search) {
      where.OR = [
        { fromCity: { name: { contains: search, mode: 'insensitive' } } },
        { toCity: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    const [total, data] = await Promise.all([
      prisma.packageTransferRoute.count({ where }),
      prisma.packageTransferRoute.findMany({
        where,
        include: {
          fromCity: { select: { id: true, name: true } },
          toCity: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: [{ fromCity: { name: 'asc' } }, { toCity: { name: 'asc' } }]
      })
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.createTransferRoute = async (req, res, next) => {
  try {
    const { fromCityId, toCityId, distanceKm, travelTimeMins, suggestedVehicle, fixedRate, perKmRate, pickupDropNotes, isActive } = req.body;
    if (!fromCityId || !toCityId) {
      return res.status(400).json({ success: false, message: 'fromCityId and toCityId are required' });
    }
    const fromCity = await prisma.packageCity.findFirst({ where: { id: fromCityId, ...getTenantWhere(req) } });
    if (!fromCity) return res.status(404).json({ success: false, message: 'From city not found' });
    const toCity = await prisma.packageCity.findFirst({ where: { id: toCityId, ...getTenantWhere(req) } });
    if (!toCity) return res.status(404).json({ success: false, message: 'To city not found' });
    const route = await prisma.packageTransferRoute.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        fromCityId,
        toCityId,
        distanceKm: safeAmount(distanceKm, null),
        travelTimeMins: travelTimeMins || null,
        suggestedVehicle,
        fixedRate: safeAmount(fixedRate, null),
        perKmRate: safeAmount(perKmRate, null),
        pickupDropNotes,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

exports.updateTransferRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageTransferRoute.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transfer route not found' });
    }
    const { fromCityId, toCityId, distanceKm, travelTimeMins, suggestedVehicle, fixedRate, perKmRate, pickupDropNotes, isActive } = req.body;
    const data = {};
    if (fromCityId !== undefined) {
      const city = await prisma.packageCity.findFirst({ where: { id: fromCityId, ...getTenantWhere(req) } });
      if (!city) return res.status(404).json({ success: false, message: 'From city not found' });
      data.fromCityId = fromCityId;
    }
    if (toCityId !== undefined) {
      const city = await prisma.packageCity.findFirst({ where: { id: toCityId, ...getTenantWhere(req) } });
      if (!city) return res.status(404).json({ success: false, message: 'To city not found' });
      data.toCityId = toCityId;
    }
    if (distanceKm !== undefined) data.distanceKm = safeAmount(distanceKm, null);
    if (travelTimeMins !== undefined) data.travelTimeMins = travelTimeMins;
    if (suggestedVehicle !== undefined) data.suggestedVehicle = suggestedVehicle;
    if (fixedRate !== undefined) data.fixedRate = safeAmount(fixedRate, null);
    if (perKmRate !== undefined) data.perKmRate = safeAmount(perKmRate, null);
    if (pickupDropNotes !== undefined) data.pickupDropNotes = pickupDropNotes;
    if (isActive !== undefined) data.isActive = isActive;
    const route = await prisma.packageTransferRoute.update({ where: { id }, data });
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

exports.deleteTransferRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageTransferRoute.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Transfer route not found' });
    }
    await prisma.packageTransferRoute.delete({ where: { id } });
    res.json({ success: true, message: 'Transfer route deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// ACTIVITIES
// ──────────────────────────────────────────────

exports.getActivities = async (req, res, next) => {
  try {
    const { cityId, search, status } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };
    if (cityId) where.cityId = cityId;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [total, data] = await Promise.all([
      prisma.packageActivity.count({ where }),
      prisma.packageActivity.findMany({
        where,
        include: {
          city: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.createActivity = async (req, res, next) => {
  try {
    const { cityId, name, adultRate, childRate, isShared, duration, description, includedItems, excludedItems, image, vendorId, isActive } = req.body;
    if (!cityId || !name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'cityId and name are required' });
    }
    const city = await prisma.packageCity.findFirst({ where: { id: cityId, ...getTenantWhere(req) } });
    if (!city) return res.status(404).json({ success: false, message: 'City not found' });
    if (vendorId) {
      const vendor = await prisma.packageVendor.findFirst({ where: { id: vendorId, ...getTenantWhere(req) } });
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    const activity = await prisma.packageActivity.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        cityId,
        name: name.trim(),
        adultRate: safeAmount(adultRate),
        childRate: safeAmount(childRate),
        isShared: isShared !== undefined ? isShared : true,
        duration,
        description,
        includedItems,
        excludedItems,
        image,
        vendorId: vendorId || null,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

exports.updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageActivity.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    const { cityId, name, adultRate, childRate, isShared, duration, description, includedItems, excludedItems, image, vendorId, isActive } = req.body;
    const data = {};
    if (cityId !== undefined) {
      const city = await prisma.packageCity.findFirst({ where: { id: cityId, ...getTenantWhere(req) } });
      if (!city) return res.status(404).json({ success: false, message: 'City not found' });
      data.cityId = cityId;
    }
    if (name !== undefined) data.name = name.trim();
    if (adultRate !== undefined) data.adultRate = safeAmount(adultRate);
    if (childRate !== undefined) data.childRate = safeAmount(childRate);
    if (isShared !== undefined) data.isShared = isShared;
    if (duration !== undefined) data.duration = duration;
    if (description !== undefined) data.description = description;
    if (includedItems !== undefined) data.includedItems = includedItems;
    if (excludedItems !== undefined) data.excludedItems = excludedItems;
    if (image !== undefined) data.image = image;
    if (vendorId !== undefined) {
      if (vendorId) {
        const vendor = await prisma.packageVendor.findFirst({ where: { id: vendorId, ...getTenantWhere(req) } });
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
      data.vendorId = vendorId || null;
    }
    if (isActive !== undefined) data.isActive = isActive;
    const activity = await prisma.packageActivity.update({ where: { id }, data });
    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

exports.deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageActivity.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }
    await prisma.packageActivity.delete({ where: { id } });
    res.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// MEAL PLANS
// ──────────────────────────────────────────────

exports.getMealPlans = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    const [total, data] = await Promise.all([
      prisma.packageMealPlan.count({ where }),
      prisma.packageMealPlan.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true } }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.createMealPlan = async (req, res, next) => {
  try {
    const { vendorId, name, breakfastCost, lunchCost, dinnerCost, perPersonPerDay, description, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    if (vendorId) {
      const vendor = await prisma.packageVendor.findFirst({ where: { id: vendorId, ...getTenantWhere(req) } });
      if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    const meal = await prisma.packageMealPlan.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        vendorId: vendorId || null,
        name: name.trim(),
        breakfastCost: safeAmount(breakfastCost, null),
        lunchCost: safeAmount(lunchCost, null),
        dinnerCost: safeAmount(dinnerCost, null),
        perPersonPerDay: safeAmount(perPersonPerDay, null),
        description,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    next(error);
  }
};

exports.updateMealPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageMealPlan.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Meal plan not found' });
    }
    const { vendorId, name, breakfastCost, lunchCost, dinnerCost, perPersonPerDay, description, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (vendorId !== undefined) {
      if (vendorId) {
        const vendor = await prisma.packageVendor.findFirst({ where: { id: vendorId, ...getTenantWhere(req) } });
        if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
      data.vendorId = vendorId || null;
    }
    if (breakfastCost !== undefined) data.breakfastCost = safeAmount(breakfastCost, null);
    if (lunchCost !== undefined) data.lunchCost = safeAmount(lunchCost, null);
    if (dinnerCost !== undefined) data.dinnerCost = safeAmount(dinnerCost, null);
    if (perPersonPerDay !== undefined) data.perPersonPerDay = safeAmount(perPersonPerDay, null);
    if (description !== undefined) data.description = description;
    if (isActive !== undefined) data.isActive = isActive;
    const meal = await prisma.packageMealPlan.update({ where: { id }, data });
    res.json({ success: true, data: meal });
  } catch (error) {
    next(error);
  }
};

exports.deleteMealPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageMealPlan.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Meal plan not found' });
    }
    await prisma.packageMealPlan.delete({ where: { id } });
    res.json({ success: true, message: 'Meal plan deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PACKAGE VENDORS
// ──────────────────────────────────────────────

exports.getPackageVendors = async (req, res, next) => {
  try {
    const { type, search, status } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };
    if (type) where.type = type;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    const [total, data] = await Promise.all([
      prisma.packageVendor.count({ where }),
      prisma.packageVendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      })
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.createPackageVendor = async (req, res, next) => {
  try {
    const { name, type, contactPerson, email, phone, location, gstNumber, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }
    const validTypes = ['HOTEL', 'VEHICLE', 'ACTIVITY', 'MEALS', 'GUIDE', 'OTHER'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }
    const vendor = await prisma.packageVendor.create({
      data: {
        tenantId: req.user.tenantId || 'default',
        name: name.trim(),
        type: type || 'OTHER',
        contactPerson,
        email,
        phone,
        location,
        gstNumber,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

exports.updatePackageVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageVendor.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    const { name, type, contactPerson, email, phone, location, gstNumber, isActive } = req.body;
    const validTypes = ['HOTEL', 'VEHICLE', 'ACTIVITY', 'MEALS', 'GUIDE', 'OTHER'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (type !== undefined) data.type = type;
    if (contactPerson !== undefined) data.contactPerson = contactPerson;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (location !== undefined) data.location = location;
    if (gstNumber !== undefined) data.gstNumber = gstNumber;
    if (isActive !== undefined) data.isActive = isActive;
    const vendor = await prisma.packageVendor.update({ where: { id }, data });
    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

exports.deletePackageVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.packageVendor.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }
    await prisma.packageVendor.delete({ where: { id } });
    res.json({ success: true, message: 'Vendor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// MASTER DASHBOARD STATS
// ──────────────────────────────────────────────

exports.getMasterDashboardStats = async (req, res, next) => {
  try {
    const where = { ...getTenantWhere(req) };
    const [states, cities, hotels, vehicles, activities, transfers, vendors, mealPlans] = await Promise.all([
      prisma.packageState.count({ where }),
      prisma.packageCity.count({ where }),
      prisma.packageHotel.count({ where }),
      prisma.packageVehicle.count({ where }),
      prisma.packageActivity.count({ where }),
      prisma.packageTransferRoute.count({ where }),
      prisma.packageVendor.count({ where }),
      prisma.packageMealPlan.count({ where })
    ]);
    res.json({
      success: true,
      data: {
        states,
        cities,
        hotels,
        vehicles,
        activities,
        transfers: transfers,
        vendors,
        mealPlans
      }
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PACKAGE DRAFTS
// ──────────────────────────────────────────────

exports.createPackageDraft = async (req, res, next) => {
  try {
    const user = req.user;
    const tenantId = user.tenantId || 'default';
    const {
      customerName, customerPhone, customerEmail, customerAddress,
      packageName, stateId, departureCity,
      travelStartDate, travelEndDate, totalNights, totalDays,
      adults, children, couples, specialNotes, inclusions, exclusions, terms
    } = req.body;

    const roomAllocation = calculateRoomAllocation(
      safeAmount(adults, 0),
      safeAmount(couples, 0),
      safeAmount(children, 0)
    );

    const draftId = generateDraftId();

    const draft = await prisma.packageDraft.create({
      data: {
        tenantId,
        draftId,
        status: 'draft',
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
        packageName,
        stateId,
        departureCity,
        travelStartDate: travelStartDate ? new Date(travelStartDate) : null,
        travelEndDate: travelEndDate ? new Date(travelEndDate) : null,
        totalNights: safeAmount(totalNights, 0),
        totalDays: safeAmount(totalDays, 0),
        adults: safeAmount(adults, 0),
        children: safeAmount(children, 0),
        couples: safeAmount(couples, 0),
        totalRooms: roomAllocation.totalRooms,
        roomConfig: roomAllocation,
        specialNotes,
        inclusions,
        exclusions,
        terms,
        hotelCost: 0,
        vehicleCost: 0,
        transferCost: 0,
        activityCost: 0,
        mealCost: 0,
        guideCost: 0,
        trainCost: 0,
        flightCost: 0,
        miscCost: 0,
        subtotal: 0,
        discount: 0,
        gstRate: 5,
        gstAmount: 0,
        serviceCharge: 0,
        totalAmount: 0,
        vendorHotelCost: 0,
        vendorVehicleCost: 0,
        vendorActivityCost: 0,
        vendorMealCost: 0,
        vendorGuideCost: 0,
        estimatedMargin: 0,
        salesAdminId: user.role === 'sales' ? user.id : null,
        createdById: user.id,
        updatedById: user.id
      }
    });

    await logPackageActivity(draft.id, 'CREATE', `Package draft ${draftId} created`, user.id);

    res.status(201).json({ success: true, data: draft });
  } catch (error) {
    next(error);
  }
};

exports.getPackageDrafts = async (req, res, next) => {
  try {
    const user = req.user;
    const { status, search } = req.query;
    const { page, limit, skip } = buildPagination(req);
    const where = { ...getTenantWhere(req) };

    if (user.role === 'sales') {
      where.salesAdminId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { packageName: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { draftId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [total, data] = await Promise.all([
      prisma.packageDraft.count({ where }),
      prisma.packageDraft.findMany({
        where,
        select: {
          id: true,
          draftId: true,
          status: true,
          packageName: true,
          customerName: true,
          customerPhone: true,
          customerEmail: true,
          totalDays: true,
          totalNights: true,
          adults: true,
          children: true,
          couples: true,
          totalRooms: true,
          totalAmount: true,
          quoteNumber: true,
          travelStartDate: true,
          travelEndDate: true,
          salesAdminId: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          salesAdmin: { select: { id: true, name: true } },
          _count: { select: { itineraryDays: true } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    next(error);
  }
};

exports.getPackageDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const draft = await prisma.packageDraft.findFirst({
      where: { id, ...getTenantWhere(req) },
      include: {
        itineraryDays: {
          orderBy: { dayNumber: 'asc' },
          include: {
            stayCity: { select: { id: true, name: true } },
            items: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        },
        salesAdmin: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } }
      }
    });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (user.role === 'sales' && draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    res.json({ success: true, data: draft });
  } catch (error) {
    next(error);
  }
};

exports.updatePackageDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const existing = await prisma.packageDraft.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (user.role === 'sales' && existing.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    const beforeData = { ...existing };
    const {
      customerName, customerPhone, customerEmail, customerAddress,
      packageName, stateId, departureCity,
      travelStartDate, travelEndDate, totalNights, totalDays,
      adults, children, couples, specialNotes, inclusions, exclusions, terms,
      gstRate, serviceCharge, discount, discountType,
      quoteValidity, paymentTerms
    } = req.body;

    const data = {};
    if (customerName !== undefined) data.customerName = customerName;
    if (customerPhone !== undefined) data.customerPhone = customerPhone;
    if (customerEmail !== undefined) data.customerEmail = customerEmail;
    if (customerAddress !== undefined) data.customerAddress = customerAddress;
    if (packageName !== undefined) data.packageName = packageName;
    if (stateId !== undefined) data.stateId = stateId;
    if (departureCity !== undefined) data.departureCity = departureCity;
    if (travelStartDate !== undefined) data.travelStartDate = new Date(travelStartDate);
    if (travelEndDate !== undefined) data.travelEndDate = new Date(travelEndDate);
    if (totalNights !== undefined) data.totalNights = safeAmount(totalNights, 0);
    if (totalDays !== undefined) data.totalDays = safeAmount(totalDays, 0);
    if (adults !== undefined || children !== undefined || couples !== undefined) {
      const a = safeAmount(adults !== undefined ? adults : existing.adults, 0);
      const c = safeAmount(children !== undefined ? children : existing.children, 0);
      const co = safeAmount(couples !== undefined ? couples : existing.couples, 0);

      // Check capacity of existing vehicle items in draft
      const newTotalPax = a + c;
      const vehicleItems = await prisma.packageItineraryItem.findMany({
        where: {
          day: { draftId: id },
          serviceType: 'VEHICLE',
          serviceId: { not: null }
        }
      });
      for (const item of vehicleItems) {
        const vehicle = await prisma.packageVehicle.findUnique({
          where: { id: item.serviceId }
        });
        if (vehicle) {
          const totalCapacity = vehicle.seatingCapacity * (item.quantity || 1);
          if (newTotalPax > totalCapacity) {
            return res.status(400).json({
              success: false,
              message: `Updating travelers to ${newTotalPax} exceeds seating capacity of selected vehicle ${vehicle.name} (${totalCapacity} pax)`
            });
          }
        }
      }

      const roomAllocation = calculateRoomAllocation(a, co, c);
      if (adults !== undefined) data.adults = a;
      if (children !== undefined) data.children = c;
      if (couples !== undefined) data.couples = co;
      data.totalRooms = roomAllocation.totalRooms;
      data.roomConfig = roomAllocation;
    }
    if (specialNotes !== undefined) data.specialNotes = specialNotes;
    if (inclusions !== undefined) data.inclusions = inclusions;
    if (exclusions !== undefined) data.exclusions = exclusions;
    if (terms !== undefined) data.terms = terms;
    if (gstRate !== undefined) data.gstRate = safeAmount(gstRate, 5);
    if (serviceCharge !== undefined) data.serviceCharge = safeAmount(serviceCharge);
    if (discount !== undefined) data.discount = safeAmount(discount);
    if (discountType !== undefined) data.discountType = discountType;
    if (quoteValidity !== undefined) data.quoteValidity = quoteValidity;
    if (paymentTerms !== undefined) data.paymentTerms = paymentTerms;
    data.updatedById = user.id;

    const draft = await prisma.packageDraft.update({
      where: { id },
      data
    });

    if (gstRate !== undefined || serviceCharge !== undefined || discount !== undefined || discountType !== undefined) {
      const recalculated = await recalculatePricing(id);
      await logPackageActivity(id, 'PRICE_RECALCULATE', 'Pricing recalculated after field update', user.id, { before: beforeData.hotelCost, after: recalculated.hotelCost });
    }

    await logPackageActivity(id, 'UPDATE', `Package draft ${draft.draftId} updated`, user.id, beforeData, draft);

    res.json({ success: true, data: draft });
  } catch (error) {
    next(error);
  }
};

exports.deletePackageDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const draft = await prisma.packageDraft.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (user.role === 'sales' && draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (draft.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only drafts with status "draft" can be deleted' });
    }
    await logPackageActivity(id, 'DELETE', `Package draft ${draft.draftId} deleted`, user.id, draft, null);
    await prisma.packageDraft.delete({ where: { id } });
    res.json({ success: true, message: 'Package draft deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.duplicatePackageDraft = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const original = await prisma.packageDraft.findFirst({
      where: { id, ...getTenantWhere(req) },
      include: {
        itineraryDays: {
          orderBy: { dayNumber: 'asc' },
          include: {
            items: { orderBy: { sortOrder: 'asc' } }
          }
        }
      }
    });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Source draft not found' });
    }
    if (user.role === 'sales' && original.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Source draft not found' });
    }

    const newDraftId = generateDraftId();
    const { id: origId, draftId: origDraftId, status, quoteNumber, quoteSentAt, createdAt, updatedAt, salesAdminId, createdById, updatedById, itineraryDays, ...draftData } = original;

    const draft = await prisma.packageDraft.create({
      data: {
        ...draftData,
        draftId: newDraftId,
        status: 'draft',
        quoteNumber: null,
        quoteSentAt: null,
        salesAdminId: user.role === 'sales' ? user.id : salesAdminId,
        createdById: user.id,
        updatedById: user.id,
        itineraryDays: {
          create: itineraryDays.map((day, idx) => {
            const { id: dayId, draftId: dayDraftId, items, ...dayData } = day;
            return {
              ...dayData,
              dayNumber: idx + 1,
              items: {
                create: items.map((item) => {
                  const { id: itemId, dayId: itemDayId, ...itemData } = item;
                  return itemData;
                })
              }
            };
          })
        }
      }
    });

    await logPackageActivity(draft.id, 'DUPLICATE', `Duplicated from ${original.draftId} to ${newDraftId}`, user.id);

    res.status(201).json({ success: true, data: draft });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// ITINERARY DAY MANAGEMENT
// ──────────────────────────────────────────────

exports.addItineraryDay = async (req, res, next) => {
  try {
    const { id } = req.params;
    const draftId = id;
    const user = req.user;
    const draft = await prisma.packageDraft.findFirst({
      where: { id: draftId, ...getTenantWhere(req) }
    });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }
    if (user.role === 'sales' && draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }
    const { date, stayCityId, title, routeFrom, routeTo, distanceKm, travelTimeMins, notes } = req.body;

    const maxDay = await prisma.packageItineraryDay.findFirst({
      where: { draftId },
      orderBy: { dayNumber: 'desc' },
      select: { dayNumber: true }
    });
    const nextDayNumber = (maxDay?.dayNumber || 0) + 1;

    const day = await prisma.packageItineraryDay.create({
      data: {
        draftId,
        dayNumber: nextDayNumber,
        date: date ? new Date(date) : null,
        stayCityId: stayCityId || null,
        title,
        routeFrom,
        routeTo,
        distanceKm: distanceKm ? safeAmount(distanceKm, null) : null,
        travelTimeMins: travelTimeMins || null,
        notes
      }
    });

    await logPackageActivity(draftId, 'DAY_ADD', `Day ${nextDayNumber} added`, user.id);
    res.status(201).json({ success: true, data: day });
  } catch (error) {
    next(error);
  }
};

exports.updateItineraryDay = async (req, res, next) => {
  try {
    const { dayId } = req.params;
    const user = req.user;
    const day = await prisma.packageItineraryDay.findUnique({
      where: { id: dayId },
      include: { draft: { select: { id: true, tenantId: true, salesAdminId: true } } }
    });
    if (!day || day.draft.tenantId !== (req.user.tenantId || 'default')) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }
    if (user.role === 'sales' && day.draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }
    const { date, stayCityId, title, routeFrom, routeTo, distanceKm, travelTimeMins, notes } = req.body;
    const data = {};
    if (date !== undefined) data.date = new Date(date);
    if (stayCityId !== undefined) data.stayCityId = stayCityId || null;
    if (title !== undefined) data.title = title;
    if (routeFrom !== undefined) data.routeFrom = routeFrom;
    if (routeTo !== undefined) data.routeTo = routeTo;
    if (distanceKm !== undefined) data.distanceKm = safeAmount(distanceKm, null);
    if (travelTimeMins !== undefined) data.travelTimeMins = travelTimeMins;
    if (notes !== undefined) data.notes = notes;
    const updated = await prisma.packageItineraryDay.update({ where: { id: dayId }, data });
    await logPackageActivity(day.draft.id, 'DAY_UPDATE', `Day ${day.dayNumber} updated`, user.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.deleteItineraryDay = async (req, res, next) => {
  try {
    const { dayId } = req.params;
    const user = req.user;
    const day = await prisma.packageItineraryDay.findUnique({
      where: { id: dayId },
      include: { draft: { select: { id: true, tenantId: true, salesAdminId: true } } }
    });
    if (!day || day.draft.tenantId !== (req.user.tenantId || 'default')) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }
    if (user.role === 'sales' && day.draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }
    const draftId = day.draft.id;
    const deletedDayNumber = day.dayNumber;

    await prisma.packageItineraryDay.delete({ where: { id: dayId } });

    const remainingDays = await prisma.packageItineraryDay.findMany({
      where: { draftId },
      orderBy: { dayNumber: 'asc' }
    });
    for (let i = 0; i < remainingDays.length; i++) {
      if (remainingDays[i].dayNumber !== i + 1) {
        await prisma.packageItineraryDay.update({
          where: { id: remainingDays[i].id },
          data: { dayNumber: i + 1 }
        });
      }
    }

    await logPackageActivity(draftId, 'DAY_DELETE', `Day ${deletedDayNumber} deleted and days renumbered`, user.id);
    res.json({ success: true, message: 'Day deleted and remaining days renumbered' });
  } catch (error) {
    next(error);
  }
};

exports.reorderItineraryDays = async (req, res, next) => {
  try {
    const { id } = req.params;
    const draftId = id;
    const user = req.user;
    const { days } = req.body;
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ success: false, message: 'days array is required' });
    }

    // Day number uniqueness and sequence validation
    const dayNumbers = days.map(d => Number(d.dayNumber));
    const uniqueDayNumbers = new Set(dayNumbers);
    if (uniqueDayNumbers.size !== dayNumbers.length) {
      return res.status(400).json({ success: false, message: 'Duplicate day numbers are not allowed' });
    }

    const draft = await prisma.packageDraft.findFirst({
      where: { id: draftId, ...getTenantWhere(req) }
    });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }
    if (user.role === 'sales' && draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }
    const updates = days.map(({ id, dayNumber }) =>
      prisma.packageItineraryDay.update({
        where: { id },
        data: { dayNumber }
      })
    );
    await prisma.$transaction(updates);
    await logPackageActivity(draftId, 'DAYS_REORDER', 'Itinerary days reordered', user.id);
    res.json({ success: true, message: 'Days reordered successfully' });
  } catch (error) {
    next(error);
  }
};

exports.duplicateItineraryDay = async (req, res, next) => {
  try {
    const { dayId } = req.params;
    const user = req.user;
    const sourceDay = await prisma.packageItineraryDay.findUnique({
      where: { id: dayId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        draft: { select: { id: true, tenantId: true, salesAdminId: true } }
      }
    });
    if (!sourceDay || sourceDay.draft.tenantId !== (req.user.tenantId || 'default')) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }
    if (user.role === 'sales' && sourceDay.draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }

    const draftId = sourceDay.draft.id;
    const maxDay = await prisma.packageItineraryDay.findFirst({
      where: { draftId },
      orderBy: { dayNumber: 'desc' },
      select: { dayNumber: true }
    });
    const nextDayNumber = (maxDay?.dayNumber || 0) + 1;

    const { id: srcId, draftId: srcDraftId, dayNumber, items, ...dayData } = sourceDay;

    const newDay = await prisma.packageItineraryDay.create({
      data: {
        ...dayData,
        draftId,
        dayNumber: nextDayNumber,
        items: {
          create: items.map((item) => {
            const { id: itemId, dayId: itemDayId, ...itemData } = item;
            return itemData;
          })
        }
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } }
      }
    });

    await logPackageActivity(draftId, 'DAY_DUPLICATE', `Day ${sourceDay.dayNumber} duplicated as day ${nextDayNumber}`, user.id);
    res.status(201).json({ success: true, data: newDay });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// ITINERARY ITEMS
// ──────────────────────────────────────────────

exports.addItineraryItem = async (req, res, next) => {
  try {
    const { dayId } = req.params;
    const user = req.user;
    const day = await prisma.packageItineraryDay.findUnique({
      where: { id: dayId },
      include: { draft: { select: { id: true, tenantId: true, salesAdminId: true, adults: true, children: true } } }
    });
    if (!day || day.draft.tenantId !== (req.user.tenantId || 'default')) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }
    if (user.role === 'sales' && day.draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }

    const validServiceTypes = ['HOTEL', 'VEHICLE', 'TRANSFER', 'ACTIVITY', 'MEAL', 'GUIDE', 'TRAIN', 'FLIGHT', 'CUSTOM'];
    const { serviceType, serviceId, label, description, quantity, rate, isVendorCost, metadata } = req.body;

    if (!serviceType || !validServiceTypes.includes(serviceType)) {
      return res.status(400).json({ success: false, message: `Invalid serviceType. Must be one of: ${validServiceTypes.join(', ')}` });
    }
    if (!label || !label.trim()) {
      return res.status(400).json({ success: false, message: 'label is required' });
    }

    const qty = safeAmount(quantity, 1);
    const rateVal = safeAmount(rate, 0);
    const amount = qty * rateVal;

    // Seating capacity validation for vehicles
    if (serviceType === 'VEHICLE' && serviceId) {
      const vehicle = await prisma.packageVehicle.findUnique({
        where: { id: serviceId }
      });
      if (vehicle) {
        const totalPax = (day.draft.adults || 0) + (day.draft.children || 0);
        const totalCapacity = vehicle.seatingCapacity * qty;
        if (totalPax > totalCapacity) {
          return res.status(400).json({
            success: false,
            message: `Selected vehicle capacity (${totalCapacity} pax) is insufficient for ${totalPax} travelers`
          });
        }
      }
    }

    const maxSort = await prisma.packageItineraryItem.findFirst({
      where: { dayId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });
    const nextSort = (maxSort?.sortOrder ?? -1) + 1;

    const item = await prisma.packageItineraryItem.create({
      data: {
        dayId,
        serviceType,
        serviceId: serviceId || null,
        label: label.trim(),
        description,
        quantity: qty,
        rate: rateVal,
        amount,
        isVendorCost: isVendorCost || false,
        sortOrder: nextSort,
        metadata: metadata || undefined
      }
    });

    await logPackageActivity(day.draft.id, 'ITEM_ADD', `Item "${label}" added to day ${day.dayNumber}`, user.id);
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.updateItineraryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const user = req.user;
    const existing = await prisma.packageItineraryItem.findUnique({
      where: { id: itemId },
      include: {
        day: {
          include: { draft: { select: { id: true, tenantId: true, salesAdminId: true, adults: true, children: true } } }
        }
      }
    });
    if (!existing || existing.day.draft.tenantId !== (req.user.tenantId || 'default')) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    if (user.role === 'sales' && existing.day.draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const { rate, quantity, label, description, isVendorCost, metadata } = req.body;

    // Seating capacity validation for vehicles
    if (existing.serviceType === 'VEHICLE' && existing.serviceId) {
      const vehicle = await prisma.packageVehicle.findUnique({
        where: { id: existing.serviceId }
      });
      if (vehicle) {
        const totalPax = (existing.day.draft.adults || 0) + (existing.day.draft.children || 0);
        const finalQty = quantity !== undefined ? safeAmount(quantity, 1) : existing.quantity;
        const totalCapacity = vehicle.seatingCapacity * finalQty;
        if (totalPax > totalCapacity) {
          return res.status(400).json({
            success: false,
            message: `Selected vehicle capacity (${totalCapacity} pax) is insufficient for ${totalPax} travelers`
          });
        }
      }
    }

    const data = {};
    if (label !== undefined) data.label = label.trim();
    if (description !== undefined) data.description = description;
    if (quantity !== undefined) data.quantity = safeAmount(quantity, 1);
    if (rate !== undefined) data.rate = safeAmount(rate, 0);
    if (isVendorCost !== undefined) data.isVendorCost = isVendorCost;
    if (metadata !== undefined) data.metadata = metadata;

    if (rate !== undefined || quantity !== undefined) {
      const finalQty = quantity !== undefined ? safeAmount(quantity, 1) : existing.quantity;
      const finalRate = rate !== undefined ? safeAmount(rate, 0) : existing.rate;
      data.amount = finalQty * finalRate;
    }

    const item = await prisma.packageItineraryItem.update({ where: { id: itemId }, data });

    await logPackageActivity(existing.day.draft.id, 'ITEM_UPDATE', `Item "${item.label}" updated`, user.id);
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

exports.deleteItineraryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const user = req.user;
    const item = await prisma.packageItineraryItem.findUnique({
      where: { id: itemId },
      include: {
        day: {
          include: { draft: { select: { id: true, tenantId: true, salesAdminId: true } } }
        }
      }
    });
    if (!item || item.day.draft.tenantId !== (req.user.tenantId || 'default')) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    if (user.role === 'sales' && item.day.draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const draftId = item.day.draft.id;
    const dayNumber = item.day.dayNumber;
    await prisma.packageItineraryItem.delete({ where: { id: itemId } });
    await logPackageActivity(draftId, 'ITEM_DELETE', `Item "${item.label}" removed from day ${dayNumber}`, user.id);
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.reorderItineraryItems = async (req, res, next) => {
  try {
    const { dayId } = req.params;
    const user = req.user;
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }
    const day = await prisma.packageItineraryDay.findUnique({
      where: { id: dayId },
      include: { draft: { select: { id: true, tenantId: true, salesAdminId: true } } }
    });
    if (!day || day.draft.tenantId !== (req.user.tenantId || 'default')) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }
    if (user.role === 'sales' && day.draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Itinerary day not found' });
    }
    const updates = items.map(({ id, sortOrder }) =>
      prisma.packageItineraryItem.update({
        where: { id },
        data: { sortOrder }
      })
    );
    await prisma.$transaction(updates);
    await logPackageActivity(day.draft.id, 'ITEMS_REORDER', 'Itinerary items reordered', user.id);
    res.json({ success: true, message: 'Items reordered successfully' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PRICING ENGINE
// ──────────────────────────────────────────────

async function recalculatePricing(draftId) {
  const items = await prisma.packageItineraryItem.findMany({
    where: { day: { draftId } },
    select: {
      amount: true,
      serviceType: true,
      isVendorCost: true
    }
  });

  let hotelCost = 0, vehicleCost = 0, transferCost = 0, activityCost = 0;
  let mealCost = 0, guideCost = 0, trainCost = 0, flightCost = 0, miscCost = 0;
  let vendorHotelCost = 0, vendorVehicleCost = 0, vendorActivityCost = 0;
  let vendorMealCost = 0, vendorGuideCost = 0;

  for (const item of items) {
    const amount = safeAmount(item.amount);
    if (item.isVendorCost) {
      switch (item.serviceType) {
        case 'HOTEL': vendorHotelCost += amount; break;
        case 'VEHICLE': vendorVehicleCost += amount; break;
        case 'ACTIVITY': vendorActivityCost += amount; break;
        case 'MEAL': vendorMealCost += amount; break;
        case 'GUIDE': vendorGuideCost += amount; break;
      }
    } else {
      switch (item.serviceType) {
        case 'HOTEL': hotelCost += amount; break;
        case 'VEHICLE': vehicleCost += amount; break;
        case 'TRANSFER': transferCost += amount; break;
        case 'ACTIVITY': activityCost += amount; break;
        case 'MEAL': mealCost += amount; break;
        case 'GUIDE': guideCost += amount; break;
        case 'TRAIN': trainCost += amount; break;
        case 'FLIGHT': flightCost += amount; break;
        default: miscCost += amount; break;
      }
    }
  }

  const subtotal = hotelCost + vehicleCost + transferCost + activityCost + mealCost + guideCost + trainCost + flightCost + miscCost;
  const vendorTotal = vendorHotelCost + vendorVehicleCost + vendorActivityCost + vendorMealCost + vendorGuideCost;

  return {
    hotelCost, vehicleCost, transferCost, activityCost, mealCost, guideCost, trainCost, flightCost, miscCost,
    subtotal, vendorHotelCost, vendorVehicleCost, vendorActivityCost, vendorMealCost, vendorGuideCost, vendorTotal
  };
}

exports.recalculatePackagePrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const draft = await prisma.packageDraft.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (user.role === 'sales' && draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }

    const pricing = await recalculatePricing(id);

    const discount = safeAmount(draft.discount);
    const gstRate = safeAmount(draft.gstRate, 5);
    const serviceCharge = safeAmount(draft.serviceCharge);

    let discountAmount = 0;
    if (discount > 0) {
      if (draft.discountType === 'percentage') {
        discountAmount = (pricing.subtotal * discount) / 100;
      } else {
        discountAmount = discount;
      }
    }

    const afterDiscount = pricing.subtotal - discountAmount;
    const gstAmount = (afterDiscount * gstRate) / 100;
    const totalAmount = afterDiscount + gstAmount + serviceCharge;
    const estimatedMargin = totalAmount - pricing.vendorTotal;

    const updated = await prisma.packageDraft.update({
      where: { id },
      data: {
        hotelCost: pricing.hotelCost,
        vehicleCost: pricing.vehicleCost,
        transferCost: pricing.transferCost,
        activityCost: pricing.activityCost,
        mealCost: pricing.mealCost,
        guideCost: pricing.guideCost,
        trainCost: pricing.trainCost,
        flightCost: pricing.flightCost,
        miscCost: pricing.miscCost,
        subtotal: pricing.subtotal,
        gstAmount: Math.max(0, gstAmount),
        totalAmount: Math.max(0, totalAmount),
        estimatedMargin: Math.max(0, estimatedMargin),
        vendorHotelCost: pricing.vendorHotelCost,
        vendorVehicleCost: pricing.vendorVehicleCost,
        vendorActivityCost: pricing.vendorActivityCost,
        vendorMealCost: pricing.vendorMealCost,
        vendorGuideCost: pricing.vendorGuideCost,
        updatedById: user.id
      }
    });

    await logPackageActivity(id, 'PRICE_RECALCULATE', 'Package pricing recalculated', user.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// QUOTE GENERATION
// ──────────────────────────────────────────────

exports.generateQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const draft = await prisma.packageDraft.findFirst({
      where: { id, ...getTenantWhere(req) }
    });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (user.role === 'sales' && draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (draft.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only drafts with status "draft" can be converted to quote' });
    }

    const quoteNumber = generateQuoteNumber();

    const updated = await prisma.packageDraft.update({
      where: { id },
      data: {
        status: 'quoted',
        quoteNumber,
        quoteSentAt: new Date(),
        updatedById: user.id
      }
    });

    await logPackageActivity(id, 'QUOTE_GENERATED', `Quote ${quoteNumber} generated`, user.id);

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.convertToBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const draft = await prisma.packageDraft.findFirst({
      where: { id, ...getTenantWhere(req) },
      include: {
        itineraryDays: {
          include: { items: true }
        }
      }
    });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (user.role === 'sales' && draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (draft.status !== 'quoted') {
      return res.status(400).json({ success: false, message: 'Only quoted packages can be converted to booking' });
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId: draft.tenantId,
        bookingId: draft.draftId,
        tripId: 'package-builder',
        tripName: draft.packageName || 'Custom Package',
        status: 'pending',
        name: draft.customerName || 'Unknown',
        fullName: draft.customerName,
        phone: draft.customerPhone || '',
        email: draft.customerEmail,
        numberOfTravelers: draft.adults + draft.children,
        baseAmount: draft.subtotal,
        gstAmount: draft.gstAmount,
        totalAmount: draft.totalAmount,
        amount: draft.totalAmount,
        salesAdminId: draft.salesAdminId,
        sourceMeta: {
          packageDraftId: draft.id,
          draftId: draft.draftId,
          packageName: draft.packageName,
          quoteNumber: draft.quoteNumber
        }
      }
    });

    const updated = await prisma.packageDraft.update({
      where: { id },
      data: {
        status: 'converted',
        updatedById: user.id
      }
    });

    await logPackageActivity(id, 'CONVERTED', `Package converted to booking ${booking.bookingId}`, user.id);

    res.json({ success: true, data: { draft: updated, booking } });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// ACTIVITY LOGS
// ──────────────────────────────────────────────

exports.getPackageActivityLogs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const draftId = id;
    const user = req.user;
    const draft = await prisma.packageDraft.findFirst({
      where: { id: draftId, ...getTenantWhere(req) }
    });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    if (user.role === 'sales' && draft.salesAdminId !== user.id) {
      return res.status(404).json({ success: false, message: 'Package draft not found' });
    }
    const logs = await prisma.packageActivityLog.findMany({
      where: { draftId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};
