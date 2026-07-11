#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Setup Windows Task Scheduler for weekly scraping

.DESCRIPTION
    Configures Windows Task Scheduler to run the scraper every Sunday at 2:00 AM

.EXAMPLE
    .\setup-task-scheduler.ps1
    
.NOTES
    Requires Admin privileges
#>

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ This script must run as Administrator!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as administrator'"
    exit 1
}

Write-Host "`n╔════════════════════════════════════════╗"
Write-Host "║  TASK SCHEDULER SETUP                  ║"
Write-Host "║  Youth Camping Scraper - Weekly Run    ║"
Write-Host "╚════════════════════════════════════════╝`n"

$scraperPath = "D:\os\scraper"
$batchFile = "run-scraper.bat"
$taskName = "YouthCamping-Scraper"
$taskDesc = "Weekly web scraper for youthcamping.in (Sunday 2:00 AM)"

# Verify files exist
if (-not (Test-Path "$scraperPath\$batchFile")) {
    Write-Host "❌ Error: $batchFile not found at $scraperPath" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Configuration:"
Write-Host "   Task Name:    $taskName"
Write-Host "   Batch File:   $batchFile"
Write-Host "   Run Time:     Sunday 2:00 AM"
Write-Host "   Work Dir:     $scraperPath"
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "⚠️  Task '$taskName' already exists." -ForegroundColor Yellow
    $response = Read-Host "   Replace it? (yes/no)"
    if ($response -ne "yes") {
        Write-Host "❌ Setup cancelled"
        exit 0
    }
    
    # Remove existing task
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "   ✅ Removed existing task"
}

Write-Host "`n⏳ Creating task..."

# Create trigger (Sunday 2:00 AM)
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2AM

# Create action (run batch file)
$action = New-ScheduledTaskAction `
    -Execute "${env:windir}\System32\cmd.exe" `
    -Argument "/c `"$batchFile`"" `
    -WorkingDirectory $scraperPath

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -RunWithoutNetwork:$false `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew

# Create principal (run as SYSTEM or current user)
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:COMPUTERNAME\$env:USERNAME" `
    -LogonType Interactive

# Register task
Register-ScheduledTask `
    -TaskName $taskName `
    -Description $taskDesc `
    -Trigger $trigger `
    -Action $action `
    -Settings $settings `
    -Principal $principal `
    -Force | Out-Null

Write-Host "✅ Task created successfully!"

Write-Host "`n📊 Task Details:"
$task = Get-ScheduledTask -TaskName $taskName
Write-Host "   Name:        $($task.TaskName)"
Write-Host "   State:       $($task.State)"
Write-Host "   Last Run:    $($task.LastRunTime)"
Write-Host "   Last Result: $($task.LastTaskResult)" 

Write-Host "`n📅 Schedule:"
Write-Host "   Frequency:   Weekly (Every Sunday)"
Write-Host "   Time:        2:00 AM"
Write-Host "   Next Run:    (Will be calculated by Windows)"

Write-Host "`n📁 Logs:"
Write-Host "   Location:    $scraperPath\logs\"
Write-Host "   Format:      task-scheduler-YYYY-MM-DD-HHMM.log"
Write-Host "   View:        Get-Content logs\*.log -Tail 50"

Write-Host "`n✨ Setup Complete!"
Write-Host "`nThe scraper will run automatically every Sunday at 2:00 AM.`n"

Write-Host "💡 To test the task:"
Write-Host "   1. Open Task Scheduler (taskschd.msc)"
Write-Host "   2. Find '$taskName' in the task list"
Write-Host "   3. Right-click and select 'Run'"
Write-Host "   4. Check logs folder for output`n"

Write-Host "📝 To modify schedule:"
Write-Host "   taskschd.msc (GUI) or" 
Write-Host "   Set-ScheduledTaskTrigger -TaskName '$taskName' (PowerShell)`n"

Write-Host "❌ To disable:"
Write-Host "   Unregister-ScheduledTask -TaskName '$taskName'`n"
