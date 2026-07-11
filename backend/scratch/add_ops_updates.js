const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/opsController.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Modify createHotelBooking to support update
const oldCreateHotel = `    const booking = await prisma.opsHotelBooking.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        vendorId: vendorId || null,
        hotelName,
        location,
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        roomType,
        numberOfRooms: parseInt(numberOfRooms || 1),
        confirmed: confirmed || 'UNCONFIRMED',
        totalAmount: tot,
        advancePaid: adv,
        balanceAmount: tot - adv,
        contactPerson,
        contactPhone,
        notes
      }
    });`;

const newCreateHotel = `    let booking;
    if (req.body.id) {
      booking = await prisma.opsHotelBooking.update({
        where: { id: req.body.id },
        data: {
          vendorId: vendorId || null,
          hotelName,
          location,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          roomType,
          numberOfRooms: parseInt(numberOfRooms || 1),
          confirmed: confirmed || 'UNCONFIRMED',
          totalAmount: tot,
          advancePaid: adv,
          balanceAmount: tot - adv,
          contactPerson,
          contactPhone,
          notes
        }
      });
    } else {
      booking = await prisma.opsHotelBooking.create({
        data: {
          tenantId: ctx.tenantId,
          tripId: ctx.tripId,
          departureDate: ctx.departureDate,
          vendorId: vendorId || null,
          hotelName,
          location,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          roomType,
          numberOfRooms: parseInt(numberOfRooms || 1),
          confirmed: confirmed || 'UNCONFIRMED',
          totalAmount: tot,
          advancePaid: adv,
          balanceAmount: tot - adv,
          contactPerson,
          contactPhone,
          notes
        }
      });
    }`;

content = content.replace(oldCreateHotel, newCreateHotel);

// 2. Modify createTransportFleet to support update
const oldCreateTransport = `    const vehicle = await prisma.opsTransportFleet.create({
      data: {
        tenantId: ctx.tenantId,
        tripId: ctx.tripId,
        departureDate: ctx.departureDate,
        vendorId: vendorId || null,
        vehicleType,
        capacity: parseInt(capacity || 13),
        route,
        pickupPoints,
        dropPoints,
        totalAmount: tot,
        advancePaid: adv,
        balanceAmount: tot - adv,
        driverName,
        driverPhone,
        notes
      }
    });`;

const newCreateTransport = `    let vehicle;
    if (req.body.id) {
      vehicle = await prisma.opsTransportFleet.update({
        where: { id: req.body.id },
        data: {
          vendorId: vendorId || null,
          vehicleType,
          capacity: parseInt(capacity || 13),
          route,
          pickupPoints,
          dropPoints,
          totalAmount: tot,
          advancePaid: adv,
          balanceAmount: tot - adv,
          driverName,
          driverPhone,
          notes
        }
      });
    } else {
      vehicle = await prisma.opsTransportFleet.create({
        data: {
          tenantId: ctx.tenantId,
          tripId: ctx.tripId,
          departureDate: ctx.departureDate,
          vendorId: vendorId || null,
          vehicleType,
          capacity: parseInt(capacity || 13),
          route,
          pickupPoints,
          dropPoints,
          totalAmount: tot,
          advancePaid: adv,
          balanceAmount: tot - adv,
          driverName,
          driverPhone,
          notes
        }
      });
    }`;

content = content.replace(oldCreateTransport, newCreateTransport);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Backend opsController update capabilities added successfully!");
