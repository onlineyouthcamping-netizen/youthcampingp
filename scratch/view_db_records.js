const { prisma } = require('../backend/src/lib/prisma');

async function view() {
  // 1. Admin
  const admin = await prisma.admin.findFirst({
    where: { email: 'admin@youthcamping.in' }
  });
  console.log('\n--- Admin Record ---');
  console.log(JSON.stringify(admin, null, 2));

  // 2. Trip
  const trip = await prisma.trip.findUnique({
    where: { id: 'MKA1' }
  });
  console.log('\n--- Trip MKA1 Booking URL ---');
  console.log('bookingUrl:', trip.bookingUrl);

  // 3. Settings
  const settings = await prisma.setting.findMany();
  for (const s of settings) {
    const str = JSON.stringify(s);
    if (str.includes('youthcamping.in')) {
      console.log(`\n--- Setting Record (${s.key}) ---`);
      console.log(JSON.stringify(s, null, 2));
    }
  }
}

view().catch(console.error).finally(() => prisma.$disconnect());
