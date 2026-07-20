const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const trips = await prisma.trip.findMany({
    select: { id: true, title: true, tripCode: true }
  });
  console.log("Found trips:", trips);

  // The 8 trips to delete seem to have long CUIDs as their IDs or tripCodes
  // Let's filter for those starting with 'cmr'
  const toDelete = trips.filter(t => t.id.startsWith('cmr') || t.id.startsWith('cmrl') || (t.tripCode && t.tripCode.startsWith('cmr')));
  console.log("Will delete:", toDelete);

  for (const trip of toDelete) {
    try {
      // First clean up constraints
      await prisma.inquiry.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.review.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsSeatConfig.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsItinerary.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsAttraction.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsPackingItem.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsInclusionExclusion.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsFaq.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsTripChecklist.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsIncidentLog.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsHotelBooking.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsTransportFleet.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsGuidePayment.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsMiscExpense.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsTripExpense.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsTripLeader.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.tripAssignment.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.tripVendor.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsRoomInventory.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsAllocationRun.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsVehicleAllocation.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsRoomAllocation.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsDayItinerary.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsActivity.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsVendorPayment.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsDocument.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.opsMessage.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.tripDocument.deleteMany({ where: { tripId: trip.id } }).catch(() => {});
      await prisma.tripDeparture.deleteMany({ where: { tripId: trip.id } }).catch(() => {});

      await prisma.trip.delete({ where: { id: trip.id } });
      console.log(`Deleted ${trip.id}`);
    } catch (e) {
      console.error(`Failed to delete ${trip.id}:`, e.message);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
