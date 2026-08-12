@echo off
echo ===================================================
echo Starting JobTracker Backend & Next.js Frontend...
echo ===================================================

cd /d "%~dp0"

echo 1. Starting Backend API Server on http://127.0.0.1:8000 ...
start "JobTracker - Backend (Django)" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe manage.py migrate && .venv\Scripts\python.exe manage.py seed_demo && .venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

echo 2. Waiting 3 seconds for Backend to initialize...
timeout /t 3 /nobreak >nul

echo 3. Starting Next.js Web Frontend on http://localhost:3000 ...
start "JobTracker - Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ===================================================
echo Backend and Frontend windows launched!
echo - Web Application: http://localhost:3000
echo - Backend API: http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/api/v1/docs/
echo - Demo Login: demo@jobtracker.local / Password123!
echo ===================================================
pause
