const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const backupPath = path.join(__dirname, '../backups/trips_backup_2026-05-30T07-38-00-518Z.json');
  console.log('Reading backup from:', backupPath);
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found at: ${backupPath}`);
  }
  const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  console.log(`Clearing existing trips...`);
  await prisma.trip.deleteMany({});

  console.log(`Restoring ${data.length} trips...`);
  for (const item of data) {
    const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
    const updatedAt = item.updatedAt ? new Date(item.updatedAt) : new Date();

    const cleanItem = {
      id: item.id,
      tenantId: item.tenantId || "default",
      title: item.title,
      shortName: item.shortName || null,
      slug: item.slug,
      location: item.location,
      price: parseFloat(item.price),
      duration: item.duration,
      description: item.description,
      category: item.category || "himalayan",
      isActive: item.isActive ?? true,
      status: item.status || "published",
      heroImage: item.heroImage || null,
      images: item.images || [],
      itinerary: item.itinerary || null,
      availableDates: item.availableDates || null,
      variants: item.variants || null,
      travelOptions: item.travelOptions || null,
      roomOptions: item.roomOptions || null,
      seo: item.seo || null,
      highlights: item.highlights || null,
      inclusions: item.inclusions || null,
      exclusions: item.exclusions || null,
      faqs: item.faqs || null,
      addons: item.addons || null,
      maxGroupSize: item.maxGroupSize || null,
      difficulty: item.difficulty || null,
      departureCity: item.departureCity || null,
      pickupCities: item.pickupCities || null,
      ageLimit: item.ageLimit || null,
      bookingUrl: item.bookingUrl || null,
      customSections: item.customSections || null,
      attractions: item.attractions || null,
      activities: item.activities || null,
      accommodations: item.accommodations || null,
      popupDetails: item.popupDetails || null,
      route: item.route || null,
      ageGroup: item.ageGroup || null,
      maxAltitude: item.maxAltitude || null,
      tripType: item.tripType || null,
      startEnd: item.startEnd || null,
      pickupMode: item.pickupMode || null,
      stickyCardPrice: item.stickyCardPrice ? parseFloat(item.stickyCardPrice) : null,
      stickyCardLabel: item.stickyCardLabel || null,
      reels: item.reels || null,
      tripReviews: item.tripReviews || null,
      order: item.order ?? 999,
      createdAt,
      updatedAt
    };

    await prisma.trip.create({
      data: cleanItem
    });
    console.log(`✅ Restored trip: ${item.title} (${item.id})`);
  }

  console.log('🎉 Database successfully restored from the backup file!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
