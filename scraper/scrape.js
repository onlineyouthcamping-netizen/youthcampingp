const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const slugify = require('slugify');
require('dotenv').config({ path: path.join(__dirname, '../bD/youthcamping-backend/.env') });



/**
 * VALIDATION LAYER
 */
function validateTrip(trip) {
    const hasTitle = trip.title && trip.title.length > 3;
    const hasPrice = trip.price > 0;
    const hasImages = trip.images && trip.images.length > 0;
    const hasItinerary = trip.itinerary && trip.itinerary.length > 0;

    if (!hasTitle) console.warn(`⚠️ Validation failed: Missing title for ${trip.url}`);
    if (!hasPrice) console.warn(`⚠️ Validation failed: Missing price for ${trip.title}`);
    if (!hasImages) console.warn(`⚠️ Validation failed: No images for ${trip.title}`);
    if (!hasItinerary) console.warn(`⚠️ Validation failed: Empty itinerary for ${trip.title}`);

    return hasTitle && hasPrice && hasImages && hasItinerary;
}

/**
 * DEDUPLICATION LAYER
 */
function deduplicateTrips(trips) {
    const seenTitles = new Set();
    const seenSlugs = new Set();
    
    return trips.filter(trip => {
        const slug = slugify(trip.title, { lower: true, strict: true });
        const duplicate = seenTitles.has(trip.title) || seenSlugs.has(slug);
        
        seenTitles.add(trip.title);
        seenSlugs.add(slug);
        
        if (duplicate) console.warn(`♻️ Deduplication: Skipping duplicate trip/slug "${trip.title}" (${slug})`);
        return !duplicate;
    });
}

/**
 * DATABASE SYNC LAYER
 */
/**
 * DATABASE SYNC LAYER
 */
async function syncToDatabase(trips) {
    console.log('🔗 Connecting to Database...');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in backend .env file.');
        return;
    }

    try {
        // Handle connection events
        mongoose.connection.on('connected', () => console.log('✅ Mongoose connected.'));
        mongoose.connection.on('error', (err) => console.error('❌ Mongoose error:', err));

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false // Disable buffering to fail fast
        });

        // Define a local minimal schema for syncing
        const tripSchema = new mongoose.Schema({
            title: { type: String, required: true },
            slug: { type: String, unique: true },
            price: Number,
            duration: String,
            description: String,
            location: String,
            highlights: [String],
            images: [String],
            gallery: [String],
            inclusions: [String],
            exclusions: [String],
            originalUrl: String,
            status: { type: String, default: 'published' },
            isActive: { type: Boolean, default: true },
            itinerary: [{ day: Number, title: String, description: String }]
        }, { timestamps: true });

        // Ensure model is registered on the ACTIVE connection
        const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

        // REMOVE ALL OLD DATA
        console.log('🗑️ Clearing existing trips for a fresh sync...');
        await Trip.deleteMany({});
        console.log('✅ Collection cleared.');

        let count = 0;
        for (const tripData of trips) {
            console.log(`📡 Syncing: ${tripData.title}...`);
            const mappedTrip = {
                title: tripData.title,
                slug: slugify(tripData.title, { lower: true, strict: true }),
                price: tripData.price,
                duration: tripData.duration,
                description: tripData.description,
                location: tripData.location || 'India',
                highlights: tripData.highlights || [],
                inclusions: tripData.inclusions,
                exclusions: tripData.exclusions,
                faqs: tripData.faqs || [],
                variants: tripData.variants || [],
                images: tripData.images,
                gallery: tripData.images,
                originalUrl: tripData.url,
                status: 'published',
                isActive: true,
                itinerary: tripData.itinerary.map((item, index) => ({
                    day: index + 1,
                    title: item.day,
                    description: item.content
                }))
            };

            await Trip.findOneAndUpdate(
                { slug: mappedTrip.slug },
                { $set: mappedTrip },
                { upsert: true, returnDocument: 'after' }
            );
            console.log(`✅ Synced: ${mappedTrip.title}`);
            count++;
        }

        console.log(`\n🎉 Database Sync Complete: ${count} trips processed.`);
    } catch (err) {
        console.error(`💥 Database Error: ${err.message}`);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

async function runScraper() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log('🚀 Starting Production Scraper...');
    
    const baseUrl = 'https://www.youthcamping.in';
    const collectionUrl = `${baseUrl}/collections/tours`;
    
    try {
        await page.goto(collectionUrl, { waitUntil: 'networkidle' });
        
        const tripLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/tours/"]'));
            return [...new Set(links.map(a => a.href))];
        });

        console.log(`📌 Found ${tripLinks.length} unique trip links.`);

        let allTrips = [];

        for (const link of tripLinks) {
            console.log(`🔍 Scraping: ${link}`);
            const tripPage = await context.newPage();
            try {
                await tripPage.goto(link, { waitUntil: 'networkidle', timeout: 60000 });
                
                const tripData = await tripPage.evaluate(() => {
                    const getPrice = () => {
                        const priceSelectors = [
                            'meta[property="product:price:amount"]',
                            '.price',
                            '.tour-price',
                            '.itinerary-price',
                            'span.money',
                            '.current_price'
                        ];
                        for (const selector of priceSelectors) {
                            const el = document.querySelector(selector);
                            if (el) {
                                const val = el.getAttribute('content') || el.innerText;
                                const cleaned = val.replace(/[^0-9]/g, '');
                                if (cleaned) return parseInt(cleaned);
                            }
                        }
                        // Fallback: search all text for ₹
                        const allText = document.body.innerText;
                        const match = allText.match(/₹\s?(\d{1,3}(,\d{3})*(\.\d+)?)/);
                        if (match) return parseInt(match[1].replace(/,/g, ''));
                        return 0;
                    };

                    const title = document.querySelector('h1')?.innerText.trim() || '';
                    const price = getPrice();
                    
                    // Duration extraction
                    let duration = document.querySelector('.duration, .tour-duration, .itinerary-duration')?.innerText.trim() || '';
                    if (!duration) {
                        const durationMatch = document.body.innerText.match(/(\d+\s*Nights?\s*\d+\s*Days?)/i);
                        if (durationMatch) duration = durationMatch[1];
                    }
                    
                    const description = Array.from(document.querySelectorAll('.itinerary-description p, .tour-description p, .product-description p, #overview p'))
                        .map(p => p.innerText.trim()).filter(p => p.length > 20).join('\n\n');

                    const itinerary = [];
                    const dayHeaders = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, strong')).filter(h => 
                        /day|arrival|departure|journey|trek/i.test(h.innerText) && 
                        h.innerText.length < 100 && 
                        !h.innerText.includes('?') // Filter out FAQs
                    );

                    dayHeaders.forEach(header => {
                        let content = '';
                        let next = header.nextElementSibling || header.parentElement?.nextElementSibling;
                        let limit = 20; // Increased limit
                        while (next && limit > 0 && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(next.tagName)) {
                            const text = next.innerText.trim();
                            if (text.length > 0) content += text + '\n\n';
                            next = next.nextElementSibling;
                            limit--;
                        }
                        if (content.trim().length > 10 || header.nextElementSibling?.tagName === 'UL') {
                            if (content.trim().length < 20 && header.nextElementSibling?.tagName === 'UL') {
                                content = Array.from(header.nextElementSibling.querySelectorAll('li')).map(li => li.innerText).join('\n');
                            }
                            itinerary.push({ 
                                day: header.innerText.trim(), 
                                content: content.trim() || 'Experience the beauty of the Himalayas.' 
                            });
                        }
                    });

                    const inclusions = Array.from(document.querySelectorAll('#inclusions_exclusions li, .inclusions li, .includes li'))
                        .map(li => li.innerText.trim()).filter(t => t.length > 2);
                    
                    const exclusions = Array.from(document.querySelectorAll('.exclusions li, .excludes li'))
                        .map(li => li.innerText.trim()).filter(t => t.length > 2);

                    const highlights = Array.from(document.querySelectorAll('.highlights li, .tour-highlights li, .overview-highlights li, .itinerary-highlights li'))
                        .map(li => li.innerText.trim()).filter(t => t.length > 2);

                    const faqs = Array.from(document.querySelectorAll('.faq-item, .itinerary-faq, .product-faq-item')).map(item => ({
                        question: item.querySelector('h4, .faq-question')?.innerText.trim() || '',
                        answer: item.querySelector('p, .faq-answer')?.innerText.trim() || ''
                    })).filter(f => f.question && f.answer);

                    const images = Array.from(document.querySelectorAll('img[src*="cdn"], .gallery img, .itinerary-gallery img'))
                        .map(img => img.src)
                        .filter(src => src && !/logo|icon|badge|whatsapp|call|payment|shield/i.test(src));
                    
                    // Extract Variants (Starting Cities/Packages)
                    const variants = Array.from(document.querySelectorAll('.itinerary-booking-option, .tour-variant')).map(v => {
                        const label = v.querySelector('.option-title, h4')?.innerText.trim() || '';
                        const priceText = v.querySelector('.option-price, .price')?.innerText.trim() || '';
                        const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
                        return { label, discountedPrice: price, originalPrice: price + 2000, location: label.split(' ')[0] };
                    }).filter(v => v.label && v.discountedPrice > 0);

                    // Fallback for highlights from description if empty
                    const finalHighlights = highlights.length > 0 ? highlights : 
                        description.split('\n').filter(l => l.length > 10 && l.length < 80).slice(0, 6);

                    // Location logic
                    let location = 'Himalayas';
                    const locations = ['Manali', 'Kasol', 'Spiti', 'Ladakh', 'Kedarnath', 'Kerala', 'Amritsar', 'Kashmir', 'Shimla', 'Jibhi'];
                    for (const loc of locations) {
                        if (title.toLowerCase().includes(loc.toLowerCase())) {
                            location = loc;
                            break;
                        }
                    }

                    return { 
                        title, 
                        price, 
                        duration: duration || '8 Nights 9 Days', 
                        description: description || title, 
                        itinerary, 
                        highlights: finalHighlights,
                        inclusions, 
                        exclusions,
                        faqs: faqs.length > 0 ? faqs : [],
                        variants: variants.length > 0 ? variants : [],
                        images: [...new Set(images)].slice(0, 15), 
                        url: window.location.href,
                        location
                    };
                });

                if (validateTrip(tripData)) {
                    allTrips.push(tripData);
                    console.log(`✅ Validated: ${tripData.title}`);
                } else {
                    console.warn(`❌ Rejected: ${tripData.title} (Incomplete data)`);
                }
            } catch (err) {
                console.error(`❌ Error scraping ${link}: ${err.message}`);
            } finally {
                await tripPage.close();
            }
        }

        const uniqueTrips = deduplicateTrips(allTrips);
        
        // Save locally first
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
        fs.writeFileSync(path.join(dataDir, 'trips.json'), JSON.stringify(uniqueTrips, null, 2));
        
        console.log(`\n🎉 Scraping Complete! ${uniqueTrips.length} trips ready for sync.`);

        // AUTOMATED SYNC
        await syncToDatabase(uniqueTrips);

    } catch (err) {
        console.error(`💥 Fatal Error: ${err.message}`);
    } finally {
        await browser.close();
    }
}

runScraper();
