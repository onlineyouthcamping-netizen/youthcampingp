# YouthCamping OS - Windows PowerShell Run All Services Script
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Starting All YouthCamping OS Services Locally..." -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

# Start Backend
Write-Host "Starting Backend (Port 5005)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root\backend'; Write-Host '--- BACKEND SERVER (Port 5005) ---' -ForegroundColor Green; npm run dev"

# Start Frontend
Write-Host "Starting Website / Frontend (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root\frontend'; Write-Host '--- FRONTEND (Port 3000) ---' -ForegroundColor Green; npm run dev"

# Start YCAdmin (OS Admin Panel)
Write-Host "Starting Admin OS Panel (ycadmin)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root\ycadmin'; Write-Host '--- YOUTHCAMPING OS ADMIN PANEL ---' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "All 3 services have been launched in dedicated terminal windows:" -ForegroundColor Cyan
Write-Host "  1. Backend API:        http://localhost:5005" -ForegroundColor White
Write-Host "  2. Next.js Frontend:   http://localhost:3000" -ForegroundColor White
Write-Host "  3. Admin OS Panel:     http://localhost:8080 (or http://localhost:8081)" -ForegroundColor White
Write-Host ""
