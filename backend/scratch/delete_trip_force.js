const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const tripId = 'MKA-2';
  
  // Check bookings first
  const b = await prisma.booking.count({ where: { tripId } });
  if (b > 0) { console.log("Cannot delete, has bookings"); return; }
  
  // Clean up Ops Allocation Runs and other ops
  await prisma.opsAllocationRun.deleteMany({ where: { tripId } });
  await prisma.opsTripVendor.deleteMany({ where: { tripId } });
  await prisma.opsHotelBooking.deleteMany({ where: { tripId } });
  await prisma.opsTransportFleet.deleteMany({ where: { tripId } });
  await prisma.opsGuidePayment.deleteMany({ where: { tripId } });
  await prisma.opsMiscExpense.deleteMany({ where: { tripId } });
  
  await prisma.tripAssignment.deleteMany({ where: { tripId } });
  await prisma.tripVendor.deleteMany({ where: { tripId } });
  
  await prisma.tripSop.deleteMany({ where: { tripId } });
  await prisma.tripDocument.deleteMany({ where: { tripId } });
  await prisma.tripGallery.deleteMany({ where: { tripId } });
  await prisma.tripNote.deleteMany({ where: { tripId } });
  
  await prisma.trainTemplate.deleteMany({ where: { tripId } });
  
  await prisma.itineraryDay.deleteMany({ where: { itinerary: { tripId } } });
  await prisma.itineraryRouteMap.deleteMany({ where: { itinerary: { tripId } } });
  await prisma.itineraryInclusion.deleteMany({ where: { itinerary: { tripId } } });
  await prisma.itineraryExclusion.deleteMany({ where: { itinerary: { tripId } } });
  await prisma.itineraryNote.deleteMany({ where: { itinerary: { tripId } } });
  await prisma.itinerary.deleteMany({ where: { tripId } });
  
  await prisma.trip.delete({ where: { id: tripId } });
  console.log(`Successfully deleted ${tripId} and all related records!`);
}
run().catch(console.error).finally(() => prisma.$disconnect());
