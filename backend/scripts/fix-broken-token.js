const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const oldPrefix = '439fecb5';
  const newPrefix = '439fedb5';
  const newHash = 'b38f62440e3baf7a503b5f5163c75fa9e3415e17b31213ba40cd156d161afbda';
  const newShareUrl = 'https://youthcamping.online/book/link/439fedb565c75cce7c7655cdc71134dfe48e4356cbde7e3dbd81534c0054ad50';
  
  console.log(`🔧 Mapping user's custom token into the database record...`);
  
  const link = await prisma.bookingLink.findFirst({
    where: { tokenPrefix: oldPrefix }
  });
  
  if (link) {
    await prisma.bookingLink.update({
      where: { id: link.id },
      data: {
        tokenPrefix: newPrefix,
        tokenHash: newHash,
        shareUrl: newShareUrl
      }
    });
    console.log('✅ Custom token mapped successfully! The URL is now fully active!');
  } else {
    console.log('❌ Booking link with original prefix not found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
