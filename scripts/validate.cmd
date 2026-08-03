@echo off
setlocal

cd /d "%~dp0.."

echo ========================================
echo Radaba validation
echo ========================================

echo.
echo [1/5] Running lint...
call npm run lint
if errorlevel 1 goto :failed

echo.
echo [2/5] Running authentication regression tests...
call node --test tests/auth/compat.test.js
if errorlevel 1 goto :failed

echo.
echo [2a/5] Running mobile API compatibility tests...
call node --test tests/mobile-api/compatibility.test.js tests/mobile-api/assignment-image-reads.test.js tests/mobile-api/cell-support-reads.test.js tests/mobile-api/auth-profile.test.js tests/mobile-api/image-writes.test.js tests/mobile-api/assignment-transitions.test.js tests/mobile-api/assignment-finish.test.js tests/mobile-api/assignment-lifecycle-consolidation.test.js tests/mobile-api/cell-sector-writes.test.js tests/mobile-api/security-hardening.test.js tests/mobile-api/staging-readiness.test.js
if errorlevel 1 goto :failed

echo.
echo [2b/5] Running Assignment contract regression tests...
call node --test tests/assignment/contract.test.js
if errorlevel 1 goto :failed

echo.
echo [2c/5] Running Assignment list regression tests...
call node --test tests/assignment/list-page.test.js
if errorlevel 1 goto :failed

echo.
echo [2d/5] Running Assignment search and export regression tests...
call node --test tests/assignment/search-export.test.js
if errorlevel 1 goto :failed

echo.
echo [2d2/5] Running Assignment Dashboard regression tests...
call node --test tests/assignment/assignment-dashboard.test.js tests/assignment/assignment-dashboard-hydration.test.js
if errorlevel 1 goto :failed

echo.
echo [2e/5] Running administrator regression tests...
call node --test tests/admin/contract.test.js
if errorlevel 1 goto :failed

echo.
echo [2e2/5] Running Roles redesign regression tests...
call node --test tests/admin/roles-redesign.test.js
if errorlevel 1 goto :failed

echo.
echo [2e3/5] Running Privileges redesign regression tests...
call node --test tests/admin/privileges-redesign.test.js
if errorlevel 1 goto :failed

echo.
echo [2f/5] Running Phase 7D regression tests...
call node --test tests/assignment/create-reassignment.test.js tests/assignment/phase-7d-ui.test.js
if errorlevel 1 goto :failed

echo.
echo [2g/5] Running Phase 7E regression tests...
call node --test tests/assignment/phase-7e-import.test.js
if errorlevel 1 goto :failed

echo.
echo [2h/5] Running Towers regression tests...
call node --test tests/towers/towers.test.js
if errorlevel 1 goto :failed

echo.
echo [2i/5] Running Phase 8B regression tests...
call node --test tests/towers/phase-8b-related-assignments.test.js
if errorlevel 1 goto :failed

echo.
echo [2j/5] Running Phase 8C regression tests...
call node --test tests/towers/phase-8c-map.test.js
if errorlevel 1 goto :failed

echo.
echo [2j2/5] Running Phase 8D Tower Create regression tests...
call node --test tests/towers/phase-8d-create.test.js
if errorlevel 1 goto :failed

echo.
echo [2j3/5] Running Phase 8E Tower Edit regression tests...
call node --test tests/towers/phase-8e-edit.test.js
if errorlevel 1 goto :failed

echo.
echo [2j4/5] Running Phase 8F Tower Import regression tests...
call node --test tests/towers/phase-8f-import.test.js
if errorlevel 1 goto :failed

echo.
echo [2j5/5] Running Phase 8G Tower Audit regression tests...
call node --test tests/towers/phase-8g-audit.test.js
if errorlevel 1 goto :failed

echo.
echo [2k/5] Running Phase 9A Rigger regression tests...
call node --test tests/riggers/phase-9a-riggers.test.js
if errorlevel 1 goto :failed

echo [2l/5] Running production operations regression tests...
call node --test tests/operations/production-readiness.test.js tests/operations/final-platform.test.js
if errorlevel 1 goto :failed

echo [3/5] Running type-check...
call npx tsc --noEmit
if errorlevel 1 goto :failed

echo.
echo [4/5] Cleaning generated files...
if exist ".next" rmdir /s /q ".next"
if exist "tsconfig.tsbuildinfo" del /f /q "tsconfig.tsbuildinfo"

echo.
echo [5/5] Running production build...
call npm run build
if errorlevel 1 goto :failed

echo.
echo ========================================
echo All validation checks passed.
echo ========================================
exit /b 0

:failed
echo.
echo ========================================
echo Validation failed.
echo Review the error above.
echo ========================================
exit /b 1




