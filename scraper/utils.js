const fs = require('fs');
const path = require('path');

/**
 * UTILITY FUNCTIONS FOR SCRAPER
 */

/**
 * Clean price string and convert to number
 * @param {string} priceStr - Price string (e.g., "₹25,000", "$25000")
 * @returns {number} - Cleaned price as integer
 */
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const cleaned = String(priceStr).replace(/[₹$,\s]/g, '').trim();
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
}

/**
 * Normalize text (trim, remove extra spaces, clean quotes)
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
    if (!text) return '';
    return String(text)
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[""'']/g, '"')
        .replace(/&nbsp;/g, ' ');
}

/**
 * Extract duration in format "X Days Y Nights" or "X Nights Y Days"
 * @param {string} text - Text containing duration info
 * @returns {string} - Standardized duration string
 */
function parseDuration(text) {
    if (!text) return '';
    
    const normalizedText = normalizeText(text).toLowerCase();
    
    // Match patterns like "5 Days 4 Nights", "4 Nights 5 Days", etc.
    const patterns = [
        /(\d+)\s+(?:days?|d)\s+(\d+)\s+(?:nights?|n)/i,
        /(\d+)\s+(?:nights?|n)\s+(\d+)\s+(?:days?|d)/i
    ];
    
    for (const pattern of patterns) {
        const match = normalizedText.match(pattern);
        if (match) {
            const num1 = match[1];
            const num2 = match[2];
            
            if (normalizedText.includes('day')) {
                return `${num1} Days ${num2} Nights`;
            } else {
                return `${num2} Days ${num1} Nights`;
            }
        }
    }
    
    return normalizeText(text);
}

/**
 * Remove duplicates from array
 * @param {array} arr - Array to deduplicate
 * @returns {array} - Deduplicated array
 */
function deduplicate(arr) {
    return [...new Set(arr.map(item => 
        typeof item === 'string' ? item.trim() : item
    ))].filter(item => item && String(item).trim().length > 0);
}

/**
 * Filter and clean image URLs
 * @param {array} urls - Array of image URLs
 * @returns {array} - Filtered and cleaned URLs
 */
function filterImages(urls) {
    const invalidPatterns = /logo|icon|badge|whatsapp|call|payment|shield|arrow|chevron|menu|close|hamburger|button/i;
    
    return deduplicate(
        urls
            .filter(url => url && typeof url === 'string')
            .filter(url => !invalidPatterns.test(url))
            .filter(url => url.startsWith('http') || url.startsWith('/'))
            .map(url => {
                // Convert relative URLs to absolute if needed
                if (url.startsWith('/')) {
                    return 'https://www.youthcamping.in' + url;
                }
                return url;
            })
            .slice(0, 20) // Limit to 20 images
    );
}

/**
 * Validate trip data structure
 * @param {object} trip - Trip data object
 * @returns {object} - Validation result with isValid and errors
 */
function validateTrip(trip) {
    const errors = [];
    
    if (!trip.title || trip.title.trim().length < 3) errors.push('Invalid or missing title');
    if (!trip.price || trip.price <= 0) errors.push('Invalid or missing price');
    if (!trip.duration || trip.duration.trim().length < 3) errors.push('Invalid or missing duration');
    if (!trip.images || trip.images.length === 0) errors.push('No images found');
    if (!trip.description || trip.description.trim().length < 20) errors.push('Description too short');
    if (!trip.itinerary || trip.itinerary.length === 0) errors.push('No itinerary found');
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: []
    };
}

/**
 * Deduplicate trips by title and slug
 * @param {array} trips - Array of trip objects
 * @returns {array} - Deduplicated trips
 */
function deduplicateTrips(trips) {
    const seenTitles = new Set();
    const deduplicated = [];
    
    for (const trip of trips) {
        const titleKey = normalizeText(trip.title).toLowerCase();
        
        if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            deduplicated.push(trip);
        }
    }
    
    return deduplicated;
}

/**
 * Save data to JSON file
 * @param {string} filename - Filename to save to (in data/ directory)
 * @param {object} data - Data to save
 */
function saveJSON(filename, data) {
    const dataDir = path.join(__dirname, 'data');
    
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Saved: ${filePath}`);
    
    return filePath;
}

/**
 * Load data from JSON file
 * @param {string} filename - Filename to load from (in data/ directory)
 * @returns {object} - Loaded data or null if file doesn't exist
 */
function loadJSON(filename) {
    const dataDir = path.join(__dirname, 'data');
    const filePath = path.join(dataDir, filename);
    
    if (!fs.existsSync(filePath)) {
        return null;
    }
    
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`❌ Error loading ${filename}: ${err.message}`);
        return null;
    }
}

/**
 * Log error with timestamp
 * @param {string} url - URL that failed
 * @param {string} error - Error message
 * @param {array} errorLog - Array to append error to
 */
function logError(url, error, errorLog) {
    const errorEntry = {
        url,
        error: error.message || String(error),
        timestamp: new Date().toISOString(),
        stack: error.stack || null
    };
    
    errorLog.push(errorEntry);
    console.error(`❌ Error - ${url}: ${error.message || error}`);
}

/**
 * Retry logic wrapper
 * @param {function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {*} - Result of function
 */
async function retryAsync(fn, maxRetries = 3, delayMs = 2000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (i < maxRetries - 1) {
                console.warn(`⚠️ Retry ${i + 1}/${maxRetries - 1}: ${err.message}`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    
    throw lastError;
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 */
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if URL is valid trip detail page
 * @param {string} url - URL to check
 * @returns {boolean} - True if valid trip URL
 */
function isValidTripURL(url) {
    // Check if URL matches tour/trip pattern
    const tripPatterns = [
        /\/tours?\//i,
        /\/packages?\//i,
        /\/trips?\//i,
        /\/itinerary\//i,
        /\/(holiday|adventure|trek)\/[^/]+$/i
    ];
    
    return tripPatterns.some(pattern => pattern.test(url));
}

/**
 * Clean up URL (remove query params, fragments, duplicates)
 * @param {string} url - URL to clean
 * @returns {string} - Cleaned URL
 */
function cleanURL(url) {
    try {
        const urlObj = new URL(url);
        // Remove common tracking/session params
        const paramsToRemove = ['utm_', 'fbclid', 'gclid', 'sessionid', 'sid'];
        
        for (const param of paramsToRemove) {
            const keysToDelete = Array.from(urlObj.searchParams.keys()).filter(key => key.startsWith(param));
            keysToDelete.forEach(key => urlObj.searchParams.delete(key));
        }
        
        // Remove fragment
        urlObj.hash = '';
        
        // Normalize protocol to https
        if (urlObj.protocol === 'http:') {
            urlObj.protocol = 'https:';
        }
        
        return urlObj.toString();
    } catch (err) {
        return url;
    }
}

module.exports = {
    parsePrice,
    normalizeText,
    parseDuration,
    deduplicate,
    filterImages,
    validateTrip,
    deduplicateTrips,
    saveJSON,
    loadJSON,
    logError,
    retryAsync,
    sleep,
    isValidTripURL,
    cleanURL
};
