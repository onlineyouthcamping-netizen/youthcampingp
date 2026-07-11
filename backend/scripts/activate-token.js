const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prefix = '439fedb5';
  console.log(`🔧 Removing expiration date from booking link prefix: ${prefix} so it is fully active...`);
  
  const link = await prisma.bookingLink.findFirst({
    where: { tokenPrefix: prefix }
  });
  
  if (link) {
    await prisma.bookingLink.update({
      where: { id: link.id },
      data: {
        expiresAt: null, // Never expires
        status: 'active' // Ensure it is active
      }
    });
    console.log('✅ Expiration removed and status set to active successfully!');
  } else {
    console.log('❌ Booking link not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
