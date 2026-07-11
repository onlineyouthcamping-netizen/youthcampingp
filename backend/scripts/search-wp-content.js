const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany();
  let count = 0;
  for (const t of trips) {
    const str = JSON.stringify(t);
    if (str.includes('wp-content')) {
      count++;
      console.log(`Trip "${t.title}" contains wp-content!`);
      // check which fields contain it
      if (t.heroImage && t.heroImage.includes('wp-content')) console.log(`  - heroImage: ${t.heroImage}`);
      if (t.images) {
        t.images.forEach(img => {
          if (img.includes('wp-content')) console.log(`  - image: ${img}`);
        });
      }
    }
  }
  console.log(`Found ${count} trips with wp-content.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
