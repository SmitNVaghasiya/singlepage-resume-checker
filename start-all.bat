@echo off
echo Starting Resume Checker Application...
echo.

REM Start Backend
echo [1/3] Starting Backend Server...
start "Backend Server" cmd /k "cd /d backend && npm run dev"

REM Wait a moment before starting next service
timeout /t 2 >nul

REM Start Frontend
echo [2/3] Starting Frontend Application...
start "Frontend App" cmd /k "cd /d frontend && npm run dev"

REM Wait a moment before starting next service
timeout /t 2 >nul

REM Start Python Service
echo [3/3] Starting Python AI Service...
start "Python AI Service" cmd /k "cd /d python-service && python start.py"

echo.
echo ✅ All services are starting up!
echo.
echo 📋 Service URLs:
echo   • Frontend:    http://localhost:5173
echo   • Backend:     http://localhost:3000
echo   • Python API:  http://localhost:8000
echo.
echo 💡 Each service will open in a separate command window.
echo    Close individual windows or press Ctrl+C to stop services.
echo.
pause 