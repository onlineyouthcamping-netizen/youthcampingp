# 🎯 QUICK REFERENCE CARD

## Installation (One-Time)
```bash
cd d:\os\scraper
npm install
```

## Run Scraper

### Basic Commands
```bash
npm run scrape              # Scrape ALL trips (~10+ mins)
npm run scrape:demo         # Quick demo (5 trips, 3 mins)
npm run scrape:resume       # Resume interrupted scrape
npm run scrape:fast         # Faster (5 concurrent pages)
```

### Advanced
```bash
node index.js --max 10      # Limit to 10 trips
node index.js --concurrency 5   # Use 5 pages at once
node index.js --help        # Show all options
```

## Analyze Data

### Statistics
```bash
node examples.js stats      # Full statistics
node examples.js quality    # Data quality report
node examples.js locations  # Popular destinations
```

### Search & Filter
```bash
node examples.js cheap      # Cheapest trips
node examples.js expensive  # Most expensive
node examples.js discount   # Trips with discount
node examples.js value      # Best value for money
node examples.js search Manali   # Search location
```

### Export
```bash
node examples.js csv        # Export to CSV file
```

## Check Results

### View Output
```bash
# JSON data
cat data/trips.json | head -50

# Error log
cat data/errors.json

# Statistics
node examples.js stats
```

## Utilities

### Cleanup
```bash
npm run clean              # Delete old data
npm run logs              # View error logs
```

## Performance Estimates

| Command | Time | Trips |
|---------|------|-------|
| `scrape:demo` | 3 min | 5 |
| `scrape` | 10+ min | 10-11 |
| `--max 25` | 15 min | 25 |
| `--max 50` | 30 min | 50 |

## Troubleshooting

### Timeout Issues
```bash
node index.js --max 1       # Test single trip
node index.js --concurrency 1   # Reduce concurrency
```

### Not Finding Data
```bash
npm run clean               # Clear old data
npm run scrape:demo         # Scrape fresh
```

### Resume Failed Scrape
```bash
npm run scrape:resume       # Continue from checkpoint
```

## Output Files

```
data/
├── trips.json      # All scraped trip data
├── errors.json     # Failed URLs (if any)
└── checkpoint.json # Auto-created (deleted on success)
```

## Sample Data Structure

```javascript
{
  title: "Spring Manali Trek",
  location: "Manali",
  duration: "5 Days 4 Nights",
  price: 14999,
  originalPrice: 19999,
  discount: 5000,
  images: [...],           // 20+ URLs
  itinerary: [...],        // Day-wise
  inclusions: [...],       // What's included
  exclusions: [...],       // What's not
  pickupPoints: [...],     // Starting cities
  policies: [...]          // Terms
}
```

## Use in Your App

```javascript
// Load data
const trips = require('./data/trips.json');

// Find trip
const manali = trips.find(t => t.location === 'Manali');

// Filter price
const cheap = trips.filter(t => t.price < 15000);

// Get average price
const avg = trips.reduce((s, t) => s + t.price, 0) / trips.length;
```

## Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| README.md | Technical details | 10 min |
| QUICKSTART.md | Getting started | 5 min |
| DEPLOYMENT.md | Production setup | 15 min |
| SETUP-COMPLETE.md | Full overview | 10 min |
| BUILD-SUMMARY.md | This summary | 5 min |

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Module not found" | Run `npm install` |
| Timeout errors | Try `--concurrency 1` |
| No results | Run `npm run scrape` |
| Old data | Run `npm run clean` first |
| Want to resume | Run `npm run scrape:resume` |

## Performance Tips

1. **Faster Scraping**
   ```bash
   npm run scrape:fast    # Uses 5 concurrent pages
   ```

2. **Lower Memory**
   ```bash
   node index.js --concurrency 1  # Single thread
   ```

3. **Better for VPS**
   ```bash
   node index.js --max 25  # Scrape in smaller batches
   ```

## Key Commands Summary

```
setup:              npm install
scrape:             npm run scrape
test:               npm run scrape:demo
resume:             npm run scrape:resume
fast:               npm run scrape:fast
check quality:      node examples.js quality
export csv:         node examples.js csv
show stats:         node examples.js stats
search:             node examples.js search Manali
help:               node index.js --help
```

## Exit Codes

```
0   - Success
1   - Error (check data/errors.json)
2   - No data found
3   - Network error
```

## Limits

```
Max concurrent pages:    5
Max retries:            3
Timeout per page:       60s
Max images per trip:    20
Max itinerary days:     12
```

---

**Quick Start:**
```bash
cd d:\os\scraper
npm install
npm run scrape:demo
```

**That's it! You're scraping.**

---

For more help:
- README.md - Full documentation
- examples.js - Code samples  
- data/errors.json - What failed
