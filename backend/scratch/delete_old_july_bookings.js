const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Locating all bookings for Spiti Valley (SPT-1) on 2027-07-21 departure...");

    // Find all bookings for SPT-1 on July 21st 2026 that DO NOT belong to the new spreadsheet import
    const newBookingIds = [
      'BK-800001', 'BK-800002', 'BK-800003', 'BK-800004', 'BK-800005',
      'BK-800006', 'BK-800007', 'BK-800008', 'BK-800009', 'BK-800010', 'BK-800011'
    ];

    const oldBookings = await prisma.booking.findMany({
      where: {
        tripId: 'SPT-1',
        departureDate: {
          in: [new Date("2026-07-21T00:00:00.000Z"), new Date("2027-07-21T00:00:00.000Z")]
        },
        bookingId: {
          notIn: newBookingIds
        }
      },
      select: { id: true, bookingId: true, name: true }
    });

    console.log(`Found ${oldBookings.length} old bookings to remove:`, oldBookings.map(b => `${b.bookingId} - ${b.name}`));

    if (oldBookings.length > 0) {
      const ids = oldBookings.map(b => b.id);
      const friendlyBookingIds = oldBookings.map(b => b.bookingId);

      await prisma.opsRoomAllocation.deleteMany({ where: { bookingId: { in: friendlyBookingIds } } }).catch(() => {});
      await prisma.opsVehicleAllocation.deleteMany({ where: { bookingId: { in: friendlyBookingIds } } }).catch(() => {});
      await prisma.bookingActivityLog.deleteMany({ where: { bookingId: { in: ids } } }).catch(() => {});
      await prisma.accountingEntry.deleteMany({ where: { bookingId: { in: ids } } }).catch(() => {});
      const delRes = await prisma.booking.deleteMany({ where: { id: { in: ids } } });
      console.log(`Successfully deleted ${delRes.count} obsolete bookings.`);
    } else {
      console.log("No old bookings found on this departure date.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
