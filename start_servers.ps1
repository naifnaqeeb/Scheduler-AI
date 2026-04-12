# start_servers.ps1
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting Universal Service Booking AI (React + FastAPI)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Start Frontend in a new window
Write-Host "[1/2] Launching Next.js Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Start Backend in a new window
Write-Host "[2/2] Launching FastAPI Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload"

Write-Host ""
Write-Host "Done! Two new terminal windows should be opening." -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000"
Write-Host "- Backend:  http://localhost:8000"
Write-Host "========================================================" -ForegroundColor Cyan
pause
