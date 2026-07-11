const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../backend/src/controllers/opsController.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update createHotelBooking
const hotelStartIdx = content.indexOf('const booking = await prisma.opsHotelBooking.create');
if (hotelStartIdx !== -1) {
  const hotelEndIdx = content.indexOf('return res.status(201)', hotelStartIdx);
  if (hotelEndIdx !== -1) {
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
    content = content.substring(0, hotelStartIdx) + newCreateBlock + content.substring(hotelEndIdx);
  }
}

// 2. Update createTransportFleet
const transportStartIdx = content.indexOf('const vehicle = await prisma.opsTransportFleet.create');
if (transportStartIdx !== -1) {
  const transportEndIdx = content.indexOf('return res.status(201)', transportStartIdx);
  if (transportEndIdx !== -1) {
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
    content = content.substring(0, transportStartIdx) + newCreateBlock + content.substring(transportEndIdx);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Backend opsController update capabilities added with perfect syntax!");
