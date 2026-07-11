const { prisma } = require('../src/lib/prisma');

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      id: {
        contains: '68v3vuvh'
      }
    }
  });
  console.log("MATCHED BOOKINGS:", JSON.stringify(bookings.map(b => b.id), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
