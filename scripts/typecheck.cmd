@echo off
setlocal

cd /d "%~dp0.."

echo Running TypeScript validation...
call npm run typecheck

if errorlevel 1 (
    echo TypeScript validation failed.
    exit /b 1
)

echo TypeScript validation passed.
endlocal
