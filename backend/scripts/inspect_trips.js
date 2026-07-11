const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trips = await prisma.trip.findMany({
    select: {
      id: true, title: true, slug: true, status: true, isActive: true,
      bookingUrl: true, availableDates: true, variants: true, itinerary: true,
      heroImage: true, price: true, duration: true, departureCity: true,
      pickupCities: true, category: true, location: true, highlights: true,
      inclusions: true, seo: true, order: true, createdAt: true
    }
  });
  console.log('TOTAL TRIPS:', trips.length);
  console.log(JSON.stringify(trips, null, 2));
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
