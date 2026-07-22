const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookingsToRevert = [
    { id: 'BK-SPITI-G1', prevPaid: 15000, finalAmt: 70500 },
    { id: 'BK-SPITI-G2', prevPaid: 10000, finalAmt: 53000 }
  ];

  for (const b of bookingsToRevert) {
    const booking = await prisma.booking.findUnique({ where: { bookingId: b.id } });
    if (!booking) {
      console.log(`Booking ${b.id} not found.`);
      continue;
    }

    // Find the station payments
    const payments = await prisma.stationPaymentCollection.findMany({
      where: { bookingId: b.id }
    });

    for (const p of payments) {
      console.log(`Deleting Station Payment ${p.receiptNumber} for ${b.id}`);
      
      // Delete Accounting Entry
      await prisma.accountingEntry.deleteMany({
        where: { referenceNumber: p.receiptNumber }
      });
      
      // Delete Activity Logs
      await prisma.bookingActivityLog.deleteMany({
        where: { bookingId: booking.id, details: { contains: p.receiptNumber } }
      });

      // Delete the payment collection record
      await prisma.stationPaymentCollection.delete({
        where: { id: p.id }
      });
    }

    // Revert Booking amounts
    const remaining = Math.max(0, b.finalAmt - b.prevPaid);
    const paymentStatus = remaining <= 0 ? 'PAID' : (b.prevPaid > 0 ? 'PARTIAL' : 'Pending');
    const payment_status = remaining <= 0 ? 'paid' : (b.prevPaid > 0 ? 'partial' : 'pending');

    await prisma.booking.update({
      where: { bookingId: b.id },
      data: {
        advancePaid: b.prevPaid,
        remainingAmount: remaining,
        paymentStatus,
        payment_status
      }
    });

    console.log(`Reverted booking ${b.id} to advancePaid: ${b.prevPaid}, remaining: ${remaining}`);
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
