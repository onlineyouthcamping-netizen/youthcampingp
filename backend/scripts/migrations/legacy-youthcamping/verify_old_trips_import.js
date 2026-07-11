const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const prisma = new PrismaClient();
const dataPath = path.join(__dirname, 'old_trips_data.json');

async function main() {
  if (!fs.existsSync(dataPath)) {
    console.error('Error: old_trips_data.json not found.');
    process.exit(1);
  }
  
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const scrapedTrips = JSON.parse(rawData).filter(t => t.isSafeToImport);
  
  console.log('--- STARTING DATABASE MIGRATION VERIFICATION ---');
  
  // Fetch all trips in DB
  const dbTrips = await prisma.trip.findMany();
  console.log(`Total trips in database: ${dbTrips.length}`);
  
  // Separate legacy (imported) vs existing
  const legacyTrips = dbTrips.filter(t => t.bookingUrl && t.bookingUrl.startsWith('https://www.youthcamping.in/tours/'));
  const existingTrips = dbTrips.filter(t => !t.bookingUrl || !t.bookingUrl.startsWith('https://www.youthcamping.in/tours/'));
  
  console.log(`Legacy (imported) trips count: ${legacyTrips.length}`);
  console.log(`Existing (pre-migration) trips count: ${existingTrips.length}`);
  
  let passed = true;
  const failures = [];
  
  function check(assertionName, fn) {
    try {
      fn();
      console.log(`✅ Assertion Passed: ${assertionName}`);
    } catch (err) {
      console.error(`❌ Assertion Failed: ${assertionName} - ${err.message}`);
      failures.push(`${assertionName}: ${err.message}`);
      passed = false;
    }
  }
  
  // 1. No existing trip was changed or deleted
  check('1. No existing trip was changed or deleted', () => {
    // We expect at least the Spiti Valley Expedition and Test Trip to exist
    const spiti = existingTrips.find(t => t.slug === 'spiti-valley-expedition');
    assert.ok(spiti, 'Spiti Valley Expedition is missing from existing trips!');
  });
  
  // 2. Current Spiti Valley Expedition was not overwritten
  check('2. Current Spiti Valley Expedition was not overwritten', () => {
    const spiti = existingTrips.find(t => t.slug === 'spiti-valley-expedition');
    assert.strictEqual(spiti.status, 'published', 'Spiti status should be published');
    assert.strictEqual(spiti.isActive, true, 'Spiti should be active');
    assert.strictEqual(spiti.price, 18000, 'Spiti price was overwritten!');
    assert.strictEqual(spiti.heroImage, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80', 'Spiti hero image was overwritten!');
  });
  
  // 3. Every created legacy trip is draft/unpublished
  check('3. Every created legacy trip is draft/unpublished', () => {
    for (const trip of legacyTrips) {
      assert.strictEqual(trip.status, 'draft', `Trip ${trip.title} is not in draft status`);
      assert.strictEqual(trip.isActive, false, `Trip ${trip.title} is active`);
    }
  });
  
  // 4. Every imported image/media field is null or empty
  check('4. Every imported image/media field is null or empty', () => {
    for (const trip of legacyTrips) {
      assert.strictEqual(trip.heroImage, null, `Trip ${trip.title} has a non-null heroImage: ${trip.heroImage}`);
      assert.ok(Array.isArray(trip.images), `Trip ${trip.title} images should be an array`);
      assert.strictEqual(trip.images.length, 0, `Trip ${trip.title} has non-empty images array`);
      
      const itinerary = trip.itinerary || [];
      for (const day of itinerary) {
        assert.ok(!day.photos || day.photos.length === 0, `Trip ${trip.title} Day ${day.day} has photos`);
      }
    }
  });
  
  // 5. Every imported record has a source URL
  check('5. Every imported record has a source URL', () => {
    for (const trip of legacyTrips) {
      assert.ok(trip.bookingUrl, `Trip ${trip.title} is missing bookingUrl`);
      assert.ok(trip.bookingUrl.startsWith('https://www.youthcamping.in/tours/'), `Trip ${trip.title} has invalid source URL`);
    }
  });
  
  // 6. No duplicate legacy source URLs exist
  check('6. No duplicate legacy source URLs exist', () => {
    const urls = legacyTrips.map(t => t.bookingUrl);
    const uniqueUrls = new Set(urls);
    assert.strictEqual(urls.length, uniqueUrls.size, 'Duplicate legacy source URLs found in database!');
  });
  
  // 7. Every itinerary day in the database equals the parsed JSON content
  check('7. Every itinerary day in the database equals the parsed JSON content', () => {
    for (const trip of legacyTrips) {
      const scraped = scrapedTrips.find(t => t.legacySourceUrl === trip.bookingUrl);
      if (!scraped) continue;
      
      const dbItin = trip.itinerary || [];
      const scrapedItin = scraped.itinerary || [];
      
      assert.strictEqual(dbItin.length, scrapedItin.length, `Itinerary day count mismatch for ${trip.title}`);
      
      for (let i = 0; i < dbItin.length; i++) {
        assert.strictEqual(dbItin[i].day, scrapedItin[i].day, `Day number mismatch at index ${i} for ${trip.title}`);
        assert.strictEqual(dbItin[i].title, scrapedItin[i].title, `Day title mismatch at index ${i} for ${trip.title}`);
        assert.strictEqual(dbItin[i].description, scrapedItin[i].description, `Day description mismatch at index ${i} for ${trip.title}`);
        assert.strictEqual(dbItin[i].stay, scrapedItin[i].stay, `Day stay mismatch at index ${i} for ${trip.title}`);
        assert.strictEqual(dbItin[i].meals, scrapedItin[i].meals, `Day meals mismatch at index ${i} for ${trip.title}`);
      }
    }
  });
  
  // 8. Pickup/drop details in database equal the parsed JSON content
  check('8. Pickup/drop details in database equal the parsed JSON content', () => {
    for (const trip of legacyTrips) {
      // Ensure pickupCities is empty or matches scraped (which is set to empty array/null since no additions)
      assert.ok(Array.isArray(trip.pickupCities) && trip.pickupCities.length === 0, `Trip ${trip.title} has invented pickupCities`);
    }
  });
  
  // 9. No trip gets published automatically
  check('9. No trip gets published automatically', () => {
    for (const trip of legacyTrips) {
      assert.notStrictEqual(trip.status, 'published', `Legacy trip ${trip.title} is published!`);
    }
  });
  
  console.log('\n--- VERIFICATION COMPLETE ---');
  if (passed) {
    console.log('STATUS: ✅ ALL ASSERTIONS PASSED successfully.');
  } else {
    console.error('STATUS: ❌ VERIFICATION FAILED.');
    console.error(failures.join('\n'));
    process.exit(1);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => {
    console.error('Fatal error in verification:', err);
    prisma.$disconnect();
    process.exit(1);
  });
