@echo off
title ICSE Learning Arena Launcher
cd /d "%~dp0"
echo Starting the local server...
start /min py server.py
timeout /t 2 >nul
echo Launching app in browser...
start http://localhost:8000
exit