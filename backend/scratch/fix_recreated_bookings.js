const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  // Update Spiti bookings
  await prisma.$executeRaw`UPDATE "Booking" SET "tripId" = 'SPT-1' WHERE "tripName" = 'Spiti Valley Road Trip'`;
  await prisma.$executeRaw`UPDATE "Booking" SET "tripId" = 'MKA-1' WHERE "tripName" = 'Manali Kasol Amritsar Backpacking Trip'`;

  // Fix fields
  await prisma.$executeRaw`UPDATE "Booking" SET "fullName" = "name", "mobile" = "phone", "totalAmount" = "amount", "advancePaid" = 5000, "remainingAmount" = "amount" - 5000, "numberOfTravelers" = 1 WHERE "fullName" IS NULL OR "fullName" = ''`;

  console.log("Fixed bookings via Raw SQL.");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
