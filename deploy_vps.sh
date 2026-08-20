#!/bin/bash

# ==============================================================================
# YouthCamping OS - Automated VPS Production Deployment Script
# ==============================================================================
set -e

echo "🚀 [1/6] Pulling latest updates from GitHub..."
git pull origin main

echo "🔄 [2/6] Updating and syncing submodules..."
git submodule update --init --recursive --remote
cd ycadmin && git pull origin main && cd ..

echo "📦 [3/6] Building Admin Panel (ycadmin)..."
cd ycadmin
npm install --no-audit
npm run build
cd ..

echo "🌐 [4/6] Building Next.js Public Website (frontend)..."
cd frontend
npm install --no-audit
npm run build
cd ..

echo "⚙️ [5/6] Updating Backend & Prisma Client..."
cd backend
npm install --no-audit
npx prisma generate
node src/scripts/seedRealTripSops.js || true
node src/scripts/syncChecklistsWithSops.js || true
cd ..

echo "🔁 [6/6] Reloading PM2 services with zero downtime..."
pm2 reload all || pm2 restart all

echo "=============================================================================="
echo "✅ VPS Update Completed Successfully!"
echo "=============================================================================="
pm2 status
