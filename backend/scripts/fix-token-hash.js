const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const token = 'c026c4abc086bc0e6bf017b4016240b8123cb0cb93f21eab86d35a5353e7ca73';
  const correctHash = '36cf39109bd9904aec4a10a33f28e7217b93898f4e7418d660c3f04752357e57';
  
  console.log(`🔧 Updating tokenHash in database for prefix c026c4ab to match actual token...`);
  
  const link = await prisma.bookingLink.findFirst({
    where: { tokenPrefix: 'c026c4ab' }
  });
  
  if (link) {
    await prisma.bookingLink.update({
      where: { id: link.id },
      data: { tokenHash: correctHash }
    });
    console.log('✅ Token hash updated successfully!');
  } else {
    console.log('❌ Booking link with prefix c026c4ab not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
