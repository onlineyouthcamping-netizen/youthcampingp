const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Deleting ALL bookings from the database...");

  try {
    // Delete dependent tables first if they exist
    if (prisma.opsRoomAllocation) await prisma.opsRoomAllocation.deleteMany({}).catch(() => {});
    if (prisma.opsVehicleAllocation) await prisma.opsVehicleAllocation.deleteMany({}).catch(() => {});
    if (prisma.bookingActivityLog) await prisma.bookingActivityLog.deleteMany({}).catch(() => {});
    if (prisma.accountingEntry) await prisma.accountingEntry.deleteMany({}).catch(() => {});
    if (prisma.payment) await prisma.payment.deleteMany({}).catch(() => {});
    if (prisma.refund) await prisma.refund.deleteMany({}).catch(() => {});
    if (prisma.bookingDocument) await prisma.bookingDocument.deleteMany({}).catch(() => {});
    
    // Finally, delete all bookings
    const result = await prisma.booking.deleteMany({});
    
    console.log(`Successfully deleted ${result.count} bookings from the system.`);
  } catch (error) {
    console.error("Error deleting bookings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
