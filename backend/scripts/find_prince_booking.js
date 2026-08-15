const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findPrince() {
  console.log('--- 1. Searching in Bookings Table ---');
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { name: { contains: 'princ', mode: 'insensitive' } },
        { fullName: { contains: 'princ', mode: 'insensitive' } },
        { notes: { contains: 'princ', mode: 'insensitive' } },
        { adminNotes: { contains: 'princ', mode: 'insensitive' } },
      ]
    },
    include: {
      tripRef: { select: { title: true } }
    }
  });

  console.log('Bookings matching "princ":', bookings.length);
  bookings.forEach(b => {
    console.log({
      id: b.id,
      bookingId: b.bookingId,
      name: b.name,
      fullName: b.fullName,
      phone: b.phone || b.mobile,
      trip: b.tripRef?.title || b.tripName,
      amount: b.totalAmount || b.amount,
      status: b.status,
      paymentStatus: b.paymentStatus,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    });
  });

  console.log('\n--- 2. Searching in Inquiries Table ---');
  const inquiries = await prisma.inquiry.findMany({
    where: {
      OR: [
        { name: { contains: 'princ', mode: 'insensitive' } },
        { message: { contains: 'princ', mode: 'insensitive' } },
      ]
    }
  });
  console.log('Inquiries matching "princ":', inquiries.length);
  inquiries.forEach(i => console.log(i));

  console.log('\n--- 3. Searching in All Audit Logs ---');
  const allAudit = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  console.log(`Checking last ${allAudit.length} audit logs...`);
  const matchingAudit = allAudit.filter(a => JSON.stringify(a).toLowerCase().includes('princ'));
  console.log('Audit logs with "princ":', matchingAudit.length);
  matchingAudit.forEach(a => console.log(JSON.stringify(a, null, 2)));

  console.log('\n--- 4. Checking Last 20 Cancelled / Deleted Bookings ---');
  const cancelledBookings = await prisma.booking.findMany({
    where: {
      status: { in: ['cancelled', 'Cancelled', 'CANCELLED', 'rejected', 'Rejected'] }
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    include: {
      tripRef: { select: { title: true } }
    }
  });
  console.log('Total Cancelled Bookings found:', cancelledBookings.length);
  cancelledBookings.forEach(b => {
    console.log({
      id: b.id,
      bookingId: b.bookingId,
      name: b.name || b.fullName,
      phone: b.phone || b.mobile,
      trip: b.tripRef?.title || b.tripName,
      amount: b.totalAmount || b.amount,
      status: b.status,
      updatedAt: b.updatedAt
    });
  });
}

findPrince()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
