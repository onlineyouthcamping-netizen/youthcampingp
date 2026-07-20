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

  for (const id of idsToDelete) {
    try {
      // Clean up constraints
      await prisma.inquiry.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.review.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsSeatConfig.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsItinerary.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsAttraction.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsPackingItem.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsInclusionExclusion.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsFaq.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsTripChecklist.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsIncidentLog.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsHotelBooking.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsTransportFleet.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsGuidePayment.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsMiscExpense.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsTripExpense.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsTripLeader.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.tripAssignment.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.tripVendor.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsRoomInventory.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsAllocationRun.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsVehicleAllocation.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsRoomAllocation.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsDayItinerary.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsActivity.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsVendorPayment.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsDocument.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.opsMessage.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.tripDocument.deleteMany({ where: { tripId: id } }).catch(() => {});
      await prisma.tripDeparture.deleteMany({ where: { tripId: id } }).catch(() => {});

      await prisma.trip.delete({ where: { id: id } });
      console.log(`Deleted ${id}`);
    } catch (e) {
      console.error(`Failed to delete ${id}:`, e.message);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
