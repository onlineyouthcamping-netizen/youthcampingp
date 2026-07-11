const { prisma } = require('../src/lib/prisma');

async function main() {
  try {
    const docsCount = await prisma.bookingDocument.count();
    console.log("BookingDocument count in DB:", docsCount);
  } catch (err) {
    console.error("Prisma access failed:", err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
