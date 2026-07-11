# SCRAPER QUICK START GUIDE

## 🚀 Installation (First Time)

### 1. Prerequisites
- Node.js 14+ installed
- Internet connection

### 2. Install Dependencies
Open terminal in scraper directory and run:

```bash
npm install
```

This installs:
- **Playwright** - Web automation & scraping
- **Dotenv** - Environment variables
- **Slugify** - Text normalization

### 3. Verify Installation
```bash
npx playwright install
node index.js --help
```

## 📖 Basic Usage

### Scrape All Trips (Default)
```bash
npm run scrape
```

This will:
1. ✅ Discover all trip URLs from website
2. ✅ Scrape each trip's detailed data
3. ✅ Save to `data/trips.json`
4. ✅ Log errors to `data/errors.json`

### Scrape Limited Trips (Testing)
```bash
npm run scrape:demo   # Scrapes first 5 trips (fast!)
```

### Scrape with Custom Limit
```bash
node index.js --max 10      # First 10 trips
node index.js --max 50      # First 50 trips
```

### Resume Interrupted Scrape
If scraper was interrupted:
```bash
npm run scrape:resume
```

Automatically resumes from last batch processed!

### Increase Speed (5 Concurrent Pages)
```bash
npm run scrape:fast
# or
node index.js --concurrency 5
```

## 📊 Expected Output

### Success Output
```
✅ Found 25 unique trip URLs
Processing Batch 1/3 (URLs 1-3)...
   ✅ Success (1/25)
   ✅ Success (2/25)
   ✅ Success (3/25)
   
📊 FINAL STATISTICS:
   • Total URLs: 25
   • Successfully scraped: 25
   • Failed: 0
   • Success rate: 100%
   • Total time: 5m 42s
```

### Output Files Created
```
data/
  ├── trips.json          # All scraped trip data
  ├── errors.json         # Failed URLs (if any)
  └── checkpoint.json     # Autosaved progress (deleted on success)
```

## 🔍 Understanding the Output

### Sample Trip Data (from trips.json)
```json
{
  "title": "Winter Spiti Road Trip",
  "location": "Spiti",
  "duration": "9 Days 10 Nights",
  "price": 19999,
  "originalPrice": 0,
  "discount": 0,
  "highlights": ["Starry skies", "Mountain views", ...],
  "description": "Experience the beauty of Spiti Valley...",
  "itinerary": [
    {
      "day": "Day 1",
      "title": "Start Journey",
      "description": "Leave from Delhi..."
    },
    {
      "day": "Day 2", 
      "title": "Reach Manali",
      "description": "Scenic drive through mountains..."
    }
  ],
  "inclusions": [
    "Hotel accommodation",
    "Meals (breakfast, lunch, dinner)",
    "Transport",
    "Guided tours"
  ],
  "exclusions": [
    "Flight tickets",
    "Personal expenses",
    "Optional activities"
  ],
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "pickupPoints": ["Delhi", "Chandigarh"],
  "policies": [{"text": "7 days cancellation policy..."}],
  "url": "https://www.youthcamping.in/tours/winter-spiti"
}
```

### Error Log Format (errors.json)
```json
[
  {
    "url": "https://www.youthcamping.in/tours/broken-trip",
    "error": "Timeout: element not found",
    "timestamp": "2024-01-15T10:30:00Z",
    "stack": "..."
  }
]
```

## ⏱️ Timing Estimates

| Scenario | Trips | Time | Concurrency |
|----------|-------|------|------------|
| Demo | 5 | ~3 min | 3 |
| Small | 10 | ~6 min | 3 |
| Medium | 25 | ~15 min | 3 |
| Large | 50 | ~30 min | 3 |
| Fast | 25 | ~8 min | 5 |

## 🛠️ Troubleshooting

### Issue: "Playwright not found"
```bash
npx playwright install chromium
```

### Issue: Timeout errors
Try with lower concurrency:
```bash
node index.js --max 5 --concurrency 1
```

### Issue: Slow scraping
Try increasing concurrency:
```bash
node index.js --concurrency 5
```

### Issue: Want to see more details?
Check [README.md](./README.md) for comprehensive documentation.

## 💡 Tips & Tricks

### Run in Background (Windows)
```bash
node index.js > scrape.log 2>&1 &
```

### Run in Background (Mac/Linux)
```bash
nohup node index.js > scrape.log 2>&1 &
tail -f scrape.log  # Watch logs
```

### Clean Old Data
```bash
npm run clean     # Delete data/ folder
```

### View Error Log
```bash
npm run logs
```

## 📱 Integration

### Use Scraped Data
```javascript
const fs = require('fs');
const trips = JSON.parse(fs.readFileSync('./data/trips.json', 'utf8'));

// Now you have array of 25+ trips with full data!
trips.forEach(trip => {
  console.log(`${trip.title} - ₹${trip.price}`);
});
```

### Export to CSV
```bash
# Install: npm install csv-writer
node export-csv.js    # Custom script to convert JSON → CSV
```

### Upload to Database
```bash
# Check integration examples in README.md
```

## ✨ What You Get

✅ **Complete trip data** - Everything needed for a travel booking platform
✅ **Clean JSON** - Ready for APIs, databases, frontend
✅ **Error tracking** - Know which links failed
✅ **Resume capability** - Don't lose progress on timeouts
✅ **Fast scraping** - 25 trips in ~15 minutes
✅ **Resilient** - Handles dynamic content, lazy loading, tabs

## 🎯 Next Steps

1. **Run test**: `npm run scrape:demo`
2. **Check output**: `cat data/trips.json | head -50`
3. **Scale up**: `node index.js --max 50`
4. **Integrate**: Use trips.json in your app
5. **Schedule**: Set up cron job for regular scrapes

## 📞 Need Help?

1. Check `README.md` for detailed docs
2. Run `node index.js --help` for CLI options
3. Check `data/errors.json` if something failed
4. Review logs in console output

Happy scraping! 🎉
