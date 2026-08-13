const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookingId = 'cmsmzundw000ful2vyn4jvvzw';
  const paramBookingId = 'BK-7Q8CG3K567P5';

  console.log('🔍 Checking payments for booking:', paramBookingId);

  // Check standard Payment table
  const payments = await prisma.payment.findMany({
    where: {
      OR: [{ bookingId: bookingId }, { bookingId: paramBookingId }]
    }
  });
  console.log('Standard Payments:', payments);

  // Check OpsClientPayment table
  const opsPayments = await prisma.opsClientPayment ? await prisma.opsClientPayment.findMany({
    where: {
      OR: [{ bookingId: bookingId }, { bookingId: paramBookingId }]
    }
  }) : [];
  console.log('Ops Client Payments:', opsPayments);

  // Delete standard Payment if duplicate (id: cmsr75k9q0007sz1v6gk3op1b or any payment created around 07:28)
  if (payments.length > 0) {
    const deleted = await prisma.payment.deleteMany({
      where: {
        OR: [{ bookingId: bookingId }, { bookingId: paramBookingId }],
        id: 'cmsr75k9q0007sz1v6gk3op1b'
      }
    });
    console.log('🗑️ Deleted standard payment count:', deleted.count);
  }

  // Update booking totals
  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      advancePaid: 3000,
      remainingAmount: 12000
    }
  });

  console.log('✅ Booking updated successfully:', {
    id: updatedBooking.id,
    bookingId: updatedBooking.bookingId,
    advancePaid: updatedBooking.advancePaid,
    remainingAmount: updatedBooking.remainingAmount
  });
}

main()
  .catch((err) => {
    console.error('Error removing duplicate payment:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
