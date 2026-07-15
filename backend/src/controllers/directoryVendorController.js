const { prisma } = require('../lib/prisma');
const pricingEngine = require('../utils/vendorPricingEngine');

// ── 1. MAIN DIRECTORY VENDOR CRUD ──

exports.getDirectoryVendors = async (req, res, next) => {
  try {
    const { type, state, city, isActive } = req.query;
    const where = {};
    if (type) where.type = type;
    if (state) where.state = state;
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const vendors = await prisma.directoryVendor.findMany({
      where,
      include: {
        contacts: true,
        contracts: true,
        roomRates: true,
        transportRates: true,
        foodRates: true,
        guideRates: true,
        miscCharges: true,
        tripMappings: true
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

exports.getDirectoryVendor = async (req, res, next) => {
  try {
    const vendor = await prisma.directoryVendor.findUnique({
      where: { id: req.params.vendorId },
      include: {
        contacts: true,
        contracts: true,
        roomRates: true,
        transportRates: true,
        foodRates: true,
        guideRates: true,
        miscCharges: true,
        tripMappings: true
      }
    });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryVendor = async (req, res, next) => {
  try {
    const {
      vendorCode, name, legalName, type, contactPerson, contactNumber,
      alternateNumber, whatsappNumber, email, gstin, panNumber,
      state, city, area, address, paymentTerms, creditDays, bankDetails,
      notes, contacts = [], tripId
    } = req.body;

    const vendor = await prisma.directoryVendor.create({
      data: {
        vendorCode: vendorCode || `VND-${Date.now()}`,
        name,
        legalName,
        type,
        contactPerson,
        contactNumber,
        alternateNumber,
        whatsappNumber,
        email,
        gstin,
        panNumber,
        state,
        city,
        area,
        address,
        paymentTerms,
        creditDays: creditDays ? parseInt(creditDays) : null,
        bankDetails: bankDetails || null,
        notes,
        isActive: true,
        contacts: {
          create: contacts.map(c => ({
            contactName: c.contactName,
            designation: c.designation || null,
            phone: c.phone,
            email: c.email || null,
            isPrimary: c.isPrimary || false
          }))
        }
      },
      include: { contacts: true }
    });

    if (tripId) {
      await prisma.directoryTripVendorMapping.create({
        data: {
          tripId,
          vendorId: vendor.id,
          serviceType: type
        }
      });
    }

    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

exports.updateDirectoryVendor = async (req, res, next) => {
  try {
    const {
      name, legalName, type, contactPerson, contactNumber, alternateNumber,
      whatsappNumber, email, gstin, panNumber, state, city, area, address,
      paymentTerms, creditDays, bankDetails, notes, isActive, tripId
    } = req.body;

    const vendor = await prisma.directoryVendor.update({
      where: { id: req.params.vendorId },
      data: {
        name,
        legalName,
        type,
        contactPerson,
        contactNumber,
        alternateNumber,
        whatsappNumber,
        email,
        gstin,
        panNumber,
        state,
        city,
        area,
        address,
        paymentTerms,
        creditDays: creditDays ? parseInt(creditDays) : undefined,
        bankDetails: bankDetails || undefined,
        notes,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    if (tripId !== undefined) {
      await prisma.directoryTripVendorMapping.deleteMany({
        where: { vendorId: req.params.vendorId }
      });
      if (tripId) {
        await prisma.directoryTripVendorMapping.create({
          data: {
            tripId,
            vendorId: req.params.vendorId,
            serviceType: type || vendor.type || 'HOTEL'
          }
        });
      }
    }

    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
};

exports.deleteDirectoryVendor = async (req, res, next) => {
  try {
    // Inactivate instead of hard delete to preserve historical pricing integrity
    const vendor = await prisma.directoryVendor.update({
      where: { id: req.params.vendorId },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Vendor deactivated successfully', data: vendor });
  } catch (error) {
    next(error);
  }
};

// ── 2. RATES CREATION ENPOINTS ──

exports.createDirectoryRoomRate = async (req, res, next) => {
  try {
    const { rates } = req.body;
    if (rates && Array.isArray(rates)) {
      await prisma.directoryVendorRoomRate.deleteMany({ where: { vendorId: req.params.vendorId } });
      const created = [];
      for (const r of rates) {
        const rate = await prisma.directoryVendorRoomRate.create({
          data: {
            vendorId: req.params.vendorId,
            roomCategory: r.roomCategory || "Standard",
            sharingType: r.sharingType || "DOUBLE",
            rateBasis: r.rateBasis || "PER_ROOM_PER_NIGHT",
            amount: Number(r.amount || 0),
            availableRooms: r.availableRooms ? parseInt(r.availableRooms) : null,
            mealPlan: r.mealPlan || "EP",
            season: r.season || "ALL"
          }
        });
        created.push(rate);
      }
      return res.status(201).json({ success: true, data: created });
    }

    const {
      propertyName, roomCategory, sharingType, standardOccupancy, maximumOccupancy,
      mixedOccupancyAllowed, rateBasis, amount, extraAdultRate, extraChildRate,
      guideRoomRate, availableRooms, mealPlan, season, validFrom, validTo,
      taxIncluded, taxPercent, minimumRooms, cancellationPolicy, blackoutDates
    } = req.body;

    const rate = await prisma.directoryVendorRoomRate.create({
      data: {
        vendorId: req.params.vendorId,
        propertyName,
        roomCategory,
        sharingType,
        standardOccupancy: parseInt(standardOccupancy || 2),
        maximumOccupancy: parseInt(maximumOccupancy || 3),
        mixedOccupancyAllowed: mixedOccupancyAllowed !== false,
        rateBasis,
        amount: Number(amount),
        extraAdultRate: extraAdultRate ? Number(extraAdultRate) : null,
        extraChildRate: extraChildRate ? Number(extraChildRate) : null,
        guideRoomRate: guideRoomRate ? Number(guideRoomRate) : null,
        availableRooms: availableRooms ? parseInt(availableRooms) : null,
        mealPlan,
        season,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        taxIncluded: taxIncluded === true,
        taxPercent: taxPercent ? Number(taxPercent) : 0,
        minimumRooms: minimumRooms ? parseInt(minimumRooms) : null,
        cancellationPolicy,
        blackoutDates: blackoutDates || null
      }
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryTransportRate = async (req, res, next) => {
  try {
    const { rates } = req.body;
    if (rates && Array.isArray(rates)) {
      await prisma.directoryVendorTransportRate.deleteMany({ where: { vendorId: req.params.vendorId } });
      const created = [];
      for (const r of rates) {
        const rate = await prisma.directoryVendorTransportRate.create({
          data: {
            vendorId: req.params.vendorId,
            routeName: r.routeName || "",
            vehicleType: r.vehicleType || "17 Seater",
            seatCapacity: parseInt(r.seatCapacity || 17),
            rateBasis: r.rateBasis || "PER_VEHICLE",
            amount: Number(r.amount || 0),
            extraCharge: Number(r.extraCharge || 0),
            season: r.season || "ALL"
          }
        });
        created.push(rate);
      }
      return res.status(201).json({ success: true, data: created });
    }

    const {
      routeName, pickupLocation, dropLocation, vehicleType, seatCapacity, rateBasis,
      amount, extraCharge, extraKmRate, extraHourRate, nightHaltRate, tollIncluded,
      parkingIncluded, fuelIncluded, driverAllowanceIncluded, stateTaxIncluded,
      backupVehicleAvailable, season, validFrom, validTo, cancellationPolicy
    } = req.body;

    const rate = await prisma.directoryVendorTransportRate.create({
      data: {
        vendorId: req.params.vendorId,
        routeName,
        pickupLocation,
        dropLocation,
        vehicleType,
        seatCapacity: parseInt(seatCapacity || 17),
        rateBasis,
        amount: Number(amount),
        extraCharge: extraCharge ? Number(extraCharge) : 0,
        extraKmRate: extraKmRate ? Number(extraKmRate) : null,
        extraHourRate: extraHourRate ? Number(extraHourRate) : null,
        nightHaltRate: nightHaltRate ? Number(nightHaltRate) : null,
        tollIncluded: tollIncluded === true,
        parkingIncluded: parkingIncluded === true,
        fuelIncluded: fuelIncluded !== false,
        driverAllowanceIncluded: driverAllowanceIncluded === true,
        stateTaxIncluded: stateTaxIncluded === true,
        backupVehicleAvailable: backupVehicleAvailable !== false,
        season,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        cancellationPolicy
      }
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryFoodRate = async (req, res, next) => {
  try {
    const {
      mealType, menuDescription, isVeg, ratePerPerson, minimumPax, maximumPax,
      packedMeal, guideMealRate, driverMealRate, taxIncluded, taxPercent,
      validFrom, validTo, cancellationPolicy
    } = req.body;

    const rate = await prisma.directoryVendorFoodRate.create({
      data: {
        vendorId: req.params.vendorId,
        mealType,
        menuDescription,
        isVeg: isVeg !== false,
        ratePerPerson: Number(ratePerPerson),
        minimumPax: minimumPax ? parseInt(minimumPax) : null,
        maximumPax: maximumPax ? parseInt(maximumPax) : null,
        packedMeal: packedMeal === true,
        guideMealRate: guideMealRate ? Number(guideMealRate) : null,
        driverMealRate: driverMealRate ? Number(driverMealRate) : null,
        taxIncluded: taxIncluded === true,
        taxPercent: taxPercent ? Number(taxPercent) : 0,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        cancellationPolicy
      }
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryGuideRate = async (req, res, next) => {
  try {
    const {
      serviceName, serviceLocation, languages, specialization, dailyRate, travelCharge,
      foodCharge, stayCharge, maximumGroupSize, emergencySupport, idVerified,
      policeVerified, validFrom, validTo
    } = req.body;

    const rate = await prisma.directoryVendorGuideRate.create({
      data: {
        vendorId: req.params.vendorId,
        serviceName,
        serviceLocation,
        languages,
        specialization,
        dailyRate: Number(dailyRate),
        travelCharge: travelCharge ? Number(travelCharge) : 0,
        foodCharge: foodCharge ? Number(foodCharge) : 0,
        stayCharge: stayCharge ? Number(stayCharge) : 0,
        maximumGroupSize: maximumGroupSize ? parseInt(maximumGroupSize) : null,
        emergencySupport: emergencySupport === true,
        idVerified: idVerified === true,
        policeVerified: policeVerified === true,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null
      }
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

exports.createDirectoryMiscCharge = async (req, res, next) => {
  try {
    const { charges } = req.body;
    if (charges && Array.isArray(charges)) {
      await prisma.directoryVendorMiscCharge.deleteMany({ where: { vendorId: req.params.vendorId } });
      const created = [];
      for (const c of charges) {
        const rate = await prisma.directoryVendorMiscCharge.create({
          data: {
            vendorId: req.params.vendorId,
            chargeName: c.chargeName || "",
            chargeType: c.chargeType || "",
            amount: Number(c.amount || 0),
            unit: c.unit || "FLAT"
          }
        });
        created.push(rate);
      }
      return res.status(201).json({ success: true, data: created });
    }

    const {
      chargeName, chargeType, amount, unit, validFrom, validTo, notes
    } = req.body;

    const rate = await prisma.directoryVendorMiscCharge.create({
      data: {
        vendorId: req.params.vendorId,
        chargeName,
        chargeType,
        amount: Number(amount),
        unit,
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo: validTo ? new Date(validTo) : null,
        notes
      }
    });
    res.status(201).json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// ── 3. LOCATION SEARCH & TRIP MAPPING ──

exports.searchVendorsByLocation = async (req, res, next) => {
  try {
    const { state, city, type } = req.query;
    const where = { isActive: true };
    if (state) where.state = state;
    if (city) where.city = city;
    if (type) where.type = type;

    const vendors = await prisma.directoryVendor.findMany({
      where,
      include: {
        roomRates: true,
        transportRates: true,
        foodRates: true,
        guideRates: true,
        miscCharges: true
      }
    });
    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

exports.getTripVendorOptions = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    // Find all vendors mapping to this trip location or category
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });

    const vendors = await prisma.directoryVendor.findMany({
      where: {
        isActive: true,
        OR: [
          { city: { contains: trip.destination || '', mode: 'insensitive' } },
          { state: { contains: trip.state || '', mode: 'insensitive' } }
        ]
      },
      include: {
        roomRates: true,
        transportRates: true,
        foodRates: true,
        guideRates: true,
        miscCharges: true
      }
    });

    res.json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
};

exports.saveTripVendorMappings = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { mappings = [] } = req.body;

    // Delete existing mapped vendors for this trip to overwrite
    await prisma.directoryTripVendorMapping.deleteMany({
      where: { tripId }
    });

    const createdMappings = [];
    for (const m of mappings) {
      const mapping = await prisma.directoryTripVendorMapping.create({
        data: {
          tripId,
          departureDate: m.departureDate ? new Date(m.departureDate) : null,
          dayNumber: m.dayNumber ? parseInt(m.dayNumber) : null,
          serviceDate: m.serviceDate ? new Date(m.serviceDate) : null,
          vendorId: m.vendorId,
          serviceType: m.serviceType,
          destination: m.destination || null,
          roomRateId: m.roomRateId || null,
          transportRateId: m.transportRateId || null,
          foodRateId: m.foodRateId || null,
          guideRateId: m.guideRateId || null,
          miscChargeId: m.miscChargeId || null,
          quantity: m.quantity ? parseInt(m.quantity) : 1,
          paxCount: m.paxCount ? parseInt(m.paxCount) : null,
          numberOfNights: m.numberOfNights ? parseInt(m.numberOfNights) : null,
          numberOfDays: m.numberOfDays ? parseInt(m.numberOfDays) : null,
          numberOfVehicles: m.numberOfVehicles ? parseInt(m.numberOfVehicles) : 1,
          isPrimary: m.isPrimary !== false,
          quotedAmount: m.quotedAmount ? Number(m.quotedAmount) : null,
          confirmedAmount: m.confirmedAmount ? Number(m.confirmedAmount) : null,
          confirmationNo: m.confirmationNo || null,
          status: m.status || 'PLANNED',
          instructions: m.instructions || null
        }
      });
      createdMappings.push(mapping);
    }

    res.status(201).json({ success: true, data: createdMappings });
  } catch (error) {
    next(error);
  }
};

// ── 4. COSTING ENGINE EXECUTION & SNAPSHOTTING ──

exports.calculateVendorCosting = async (req, res, next) => {
  try {
    const { paxCount, accommodations = [], transports = [], foodItems = [], guideItems = [], miscCharges = [], contingencyPercent = 0 } = req.body;
    
    const calculation = pricingEngine.calculateTripCost({
      paxCount: parseInt(paxCount),
      accommodations,
      transports,
      foodItems,
      guideItems,
      miscCharges,
      contingencyPercent: Number(contingencyPercent)
    });

    res.json({ success: true, data: calculation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createCostingSnapshot = async (req, res, next) => {
  try {
    const { tripId, departureDate, paxCount, calculationData, vendorRatesData } = req.body;

    const snapshot = await prisma.directoryTripCostSnapshot.create({
      data: {
        tripId,
        departureDate: departureDate ? new Date(departureDate) : null,
        paxCount: parseInt(paxCount),
        vendorCost: Number(calculationData.finalVendorCost || 0),
        costPerPerson: Number(calculationData.costPerPerson || 0),
        calculationData: calculationData || {},
        vendorRatesData: vendorRatesData || {},
        createdById: req.user?.id || 'admin'
      }
    });

    res.status(201).json({ success: true, data: snapshot });
  } catch (error) {
    next(error);
  }
};

// ── 5. VENDOR PAYMENTS CRUD ──

exports.getVendorPayments = async (req, res, next) => {
  try {
    const { vendorId, paymentStatus } = req.query;
    const where = {};
    if (vendorId) where.vendorId = vendorId;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const payments = await prisma.directoryVendorPayment.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

exports.createVendorPayment = async (req, res, next) => {
  try {
    const {
      vendorId, tripId, departureDate, invoiceAmount, advanceAmount = 0, paidAmount = 0,
      dueDate, paymentDate, paymentMode, transactionRef, remarks
    } = req.body;

    const parsedInvoice = Number(invoiceAmount);
    const parsedAdvance = Number(advanceAmount);
    const parsedPaid = Number(paidAmount);
    const totalPaid = parsedAdvance + parsedPaid;
    const remainingBalance = parsedInvoice - totalPaid;

    let paymentStatus = 'PENDING';
    if (totalPaid >= parsedInvoice) {
      paymentStatus = 'PAID';
    } else if (totalPaid > 0) {
      paymentStatus = 'PARTIAL';
    }

    const payment = await prisma.directoryVendorPayment.create({
      data: {
        vendorId,
        tripId: tripId || null,
        departureDate: departureDate ? new Date(departureDate) : null,
        invoiceAmount: parsedInvoice,
        advanceAmount: parsedAdvance,
        paidAmount: parsedPaid,
        remainingBalance: remainingBalance,
        paymentStatus,
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        paymentMode,
        transactionRef,
        approvedBy: req.user?.id || 'admin',
        remarks
      },
      include: { vendor: true }
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

exports.updateVendorPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { advanceAmount, paidAmount, paymentMode, transactionRef, paymentStatus, remarks } = req.body;

    const currentPayment = await prisma.directoryVendorPayment.findUnique({
      where: { id: paymentId }
    });
    if (!currentPayment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    const newAdvance = advanceAmount !== undefined ? Number(advanceAmount) : Number(currentPayment.advanceAmount);
    const newPaid = paidAmount !== undefined ? Number(paidAmount) : Number(currentPayment.paidAmount);
    const invoice = Number(currentPayment.invoiceAmount);
    const totalPaid = newAdvance + newPaid;
    const remaining = invoice - totalPaid;

    let calculatedStatus = paymentStatus || 'PENDING';
    if (!paymentStatus) {
      if (totalPaid >= invoice) {
        calculatedStatus = 'PAID';
      } else if (totalPaid > 0) {
        calculatedStatus = 'PARTIAL';
      }
    }

    const payment = await prisma.directoryVendorPayment.update({
      where: { id: paymentId },
      data: {
        advanceAmount: newAdvance,
        paidAmount: newPaid,
        remainingBalance: remaining,
        paymentStatus: calculatedStatus,
        paymentMode,
        transactionRef,
        remarks
      },
      include: { vendor: true }
    });

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};
