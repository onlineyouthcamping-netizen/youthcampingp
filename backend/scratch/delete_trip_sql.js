const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function forceDeleteTrip(tripId) {
  const tables = [
    'Booking', 'OpsAllocationRun', 'OpsTripVendor', 'OpsHotelBooking',
    'OpsTransportFleet', 'OpsGuidePayment', 'OpsMiscExpense', 'TripAssignment',
    'TripVendor', 'TripSop', 'TripSopVersion', 'TripSopItem', 'TripDocument',
    'TripDocumentVersion', 'TripGallery', 'TripNotice', 'TripNoticeAck',
    'TripNote', 'TrainTemplate', 'Itinerary', 'ItineraryDay', 'ItineraryRouteMap',
    'ItineraryInclusion', 'ItineraryExclusion', 'ItineraryNote', 'OpsMessage',
    'OpsTripChecklist', 'OpsSeatConfig', 'Passenger'
  ];
  for (const table of tables) {
    try { await prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE "tripId" = '${tripId}'`); } catch (e) {}
  }
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Trip" WHERE "id" = '${tripId}'`);
    console.log(`Successfully deleted ${tripId}`);
  } catch(e) { console.error("Failed to delete Trip:", e.message); }
}
async function run() { await forceDeleteTrip('MKB'); }
run().catch(console.error).finally(() => prisma.$disconnect());
