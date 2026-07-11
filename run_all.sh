#!/bin/bash

# Script to run all components of the YouthCamping OS application on macOS

echo "🚀 Starting YouthCamping OS services..."

# 1. Start Backend API
echo "🟢 Launching Backend API..."
osascript -e 'tell app "Terminal" to do script "cd /Users/parthpatel/Documents/youthcamping_os/backend && npm start"'

# 2. Start Customer Frontend
echo "🔵 Launching Customer Frontend..."
osascript -e 'tell app "Terminal" to do script "cd /Users/parthpatel/Documents/youthcamping_os/frontend && npm run dev"'

# 3. Start Admin Panel
echo "🟡 Launching Admin Panel..."
osascript -e 'tell app "Terminal" to do script "cd /Users/parthpatel/Documents/youthcamping_os/ycadmin && npm run dev"'

# 4. Start Guide Operations API Server
echo "🟣 Launching Guide Operations API..."
osascript -e 'tell app "Terminal" to do script "cd /Users/parthpatel/Documents/youthcamping_os/guide && pnpm --filter @workspace/api-server run dev"'

echo "🎉 All services launched in separate Terminal windows!"
