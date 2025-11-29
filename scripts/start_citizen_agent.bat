@echo off
REM Start Citizen Ingestion Agent FastAPI Server
REM Uses virtual environment and loads API keys from data_sources.yaml

echo ========================================
echo Starting Citizen Ingestion Agent
echo ========================================
echo.
echo Port: 8001
echo API Keys: Loading from config/data_sources.yaml
echo Environment: Virtual Environment (.venv)
echo.

REM Activate virtual environment and start server
.venv\Scripts\python -m uvicorn src.agents.ingestion.citizen_ingestion_agent:app --reload --port 8001 --log-level info

pause
