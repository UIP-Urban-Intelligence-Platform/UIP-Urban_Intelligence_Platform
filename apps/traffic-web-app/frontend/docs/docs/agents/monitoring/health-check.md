---
sidebar_label: 'Health Check'
title: 'Health Check Agent'
sidebar_position: 1
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Health Check Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/monitoring/health-check.md
Module: Monitoring Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Health Check Agent component.
============================================================================
-->

# Health Check Agent

The Health Check Agent provides comprehensive health monitoring for all services, data quality, and performance metrics with alerting capabilities.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.monitoring.health_check_agent` |
| **Class** | `HealthCheckAgent` |
| **Author** | Nguyen Dinh Anh Tuan |
| **Version** | 2.0.0 |

## 🎯 Purpose

The Health Check Agent provides:

- **Service availability monitoring** (HTTP, TCP, Cypher, SPARQL, Kafka)
- **Data quality validation** (thresholds, counts, age)
- **Performance metrics collection** (response times, latency)
- **Alerting integration** (webhook, email, Slack)
- **Prometheus metrics export**

## 📊 Monitoring Capabilities

### Service Health Checks

| Check Type | Protocol | Description |
|------------|----------|-------------|
| HTTP | REST | API endpoint availability |
| TCP | Socket | Database connection |
| Cypher | Neo4j | Graph database health |
| SPARQL | Fuseki | Triplestore availability |
| Kafka | Broker | Message queue status |

### Data Quality Metrics

| Metric | Description |
|--------|-------------|
| Data freshness | Age of latest data |
| Record count | Expected vs actual counts |
| Validation rate | Percentage passing validation |
| Error rate | Failed operations |

## 🔧 Architecture

```text
┌─────────────────────────────────────────────┐
│             Health Check Agent              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │  HTTP   │  │  TCP    │  │   Cypher    │ │
│  │ Checker │  │ Checker │  │   Checker   │ │
│  └────┬────┘  └────┬────┘  └──────┬──────┘ │
│       │            │              │         │
│       └────────────┼──────────────┘         │
│                    ▼                        │
│           ┌───────────────┐                 │
│           │ Health Status │                 │
│           │   Aggregator  │                 │
│           └───────┬───────┘                 │
│                   │                         │
│       ┌───────────┼───────────┐            │
│       ▼           ▼           ▼            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Alert  │ │Prometheus│ │Dashboard│       │
│  │ Manager │ │ Export  │ │   API   │       │
│  └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘
```

## 🚀 Usage

### Basic Health Check

```python
from src.agents.monitoring.health_check_agent import HealthCheckAgent

agent = HealthCheckAgent()

# Start continuous monitoring
agent.start_monitoring()

# Get current health status
status = agent.get_health_status()
print(f"Overall Health: {status['overall_health']}")
print(f"Services: {status['services']}")
```

### Check Specific Service

```python
# Check single service
neo4j_health = agent.check_service("neo4j")
print(f"Neo4j Status: {neo4j_health['status']}")
print(f"Response Time: {neo4j_health['response_time_ms']}ms")

# Check database connection
mongo_health = agent.check_database("mongodb")
```

### Custom Health Checks

```python
# Register custom health check
@agent.register_check("my_service")
async def check_my_service():
    try:
        response = await http_client.get("http://my-service/health")
        return {"status": "healthy", "code": response.status_code}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

## ⚙️ Configuration

```yaml
# config/health_check_config.yaml
health_check:
  enabled: true
  check_interval_seconds: 30
  
  services:
    backend:
      url: http://localhost:8001/health
      timeout: 5
      expected_status: 200
    
    neo4j:
      type: cypher
      url: bolt://localhost:7687
      query: "RETURN 1"
      timeout: 10
    
    mongodb:
      type: tcp
      host: localhost
      port: 27017
      timeout: 5
    
    redis:
      type: tcp
      host: localhost
      port: 6379
      timeout: 3
    
    stellio:
      url: http://localhost:8080/health
      timeout: 10
    
    fuseki:
      type: sparql
      url: http://localhost:3030/traffic/sparql
      query: "ASK { ?s ?p ?o }"
      timeout: 10

  # Alert configuration
  alerts:
    enabled: true
    channels:
      - type: webhook
        url: http://alert-service/webhook
      - type: email
        recipients:
          - admin@example.com
    
    rules:
      - name: service_down
        condition: status == "unhealthy"
        severity: critical
        cooldown_minutes: 5
      
      - name: high_latency
        condition: response_time_ms > 5000
        severity: warning
        cooldown_minutes: 15

  # Prometheus metrics
  prometheus:
    enabled: true
    port: 9090
    path: /metrics
```

## 📈 Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `service_health_status` | Gauge | Binary health (0=down, 1=up) |
| `service_response_time_seconds` | Histogram | Health check latency |
| `data_quality_score` | Gauge | Quality metric (0-100) |
| `health_check_total` | Counter | Total checks performed |

### Grafana Dashboard

```json
{
  "panels": [
    {
      "title": "Service Health",
      "type": "stat",
      "targets": [
        {
          "expr": "service_health_status"
        }
      ]
    }
  ]
}
```

## 🛡️ Alerting

### Alert Channels

```python
# Configure alert channels
agent.configure_alerts({
    "webhook": {
        "url": "https://hooks.slack.com/services/xxx",
        "headers": {"Content-Type": "application/json"}
    },
    "email": {
        "smtp_server": "smtp.example.com",
        "recipients": ["ops@example.com"]
    }
})
```

### Alert Rules

```python
# Custom alert rule
agent.add_alert_rule(
    name="database_slow",
    condition=lambda status: status.get("response_time_ms", 0) > 1000,
    severity="warning",
    message="Database response time exceeded 1 second"
)
```

## 📖 Related Documentation

- [Performance Monitor](performance-monitor) - Performance metrics
- [Data Quality Validator](data-quality-validator) - Data validation
- [DevOps Guide](../../devops/complete-devops-guide) - Monitoring setup

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
