@echo off
title YouthCamping OS Launcher
echo ==================================================
echo Starting All YouthCamping OS Services Locally...
echo ==================================================

start "YouthCamping Backend (3001)" cmd /k "cd /d %~dp0backend && npm run dev"
start "YouthCamping Frontend (3000)" cmd /k "cd /d %~dp0frontend && npm run dev"
start "YouthCamping Admin OS (ycadmin)" cmd /k "cd /d %~dp0ycadmin && npm run dev"

echo.
echo All 3 services have been launched in separate terminal windows:
echo   - Backend API:       http://localhost:3001
echo   - Next.js Website:   http://localhost:3000
echo   - Admin OS Panel:    http://localhost:8080 (or http://localhost:8081 / http://localhost:5173)
echo.
echo You can close this window. To stop a service, close its respective window.
echo ==================================================
pause
