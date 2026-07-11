const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding placeholder trip MKA2 to support historical booking link...');
  await prisma.trip.upsert({
    where: { id: 'MKA2' },
    update: {},
    create: {
      id: 'MKA2',
      title: 'Manali Kasol Amritsar Backpacking Trip winter',
      slug: 'manali-kasol-amritsar-backpacking-trip-winter',
      location: 'Manali',
      duration: '5 Nights / 6 Days',
      description: 'Placeholder trip details for historical booking links.',
      price: 8999,
      tenantId: 'default'
    }
  });
  console.log('✅ Trip MKA2 seeded successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
