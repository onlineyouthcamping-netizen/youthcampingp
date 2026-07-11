const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const BASE = 'https://www.youthcamping.in'

async function scrape() {
  console.log('📡 Fetching homepage...')
  try {
    const { data } = await axios.get(BASE)
    const $ = cheerio.load(data)
    const trips = []
    const links = new Set()
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')
      if (href && (href.includes('/tours/'))) {
        links.add(href.startsWith('http') ? href : BASE + (href.startsWith('/') ? '' : '/') + href)
      }
    })
    
    console.log(`🔗 Found ${links.size} trip links`)
    
    for (const url of links) {
      try {
        console.log(`🔍 Scraping: ${url}`)
        const { data: page } = await axios.get(url, { timeout: 15000 })
        const ss = cheerio.load(page)
        
        const trip = {
          title: ss('h1').first().text().trim(),
          description: ss('meta[name=description]').attr('content') || '',
          price: ss('[class*=price]').first().text().trim(),
          duration: ss('[class*=duration],[class*=days],[class*=night]').first().text().trim(),
          url,
          images: [],
          itinerary: [],
          inclusions: [],
          exclusions: [],
          availableDates: []
        }
        
        // 1. Scrape Images
        ss('img').each((_, el) => {
          const src = ss(el).attr('src') || ss(el).attr('data-src')
          if (src && src.length > 5 && !src.includes('whatsapp')) {
            trip.images.push(src.startsWith('http') ? src : BASE + (src.startsWith('/') ? '' : '/') + src)
          }
        })
        
        // 2. Scrape Itinerary
        ss('#itinerary details.itinerary-segment-card').each((_, el) => {
          const label = ss(el).find('.segment-label').text().trim();
          const dayTitle = ss(el).find('.segment-title h4').text().trim();
          const content = ss(el).find('.segment-content').html() || '';
          
          trip.itinerary.push({
            day: parseInt(label.replace(/[^0-9]/g, '')) || (trip.itinerary.length + 1),
            title: dayTitle,
            description: content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() // Basic text cleaning
          })
        })
        
        // 3. Inclusions
        ss('#inclusions_exclusions .inclusions .ckeditor-content ul li').each((_, el) => {
          trip.inclusions.push(ss(el).text().trim())
        })
        
        // 4. Exclusions
        ss('#inclusions_exclusions .exclusions .ckeditor-content ul li').each((_, el) => {
          trip.exclusions.push(ss(el).text().trim())
        })
        
        // 5. Available Dates
        ss('#dates_and_rates .departure-info').each((_, el) => {
          const startDate = ss(el).find('.starts-at').text().trim();
          const endDate = ss(el).find('.ends-at').text().trim();
          const price = ss(el).find('.price, .advt-price').first().text().trim();
          const variant = ss(el).find('.variant-name').text().trim();
          
          if (startDate) {
            trip.availableDates.push({
              date: startDate,
              endDate,
              price: parseFloat(price.replace(/[^0-9]/g, '')) || 0,
              variant
            })
          }
        })
        
        if (trip.title) {
          trips.push(trip)
          console.log(`✅ OK: ${trip.title} | ${trip.itinerary.length} Days | ${trip.availableDates.length} Dates`)
        }
      } catch (e) {
        console.log(`⚠️ SKIP: ${url} (${e.message})`)
      }
    }
    
    const outputPath = path.join(__dirname, 'trips-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(trips, null, 2))
    console.log(`🎉 DONE: ${trips.length} trips saved to ${outputPath}`)
  } catch (error) {
    console.error(`❌ Main fetch failed: ${error.message}`)
  }
}

scrape().catch(console.error)
