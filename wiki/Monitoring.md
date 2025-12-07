<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Monitoring.md
Module: Monitoring Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete guide to monitoring and observability in UIP.
============================================================================
-->

# 📊 Monitoring

Complete guide to monitoring and observability in UIP - Urban Intelligence Platform.

---

## 📋 Overview

UIP - Urban Intelligence Platform implements comprehensive monitoring using:

- 📈 **Prometheus** - Metrics collection
- 📊 **Grafana** - Visualization dashboards
- 📝 **Logging** - Structured logging
- 🔔 **Alerting** - Real-time notifications
- 🔍 **Health Checks** - Service availability

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MONITORING ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         UIP SERVICES                                 │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │   │
│  │  │ API      │  │ Agents   │  │ Stellio  │  │ Support Services     │ │   │
│  │  │ Gateway  │  │ (Python) │  │ Broker   │  │ (Redis, Neo4j, etc.) │ │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘ │   │
│  │       │             │             │                   │              │   │
│  │       └─────────────┴──────┬──────┴───────────────────┘              │   │
│  │                            │                                         │   │
│  │                      /metrics                                        │   │
│  └────────────────────────────┼─────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       PROMETHEUS                                     │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Scrape       │  │ Storage      │  │ Alert Manager            │   │   │
│  │  │ Targets      │  │ (TSDB)       │  │ (Notifications)          │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └───────────────────────────┬──────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        GRAFANA                                       │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Dashboards   │  │ Alerts       │  │ Data Sources             │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📈 Metrics

### Key Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `uip_requests_total` | Counter | Total HTTP requests |
| `uip_request_duration_seconds` | Histogram | Request latency |
| `uip_observations_processed` | Counter | Traffic observations processed |
| `uip_alerts_sent` | Counter | Alerts dispatched |
| `uip_active_cameras` | Gauge | Active camera count |
| `uip_congestion_level` | Gauge | Current congestion level |
| `uip_agent_status` | Gauge | Agent health status |

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'uip-api'
    static_configs:
      - targets: ['api-gateway:8000']
    metrics_path: /metrics

  - job_name: 'uip-agents'
    static_configs:
      - targets: 
        - 'cv-agent:5001'
        - 'congestion-agent:5002'
        - 'alert-agent:5003'

  - job_name: 'stellio'
    static_configs:
      - targets: ['stellio:8080']
    metrics_path: /actuator/prometheus

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'neo4j'
    static_configs:
      - targets: ['neo4j:2004']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - /etc/prometheus/rules/*.yml
```

---

## 📊 Grafana Dashboards

### Main Dashboard Configuration

```json
{
  "dashboard": {
    "title": "UIP Traffic Monitoring",
    "uid": "uip-main",
    "panels": [
      {
        "title": "Active Cameras",
        "type": "stat",
        "targets": [
          {
            "expr": "uip_active_cameras",
            "refId": "A"
          }
        ]
      },
      {
        "title": "Observations per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(uip_observations_processed[5m])",
            "legendFormat": "obs/s"
          }
        ]
      },
      {
        "title": "Average Congestion Level",
        "type": "gauge",
        "targets": [
          {
            "expr": "avg(uip_congestion_level)",
            "refId": "A"
          }
        ],
        "options": {
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 0.5},
              {"color": "orange", "value": 0.7},
              {"color": "red", "value": 0.85}
            ]
          }
        }
      },
      {
        "title": "Request Latency (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(uip_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          }
        ]
      }
    ]
  }
}
```

### Dashboard Panels

| Panel | Type | Query |
|-------|------|-------|
| Active Cameras | Stat | `uip_active_cameras` |
| Request Rate | Graph | `rate(uip_requests_total[5m])` |
| Error Rate | Graph | `rate(uip_requests_total{status=~"5.."}[5m])` |
| Latency p95 | Graph | `histogram_quantile(0.95, ...)` |
| Congestion Map | Geomap | Custom plugin |
| Alert History | Table | `uip_alerts_sent` |

---

## 🔔 Alerting

### Alert Rules

```yaml
# prometheus/rules/uip_alerts.yml
groups:
  - name: uip_alerts
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(uip_requests_total{status=~"5.."}[5m]) / rate(uip_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"

      # High latency
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(uip_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
          description: "p95 latency is {{ $value | humanizeDuration }}"

      # High congestion
      - alert: HighCongestion
        expr: avg(uip_congestion_level) > 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High city-wide congestion"
          description: "Average congestion level: {{ $value | humanizePercentage }}"

      # Camera offline
      - alert: CameraOffline
        expr: uip_camera_status == 0
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Camera {{ $labels.camera_id }} is offline"
```

### Alert Manager Configuration

```yaml
# alertmanager.yml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@uip.example.com'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-team'
    - match:
        severity: warning
      receiver: 'ops-team'

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@example.com'
  
  - name: 'critical-team'
    email_configs:
      - to: 'critical@example.com'
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/...'
        channel: '#alerts-critical'
  
  - name: 'ops-team'
    email_configs:
      - to: 'ops@example.com'
```

---

## 📝 Logging

### Structured Logging

```python
# src/utils/logging_config.py

import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """JSON log formatter."""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        
        return json.dumps(log_data)

def setup_logging(level: str = "INFO"):
    """Configure structured logging."""
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)
```

### Log Output Example

```json
{
  "timestamp": "2025-11-29T10:30:00.123456Z",
  "level": "INFO",
  "logger": "uip.agents.cv_agent",
  "message": "Processed observation",
  "module": "cv_agent",
  "function": "process_frame",
  "line": 142,
  "camera_id": "TTH-406",
  "vehicle_count": 45,
  "processing_time_ms": 150
}
```

---

## 🔍 Health Checks

### Health Check Configuration

```yaml
# config/health_check_config.yaml
version: "2.0.0"

health_checks:
  # API Gateway
  api_gateway:
    endpoint: http://localhost:8000/health
    interval: 30s
    timeout: 5s
    
  # Stellio Context Broker
  stellio:
    endpoint: http://localhost:8080/actuator/health
    interval: 30s
    timeout: 10s
    
  # Redis
  redis:
    type: tcp
    host: localhost
    port: 6379
    interval: 15s
    
  # Neo4j
  neo4j:
    endpoint: http://localhost:7474/db/data/
    interval: 30s
    timeout: 10s
```

### Health Check Implementation

```python
# src/utils/health_check.py

from typing import Dict, Any
import aiohttp
import asyncio

class HealthChecker:
    """Service health checker."""
    
    def __init__(self):
        self.checks = {}
    
    def register_check(self, name: str, check_func):
        """Register health check."""
        self.checks[name] = check_func
    
    async def check_all(self) -> Dict[str, Any]:
        """Run all health checks."""
        results = {}
        for name, check in self.checks.items():
            try:
                is_healthy = await check()
                results[name] = {
                    "status": "healthy" if is_healthy else "unhealthy",
                    "timestamp": datetime.utcnow().isoformat()
                }
            except Exception as e:
                results[name] = {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
        
        overall = all(r["status"] == "healthy" for r in results.values())
        return {
            "status": "healthy" if overall else "unhealthy",
            "checks": results
        }

# Example checks
async def check_redis():
    """Check Redis connection."""
    import redis.asyncio as redis
    r = redis.Redis()
    return await r.ping()

async def check_stellio():
    """Check Stellio health."""
    async with aiohttp.ClientSession() as session:
        async with session.get("http://localhost:8080/actuator/health") as resp:
            return resp.status == 200
```

### Health Endpoint

```python
# src/api/health.py

from fastapi import APIRouter
from health_check import HealthChecker

router = APIRouter()

@router.get("/health")
async def health():
    """Health check endpoint."""
    checker = HealthChecker()
    return await checker.check_all()

@router.get("/health/live")
async def liveness():
    """Kubernetes liveness probe."""
    return {"status": "alive"}

@router.get("/health/ready")
async def readiness():
    """Kubernetes readiness probe."""
    checker = HealthChecker()
    result = await checker.check_all()
    if result["status"] == "healthy":
        return {"status": "ready"}
    else:
        raise HTTPException(status_code=503, detail="Not ready")
```

---

## 🐳 Docker Compose

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: uip-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./config/prometheus/rules:/etc/prometheus/rules
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: uip-grafana
    ports:
      - "3000:3000"
    volumes:
      - ./config/grafana/provisioning:/etc/grafana/provisioning
      - ./config/grafana_dashboard.json:/var/lib/grafana/dashboards/uip.json
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false

  alertmanager:
    image: prom/alertmanager:latest
    container_name: uip-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./config/alertmanager.yml:/etc/alertmanager/alertmanager.yml

  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: uip-redis-exporter
    ports:
      - "9121:9121"
    environment:
      - REDIS_ADDR=redis:6379

volumes:
  prometheus_data:
  grafana_data:
```

---

## 📊 Performance Metrics Python

```python
# src/utils/metrics.py

from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Counters
requests_total = Counter(
    'uip_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

observations_processed = Counter(
    'uip_observations_processed',
    'Total observations processed',
    ['camera_id']
)

alerts_sent = Counter(
    'uip_alerts_sent',
    'Total alerts sent',
    ['severity']
)

# Histograms
request_duration = Histogram(
    'uip_request_duration_seconds',
    'Request latency in seconds',
    ['endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

processing_time = Histogram(
    'uip_processing_time_seconds',
    'Processing time in seconds',
    ['agent'],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
)

# Gauges
active_cameras = Gauge(
    'uip_active_cameras',
    'Number of active cameras'
)

congestion_level = Gauge(
    'uip_congestion_level',
    'Current congestion level',
    ['camera_id']
)

def start_metrics_server(port: int = 8001):
    """Start Prometheus metrics server."""
    start_http_server(port)
```

---

## 🔗 Related Pages

- [[Architecture]] - System architecture
- [[Docker-Setup]] - Docker configuration
- [[Logging-Guide]] - Logging details
- [[Performance-Tuning]] - Performance optimization
- [[Troubleshooting]] - Debug guide

---

## 📚 References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry](https://opentelemetry.io/)
- [Prometheus Python Client](https://github.com/prometheus/client_python)
