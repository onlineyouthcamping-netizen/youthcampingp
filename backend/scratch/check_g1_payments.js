const { prisma } = require('../src/lib/prisma');
async function run() {
  const pmts = await prisma.stationPaymentCollection.findMany({ where: { bookingId: 'BK-SPITI-G1' } });
  console.log(pmts);
}
run();
