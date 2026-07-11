const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Backfilling null emails...');
  const result = await prisma.booking.updateMany({
    where: { email: null },
    data: { email: 'no-email@youthcamping.com' }
  });
  console.log(`✅ Updated ${result.count} bookings with placeholder email.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
