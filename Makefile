# ============================================================================
# Builder Layer End - One Command Setup & Run
# ============================================================================
# Usage:
#   make             - Show help
#   make setup       - Install all dependencies
#   make dev         - Run everything in development mode
#   make prod        - Run everything with Docker Compose
#   make stop        - Stop all services
#   make clean       - Clean and reset everything
# ============================================================================
#Module: Makefile
#author Nguyễn Nhật Quang
#created 2025-11-27
#modified 2025-11-27
#version 2.0.0
#license MIT
.PHONY: all install uninstall build clean distclean check help
.PHONY: setup dev prod stop docker-build docker-up docker-down install-python install-node

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
	@echo "📦 Installing builder-layer-end..."
	@if exist .venv ( \
		.venv\Scripts\pip install . \
	) else ( \
		pip install . \
	)
	@echo "✅ Package installed successfully!"
	@echo ""
	@echo "Usage: builder-orchestrator"

# Uninstall the package
uninstall:
	@echo "🗑️ Uninstalling builder-layer-end..."
	@if exist .venv ( \
		.venv\Scripts\pip uninstall -y builder-layer-end \
	) else ( \
		pip uninstall -y builder-layer-end \
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
# HELP
# ============================================================================

help:
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║  Builder Layer End - GNU Make Build System                    ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "GNU Make Standard Targets:"
	@echo "  make            - Build the project (default)"
	@echo "  make all        - Build everything"
	@echo "  make install    - Build and install the package"
	@echo "  make uninstall  - Uninstall the package"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make distclean  - Remove all generated files"
	@echo "  make check      - Run all tests"
	@echo ""
	@echo "Project-Specific Targets:"
	@echo "  make setup      - Install all dependencies (Python + Node.js)"
	@echo "  make dev        - Run all services in development mode"
	@echo "  make prod       - Run all services with Docker Compose"
	@echo "  make stop       - Stop all running services"
	@echo "  make logs       - View Docker Compose logs"
	@echo "  make health     - Check service health"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make setup   (first time only)"
	@echo "  2. make         (build the package)"
	@echo "  3. make install (install the package)"
	@echo "  4. make dev     (for development)"
	@echo ""

# ============================================================================
# SETUP - Install all dependencies
# ============================================================================

setup: install-python install-node
	@echo "✅ Setup complete! Run 'make dev' to start development"

install-python:
	@echo "📦 Installing Python dependencies..."
	@if exist .venv (echo "Virtual environment exists") else (python -m venv .venv)
	@.venv\Scripts\pip install --upgrade pip setuptools wheel
	@.venv\Scripts\pip install -r requirements/dev.txt
	@echo "✅ Python dependencies installed"

install-node:
	@echo "📦 Installing Node.js dependencies..."
	@cd apps\traffic-web-app && npm run install:all
	@echo "✅ Node.js dependencies installed"

# ============================================================================
# DEVELOPMENT MODE - Run all services locally
# ============================================================================

dev:
	@echo "🚀 Starting all services in development mode..."
	@start cmd /k "cd /d $(CURDIR) && .venv\Scripts\activate && python orchestrator.py"
	@timeout /t 3 /nobreak > nul
	@start cmd /k "cd /d $(CURDIR)\apps\traffic-web-app\backend && npm run dev"
	@timeout /t 3 /nobreak > nul
	@start cmd /k "cd /d $(CURDIR)\apps\traffic-web-app\frontend && npm run dev"
	@echo "✅ All services started!"
	@echo ""
	@echo "🌐 Access points:"
	@echo "   Frontend:  http://localhost:5173"
	@echo "   Backend:   http://localhost:5000"
	@echo "   Stellio:   http://localhost:8080"
	@echo ""

# ============================================================================
# PRODUCTION MODE - Docker Compose
# ============================================================================

prod: docker-build docker-up
	@echo "✅ Production environment started!"
	@echo ""
	@echo "🌐 Access points:"
	@echo "   Frontend:  http://localhost:3000"
	@echo "   Backend:   http://localhost:5000"
	@echo "   Stellio:   http://localhost:8080"
	@echo "   Neo4j:     http://localhost:7474"
	@echo "   Fuseki:    http://localhost:3030"
	@echo ""
	@echo "📊 View logs: make logs"
	@echo "🛑 Stop all:  make stop"

docker-build:
	@echo "🐳 Building Docker images..."
	@docker-compose build --parallel
	@echo "✅ Docker images built"

docker-up:
	@echo "🚀 Starting Docker Compose stack..."
	@docker-compose up -d
	@echo "⏳ Waiting for services to be healthy..."
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

# Just run everything (detect if first time)
run:
	@if not exist .venv (make setup)
	@if not exist apps\traffic-web-app\backend\node_modules (make setup)
	@make dev

# One-liner for production
deploy: setup prod

# Health check
health:
	@echo "🏥 Health Check..."
	@curl -s http://localhost:5000/health || echo "Backend: DOWN"
	@curl -s http://localhost:5173 || echo "Frontend: DOWN"
	@curl -s http://localhost:8080/actuator/health || echo "Stellio: DOWN"
