@echo off
setlocal

cd /d "%~dp0.."

echo Stopping generated Next.js artifacts cleanup...

if exist ".next" (
    rmdir /s /q ".next"
)

if exist "tsconfig.tsbuildinfo" (
    del /f /q "tsconfig.tsbuildinfo"
)

echo Cleanup completed.
endlocal
