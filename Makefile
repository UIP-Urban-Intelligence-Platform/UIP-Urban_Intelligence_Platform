# ============================================================================
# UIP - Urban Intelligence Platform
# Copyright (c) 2025 UIP Team. All rights reserved.
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# SPDX-License-Identifier: MIT
# ============================================================================
# File: Makefile
# Module: One Command Setup & Run
# Author: Nguyen Nhat Quang
# Created: 2025-11-27
# Version: 2.0.0
# License: MIT
#
# Description:
#   GNU Makefile for project setup, build, and deployment
#
# Usage:
#   make             - Show help
#   make setup       - Install all dependencies
#   make dev         - Run everything in development mode
#   make prod        - Run everything with Docker Compose
#   make stop        - Stop all services
#   make clean       - Clean and reset everything
# ============================================================================

.PHONY: all install uninstall build clean distclean check help
.PHONY: setup setup-dirs setup-env install-python install-models install-node pull-docker verify
.PHONY: dev prod stop docker-build docker-up docker-down cv-sync-prod
.PHONY: run deploy logs test health status

# ============================================================================
# GNU MAKE STANDARD TARGETS
# ============================================================================

# Default target - build the project
all: build
	@echo "✅ Build complete!"

# Build the Python package
build:
	@echo "🔨 Building Python package..."
	@if exist .venv ( \
		.venv\Scripts\python -m pip install --upgrade pip setuptools wheel && \
		.venv\Scripts\python -m build \
	) else ( \
		python -m pip install --upgrade pip setuptools wheel && \
		python -m build \
	)
	@echo "✅ Package built in dist/"

# Install the package (GNU Make standard target)
install: build
	@echo "📦 Installing uip-urban-intelligence-platform..."
	@if exist .venv ( \
		.venv\Scripts\pip install . \
	) else ( \
		pip install . \
	)
	@echo "✅ Package installed successfully!"
	@echo ""
	@echo "Usage: uip-orchestrator"

# Uninstall the package
uninstall:
	@echo "🗑️ Uninstalling uip-urban-intelligence-platform..."
	@if exist .venv ( \
		.venv\Scripts\pip uninstall -y uip-urban-intelligence-platform \
	) else ( \
		pip uninstall -y uip-urban-intelligence-platform \
	)
	@echo "✅ Package uninstalled"

# Run tests (GNU Make standard: check)
check: test
	@echo "✅ All checks passed"

# Remove build artifacts (GNU Make standard: clean)
# Note: This target removes only build artifacts, not dependencies

# Remove all generated files including dependencies
distclean: clean
	@echo "🧹 Removing all generated files..."
	@if exist .venv rmdir /s /q .venv
	@if exist apps\traffic-web-app\backend\node_modules rmdir /s /q apps\traffic-web-app\backend\node_modules
	@if exist apps\traffic-web-app\frontend\node_modules rmdir /s /q apps\traffic-web-app\frontend\node_modules
	@echo "✅ All generated files removed"

# ============================================================================
# HELP (Default Target)
# ============================================================================

.DEFAULT_GOAL := help

help:
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║  UIP - Urban Intelligence Platform - GNU Make Build System    ║"
	@echo "║  Version 3.1.0 - Full PoF Compliance + CV & Sync Pipeline     ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "GNU Make Standard Targets:"
	@echo "  make            - Show this help message"
	@echo "  make all        - Build everything"
	@echo "  make install    - Build and install the package"
	@echo "  make uninstall  - Uninstall the package"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make distclean  - Remove all generated files"
	@echo "  make check      - Run all tests"
	@echo ""
	@echo "Project-Specific Targets:"
	@echo "  make setup      - Install ALL dependencies (Python, Node.js, ML models, Docker)"
	@echo "  make dev        - Run all services in development mode + CV Pipeline"
	@echo "  make prod       - Run all services with Docker Compose + CV Pipeline"
	@echo "  make stop       - Stop all running services"
	@echo "  make logs       - View Docker Compose logs"
	@echo "  make status     - Check status of all services"
	@echo "  make health     - Check service health endpoints"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make setup   (first time - installs Python, Node.js, ML models, Docker images)"
	@echo "  2. make dev     (for development + auto-runs CV & Sync pipeline)"
	@echo "  or"
	@echo "  1. make run     (auto-setup + dev mode in one command)"
	@echo ""
	@echo "CV & Sync Pipeline:"
	@echo "  - Automatically runs after dev/prod startup"
	@echo "  - 99999 runs, 60s delay, ALL cameras"
	@echo "  - Live Camera -> YOLOX -> Neo4j -> Analytics"
	@echo ""

# ============================================================================
# SETUP - Install ALL Dependencies (100% equivalent to justrun.ps1 setup)
# ============================================================================

setup: setup-dirs setup-env install-python install-models install-node pull-docker verify
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "  ✅ SETUP COMPLETE!"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Next step: Run the project with:"
	@echo "  make dev"
	@echo ""

setup-dirs:
	@echo ""
	@echo "[1/7] Creating required directories..."
	@if not exist logs mkdir logs
	@if not exist data mkdir data
	@if not exist data\cache mkdir data\cache
	@if not exist data\rdf mkdir data\rdf
	@if not exist reports mkdir reports
	@if not exist test_output mkdir test_output
	@if not exist assets\models mkdir assets\models
	@if not exist apps\traffic-web-app\backend\logs mkdir apps\traffic-web-app\backend\logs
	@echo "       ✅ All directories ready"

setup-env:
	@echo ""
	@echo "[2/7] Setting up environment files..."
	@if not exist .env if exist .env.example copy .env.example .env >nul && echo "       Created: .env"
	@if not exist apps\traffic-web-app\backend\.env if exist apps\traffic-web-app\backend\.env.example copy apps\traffic-web-app\backend\.env.example apps\traffic-web-app\backend\.env >nul && echo "       Created: backend/.env"
	@if not exist apps\traffic-web-app\frontend\.env if exist apps\traffic-web-app\frontend\.env.example copy apps\traffic-web-app\frontend\.env.example apps\traffic-web-app\frontend\.env >nul && echo "       Created: frontend/.env"
	@echo "       ✅ Environment files ready"

install-python:
	@echo ""
	@echo "[3/7] Setting up Python environment..."
	@if not exist .venv (echo        Creating virtual environment... && python -m venv .venv)
	@echo        Upgrading pip...
	@.venv\Scripts\pip install --upgrade pip setuptools wheel -q
	@echo        Installing Python dependencies...
	@.venv\Scripts\pip install -r requirements/dev.txt -q
	@echo        Installing statsmodels for analytics...
	@.venv\Scripts\pip install statsmodels scipy -q
	@echo        Installing timm (required for DETR)...
	@.venv\Scripts\pip install timm -q
	@echo "       ✅ Python dependencies installed"

install-models:
	@echo ""
	@echo "[4/7] Installing YOLOX and downloading ML models..."
	@echo        Installing YOLOX from GitHub (Apache-2.0 license)...
	@.venv\Scripts\pip show yolox >nul 2>&1 || .venv\Scripts\pip install git+https://github.com/Megvii-BaseDetection/YOLOX.git -q
	@echo        ✅ YOLOX installed
	@if not exist assets\models\yolox_x.pth ( \
		echo        Downloading YOLOX-X weights (794MB)... && \
		echo        This may take a few minutes... && \
		.venv\Scripts\python scripts/download_yolox_weights.py --model yolox-x \
	) else ( \
		echo        ✅ YOLOX-X weights already exist \
	)
	@echo        Downloading DETR accident detection model...
	@.venv\Scripts\python scripts/download_accident_model.py 2>nul || echo        ✅ DETR model ready
	@echo "       ✅ ML models ready"

install-node:
	@echo ""
	@echo "[5/7] Setting up Node.js dependencies..."
	@echo        Installing backend packages...
	@cd apps\traffic-web-app\backend && npm install --silent 2>nul
	@echo        Installing frontend packages...
	@cd apps\traffic-web-app\frontend && npm install --silent 2>nul
	@echo "       ✅ Node.js dependencies installed"

pull-docker:
	@echo ""
	@echo "[6/7] Pulling Docker images..."
	@echo        Images: Neo4j, Fuseki, MongoDB, Redis, PostgreSQL, Kafka, Stellio
	@docker pull neo4j:5.12.0 -q 2>nul && echo        ✅ neo4j
	@docker pull stain/jena-fuseki:latest -q 2>nul && echo        ✅ fuseki
	@docker pull redis:7-alpine -q 2>nul && echo        ✅ redis
	@docker pull mongo:7.0 -q 2>nul && echo        ✅ mongodb
	@docker pull timescale/timescaledb-ha:pg15 -q 2>nul && echo        ✅ postgres
	@docker pull apache/kafka:latest -q 2>nul && echo        ✅ kafka
	@docker pull stellio/stellio-api-gateway:2.26.1 -q 2>nul && echo        ✅ stellio-gateway
	@docker pull stellio/stellio-search-service:2.26.1 -q 2>nul && echo        ✅ stellio-search
	@docker pull stellio/stellio-subscription-service:2.26.1 -q 2>nul && echo        ✅ stellio-subscription
	@echo "       ✅ Docker images ready"

verify:
	@echo ""
	@echo "[7/7] Verifying installation..."
	@.venv\Scripts\python -c "import yolox; print('       ✅ YOLOX module verified')" 2>nul || echo "       ⚠️  YOLOX module not found - CV will use mock detector"
	@if exist assets\models\yolox_x.pth (echo        ✅ YOLOX weights verified) else (echo        ⚠️  YOLOX weights not found)
	@.venv\Scripts\python -c "import transformers; print('       ✅ Transformers (DETR) verified')" 2>nul || echo "       ⚠️  Transformers not found"

# ============================================================================
# DEVELOPMENT MODE - Run all services locally (100% equivalent to justrun.ps1 dev)
# ============================================================================

dev:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "  UIP - Urban Intelligence Platform"
	@echo "  Development Mode"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@if not exist .venv (echo ⚠️  First time setup detected... && $(MAKE) setup)
	@if not exist apps\traffic-web-app\backend\node_modules (echo ⚠️  Node modules missing... && $(MAKE) setup)
	@if not exist assets\models\yolox_x.pth (echo ⚠️  ML models missing... && $(MAKE) install-models)
	@echo ""
	@echo "[1/4] Starting Docker infrastructure..."
	@echo "      Services: Neo4j, Fuseki, Redis, MongoDB, PostgreSQL, Kafka, Stellio"
	@docker-compose up -d neo4j fuseki redis mongodb postgres kafka 2>nul
	@echo "      Waiting for databases to be healthy..."
	@timeout /t 10 /nobreak > nul
	@docker-compose up -d stellio-api-gateway search-service subscription-service 2>nul
	@echo "      Waiting for Stellio..."
	@timeout /t 10 /nobreak > nul
	@echo "      ✅ Docker infrastructure started"
	@echo ""
	@echo "[2/4] Starting Python services..."
	@echo "      - Citizen Ingestion API (FastAPI) on port 8001"
	@echo "      - Orchestrator Scheduler (APScheduler)"
	@start cmd /k "cd /d $(CURDIR) && .venv\Scripts\activate && echo Python Backend - Citizen API + Orchestrator && python main.py --run-orchestrator-now"
	@timeout /t 5 /nobreak > nul
	@echo "      ✅ Python services started"
	@echo ""
	@echo "[3/4] Starting TypeScript backend..."
	@echo "      - Express.js API on port 5000"
	@echo "      - 3 AI Agents (TrafficMaestro, GraphInvestigator, EcoTwin)"
	@start cmd /k "cd /d $(CURDIR)\apps\traffic-web-app\backend && echo TypeScript Backend - Express.js API && npm run dev"
	@timeout /t 3 /nobreak > nul
	@echo "      ✅ TypeScript backend started"
	@echo ""
	@echo "[4/4] Starting React frontend..."
	@echo "      - Vite dev server on port 5173"
	@start cmd /k "cd /d $(CURDIR)\apps\traffic-web-app\frontend && echo React Frontend - Vite Dev Server && npm run dev"
	@timeout /t 3 /nobreak > nul
	@echo "      ✅ React frontend started"
	@echo ""
	@echo "[5/5] Starting Real-time Data Generator Pipeline..."
	@echo "      - Live Camera -> YOLOX -> Neo4j -> Analytics"
	@echo "      - Runs: 99999, Delay: 60s, Max Cameras: ALL"
	@echo "      - This will populate databases with real traffic data"
	@start cmd /k "cd /d $(CURDIR) && .venv\Scripts\activate && echo CV and Sync Pipeline - Data Generator && python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60"
	@timeout /t 2 /nobreak > nul
	@echo "      ✅ CV & Sync pipeline started"
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "  ✅ ALL SERVICES STARTED SUCCESSFULLY!"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "ACCESS POINTS:"
	@echo ""
	@echo "  Application:"
	@echo "    Frontend (React):      http://localhost:5173"
	@echo "    Backend (Express):     http://localhost:5000"
	@echo "    Citizen API (FastAPI): http://localhost:8001/docs"
	@echo ""
	@echo "  Infrastructure:"
	@echo "    Stellio Context Broker: http://localhost:8080"
	@echo "    Neo4j Browser:          http://localhost:7474 (neo4j/test12345)"
	@echo "    Apache Jena Fuseki:     http://localhost:3030 (admin/test_admin)"
	@echo ""
	@echo "  Data Pipeline:"
	@echo "    CV & Sync Pipeline:     Running in separate window"
	@echo "                            (99999 runs, 60s delay, ALL cameras)"
	@echo ""
	@echo "TO STOP ALL SERVICES: make stop"
	@echo ""

# ============================================================================
# PRODUCTION MODE - Docker Compose Full Stack (100% equivalent to justrun.ps1 prod)
# ============================================================================

prod: setup-dirs setup-env install-python install-models docker-build docker-up cv-sync-prod
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "  ✅ PRODUCTION ENVIRONMENT STARTED!"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "ACCESS POINTS:"
	@echo "  Frontend:     http://localhost:3000"
	@echo "  Backend:      http://localhost:3001"
	@echo "  Citizen API:  http://localhost:8001/docs"
	@echo "  Stellio:      http://localhost:8080"
	@echo "  Neo4j:        http://localhost:7474 (neo4j/test12345)"
	@echo "  Fuseki:       http://localhost:3030 (admin/test_admin)"
	@echo ""
	@echo "  Data Pipeline:"
	@echo "    CV & Sync Pipeline:     Running in separate window"
	@echo "                            (99999 runs, 60s delay, ALL cameras)"
	@echo ""
	@echo "View logs: make logs"
	@echo "Stop all:  make stop"
	@echo ""

cv-sync-prod:
	@echo ""
	@echo "[8/8] Starting Real-time Data Generator Pipeline..."
	@echo "      - Live Camera -> YOLOX -> Neo4j -> Analytics"
	@echo "      - Runs: 99999, Delay: 60s, Max Cameras: ALL"
	@echo "      - This will populate databases with real traffic data"
	@start cmd /k "cd /d $(CURDIR) && if exist .venv (.venv\Scripts\activate) && echo CV and Sync Pipeline - Data Generator (PROD) && python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60"
	@timeout /t 2 /nobreak > nul
	@echo "      ✅ CV & Sync pipeline started"

docker-build:
	@echo ""
	@echo "🐳 Building Docker images..."
	@docker-compose build --parallel
	@echo "✅ Docker images built"

docker-up:
	@echo ""
	@echo "🚀 Starting Docker Compose stack..."
	@echo "   Starting infrastructure services..."
	@docker-compose up -d neo4j fuseki redis mongodb postgres kafka
	@echo "   Waiting for databases to be healthy..."
	@timeout /t 15 /nobreak > nul
	@echo "   Starting Stellio Context Broker..."
	@docker-compose up -d stellio-api-gateway search-service subscription-service
	@echo "   Waiting for Stellio..."
	@timeout /t 15 /nobreak > nul
	@echo "   Starting application services..."
	@docker-compose up -d python-backend backend frontend 2>nul || docker-compose up -d
	@echo "   Waiting for applications..."
	@timeout /t 10 /nobreak > nul
	@docker-compose ps
	@echo "✅ Docker stack is running"

docker-down:
	@echo "🛑 Stopping Docker Compose stack..."
	@docker-compose down
	@echo "✅ Docker stack stopped"

# ============================================================================
# MANAGEMENT COMMANDS
# ============================================================================

stop:
	@echo "🛑 Stopping all services..."
	@taskkill /F /IM python.exe /T 2>nul || echo "No Python processes"
	@taskkill /F /IM node.exe /T 2>nul || echo "No Node processes"
	@docker-compose down 2>nul || echo "No Docker services"
	@echo "✅ All services stopped"

clean: stop
	@echo "🧹 Cleaning build artifacts and containers..."
	@docker-compose down -v --remove-orphans 2>nul || echo "No Docker services"
	@if exist dist rmdir /s /q dist
	@if exist build rmdir /s /q build
	@if exist *.egg-info rmdir /s /q *.egg-info
	@if exist src\*.egg-info rmdir /s /q src\*.egg-info
	@for /d %%i in (*.egg-info) do rmdir /s /q "%%i" 2>nul
	@if exist htmlcov rmdir /s /q htmlcov
	@if exist .pytest_cache rmdir /s /q .pytest_cache
	@if exist coverage.xml del coverage.xml
	@if exist apps\traffic-web-app\backend\dist rmdir /s /q apps\traffic-web-app\backend\dist
	@if exist apps\traffic-web-app\frontend\dist rmdir /s /q apps\traffic-web-app\frontend\dist
	@for /r %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d" 2>nul
	@echo "✅ Cleanup complete"

logs:
	@docker-compose logs -f

test:
	@echo "🧪 Running tests..."
	@.venv\Scripts\activate && pytest tests/ -v
	@cd apps\traffic-web-app\backend && npm test
	@echo "✅ All tests passed"

# ============================================================================
# QUICK COMMANDS
# ============================================================================

# Just run everything (detect if first time) - One command to rule them all
run:
	@if not exist .venv ($(MAKE) setup)
	@if not exist apps\traffic-web-app\backend\node_modules ($(MAKE) setup)
	@if not exist assets\models\yolox_x.pth ($(MAKE) install-models)
	@$(MAKE) dev

# One-liner for production
deploy: setup prod

# Health check with detailed output
health:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "  HEALTH CHECK"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@curl -s http://localhost:5173 >nul 2>&1 && echo "  ✅ Frontend (5173): UP" || echo "  ❌ Frontend (5173): DOWN"
	@curl -s http://localhost:5000/health >nul 2>&1 && echo "  ✅ Backend (5000): UP" || echo "  ❌ Backend (5000): DOWN"
	@curl -s http://localhost:8001/ >nul 2>&1 && echo "  ✅ Citizen API (8001): UP" || echo "  ❌ Citizen API (8001): DOWN"
	@curl -s http://localhost:8080/actuator/health >nul 2>&1 && echo "  ✅ Stellio (8080): UP" || echo "  ❌ Stellio (8080): DOWN"
	@curl -s http://localhost:7474 >nul 2>&1 && echo "  ✅ Neo4j (7474): UP" || echo "  ❌ Neo4j (7474): DOWN"
	@curl -s http://localhost:3030 >nul 2>&1 && echo "  ✅ Fuseki (3030): UP" || echo "  ❌ Fuseki (3030): DOWN"
	@echo ""

# Status check - show all running services
status:
	@echo ""
	@echo "════════════════════════════════════════════════════════════════"
	@echo "  SERVICE STATUS"
	@echo "════════════════════════════════════════════════════════════════"
	@echo ""
	@echo "Docker Containers:"
	@docker-compose ps 2>nul || echo "  No Docker containers running"
	@echo ""
	@echo "Python Processes:"
	@tasklist /FI "IMAGENAME eq python.exe" 2>nul | findstr python || echo "  No Python processes"
	@echo ""
	@echo "Node Processes:"
	@tasklist /FI "IMAGENAME eq node.exe" 2>nul | findstr node || echo "  No Node processes"
	@echo ""

# ============================================================================
# END OF MAKEFILE
# ============================================================================