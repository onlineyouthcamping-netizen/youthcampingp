const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const dataPath = path.join(__dirname, 'old_trips_data.json');

async function main() {
  if (!fs.existsSync(dataPath)) {
    console.error('Error: old_trips_data.json not found. Run the scraper first.');
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const trips = JSON.parse(rawData);
  
  console.log(`Loaded ${trips.length} trips from JSON.`);
  
  let successCount = 0;
  let skipCount = 0;
  
  for (const trip of trips) {
    if (!trip.isSafeToImport) {
      console.log(`Skipping trip: ${trip.title} due to incomplete source extraction.`);
      skipCount++;
      continue;
    }
    
    // Check if legacySourceUrl already exists (idempotent run)
    const existingTripBySource = await prisma.trip.findFirst({
      where: { bookingUrl: trip.legacySourceUrl }
    });
    
    if (existingTripBySource) {
      console.log(`Trip from ${trip.legacySourceUrl} already exists in database (ID: ${existingTripBySource.id}). Skipping creation.`);
      skipCount++;
      continue;
    }
    
    // Resolve slug conflicts
    let finalSlug = trip.slug;
    const existingSlug = await prisma.trip.findUnique({
      where: { slug: finalSlug }
    });
    if (existingSlug) {
      finalSlug = `${trip.slug}-legacy`;
      console.log(`Warning: Slug collision for ${trip.slug}. Renamed to ${finalSlug}`);
    }
    
    // Insert trip as draft
    const newTrip = await prisma.trip.create({
      data: {
        title: trip.title,
        slug: finalSlug,
        location: trip.location || 'India',
        price: trip.price || 0,
        duration: trip.duration,
        description: trip.overview,
        category: 'himalayan',
        isActive: false, // Draft / unpublished
        status: 'draft', // Draft
        heroImage: null, // No media!
        images: [],      // No media!
        itinerary: trip.itinerary,
        availableDates: trip.availableDates,
        variants: trip.variants || [],
        inclusions: trip.inclusions,
        exclusions: trip.exclusions,
        highlights: trip.highlights,
        faqs: trip.faqs,
        seo: {
          title: trip.title,
          description: trip.overview.slice(0, 150),
          keywords: '',
          legacySourceUrl: trip.legacySourceUrl,
          fetchTimestamp: trip.fetchTimestamp
        },
        bookingUrl: trip.legacySourceUrl,
        pickupCities: []
      }
    });
    
    console.log(`Successfully imported trip: "${newTrip.title}" as DRAFT (ID: ${newTrip.id})`);
    successCount++;
  }
  
  console.log('INGESTION SUMMARY:');
  console.log(`Successfully imported: ${successCount} trips.`);
  console.log(`Skipped/Existing: ${skipCount} trips.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error('Fatal error in ingestion:', err);
    prisma.$disconnect();
    process.exit(1);
  });
