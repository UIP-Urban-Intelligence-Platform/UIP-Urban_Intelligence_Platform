# ============================================================================
# UIP - Urban Intelligence Platform
# Copyright (c) 2025 UIP Team. All rights reserved.
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# SPDX-License-Identifier: MIT
# ============================================================================
# File: justrun.ps1
# Module: Just Run Script (PowerShell)
# Author: Nguyen Nhat Quang
# Created: 2025-11-27
# Version: 2.0.0
# License: MIT
#
# Description:
#   One command to rule them all: .\justrun.ps1
#
# Prerequisites (auto-detected):
#   - Python 3.11+
#   - Node.js 18+
#   - Docker Desktop
#   - Git
#
# Usage:
#   First time: .\justrun.ps1 dev (auto-installs everything)
# ============================================================================

param(
    [Parameter(Position = 0)]
    [ValidateSet('setup', 'dev', 'prod', 'stop', 'clean', 'test', 'status', 'help', '')]
    [string]$Command = 'help'
)

$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot

# Colors
function WriteSuccess { param($msg) Write-Host $msg -ForegroundColor Green }
function WriteInfo { param($msg) Write-Host $msg -ForegroundColor Cyan }
function WriteWarn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function WriteErr { param($msg) Write-Host $msg -ForegroundColor Red }

function Show-Banner {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  UIP - Urban Intelligence Platform                            " -ForegroundColor Cyan
    Write-Host "  Multi-Agent Linked Open Data Pipeline                        " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Show-Banner
    WriteInfo "Available commands:"
    Write-Host "  .\justrun.ps1 setup   - Install all dependencies (first time)"
    Write-Host "  .\justrun.ps1 dev     - Run everything in development mode"
    Write-Host "  .\justrun.ps1 prod    - Run everything with Docker (production)"
    Write-Host "  .\justrun.ps1 stop    - Stop all services"
    Write-Host "  .\justrun.ps1 clean   - Clean and reset everything"
    Write-Host "  .\justrun.ps1 test    - Run all tests"
    Write-Host "  .\justrun.ps1 status  - Check status of all services"
    Write-Host ""
    WriteSuccess "Quick Start (one command!):"
    Write-Host "  .\justrun.ps1 dev     (auto-installs everything if needed)"
    Write-Host ""
    WriteInfo "Prerequisites (auto-detected):"
    Write-Host "  - Python 3.11+     https://python.org"
    Write-Host "  - Node.js 18+      https://nodejs.org"
    Write-Host "  - Docker Desktop   https://docker.com/products/docker-desktop"
    Write-Host ""
}

function Install-Dependencies {
    Show-Banner
    WriteInfo "SETUP: Installing all dependencies..."
    Write-Host ""
    
    # ============================================================================
    # Step 1: Check Prerequisites
    # ============================================================================
    WriteInfo "[1/6] Checking prerequisites..."
    
    # Check Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        WriteErr "ERROR: Python not found!"
        WriteInfo "       Download from: https://python.org/downloads"
        WriteInfo "       Required: Python 3.11+"
        exit 1
    }
    $pythonVersion = python --version 2>&1
    WriteSuccess "       OK: $pythonVersion"
    
    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        WriteErr "ERROR: Node.js not found!"
        WriteInfo "       Download from: https://nodejs.org"
        WriteInfo "       Required: Node.js 18+"
        exit 1
    }
    $nodeVersion = node --version 2>&1
    WriteSuccess "       OK: Node.js $nodeVersion"
    
    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        WriteErr "ERROR: Docker not found!"
        WriteInfo "       Download from: https://docker.com/products/docker-desktop"
        exit 1
    }
    
    # Check Docker is running
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        WriteErr "ERROR: Docker is not running!"
        WriteInfo "       Please start Docker Desktop first."
        exit 1
    }
    $dockerVersion = docker --version 2>&1
    WriteSuccess "       OK: $dockerVersion"
    
    # Check Git (optional but recommended)
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $gitVersion = git --version 2>&1
        WriteSuccess "       OK: $gitVersion"
    }
    else {
        WriteWarn "       WARN: Git not found (optional)"
    }
    
    Write-Host ""
    
    # ============================================================================
    # Step 2: Create Required Directories
    # ============================================================================
    WriteInfo "[2/6] Creating required directories..."
    
    $directories = @("logs", "data", "data/cache", "data/rdf", "reports", "test_output")
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            WriteSuccess "       Created: $dir/"
        }
    }
    WriteSuccess "       OK: All directories ready"
    Write-Host ""
    
    # ============================================================================
    # Step 3: Setup Environment Files
    # ============================================================================
    WriteInfo "[3/6] Setting up environment files..."
    
    # Root .env
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            WriteSuccess "       Created: .env (from .env.example)"
        }
        else {
            WriteWarn "       WARN: .env.example not found, skipping"
        }
    }
    else {
        WriteSuccess "       OK: .env already exists"
    }
    
    # Backend .env
    $backendEnv = "apps\traffic-web-app\backend\.env"
    $backendEnvExample = "apps\traffic-web-app\backend\.env.example"
    if (-not (Test-Path $backendEnv)) {
        if (Test-Path $backendEnvExample) {
            Copy-Item $backendEnvExample $backendEnv
            WriteSuccess "       Created: backend/.env"
        }
    }
    else {
        WriteSuccess "       OK: backend/.env already exists"
    }
    
    # Frontend .env
    $frontendEnv = "apps\traffic-web-app\frontend\.env"
    $frontendEnvExample = "apps\traffic-web-app\frontend\.env.example"
    if (-not (Test-Path $frontendEnv)) {
        if (Test-Path $frontendEnvExample) {
            Copy-Item $frontendEnvExample $frontendEnv
            WriteSuccess "       Created: frontend/.env"
        }
    }
    else {
        WriteSuccess "       OK: frontend/.env already exists"
    }
    Write-Host ""
    
    # ============================================================================
    # Step 4: Setup Python Environment
    # ============================================================================
    WriteInfo "[4/6] Setting up Python environment..."
    
    if (-not (Test-Path ".venv")) {
        WriteInfo "       Creating virtual environment..."
        python -m venv .venv
    }
    
    WriteInfo "       Activating virtual environment..."
    & .\.venv\Scripts\Activate.ps1
    
    WriteInfo "       Upgrading pip..."
    pip install --upgrade pip setuptools wheel -q 2>&1 | Out-Null
    
    WriteInfo "       Installing Python dependencies..."
    pip install -r requirements/dev.txt -q 2>&1 | Out-Null
    
    # Ensure statsmodels is installed (required by analytics agents)
    WriteInfo "       Installing statsmodels for analytics..."
    pip install statsmodels scipy -q 2>&1 | Out-Null
    
    WriteSuccess "       OK: Python dependencies installed"
    Write-Host ""
    
    # ============================================================================
    # Step 5: Install YOLOX and Download ML Models
    # ============================================================================
    WriteInfo "[5/8] Installing YOLOX and downloading ML models..."
    
    # Install YOLOX from GitHub (not available on PyPI)
    WriteInfo "       Installing YOLOX from GitHub (Apache-2.0 license)..."
    $yoloxInstalled = pip show yolox 2>&1
    if ($LASTEXITCODE -ne 0) {
        pip install git+https://github.com/Megvii-BaseDetection/YOLOX.git -q 2>&1 | Out-Null
        WriteSuccess "       OK: YOLOX installed"
    }
    else {
        WriteSuccess "       OK: YOLOX already installed"
    }
    
    # Create models directory if not exists
    if (-not (Test-Path "assets\models")) {
        New-Item -ItemType Directory -Path "assets\models" -Force | Out-Null
        WriteSuccess "       Created: assets/models/"
    }
    
    # Download YOLOX weights if not exists
    if (-not (Test-Path "assets\models\yolox_x.pth")) {
        WriteInfo "       Downloading YOLOX-X weights (794MB)..."
        WriteInfo "       This may take a few minutes..."
        python scripts/download_yolox_weights.py --model yolox-x 2>&1 | Out-Null
        if (Test-Path "assets\models\yolox_x.pth") {
            WriteSuccess "       OK: YOLOX-X weights downloaded"
        }
        else {
            WriteWarn "       WARN: YOLOX weights download may have failed"
            WriteInfo "       Run manually: python scripts/download_yolox_weights.py --model yolox-x"
        }
    }
    else {
        WriteSuccess "       OK: YOLOX-X weights already exist"
    }
    
    # Download DETR accident detection model if not exists
    $detrModelPath = "$env:USERPROFILE\.cache\huggingface\hub\models--hilmantm--detr-traffic-accident-detection"
    if (-not (Test-Path $detrModelPath)) {
        WriteInfo "       Downloading DETR accident detection model..."
        python scripts/download_accident_model.py 2>&1 | Out-Null
        WriteSuccess "       OK: DETR model downloaded"
    }
    else {
        WriteSuccess "       OK: DETR model already cached"
    }
    
    Write-Host ""
    
    # ============================================================================
    # Step 6: Setup Node.js Dependencies
    # ============================================================================
    WriteInfo "[6/8] Setting up Node.js dependencies..."
    
    Push-Location "apps\traffic-web-app"
    
    WriteInfo "       Installing backend packages..."
    Push-Location "backend"
    npm install --silent 2>&1 | Out-Null
    Pop-Location
    
    WriteInfo "       Installing frontend packages..."
    Push-Location "frontend"
    npm install --silent 2>&1 | Out-Null
    Pop-Location
    
    Pop-Location
    
    WriteSuccess "       OK: Node.js dependencies installed"
    Write-Host ""
    
    # ============================================================================
    # Step 7: Pull Docker Images
    # ============================================================================
    WriteInfo "[7/8] Pulling Docker images (this may take a few minutes)..."
    WriteInfo "       Images: Neo4j, Fuseki, MongoDB, Redis, PostgreSQL, Kafka, Stellio"
    
    $images = @(
        "neo4j:5.12.0",
        "stain/jena-fuseki:latest",
        "redis:7-alpine",
        "mongo:7.0",
        "timescale/timescaledb-ha:pg15",
        "apache/kafka:latest",
        "stellio/stellio-api-gateway:2.26.1",
        "stellio/stellio-search-service:2.26.1",
        "stellio/stellio-subscription-service:2.26.1"
    )
    
    foreach ($image in $images) {
        $shortName = $image.Split("/")[-1].Split(":")[0]
        Write-Host -NoNewline "       Pulling $shortName..."
        docker pull $image -q 2>&1 | Out-Null
        WriteSuccess " OK"
    }
    
    Write-Host ""
    
    # ============================================================================
    # Step 8: Verify Installation
    # ============================================================================
    WriteInfo "[8/8] Verifying installation..."
    
    # Verify YOLOX
    $yoloxCheck = python -c "import yolox; print('OK')" 2>&1
    if ($yoloxCheck -eq "OK") {
        WriteSuccess "       OK: YOLOX module verified"
    }
    else {
        WriteWarn "       WARN: YOLOX module not found - CV will use mock detector"
    }
    
    # Verify YOLOX weights
    if (Test-Path "assets\models\yolox_x.pth") {
        $weightsSize = (Get-Item "assets\models\yolox_x.pth").Length / 1MB
        WriteSuccess "       OK: YOLOX weights verified ($([math]::Round($weightsSize, 1)) MB)"
    }
    else {
        WriteWarn "       WARN: YOLOX weights not found - CV will use mock detector"
    }
    
    # Verify transformers for DETR
    $transformersCheck = python -c "import transformers; print('OK')" 2>&1
    if ($transformersCheck -eq "OK") {
        WriteSuccess "       OK: Transformers (DETR) verified"
    }
    else {
        WriteWarn "       WARN: Transformers not found - accident detection disabled"
    }
    
    Write-Host ""
    WriteSuccess "============================================================"
    WriteSuccess "  SETUP COMPLETE!"
    WriteSuccess "============================================================"
    Write-Host ""
    WriteInfo "Next step: Run the project with:"
    Write-Host "  .\justrun.ps1 dev" -ForegroundColor White
    Write-Host ""
}

function Start-Dev {
    Show-Banner
    
    # ============================================================================
    # Auto-setup if needed
    # ============================================================================
    $needsSetup = $false
    
    if (-not (Test-Path ".venv")) {
        WriteWarn "Python virtual environment not found."
        $needsSetup = $true
    }
    
    if (-not (Test-Path "apps\traffic-web-app\backend\node_modules")) {
        WriteWarn "Backend node_modules not found."
        $needsSetup = $true
    }
    
    if (-not (Test-Path "apps\traffic-web-app\frontend\node_modules")) {
        WriteWarn "Frontend node_modules not found."
        $needsSetup = $true
    }
    
    # Check for ML models
    if (-not (Test-Path "assets\models\yolox_x.pth")) {
        WriteWarn "YOLOX model weights not found."
        $needsSetup = $true
    }
    
    if ($needsSetup) {
        WriteWarn ""
        WriteWarn "First time setup detected. Running installation..."
        WriteWarn ""
        Install-Dependencies
        Write-Host ""
    }
    else {
        # Activate venv and ensure all ML dependencies are installed
        & .\.venv\Scripts\Activate.ps1
        
        # Ensure YOLOX is installed from GitHub
        $yoloxCheck = pip show yolox 2>&1
        if ($LASTEXITCODE -ne 0) {
            WriteInfo "Installing YOLOX from GitHub..."
            pip install git+https://github.com/Megvii-BaseDetection/YOLOX.git -q 2>&1 | Out-Null
            WriteSuccess "YOLOX installed"
        }
        
        # Ensure statsmodels is installed (for analytics agents)
        $statsCheck = pip show statsmodels 2>&1
        if ($LASTEXITCODE -ne 0) {
            WriteInfo "Installing statsmodels..."
            pip install statsmodels -q 2>&1 | Out-Null
            WriteSuccess "statsmodels installed"
        }
        
        # Ensure timm is installed (required for DETR accident detection)
        $timmCheck = pip show timm 2>&1
        if ($LASTEXITCODE -ne 0) {
            WriteInfo "Installing timm (required for DETR)..."
            pip install timm -q 2>&1 | Out-Null
            WriteSuccess "timm installed"
        }
        
        # Ensure YOLOX weights are downloaded
        if (-not (Test-Path "assets\models\yolox_x.pth")) {
            WriteInfo "Downloading YOLOX-X weights (794MB)..."
            python scripts/download_yolox_weights.py --model yolox-x 2>&1 | Out-Null
            if (Test-Path "assets\models\yolox_x.pth") {
                WriteSuccess "YOLOX-X weights downloaded"
            }
        }
        
        # Ensure DETR accident detection model is cached
        $detrModelPath = "$env:USERPROFILE\.cache\huggingface\hub\models--hilmantm--detr-traffic-accident-detection"
        if (-not (Test-Path $detrModelPath)) {
            WriteInfo "Downloading DETR accident detection model..."
            python scripts/download_accident_model.py 2>&1 | Out-Null
            WriteSuccess "DETR model downloaded"
        }
    }
    
    # Create logs directory if missing
    if (-not (Test-Path "logs")) {
        New-Item -ItemType Directory -Path "logs" -Force | Out-Null
    }
    
    WriteInfo "START: Starting all services in development mode..."
    Write-Host ""
    
    # ============================================================================
    # Step 1: Start Docker Infrastructure
    # ============================================================================
    WriteInfo "[1/4] Starting Docker infrastructure..."
    WriteInfo "      Services: Neo4j, Fuseki, Redis, MongoDB, PostgreSQL, Kafka, Stellio"
    WriteInfo "      First run may take 2-5 minutes (health checks)..."
    Write-Host ""
    
    # Check Docker is running
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        WriteErr "ERROR: Docker is not running!"
        WriteInfo "       Please start Docker Desktop first."
        exit 1
    }
    
    # Start infrastructure services first (databases)
    WriteInfo "      [1a] Starting databases..."
    docker-compose up -d neo4j fuseki redis mongodb postgres kafka 2>&1 | Out-Null
    
    # Wait for databases to be healthy
    WriteInfo "      [1b] Waiting for databases to be healthy..."
    $maxWait = 120  # 2 minutes max
    $waited = 0
    $healthyServices = @()
    $requiredServices = @("neo4j", "fuseki", "redis", "mongodb", "postgres", "kafka")
    
    while ($waited -lt $maxWait) {
        $allHealthy = $true
        foreach ($service in $requiredServices) {
            if ($healthyServices -notcontains $service) {
                $health = docker inspect --format='{{.State.Health.Status}}' "test-$service" 2>&1
                if ($health -eq "healthy") {
                    $healthyServices += $service
                    WriteSuccess "           OK: $service is healthy"
                }
                else {
                    $allHealthy = $false
                }
            }
        }
        
        if ($allHealthy -or $healthyServices.Count -eq $requiredServices.Count) {
            break
        }
        
        Write-Host -NoNewline "."
        Start-Sleep -Seconds 2
        $waited += 2
    }
    Write-Host ""
    
    # Start Stellio services
    WriteInfo "      [1c] Starting Stellio Context Broker..."
    docker-compose up -d stellio-api-gateway search-service subscription-service 2>&1 | Out-Null
    
    # Wait for Stellio
    WriteInfo "      [1d] Waiting for Stellio to be ready..."
    $stellioReady = $false
    $maxWait = 90
    $waited = 0
    
    while (-not $stellioReady -and $waited -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $stellioReady = $true
                WriteSuccess "           OK: Stellio is ready"
            }
        }
        catch {
            Write-Host -NoNewline "."
            Start-Sleep -Seconds 3
            $waited += 3
        }
    }
    
    if (-not $stellioReady) {
        WriteWarn "           WARN: Stellio may not be fully ready yet"
    }
    Write-Host ""
    
    # ============================================================================
    # Step 2: Start Python Backend (Citizen API + Orchestrator)
    # ============================================================================
    WriteInfo "[2/4] Starting Python services..."
    WriteInfo "      - Citizen Ingestion API (FastAPI) on port 8001"
    WriteInfo "      - Orchestrator Scheduler (APScheduler)"
    
    $pythonCmd = @"
Set-Location '$ProjectRoot'
.\`.venv\Scripts\Activate.ps1
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  Python Backend - Citizen API + Orchestrator' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''
python main.py --run-orchestrator-now
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $pythonCmd
    Start-Sleep -Seconds 5
    WriteSuccess "      OK: Python services started"
    Write-Host ""
    
    # ============================================================================
    # Step 3: Start TypeScript Backend
    # ============================================================================
    WriteInfo "[3/4] Starting TypeScript backend..."
    WriteInfo "      - Express.js API on port 5000"
    WriteInfo "      - WebSocket server on port 5000 (same as API)"
    WriteInfo "      - 3 AI Agents (TrafficMaestro, GraphInvestigator, EcoTwin)"
    
    $backendCmd = @"
Set-Location '$ProjectRoot\apps\traffic-web-app\backend'
Write-Host '============================================' -ForegroundColor Green
Write-Host '  TypeScript Backend - Express.js API' -ForegroundColor Green
Write-Host '============================================' -ForegroundColor Green
Write-Host ''
npm run dev
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
    Start-Sleep -Seconds 3
    WriteSuccess "      OK: TypeScript backend started"
    Write-Host ""
    
    # ============================================================================
    # Step 4: Start React Frontend
    # ============================================================================
    WriteInfo "[4/4] Starting React frontend..."
    WriteInfo "      - Vite dev server on port 5173"
    WriteInfo "      - Hot Module Replacement enabled"
    
    $frontendCmd = @"
Set-Location '$ProjectRoot\apps\traffic-web-app\frontend'
Write-Host '============================================' -ForegroundColor Magenta
Write-Host '  React Frontend - Vite Dev Server' -ForegroundColor Magenta
Write-Host '============================================' -ForegroundColor Magenta
Write-Host ''
npm run dev
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    Start-Sleep -Seconds 3
    WriteSuccess "      OK: React frontend started"
    
    # ============================================================================
    # Step 5: Run CV and Sync Pipeline (Real-time Data Generator)
    # ============================================================================
    Write-Host ""
    WriteInfo "[5/5] Starting Real-time Data Generator Pipeline..."
    WriteInfo "      - Live Camera → YOLOX → Neo4j → Analytics"
    WriteInfo "      - Runs: 99999, Delay: 60s, Max Cameras: ALL"
    WriteInfo "      - This will populate databases with real traffic data"
    
    $cvSyncCmd = @"
Set-Location '$ProjectRoot'
.\`.venv\Scripts\Activate.ps1
Write-Host '============================================' -ForegroundColor Yellow
Write-Host '  CV & Sync Pipeline - Data Generator' -ForegroundColor Yellow
Write-Host '============================================' -ForegroundColor Yellow
Write-Host ''
python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60
Write-Host ''
Write-Host 'Pipeline completed! Press any key to close...' -ForegroundColor Green
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cvSyncCmd
    Start-Sleep -Seconds 2
    WriteSuccess "      OK: CV & Sync pipeline started"
    
    # ============================================================================
    # Success Summary
    # ============================================================================
    Write-Host ""
    WriteSuccess "============================================================"
    WriteSuccess "  ALL SERVICES STARTED SUCCESSFULLY!"
    WriteSuccess "============================================================"
    Write-Host ""
    WriteInfo "ACCESS POINTS:"
    Write-Host ""
    Write-Host "  Application:" -ForegroundColor White
    Write-Host "    Frontend (React):      " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
    Write-Host "    Backend (Express):     " -NoNewline; Write-Host "http://localhost:5000" -ForegroundColor Cyan
    Write-Host "    Citizen API (FastAPI): " -NoNewline; Write-Host "http://localhost:8001/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Infrastructure:" -ForegroundColor White
    Write-Host "    Stellio Context Broker:" -NoNewline; Write-Host " http://localhost:8080" -ForegroundColor Yellow
    Write-Host "    Neo4j Browser:         " -NoNewline; Write-Host " http://localhost:7474" -ForegroundColor Yellow
    Write-Host "                           " -NoNewline; Write-Host " (neo4j / test12345)" -ForegroundColor DarkGray
    Write-Host "    Apache Jena Fuseki:    " -NoNewline; Write-Host " http://localhost:3030" -ForegroundColor Yellow
    Write-Host "                           " -NoNewline; Write-Host " (admin / test_admin)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Data Pipeline:" -ForegroundColor White
    Write-Host "    CV & Sync Pipeline:    " -NoNewline; Write-Host "Running in separate window" -ForegroundColor Magenta
    Write-Host "                           " -NoNewline; Write-Host " (99999 runs, 60s delay, ALL cameras)" -ForegroundColor DarkGray
    Write-Host ""
    WriteWarn "TO STOP ALL SERVICES:"
    Write-Host "  .\justrun.ps1 stop" -ForegroundColor White
    Write-Host ""
    WriteInfo "Or close the PowerShell windows manually"
    Write-Host ""
}

function Start-Prod {
    Show-Banner
    WriteInfo "PROD: Starting FULL production environment..."
    WriteInfo "      This is a 100% automated deployment - sit back and relax!"
    Write-Host ""
    
    # ============================================================================
    # Auto-setup: Always run to ensure everything is ready
    # ============================================================================
    WriteInfo "[0/7] Preparing environment..."
    
    # Create ALL required directories
    $directories = @(
        "logs", 
        "data", 
        "data/cache", 
        "data/rdf", 
        "reports", 
        "test_output",
        "assets/models",
        "apps/traffic-web-app/backend/logs"
    )
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            WriteSuccess "       Created: $dir/"
        }
    }
    
    # Setup Python venv if not exists (needed for downloading models)
    if (-not (Test-Path ".venv")) {
        WriteInfo "       Creating Python virtual environment..."
        python -m venv .venv
    }
    
    # Activate Python venv
    & .\.venv\Scripts\Activate.ps1
    
    # Install base requirements first (includes scipy, statsmodels)
    WriteInfo "       Installing Python dependencies..."
    pip install -r requirements/base.txt -q 2>&1 | Out-Null
    
    # Install YOLOX if not installed
    $yoloxCheck = pip show yolox 2>&1
    if ($LASTEXITCODE -ne 0) {
        WriteInfo "       Installing YOLOX from GitHub..."
        pip install git+https://github.com/Megvii-BaseDetection/YOLOX.git -q 2>&1 | Out-Null
        WriteSuccess "       OK: YOLOX installed"
    }
    else {
        WriteSuccess "       OK: YOLOX already installed"
    }
    
    # Ensure statsmodels is installed (for analytics agents)
    $statsCheck = pip show statsmodels 2>&1
    if ($LASTEXITCODE -ne 0) {
        WriteInfo "       Installing statsmodels..."
        pip install statsmodels -q 2>&1 | Out-Null
        WriteSuccess "       OK: statsmodels installed"
    }
    
    # Ensure timm is installed (required for DETR accident detection)
    $timmCheck = pip show timm 2>&1
    if ($LASTEXITCODE -ne 0) {
        WriteInfo "       Installing timm (required for DETR)..."
        pip install timm -q 2>&1 | Out-Null
        WriteSuccess "       OK: timm installed"
    }
    
    # Download YOLOX weights if not exists
    if (-not (Test-Path "assets\models\yolox_x.pth")) {
        WriteInfo "       Downloading YOLOX-X weights (794MB)..."
        WriteInfo "       This may take a few minutes..."
        python scripts/download_yolox_weights.py --model yolox-x 2>&1 | Out-Null
        if (Test-Path "assets\models\yolox_x.pth") {
            WriteSuccess "       OK: YOLOX-X weights downloaded"
        }
        else {
            WriteWarn "       WARN: YOLOX weights download failed - CV will use mock detector"
        }
    }
    else {
        WriteSuccess "       OK: YOLOX-X weights already exist"
    }
    
    # Download DETR model if not cached
    $detrModelPath = "$env:USERPROFILE\.cache\huggingface\hub\models--hilmantm--detr-traffic-accident-detection"
    if (-not (Test-Path $detrModelPath)) {
        WriteInfo "       Downloading DETR accident detection model..."
        python scripts/download_accident_model.py 2>&1 | Out-Null
        WriteSuccess "       OK: DETR model downloaded"
    }
    else {
        WriteSuccess "       OK: DETR model already cached"
    }
    
    # Setup .env files (always check, even if already exists)
    if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
        Copy-Item ".env.example" ".env"
        WriteSuccess "       Created: .env"
    }
    
    $backendEnv = "apps\traffic-web-app\backend\.env"
    if (-not (Test-Path $backendEnv)) {
        if (Test-Path "apps\traffic-web-app\backend\.env.example") {
            Copy-Item "apps\traffic-web-app\backend\.env.example" $backendEnv
            WriteSuccess "       Created: backend/.env"
        }
        else {
            # Create production .env if no example exists
            @"
PORT=3001
NODE_ENV=production
STELLIO_URL=http://stellio-api-gateway:8080
STELLIO_NGSI_LD_PATH=/ngsi-ld/v1
FUSEKI_URL=http://fuseki:3030
FUSEKI_DATASET=traffic-cameras
FUSEKI_USER=admin
FUSEKI_PASSWORD=test_admin
NEO4J_URL=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=test12345
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=stellio
POSTGRES_PASSWORD=stellio_test
POSTGRES_DB=stellio_search
CORS_ORIGIN=http://localhost:3000
DATA_UPDATE_INTERVAL=30000
"@ | Out-File -FilePath $backendEnv -Encoding UTF8
            WriteSuccess "       Created: backend/.env (production)"
        }
    }
    
    $frontendEnv = "apps\traffic-web-app\frontend\.env"
    if (-not (Test-Path $frontendEnv)) {
        if (Test-Path "apps\traffic-web-app\frontend\.env.example") {
            # Create production version with correct ports
            @"
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
"@ | Out-File -FilePath $frontendEnv -Encoding UTF8
            WriteSuccess "       Created: frontend/.env (production ports)"
        }
    }
    
    WriteSuccess "       OK: Environment prepared"
    Write-Host ""
    
    # ============================================================================
    # Step 1: Check Docker is running
    # ============================================================================
    WriteInfo "[1/7] Checking Docker..."
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        WriteErr "ERROR: Docker is not running!"
        WriteInfo "       Please start Docker Desktop first."
        exit 1
    }
    WriteSuccess "       OK: Docker is running"
    Write-Host ""
    
    # ============================================================================
    # Step 2: Pull ALL Docker Images (ensures 100% offline ready)
    # ============================================================================
    WriteInfo "[2/7] Pulling Docker images (ensuring all images are available)..."
    WriteInfo "      This may take a few minutes on first run..."
    
    $images = @(
        "neo4j:5.12.0",
        "stain/jena-fuseki:latest",
        "redis:7-alpine",
        "mongo:7.0",
        "timescale/timescaledb-ha:pg15",
        "apache/kafka:latest",
        "stellio/stellio-api-gateway:2.26.1",
        "stellio/stellio-search-service:2.26.1",
        "stellio/stellio-subscription-service:2.26.1",
        "nginx:alpine",
        "node:18-alpine",
        "python:3.11-slim"
    )
    
    foreach ($image in $images) {
        $shortName = $image.Split("/")[-1].Split(":")[0]
        Write-Host -NoNewline "       Pulling $shortName..."
        docker pull $image -q 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            WriteSuccess " OK"
        }
        else {
            WriteWarn " (already exists or network issue)"
        }
    }
    WriteSuccess "       OK: All base images ready"
    Write-Host ""
    
    # ============================================================================
    # Step 3: Build Application Docker Images
    # ============================================================================
    WriteInfo "[3/7] Building application Docker images..."
    WriteInfo "      Building: Python Backend, TypeScript Backend, React Frontend"
    
    docker-compose build --parallel 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        WriteErr "ERROR: Docker build failed!"
        WriteInfo "       Run 'docker-compose build' to see detailed errors."
        exit 1
    }
    WriteSuccess "       OK: All application images built"
    Write-Host ""
    
    # ============================================================================
    # Step 4: Start Infrastructure Services
    # ============================================================================
    WriteInfo "[4/7] Starting infrastructure services..."
    WriteInfo "      Services: Neo4j, Fuseki, Redis, MongoDB, PostgreSQL, Kafka"
    
    docker-compose up -d neo4j fuseki redis mongodb postgres kafka 2>&1 | Out-Null
    
    # Wait for databases to be healthy
    WriteInfo "      Waiting for databases to be healthy..."
    $maxWait = 180  # 3 minutes max for production
    $waited = 0
    $healthyServices = @()
    $requiredServices = @("neo4j", "fuseki", "redis", "mongodb", "postgres", "kafka")
    
    while ($waited -lt $maxWait) {
        $allHealthy = $true
        foreach ($service in $requiredServices) {
            if ($healthyServices -notcontains $service) {
                $health = docker inspect --format='{{.State.Health.Status}}' "test-$service" 2>&1
                if ($health -eq "healthy") {
                    $healthyServices += $service
                    WriteSuccess "           OK: $service is healthy"
                }
                else {
                    $allHealthy = $false
                }
            }
        }
        
        if ($healthyServices.Count -eq $requiredServices.Count) {
            break
        }
        
        Write-Host -NoNewline "."
        Start-Sleep -Seconds 3
        $waited += 3
    }
    Write-Host ""
    
    if ($healthyServices.Count -lt $requiredServices.Count) {
        $missing = $requiredServices | Where-Object { $healthyServices -notcontains $_ }
        WriteWarn "       WARN: Some services not healthy yet: $($missing -join ', ')"
        WriteInfo "       Continuing anyway (they may still be starting)..."
    }
    Write-Host ""
    
    # ============================================================================
    # Step 5: Start Stellio Context Broker
    # ============================================================================
    WriteInfo "[5/7] Starting Stellio Context Broker..."
    
    docker-compose up -d stellio-api-gateway search-service subscription-service 2>&1 | Out-Null
    
    WriteInfo "      Waiting for Stellio to be ready..."
    $stellioReady = $false
    $maxWait = 120
    $waited = 0
    
    while (-not $stellioReady -and $waited -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 3 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $stellioReady = $true
                WriteSuccess "           OK: Stellio is ready"
            }
        }
        catch {
            Write-Host -NoNewline "."
            Start-Sleep -Seconds 3
            $waited += 3
        }
    }
    
    if (-not $stellioReady) {
        WriteWarn "           WARN: Stellio may not be fully ready yet"
    }
    Write-Host ""
    
    # ============================================================================
    # Step 6: Start Application Services
    # ============================================================================
    WriteInfo "[6/7] Starting application services..."
    WriteInfo "      - Python Backend (Citizen API + Orchestrator) on port 8001"
    WriteInfo "      - TypeScript Backend (Express.js API) on port 3001"
    WriteInfo "      - React Frontend on port 3000"
    
    docker-compose up -d python-backend backend frontend 2>&1 | Out-Null
    
    # Wait for Python backend
    WriteInfo "      Waiting for Python backend..."
    $pythonReady = $false
    $maxWait = 60
    $waited = 0
    
    while (-not $pythonReady -and $waited -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8001/" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $pythonReady = $true
                WriteSuccess "           OK: Python backend is ready"
            }
        }
        catch {
            Write-Host -NoNewline "."
            Start-Sleep -Seconds 2
            $waited += 2
        }
    }
    
    # Wait for TypeScript backend
    WriteInfo "      Waiting for TypeScript backend..."
    $backendReady = $false
    $maxWait = 60
    $waited = 0
    
    while (-not $backendReady -and $waited -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                WriteSuccess "           OK: TypeScript backend is ready"
            }
        }
        catch {
            Write-Host -NoNewline "."
            Start-Sleep -Seconds 2
            $waited += 2
        }
    }
    
    # Wait for Frontend
    WriteInfo "      Waiting for React frontend..."
    $frontendReady = $false
    $maxWait = 30
    $waited = 0
    
    while (-not $frontendReady -and $waited -lt $maxWait) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $frontendReady = $true
                WriteSuccess "           OK: React frontend is ready"
            }
        }
        catch {
            Write-Host -NoNewline "."
            Start-Sleep -Seconds 2
            $waited += 2
        }
    }
    
    Write-Host ""
    
    # ============================================================================
    # Step 7: Verify ML Models
    # ============================================================================
    WriteInfo "[7/7] Verifying ML models availability..."
    
    if (Test-Path "assets\models\yolox_x.pth") {
        $weightsSize = (Get-Item "assets\models\yolox_x.pth").Length / 1MB
        WriteSuccess "       OK: YOLOX-X weights ($([math]::Round($weightsSize, 1)) MB)"
    }
    else {
        WriteWarn "       WARN: YOLOX weights not found - CV uses mock detector"
    }
    
    $detrModelPath = "$env:USERPROFILE\.cache\huggingface\hub\models--hilmantm--detr-traffic-accident-detection"
    if (Test-Path $detrModelPath) {
        WriteSuccess "       OK: DETR accident detection model cached"
    }
    else {
        WriteWarn "       WARN: DETR model not cached - will download on first use"
    }
    
    Write-Host ""
    
    # ============================================================================
    # Step 8: Run CV and Sync Pipeline (Real-time Data Generator)
    # ============================================================================
    WriteInfo "[8/8] Starting Real-time Data Generator Pipeline..."
    WriteInfo "      - Live Camera → YOLOX → Neo4j → Analytics"
    WriteInfo "      - Runs: 99999, Delay: 60s, Max Cameras: ALL"
    WriteInfo "      - This will populate databases with real traffic data"
    
    # Run CV pipeline in background using Docker python-backend or local venv
    $cvSyncCmd = @"
Set-Location '$ProjectRoot'
if (Test-Path '.venv') {
    .\`.venv\Scripts\Activate.ps1
}
Write-Host '============================================' -ForegroundColor Yellow
Write-Host '  CV & Sync Pipeline - Data Generator (PROD)' -ForegroundColor Yellow
Write-Host '============================================' -ForegroundColor Yellow
Write-Host ''
python scripts/pipeline/run_cv_and_sync.py --runs 99999 --delay 60
Write-Host ''
Write-Host 'Pipeline completed! Press any key to close...' -ForegroundColor Green
`$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
"@
    
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cvSyncCmd
    Start-Sleep -Seconds 2
    WriteSuccess "      OK: CV & Sync pipeline started"
    
    Write-Host ""
    
    # ============================================================================
    # Success Summary
    # ============================================================================
    WriteSuccess "============================================================"
    WriteSuccess "  ALL PRODUCTION SERVICES STARTED!"
    WriteSuccess "============================================================"
    Write-Host ""
    WriteInfo "ACCESS POINTS:"
    Write-Host ""
    Write-Host "  Application:" -ForegroundColor White
    Write-Host "    Frontend (React):      " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
    Write-Host "    Backend (Express):     " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Cyan
    Write-Host "    Citizen API (FastAPI): " -NoNewline; Write-Host "http://localhost:8001/docs" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Infrastructure:" -ForegroundColor White
    Write-Host "    Stellio Context Broker:" -NoNewline; Write-Host " http://localhost:8080" -ForegroundColor Yellow
    Write-Host "    Neo4j Browser:         " -NoNewline; Write-Host " http://localhost:7474" -ForegroundColor Yellow
    Write-Host "                           " -NoNewline; Write-Host " (neo4j / test12345)" -ForegroundColor DarkGray
    Write-Host "    Apache Jena Fuseki:    " -NoNewline; Write-Host " http://localhost:3030" -ForegroundColor Yellow
    Write-Host "                           " -NoNewline; Write-Host " (admin / test_admin)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Data Pipeline:" -ForegroundColor White
    Write-Host "    CV & Sync Pipeline:    " -NoNewline; Write-Host "Running in separate window" -ForegroundColor Magenta
    Write-Host "                           " -NoNewline; Write-Host " (99999 runs, 60s delay, ALL cameras)" -ForegroundColor DarkGray
    Write-Host ""
    WriteInfo "USEFUL COMMANDS:"
    Write-Host "  View logs:     docker-compose logs -f" -ForegroundColor White
    Write-Host "  View status:   .\justrun.ps1 status" -ForegroundColor White
    Write-Host "  Stop all:      .\justrun.ps1 stop" -ForegroundColor White
    Write-Host ""
}

function Stop-Services {
    Show-Banner
    WriteInfo "STOP: Stopping all services..."
    WriteInfo "        This may take 30-60 seconds (graceful shutdown)..."
    
    # Stop Docker with timeout and progress
    $dockerJob = Start-Job -ScriptBlock {
        param($dir)
        Set-Location $dir
        docker-compose down --timeout 5 2>&1
    } -ArgumentList (Get-Location)
    
    # Show progress
    $dots = 0
    while ($dockerJob.State -eq 'Running') {
        Write-Host -NoNewline "."
        Start-Sleep -Milliseconds 500
        $dots++
        if ($dots -ge 40) { 
            Write-Host " (containers shutting down...)"
            $dots = 0
        }
    }
    
    Receive-Job $dockerJob | Out-Null
    Write-Host ""
    WriteSuccess "        OK: Docker containers stopped"
    
    # Stop Node.js processes
    WriteInfo "        Stopping Node.js processes..."
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    WriteSuccess "        OK: Node.js stopped"
    
    # Stop Python processes (except system Python)
    WriteInfo "        Stopping Python processes..."
    Get-Process -Name python -ErrorAction SilentlyContinue | 
    Where-Object { $_.Path -like "*UIP-Urban_Intelligence_Platform*" } | 
    Stop-Process -Force
    WriteSuccess "        OK: Python stopped"
    
    Write-Host ""
    WriteSuccess "OK: All services stopped"
}

function Clean-All {
    Show-Banner
    WriteWarn "CLEAN: Cleaning all build artifacts and containers..."
    
    Stop-Services
    
    # Clean Docker
    docker-compose down -v --remove-orphans 2>$null
    
    # Clean Python
    if (Test-Path "htmlcov") { Remove-Item -Recurse -Force htmlcov }
    if (Test-Path ".pytest_cache") { Remove-Item -Recurse -Force .pytest_cache }
    if (Test-Path "coverage.xml") { Remove-Item -Force coverage.xml }
    
    # Clean Node.js
    if (Test-Path "apps\traffic-web-app\backend\dist") { 
        Remove-Item -Recurse -Force apps\traffic-web-app\backend\dist 
    }
    if (Test-Path "apps\traffic-web-app\frontend\dist") { 
        Remove-Item -Recurse -Force apps\traffic-web-app\frontend\dist 
    }
    
    WriteSuccess "OK: Cleanup complete"
}

function Run-Tests {
    Show-Banner
    WriteInfo "TEST: Running all tests..."
    
    # Activate Python environment
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        & .\.venv\Scripts\Activate.ps1
    }
    
    # Python tests
    WriteInfo "[1/2] Running Python tests..."
    pytest tests/ -v --tb=short
    
    # Backend tests
    WriteInfo "[2/2] Running backend tests..."
    Push-Location apps\traffic-web-app\backend
    npm test
    Pop-Location
    
    WriteSuccess "OK: All tests completed"
}

function Show-Status {
    Show-Banner
    WriteInfo "STATUS: Checking all services..."
    Write-Host ""
    
    # Docker containers
    WriteInfo "Docker Containers:"
    $containers = @(
        @{Name = "neo4j"; Container = "test-neo4j"; Port = 7474 },
        @{Name = "fuseki"; Container = "test-fuseki"; Port = 3030 },
        @{Name = "redis"; Container = "test-redis"; Port = 6379 },
        @{Name = "mongodb"; Container = "test-mongodb"; Port = 27017 },
        @{Name = "postgres"; Container = "test-postgres"; Port = 5432 },
        @{Name = "kafka"; Container = "test-kafka"; Port = 9092 },
        @{Name = "stellio-api-gateway"; Container = "test-stellio-api-gateway"; Port = 8080 },
        @{Name = "search-service"; Container = "test-stellio-search"; Port = 8083 },
        @{Name = "subscription-service"; Container = "test-stellio-subscription"; Port = 8084 },
        @{Name = "python-backend"; Container = "python-backend"; Port = 8001 },
        @{Name = "traffic-backend"; Container = "traffic-backend"; Port = 3001 },
        @{Name = "traffic-frontend"; Container = "traffic-frontend"; Port = 3000 }
    )
    
    foreach ($svc in $containers) {
        $status = docker inspect --format='{{.State.Status}}' $svc.Container 2>&1
        $health = docker inspect --format='{{.State.Health.Status}}' $svc.Container 2>&1
        
        if ($status -eq "running") {
            if ($health -eq "healthy") {
                WriteSuccess "  [OK] $($svc.Name): running (healthy) - port $($svc.Port)"
            }
            elseif ($health -eq "unhealthy") {
                WriteWarn "  [!] $($svc.Name): running (unhealthy) - port $($svc.Port)"
            }
            else {
                WriteInfo "  [*] $($svc.Name): running - port $($svc.Port)"
            }
        }
        else {
            WriteErr "  [X] $($svc.Name): stopped"
        }
    }
    
    Write-Host ""
    
    # Check application services (both dev and prod ports)
    WriteInfo "Application Services:"
    
    # Citizen API (Python) - port 8001
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            WriteSuccess "  [OK] Citizen API (FastAPI): running - port 8001"
        }
    }
    catch {
        WriteErr "  [X] Citizen API (FastAPI): not responding - port 8001"
    }
    
    # TypeScript Backend - check both dev (5000) and prod (3001) ports
    $backendFound = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            WriteSuccess "  [OK] Backend (Express): running - port 5000 (dev mode)"
            $backendFound = $true
        }
    }
    catch { }
    
    if (-not $backendFound) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                WriteSuccess "  [OK] Backend (Express): running - port 3001 (prod mode)"
                $backendFound = $true
            }
        }
        catch { }
    }
    
    if (-not $backendFound) {
        WriteErr "  [X] Backend (Express): not responding - port 5000/3001"
    }
    
    # React Frontend - check both dev (5173) and prod (3000) ports
    $frontendFound = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            WriteSuccess "  [OK] Frontend (Vite): running - port 5173 (dev mode)"
            $frontendFound = $true
        }
    }
    catch { }
    
    if (-not $frontendFound) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                WriteSuccess "  [OK] Frontend (React): running - port 3000 (prod mode)"
                $frontendFound = $true
            }
        }
        catch { }
    }
    
    if (-not $frontendFound) {
        WriteErr "  [X] Frontend: not responding - port 5173/3000"
    }
    
    Write-Host ""
}

# ============================================================================
# Main Command Router
# ============================================================================

switch ($Command) {
    'setup' { Install-Dependencies }
    'dev' { Start-Dev }
    'prod' { Start-Prod }
    'stop' { Stop-Services }
    'clean' { Clean-All }
    'test' { Run-Tests }
    'status' { Show-Status }
    'help' { Show-Help }
    default { Show-Help }
}
