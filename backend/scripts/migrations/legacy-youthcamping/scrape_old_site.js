const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const MIGRATION_DIR = __dirname;
const RAW_DIR = path.join(MIGRATION_DIR, 'raw');

// Ensure directories exist
if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
}

// 11 tour URLs from the sitemap
const SOURCE_URLS = [
  { slug: 'kedarnath-tungnath-rishikesh-backpacking-trip', url: 'https://www.youthcamping.in/tours/kedarnath-tungnath-rishikesh-backpacking-trip' },
  { slug: 'kedarnath-tungnath-rishikesh-multiple-starting-points-as-addons-138288', url: 'https://www.youthcamping.in/tours/kedarnath-tungnath-rishikesh-multiple-starting-points-as-addons-138288' },
  { slug: 'kerala-getaway-165724', url: 'https://www.youthcamping.in/tours/kerala-getaway-165724' },
  { slug: 'leh-to-leh-bike-expedition-2026-youth-camping-164365', url: 'https://www.youthcamping.in/tours/leh-to-leh-bike-expedition-2026-youth-camping-164365' },
  { slug: 'magical-kashmir-backpacking-trip-138723', url: 'https://www.youthcamping.in/tours/magical-kashmir-backpacking-trip-138723' },
  { slug: 'manali-kasol-amritsar-adventure-trip-140500', url: 'https://www.youthcamping.in/tours/manali-kasol-amritsar-adventure-trip-140500' },
  { slug: 'manali-kasol-amritsar-trip-137683', url: 'https://www.youthcamping.in/tours/manali-kasol-amritsar-trip-137683' },
  { slug: 'shimla-manali-dalhousie-dharamshala-155815', url: 'https://www.youthcamping.in/tours/shimla-manali-dalhousie-dharamshala-155815' },
  { slug: 'shimla-manali-kullu-138567', url: 'https://www.youthcamping.in/tours/shimla-manali-kullu-138567' },
  { slug: 'spiti-valley-road-trip-137856', url: 'https://www.youthcamping.in/tours/spiti-valley-road-trip-137856' },
  { slug: 'winter-spiti-156526', url: 'https://www.youthcamping.in/tours/winter-spiti-156526' }
];

async function scrapePage(item) {
  console.log(`Fetching: ${item.url}`);
  const response = await axios.get(item.url, { timeout: 15000 });
  const html = response.data;
  
  // Save HTML raw snapshot
  const rawPath = path.join(RAW_DIR, `${item.slug}.html`);
  fs.writeFileSync(rawPath, html, 'utf-8');
  
  const $ = cheerio.load(html);
  
  // Extract Title
  let title = $('h1.h2').first().text().trim();
  if (!title) title = $('title').text().replace('| YouthCamping', '').trim();
  
  // Duration
  const duration = $('.trip-duration').first().text().trim() || null;
  
  // Base Price
  let priceText = $('.advt-pricing-amount-none').first().text().replace(/[^\d]/g, '').trim();
  if (!priceText) priceText = $('.advt-pricing-amount-suffix').first().text().replace(/[^\d]/g, '').trim();
  const price = priceText ? parseFloat(priceText) : null;
  
  // Overview
  const overviewHtml = $('#overview .content').html() || '';
  const overviewText = $('#overview .content').text().trim();
  
  // Age Limit / Restriction
  let ageLimit = null;
  const ageMatch = overviewText.match(/age\s*(\d+)\s*(?:to|-)\s*(\d+)/i) || overviewText.match(/(\d+)\s*years/i);
  if (ageMatch) {
    ageLimit = ageMatch[0];
  }
  
  // Dates
  const availableDates = [];
  $('.departure-info').each((idx, el) => {
    const bookUrl = $(el).find('a.trip-book-btn, a.rate-details').attr('href');
    if (bookUrl) {
      const dateMatch = bookUrl.match(/departure_date=([\d\-T\:]+)/);
      if (dateMatch) {
        const fullDate = dateMatch[1].split('T')[0]; // YYYY-MM-DD
        if (fullDate && !availableDates.some(d => d.date === fullDate)) {
          availableDates.push({ date: fullDate, capacity: 20, bookedCount: 0 });
        }
      }
    }
  });

  // If no date parsed from links, look at dates-rates section text
  if (availableDates.length === 0) {
    $('.departure-info .starts-at').each((idx, el) => {
      const dateStr = $(el).text().trim();
      if (dateStr) {
        availableDates.push({ date: dateStr, capacity: 20, bookedCount: 0 });
      }
    });
  }
  
  // Dynamic itinerary loading
  let itineraryHtml = $('#itinerary .content').html() || '';
  if (itineraryHtml.includes('loadRemoteHtml')) {
    const lambdaMatch = itineraryHtml.match(/loadRemoteHtml\(['"]([^'"]+)['"]/);
    if (lambdaMatch) {
      const lambdaUrl = `https://www.youthcamping.in${lambdaMatch[1]}`;
      console.log(`Fetching dynamic itinerary from: ${lambdaUrl}`);
      try {
        const lambdaResponse = await axios.get(lambdaUrl, { timeout: 15000 });
        itineraryHtml = lambdaResponse.data;
      } catch (err) {
        console.error(`Failed to fetch dynamic itinerary from ${lambdaUrl}:`, err.message);
      }
    }
  }
  
  // Parse Itinerary
  const itinerary = [];
  const $itin = cheerio.load(itineraryHtml || '');
  
  if ($itin('.itinerary-segment-card').length > 0) {
    $itin('.itinerary-segment-card').each((idx, el) => {
      const label = $itin(el).find('.segment-label').text().trim(); // Day X
      const dayNum = parseInt(label.replace(/[^\d]/g, '')) || idx + 1;
      const title = $itin(el).find('.segment-title h4').text().trim();
      const location = $itin(el).find('.segment-location').text().trim();
      const contentHtml = $itin(el).find('.segment-content').html() || '';
      const contentText = $itin(el).find('.segment-content').text().trim();
      
      const bullets = [];
      const sub$ = cheerio.load(contentHtml);
      sub$('li').each((i, li) => {
        const txt = sub$(li).text().trim();
        if (txt) bullets.push(txt);
      });
      if (bullets.length === 0) {
        sub$('p').each((i, p) => {
          const txt = sub$(p).text().trim();
          if (txt && !txt.toLowerCase().startsWith('stay:') && !txt.toLowerCase().startsWith('meals:')) {
            bullets.push(txt);
          }
        });
      }
      
      let stay = 'N/A';
      let meals = 'N/A';
      const stayMatch = contentText.match(/Stay:\s*([^\n\r<]+)/i);
      const mealsMatch = contentText.match(/Meals:\s*([^\n\r<]+)/i);
      if (stayMatch) stay = stayMatch[1].trim();
      if (mealsMatch) meals = mealsMatch[1].trim();
      
      itinerary.push({
        day: dayNum,
        title: title || `Day ${dayNum}`,
        location: location || 'TBD',
        description: bullets.map(b => `* ${b}`).join('\n'),
        stay,
        meals,
        photos: []
      });
    });
  } else {
    // Unstructured fallback
    let container = $itin('.content.ckeditor-content').first();
    if (container.length === 0) container = $itin.root();
    
    let currentDay = null;
    container.children().each((idx, el) => {
      const text = $itin(el).text().replace(/\u00a0/g, ' ').trim();
      const dayMatch = text.match(/^Day\s+(\d+)\s*:?\s*(.*)$/i) || text.match(/^Day\s+0?(\d+)\s*:?\s*(.*)$/i);
      
      if (dayMatch && text.length < 150) {
        if (currentDay) {
          itinerary.push(currentDay);
        }
        const dayNum = parseInt(dayMatch[1]);
        const dayTitle = dayMatch[2].trim();
        currentDay = {
          day: dayNum,
          title: dayTitle || `Day ${dayNum}`,
          location: 'TBD',
          bullets: [],
          stay: 'N/A',
          meals: 'N/A',
          photos: []
        };
      } else if (currentDay) {
        if ($itin(el).is('ul') || $itin(el).is('ol')) {
          $itin(el).find('li').each((i, li) => {
            const txt = $itin(li).text().trim();
            if (txt) currentDay.bullets.push(txt);
          });
        } else {
          const stayMatch = text.match(/Stay:\s*([^\n\r<]+)/i);
          const mealsMatch = text.match(/Meals:\s*([^\n\r<]+)/i);
          if (stayMatch) {
            currentDay.stay = stayMatch[1].trim();
          } else if (mealsMatch) {
            currentDay.meals = mealsMatch[1].trim();
          } else if (text && !text.toLowerCase().startsWith('stay:') && !text.toLowerCase().startsWith('meals:')) {
            currentDay.bullets.push(text);
          }
        }
      }
    });
    if (currentDay) {
      itinerary.push(currentDay);
    }
    
    // Map bullets
    itinerary.forEach(day => {
      day.description = day.bullets.map(b => `* ${b}`).join('\n');
      delete day.bullets;
    });
  }
  
  // Inclusions & Exclusions
  const inclusions = [];
  $('#inclusions_exclusions .inclusions li').each((i, el) => {
    inclusions.push($(el).text().trim());
  });
  
  const exclusions = [];
  $('#inclusions_exclusions .exclusions li').each((i, el) => {
    exclusions.push($(el).text().trim());
  });
  
  // Highlights
  const highlights = [];
  $('#highlights .content li').each((i, el) => {
    highlights.push($(el).text().trim());
  });
  
  // Things to Carry
  const thingsToCarry = [];
  $('#things_to_carry .content li').each((i, el) => {
    thingsToCarry.push($(el).text().trim());
  });
  
  // FAQs
  const faqs = [];
  $('.ckeditor-accordion-heading').each((i, el) => {
    const q = $(el).text().trim();
    const a = $(el).next('.ckeditor-accordion-content').text().trim();
    if (q && a) {
      faqs.push({ question: q, answer: a });
    }
  });

  // Warnings / Metadata
  const warnings = [];
  if (!price) warnings.push('Base price not found');
  if (availableDates.length === 0) warnings.push('No departure dates found');
  if (itinerary.length === 0) warnings.push('No itinerary days found');
  
  return {
    title,
    slug: item.slug,
    duration: duration || 'Source data unavailable or ambiguous — not invented.',
    price: price || 0,
    overview: overviewText || 'Source data unavailable or ambiguous — not invented.',
    ageLimit: ageLimit || 'Source data unavailable or ambiguous — not invented.',
    availableDates,
    itinerary,
    inclusions,
    exclusions,
    highlights,
    faqs,
    thingsToCarry,
    legacySourceUrl: item.url,
    fetchTimestamp: new Date().toISOString(),
    warnings,
    isSafeToImport: itinerary.length > 0
  };
}

async function main() {
  const results = [];
  const manifest = [];
  
  for (const item of SOURCE_URLS) {
    try {
      const data = await scrapePage(item);
      results.push(data);
      manifest.push({
        title: data.title,
        slug: item.slug,
        url: item.url,
        status: 'fetched',
        dayCount: data.itinerary.length,
        dateCount: data.availableDates.length,
        warnings: data.warnings
      });
    } catch (err) {
      console.error(`Failed to fetch ${item.url}:`, err.message);
      manifest.push({
        title: 'Unknown',
        slug: item.slug,
        url: item.url,
        status: `failed: ${err.message}`,
        dayCount: 0,
        dateCount: 0,
        warnings: [`HTTP request failed: ${err.message}`]
      });
    }
  }
  
  // Write persistent source_manifest.json
  fs.writeFileSync(
    path.join(MIGRATION_DIR, 'source_manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );
  
  // Write persistent old_trips_data.json
  fs.writeFileSync(
    path.join(MIGRATION_DIR, 'old_trips_data.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  
  console.log('SCRAPING COMPLETED SUCCESSFULLY!');
  console.log(`Manifest saved to source_manifest.json`);
  console.log(`Data saved to old_trips_data.json`);
}

main().catch(err => {
  console.error('Fatal error in scraper:', err);
  process.exit(1);
});
