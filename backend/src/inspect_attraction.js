const { prisma } = require('./lib/prisma');

async function run() {
  try {
    const attraction = await prisma.attraction.findUnique({
      where: { slug: 'golden-temple' }
    });
    console.log("=== Golden Temple ===");
    console.log(JSON.stringify(attraction, null, 2));

    // Also check a few others to see the pattern
    const all = await prisma.attraction.findMany({ take: 3, select: { name: true, slug: true, image: true, description: true, location: true } });
    console.log("\n=== First 3 Attractions (summary) ===");
    console.log(JSON.stringify(all, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
