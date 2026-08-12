Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting JobTracker Backend & Next.js Frontend..." -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "1. Starting Backend API Server on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; .venv\Scripts\python.exe manage.py migrate; .venv\Scripts\python.exe manage.py seed_demo; .venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000"

Write-Host "2. Waiting 3 seconds for Backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "3. Starting Next.js Web Frontend on http://localhost:3000 ..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Backend and Frontend launched!" -ForegroundColor Cyan
Write-Host "- Web Application: http://localhost:3000" -ForegroundColor White
Write-Host "- Backend API: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "- Swagger Docs: http://127.0.0.1:8000/api/v1/docs/" -ForegroundColor White
Write-Host "- Demo Login: demo@jobtracker.local / Password123!" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
