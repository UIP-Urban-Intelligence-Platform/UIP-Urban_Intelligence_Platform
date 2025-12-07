# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# Module: check-health.ps1
# Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
# Created: 2025-11-26
# Modified: 2025-11-26
# Version: 2.0.0
# License: MIT
# Description: Backend Health Check Script

Write-Host "=== HCMC Traffic Backend Health Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if backend process is running
Write-Host "[1] Checking backend process..." -ForegroundColor Yellow
$backendProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*Layer-Business*backend*" 
}

if ($backendProcess) {
    Write-Host "OK Backend process found (PID: $($backendProcess.Id))" -ForegroundColor Green
}
else {
    Write-Host "X Backend process NOT found" -ForegroundColor Red
    Write-Host "  Start backend with: cd backend; npm run dev" -ForegroundColor Yellow
    exit 1
}

# Check HTTP server
Write-Host "`n[2] Checking HTTP server (port 5000)..." -ForegroundColor Yellow
try {
    $httpResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method Get -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $healthData = $httpResponse.Content | ConvertFrom-Json
    
    Write-Host "OK HTTP Server responding" -ForegroundColor Green
    Write-Host "  Status: $($healthData.status)" -ForegroundColor Cyan
    Write-Host "  Timestamp: $($healthData.timestamp)" -ForegroundColor Cyan
    
    # Check connections
    if ($healthData.connections) {
        Write-Host "`n  Connection Status:" -ForegroundColor Cyan
        foreach ($conn in $healthData.connections.PSObject.Properties) {
            $status = if ($conn.Value.healthy) { "OK" } else { "X" }
            $color = if ($conn.Value.healthy) { "Green" } else { "Red" }
            Write-Host "    $status $($conn.Name): $($conn.Value.healthy)" -ForegroundColor $color
        }
    }
}
catch {
    Write-Host "X HTTP Server NOT responding" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

# Check WebSocket server
Write-Host "`n[3] Checking WebSocket server (port 5001)..." -ForegroundColor Yellow
$wsPort = Test-NetConnection -ComputerName localhost -Port 5001 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($wsPort) {
    Write-Host "OK WebSocket server listening on port 5001" -ForegroundColor Green
}
else {
    Write-Host "X WebSocket server NOT listening on port 5001" -ForegroundColor Red
}

# Test sample API endpoint
Write-Host "`n[4] Testing sample API endpoint..." -ForegroundColor Yellow
try {
    $cameraResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/cameras" -Method Get -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
    $cameraData = $cameraResponse.Content | ConvertFrom-Json
    $cameraCount = if ($cameraData.data) { $cameraData.data.Count } else { 0 }
    
    Write-Host "OK Cameras API responding ($cameraCount cameras)" -ForegroundColor Green
}
catch {
    Write-Host "X Cameras API failed: $_" -ForegroundColor Red
}

Write-Host "`n=== Health Check Complete ===" -ForegroundColor Cyan
Write-Host "Backend is ready for frontend connection" -ForegroundColor Green
