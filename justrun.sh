#!/bin/bash
# ============================================================================
# UIP - Urban Intelligence Platform
# Copyright (c) 2025 UIP Team. All rights reserved.
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# SPDX-License-Identifier: MIT
# ============================================================================
# File: justrun.sh
# Module: Just Run Script (Bash/Linux)
# Author: Nguyen Nhat Quang
# Created: 2025-12-08
# Version: 2.0.0
# License: MIT
#
# Description:
#   One command to rule them all: ./justrun.sh
#
# Prerequisites (auto-detected):
#   - Python 3.11+
#   - Node.js 18+
#   - Docker & Docker Compose
#   - Git
#
# Usage:
#   First time: ./justrun.sh dev (auto-installs everything)
# ============================================================================

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Helper functions
write_success() { echo -e "${GREEN}$1${NC}"; }
write_info() { echo -e "${CYAN}$1${NC}"; }
write_warn() { echo -e "${YELLOW}$1${NC}"; }
write_err() { echo -e "${RED}$1${NC}"; }

show_banner() {
    echo ""
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${CYAN}  UIP - Urban Intelligence Platform                            ${NC}"
    echo -e "${CYAN}  Multi-Agent Linked Open Data Pipeline                        ${NC}"
    echo -e "${CYAN}================================================================${NC}"
    echo ""
}

show_help() {
    show_banner
    write_info "Available commands:"
    echo "  ./justrun.sh setup   - Install all dependencies (first time)"
    echo "  ./justrun.sh dev     - Run everything in development mode"
    echo "  ./justrun.sh prod    - Run everything with Docker (production)"
    echo "  ./justrun.sh stop    - Stop all services"
    echo "  ./justrun.sh clean   - Clean and reset everything"
    echo "  ./justrun.sh test    - Run all tests"
    echo "  ./justrun.sh status  - Check status of all services"
    echo ""
    write_success "Quick Start (one command!):"
    echo "  ./justrun.sh dev     (auto-installs everything if needed)"
    echo ""
    write_info "Prerequisites (auto-detected):"
    echo "  - Python 3.11+     https://python.org"
    echo "  - Node.js 18+      https://nodejs.org"
    echo "  - Docker           https://docker.com"
    echo ""
}

install_dependencies() {
    show_banner
    write_info "SETUP: Installing all dependencies..."
    echo ""
    
    # ============================================================================
    # Step 1: Check Prerequisites
    # ============================================================================
    write_info "[1/6] Checking prerequisites..."
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        write_err "       ERROR: Python 3 not found!"
        write_err "       Install: sudo apt install python3 python3-pip python3-venv"
        exit 1
    fi
    PYTHON_VERSION=$(python3 --version 2>&1)
    write_success "       OK: $PYTHON_VERSION"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        write_err "       ERROR: Node.js not found!"
        write_err "       Install: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
        exit 1
    fi
    NODE_VERSION=$(node --version 2>&1)
    write_success "       OK: Node.js $NODE_VERSION"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        write_err "       ERROR: Docker not found!"
        write_err "       Install: https://docs.docker.com/engine/install/"
        exit 1
    fi
    
    # Check Docker is running
    if ! docker info &> /dev/null; then
        write_err "       ERROR: Docker is not running!"
        write_err "       Start Docker: sudo systemctl start docker"
        exit 1
    fi
    DOCKER_VERSION=$(docker --version 2>&1)
    write_success "       OK: $DOCKER_VERSION"
    
    # Check Git (optional)
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version 2>&1)
        write_success "       OK: $GIT_VERSION"
    else
        write_warn "       WARN: Git not found (optional)"
    fi
    
    echo ""
    
    # ============================================================================
    # Step 2: Create Required Directories
    # ============================================================================
    write_info "[2/6] Creating required directories..."
    
    DIRECTORIES=("logs" "data" "data/cache" "data/rdf" "reports" "test_output")
    for dir in "${DIRECTORIES[@]}"; do
        mkdir -p "$PROJECT_ROOT/$dir"
    done
    write_success "       OK: All directories ready"
    echo ""
    
    # ============================================================================
    # Step 3: Setup Environment Files
    # ============================================================================
    write_info "[3/6] Setting up environment files..."
    
    # Root .env
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        if [ -f "$PROJECT_ROOT/.env.example" ]; then
            cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
            write_success "       Created: .env from .env.example"
        else
            cat > "$PROJECT_ROOT/.env" << 'EOF'
STELLIO_URL=http://localhost:8080
NEO4J_PASSWORD=test12345
FUSEKI_PASSWORD=test_admin
EOF
            write_success "       Created: .env with defaults"
        fi
    else
        write_info "       EXISTS: .env"
    fi
    
    # Backend .env
    BACKEND_ENV="$PROJECT_ROOT/apps/traffic-web-app/backend/.env"
    BACKEND_ENV_EXAMPLE="$PROJECT_ROOT/apps/traffic-web-app/backend/.env.example"
    if [ ! -f "$BACKEND_ENV" ]; then
        if [ -f "$BACKEND_ENV_EXAMPLE" ]; then
            cp "$BACKEND_ENV_EXAMPLE" "$BACKEND_ENV"
            write_success "       Created: backend/.env"
        fi
    else
        write_info "       EXISTS: backend/.env"
    fi
    
    # Frontend .env
    FRONTEND_ENV="$PROJECT_ROOT/apps/traffic-web-app/frontend/.env"
    FRONTEND_ENV_EXAMPLE="$PROJECT_ROOT/apps/traffic-web-app/frontend/.env.example"
    if [ ! -f "$FRONTEND_ENV" ]; then
        if [ -f "$FRONTEND_ENV_EXAMPLE" ]; then
            cp "$FRONTEND_ENV_EXAMPLE" "$FRONTEND_ENV"
            write_success "       Created: frontend/.env"
        fi
    else
        write_info "       EXISTS: frontend/.env"
    fi
    echo ""
    
    # ============================================================================
    # Step 4: Setup Python Environment
    # ============================================================================
    write_info "[4/6] Setting up Python environment..."
    
    if [ ! -d "$PROJECT_ROOT/.venv" ]; then
        write_info "       Creating virtual environment..."
        python3 -m venv "$PROJECT_ROOT/.venv"
    fi
    
    write_info "       Activating virtual environment..."
    source "$PROJECT_ROOT/.venv/bin/activate"
    
    write_info "       Upgrading pip..."
    pip install --upgrade pip setuptools wheel -q 2>&1 > /dev/null
    
    write_info "       Installing Python dependencies..."
    pip install -r requirements/dev.txt -q 2>&1 > /dev/null
    
    # Ensure statsmodels is installed
    write_info "       Installing statsmodels for analytics..."
    pip install statsmodels scipy -q 2>&1 > /dev/null
    
    write_success "       OK: Python dependencies installed"
    echo ""
    
    # ============================================================================
    # Step 5: Install YOLOX and Download ML Models
    # ============================================================================
    write_info "[5/6] Installing YOLOX and downloading ML models..."
    
    # Install YOLOX from GitHub
    write_info "       Installing YOLOX from GitHub (Apache-2.0 license)..."
    if ! pip show yolox &> /dev/null; then
        pip install git+https://github.com/Megvii-BaseDetection/YOLOX.git -q 2>&1 > /dev/null
        write_success "       INSTALLED: YOLOX"
    else
        write_info "       EXISTS: YOLOX already installed"
    fi
    
    # Create models directory
    mkdir -p "$PROJECT_ROOT/assets/models"
    
    # Download YOLOX weights if not exists
    YOLOX_MODEL="$PROJECT_ROOT/assets/models/yolox_x.pth"
    if [ ! -f "$YOLOX_MODEL" ]; then
        write_info "       Downloading YOLOX-X weights (800MB)..."
        curl -L -o "$YOLOX_MODEL" \
            "https://github.com/Megvii-BaseDetection/YOLOX/releases/download/0.1.1rc0/yolox_x.pth" \
            --progress-bar
        write_success "       DOWNLOADED: yolox_x.pth"
    else
        write_info "       EXISTS: yolox_x.pth"
    fi
    
    # Download DETR model
    DETR_MODEL_PATH="$HOME/.cache/huggingface/hub/models--hilmantm--detr-traffic-accident-detection"
    if [ ! -d "$DETR_MODEL_PATH" ]; then
        write_info "       Downloading DETR accident detection model..."
        python3 -c "from transformers import DetrForObjectDetection; DetrForObjectDetection.from_pretrained('hilmantm/detr-traffic-accident-detection')" 2>&1 > /dev/null
        write_success "       DOWNLOADED: DETR model"
    else
        write_info "       EXISTS: DETR model cached"
    fi
    
    echo ""
    
    # ============================================================================
    # Step 6: Setup Node.js Dependencies
    # ============================================================================
    write_info "[6/6] Setting up Node.js dependencies..."
    
    cd "$PROJECT_ROOT/apps/traffic-web-app"
    
    write_info "       Installing backend packages..."
    cd backend
    npm install --silent 2>&1 > /dev/null
    cd ..
    
    write_info "       Installing frontend packages..."
    cd frontend
    npm install --silent 2>&1 > /dev/null
    cd "$PROJECT_ROOT"
    
    write_success "       OK: Node.js dependencies installed"
    echo ""
    
    write_success "============================================================"
    write_success "  SETUP COMPLETE!"
    write_success "============================================================"
    echo ""
    write_info "Next step: Run the project with:"
    echo "  ./justrun.sh dev"
    echo ""
}

start_dev() {
    show_banner
    
    # ============================================================================
    # Auto-setup if needed
    # ============================================================================
    NEEDS_SETUP=false
    
    if [ ! -d "$PROJECT_ROOT/.venv" ]; then
        write_warn "Python virtual environment not found..."
        NEEDS_SETUP=true
    fi
    
    if [ ! -d "$PROJECT_ROOT/apps/traffic-web-app/backend/node_modules" ]; then
        write_warn "Backend node_modules not found..."
        NEEDS_SETUP=true
    fi
    
    if [ ! -d "$PROJECT_ROOT/apps/traffic-web-app/frontend/node_modules" ]; then
        write_warn "Frontend node_modules not found..."
        NEEDS_SETUP=true
    fi
    
    if [ ! -f "$PROJECT_ROOT/assets/models/yolox_x.pth" ]; then
        write_warn "YOLOX model not found..."
        NEEDS_SETUP=true
    fi
    
    if [ "$NEEDS_SETUP" = true ]; then
        write_info "Running first-time setup..."
        echo ""
        install_dependencies
        echo ""
        write_info "Setup complete! Starting services..."
        echo ""
    fi
    
    # Activate Python venv
    source "$PROJECT_ROOT/.venv/bin/activate"
    
    # Create logs directory
    mkdir -p "$PROJECT_ROOT/logs"
    
    write_info "START: Starting all services in development mode..."
    echo ""
    
    # ============================================================================
    # Step 1: Start Docker Infrastructure
    # ============================================================================
    write_info "[1/5] Starting Docker infrastructure..."
    write_info "      Services: Neo4j, Fuseki, Redis, MongoDB, PostgreSQL, Kafka, Stellio"
    write_info "      First run may take 2-5 minutes (health checks)..."
    echo ""
    
    # Check Docker is running
    if ! docker info &> /dev/null; then
        write_err "ERROR: Docker is not running!"
        write_err "Start Docker: sudo systemctl start docker"
        exit 1
    fi
    
    # Start infrastructure services
    write_info "      [1a] Starting databases..."
    docker-compose up -d neo4j fuseki redis mongodb postgres kafka 2>&1 > /dev/null
    
    # Wait for databases to be healthy
    write_info "      [1b] Waiting for databases to be healthy..."
    MAX_WAIT=120
    WAITED=0
    
    while [ $WAITED -lt $MAX_WAIT ]; do
        HEALTHY_COUNT=$(docker-compose ps 2>/dev/null | grep -c "(healthy)" || echo "0")
        if [ "$HEALTHY_COUNT" -ge 4 ]; then
            break
        fi
        sleep 5
        WAITED=$((WAITED + 5))
        echo -n "."
    done
    echo ""
    write_success "      OK: Databases ready"
    
    # Start Stellio
    write_info "      [1c] Starting Stellio Context Broker..."
    docker-compose up -d stellio-api-gateway search-service subscription-service 2>&1 > /dev/null
    
    write_info "      [1d] Waiting for Stellio to be ready..."
    MAX_WAIT=90
    WAITED=0
    STELLIO_READY=false
    
    while [ "$STELLIO_READY" = false ] && [ $WAITED -lt $MAX_WAIT ]; do
        if curl -s http://localhost:8080/ngsi-ld/v1/entities &> /dev/null; then
            STELLIO_READY=true
        else
            sleep 5
            WAITED=$((WAITED + 5))
            echo -n "."
        fi
    done
    echo ""
    
    if [ "$STELLIO_READY" = true ]; then
        write_success "      OK: Stellio ready"
    else
        write_warn "      WARN: Stellio may not be ready yet"
    fi
    echo ""
    
    # ============================================================================
    # Step 2: Start Python Backend
    # ============================================================================
    write_info "[2/5] Starting Python services..."
    write_info "      - Citizen Ingestion API (FastAPI) on port 8001"
    write_info "      - Orchestrator Scheduler (APScheduler)"
    
    # Start Python backend in background
    gnome-terminal --title="Python Backend" -- bash -c "
        cd '$PROJECT_ROOT'
        source .venv/bin/activate
        echo '============================================'
        echo '  Python Backend - Citizen API + Orchestrator'
        echo '============================================'
        echo ''
        python main.py --run-orchestrator-now
        exec bash
    " 2>/dev/null || \
    xterm -T "Python Backend" -e "
        cd '$PROJECT_ROOT'
        source .venv/bin/activate
        python main.py --run-orchestrator-now
        bash
    " 2>/dev/null || \
    (
        cd "$PROJECT_ROOT"
        source .venv/bin/activate
        python main.py --run-orchestrator-now &
    )
    
    sleep 3
    write_success "      OK: Python services started"
    echo ""
    
    # ============================================================================
    # Step 3: Start TypeScript Backend
    # ============================================================================
    write_info "[3/5] Starting TypeScript backend..."
    write_info "      - Express.js API on port 5000"
    write_info "      - WebSocket server on port 5000"
    
    gnome-terminal --title="TypeScript Backend" -- bash -c "
        cd '$PROJECT_ROOT/apps/traffic-web-app/backend'
        echo '============================================'
        echo '  TypeScript Backend - Express.js API'
        echo '============================================'
        echo ''
        npm run dev
        exec bash
    " 2>/dev/null || \
    xterm -T "TypeScript Backend" -e "
        cd '$PROJECT_ROOT/apps/traffic-web-app/backend'
        npm run dev
        bash
    " 2>/dev/null || \
    (
        cd "$PROJECT_ROOT/apps/traffic-web-app/backend"
        npm run dev &
    )
    
    sleep 3
    write_success "      OK: TypeScript backend started"
    echo ""
    
    # ============================================================================
    # Step 4: Start React Frontend
    # ============================================================================
    write_info "[4/5] Starting React frontend..."
    write_info "      - Vite dev server on port 5173"
    
    gnome-terminal --title="React Frontend" -- bash -c "
        cd '$PROJECT_ROOT/apps/traffic-web-app/frontend'
        echo '============================================'
        echo '  React Frontend - Vite Dev Server'
        echo '============================================'
        echo ''
        npm run dev
        exec bash
    " 2>/dev/null || \
    xterm -T "React Frontend" -e "
        cd '$PROJECT_ROOT/apps/traffic-web-app/frontend'
        npm run dev
        bash
    " 2>/dev/null || \
    (
        cd "$PROJECT_ROOT/apps/traffic-web-app/frontend"
        npm run dev &
    )
    
    sleep 3
    write_success "      OK: React frontend started"
    echo ""
    
    # ============================================================================
    # Step 5: Start CV and Sync Pipeline
    # ============================================================================
    write_info "[5/5] Starting Real-time Data Generator Pipeline..."
    write_info "      - Live Camera → YOLOX → Neo4j → Analytics"
    write_info "      - Runs: 99999, Delay: 60s"
    
    gnome-terminal --title="CV & Sync Pipeline" -- bash -c "
        cd '$PROJECT_ROOT'
        source .venv/bin/activate
        echo '============================================'
        echo '  CV & Sync Pipeline - Data Generator'
        echo '============================================'
        echo ''
        python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60
        exec bash
    " 2>/dev/null || \
    xterm -T "CV Pipeline" -e "
        cd '$PROJECT_ROOT'
        source .venv/bin/activate
        python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60
        bash
    " 2>/dev/null || \
    (
        cd "$PROJECT_ROOT"
        source .venv/bin/activate
        python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60 &
    )
    
    sleep 2
    write_success "      OK: CV & Sync pipeline started"
    
    # ============================================================================
    # Success Summary
    # ============================================================================
    echo ""
    write_success "============================================================"
    write_success "  ALL SERVICES STARTED SUCCESSFULLY!"
    write_success "============================================================"
    echo ""
    write_info "ACCESS POINTS:"
    echo ""
    echo -e "  ${WHITE}Application:${NC}"
    echo -e "    Frontend (React):      ${CYAN}http://localhost:5173${NC}"
    echo -e "    Backend (Express):     ${CYAN}http://localhost:5000${NC}"
    echo -e "    Citizen API (FastAPI): ${CYAN}http://localhost:8001/docs${NC}"
    echo ""
    echo -e "  ${WHITE}Infrastructure:${NC}"
    echo -e "    Stellio Context Broker:${YELLOW} http://localhost:8080${NC}"
    echo -e "    Neo4j Browser:         ${YELLOW} http://localhost:7474${NC}"
    echo -e "                            (neo4j / test12345)"
    echo -e "    Apache Jena Fuseki:    ${YELLOW} http://localhost:3030${NC}"
    echo -e "                            (admin / test_admin)"
    echo ""
    write_warn "TO STOP ALL SERVICES:"
    echo "  ./justrun.sh stop"
    echo ""
}

start_prod() {
    show_banner
    write_info "PROD: Starting FULL production environment..."
    echo ""
    
    # Similar to dev but with docker-compose for all services
    # Check Docker
    if ! docker info &> /dev/null; then
        write_err "ERROR: Docker is not running!"
        exit 1
    fi
    
    write_info "[1/3] Building and starting all services..."
    docker-compose up -d --build
    
    write_info "[2/3] Waiting for services to be healthy..."
    sleep 30
    
    write_info "[3/3] Starting CV pipeline..."
    
    # Activate venv and run pipeline
    if [ -d "$PROJECT_ROOT/.venv" ]; then
        source "$PROJECT_ROOT/.venv/bin/activate"
    fi
    
    gnome-terminal --title="CV Pipeline (Prod)" -- bash -c "
        cd '$PROJECT_ROOT'
        source .venv/bin/activate 2>/dev/null
        python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60
        exec bash
    " 2>/dev/null || \
    (
        python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60 &
    )
    
    echo ""
    write_success "============================================================"
    write_success "  PRODUCTION SERVICES STARTED!"
    write_success "============================================================"
    echo ""
    echo -e "  Frontend:  ${CYAN}http://localhost:3000${NC}"
    echo -e "  Backend:   ${CYAN}http://localhost:3001${NC}"
    echo -e "  API Docs:  ${CYAN}http://localhost:8001/docs${NC}"
    echo ""
}

stop_services() {
    show_banner
    write_info "STOP: Stopping all services..."
    echo ""
    
    # Stop Docker containers
    write_info "[1/3] Stopping Docker containers..."
    docker-compose down 2>&1 > /dev/null || true
    write_success "      OK: Docker containers stopped"
    
    # Kill Node.js processes
    write_info "[2/3] Stopping Node.js processes..."
    pkill -f "node.*traffic-web-app" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    write_success "      OK: Node.js processes stopped"
    
    # Kill Python processes
    write_info "[3/3] Stopping Python processes..."
    pkill -f "python.*main.py" 2>/dev/null || true
    pkill -f "python.*run_cv_and_sync" 2>/dev/null || true
    pkill -f "uvicorn" 2>/dev/null || true
    write_success "      OK: Python processes stopped"
    
    echo ""
    write_success "All services stopped!"
    echo ""
}

clean_all() {
    show_banner
    write_warn "CLEAN: This will remove all data, containers, and dependencies!"
    read -p "Are you sure? (y/N): " confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        write_info "Cleaning..."
        
        # Stop services
        stop_services
        
        # Remove Docker volumes
        write_info "Removing Docker volumes..."
        docker-compose down -v 2>&1 > /dev/null || true
        docker system prune -f 2>&1 > /dev/null || true
        
        # Remove Python venv
        write_info "Removing Python virtual environment..."
        rm -rf "$PROJECT_ROOT/.venv"
        
        # Remove node_modules
        write_info "Removing node_modules..."
        rm -rf "$PROJECT_ROOT/apps/traffic-web-app/backend/node_modules"
        rm -rf "$PROJECT_ROOT/apps/traffic-web-app/frontend/node_modules"
        
        # Remove logs
        write_info "Removing logs..."
        rm -rf "$PROJECT_ROOT/logs"/*
        
        write_success "Clean complete!"
    else
        write_info "Cancelled."
    fi
    echo ""
}

run_tests() {
    show_banner
    write_info "TEST: Running all tests..."
    echo ""
    
    # Activate venv
    if [ -d "$PROJECT_ROOT/.venv" ]; then
        source "$PROJECT_ROOT/.venv/bin/activate"
    fi
    
    # Run Python tests
    write_info "Running Python tests..."
    pytest tests/ -v --tb=short 2>&1 || true
    
    # Run TypeScript tests
    write_info "Running TypeScript tests..."
    cd "$PROJECT_ROOT/apps/traffic-web-app/backend"
    npm test 2>&1 || true
    
    cd "$PROJECT_ROOT"
    echo ""
    write_success "Tests complete!"
    echo ""
}

show_status() {
    show_banner
    write_info "STATUS: Checking all services..."
    echo ""
    
    # Docker containers
    write_info "Docker Containers:"
    docker-compose ps 2>/dev/null || echo "  Docker Compose not running"
    echo ""
    
    # Check ports
    write_info "Service Ports:"
    
    check_port() {
        if nc -z localhost "$1" 2>/dev/null; then
            echo -e "  Port $1 ($2): ${GREEN}RUNNING${NC}"
        else
            echo -e "  Port $1 ($2): ${RED}STOPPED${NC}"
        fi
    }
    
    check_port 5173 "Frontend"
    check_port 5000 "Backend"
    check_port 8001 "Citizen API"
    check_port 8080 "Stellio"
    check_port 7474 "Neo4j"
    check_port 3030 "Fuseki"
    check_port 27017 "MongoDB"
    check_port 6379 "Redis"
    
    echo ""
}

# ============================================================================
# Main Command Router
# ============================================================================

case "${1:-help}" in
    setup)
        install_dependencies
        ;;
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop_services
        ;;
    clean)
        clean_all
        ;;
    test)
        run_tests
        ;;
    status)
        show_status
        ;;
    help|*)
        show_help
        ;;
esac
