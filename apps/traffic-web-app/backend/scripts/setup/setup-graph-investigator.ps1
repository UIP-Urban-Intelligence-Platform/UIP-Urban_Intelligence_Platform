# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# Module: setup-graph-investigator.ps1
# Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
# Created: 2025-11-26
# Version: 1.0.0
# License: MIT
# Description: GraphRAG Investigator Agent - Setup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GraphRAG Investigator Agent - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "✗ Node.js not found. Please install Node.js >= 18.x" -ForegroundColor Red
    exit 1
}

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "✗ package.json not found. Please run from backend directory." -ForegroundColor Red
    exit 1
}

Write-Host "✓ package.json found" -ForegroundColor Green

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}
else {
    Write-Host "✓ node_modules exists" -ForegroundColor Green
}

# Verify critical dependencies
Write-Host ""
Write-Host "Verifying dependencies..." -ForegroundColor Yellow

$dependencies = @(
    "openai",
    "neo4j-driver",
    "axios",
    "js-yaml",
    "winston",
    "express"
)

foreach ($dep in $dependencies) {
    if (Test-Path "node_modules/$dep") {
        Write-Host "✓ $dep installed" -ForegroundColor Green
    }
    else {
        Write-Host "✗ $dep missing" -ForegroundColor Red
    }
}

# Check environment variables
Write-Host ""
Write-Host "Checking environment variables..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    $requiredVars = @(
        "NEO4J_URL",
        "STELLIO_URL"
    )
    
    $optionalVars = @(
        "OPENAI_API_KEY",
        "TAVILY_API_KEY"
    )
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "  ✓ $var configured" -ForegroundColor Green
        }
        else {
            Write-Host "  ✗ $var missing (REQUIRED)" -ForegroundColor Red
        }
    }
    
    foreach ($var in $optionalVars) {
        if ($envContent -match $var) {
            Write-Host "  ✓ $var configured" -ForegroundColor Green
        }
        else {
            Write-Host "  ⚠ $var missing (optional - graceful degradation)" -ForegroundColor Yellow
        }
    }
}
else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating .env template..." -ForegroundColor Yellow
    
    $envTemplate = @"
# GraphRAG Investigator Agent - Environment Variables

# Required - LOD Data Sources
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=test12345
STELLIO_URL=http://localhost:8080

# Optional - External AI APIs (graceful degradation if missing)
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
"@
    
    Set-Content -Path ".env" -Value $envTemplate
    Write-Host "✓ .env template created. Please fill in your API keys." -ForegroundColor Green
}

# Check ffmpeg (optional)
Write-Host ""
Write-Host "Checking ffmpeg (optional for camera streams)..." -ForegroundColor Yellow
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-Object -First 1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ ffmpeg installed" -ForegroundColor Green
    }
    else {
        throw
    }
}
catch {
    Write-Host "⚠ ffmpeg not found (optional - install with: winget install ffmpeg)" -ForegroundColor Yellow
}

# Check config file
Write-Host ""
Write-Host "Checking configuration file..." -ForegroundColor Yellow
if (Test-Path "config/agents/graph-investigator.yaml") {
    Write-Host "✓ graph-investigator.yaml found" -ForegroundColor Green
}
else {
    Write-Host "✗ Configuration file missing" -ForegroundColor Red
    Write-Host "  Expected: config/agents/graph-investigator.yaml" -ForegroundColor Red
}

# Build TypeScript
Write-Host ""
Write-Host "Building TypeScript..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ TypeScript build successful" -ForegroundColor Green
}
else {
    Write-Host "✗ TypeScript build failed" -ForegroundColor Red
    exit 1
}

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Fill in API keys in .env file (if not done)" -ForegroundColor White
Write-Host "2. Start services: docker-compose up -d" -ForegroundColor White
Write-Host "3. Test agent: npm run test:agent" -ForegroundColor White
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "- README: ./GRAPH_INVESTIGATOR_README.md" -ForegroundColor White
Write-Host "- Examples: ./examples/graph-investigator-usage.ts" -ForegroundColor White
Write-Host "- Verification: ./IMPLEMENTATION_VERIFICATION.md" -ForegroundColor White
Write-Host ""
Write-Host "Quick test:" -ForegroundColor Yellow
Write-Host "  node -e `"const { GraphInvestigatorAgent } = require('./dist/agents/GraphInvestigatorAgent'); const agent = new GraphInvestigatorAgent(); agent.close();`"" -ForegroundColor White
Write-Host ""
