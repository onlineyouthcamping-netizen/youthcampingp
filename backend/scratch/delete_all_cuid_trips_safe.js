const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const trips = await prisma.trip.findMany({ select: { id: true, title: true } });
  
  // We want to delete trips where ID starts with "c" (since standard ones are SPT-1, MKA-1, MKB, etc.)
  const toDelete = trips.filter(t => t.id.startsWith('c') || t.id.startsWith('C'));
  
  console.log(`Found ${toDelete.length} broken trips to delete.`);

  const safeDelete = async (modelName, whereClause) => {
    if (prisma[modelName]) {
      await prisma[modelName].deleteMany({ where: whereClause }).catch(() => {});
    }
  };

  for (const trip of toDelete) {
    const id = trip.id;
    try {
      await safeDelete('inquiry', { tripId: id });
      await safeDelete('review', { tripId: id });
      await safeDelete('opsSeatConfig', { tripId: id });
      await safeDelete('opsItinerary', { tripId: id });
      await safeDelete('opsAttraction', { tripId: id });
      await safeDelete('opsPackingItem', { tripId: id });
      await safeDelete('opsInclusionExclusion', { tripId: id });
      await safeDelete('opsFaq', { tripId: id });
      await safeDelete('opsTripChecklist', { tripId: id });
      await safeDelete('opsIncidentLog', { tripId: id });
      await safeDelete('opsHotelBooking', { tripId: id });
      await safeDelete('opsTransportFleet', { tripId: id });
      await safeDelete('opsGuidePayment', { tripId: id });
      await safeDelete('opsMiscExpense', { tripId: id });
      await safeDelete('opsTripExpense', { tripId: id });
      await safeDelete('opsTripLeader', { tripId: id });
      await safeDelete('tripAssignment', { tripId: id });
      await safeDelete('tripVendor', { tripId: id });
      await safeDelete('opsRoomInventory', { tripId: id });
      await safeDelete('opsAllocationRun', { tripId: id });
      await safeDelete('opsVehicleAllocation', { tripId: id });
      await safeDelete('opsRoomAllocation', { tripId: id });
      await safeDelete('opsDayItinerary', { tripId: id });
      await safeDelete('opsActivity', { tripId: id });
      await safeDelete('opsVendorPayment', { tripId: id });
      await safeDelete('opsDocument', { tripId: id });
      await safeDelete('opsMessage', { tripId: id });
      await safeDelete('tripDocument', { tripId: id });
      await safeDelete('tripDeparture', { tripId: id });
      await safeDelete('booking', { tripId: id });

      await prisma.trip.delete({ where: { id: id } });
      console.log(`Deleted trip ${id} - ${trip.title}`);
    } catch (e) {
      console.error(`Failed to delete ${id}:`, e.message);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
