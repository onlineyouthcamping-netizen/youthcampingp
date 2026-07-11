const fs = require('fs');
const path = require('path');

const SLUG_MAP = {
  'kerala-getaway-2026-5d-4n': 7,
  'manali-kasol-amritsar-backpacking-trip-9d-8n': 0,
  'leh-ladakh-bike-trip-with-turtuk-7d-6n': 5,
  'spiti-valley-full-circuit-from-ahmedabad-11d-10n': 6,
  'manali-kasol-amritsar-with-bhrigu-lake-trek-9d-8n': 2,
};

const rawTrips = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scripts', 'trips-data.json'), 'utf-8'));

for (const [slug, index] of Object.entries(SLUG_MAP)) {
  const trip = rawTrips[index];
  console.log(`Slug: ${slug}`);
  console.log(`Title: ${trip ? trip.title : 'NOT FOUND'}`);
  console.log(`Images: (${trip ? trip.images.length : 0})`);
  if (trip && trip.images) {
    trip.images.slice(0, 5).forEach(img => console.log(`  - ${img}`));
  }
  console.log('---');
}
