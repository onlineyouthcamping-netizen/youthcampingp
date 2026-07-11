const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/opsController.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update createHotelBooking
const hotelStartIdx = content.indexOf('exports.createHotelBooking = async');
if (hotelStartIdx !== -1) {
  const createIdx = content.indexOf('prisma.opsHotelBooking.create', hotelStartIdx);
  const endIdx = content.indexOf('return res.status(201)', createIdx);
  if (createIdx !== -1 && endIdx !== -1) {
    const oldCreateBlock = content.substring(createIdx, endIdx);
    console.log("Found old hotel block");
    
    const newCreateBlock = `let booking;
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
    }
    
    `;
    content = content.substring(0, createIdx) + newCreateBlock + content.substring(endIdx);
  }
}

// 2. Update createTransportFleet
const transportStartIdx = content.indexOf('exports.createTransportFleet = async');
if (transportStartIdx !== -1) {
  const createIdx = content.indexOf('prisma.opsTransportFleet.create', transportStartIdx);
  const endIdx = content.indexOf('return res.status(201)', createIdx);
  if (createIdx !== -1 && endIdx !== -1) {
    console.log("Found old transport block");
    const newCreateBlock = `let vehicle;
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
    }
    
    `;
    content = content.substring(0, createIdx) + newCreateBlock + content.substring(endIdx);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Backend opsController update capabilities robustly added!");
