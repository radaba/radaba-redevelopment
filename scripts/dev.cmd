@echo off
setlocal

cd /d "%~dp0.."

echo Starting Radaba development server...
call npm run dev

endlocal
