<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Monitoring-Guide.md
Module: Monitoring Guide Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  System monitoring and observability documentation.
============================================================================
-->
# 📡 Monitoring Guide

System monitoring and observability documentation.

---

## 📊 Monitoring Stack

| Component | Purpose | Port |
|-----------|---------|------|
| Prometheus | Metrics collection | 9090 |
| Grafana | Visualization | 3000 |
| Loki | Log aggregation | 3100 |
| Jaeger | Distributed tracing | 16686 |
| AlertManager | Alert routing | 9093 |

---

## 📈 Prometheus Setup

### Configuration

```yaml
# docker/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['api:5000']
    metrics_path: /metrics

  - job_name: 'agents'
    static_configs:
      - targets: ['orchestrator:9100']

  - job_name: 'neo4j'
    static_configs:
      - targets: ['neo4j:2004']
    metrics_path: /metrics

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### Custom Metrics

```python
# src/monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
REQUEST_COUNT = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'api_request_latency_seconds',
    'Request latency',
    ['method', 'endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

# Agent metrics
AGENT_PROCESSING_TIME = Histogram(
    'agent_processing_seconds',
    'Agent processing time',
    ['agent_name']
)

ACTIVE_AGENTS = Gauge(
    'active_agents',
    'Number of active agents',
    ['agent_type']
)

# Traffic metrics
VEHICLES_DETECTED = Counter(
    'vehicles_detected_total',
    'Total vehicles detected',
    ['camera_id', 'vehicle_type']
)

CONGESTION_LEVEL = Gauge(
    'congestion_level',
    'Current congestion level',
    ['road_id']
)
```

### Instrumenting Code

```python
# Usage in API
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST

@app.route('/metrics')
def metrics():
    return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    latency = time.time() - request.start_time
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.path,
        status=response.status_code
    ).inc()
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.path
    ).observe(latency)
    return response
```

---

## 📊 Grafana Dashboards

### Traffic Overview Dashboard

```json
// config/grafana_dashboard.json
{
  "dashboard": {
    "title": "Traffic Monitoring",
    "panels": [
      {
        "title": "Active Cameras",
        "type": "stat",
        "targets": [
          {
            "expr": "count(up{job=\"cameras\"} == 1)"
          }
        ]
      },
      {
        "title": "Vehicles per Minute",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(vehicles_detected_total[1m])"
          }
        ]
      },
      {
        "title": "Congestion Levels",
        "type": "heatmap",
        "targets": [
          {
            "expr": "congestion_level"
          }
        ]
      },
      {
        "title": "API Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(api_request_latency_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### Key Panels

| Panel | Query | Purpose |
|-------|-------|---------|
| Request Rate | `rate(api_requests_total[5m])` | API throughput |
| Error Rate | `rate(api_requests_total{status=~"5.."}[5m])` | Error tracking |
| P95 Latency | `histogram_quantile(0.95, rate(api_request_latency_seconds_bucket[5m]))` | Performance |
| Active Cameras | `count(camera_status == 1)` | Availability |
| Vehicle Count | `sum(rate(vehicles_detected_total[1m]))` | Traffic volume |

---

## 🔔 Alerting

### Alert Rules

```yaml
# docker/prometheus/rules/alerts.yml
groups:
  - name: traffic-alerts
    rules:
      - alert: HighCongestion
        expr: congestion_level > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High congestion detected on {{ $labels.road_id }}"
          description: "Congestion level is {{ $value }}%"

      - alert: CameraDown
        expr: up{job="cameras"} == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Camera {{ $labels.camera_id }} is down"

      - alert: HighErrorRate
        expr: rate(api_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High API error rate"
          description: "Error rate is {{ $value }} per second"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(api_request_latency_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High API latency detected"
          description: "P95 latency is {{ $value }} seconds"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
```

### AlertManager Configuration

```yaml
# docker/alertmanager/alertmanager.yml
global:
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alerts@example.com'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical'
    - match:
        severity: warning
      receiver: 'warning'

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@example.com'

  - name: 'critical'
    email_configs:
      - to: 'oncall@example.com'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#alerts-critical'

  - name: 'warning'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK}'
        channel: '#alerts-warning'
```

---

## 📝 Logging

### Structured Logging

```python
# src/utils/logger.py
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Usage
logger.info("camera_processed",
    camera_id="cam-123",
    vehicles_detected=45,
    processing_time_ms=150
)
```

### Log Output

```json
{
  "timestamp": "2025-11-29T10:30:00.123Z",
  "level": "info",
  "logger": "traffic_analyzer",
  "event": "camera_processed",
  "camera_id": "cam-123",
  "vehicles_detected": 45,
  "processing_time_ms": 150
}
```

### Loki Integration

```yaml
# docker-compose.monitoring.yml
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - ./docker/loki/loki-config.yml:/etc/loki/loki-config.yml
    command: -config.file=/etc/loki/loki-config.yml

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log
      - ./logs:/app/logs
      - ./docker/promtail/promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

---

## 🔍 Tracing

### Jaeger Setup

```yaml
# docker-compose.monitoring.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:1.52
    ports:
      - "16686:16686"  # UI
      - "6831:6831/udp"  # Compact thrift
      - "14268:14268"  # HTTP collector
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: 9411
```

### OpenTelemetry Integration

```python
# src/tracing/setup.py
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Setup tracer
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Configure Jaeger exporter
jaeger_exporter = JaegerExporter(
    agent_host_name="localhost",
    agent_port=6831,
)

trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(jaeger_exporter)
)

# Auto-instrument Flask
FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()

# Manual tracing
@tracer.start_as_current_span("process_camera_frame")
def process_frame(camera_id: str, frame: bytes):
    span = trace.get_current_span()
    span.set_attribute("camera_id", camera_id)
    span.set_attribute("frame_size", len(frame))
    
    # Processing logic
    result = analyze_frame(frame)
    
    span.set_attribute("vehicles_detected", result.vehicle_count)
    return result
```

---

## 📊 Health Checks

### Health Endpoint

```python
# src/api/health.py
from flask import Blueprint, jsonify
import redis
import asyncpg
import asyncio
from neo4j import GraphDatabase

health_bp = Blueprint('health', __name__)

@health_bp.route('/health')
def health_check():
    checks = {
        'api': True,
        'postgres': check_postgres(),
        'redis': check_redis(),
        'neo4j': check_neo4j()
    }
    
    all_healthy = all(checks.values())
    
    return jsonify({
        'status': 'healthy' if all_healthy else 'unhealthy',
        'checks': checks,
        'timestamp': datetime.utcnow().isoformat()
    }), 200 if all_healthy else 503

def check_postgres():
    async def _check():
        try:
            conn = await asyncpg.connect(os.environ['DATABASE_URL'])
            await conn.close()
            return True
        except:
            return False
    try:
        return asyncio.run(_check())
    except:
        return False

def check_redis():
    try:
        r = redis.from_url(os.environ['REDIS_URL'])
        return r.ping()
    except:
        return False

def check_neo4j():
    try:
        driver = GraphDatabase.driver(
            os.environ['NEO4J_URI'],
            auth=(os.environ['NEO4J_USER'], os.environ['NEO4J_PASSWORD'])
        )
        driver.verify_connectivity()
        driver.close()
        return True
    except:
        return False
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 5
  periodSeconds: 5
```

---

## 📉 Performance Monitoring

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Request Rate | Requests per second | > 1000 |
| Error Rate | Errors per second | < 0.1% |
| P50 Latency | Median response time | < 50ms |
| P95 Latency | 95th percentile | < 200ms |
| P99 Latency | 99th percentile | < 500ms |
| CPU Usage | Container CPU | < 80% |
| Memory Usage | Container memory | < 80% |

### SLI/SLO Dashboard

```yaml
# SLO Configuration
slos:
  - name: API Availability
    target: 99.9%
    indicator: sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

  - name: API Latency
    target: 95% < 200ms
    indicator: histogram_quantile(0.95, rate(api_request_latency_seconds_bucket[5m])) < 0.2

  - name: Camera Uptime
    target: 99%
    indicator: avg(up{job="cameras"})
```

---

## 🔗 Related Pages

- [[Docker-Services]] - Infrastructure
- [[Configuration]] - Config files
- [[Troubleshooting]] - Common issues
