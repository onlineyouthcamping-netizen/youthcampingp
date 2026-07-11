# 🚀 DEPLOYMENT GUIDE - WINDOWS + MONGODB + TASK SCHEDULER

## Overview

Your scraper is configured for:
- ✅ **Weekly execution** (Sunday 2:00 AM)
- ✅ **Windows Task Scheduler** automation
- ✅ **MongoDB** cloud database sync
- ✅ **Automatic logging** to logs/ folder
- ✅ **Error notifications** on failure

## Step-by-Step Setup

### Step 1: Configure MongoDB

1. **Create MongoDB Atlas Cluster** (free tier available)
   - Go to https://cloud.mongodb.com
   - Sign up or log in
   - Create a project
   - Create a cluster (M0 free tier is fine)

2. **Get Connection String**
   - Go to "Databases" section
   - Click "Connect" button
   - Select "Drivers"
   - Copy connection string: `mongodb+srv://...`

3. **Set.env File**
   ```bash
   cd d:\os\scraper
   copy .env.example .env
   ```

4. **Edit .env with your MongoDB URI**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/youthcamping?retryWrites=true&w=majority
   ```

✅ **Verify MongoDB Connection:**
```bash
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected!')).catch(e => console.log('❌ Failed:', e.message))"
```

### Step 2: Set Up Task Scheduler

1. **Open PowerShell as Administrator**
   - Right-click PowerShell
   - Select "Run as administrator"

2. **Run Setup Script**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   cd D:\os\scraper
   .\setup-task-scheduler.ps1
   ```

   This will:
   - ✅ Create a scheduled task named "YouthCamping-Scraper"
   - ✅ Set schedule: Every Sunday at 2:00 AM
   - ✅ Configure to run `run-scraper.bat`

3. **Verify Task Created**
   ```powershell
   Get-ScheduledTask -TaskName "YouthCamping-Scraper"
   ```

   Should show:
   ```
   TaskName                                       State
   --------                                       -----
   YouthCamping-Scraper                         Ready
   ```

### Step 3: Test the Deployment

1. **Manual Test Run**
   ```bash
   cd d:\os\scraper
   node deploy.js
   ```

   Expected output:
   ```
   ═══════════════════════════════════════════
   🚀 DEPLOYMENT SCRAPER - Weekly Run
   ═══════════════════════════════════════════
   
   📍 Phase 1: URL Discovery
   ✅ Found 11 trips to scrape
   
   📍 Phase 2: Scraping Trips
   ✅ Trip 1: Winter Spiti Road Trip
   ✅ Trip 2: Manali Kasol...
   
   ✨ DEPLOYMENT COMPLETE
   ═══════════════════════════════════════════
   ```

2. **Check Logs**
   ```bash
   ls -la logs/
   cat logs/scrape-*.log     # View latest log
   ```

3. **Verify MongoDB Sync**
   - Go to MongoDB Atlas
   - Check "Collections" in your database
   - Should see "trips" collection with 11 documents

4. **Test Schedule Trigger** (Optional)
   - Open Task Scheduler: `taskschd.msc`
   - Find "YouthCamping-Scraper"
   - Right-click → "Run"
   - Check logs folder for new output

## Deployment Files

```
scraper/
├── deploy.js                 # Deployment version (MongoDBsync)
├── run-scraper.bat          # Windows batch file trigger
├── setup-task-scheduler.ps1 # Automated task creation
├── .env                      # Configuration (your copy)
├── .env.example             # Template (don't edit)
└── logs/                    # Auto-created logs folder
    └── task-scheduler-2026-04-21-0200.log
```

## Monitoring & Management

### View Logs
```bash
# Latest log
Get-Content logs/*.log -Tail 100

# All logs
ls logs/
```

### Check Task Status
```powershell
Get-ScheduledTask -TaskName "YouthCamping-Scraper" | Select-Object -Property TaskName, State, LastRunTime, LastTaskResult

# Get full details
Get-ScheduledTask -TaskName "YouthCamping-Scraper" | Get-ScheduledTaskInfo
```

### Run Task Manually
```powershell
Start-ScheduledTask -TaskName "YouthCamping-Scraper"
```

### View MongoDB Data
```bash
# Connect to MongoDB and check collections
# In MongoDB Atlas:
# 1. Databases → Select your database
# 2. Collections → should see "trips" collection
# 3. View documents with all scraped data
```

## Troubleshooting

### Task Didn't Run

**Check Task Scheduler History:**
```powershell
Get-ScheduledTask -TaskName "YouthCamping-Scraper" | Get-ScheduledTaskInfo
```

**Check Last Error:**
```powershell
Get-EventLog -LogName "System" -Source "TaskScheduler" -Newest 5
```

### MongoDB Connection Failed

1. **Verify .env file exists**
   ```bash
   cat .env
   # Should show MONGODB_URI=...
   ```

2. **Check MongoDB is running**
   - Go to MongoDB Atlas
   - Verify cluster status
   - Check IP whitelist (should allow your IP)

3. **Test connection**
   ```bash
   node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected!')).catch(e => console.log('Error:', e.message))"
   ```

### Scraper Errors

1. **Check latest log**
   ```bash
   Get-Content logs/* | Select-Object -Last 50
   ```

2. **Look for "❌" messages** in log file

3. **Common issues:**
   - Website structure changed → Update selectors in scrapeTrip.js
   - Network timeout → Try manual run: `node deploy.js`
   - MongoDB full → Check quota in MongoDB Atlas

## Advanced Configuration

### Change Run Time

Currently: **Sunday 2:00 AM**

To change to Tuesday 3:00 AM:
```powershell
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Tuesday -At 3AM
Set-ScheduledTask -TaskName "YouthCamping-Scraper" -Trigger $trigger
```

### Run Multiple Times

Run daily instead of weekly:
```powershell
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
Set-ScheduledTask -TaskName "YouthCamping-Scraper" -Trigger $trigger
```

### Add Email Notifications

Edit `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFY_EMAIL=admin@example.com
```

Then add to `deploy.js`:
```javascript
// After successful scrape
if (process.env.NOTIFY_EMAIL) {
  sendNotificationEmail({
    to: process.env.NOTIFY_EMAIL,
    subject: `Scraper Success: ${uniqueTrips.length} trips`,
    body: `Scraping complete. ${uniqueTrips.length} trips synced to MongoDB.`
  });
}
```

## Performance Monitoring

### Dashboard (Recommended)

Create a simple dashboard to track:
```javascript
// dashboard.js
const trips = require('./data/trips.json');
const stats = {
  total: trips.length,
  avgPrice: trips.reduce((s,t) => s + t.price, 0) / trips.length,
  highestPrice: Math.max(...trips.map(t => t.price)),
  lowestPrice: Math.min(...trips.map(t => t.price)),
  lastUpdate: new Date(fs.statSync('./data/trips.json').mtime).toISOString()
};
console.table(stats);
```

Run weekly after scrape:
```bash
node dashboard.js
```

## Backup Strategy

### Automatic Backup

Add to `run-scraper.bat`:
```batch
REM Backup data before scraping
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set datevar=%%c-%%a-%%b)
if not exist "backups" mkdir backups
copy data\trips.json backups\trips-%datevar%.json
```

### MongoDB Backup

MongoDB Atlas handles backups automatically (weekly snapshots in free tier).

To manually export:
```bash
# Install MongoDB Tools
npm install mongodb-tools

# Export
mongoexport --uri "MONGODB_URI" --collection trips --out trips-backup.json
```

## Security Best Practices

1. ✅ **Never commit .env to git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. ✅ **Use strong MongoDB password**
   - At least 16 characters
   - Mix of upper/lowercase, numbers, symbols

3. ✅ **Restrict MongoDB IP access**
   - MongoDB Atlas → Network Access
   - Add only your IP address

4. ✅ **Monitor logs for errors**
   - Don't leave sensitive data in logs
   - Rotate old logs monthly

5. ✅ **Update npm packages regularly**
   ```bash
   npm update
   npm audit
   ```

## Costs

**Completely Free Setup:**
- MongoDB Atlas: Free M0 cluster (512MB, good for ~10K documents)
- Windows Task Scheduler: Built-in
- Node.js: Free

**If MongoDB fills up:**
- Upgrade to M2.5 ($9-20/month)
- Or clean old data: `db.trips.deleteMany({scrapedAt: {$lt: Date.now() - 90days}})`

## Next Steps

1. ✅ Configure .env with MongoDB URI
2. ✅ Run `setup-task-scheduler.ps1` as admin
3. ✅ Test with `node deploy.js`
4. ✅ Verify MongoDB has data
5. ✅ Check first auto-run (Sunday 2:00 AM)
6. ✅ Monitor logs weekly

## Support

- **Task status**: Open `taskschd.msc`
- **Logs location**: `D:\os\scraper\logs\`
- **MongoDB health**: https://cloud.mongodb.com
- **Manual run**: `cd D:\os\scraper && node deploy.js`

---

**Your deployment is ready!** The scraper will automatically run every Sunday at 2:00 AM and sync data to MongoDB.
