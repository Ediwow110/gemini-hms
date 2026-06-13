@echo off
cd /d "%~dp0"
set "ROOT=%CD%"

echo [HMS] Checking prerequisites...
set ERR=

rem --- Resolve npm location ---
for /f "delims=" %%i in ('where npm.cmd 2^>nul') do set "NPM=%%i" & goto :found_npm
echo [FAIL] npm.cmd not found in PATH
set ERR=1
:found_npm

rem --- Check node_modules ---
if not exist "%ROOT%\hms-frontend\node_modules" (
    echo [FAIL] hms-frontend\node_modules missing. Run: cd frontend ^&^& npm install
    set ERR=1
)
if not exist "%ROOT%\hms-backend\node_modules" (
    echo [FAIL] hms-backend\node_modules missing. Run: cd backend ^&^& npm install
    set ERR=1
)

rem --- Check Docker DB ---
docker ps --format "{{.Names}}" 2>nul | findstr /i "hms-login-official-db" >nul
if errorlevel 1 (
    echo [WARN] DB container not running. Attempting start...
    docker compose up -d db 2>nul || docker start hms-login-official-db-1 2>nul
    if errorlevel 1 (
        echo [WARN] Could not auto-start DB. Backend will fail on DB queries.
    ) else (
        echo [OK] DB started. Waiting 8s...
        timeout /t 8 /nobreak >nul
    )
) else (
    echo [OK] DB container running.
)

if defined ERR (
    echo.
    echo [HMS] Fix errors above and re-run.
    pause
    exit /b 1
)

rem --- Kill stale ---
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":5173 "') do taskkill /f /pid %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /c:":3000 "') do taskkill /f /pid %%a 2>nul
timeout /t 2 /nobreak >nul

echo [HMS] Launching servers...

rem --- start launches independent cmd windows (survives tool cleanup) ---
start "HMS-Frontend" cmd /c "title HMS-Frontend && cd /d "%ROOT%\hms-frontend" && npm run dev"
echo [OK] Frontend window opened: http://localhost:5173/

timeout /t 8 /nobreak >nul

start "HMS-Backend" cmd /c "title HMS-Backend && cd /d "%ROOT%\hms-backend" && npm run start:dev"
echo [OK] Backend window opened: http://localhost:3000/

echo.
echo ===================================================================
echo  HMS Core starting...
echo  Frontend: http://localhost:5173/  (opens terminal window)
echo  Backend:  http://localhost:3000/  (opens terminal window)
echo  Close the terminal windows to stop servers.
echo  Run from File Explorer or any terminal - guaranteed to work.
echo ===================================================================
echo.
