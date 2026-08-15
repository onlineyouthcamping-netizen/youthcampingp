@echo off
echo ==================================================
echo Starting All YouthCamping OS Services Locally...
echo ==================================================

start "Backend API (5005)" cmd /k "cd backend && npm run dev"
start "Next.js Frontend (3000)" cmd /k "cd frontend && npm run dev"
start "Admin OS Panel (ycadmin)" cmd /k "cd ycadmin && npm run dev"

echo.
echo All 3 services launched in separate windows!
echo Backend:  http://localhost:5005
echo Frontend: http://localhost:3000
echo Admin OS: http://localhost:8081
echo.
pause
