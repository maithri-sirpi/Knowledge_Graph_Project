@echo off
title Kannada Story Knowledge Graph Generator Runner

echo ===================================================
echo Starting Kannada Story Knowledge Graph Generator...
echo ===================================================

:: Create root .env if it doesn't exist
if not exist ".env" (
    echo GEMINI_API_KEY= > .env
    echo OPENAI_API_KEY= >> .env
)

:: 1. Start backend in a new command prompt window
echo Starting FastAPI backend in a new window...
start "FastAPI Backend" cmd /k "cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: 2. Start frontend in a new command prompt window
echo Starting Vite Frontend in a new window...
start "Vite React Frontend" cmd /k "cd frontend && npm install && npm run dev"

:: 3. Wait 3 seconds and open the web page
timeout /t 3 /nobreak >nul
echo Opening web interface...
start http://localhost:5173

echo ===================================================
echo Done! Both services are loading in separate windows.
echo If you don't have Neo4j running, the app will
echo automatically use its built-in in-memory cache.
echo ===================================================
pause
