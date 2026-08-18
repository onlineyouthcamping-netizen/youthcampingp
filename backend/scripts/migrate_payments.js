const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      advancePaid: { gt: 0 },
      opsClientPayments: { none: {} }
    }
  });

  console.log(`Found ${bookings.length} bookings to migrate.`);

  for (const b of bookings) {
    let txId = null;
    let paymentMode = b.paymentMode || 'UPI';

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { bookingId: b.bookingId },
          { bookingId: b.id }
        ]
      }
    });

    if (payments.length > 0) {
      const p = payments[0];
      if (p.transactionId) txId = p.transactionId;
      if (p.paymentMode) paymentMode = p.paymentMode;
    }

    await prisma.opsClientPayment.create({
      data: {
        tenantId: b.tenantId || 'default',
        bookingId: b.bookingId || b.id,
        amount: b.advancePaid,
        paymentMode: paymentMode,
        transactionId: txId,
        status: 'Pending Verification',
        approvalStatus: 'PENDING',
        paymentDate: b.createdAt,
        collectedBy: 'Legacy Migration'
      }
    });
    console.log(`Migrated booking ${b.bookingId}`);
  }

  // Also make sure any existing OpsClientPayment is set to Pending Verification as requested
  const updated = await prisma.opsClientPayment.updateMany({
    where: {
      status: { not: 'Pending Verification' }
    },
    data: {
      status: 'Pending Verification',
      approvalStatus: 'PENDING',
      reviewedByFinanceAt: null,
      reviewedByFinanceId: null,
      approvedByFounderAt: null,
      approvedByFounderId: null
    }
  });
  console.log(`Reset ${updated.count} existing OpsClientPayments to pending.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
