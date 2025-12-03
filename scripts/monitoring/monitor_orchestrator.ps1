# Monitor Orchestrator Progress in Real-Time
# Shows phases, agents, and skipping warnings
#Module: scripts.monitoring.monitor-orchestrator
#Author:Nguyễn Nhật Quang
#Created: 2025-11-26
#Version: 1.0.0
#License: MIT
param(
    [int]$RefreshSeconds = 5,
    [int]$MaxIterations = 60
)

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       ORCHESTRATOR REAL-TIME MONITOR                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$logFile = "logs/orchestrator_analysis.log"
$iteration = 0

while ($iteration -lt $MaxIterations) {
    Clear-Host
    
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  ORCHESTRATOR MONITOR - Iteration $($iteration + 1)/$MaxIterations" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
    
    if (Test-Path $logFile) {
        $content = Get-Content $logFile
        
        # Current Phase
        Write-Host "`n━━━ CURRENT PHASE ━━━" -ForegroundColor Yellow
        $currentPhase = $content | Select-String -Pattern "PHASE:" | Select-Object -Last 1
        if ($currentPhase) {
            Write-Host $currentPhase.Line -ForegroundColor Green
        }
        
        # Latest Agent
        Write-Host "`n━━━ LATEST AGENT ACTIVITY ━━━" -ForegroundColor Yellow
        $latestAgent = $content | Select-String -Pattern "Executing agent:|Agent .* completed|Agent .* failed" | Select-Object -Last 3
        $latestAgent | ForEach-Object {
            if ($_.Line -match "completed") {
                Write-Host $_.Line -ForegroundColor Green
            } elseif ($_.Line -match "failed") {
                Write-Host $_.Line -ForegroundColor Red
            } else {
                Write-Host $_.Line -ForegroundColor Cyan
            }
        }
        
        # Skipping Warnings
        Write-Host "`n━━━ SKIPPING / WARNINGS ━━━" -ForegroundColor Yellow
        $warnings = $content | Select-String -Pattern "skip|Input file not found|Empty entity list" -CaseSensitive:$false | Select-Object -Last 10
        if ($warnings) {
            $warnings | ForEach-Object {
                Write-Host $_.Line -ForegroundColor Magenta
            }
        } else {
            Write-Host "✅ No skipping warnings detected!" -ForegroundColor Green
        }
        
        # Phase 5 Analytics Status
        Write-Host "`n━━━ PHASE 5 ANALYTICS AGENTS ━━━" -ForegroundColor Yellow
        $cv = $content | Select-String -Pattern "cv_analysis_agent.*completed|cv_analysis_agent.*failed" | Select-Object -Last 1
        $accident = $content | Select-String -Pattern "accident_detection_agent.*completed|accident_detection_agent.*failed" | Select-Object -Last 1
        $congestion = $content | Select-String -Pattern "congestion_detection_agent.*completed|congestion_detection_agent.*failed" | Select-Object -Last 1
        $pattern = $content | Select-String -Pattern "pattern_recognition_agent.*completed|pattern_recognition_agent.*failed" | Select-Object -Last 1
        
        if ($cv) { Write-Host "  cv_analysis: $($cv.Line.Split('-')[-1])" }
        if ($accident) { Write-Host "  accident_detection: $($accident.Line.Split('-')[-1])" }
        if ($congestion) { Write-Host "  congestion_detection: $($congestion.Line.Split('-')[-1])" }
        if ($pattern) { Write-Host "  pattern_recognition: $($pattern.Line.Split('-')[-1])" }
        
        # Workflow Status
        $completed = $content | Select-String -Pattern "WORKFLOW COMPLETED" | Select-Object -Last 1
        if ($completed) {
            Write-Host "`n━━━ WORKFLOW COMPLETED! ━━━" -ForegroundColor Green
            Write-Host $completed.Line -ForegroundColor Green
            
            # Show summary
            $summary = $content | Select-String -Pattern "Status:|Duration:|Total Agents:|Successful:|Failed:" | Select-Object -Last 5
            $summary | ForEach-Object { Write-Host $_.Line }
            
            break
        }
        
        # File Creation Status
        Write-Host "`n━━━ OUTPUT FILES STATUS ━━━" -ForegroundColor Yellow
        $files = @(
            @{Name="observations.json"; Path="data/observations.json"},
            @{Name="accidents.json"; Path="data/accidents.json"},
            @{Name="congestion.json"; Path="data/congestion.json"},
            @{Name="patterns.json"; Path="data/patterns.json"},
            @{Name="cameras_enriched.json"; Path="data/cameras_enriched.json"}
        )
        
        foreach ($file in $files) {
            if (Test-Path $file.Path) {
                $size = (Get-Item $file.Path).Length
                Write-Host "  ✅ $($file.Name) - $size bytes" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $($file.Name) - NOT CREATED YET" -ForegroundColor Red
            }
        }
        
    } else {
        Write-Host "⏳ Waiting for log file..." -ForegroundColor Yellow
    }
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop monitoring..." -ForegroundColor Gray
    
    Start-Sleep -Seconds $RefreshSeconds
    $iteration++
}

Write-Host "`n✅ Monitoring completed!" -ForegroundColor Green
