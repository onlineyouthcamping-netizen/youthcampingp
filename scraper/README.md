# Youth Camping Web Scraper

A production-ready web scraper for `youthcamping.in` built with Playwright. Extracts comprehensive trip data including itineraries, pricing, images, and more.

## Features

✅ **Complete Data Extraction**
- Basic info (title, location, duration, price)
- Detailed itinerary (day-wise breakdown)
- Inclusions & exclusions
- Images & gallery
- Pickup points & policies
- Highlights

✅ **Robust & Resilient**
- Handles dynamic content (tabs, accordions, lazy loading)
- Retry logic for failed pages
- Error logging & reporting
- Resume capability for interrupted scrapes
- Deduplication built-in

✅ **Production Grade**
- Concurrent scraping (3-5 pages simultaneously)
- Modular code structure
- Clean JSON output
- Configurable via CLI arguments
- Checkpoint/recovery system

## Installation

```bash
# Install dependencies
npm install

# Verify Playwright is ready
npx playwright install

# Ensure you have Node.js 14+
node --version
```

## Usage

### Basic Scraping
```bash
node index.js
```

### Scrape Limited Number
```bash
node index.js --max 10     # Scrape first 10 trips
```

### Resume Interrupted Scrape
```bash
node index.js --resume
```

### Adjust Concurrency
```bash
node index.js --concurrency 5  # Use 5 concurrent pages (default: 3)
```

### Help
```bash
node index.js --help
```

## Output Files

### `data/trips.json`
Complete structured data for all scraped trips:
```json
[
  {
    "title": "Manali to Spiti Valley Trek",
    "location": "Spiti Valley",
    "duration": "8 Days 7 Nights",
    "price": 24999,
    "originalPrice": 29999,
    "discount": 5000,
    "highlights": ["Scenic views", "Local culture", "..."],
    "description": "Experience the beauty of Spiti Valley...",
    "itinerary": [
      {
        "day": "Day 1",
        "title": "Arrival in Spiti",
        "description": "Arrive at the mystical land of Spiti..."
      }
    ],
    "inclusions": ["Hotel accommodation", "Meals", "..."],
    "exclusions": ["Personal expenses", "Flights", "..."],
    "images": ["https://...", "https://..."],
    "pickupPoints": ["Delhi", "Chandigarh"],
    "policies": [{"text": "7 days cancellation notice..."}],
    "url": "https://www.youthcamping.in/tours/spiti-valley"
  }
]
```

### `data/errors.json`
Detailed error log for failed URLs:
```json
[
  {
    "url": "https://www.youthcamping.in/tours/broken-link",
    "error": "Page not found (404)",
    "timestamp": "2024-01-15T10:30:00Z",
    "stack": "..."
  }
]
```

### `data/checkpoint.json` (auto-generated)
Saves progress after each batch of scrapes. Used for resume functionality.

## Architecture

```
scraper/
├── index.js              # Main orchestrator & entry point
├── crawl.js              # URL discovery (homepage, collections, sitemap)
├── scrapeTrip.js         # Detail page scraper
├── utils.js              # Helper functions
├── package.json          # Dependencies
└── data/                 # Output directory
    ├── trips.json        # Scraped data
    ├── errors.json       # Error log
    └── checkpoint.json   # Progress state
```

## Code Structure

### `utils.js`
- Price/duration parsing
- Text normalization
- Image filtering
- Data validation & deduplication
- JSON I/O helpers
- Error logging
- Retry logic

### `crawl.js`
- Crawls homepage for trip links
- Explores collections pages
- Parses XML sitemaps
- Discovers all trip URLs

### `scrapeTrip.js`
- Extracts basic info (title, price, duration, location)
- Handles dynamic content (clicks tabs, expands accordions)
- Extracts itinerary (day-wise)
- Gathers inclusions/exclusions
- Collects images
- Validates complete data structure

### `index.js`
- CLI argument parsing
- Phase 1: URL discovery
- Phase 2: Concurrent scraping with retry
- Phase 3: Data deduplication
- Phase 4: Output & reporting
- Checkpoint/resume logic

## Performance

- **Concurrency**: 3-5 pages at a time (configurable)
- **Timeout**: 60 seconds per page
- **Retries**: 3 attempts with 1 second delay
- **Estimated**: 50-100 trips in 15-30 minutes

## Resilience Features

1. **Dynamic Content Handling**
   - Clicks accordion buttons
   - Handles tab navigation
   - Scrolls to load lazy images

2. **Fallback Selectors**
   - Multiple selector patterns for each field
   - Regex-based extraction as fallback
   - Body text search for critical data

3. **Error Recovery**
   - Retries failed pages automatically
   - Logs errors with timestamps
   - Continues scraping on failures
   - Save/resume capability

4. **Data Quality**
   - Validation before accepting trips
   - Deduplication by title
   - Image filtering (removes logos, icons)
   - Text normalization

## Requirements

- **Node.js**: 14.0 or higher
- **Playwright**: ^1.40.0
- **RAM**: 512MB minimum (1GB+ recommended)
- **Disk**: 50MB for initial install, 10-50MB per scrape

## Troubleshooting

### Playwright not found
```bash
npx playwright install
```

### Page timeout errors
```bash
node index.js --max 5  # Start with fewer pages to debug
```

### Selector not finding data
Check the website structure and update selectors in `scrapeTrip.js`

### Network errors
Try increasing delays in code or using a reliable connection

## Notes

- 🟢 Each trip extracted with complete data structure
- 🟢 Handles pagination and lazy loading
- 🟢 Resilient to HTML structure changes
- 🟢 Production-grade error handling
- 🟡 Respects website crawl politeness (2s delays)
- 🟡 Single browser instance reused per batch

## Future Improvements

- [ ] Database sync integration
- [ ] Webhook notifications on completion
- [ ] Parallel browser instances
- [ ] Proxy support
- [ ] Content scheduling (cloud functions)
- [ ] Image download & optimization
- [ ] API endpoint for scraped data

## License

MIT

## Support

For issues or questions:
1. Check `data/errors.json` for failing URLs
2. Review logs in console output
3. Try running with `--max 1` for debugging
