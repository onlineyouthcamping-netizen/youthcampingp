const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Searching for recently cancelled/deleted bookings...');
  
  const lastCancelled = await prisma.booking.findFirst({
    where: {
      status: { in: ['cancelled', 'Cancelled', 'CANCELLED', 'rejected', 'Rejected'] }
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      tripRef: { select: { title: true } }
    }
  });

  if (!lastCancelled) {
    console.log('⚠️ No cancelled bookings found in the database.');
    return;
  }

  console.log('📋 Found Last Cancelled/Deleted Booking:');
  console.log('--------------------------------------------');
  console.log(`Booking ID : ${lastCancelled.bookingId} (${lastCancelled.id})`);
  console.log(`Customer   : ${lastCancelled.name || lastCancelled.fullName} (${lastCancelled.phone || lastCancelled.mobile})`);
  console.log(`Trip       : ${lastCancelled.tripRef?.title || lastCancelled.tripName || lastCancelled.tripId}`);
  console.log(`Amount     : ₹${lastCancelled.totalAmount || lastCancelled.amount}`);
  console.log(`Status     : ${lastCancelled.status}`);
  console.log(`Last Update: ${lastCancelled.updatedAt}`);
  console.log('--------------------------------------------');

  const restored = await prisma.booking.update({
    where: { id: lastCancelled.id },
    data: {
      status: 'confirmed',
      updatedAt: new Date()
    }
  });

  // Log activity
  try {
    await prisma.bookingActivityLog.create({
      data: {
        bookingId: lastCancelled.id,
        action: 'STATUS_CHANGE',
        details: `Booking restored from '${lastCancelled.status}' to 'confirmed'`,
        performedByAdminId: 'system'
      }
    });
  } catch (err) {
    // optional log
  }

  console.log(`✅ SUCCESS: Booking ${restored.bookingId} has been restored to 'confirmed' status!`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Error restoring booking:', e.message);
    prisma.$disconnect();
    process.exit(1);
  });
