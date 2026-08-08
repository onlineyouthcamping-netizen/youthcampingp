const { prisma } = require("../lib/prisma");

exports.saveAssignment = async (tripId, departureDateStr, assignment) => {
  const departureDate = new Date(departureDateStr);

  return await prisma.opsHotelBooking.create({
    data: {
      tripId,
      departureDate,
      vendorId: assignment.vendorId,
      hotelName: assignment.vendorName,
      confirmed: "UNCONFIRMED",
      totalAmount: assignment.contractRate, // Simplification
      priorityScore: assignment.priorityScore,
      contractRate: assignment.contractRate
    }
  });
};

exports.addCommunication = async (bookingId, logEntry) => {
  const booking = await prisma.opsHotelBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  return await prisma.opsHotelCommunication.create({
    data: {
      hotelBookingId: bookingId,
      type: logEntry.type || "SYSTEM",
      direction: logEntry.direction || "OUTGOING",
      message: logEntry.message || logEntry.action || "Log entry",
      reference: logEntry.reference,
      createdBy: logEntry.user
    }
  });
};

exports.attachFile = async (bookingId, uploadData) => {
  const booking = await prisma.opsHotelBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  return await prisma.opsHotelAttachment.create({
    data: {
      hotelBookingId: bookingId,
      fileUrl: uploadData.url,
      fileType: uploadData.fileType || "IMAGE",
      uploadedBy: uploadData.uploadedBy
    }
  });
};

exports.confirmHotel = async (bookingId, details) => {
  const booking = await prisma.opsHotelBooking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");
  if (booking.isLocked) throw new Error("This assignment is locked and cannot be modified directly.");

  // 1. Update Booking and Lock it
  const updatedBooking = await prisma.opsHotelBooking.update({
    where: { id: bookingId },
    data: { 
      confirmed: "CONFIRMED",
      confirmationNumber: details.confirmationNumber,
      confirmedBy: details.confirmedBy,
      confirmedAt: new Date(),
      remarks: details.remarks,
      isLocked: true // Assignment Lock
    }
  });

  // 2. Add System Communication Log
  await prisma.opsHotelCommunication.create({
    data: {
      hotelBookingId: bookingId,
      type: "SYSTEM",
      message: "Hotel Confirmed",
      reference: details.confirmationNumber,
      createdBy: details.confirmedBy
    }
  });

  // Accounting Ledger hook removed based on Ops separation rules

  return updatedBooking;
};
