#!/usr/bin/env node

/**
 * INTEGRATION EXAMPLES
 * Shows how to use the scraped data in various scenarios
 */

const fs = require('fs');
const path = require('path');

// Load trips from scraped data
function loadTrips() {
    const dataPath = path.join(__dirname, 'data', 'trips.json');
    if (!fs.existsSync(dataPath)) {
        console.error('❌ trips.json not found. Run: npm run scrape');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
}

/**
 * EXAMPLE 1: Filter trips by price range
 */
function filterByPrice(minPrice = 0, maxPrice = Infinity) {
    const trips = loadTrips();
    return trips.filter(trip => trip.price >= minPrice && trip.price <= maxPrice);
}

/**
 * EXAMPLE 2: Search trips by location
 */
function searchByLocation(location) {
    const trips = loadTrips();
    return trips.filter(trip => 
        trip.location.toLowerCase().includes(location.toLowerCase()) ||
        trip.title.toLowerCase().includes(location.toLowerCase())
    );
}

/**
 * EXAMPLE 3: Sort trips by price
 */
function tripsByPrice(sortOrder = 'asc') {
    const trips = loadTrips();
    return trips.sort((a, b) => 
        sortOrder === 'asc' ? a.price - b.price : b.price - a.price
    );
}

/**
 * EXAMPLE 4: Get trips with discount
 */
function tripsWithDiscount() {
    const trips = loadTrips();
    return trips.filter(trip => trip.discount > 0)
        .map(trip => ({
            ...trip,
            discountPercent: Math.round((trip.discount / trip.originalPrice) * 100)
        }));
}

/**
 * EXAMPLE 5: Export to CSV format
 */
function exportToCSV(filename = 'trips.csv') {
    const trips = loadTrips();
    
    const csv = [
        'Title,Location,Duration,Price,Original Price,Discount,Images Count,Itinerary Days,URL'
    ];
    
    trips.forEach(trip => {
        csv.push([
            `"${trip.title}"`,
            trip.location,
            trip.duration,
            trip.price,
            trip.originalPrice,
            trip.discount,
            trip.images.length,
            trip.itinerary.length,
            trip.url
        ].join(','));
    });
    
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, csv.join('\n'), 'utf8');
    console.log(`✅ Exported to ${outputPath}`);
    return outputPath;
}

/**
 * EXAMPLE 6: Get trip statistics
 */
function getStatistics() {
    const trips = loadTrips();
    
    const stats = {
        totalTrips: trips.length,
        avgPrice: Math.round(trips.reduce((sum, t) => sum + t.price, 0) / trips.length),
        minPrice: Math.min(...trips.map(t => t.price)),
        maxPrice: Math.max(...trips.map(t => t.price)),
        locations: [...new Set(trips.map(t => t.location))],
        tripsWithDiscount: trips.filter(t => t.discount > 0).length,
        avgImages: Math.round(trips.reduce((sum, t) => sum + t.images.length, 0) / trips.length),
        avgItineraryDays: Math.round(trips.reduce((sum, t) => sum + t.itinerary.length, 0) / trips.length)
    };
    
    return stats;
}

/**
 * EXAMPLE 7: Get popular destinations
 */
function getPopularDestinations() {
    const trips = loadTrips();
    const locations = {};
    
    trips.forEach(trip => {
        locations[trip.location] = (locations[trip.location] || 0) + 1;
    });
    
    return Object.entries(locations)
        .sort((a, b) => b[1] - a[1])
        .map(([location, count]) => ({ location, count }));
}

/**
 * EXAMPLE 8: Find best value trips (high itinerary, low price)
 */
function findBestValueTrips() {
    const trips = loadTrips();
    
    return trips
        .map(trip => ({
            ...trip,
            valueScore: (trip.itinerary.length * 100) / trip.price
        }))
        .sort((a, b) => b.valueScore - a.valueScore)
        .slice(0, 10);
}

/**
 * EXAMPLE 9: Build searchable index
 */
function buildSearchIndex() {
    const trips = loadTrips();
    
    const index = {
        byId: {},
        byTitle: {},
        byLocation: {}
    };
    
    trips.forEach((trip, idx) => {
        index.byId[idx] = trip;
        index.byTitle[trip.title.toLowerCase()] = trip;
        
        if (!index.byLocation[trip.location]) {
            index.byLocation[trip.location] = [];
        }
        index.byLocation[trip.location].push(trip);
    });
    
    return index;
}

/**
 * EXAMPLE 10: Validate data quality
 */
function validateDataQuality() {
    const trips = loadTrips();
    
    const validation = {
        total: trips.length,
        withTitle: 0,
        withPrice: 0,
        withImages: 0,
        withItinerary: 0,
        withInclusions: 0,
        withExclusions: 0,
        issues: []
    };
    
    trips.forEach((trip, idx) => {
        if (trip.title) validation.withTitle++;
        if (trip.price > 0) validation.withPrice++;
        if (trip.images.length > 0) validation.withImages++;
        if (trip.itinerary.length > 0) validation.withItinerary++;
        if (trip.inclusions.length > 0) validation.withInclusions++;
        if (trip.exclusions.length > 0) validation.withExclusions++;
        
        // Check for issues
        if (!trip.title) validation.issues.push(`Trip ${idx}: Missing title`);
        if (trip.price === 0) validation.issues.push(`Trip ${idx}: Invalid price`);
        if (trip.images.length === 0) validation.issues.push(`Trip ${idx}: Missing images`);
    });
    
    validation.completeness = Math.round(
        ((validation.withTitle + validation.withPrice + validation.withImages) / (validation.total * 3)) * 100
    );
    
    return validation;
}

// CLI Interface
if (require.main === module) {
    const command = process.argv[2];
    
    switch (command) {
        case 'stats':
            console.log('\n📊 TRIP STATISTICS\n');
            console.log(getStatistics());
            break;
            
        case 'locations':
            console.log('\n📍 POPULAR DESTINATIONS\n');
            getPopularDestinations().forEach(({ location, count }, idx) => {
                console.log(`${idx + 1}. ${location} - ${count} trips`);
            });
            break;
            
        case 'cheap':
            console.log('\n💰 CHEAPEST TRIPS\n');
            tripsByPrice('asc').slice(0, 5).forEach((trip, idx) => {
                console.log(`${idx + 1}. ${trip.title} - ₹${trip.price}`);
            });
            break;
            
        case 'expensive':
            console.log('\n💎 MOST EXPENSIVE TRIPS\n');
            tripsByPrice('desc').slice(0, 5).forEach((trip, idx) => {
                console.log(`${idx + 1}. ${trip.title} - ₹${trip.price}`);
            });
            break;
            
        case 'discount':
            console.log('\n🎉 TRIPS WITH DISCOUNT\n');
            tripsWithDiscount().slice(0, 5).forEach((trip, idx) => {
                console.log(`${idx + 1}. ${trip.title} - ${trip.discountPercent}% off`);
            });
            break;
            
        case 'value':
            console.log('\n⭐ BEST VALUE TRIPS\n');
            findBestValueTrips().slice(0, 5).forEach((trip, idx) => {
                console.log(`${idx + 1}. ${trip.title} (Score: ${trip.valueScore.toFixed(2)})`);
            });
            break;
            
        case 'quality':
            console.log('\n✅ DATA QUALITY REPORT\n');
            const validation = validateDataQuality();
            console.log(`Total trips: ${validation.total}`);
            console.log(`Complete data: ${validation.completeness}%`);
            console.log(`With all fields: ${validation.withTitle} titles, ${validation.withPrice} prices, ${validation.withImages} images`);
            if (validation.issues.length > 0) {
                console.log(`\n⚠️  Issues found:`);
                validation.issues.slice(0, 5).forEach(issue => console.log(`  - ${issue}`));
            }
            break;
            
        case 'csv':
            exportToCSV();
            break;
            
        case 'search':
            if (!process.argv[3]) {
                console.log('Usage: node examples.js search <location>');
                process.exit(1);
            }
            const results = searchByLocation(process.argv[3]);
            console.log(`\n🔍 Found ${results.length} trips in "${process.argv[3]}"\n`);
            results.forEach((trip, idx) => {
                console.log(`${idx + 1}. ${trip.title} - ₹${trip.price}`);
            });
            break;
            
        default:
            console.log(`
INTEGRATION EXAMPLES

Usage: node examples.js <command>

Commands:
  stats       Show trip statistics
  locations   Show popular destinations
  cheap       Show cheapest trips
  expensive   Show most expensive trips
  discount    Show trips with discount
  value       Show best value trips
  quality     Show data quality report
  csv         Export trips to CSV
  search      Search trips by location
                Example: node examples.js search Manali
            `);
    }
}

module.exports = {
    loadTrips,
    filterByPrice,
    searchByLocation,
    tripsByPrice,
    tripsWithDiscount,
    exportToCSV,
    getStatistics,
    getPopularDestinations,
    findBestValueTrips,
    buildSearchIndex,
    validateDataQuality
};
