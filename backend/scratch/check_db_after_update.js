const { prisma } = require('../src/lib/prisma');

async function main() {
  const booking = await prisma.booking.findUnique({
    where: { id: 'cmrd4qvxj0009il2cvww0kruk' }
  });
  console.log("DB SOURCE META AFTER UPDATE:", JSON.stringify(booking.sourceMeta, null, 2));
  console.log("DB TOTAL AMOUNT:", booking.totalAmount);
  console.log("DB GST AMOUNT:", booking.gstAmount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
