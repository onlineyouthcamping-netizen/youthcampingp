/**
 * DEPLOYMENT: WINDOWS TASK SCHEDULER + MONGODB SYNC
 * 
 * This script runs the scraper with MongoDB integration
 * Configured for weekly execution (Sunday 2:00 AM)
 */

const { chromium } = require('playwright');
const { crawlAllURLs } = require('./crawl');
const { scrapeTrip } = require('./scrapeTrip');
const { saveJSON, loadJSON, logError, retryAsync, deduplicateTrips, sleep } = require('./utils');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * MongoDB Connection & Sync
 */
async function syncToMongoDB(trips) {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.log('⚠️  MONGODB_URI not set. Saving to JSON only.');
        return { skipped: true, reason: 'No MongoDB URI' };
    }
    
    try {
        console.log('\n🔗 Connecting to MongoDB...');
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            retryWrites: true,
            w: 'majority'
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Define schema
        const tripSchema = new mongoose.Schema({
            title: { type: String, required: true, unique: true },
            location: String,
            duration: String,
            price: Number,
            originalPrice: Number,
            discount: Number,
            highlights: [String],
            description: String,
            itinerary: [{
                day: String,
                title: String,
                description: String
            }],
            inclusions: [String],
            exclusions: [String],
            images: [String],
            pickupPoints: [String],
            policies: [{ text: String }],
            sourceUrl: String,
            scrapedAt: { type: Date, default: Date.now },
            status: { type: String, default: 'published' }
        });
        
        const Trip = mongoose.model('Trip', tripSchema);
        
        console.log('🗑️  Clearing old trips...');
        await Trip.deleteMany({});
        
        let inserted = 0;
        for (const trip of trips) {
            try {
                await Trip.create({
                    title: trip.title,
                    location: trip.location,
                    duration: trip.duration,
                    price: trip.price,
                    originalPrice: trip.originalPrice,
                    discount: trip.discount,
                    highlights: trip.highlights,
                    description: trip.description,
                    itinerary: trip.itinerary,
                    inclusions: trip.inclusions,
                    exclusions: trip.exclusions,
                    images: trip.images,
                    pickupPoints: trip.pickupPoints,
                    policies: trip.policies,
                    sourceUrl: trip.url
                });
                inserted++;
            } catch (err) {
                if (err.code === 11000) {
                    // Duplicate key, try update
                    await Trip.updateOne(
                        { title: trip.title },
                        { $set: trip },
                        { upsert: true }
                    );
                    inserted++;
                }
            }
        }
        
        console.log(`✅ Synced ${inserted}/${trips.length} trips to MongoDB`);
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        
        return { success: true, inserted };
        
    } catch (err) {
        console.error(`❌ MongoDB Error: ${err.message}`);
        return { error: err.message, success: false };
    }
}

/**
 * Main deployment scraper
 */
async function main() {
    const startTime = Date.now();
    const logFile = path.join(__dirname, 'logs', `scrape-${new Date().toISOString().split('T')[0]}.log`);
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    const log = (msg) => {
        const timestamp = new Date().toISOString();
        const logMsg = `[${timestamp}] ${msg}`;
        console.log(logMsg);
        logStream.write(logMsg + '\n');
    };
    
    try {
        log('═══════════════════════════════════════════');
        log('🚀 DEPLOYMENT SCRAPER - Weekly Run');
        log('═══════════════════════════════════════════\n');
        
        // Phase 1: Discovery
        log('📍 Phase 1: URL Discovery');
        const tripUrls = await crawlAllURLs();
        
        if (tripUrls.length === 0) {
            log('❌ No trip URLs found. Exiting.');
            logStream.end();
            process.exit(1);
        }
        
        log(`✅ Found ${tripUrls.length} trips to scrape\n`);
        
        // Phase 2: Scraping
        log('📍 Phase 2: Scraping Trips');
        
        const browser = await chromium.launch({ 
            headless: true,
            args: ['--disable-http2', '--disable-gpu', '--no-sandbox']
        });
        
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        
        let scrapedTrips = [];
        let errors = [];
        const concurrency = 3;
        
        for (let i = 0; i < tripUrls.length; i += concurrency) {
            const batch = tripUrls.slice(i, i + concurrency);
            const pages = await Promise.all(batch.map(() => context.newPage()));
            
            const results = await Promise.allSettled(
                batch.map((url, idx) =>
                    retryAsync(
                        () => scrapeTrip(pages[idx], url),
                        3,
                        1000
                    )
                )
            );
            
            for (let j = 0; j < results.length; j++) {
                const result = results[j];
                if (result.status === 'fulfilled') {
                    scrapedTrips.push(result.value);
                    log(`  ✅ ${result.value.title}`);
                } else {
                    errors.push({
                        url: batch[j],
                        error: result.reason.message
                    });
                    log(`  ❌ ${batch[j]}: ${result.reason.message}`);
                }
            }
            
            await Promise.all(pages.map(p => p.close().catch(() => {})));
            await sleep(2000);
        }
        
        await browser.close();
        
        log(`\n📍 Phase 3: Processing`);
        const uniqueTrips = deduplicateTrips(scrapedTrips);
        log(`✅ Deduped to ${uniqueTrips.length} unique trips\n`);
        
        // Phase 4: Save & Sync
        log('📍 Phase 4: Saving Results');
        saveJSON('trips.json', uniqueTrips);
        saveJSON('errors.json', errors);
        
        const mongoResult = await syncToMongoDB(uniqueTrips);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        log('\n═══════════════════════════════════════════');
        log('✨ DEPLOYMENT COMPLETE');
        log('═══════════════════════════════════════════');
        log(`📊 Total trips: ${uniqueTrips.length}`);
        log(`❌ Errors: ${errors.length}`);
        log(`⏱️  Duration: ${duration}s`);
        log(`📁 Log: ${logFile}`);
        if (!mongoResult.skipped) {
            log(`🗄️  MongoDB: ${mongoResult.success ? 'Synced' : 'Failed'}`);
        }
        log('═══════════════════════════════════════════\n');
        
        logStream.end();
        process.exit(0);
        
    } catch (err) {
        log(`\n💥 ERROR: ${err.message}`);
        log(err.stack);
        logStream.end();
        process.exit(1);
    }
}

// Run scraper
main();
