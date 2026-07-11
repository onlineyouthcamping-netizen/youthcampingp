const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      sourceMeta: { not: null }
    }
  });
  console.log(`Found ${bookings.length} bookings with non-null sourceMeta:`);
  bookings.forEach(b => {
    console.log(`ID: ${b.id}, bookingId: ${b.bookingId}, Name: ${b.name}`);
    console.log("sourceMeta:", JSON.stringify(b.sourceMeta, null, 2));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
