# YouthCamping OS - Windows PowerShell Launcher
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Starting All YouthCamping OS Services Locally..." -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

$root = $PSScriptRoot
if (-not $root) {
    $root = (Get-Location).Path
}

# 1. Start Backend API
Write-Host "Starting Backend API (Port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root\backend'; Write-Host '--- YOUTHCAMPING BACKEND (Port 3001) ---' -ForegroundColor Green; npm run dev"

# 2. Start Next.js Frontend
Write-Host "Starting Next.js Website (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root\frontend'; Write-Host '--- YOUTHCAMPING FRONTEND (Port 3000) ---' -ForegroundColor Green; npm run dev"

# 3. Start Admin OS Panel (ycadmin)
Write-Host "Starting Admin OS Panel (ycadmin)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -LiteralPath '$root\ycadmin'; Write-Host '--- YOUTHCAMPING OS ADMIN PANEL ---' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "All 3 services have been launched in dedicated terminal windows:" -ForegroundColor Cyan
Write-Host "  1. Backend API:      http://localhost:3001" -ForegroundColor White
Write-Host "  2. Next.js Website:  http://localhost:3000" -ForegroundColor White
Write-Host "  3. Admin OS Panel:   http://localhost:8080 (or http://localhost:8081 / http://localhost:5173)" -ForegroundColor White
Write-Host ""
Write-Host "Close individual windows anytime to stop a specific service." -ForegroundColor Gray
Write-Host "==================================================" -ForegroundColor Cyan
