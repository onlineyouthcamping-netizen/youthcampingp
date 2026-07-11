const { normalizeText, parsePrice, parseDuration, filterImages, validateTrip, deduplicate } = require('./utils');
const { sleep } = require('./utils');

/**
 * TRIP DETAIL SCRAPER MODULE
 * Extracts detailed information from individual trip pages
 */

/**
 * Extract basic trip information from page
 * @param {Page} page - Playwright page object
 * @returns {object} - Basic trip info
 */
async function extractBasicInfo(page) {
    const basicInfo = await page.evaluate(() => {
        // Extract title
        const titleSelectors = ['h1', 'h1.title', 'h1.tour-title', '.page-title h1'];
        let title = '';
        for (const selector of titleSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                title = el.innerText.trim();
                if (title) break;
            }
        }
        
        // Extract price
        let price = 0;
        const priceSelectors = [
            'meta[property="product:price:amount"]',
            '[data-price]',
            '.price',
            '.tour-price',
            '.itinerary-price',
            'span.money',
            '.current_price',
            '.sale-price'
        ];
        
        for (const selector of priceSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                const content = el.getAttribute('content') || el.getAttribute('data-price') || el.innerText;
                const cleaned = String(content).replace(/[^0-9]/g, '');
                if (cleaned) {
                    price = parseInt(cleaned);
                    if (price > 0) break;
                }
            }
        }
        
        // Fallback: search body text for ₹ symbol
        if (price === 0) {
            const bodyText = document.body.innerText;
            const match = bodyText.match(/₹\s*(\d{1,3}(?:,\d{3})*)/);
            if (match) {
                price = parseInt(match[1].replace(/,/g, ''));
            }
        }
        
        // Extract original price
        let originalPrice = 0;
        const originalPriceSelectors = [
            '.original-price',
            '.old-price',
            '.regular-price',
            'meta[property="product:price:original"]',
            '.sale-price-before'
        ];
        
        for (const selector of originalPriceSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                const content = el.getAttribute('content') || el.innerText;
                const cleaned = String(content).replace(/[^0-9]/g, '');
                if (cleaned) {
                    originalPrice = parseInt(cleaned);
                    if (originalPrice > 0) break;
                }
            }
        }
        
        // Extract duration
        let duration = '';
        const durationSelectors = [
            '.duration',
            '.tour-duration',
            '.itinerary-duration',
            '[data-duration]',
            '.trip-duration'
        ];
        
        for (const selector of durationSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                duration = el.innerText.trim();
                if (duration) break;
            }
        }
        
        // Fallback: search body text for duration pattern
        if (!duration) {
            const bodyText = document.body.innerText;
            const durationMatch = bodyText.match(/(\d+)\s*(?:Nights?|Days?)\s+(\d+)\s*(?:Days?|Nights?)/i);
            if (durationMatch) {
                duration = durationMatch[0];
            }
        }
        
        // Extract location from title or dedicated element
        let location = '';
        const locationSelectors = ['.location', '.destination', '.tour-location', '[data-location]'];
        for (const selector of locationSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                location = el.innerText.trim();
                if (location) break;
            }
        }
        
        // Try extracting from title if no location element
        if (!location && title) {
            const commonLocations = ['Manali', 'Kasol', 'Spiti', 'Ladakh', 'Kedarnath', 'Kerala', 'Kashmir', 'Shimla', 'Jibhi', 'Auli', 'Goa', 'Agra', 'Ooty', 'Darjeeling', 'Amritsar'];
            for (const loc of commonLocations) {
                if (title.toLowerCase().includes(loc.toLowerCase())) {
                    location = loc;
                    break;
                }
            }
        }
        
        return {
            title: title.trim(),
            price,
            originalPrice: originalPrice > price ? originalPrice : 0,
            duration: duration.trim(),
            location: location.trim() || 'India'
        };
    });
    
    return basicInfo;
}

/**
 * Extract description/overview section
 * @param {Page} page - Playwright page object
 * @returns {string} - Description text
 */
async function extractDescription(page) {
    const description = await page.evaluate(() => {
        const descriptionSelectors = [
            '.overview',
            '.description',
            '.tour-description',
            '.product-description',
            '#overview',
            '.itinerary-overview',
            '.trip-overview'
        ];
        
        let text = '';
        for (const selector of descriptionSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                const paragraphs = Array.from(el.querySelectorAll('p, span, div')).map(p => p.innerText.trim());
                text = paragraphs.filter(p => p.length > 20).join('\n\n');
                if (text) break;
            }
        }
        
        return text.trim();
    });
    
    return normalizeText(description);
}

/**
 * Click and handle dynamic tabs/accordions
 * @param {Page} page - Playwright page object
 * @returns {void}
 */
async function handleDynamicContent(page) {
    try {
        // Click tab buttons
        const tabButtons = await page.$$('[role="tab"], .tab-button, .nav-tabs button');
        for (const button of tabButtons) {
            try {
                await button.click();
                await sleep(500);
            } catch (err) {
                // Continue if click fails
            }
        }
        
        // Expand accordion items
        const accordionButtons = await page.$$('.accordion-button, [data-bs-toggle="collapse"], .toggle-btn');
        for (const button of accordionButtons) {
            try {
                await button.click();
                await sleep(300);
            } catch (err) {
                // Continue if click fails
            }
        }
        
        // Scroll to load lazy content
        for (let i = 0; i < 5; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, window.innerHeight / 2);
            });
            await sleep(500);
        }
        
    } catch (err) {
        console.warn(`   ⚠️ Error handling dynamic content: ${err.message}`);
    }
}

/**
 * Extract itinerary details
 * @param {Page} page - Playwright page object
 * @returns {Array<object>} - Itinerary array
 */
async function extractItinerary(page) {
    // First, handle dynamic content
    await handleDynamicContent(page);
    
    const itinerary = await page.evaluate(() => {
        const days = [];
        
        // Look for day-wise itinerary structure
        const dayHeaders = Array.from(document.querySelectorAll('h2, h3, h4, strong, .day-title, .itinerary-day'))
            .filter(el => {
                const text = el.innerText.toLowerCase();
                return /day\s+\d+|day\s+\d+|arrival|departure|journey|trek|morning|evening|night/i.test(text);
            });
        
        dayHeaders.forEach((header, index) => {
            const dayTitle = header.innerText.trim();
            let description = '';
            
            // Collect content until next header
            let next = header.nextElementSibling;
            const contentParts = [];
            let limit = 30;
            
            while (next && limit > 0) {
                // Stop if we hit another header
                if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'STRONG'].includes(next.tagName)) {
                    // Check if this looks like a new day
                    if (/day\s+\d+|arrival|departure/i.test(next.innerText.toLowerCase())) {
                        break;
                    }
                }
                
                const text = next.innerText.trim();
                if (text && !text.includes('?')) { // Skip FAQs
                    contentParts.push(text);
                }
                
                next = next.nextElementSibling;
                limit--;
            }
            
            description = contentParts.join('\n\n').substring(0, 1000).trim() || dayTitle;
            
            if (description.length > 10) {
                days.push({
                    day: dayTitle,
                    title: dayTitle.replace(/day\s+\d+[:]*\s*/i, '').trim() || `Day ${index + 1}`,
                    description
                });
            }
        });
        
        return days;
    });
    
    return itinerary.length > 0 ? itinerary : [];
}

/**
 * Extract inclusions list
 * @param {Page} page - Playwright page object
 * @returns {Array<string>} - Inclusions array
 */
async function extractInclusions(page) {
    const inclusions = await page.evaluate(() => {
        const selectors = [
            '#inclusions li',
            '.inclusions li',
            '.includes li',
            '.what-included li',
            '[data-inclusions] li',
            '.itinerary-inclusions li'
        ];
        
        let items = [];
        for (const selector of selectors) {
            const els = document.querySelectorAll(selector);
            if (els.length > 0) {
                items = Array.from(els).map(el => el.innerText.trim()).filter(t => t.length > 2);
                if (items.length > 0) break;
            }
        }
        
        return items;
    });
    
    return deduplicate(inclusions);
}

/**
 * Extract exclusions list
 * @param {Page} page - Playwright page object
 * @returns {Array<string>} - Exclusions array
 */
async function extractExclusions(page) {
    const exclusions = await page.evaluate(() => {
        const selectors = [
            '#exclusions li',
            '.exclusions li',
            '.excludes li',
            '.what-excluded li',
            '[data-exclusions] li',
            '.itinerary-exclusions li'
        ];
        
        let items = [];
        for (const selector of selectors) {
            const els = document.querySelectorAll(selector);
            if (els.length > 0) {
                items = Array.from(els).map(el => el.innerText.trim()).filter(t => t.length > 2);
                if (items.length > 0) break;
            }
        }
        
        return items;
    });
    
    return deduplicate(exclusions);
}

/**
 * Extract pickup points
 * @param {Page} page - Playwright page object
 * @returns {Array<string>} - Pickup points array
 */
async function extractPickupPoints(page) {
    const points = await page.evaluate(() => {
        const selectors = [
            '.pickup-points li',
            '.pickup-locations li',
            '.starting-points li',
            '[data-pickups] li',
            '.departure-cities li'
        ];
        
        let items = [];
        for (const selector of selectors) {
            const els = document.querySelectorAll(selector);
            if (els.length > 0) {
                items = Array.from(els).map(el => el.innerText.trim()).filter(t => t.length > 2);
                if (items.length > 0) break;
            }
        }
        
        return items;
    });
    
    return deduplicate(points);
}

/**
 * Extract policies
 * @param {Page} page - Playwright page object
 * @returns {Array<object>} - Policies array
 */
async function extractPolicies(page) {
    const policies = await page.evaluate(() => {
        const policyItems = [];
        
        const selectors = ['.policies li', '.terms li', '.terms-conditions li', '.policy-item'];
        
        for (const selector of selectors) {
            const els = document.querySelectorAll(selector);
            if (els.length > 0) {
                els.forEach(el => {
                    const text = el.innerText.trim();
                    if (text.length > 5) {
                        policyItems.push({ text });
                    }
                });
                if (policyItems.length > 0) break;
            }
        }
        
        return policyItems;
    });
    
    return policies;
}

/**
 * Extract all images from page
 * @param {Page} page - Playwright page object
 * @returns {Array<string>} - Image URLs array
 */
async function extractImages(page) {
    // Scroll to load all lazy images
    await page.evaluate(() => {
        for (let i = 0; i < 10; i++) {
            window.scrollBy(0, window.innerHeight);
        }
    });
    
    await sleep(2000);
    
    const images = await page.evaluate(() => {
        const imgElements = Array.from(document.querySelectorAll('img[src]'));
        const urls = imgElements
            .map(img => img.src || img.getAttribute('data-src'))
            .filter(src => src && (src.startsWith('http') || src.startsWith('/')));
        
        return [...new Set(urls)];
    });
    
    return filterImages(images);
}

/**
 * Extract highlights
 * @param {Page} page - Playwright page object
 * @returns {Array<string>} - Highlights array
 */
async function extractHighlights(page) {
    const highlights = await page.evaluate(() => {
        const selectors = [
            '.highlights li',
            '.trip-highlights li',
            '.tour-highlights li',
            '.overview-highlights li',
            '.key-features li'
        ];
        
        let items = [];
        for (const selector of selectors) {
            const els = document.querySelectorAll(selector);
            if (els.length > 0) {
                items = Array.from(els).map(el => el.innerText.trim()).filter(t => t.length > 2);
                if (items.length > 0) break;
            }
        }
        
        return items;
    });
    
    return deduplicate(highlights);
}

/**
 * Scrape complete trip details from a single page
 * @param {Page} page - Playwright page object
 * @param {string} url - Trip URL
 * @returns {object} - Complete trip data
 */
async function scrapeTrip(page, url) {
    try {
        console.log(`   🔍 Scraping: ${url}`);
        
        // Navigate with retry logic
        await page.goto(url, { 
            waitUntil: 'networkidle', 
            timeout: 60000 
        }).catch(async () => {
            console.warn(`   ⚠️ networkidle timeout, continuing with domcontentloaded`);
            await page.goto(url, { waitUntil: 'domcontentloaded' });
        });
        
        await sleep(1500); // Additional wait for content
        
        // Extract all sections
        const [basicInfo, description, itinerary, inclusions, exclusions, pickupPoints, policies, images, highlights] = 
            await Promise.all([
                extractBasicInfo(page),
                extractDescription(page),
                extractItinerary(page),
                extractInclusions(page),
                extractExclusions(page),
                extractPickupPoints(page),
                extractPolicies(page),
                extractImages(page),
                extractHighlights(page)
            ]);
        
        // Construct trip object
        const trip = {
            title: normalizeText(basicInfo.title),
            location: normalizeText(basicInfo.location),
            duration: parseDuration(basicInfo.duration),
            price: basicInfo.price,
            originalPrice: basicInfo.originalPrice,
            discount: basicInfo.originalPrice > 0 ? basicInfo.originalPrice - basicInfo.price : 0,
            highlights: highlights.length > 0 ? highlights : [],
            description: description || basicInfo.title,
            itinerary: itinerary.length > 0 ? itinerary : [{ day: 'Day 1', title: 'Experience', description }],
            inclusions: inclusions.length > 0 ? inclusions : [],
            exclusions: exclusions.length > 0 ? exclusions : [],
            images: images.length > 0 ? images : [],
            pickupPoints: pickupPoints.length > 0 ? pickupPoints : [],
            policies: policies.length > 0 ? policies : [],
            url: url
        };
        
        // Validate
        const validation = validateTrip(trip);
        if (validation.isValid) {
            console.log(`      ✅ Validated: ${trip.title}`);
            return trip;
        } else {
            console.warn(`      ⚠️ Validation warnings: ${validation.errors.join(', ')}`);
            // Return anyway for partial data
            return trip;
        }
        
    } catch (err) {
        console.error(`   ❌ Error scraping ${url}: ${err.message}`);
        throw err;
    }
}

module.exports = {
    scrapeTrip,
    extractBasicInfo,
    extractDescription,
    extractItinerary,
    extractInclusions,
    extractExclusions,
    extractPickupPoints,
    extractPolicies,
    extractImages,
    extractHighlights,
    handleDynamicContent
};
