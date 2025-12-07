---
sidebar_position: 2
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Performance Monitor Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/monitoring/performance-monitor.md
Module: Monitoring Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Performance Monitor Agent component.
============================================================================
-->

# Performance Monitor Agent

The Performance Monitor Agent tracks system performance metrics, identifies bottlenecks, and provides optimization recommendations.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.monitoring.performance_monitor_agent` |
| **Class** | `PerformanceMonitorAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

The Performance Monitor Agent provides:

- **Real-time performance tracking** for all system components
- **Resource utilization monitoring** (CPU, memory, I/O)
- **Latency analysis** for API endpoints and database queries
- **Bottleneck identification** and optimization recommendations
- **Historical trend analysis** for capacity planning

## 📊 Metrics Collected

### System Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| `cpu_usage` | % | CPU utilization |
| `memory_usage` | MB | Memory consumption |
| `disk_io` | MB/s | Disk read/write rate |
| `network_io` | MB/s | Network throughput |

### Application Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| `request_latency` | ms | API response time |
| `request_throughput` | req/s | Requests per second |
| `error_rate` | % | Failed requests percentage |
| `active_connections` | count | Concurrent connections |

### Agent Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| `agent_execution_time` | ms | Agent processing time |
| `entities_processed` | count | Entities per execution |
| `queue_depth` | count | Pending operations |

## 🔧 Architecture

```text
┌─────────────────────────────────────────────┐
│          Performance Monitor Agent          │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │ System  │  │   App   │  │   Agent     │ │
│  │ Metrics │  │ Metrics │  │   Metrics   │ │
│  └────┬────┘  └────┬────┘  └──────┬──────┘ │
│       │            │              │         │
│       └────────────┼──────────────┘         │
│                    ▼                        │
│           ┌───────────────┐                 │
│           │   Aggregator  │                 │
│           └───────┬───────┘                 │
│                   │                         │
│       ┌───────────┼───────────┐            │
│       ▼           ▼           ▼            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │Time-    │ │Prometheus│ │ Alert   │       │
│  │Series DB│ │ Export  │ │ Engine  │       │
│  └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘
```

## 🚀 Usage

### Basic Monitoring

```python
from src.agents.monitoring.performance_monitor_agent import PerformanceMonitorAgent

monitor = PerformanceMonitorAgent()

# Start monitoring
monitor.start()

# Get current metrics
metrics = monitor.get_metrics()
print(f"CPU Usage: {metrics['cpu_usage']}%")
print(f"Memory Usage: {metrics['memory_usage']}MB")
print(f"Request Latency: {metrics['avg_latency']}ms")
```

### Track Specific Operations

```python
# Track API endpoint performance
with monitor.track("api.cameras.list"):
    cameras = await get_cameras()

# Track database query
with monitor.track("db.neo4j.query"):
    results = neo4j.query(cypher)

# Get timing statistics
stats = monitor.get_stats("api.cameras.list")
print(f"Avg: {stats['avg_ms']}ms, P95: {stats['p95_ms']}ms")
```

### Custom Metrics

```python
# Register custom metric
monitor.register_metric(
    name="active_websockets",
    type="gauge",
    description="Number of active WebSocket connections"
)

# Update metric
monitor.set_metric("active_websockets", 42)

# Increment counter
monitor.increment_metric("requests_total")
```

## ⚙️ Configuration

```yaml
# config/performance_monitor_config.yaml
performance_monitor:
  enabled: true
  collection_interval_seconds: 10
  
  # Metrics to collect
  system_metrics:
    - cpu_usage
    - memory_usage
    - disk_io
    - network_io
  
  # Application metrics
  app_metrics:
    track_endpoints: true
    track_database_queries: true
    track_agent_execution: true
  
  # Alerting thresholds
  thresholds:
    cpu_warning: 70
    cpu_critical: 90
    memory_warning: 80
    memory_critical: 95
    latency_warning_ms: 500
    latency_critical_ms: 2000
  
  # Export configuration
  export:
    prometheus:
      enabled: true
      port: 9091
    timeseries_db:
      enabled: true
      url: http://localhost:8086
      database: uip_metrics
```

## 📈 Dashboard Integration

### Grafana Queries

```promql
# Average request latency
rate(request_latency_sum[5m]) / rate(request_latency_count[5m])

# CPU usage by service
avg(cpu_usage) by (service)

# Request throughput
sum(rate(requests_total[1m])) by (endpoint)

# Error rate
sum(rate(requests_failed_total[5m])) / sum(rate(requests_total[5m])) * 100
```

### Sample Dashboard

```json
{
  "title": "UIP Performance Dashboard",
  "panels": [
    {
      "title": "Request Latency (P95)",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(request_latency_bucket[5m]))"
        }
      ]
    },
    {
      "title": "Throughput",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(requests_total[1m]))"
        }
      ]
    }
  ]
}
```

## 🛡️ Performance Alerts

```python
# Configure performance alerts
monitor.add_alert(
    name="high_latency",
    condition=lambda m: m['avg_latency'] > 1000,
    severity="warning",
    action=lambda: notify_ops("High API latency detected")
)

monitor.add_alert(
    name="memory_critical",
    condition=lambda m: m['memory_usage'] > 95,
    severity="critical",
    action=lambda: trigger_gc()
)
```

## 📖 Related Documentation

- [Health Check Agent](health-check) - Service health monitoring
- [Data Quality Validator](data-quality-validator) - Data quality metrics
- [Grafana Dashboard](../../devops/complete-devops-guide) - Visualization

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
