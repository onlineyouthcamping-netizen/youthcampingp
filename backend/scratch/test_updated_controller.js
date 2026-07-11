const { prisma } = require('../src/lib/prisma');

async function main() {
  const id = 'SPT-1';
  const tenantId = 'default';

  // exact-match check first
  let trip = await prisma.trip.findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
        { title: id },
        { shortName: id }
      ],
      tenantId
    },
    select: {
      id: true,
      title: true,
      slug: true
    }
  });

  if (!trip) {
    // fallback fuzzy-match check
    trip = await prisma.trip.findFirst({
      where: {
        OR: [
          { title: { contains: id, mode: 'insensitive' } },
          { slug: { contains: id, mode: 'insensitive' } }
        ],
        tenantId
      },
      select: {
        id: true,
        title: true,
        slug: true
      }
    });
  }

  console.log("RESOLVED TRIP:", JSON.stringify(trip, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
