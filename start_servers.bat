@echo off
echo ========================================================
echo Starting Universal Service Booking AI (React + FastAPI)
echo ========================================================

echo.
echo [1/2] Starting Next.js Frontend Development Server...
start "Frontend (Next.js)" cmd /k "npm run dev"

echo.
echo [2/2] Starting FastAPI Backend Server...
start "Backend (FastAPI)" cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload"

echo.
echo ========================================================
echo Both servers have been launched in separate windows!
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - Backend Docs: http://localhost:8000/docs
echo ========================================================
echo Note: Ensure you have added your MongoDB + Gemini keys
echo into .env.local and backend/.env as instructed.
pause