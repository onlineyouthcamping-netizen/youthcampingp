const { chromium } = require('playwright');
const { isValidTripURL, cleanURL, sleep } = require('./utils');

/**
 * CRAWL MODULE
 * Discovers all trip URLs from homepage, navigation, and sitemap
 */

/**
 * Crawl homepage and extract trip links from collections
 * @param {Page} page - Playwright page object
 * @param {string} baseUrl - Base URL of the website
 * @returns {Set<string>} - Set of unique trip URLs
 */
async function crawlHomepage(page, baseUrl) {
    const tripLinks = new Set();
    
    try {
        console.log('🏠 Crawling homepage...');
        await page.goto(baseUrl, { 
            waitUntil: 'networkidle', 
            timeout: 30000 
        });
        
        // Wait for content to load
        await sleep(2000);
        
        // Scroll to bottom to trigger lazy loading
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });
        await sleep(2000);
        
        // Extract all links that look like trip pages
        const links = await page.evaluate(() => {
            const allLinks = Array.from(document.querySelectorAll('a[href]'));
            return allLinks
                .map(a => {
                    const href = a.getAttribute('href');
                    return href ? new URL(href, window.location.origin).href : null;
                })
                .filter(href => href !== null);
        });
        
        console.log(`   Found ${links.length} total links on homepage`);
        
        links.forEach(link => {
            if (isValidTripURL(link)) {
                tripLinks.add(cleanURL(link));
            }
        });
        
        console.log(`   ✅ Extracted ${tripLinks.size} valid trip links from homepage`);
        
    } catch (err) {
        console.error(`   ❌ Error crawling homepage: ${err.message}`);
    }
    
    return tripLinks;
}

/**
 * Crawl collections/tours page
 * @param {Page} page - Playwright page object
 * @param {string} baseUrl - Base URL of the website
 * @returns {Set<string>} - Set of unique trip URLs
 */
async function crawlCollections(page, baseUrl) {
    const tripLinks = new Set();
    
    try {
        const collectionsUrls = [
            `${baseUrl}/collections/tours`,
            `${baseUrl}/collections/packages`,
            `${baseUrl}/collections/trips`,
            `${baseUrl}/tours`,
            `${baseUrl}/packages`,
            `${baseUrl}/trips`
        ];
        
        for (const collectionUrl of collectionsUrls) {
            try {
                console.log(`📂 Crawling ${collectionUrl}...`);
                
                const response = await page.goto(collectionUrl, { 
                    waitUntil: 'networkidle', 
                    timeout: 30000 
                }).catch(() => null);
                
                if (!response || !response.ok()) {
                    console.log(`   ⚠️ URL not found: ${collectionUrl}`);
                    continue;
                }
                
                // Scroll multiple times to load all products
                for (let i = 0; i < 5; i++) {
                    await page.evaluate(() => {
                        window.scrollBy(0, window.innerHeight);
                    });
                    await sleep(1000);
                }
                
                // Extract all trip links from collection
                const links = await page.evaluate(() => {
                    const allLinks = Array.from(document.querySelectorAll('a[href]'));
                    return allLinks
                        .map(a => {
                            const href = a.getAttribute('href');
                            return href ? new URL(href, window.location.origin).href : null;
                        })
                        .filter(href => href !== null);
                });
                
                console.log(`   Found ${links.length} links`);
                
                links.forEach(link => {
                    if (isValidTripURL(link)) {
                        tripLinks.add(cleanURL(link));
                    }
                });
                
                console.log(`   ✅ Extracted ${tripLinks.size} total trip links from collections so far`);
                
            } catch (err) {
                console.warn(`   ⚠️ Could not crawl ${collectionUrl}: ${err.message}`);
            }
        }
        
    } catch (err) {
        console.error(`   ❌ Error crawling collections: ${err.message}`);
    }
    
    return tripLinks;
}

/**
 * Crawl XML sitemap for all URLs
 * @param {Page} page - Playwright page object
 * @param {string} baseUrl - Base URL of the website
 * @returns {Set<string>} - Set of unique trip URLs
 */
async function crawlSitemap(page, baseUrl) {
    const tripLinks = new Set();
    
    try {
        console.log('🗺️  Crawling sitemap...');
        
        const sitemapUrls = [
            `${baseUrl}/sitemap.xml`,
            `${baseUrl}/sitemap_index.xml`,
            `${baseUrl}/sitemap-tours.xml`
        ];
        
        for (const sitemapUrl of sitemapUrls) {
            try {
                const response = await page.goto(sitemapUrl, { 
                    waitUntil: 'domcontentloaded', 
                    timeout: 30000 
                }).catch(() => null);
                
                if (!response || !response.ok()) {
                    console.log(`   ⚠️ Sitemap not found: ${sitemapUrl}`);
                    continue;
                }
                
                // Extract URLs from sitemap XML
                const urls = await page.evaluate(() => {
                    const urlElements = document.querySelectorAll('loc');
                    return Array.from(urlElements).map(el => el.textContent.trim());
                });
                
                console.log(`   Found ${urls.length} URLs in ${sitemapUrl}`);
                
                urls.forEach(url => {
                    if (url && isValidTripURL(url)) {
                        tripLinks.add(cleanURL(url));
                    }
                });
                
                // If this is sitemap_index, also crawl child sitemaps
                if (sitemapUrl.includes('index')) {
                    const childSitemaps = await page.evaluate(() => {
                        const sitemapElements = document.querySelectorAll('sitemap > loc');
                        return Array.from(sitemapElements).map(el => el.textContent.trim());
                    });
                    
                    for (const childUrl of childSitemaps) {
                        try {
                            await page.goto(childUrl, { 
                                waitUntil: 'domcontentloaded', 
                                timeout: 30000 
                            });
                            
                            const childUrls = await page.evaluate(() => {
                                const urlElements = document.querySelectorAll('loc');
                                return Array.from(urlElements).map(el => el.textContent.trim());
                            });
                            
                            console.log(`   Found ${childUrls.length} URLs in child sitemap`);
                            
                            childUrls.forEach(url => {
                                if (url && isValidTripURL(url)) {
                                    tripLinks.add(cleanURL(url));
                                }
                            });
                        } catch (err) {
                            console.warn(`   ⚠️ Could not crawl child sitemap ${childUrl}`);
                        }
                    }
                }
                
            } catch (err) {
                console.warn(`   ⚠️ Could not crawl ${sitemapUrl}: ${err.message}`);
            }
        }
        
        console.log(`   ✅ Extracted ${tripLinks.size} trip links from sitemaps`);
        
    } catch (err) {
        console.error(`   ❌ Error crawling sitemap: ${err.message}`);
    }
    
    return tripLinks;
}

/**
 * Main crawl function - orchestrates all crawling
 * @param {number} maxPages - Maximum pages to crawl (for testing)
 * @returns {Array<string>} - Array of unique trip URLs
 */
async function crawlAllURLs(maxPages = Infinity) {
    const baseUrl = 'https://www.youthcamping.in';
    const allTrips = new Set();
    let browser;
    
    try {
        console.log('\n🚀 Starting URL Discovery...\n');
        
        browser = await chromium.launch({ 
            headless: true,
            args: ['--disable-http2'] // Improve stability
        });
        
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        
        const page = await context.newPage();
        
        // Set viewport for consistency
        await page.setViewportSize({ width: 1280, height: 720 });
        
        // Crawl in sequence
        const homepageLinks = await crawlHomepage(page, baseUrl);
        homepageLinks.forEach(link => allTrips.add(link));
        
        await sleep(1000);
        
        const collectionLinks = await crawlCollections(page, baseUrl);
        collectionLinks.forEach(link => allTrips.add(link));
        
        await sleep(1000);
        
        const sitemapLinks = await crawlSitemap(page, baseUrl);
        sitemapLinks.forEach(link => allTrips.add(link));
        
        // Convert Set to Array and apply limit
        let tripUrlsArray = Array.from(allTrips);
        console.log(`\n✅ Found ${tripUrlsArray.length} unique trip URLs before filtering`);
        
        // Additional filtering - remove duplicates and invalid URLs
        tripUrlsArray = tripUrlsArray
            .filter(url => url && url.includes('youthcamping.in'))
            .filter(url => !url.includes('facebook.com') && !url.includes('instagram.com'))
            .slice(0, maxPages);
        
        console.log(`✅ Final count: ${tripUrlsArray.length} trip URLs ready for scraping\n`);
        
        await context.close();
        
        return tripUrlsArray;
        
    } catch (err) {
        console.error(`💥 Fatal error during URL discovery: ${err.message}`);
        throw err;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    crawlAllURLs,
    crawlHomepage,
    crawlCollections,
    crawlSitemap
};
