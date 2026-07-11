# PRODUCTION DEPLOYMENT GUIDE

## Overview

This guide covers deploying the Youth Camping Scraper to production environments.

## Prerequisites

- Node.js 14+ 
- 500MB+ disk space
- 512MB+ RAM (1GB recommended)
- Stable internet connection
- Access to run background processes

## Deployment Options

### Option 1: Local Machine (Windows/Mac/Linux)

#### Setup
```bash
# Clone or copy scraper directory
cd scraper
npm install
npm run scrape     # First run to verify
```

#### Running as Background Service

**Windows (PowerShell):**
```powershell
# Run in background with nohup equivalent
$process = Start-Process -NoNewWindow -PassThru node "D:\path\to\index.js" -RedirectStandardOutput scrape.log
echo $process.Id > scraper.pid
```

**Mac/Linux:**
```bash
nohup node index.js > scrape.log 2>&1 &
echo $! > scraper.pid
```

#### Scheduled Scraping (Cron/Task Scheduler)

**Windows Task Scheduler:**
```
Trigger: Daily at 2:00 AM
Action: 
  Program: C:\Program Files\nodejs\node.exe
  Arguments: "D:\path\to\scraper\index.js"
  Start in: D:\path\to\scraper
Logging: Enable history
```

**Mac/Linux Crontab:**
```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/scraper && node index.js >> logs/scrape.log 2>&1
```

### Option 2: Docker Container

#### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy scraper
COPY . .

# Create data directory
RUN mkdir -p data

# Expose any APIs if created
EXPOSE 3000

# Run scraper
CMD ["npm", "run", "scrape"]
```

#### Build and Run
```bash
docker build -t youthcamping-scraper .
docker run -v $(pwd)/data:/app/data youthcamping-scraper
```

### Option 3: Cloud Platforms

#### AWS Lambda + EventBridge

1. **Package scraper:**
```bash
zip -r lambda.zip node_modules index.js crawl.js scrapeTrip.js utils.js package.json
```

2. **Create Lambda function** with:
   - Handler: `index.handler`
   - Memory: 1024MB
   - Timeout: 900s (15 min)
   - Runtime: Node.js 18

3. **Lambda handler (index.js):**
```javascript
const { crawlAllURLs } = require('./crawl');
const { scrapeTrip } = require('./scrapeTrip');
// ... implement handler logic

exports.handler = async (event) => {
    try {
        // Run scraper
        return { statusCode: 200, body: 'Scraping started' };
    } catch (err) {
        return { statusCode: 500, body: err.message };
    }
};
```

4. **EventBridge trigger:** Schedule daily execution

#### Google Cloud Functions

```bash
gcloud functions deploy youthcamping-scraper \
  --runtime nodejs18 \
  --trigger-topic daily-scrape \
  --entry-point main
```

#### Heroku (for APIs)

```bash
# Create Procfile
echo "web: node index.js" > Procfile

# Deploy
heroku create youthcamping-scraper
git push heroku main
```

### Option 4: VPS/Dedicated Server

#### Setup on Ubuntu

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create app directory
sudo mkdir -p /var/www/scraper
cd /var/www/scraper

# Copy scraper files
sudo cp -r ~/scraper/* .
sudo npm install

# Create systemd service
sudo nano /etc/systemd/system/scraper.service
```

**Service file (scraper.service):**
```ini
[Unit]
Description=Youth Camping Scraper
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/scraper
ExecStart=/usr/bin/node index.js
Restart=on-failure
RestartSec=10
StandardOutput=append:/var/log/scraper.log
StandardError=append:/var/log/scraper.log

[Install]
WantedBy=multi-user.target
```

**Enable and start:**
```bash
sudo systemctl enable scraper.service
sudo systemctl start scraper.service
sudo systemctl status scraper.service
```

## Monitoring & Management

### Log Monitoring

```bash
# Real-time logs
tail -f data/errors.json

# Monitor scraping
watch -n 5 'wc -l data/trips.json'

# Full logs
tail -100 scrape.log
```

### Health Checks

```bash
# Check if scraper produced data today
if [ -f data/trips.json ]; then
  MODIFIED=$(stat -f%Sm -t%Y%m%d data/trips.json)
  TODAY=$(date +%Y%m%d)
  if [ "$MODIFIED" == "$TODAY" ]; then
    echo "✅ Scraper ran today"
  else
    echo "❌ Scraper hasn't run today"
  fi
fi
```

### Data Validation

```bash
# Check data integrity
node examples.js quality

# Verify record count
cat data/trips.json | jq 'length'
```

## Backup & Recovery

### Backup Strategy

```bash
# Daily backup
0 3 * * * cd /path/to/scraper && tar -czf backups/trips-$(date +\%Y\%m\%d).tar.gz data/
```

### Restore from Backup

```bash
# Restore specific date
tar -xzf backups/trips-20240115.tar.gz
```

## Database Integration

### MongoDB Sync

```bash
# Add to index.js to sync to MongoDB
const mongoose = require('mongoose');

async function syncToDatabase(trips) {
    await mongoose.connect(process.env.MONGODB_URI);
    const Trip = mongoose.model('Trip', tripSchema);
    
    for (const trip of trips) {
        await Trip.findOneAndUpdate(
            { url: trip.url },
            trip,
            { upsert: true }
        );
    }
    
    await mongoose.disconnect();
}
```

### PostgreSQL Export

```bash
# Export to CSV and load into PostgreSQL
node examples.js csv

# Then import:
# psql -d dbname -c "\COPY trips FROM 'trips.csv' WITH CSV HEADER;"
```

## Performance Optimization

### Tune Concurrency

```bash
# For 4-core machine: 4-5 concurrent pages
node index.js --concurrency 5

# For 8-core machine: 8-10 concurrent pages
node index.js --concurrency 8
```

### Memory Management

```bash
# Monitor memory usage
node --max-old-space-size=2048 index.js

# Check Node limits
node -e "console.log(require('os').totalmem() / 1024 / 1024 / 1024, 'GB')"
```

## Troubleshooting

### Timeout Issues

```bash
# Reduce concurrency if timeouts occur
node index.js --concurrency 1 --max 5

# Check network
ping www.youthcamping.in
curl -I https://www.youthcamping.in
```

### Memory Leaks

```bash
# Monitor memory
node --inspect index.js
# Open chrome://inspect in Chrome DevTools
```

### Proxy Support (if needed)

Add to `index.js`:
```javascript
const context = await browser.newContext({
    proxy: { server: 'http://proxy.example.com:8080' }
});
```

## Security Considerations

1. **Rotate Logs:** Prevent disk filling
```bash
0 0 * * 0 cd /path/to/scraper && rm -f logs/scrape-*.log
```

2. **Restrict File Permissions:**
```bash
chmod 700 /var/www/scraper
chmod 600 data/trips.json
```

3. **Hide Credentials:**
```bash
# Use .env for sensitive data
echo "MONGODB_URI=..." > .env
echo ".env" >> .gitignore
```

4. **Rate Limiting:** Respect website TOS
```bash
# Already implemented with sleep(2000) between batches
```

## Performance Benchmarks

| Setup | Trips/Hour | Memory | CPU |
|-------|-----------|--------|-----|
| Local (concurrency 3) | 20-30 | 200MB | 30% |
| Local (concurrency 5) | 35-45 | 350MB | 50% |
| Docker | 25-35 | 300MB | 40% |
| Lambda | 15-20 | 1024MB | - |

## Scaling Strategies

### Horizontal Scaling
```
Master:
  ├─ Scraper 1 (trips 1-10%)
  ├─ Scraper 2 (trips 11-20%)
  ├─ Scraper 3 (trips 21-30%)
  └─ Data Merger (combine results)
```

### Queue-Based (for high volume)
```bash
# Use job queue (Bull, RabbitMQ) for massive scraping:
# 1. Queue URL from discovery
# 2. Multiple workers process queue
# 3. Merge and deduplicate results
```

## Maintenance

### Weekly Checklist
- [ ] Verify scraper ran successfully
- [ ] Check error logs for patterns
- [ ] Monitor disk usage
- [ ] Backup data
- [ ] Test resume functionality

### Monthly Tasks
- [ ] Update Playwright (security patches)
- [ ] Review and optimize selectors
- [ ] Analyze failed URLs for pattern changes
- [ ] Database integrity checks

## Support & Contacts

### Issue Reporting
1. Check `data/errors.json` for failed URLs
2. Review console logs
3. Test with `--max 1` for minimal debugging
4. Check Playwright version: `npm list playwright`

### Resources
- Playwright Docs: https://playwright.dev
- Node.js Docs: https://nodejs.org/docs
- Troubleshooting: See README.md

## Next Steps

1. ✅ Deploy scraper to production
2. ✅ Set up log monitoring
3. ✅ Enable automated backups
4. ✅ Create alert for failures
5. ✅ Monitor performance metrics
6. ✅ Plan data integration

---

**Last Updated:** April 2026
**Version:** 1.0.0
