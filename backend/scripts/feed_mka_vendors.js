const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function feedMkaVendors() {
  console.log('🚀 Starting MKA-1 Vendor & Transport Seeder...');

  const trip = await prisma.trip.findFirst({
    where: { OR: [{ id: 'MKA-1' }, { slug: 'mka-1' }] }
  });

  if (!trip) {
    console.error('❌ MKA-1 Trip not found!');
    process.exit(1);
  }

  const tripId = trip.id;
  console.log(`✅ Found Trip: ${trip.title} (ID: ${tripId})`);

  // ─────────────────────────────────────────────────────────────
  // 1. ACCOMMODATION / HOTEL VENDORS
  // ─────────────────────────────────────────────────────────────
  const accommodationVendors = [
    {
      code: 'VND-KASOL-95994',
      name: 'Kasol Stay & Camps',
      type: 'CAMP',
      city: 'Kasol',
      location: 'Kasol',
      phone: '95994 91709',
      contactPerson: 'Kasol Manager',
      totalRooms: 16,
      roomTypes: '11 Single + 05 Family',
      sharingTypes: 'Double, Triple, Quad, Family',
      notes: '16 Rooms (11 Single + 05 Family)',
      rates: [
        { sharing: 'DOUBLE', amount: 1000, rateBasis: 'PER_PERSON', roomType: 'Single / Deluxe' },
        { sharing: 'TRIPLE', amount: 800, rateBasis: 'PER_PERSON', roomType: 'Family / Triple' },
        { sharing: 'QUAD', amount: 800, rateBasis: 'PER_PERSON', roomType: 'Family / Quad' },
      ],
      hotelRates: [
        {
          rateName: 'Single / Standard Room (11 Rms)',
          rateType: 'PER_PERSON',
          doubleRate: 1000,
          tripleRate: 800,
          quadRate: 800,
          singleRate: 11,
          childWithoutBed: 2,
        },
        {
          rateName: 'Family Room (5 Rms)',
          rateType: 'FAMILY_ROOM',
          doubleRate: 1000,
          tripleRate: 800,
          quadRate: 800,
          singleRate: 5,
          childWithoutBed: 4,
        }
      ]
    },
    {
      code: 'VND-KULLU-94185',
      name: 'Kullu Camps & Tents',
      type: 'CAMP',
      city: 'Kullu',
      location: 'Kullu',
      phone: '94185 84185',
      contactPerson: 'Kullu Manager',
      totalRooms: 19,
      roomTypes: '15 Tents + 4 Rooms',
      sharingTypes: 'Double, Triple, Quad',
      notes: '19 Units (15 Tents)',
      rates: [
        { sharing: 'DOUBLE', amount: 900, rateBasis: 'PER_PERSON', roomType: 'Tents' },
        { sharing: 'TRIPLE', amount: 700, rateBasis: 'PER_PERSON', roomType: 'Tents' },
        { sharing: 'QUAD', amount: 700, rateBasis: 'PER_PERSON', roomType: 'Tents' },
      ],
      hotelRates: [
        {
          rateName: 'Alpine Tents (15 Tents)',
          rateType: 'PER_PERSON',
          doubleRate: 900,
          tripleRate: 700,
          quadRate: 700,
          singleRate: 15,
          childWithoutBed: 3,
        }
      ]
    },
    {
      code: 'VND-BARPA-94187',
      name: 'Barpa Stay & Cottages',
      type: 'HOTEL',
      city: 'Manali',
      location: 'Barpa / Manali',
      phone: '94187 76426',
      contactPerson: 'Barpa Manager',
      totalRooms: 19,
      roomTypes: '01 Family + 08 Single / Deluxe',
      sharingTypes: 'Double, Triple, Quad, Family',
      notes: '19 Units (01 Family + 08 Single)',
      rates: [
        { sharing: 'DOUBLE', amount: 1100, rateBasis: 'PER_PERSON', roomType: 'Deluxe Room' },
        { sharing: 'TRIPLE', amount: 800, rateBasis: 'PER_PERSON', roomType: 'Family / Triple' },
        { sharing: 'QUAD', amount: 800, rateBasis: 'PER_PERSON', roomType: 'Family / Quad' },
      ],
      hotelRates: [
        {
          rateName: 'Deluxe Rooms (8 Rms)',
          rateType: 'PER_PERSON',
          doubleRate: 1100,
          tripleRate: 800,
          quadRate: 800,
          singleRate: 8,
          childWithoutBed: 2,
        },
        {
          rateName: 'Family Cottage (1 Rm)',
          rateType: 'FAMILY_ROOM',
          doubleRate: 1100,
          tripleRate: 800,
          quadRate: 800,
          singleRate: 1,
          childWithoutBed: 5,
        }
      ]
    },
    {
      code: 'VND-RISAN-70182',
      name: 'Goti Bhai Risan Camp (Kullu)',
      type: 'CAMP',
      city: 'Kullu',
      location: 'Risan / Kullu',
      phone: '70182 58067',
      contactPerson: 'Goti Bhai',
      totalRooms: 15,
      roomTypes: 'Riverfront Camps',
      sharingTypes: 'Double, Triple, Quad',
      notes: 'Rate: ₹750/PP flat',
      rates: [
        { sharing: 'DOUBLE', amount: 750, rateBasis: 'PER_PERSON', roomType: 'Riverfront Tent' },
        { sharing: 'TRIPLE', amount: 750, rateBasis: 'PER_PERSON', roomType: 'Riverfront Tent' },
        { sharing: 'QUAD', amount: 750, rateBasis: 'PER_PERSON', roomType: 'Riverfront Tent' },
      ],
      hotelRates: [
        {
          rateName: 'Riverfront Camp',
          rateType: 'PER_PERSON',
          doubleRate: 750,
          tripleRate: 750,
          quadRate: 750,
          singleRate: 15,
          childWithoutBed: 3,
        }
      ]
    }
  ];

  for (const acc of accommodationVendors) {
    // 1. Create or update OpsVendor
    let vendor = await prisma.opsVendor.findFirst({
      where: {
        OR: [
          { vendorCode: acc.code },
          { name: acc.name },
          { phone: acc.phone }
        ]
      }
    });

    if (vendor) {
      vendor = await prisma.opsVendor.update({
        where: { id: vendor.id },
        data: {
          name: acc.name,
          vendorCode: acc.code,
          type: acc.type,
          city: acc.city,
          location: acc.location,
          phone: acc.phone,
          contactPerson: acc.contactPerson,
          totalRooms: acc.totalRooms,
          roomTypes: acc.roomTypes,
          sharingTypes: acc.sharingTypes,
          notes: acc.notes,
          isActive: true,
        }
      });
      console.log(`🔄 Updated Hotel Vendor: ${vendor.name} (${vendor.city})`);
    } else {
      vendor = await prisma.opsVendor.create({
        data: {
          vendorCode: acc.code,
          name: acc.name,
          type: acc.type,
          city: acc.city,
          location: acc.location,
          phone: acc.phone,
          contactPerson: acc.contactPerson,
          totalRooms: acc.totalRooms,
          roomTypes: acc.roomTypes,
          sharingTypes: acc.sharingTypes,
          notes: acc.notes,
          isActive: true,
          tenantId: 'default'
        }
      });
      console.log(`✨ Created Hotel Vendor: ${vendor.name} (${vendor.city})`);
    }

    // 2. Also ensure standard Vendor model has it
    let standardVendor = await prisma.vendor.findFirst({
      where: { phone: acc.phone }
    });
    if (!standardVendor) {
      await prisma.vendor.create({
        data: {
          name: acc.name,
          type: 'hotel',
          phone: acc.phone,
          location: acc.city,
          isActive: true,
          tenantId: 'default'
        }
      });
    }

    // 3. Upsert OpsTripVendor link to MKA-1
    let tripVendor = await prisma.opsTripVendor.findFirst({
      where: { tripId, vendorId: vendor.id, category: 'HOTEL' }
    });

    if (!tripVendor) {
      tripVendor = await prisma.opsTripVendor.create({
        data: {
          tripId,
          vendorId: vendor.id,
          category: 'HOTEL',
          preferred: true,
          active: true,
          notes: acc.notes
        }
      });
    }

    // 4. Upsert OpsTripVendorRate
    for (const r of acc.rates) {
      const existingRate = await prisma.opsTripVendorRate.findFirst({
        where: {
          tripVendorId: tripVendor.id,
          sharingType: r.sharing
        }
      });

      if (existingRate) {
        await prisma.opsTripVendorRate.update({
          where: { id: existingRate.id },
          data: {
            amount: r.amount,
            city: acc.city,
            roomType: r.roomType,
            rateBasis: r.rateBasis,
            active: true
          }
        });
      } else {
        await prisma.opsTripVendorRate.create({
          data: {
            tripVendorId: tripVendor.id,
            city: acc.city,
            rateType: 'HOTEL',
            roomType: r.roomType,
            sharingType: r.sharing,
            rateBasis: r.rateBasis,
            amount: r.amount,
            active: true
          }
        });
      }
    }

    // 5. Upsert OpsAccommodationRate
    for (const r of acc.rates) {
      const existingAccRate = await prisma.opsAccommodationRate.findFirst({
        where: {
          vendorId: vendor.id,
          sharingType: r.sharing
        }
      });

      if (existingAccRate) {
        await prisma.opsAccommodationRate.update({
          where: { id: existingAccRate.id },
          data: {
            propertyName: acc.name,
            city: acc.city,
            roomCategory: r.roomType,
            rateBasis: 'PER_PERSON',
            amount: r.amount,
            totalRooms: acc.totalRooms || 0,
            active: true
          }
        });
      } else {
        await prisma.opsAccommodationRate.create({
          data: {
            vendorId: vendor.id,
            propertyName: acc.name,
            city: acc.city,
            roomCategory: r.roomType,
            sharingType: r.sharing,
            rateBasis: 'PER_PERSON',
            amount: r.amount,
            totalRooms: acc.totalRooms || 0,
            active: true
          }
        });
      }
    }

    // 6. OpsVendorHotelRate
    await prisma.opsVendorHotelRate.deleteMany({ where: { vendorId: vendor.id } });
    for (const hr of acc.hotelRates) {
      await prisma.opsVendorHotelRate.create({
        data: {
          tenantId: 'default',
          vendorId: vendor.id,
          rateName: hr.rateName,
          rateType: hr.rateType,
          doubleRate: hr.doubleRate,
          tripleRate: hr.tripleRate,
          quadRate: hr.quadRate,
          singleRate: hr.singleRate,
          childWithoutBed: hr.childWithoutBed,
          isActive: true
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TRANSPORT FLEETS & TEMPO LIST
  // ─────────────────────────────────────────────────────────────
  const transportConfigs = [
    {
      code: 'VND-TRP-KKP-MKA',
      name: 'Kotkapura Transport Fleets (MKA Trips)',
      type: 'TRANSPORT',
      city: 'Kotkapura',
      location: 'Kotkapura → Kotkapura',
      phone: '98160 11223',
      contactPerson: 'Kotkapura Fleet Manager',
      notes: 'Kotkapura pickup & drop extra: ₹2,000 | Pickup: Kotkapura, Drop: Jalandhar',
      routes: [
        { vehicle: '20 Seater Tempo', capacity: 20, seats: 19, totalCost: 48000, perPerson: 2526, pickup: 'Kotkapura', drop: 'Kotkapura' },
        { vehicle: '17 Seater Tempo', capacity: 17, seats: 16, totalCost: 44000, perPerson: 2750, pickup: 'Kotkapura', drop: 'Kotkapura' },
        { vehicle: '14 Seater Tempo', capacity: 14, seats: 13, totalCost: 38000, perPerson: 2923, pickup: 'Kotkapura', drop: 'Kotkapura' },
        { vehicle: 'Innova (6-7 Seater)', capacity: 7, seats: 6, totalCost: 28000, perPerson: 4667, pickup: 'Kotkapura', drop: 'Kotkapura' },
        { vehicle: 'Ertiga (6 Seater)', capacity: 6, seats: 6, totalCost: 28000, perPerson: 4667, pickup: 'Kotkapura', drop: 'Kotkapura' },
        { vehicle: 'Swift Dzire (4 Seater)', capacity: 4, seats: 4, totalCost: 17500, perPerson: 4375, pickup: 'Kotkapura', drop: 'Kotkapura' },
      ],
      extraCharges: [
        { name: 'Kotkapura to Jalandhar Drop Extra Charge', amount: 2000, basis: 'PER_VEHICLE' }
      ]
    },
    {
      code: 'VND-TRP-JAL-MKA',
      name: 'Jalandhar Transport Fleets (MKA Trips)',
      type: 'TRANSPORT',
      city: 'Jalandhar',
      location: 'Jalandhar → Jalandhar',
      phone: '98160 44556',
      contactPerson: 'Jalandhar Fleet Manager',
      notes: 'Pickup & Drop: Jalandhar → Jalandhar',
      routes: [
        { vehicle: '20 Seater Tempo', capacity: 20, seats: 18, totalCost: 45000, perPerson: 2500, pickup: 'Jalandhar', drop: 'Jalandhar' },
        { vehicle: '17 Seater Tempo', capacity: 17, seats: 16, totalCost: 42000, perPerson: 2625, pickup: 'Jalandhar', drop: 'Jalandhar' },
        { vehicle: '14 Seater Tempo', capacity: 14, seats: 13, totalCost: 38000, perPerson: 2923, pickup: 'Jalandhar', drop: 'Jalandhar' },
        { vehicle: 'Innova (6-7 Seater)', capacity: 7, seats: 6, totalCost: 28000, perPerson: 4667, pickup: 'Jalandhar', drop: 'Jalandhar' },
        { vehicle: 'Ertiga (6 Seater)', capacity: 6, seats: 6, totalCost: 28000, perPerson: 4667, pickup: 'Jalandhar', drop: 'Jalandhar' },
      ],
      extraCharges: []
    }
  ];

  for (const trp of transportConfigs) {
    let vendor = await prisma.opsVendor.findFirst({
      where: {
        OR: [
          { vendorCode: trp.code },
          { name: trp.name }
        ]
      }
    });

    if (vendor) {
      vendor = await prisma.opsVendor.update({
        where: { id: vendor.id },
        data: {
          name: trp.name,
          vendorCode: trp.code,
          type: 'TRANSPORT',
          city: trp.city,
          location: trp.location,
          phone: trp.phone,
          contactPerson: trp.contactPerson,
          notes: trp.notes,
          isActive: true
        }
      });
      console.log(`🔄 Updated Transport Vendor: ${vendor.name} (${vendor.city})`);
    } else {
      vendor = await prisma.opsVendor.create({
        data: {
          vendorCode: trp.code,
          name: trp.name,
          type: 'TRANSPORT',
          city: trp.city,
          location: trp.location,
          phone: trp.phone,
          contactPerson: trp.contactPerson,
          notes: trp.notes,
          isActive: true,
          tenantId: 'default'
        }
      });
      console.log(`✨ Created Transport Vendor: ${vendor.name} (${vendor.city})`);
    }

    // Upsert OpsTripVendor link to MKA-1
    let tripVendor = await prisma.opsTripVendor.findFirst({
      where: { tripId, vendorId: vendor.id, category: 'TRANSPORT' }
    });

    if (!tripVendor) {
      tripVendor = await prisma.opsTripVendor.create({
        data: {
          tripId,
          vendorId: vendor.id,
          category: 'TRANSPORT',
          preferred: true,
          active: true,
          notes: trp.notes
        }
      });
    }

    // Upsert OpsTransportRate
    for (const r of trp.routes) {
      const existingTrpRate = await prisma.opsTransportRate.findFirst({
        where: {
          vendorId: vendor.id,
          vehicleType: r.vehicle,
          pickupLocation: r.pickup
        }
      });

      if (existingTrpRate) {
        await prisma.opsTransportRate.update({
          where: { id: existingTrpRate.id },
          data: {
            tripCode: 'MKA-1',
            routeName: `${r.pickup} → ${r.drop}`,
            pickupLocation: r.pickup,
            dropLocation: r.drop,
            advertisedCapacity: r.capacity,
            sellableSeats: r.seats,
            totalVehicleCost: r.totalCost,
            notes: `₹${r.perPerson}/pax (${r.seats} pax capacity)`,
            active: true
          }
        });
      } else {
        await prisma.opsTransportRate.create({
          data: {
            vendorId: vendor.id,
            tripCode: 'MKA-1',
            routeName: `${r.pickup} → ${r.drop}`,
            pickupLocation: r.pickup,
            dropLocation: r.drop,
            vehicleType: r.vehicle,
            advertisedCapacity: r.capacity,
            sellableSeats: r.seats,
            totalVehicleCost: r.totalCost,
            notes: `₹${r.perPerson}/pax (${r.seats} pax capacity)`,
            active: true
          }
        });
      }

      // Also upsert OpsTripVendorRate
      const existingTripVendorRate = await prisma.opsTripVendorRate.findFirst({
        where: {
          tripVendorId: tripVendor.id,
          vehicleType: r.vehicle,
          routeName: `${r.pickup} → ${r.drop}`
        }
      });

      if (existingTripVendorRate) {
        await prisma.opsTripVendorRate.update({
          where: { id: existingTripVendorRate.id },
          data: {
            amount: r.totalCost,
            sellableSeats: r.seats,
            rateBasis: 'PER_VEHICLE',
            notes: `₹${r.perPerson}/pax`,
            active: true
          }
        });
      } else {
        await prisma.opsTripVendorRate.create({
          data: {
            tripVendorId: tripVendor.id,
            city: trp.city,
            rateType: 'TRANSPORT',
            vehicleType: r.vehicle,
            routeName: `${r.pickup} → ${r.drop}`,
            rateBasis: 'PER_VEHICLE',
            amount: r.totalCost,
            sellableSeats: r.seats,
            notes: `₹${r.perPerson}/pax`,
            active: true
          }
        });
      }
    }

    // Extra charges
    if (trp.extraCharges && trp.extraCharges.length > 0) {
      for (const ec of trp.extraCharges) {
        const existingCharge = await prisma.opsVendorAdditionalCharge.findFirst({
          where: { vendorId: vendor.id, chargeName: ec.name }
        });
        if (!existingCharge) {
          await prisma.opsVendorAdditionalCharge.create({
            data: {
              vendorId: vendor.id,
              tripCode: 'MKA-1',
              chargeName: ec.name,
              rateBasis: ec.basis,
              amount: ec.amount,
              active: true
            }
          });
        }
      }
    }
  }

  console.log('🎉 Successfully fed all MKA-1 Stays and Transport Fleets into database!');
  process.exit(0);
}

feedMkaVendors().catch(err => {
  console.error('❌ Seeder error:', err);
  process.exit(1);
});
