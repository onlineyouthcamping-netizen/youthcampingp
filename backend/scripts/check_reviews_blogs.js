const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const reviews = await prisma.review.findMany();
  console.log('REVIEWS:');
  for (const r of reviews) {
    console.log(`- ${r.userName} (${r.instagram}): userImage: ${r.userImage}, photos: ${JSON.stringify(r.photos)}`);
  }

  const blogs = await prisma.blog.findMany();
  console.log('\nBLOGS:');
  for (const b of blogs) {
    console.log(`- ${b.title}: image: ${b.image}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
