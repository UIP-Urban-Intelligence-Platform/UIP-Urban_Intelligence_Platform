#!/usr/bin/env pwsh
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# Module: check-real-data.ps1
# Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
# Created: 2025-11-26
# Modified: 2025-11-26
# Version: 2.0.0
# License: MIT
# Description: Real Data Health Check Script

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         CHECKING REAL DATA IN DATABASES                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$headers = @{ "Accept" = "application/ld+json" }
$stellioUrl = "http://localhost:8080/ngsi-ld/v1"

# Check Stellio
Write-Host "📡 Stellio Connection..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "$stellioUrl/entities?limit=1" -Headers $headers -ErrorAction Stop
    Write-Host "✅ Connected`n" -ForegroundColor Green
}
catch {
    Write-Host "❌ Cannot connect to Stellio`n" -ForegroundColor Red
    exit 1
}

# Check Accidents
Write-Host "🚨 Accidents..." -ForegroundColor Yellow
$accUrl = "$stellioUrl/entities?type=Accident`&limit=10"
$accidents = Invoke-RestMethod -Uri $accUrl -Headers $headers
Write-Host "📊 Found: $($accidents.Count)" -ForegroundColor Cyan
if ($accidents.Count -gt 0) {
    Write-Host "✅ Test ID: $($accidents[0].id)`n" -ForegroundColor Green
}

# Check Cameras  
Write-Host "📹 Cameras..." -ForegroundColor Yellow
$camUrl = "$stellioUrl/entities?type=Camera`&limit=10"
$cameras = Invoke-RestMethod -Uri $camUrl -Headers $headers
Write-Host "📊 Found: $($cameras.Count)" -ForegroundColor Cyan
if ($cameras.Count -gt 0) {
    Write-Host "✅ Test Camera: $($cameras[0].cameraName.value)`n" -ForegroundColor Green
}

# Check Air Quality
Write-Host "🌫️  Air Quality..." -ForegroundColor Yellow
$aqUrl = "$stellioUrl/entities?type=AirQualityObserved`&limit=10"
$aq = Invoke-RestMethod -Uri $aqUrl -Headers $headers
Write-Host "📊 Found: $($aq.Count)`n" -ForegroundColor Cyan

# Summary
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                      SUMMARY                               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($accidents.Count -gt 0) {
    Write-Host "✅ GraphInvestigator: READY" -ForegroundColor Green
}
else {
    Write-Host "❌ GraphInvestigator: NO DATA" -ForegroundColor Red
}

if ($cameras.Count -gt 0 -and $aq.Count -gt 0) {
    Write-Host "✅ EcoTwin: READY" -ForegroundColor Green
}
else {
    Write-Host "❌ EcoTwin: INCOMPLETE" -ForegroundColor Red
}

if ($cameras.Count -gt 0) {
    Write-Host "✅ TrafficMaestro: READY" -ForegroundColor Green
}
else {
    Write-Host "❌ TrafficMaestro: NO DATA" -ForegroundColor Red
}

if ($accidents.Count -gt 0 -and $cameras.Count -gt 0 -and $aq.Count -gt 0) {
    Write-Host "`n🎉 ALL DATA AVAILABLE!" -ForegroundColor Green
    Write-Host "📌 Run: npm run test:agents`n" -ForegroundColor Cyan
}
else {
    Write-Host "`n⚠️  SOME DATA MISSING`n" -ForegroundColor Yellow
}
