const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.$executeRaw`DELETE FROM "Booking" WHERE "mobile" = '0000000000' OR "phone" = '0000000000'`;
  console.log("Deleted dummy bookings.");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
