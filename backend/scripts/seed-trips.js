const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const prisma = new PrismaClient()

function guessLocation(title) {
  const t = title.toLowerCase()
  if (t.includes('kerala')) return 'Kerala'
  if (t.includes('spiti')) return 'Himachal Pradesh'
  if (t.includes('manali')) return 'Himachal Pradesh'
  if (t.includes('kasol')) return 'Himachal Pradesh'
  if (t.includes('leh') || t.includes('ladakh')) return 'Ladakh'
  if (t.includes('kedarnath') || t.includes('badrinath') || t.includes('tungnath') || t.includes('rishikesh')) return 'Uttarakhand'
  if (t.includes('gujarat')) return 'Gujarat'
  return 'India'
}

function cleanDuplicateString(str) {
  if (typeof str !== 'string') return str;
  str = str.trim();
  const len = str.length;
  if (len >= 6 && len % 2 === 0) {
    const half = len / 2;
    const firstHalf = str.substring(0, half);
    const secondHalf = str.substring(half);
    if (firstHalf === secondHalf) {
      return firstHalf;
    }
  }
  return str;
}

async function seed() {
  const dataPath = path.join(__dirname, 'trips-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ Could not find trips-data.json');
    return;
  }

  // Clear existing trips
  await prisma.trip.deleteMany({});
  console.log('🧹 Cleared existing trips from database.');

  const trips = JSON.parse(fs.readFileSync(dataPath))
  console.log(`🌱 Seeding ${trips.length} detailed trips...`)

  for (const t of trips) {
    try {
      const slug = t.url.split('/tours/')[1] || t.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const location = guessLocation(t.title);
      const price = parseFloat(t.price.replace(/[^0-9.]/g, '')) || 0;

      // Clean availableDates if present
      let cleanAvailableDates = null;
      if (t.availableDates && Array.isArray(t.availableDates)) {
        cleanAvailableDates = t.availableDates.map(d => {
          const cleanD = {};
          for (const [key, val] of Object.entries(d)) {
            cleanD[key] = typeof val === 'string' ? cleanDuplicateString(val) : val;
          }
          return cleanD;
        });
      }

      const tripData = {
        title: t.title,
        description: t.description || t.title,
        price: price,
        duration: t.duration || '',
        images: t.images,
        location: location,
        itinerary: t.itinerary,
        inclusions: t.inclusions,
        exclusions: t.exclusions,
        availableDates: cleanAvailableDates,
        isActive: true,
        status: 'published'
      };

      await prisma.trip.upsert({
        where: { slug: slug },
        update: tripData,
        create: {
          ...tripData,
          slug: slug,
        }
      })
      console.log(`✅ OK: ${t.title} [${t.itinerary.length} Days]`)
    } catch(e) {
      console.log(`❌ FAIL: ${t.title} (${e.message})`)
    }
  }
  
  console.log('🏁 DONE')
  await prisma.$disconnect()
}

seed().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})

