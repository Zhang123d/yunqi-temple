@echo off
cd /d "%~dp0"
set "HOST=127.0.0.1"
set "PORT=8766"
node server.js --open
if errorlevel 1 pause
