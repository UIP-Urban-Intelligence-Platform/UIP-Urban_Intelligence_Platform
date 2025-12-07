# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# Module: tests.integration.test-agents
# Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
# Created: 2025-11-26
# Version: 1.0.0
# License: MIT
# Description: Test Enhanced Agents Script - API key rotation tests

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           ENHANCED AGENTS TEST RUNNER - API Key Rotation Test            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Must run from backend directory" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "   Please create .env file with required API keys" -ForegroundColor Yellow
    exit 1
}

# Check for required API keys in .env
Write-Host "🔍 Checking API Keys..." -ForegroundColor Yellow

$envContent = Get-Content .env -Raw
$requiredKeys = @(
    "GEMINI_API_KEY",
    "TAVILY_API_KEY", 
    "OPENWEATHER_API_KEY",
    "TICKETMASTER_API_KEY",
    "MAPBOX_API_KEY"
)

$missingKeys = @()
foreach ($k in $requiredKeys) {
    $pattern = [string]::Concat($k, "=.+")
    if ($envContent -notmatch $pattern) {
        $missingKeys += $k
        Write-Host "   ⚠️  $k - Not found or empty" -ForegroundColor Yellow
    }
    else {
        # Count number of keys (comma-separated)
        $searchPattern = [string]::Concat("^", $k, "=")
        $matchedLines = $envContent -split "`n" | Where-Object { $_ -match $searchPattern }
        $keyLine = $matchedLines -replace $searchPattern, ""
        $keyCount = ($keyLine -split ",").Count
        Write-Host "   ✅ $k - $keyCount key(s) configured" -ForegroundColor Green
    }
}

if ($missingKeys.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Warning: Some API keys are missing. Tests may fail." -ForegroundColor Yellow
    Write-Host "   Missing: $($missingKeys -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Test cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "🚀 Starting Enhanced Agents Test Suite..." -ForegroundColor Cyan
Write-Host ""

# Run the test
npm run test:agents

# Capture exit code
$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ All agent tests passed!" -ForegroundColor Green
}
else {
    Write-Host "❌ Some agent tests failed. Check logs above for details." -ForegroundColor Red
}

Write-Host ""
exit $exitCode
