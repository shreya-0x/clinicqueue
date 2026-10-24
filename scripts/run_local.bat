@echo off
echo ========================================================
echo Starting ClinicQueue - Full-Stack Local Execution
echo ========================================================

echo [1/2] Starting Python Flask REST API on http://localhost:5000...
start cmd /k ".\venv\Scripts\python -m backend.app"

echo [2/2] Starting Vite Frontend on http://localhost:5173...
cd frontend
npm run dev
