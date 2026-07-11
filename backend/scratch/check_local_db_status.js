process.env.NODE_ENV = 'development';
// Force loading of env.js to load .env.local
require('../src/lib/env');

const { prisma } = require('../src/lib/prisma');

async function main() {
  try {
    const bookingsCount = await prisma.booking.count();
    console.log("SUCCESS! Connected to local database.");
    console.log("Total Bookings in local database:", bookingsCount);
  } catch (err) {
    console.error("FAILED to connect or query local database:", err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
