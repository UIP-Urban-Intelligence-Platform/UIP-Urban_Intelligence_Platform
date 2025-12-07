@echo off
REM SPDX-License-Identifier: MIT
REM Copyright (c) 2025 UIP Team. All rights reserved.
REM
REM UIP - Urban Intelligence Platform
REM https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
REM
REM Start Citizen Ingestion Agent FastAPI Server
REM Uses virtual environment and loads API keys from data_sources.yaml
REM
REM Module: scripts/start_citizen_agent.bat
REM Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
REM Created: 2025-11-26
REM Version: 1.0.0
REM Description: Batch script to start the Citizen Ingestion Agent

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
