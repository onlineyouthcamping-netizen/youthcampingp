@echo off
REM Youth Camping Scraper - Windows Task Scheduler Script
REM This runs weekly (Sunday 2:00 AM)

setlocal enabledelayedexpansion

REM Change to scraper directory
cd /d "D:\os\scraper"

REM Log file with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set logfile=logs\task-scheduler-%mydate%-%mytime%.log

REM Create logs directory if not exists
if not exist "logs" mkdir logs

REM Write to log
echo ===================================== >> %logfile%
echo Started at: %date% %time% >> %logfile%
echo ===================================== >> %logfile%

REM Run the deployment scraper
node deploy.js >> %logfile% 2>&1

REM Capture exit code
set exitcode=%errorlevel%

REM Log completion
echo. >> %logfile%
echo Exit Code: %exitcode% >> %logfile%
echo Completed at: %date% %time% >> %logfile%
echo ===================================== >> %logfile%

REM Exit with same code
exit /b %exitcode%
