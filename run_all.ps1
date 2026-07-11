# Script to run all four components of the YouthCamping application

Write-Host "Starting YouthCamping Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\os\backend'; npm run dev"

Write-Host "Starting YouthCamping Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\os\frontend'; npm run dev"

Write-Host "Starting Admin Panel..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\os\ADMIN-PANEL'; npm run dev"

Write-Host "Starting Guide Operations API Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\os\guide'; pnpm --filter @workspace/api-server run dev"

Write-Host "All applications are starting in separate windows." -ForegroundColor Magenta
