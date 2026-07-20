const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function forceDeleteTrip(tripId) {
  // Clean up ALL relations first
  try { await prisma.opsTripChecklist.deleteMany({ where: { tripId } }); } catch(e){}
  try { await prisma.opsAllocationRun.deleteMany({ where: { tripId } }); } catch(e){}
  try { await prisma.opsTripVendor.deleteMany({ where: { tripId } }); } catch(e){}
  try { await prisma.opsHotelBooking.deleteMany({ where: { tripId } }); } catch(e){}
  try { await prisma.opsTransportFleet.deleteMany({ where: { tripId } }); } catch(e){}
  try { await prisma.opsGuidePayment.deleteMany({ where: { tripId } }); } catch(e){}
  try { await prisma.opsMiscExpense.deleteMany({ where: { tripId } }); } catch(e){}
  
  try { await prisma.tripAssignment.deleteMany({ where: { tripId } }); } catch(e){}
  try { await prisma.tripVendor.deleteMany({ where: { tripId } }); } catch(e){}
  
  try { await prisma.tripSopItem.deleteMany({ where: { tripSopVersion: { tripSop: { tripId } } } }); } catch(e){}
  try { await prisma.tripSopVersion.deleteMany({ where: { tripSop: { tripId } } }); } catch(e){}
  try { await prisma.tripSop.deleteMany({ where: { tripId } }); } catch(e){}
  
  try { await prisma.tripDocumentVersion.deleteMany({ where: { tripDocument: { tripId } } }); } catch(e){}
  try { await prisma.tripDocument.deleteMany({ where: { tripId } }); } catch(e){}
  
  try { await prisma.tripGallery.deleteMany({ where: { tripId } }); } catch(e){}
  
  try { await prisma.tripNoticeAck.deleteMany({ where: { tripNotice: { tripId } } }); } catch(e){}
  try { await prisma.tripNotice.deleteMany({ where: { tripId } }); } catch(e){}
  
  try { await prisma.tripNote.deleteMany({ where: { tripId } }); } catch(e){}
  try { await prisma.trainTemplate.deleteMany({ where: { tripId } }); } catch(e){}
  
  try { await prisma.itineraryDay.deleteMany({ where: { itinerary: { tripId } } }); } catch(e){}
  try { await prisma.itineraryRouteMap.deleteMany({ where: { itinerary: { tripId } } }); } catch(e){}
  try { await prisma.itineraryInclusion.deleteMany({ where: { itinerary: { tripId } } }); } catch(e){}
  try { await prisma.itineraryExclusion.deleteMany({ where: { itinerary: { tripId } } }); } catch(e){}
  try { await prisma.itineraryNote.deleteMany({ where: { itinerary: { tripId } } }); } catch(e){}
  try { await prisma.itinerary.deleteMany({ where: { tripId } }); } catch(e){}
  
  await prisma.trip.delete({ where: { id: tripId } });
  console.log(`Successfully deleted ${tripId}`);
}
async function run() {
  await forceDeleteTrip('MKA-2');
}
run().catch(console.error).finally(() => prisma.$disconnect());
