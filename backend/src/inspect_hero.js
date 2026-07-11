const { prisma } = require('./lib/prisma');

async function run() {
  try {
    const page = await prisma.pageBuilder.findUnique({
      where: { name: 'home' }
    });
    if (page && page.sections) {
      const heroSection = page.sections.find(s => s.type === 'hero');
      console.log("=== Hero Section data ===");
      console.log(JSON.stringify(heroSection, null, 2));
    } else {
      console.log("No home page sections found");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
