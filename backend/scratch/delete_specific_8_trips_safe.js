const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const idsToDelete = [
    "cmrnddtla0015a730787vwldp",
    "cmrnddtkb0014a730m6ern11p",
    "cmrnddtji0013a7306se89klg",
    "cmrnddtim0012a730jmuphy5o",
    "cmrnddthk0011a730e7vxwwc7",
    "cmrlua57l000gcex7zkoibz6x",
    "cmrlua2ae0000cex7ekbv7918",
    "cmrltnbtv0001owdt8cjkpma6"
  ];

  console.log("Will delete:", idsToDelete);

  const safeDelete = async (modelName, whereClause) => {
    if (prisma[modelName]) {
      await prisma[modelName].deleteMany({ where: whereClause }).catch(() => {});
    }
  };

  for (const id of idsToDelete) {
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
      await safeDelete('booking', { tripId: id }); // Ensure all bookings are cleared

      await prisma.trip.delete({ where: { id: id } });
      console.log(`Deleted ${id}`);
    } catch (e) {
      console.error(`Failed to delete ${id}:`, e.message);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
