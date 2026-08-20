#!/bin/bash

# ==============================================================================
# YouthCamping OS - Automated VPS Production Deployment Script
# ==============================================================================
set -e

echo "🚀 [1/5] Pulling latest updates from GitHub..."
git pull origin main

echo "🔄 [2/5] Updating and syncing submodules..."
git submodule update --init --recursive --remote
cd ycadmin && git pull origin main && cd ..

echo "📦 [3/5] Building Admin Panel (ycadmin)..."
cd ycadmin
npm install --no-audit
npm run build
cd ..

echo "⚙️ [4/5] Updating Backend & Prisma Client..."
cd backend
npm install --no-audit
npx prisma generate
node src/scripts/seedRealTripSops.js || true
node src/scripts/syncChecklistsWithSops.js || true
cd ..

echo "🔁 [5/5] Reloading PM2 services with zero downtime..."
pm2 reload all || pm2 restart all

echo "=============================================================================="
echo "✅ VPS Update Completed Successfully!"
echo "=============================================================================="
pm2 status
