@echo off
echo Requesting Administrator permissions to allow port 5000 in Windows Firewall...
powershell -Command "Start-Process powershell -ArgumentList '-NoExit -Command New-NetFirewallRule -DisplayName \"Allow API Port 5000\" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000' -Verb RunAs"
echo Done!
