#!/usr/bin/env node
/**
 * DEPLOYMENT SETUP CHECKLIST
 * Run this to get step-by-step deployment instructions
 */

const fs = require('fs');
const path = require('path');

console.log(`
╔════════════════════════════════════════════════════════════╗
║     🚀 DEPLOYMENT SETUP - QUICK START                      ║
║     Windows + MongoDB + Task Scheduler                     ║
║                                                            ║
║     Status: READY FOR DEPLOYMENT                          ║
╚════════════════════════════════════════════════════════════╝
`);

const steps = [
    {
        num: 1,
        title: "Create MongoDB Database (2 mins)",
        details: [
            "go to: https://cloud.mongodb.com",
            "Sign up (free tier available)",
            "Create a cluster (M0 is free)",
            "Wait for cluster to be ready (~10 mins)"
        ]
    },
    {
        num: 2,
        title: "Get MongoDB Connection String (2 mins)",
        details: [
            "Click 'Connect' on your cluster",
            "Select 'Drivers' (Node.js)",
            "Copy the connection string",
            "Example: mongodb+srv://user:pass@cluster.mongodb.net/..."
        ]
    },
    {
        num: 3,
        title: "Configure Environment (1 min)",
        details: [
            "Open: D:\\os\\scraper\\.env",
            "Paste MongoDB URI: MONGODB_URI=<your_uri>",
            "Save the file",
            "Keep .env private (never commit to git)"
        ],
        command: "copy .env.example .env"
    },
    {
        num: 4,
        title: "Test Deployment (2 mins)",
        details: [
            "Open Command Prompt or PowerShell",
            "Run: cd D:\\os\\scraper",
            "Run: node deploy.js",
            "Should see 'DEPLOYMENT COMPLETE' with trip count"
        ]
    },
    {
        num: 5,
        title: "Set Up Task Scheduler (1 min)",
        details: [
            "Right-click PowerShell → 'Run as administrator'",
            "Run: cd D:\\os\\scraper",
            "Run: .\\setup-task-scheduler.ps1",
            "Task will run every Sunday at 2:00 AM"
        ]
    },
    {
        num: 6,
        title: "Verify Setup (1 min)",
        details: [
            "Task Scheduler: taskschd.msc",
            "Search for: 'YouthCamping-Scraper'",
            "Should show 'Ready' status",
            "Check logs folder for test run outputs"
        ]
    }
];

// Print steps
steps.forEach(step => {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📋 STEP ${step.num}: ${step.title}`);
    console.log(`${'═'.repeat(60)}`);
    
    step.details.forEach((detail, idx) => {
        console.log(`   ${idx + 1}. ${detail}`);
    });
    
    if (step.command) {
        console.log(`\n   💻 Command:`);
        console.log(`   ${step.command}`);
    }
});

console.log(`\n${'═'.repeat(60)}`);
console.log(`✅ SUMMARY`);
console.log(`${'═'.repeat(60)}`);
console.log(`
Total Setup Time:    ~9 minutes
Frequency:           Every Sunday at 2:00 AM
Database:            MongoDB Atlas (free tier)
Logging:             logs/ folder
Status Page:         MongoDB Atlas dashboard

`);

console.log(`${'═'.repeat(60)}`);
console.log(`📚 ADDITIONAL RESOURCES`);
console.log(`${'═'.repeat(60)}`);
console.log(`
Documentation:
  • DEPLOYMENT-WINDOWS.md   - Detailed setup guide
  • QUICK-REFERENCE.md      - Command reference
  • README.md              - Technical documentation

Commands:
  • node deploy.js         - Run scraper manually
  • taskschd.msc          - Open Task Scheduler
  • Get-Content logs/*     - View logs
  • node examples.js stats  - Show statistics

`);

console.log(`${'═'.repeat(60)}`);
console.log(`🎯 NEXT ACTION`);
console.log(`${'═'.repeat(60)}`);
console.log(`
1️⃣  Create MongoDB account:
    https://cloud.mongodb.com

2️⃣  Get connection string

3️⃣  Create .env file with MongoDB URI:
    copy .env.example .env
    # Edit .env with your URI

4️⃣  Test deployment:
    node deploy.js

5️⃣  Set up Task Scheduler (run as admin):
    setup-task-scheduler.ps1

That's it! Your scraper will run automatically every Sunday at 2 AM.

`);

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log(`${'═'.repeat(60)}`);
console.log(`⚙️  DEPLOYMENT STATUS`);
console.log(`${'═'.repeat(60)}`);
console.log(`
  deploy.js                ✅ Ready
  run-scraper.bat          ✅ Ready
  setup-task-scheduler.ps1 ✅ Ready
  .env file                ${envExists ? '✅ Configured' : '⏳ Not yet configured (copy .env.example)'}
  MongoDB account          ⏳ Needs to be created
  Task Scheduler           ⏳ Needs to be set up
  
`);

if (!envExists) {
    console.log(`⚠️  Next: Copy .env.example to .env and add your MongoDB URI\n`);
}

console.log(`Happy deploying! 🚀\n`);
