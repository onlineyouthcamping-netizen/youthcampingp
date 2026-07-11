const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find any booking
  const booking = await prisma.booking.findFirst();
  if (!booking) {
    console.log("No bookings found!");
    return;
  }
  
  console.log("Original sourceMeta:", JSON.stringify(booking.sourceMeta, null, 2));
  
  const testMeta = {
    testField: 'updated_via_prisma_update_many',
    bookingItems: [{ name: 'Test Item', rate: 100, qty: 2 }]
  };
  
  // Try to update using updateMany
  await prisma.booking.updateMany({
    where: { id: booking.id },
    data: { sourceMeta: testMeta }
  });
  
  // Re-fetch
  const fresh = await prisma.booking.findUnique({
    where: { id: booking.id }
  });
  console.log("Re-fetched sourceMeta:", JSON.stringify(fresh.sourceMeta, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
