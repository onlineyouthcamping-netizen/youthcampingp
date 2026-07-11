#!/usr/bin/env node

/**
 * YOUTH CAMPING SCRAPER
 * Production-ready web scraper for youthcamping.in
 * 
 * Usage:
 *   node index.js                    # Scrape all trips
 *   node index.js --max 10          # Scrape first 10 trips
 *   node index.js --resume           # Resume from last checkpoint
 * 
 * Output:
 *   - data/trips.json                # All scraped trips
 *   - data/errors.json              # Failed URLs with errors
 *   - data/checkpoint.json          # Progress checkpoint (for resume)
 */

const { chromium } = require('playwright');
const { crawlAllURLs } = require('./crawl');
const { scrapeTrip } = require('./scrapeTrip');
const {
    saveJSON,
    loadJSON,
    logError,
    retryAsync,
    deduplicateTrips,
    sleep
} = require('./utils');

const fs = require('fs');
const path = require('path');

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        maxPages: Infinity,
        resume: false,
        concurrency: 3,
        retries: 3
    };
    
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--max' && args[i + 1]) {
            options.maxPages = parseInt(args[i + 1]);
            i++;
        } else if (args[i] === '--resume') {
            options.resume = true;
        } else if (args[i] === '--concurrency' && args[i + 1]) {
            options.concurrency = parseInt(args[i + 1]);
            i++;
        } else if (args[i] === '--help' || args[i] === '-h') {
            console.log(`
YOUTH CAMPING SCRAPER

Usage: node index.js [options]

Options:
  --max <number>           Limit scraping to N trips (default: unlimited)
  --resume                 Resume from last checkpoint
  --concurrency <number>   Number of concurrent pages (default: 3)
  --help, -h              Show this help message

Examples:
  node index.js                    # Scrape all trips
  node index.js --max 10          # Scrape first 10 trips
  node index.js --resume           # Resume previous scraping
  node index.js --concurrency 5   # Use 5 concurrent pages
            `);
            process.exit(0);
        }
    }
    
    return options;
}

/**
 * Main scraper orchestrator
 */
async function main() {
    const options = parseArgs();
    const startTime = Date.now();
    
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║       YOUTH CAMPING SCRAPER - Production Ready            ║
║                                                           ║
║ Website: https://www.youthcamping.in                     ║
║ Output: /data/trips.json                                 ║
╚═══════════════════════════════════════════════════════════╝
    `);
    
    console.log(`⚙️  Configuration:`);
    console.log(`   Max Pages: ${options.maxPages === Infinity ? 'Unlimited' : options.maxPages}`);
    console.log(`   Concurrency: ${options.concurrency} pages`);
    console.log(`   Retries: ${options.retries}`);
    console.log(`   Resume: ${options.resume ? 'Yes' : 'No'}`);
    console.log('');
    
    let tripUrls = [];
    let scrapedTrips = [];
    let errorLog = [];
    let startIndex = 0;
    
    try {
        // Check for checkpoint if resuming
        if (options.resume) {
            const checkpoint = loadJSON('checkpoint.json');
            if (checkpoint) {
                console.log('📍 Resuming from checkpoint...');
                scrapedTrips = checkpoint.scrapedTrips || [];
                errorLog = checkpoint.errorLog || [];
                tripUrls = checkpoint.tripUrls || [];
                startIndex = checkpoint.lastIndex || 0;
                console.log(`   ✓ Resuming from index ${startIndex}`);
                console.log(`   ✓ Already scraped: ${scrapedTrips.length} trips`);
                console.log(`   ✓ Errors so far: ${errorLog.length}\n`);
            } else {
                options.resume = false;
                console.log('⚠️  No checkpoint found, starting fresh\n');
            }
        }
        
        // Discover URLs if not resuming or if URLs empty
        if (!options.resume || tripUrls.length === 0) {
            console.log('📍 Phase 1: URL Discovery\n');
            tripUrls = await crawlAllURLs(options.maxPages);
            
            if (tripUrls.length === 0) {
                console.error('❌ No trip URLs found. Exiting.');
                process.exit(1);
            }
            
            scrapedTrips = [];
            errorLog = [];
            startIndex = 0;
        }
        
        // Phase 2: Scraping
        console.log(`\n📍 Phase 2: Scraping Trips (${tripUrls.length} URLs)\n`);
        
        const browser = await chromium.launch({ 
            headless: true,
            args: [
                '--disable-http2',
                '--disable-gpu',
                '--no-sandbox'
            ]
        });
        
        // Create context with proper settings
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ignoreHTTPSErrors: true
        });
        
        // Process URLs in batches with concurrency control
        for (let i = startIndex; i < tripUrls.length; i += options.concurrency) {
            const batch = tripUrls.slice(i, i + options.concurrency);
            const batchNum = Math.floor(i / options.concurrency) + 1;
            
            console.log(`\n🔄 Batch ${batchNum}/${Math.ceil(tripUrls.length / options.concurrency)} (URLs ${i + 1}-${Math.min(i + options.concurrency, tripUrls.length)})`);
            
            // Create pages in parallel
            const pages = await Promise.all(
                batch.map(() => context.newPage())
            );
            
            try {
                // Scrape batch in parallel with error handling
                const results = await Promise.allSettled(
                    batch.map((url, idx) =>
                        retryAsync(
                            () => scrapeTrip(pages[idx], url),
                            options.retries,
                            1000
                        ).catch(err => {
                            throw { url, error: err };
                        })
                    )
                );
                
                // Process results
                for (let j = 0; j < results.length; j++) {
                    const result = results[j];
                    const url = batch[j];
                    
                    if (result.status === 'fulfilled') {
                        scrapedTrips.push(result.value);
                        console.log(`      ✅ Success (${scrapedTrips.length}/${tripUrls.length})`);
                    } else {
                        const error = result.reason;
                        logError(url, error.error || error, errorLog);
                        console.log(`      ❌ Failed (${errorLog.length} errors)`);
                    }
                }
                
            } finally {
                // Close pages
                await Promise.all(pages.map(page => page.close().catch(() => {})));
            }
            
            // Save checkpoint after each batch
            saveJSON('checkpoint.json', {
                lastIndex: i + options.concurrency,
                scrapedTrips,
                errorLog,
                tripUrls,
                timestamp: new Date().toISOString()
            });
            
            // Small delay between batches
            if (i + options.concurrency < tripUrls.length) {
                await sleep(2000);
            }
        }
        
        await browser.close();
        
        // Phase 3: Data Processing
        console.log('\n📍 Phase 3: Data Processing\n');
        
        console.log(`   Processing ${scrapedTrips.length} trips...`);
        
        // Deduplicate
        const uniqueTrips = deduplicateTrips(scrapedTrips);
        const duplicatesRemoved = scrapedTrips.length - uniqueTrips.length;
        if (duplicatesRemoved > 0) {
            console.log(`   ♻️  Removed ${duplicatesRemoved} duplicates`);
        }
        
        // Sort by price for easier browsing
        uniqueTrips.sort((a, b) => a.price - b.price);
        
        // Phase 4: Output
        console.log(`\n📍 Phase 4: Saving Results\n`);
        
        const tripsPath = saveJSON('trips.json', uniqueTrips);
        const errorsPath = saveJSON('errors.json', errorLog);
        
        // Remove checkpoint on successful completion
        const checkpointPath = path.join(__dirname, 'data', 'checkpoint.json');
        if (fs.existsSync(checkpointPath)) {
            fs.unlinkSync(checkpointPath);
            console.log(`✅ Cleaned up: checkpoint.json`);
        }
        
        // Generate summary
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const successRate = Math.round((uniqueTrips.length / tripUrls.length) * 100);
        
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    SCRAPING COMPLETE!                     ║
╚═══════════════════════════════════════════════════════════╝

📊 FINAL STATISTICS:
   • Total URLs discovered:    ${tripUrls.length}
   • Successfully scraped:     ${uniqueTrips.length}
   • Unique trips (dedup):     ${uniqueTrips.length}
   • Failed URLs:              ${errorLog.length}
   • Success rate:             ${successRate}%
   • Total time:               ${duration}s
   
💾 OUTPUT FILES:
   • Trips data:               ${tripsPath}
   • Error log:                ${errorsPath}
   
✅ Data is ready for use!
        `);
        
        // Show sample data
        if (uniqueTrips.length > 0) {
            console.log(`📋 Sample Trip (1st result):`);
            const sample = uniqueTrips[0];
            console.log(`   Title:    ${sample.title}`);
            console.log(`   Location: ${sample.location}`);
            console.log(`   Duration: ${sample.duration}`);
            console.log(`   Price:    ₹${sample.price}`);
            console.log(`   Images:   ${sample.images.length}`);
            console.log(`   Itinerary Days: ${sample.itinerary.length}`);
        }
        
        if (errorLog.length > 0) {
            console.log(`\n⚠️  Failed URLs (${errorLog.length}):`);
            errorLog.slice(0, 5).forEach(err => {
                console.log(`   ❌ ${err.url}`);
                console.log(`      └─ ${err.error}`);
            });
            if (errorLog.length > 5) {
                console.log(`   ... and ${errorLog.length - 5} more (see errors.json)`);
            }
        }
        
        console.log('\n✨ Scraping pipeline complete!\n');
        
        // Exit cleanly
        process.exit(0);
        
    } catch (err) {
        console.error(`\n💥 FATAL ERROR: ${err.message}`);
        console.error(err.stack);
        
        // Save state before exit
        try {
            saveJSON('checkpoint.json', {
                lastIndex: startIndex,
                scrapedTrips,
                errorLog,
                tripUrls,
                timestamp: new Date().toISOString(),
                fatalError: err.message
            });
            console.log('\n💾 State saved to checkpoint.json. Run with --resume to continue.');
        } catch (saveErr) {
            console.error(`Failed to save checkpoint: ${saveErr.message}`);
        }
        
        process.exit(1);
    }
}

// Run scraper
main().catch(err => {
    console.error(`Uncaught error: ${err.message}`);
    process.exit(1);
});
