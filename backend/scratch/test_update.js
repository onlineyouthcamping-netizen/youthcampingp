const { prisma } = require('../src/lib/prisma');

async function test() {
  try {
    const booking = await prisma.booking.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    if (!booking) {
      console.log('No booking to update');
      return;
    }
    console.log('Before update, departureDate:', booking.departureDate);
    
    // Simulate req.body
    const reqBody = { departureDate: '2026-06-30' };
    const { email, ...updateData } = reqBody;
    
    let currentPassengers = booking.passengers || { details: {}, persons: [] };
    if (!currentPassengers.details) currentPassengers = { details: currentPassengers, persons: [] };

    updateData.passengers = {
      details: {
        ...currentPassengers.details,
        trainClass: updateData.trainClass !== undefined ? updateData.trainClass : currentPassengers.details.trainClass,
        ticketStatus: updateData.ticketStatus !== undefined ? updateData.ticketStatus : currentPassengers.details.ticketStatus,
        roomType: updateData.roomType !== undefined ? updateData.roomType : currentPassengers.details.roomType,
        basePrice: updateData.basePrice !== undefined ? updateData.basePrice : currentPassengers.details.basePrice,
        gstAmount: updateData.gstAmount !== undefined ? updateData.gstAmount : currentPassengers.details.gstAmount,
      },
      persons: updateData.passengers !== undefined ? updateData.passengers : currentPassengers.persons
    };

    delete updateData.trainClass;
    delete updateData.ticketStatus;
    delete updateData.roomType;
    delete updateData.basePrice;
    delete updateData.gstAmount;

    if (updateData.departureDate !== undefined && updateData.departureDate !== null) {
      updateData.departureDate = new Date(updateData.departureDate);
    }

    const result = await prisma.booking.updateMany({
      where: { id: booking.id, tenantId: 'default' },
      data: updateData
    });
    console.log('Update result:', result);

    const updated = await prisma.booking.findUnique({
      where: { id: booking.id }
    });
    console.log('After update, departureDate:', updated.departureDate);
  } catch (e) {
    console.error('Error during update simulation:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
