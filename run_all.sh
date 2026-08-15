#!/bin/bash

# YouthCamping OS - Local Run All Script
echo "======================================"
echo "🚀 Starting All Services Locally..."
echo "======================================"

# Function to handle exit
cleanup() {
    echo ""
    echo "======================================"
    echo "🛑 Stopping all services..."
    echo "======================================"
    kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null
    exit
}

# Catch Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM

echo "📦 Starting Backend (Port 5005)..."
(cd backend && npm run dev) &
BACKEND_PID=$!

echo "📦 Starting Frontend (Port 3000)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "📦 Starting Admin Panel (Port 8081)..."
(cd ycadmin && npm run dev) &
ADMIN_PID=$!

echo ""
echo "✅ All services are starting up in the background."
echo "Press [Ctrl+C] to stop all services."
echo ""
echo "Waiting for services to finish..."

# Wait for all background processes
wait
