const { prisma } = require('../src/lib/prisma');
async function run() {
  const bk = await prisma.booking.findUnique({ where: { bookingId: 'BK-SPITI-G1' } });
  console.log(bk.advancePaid, bk.remainingAmount, bk.paymentStatus);
}
run();
