const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    console.log("🛠️  Starting Trip ID cleanup...");

    // Fix MKA 2
    await prisma.$executeRaw`UPDATE "Trip" SET id = 'MKA2', "shortName" = 'MKA2' WHERE id = 'MKA 2'`;
    console.log("✅ Fixed MKA 2 -> MKA2");

    // Fix MKA 1
    await prisma.$executeRaw`UPDATE "Trip" SET id = 'MKA1', "shortName" = 'MKA1' WHERE id = 'MKA 1 '`;
    console.log("✅ Fixed MKA 1 -> MKA1");

    // Verify
    const results = await prisma.trip.findMany({
      where: { id: { in: ['MKA1', 'MKA2'] } },
      select: { id: true, shortName: true }
    });
    console.log("🔍 Verification Results:", results);

  } catch (err) {
    console.error("❌ Fix failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}
fix();
