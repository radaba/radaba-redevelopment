@echo off
setlocal

cd /d "%~dp0.."

echo ========================================
echo Radaba preflight check
echo ========================================

echo.
echo Current directory:
cd

echo.
echo Node version:
node --version

echo.
echo NPM version:
npm --version

echo.
echo Git status:
git status --short

echo.
echo Checking important files...

call :check_file "AGENTS.md"
call :check_file ".docs\project-context.md"
call :check_file ".docs\architecture.md"
call :check_file ".docs\authentication-flow.md"
call :check_file ".docs\api-contract.md"
call :check_file ".docs\security.md"
call :check_file "package.json"
call :check_file "src\app\login\page.tsx"
call :check_file "src\app\api\auth\login\route.ts"
call :check_file "src\lib\auth\session.ts"

echo.
echo Preflight completed.
exit /b 0

:check_file
if exist "%~1" (
    echo [OK] %~1
) else (
    echo [MISSING] %~1
)
exit /b 0
