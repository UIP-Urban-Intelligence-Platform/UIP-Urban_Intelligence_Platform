<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Logging-Guide.md
Module: Logging & Observability Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-12-08
Version: 1.0.0
License: MIT

Description:
  Comprehensive logging and observability guide for UIP development
  and production environments.
============================================================================
-->
# 📝 Logging Guide

Comprehensive logging and observability guide for UIP - Urban Intelligence Platform.

---

## 📊 Logging Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         UIP Logging Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │  Python     │    │ TypeScript  │    │   Docker    │    │   System    │ │
│  │  Agents     │    │  Backend    │    │  Services   │    │   Logs      │ │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘ │
│         │                  │                  │                  │        │
│         ▼                  ▼                  ▼                  ▼        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                      Log Aggregation (Loki)                         │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    Visualization (Grafana)                           │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🐍 Python Logging

### Logger Configuration

UIP uses a centralized logger configuration in `src/core/logger.py`:

```python
# src/core/logger.py
import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler

def setup_logger(
    name: str,
    level: str = "INFO",
    log_file: str | None = None,
    max_bytes: int = 10_000_000,  # 10 MB
    backup_count: int = 5
) -> logging.Logger:
    """
    Configure and return a logger instance.
    
    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file path for file logging
        max_bytes: Max file size before rotation
        backup_count: Number of backup files to keep
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(
        logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    )
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=max_bytes,
            backupCount=backup_count
        )
        file_handler.setFormatter(
            logging.Formatter(
                '%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s'
            )
        )
        logger.addHandler(file_handler)
    
    return logger
```

### Using the Logger

```python
# In any agent or module
from src.core.logger import setup_logger

logger = setup_logger(__name__, level="DEBUG", log_file="logs/agent.log")

# Usage
logger.debug("Detailed debug information")
logger.info("General information")
logger.warning("Warning message")
logger.error("Error occurred")
logger.exception("Exception with traceback")  # Includes stack trace
```

### Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| `DEBUG` | 10 | Detailed diagnostic information |
| `INFO` | 20 | Confirmation of normal operation |
| `WARNING` | 30 | Unexpected but handled situations |
| `ERROR` | 40 | Serious problems requiring attention |
| `CRITICAL` | 50 | System failures requiring immediate action |

---

## 📁 Log File Structure

### Directory Layout

```
logs/
├── orchestrator.log          # Main orchestrator logs
├── orchestrator.log.1        # Rotated backup
├── agents/
│   ├── accident_detection.log
│   ├── congestion_detection.log
│   ├── pattern_recognition.log
│   ├── stellio_publisher.log
│   └── rdf_assembler.log
├── api/
│   ├── backend.log
│   └── citizen_api.log
├── services/
│   ├── stellio.log
│   ├── fuseki.log
│   └── kafka.log
└── errors/
    └── errors.log            # All errors aggregated
```

### Log Rotation Policy

```python
# Configuration
LOG_CONFIG = {
    "max_bytes": 10_000_000,      # 10 MB per file
    "backup_count": 5,             # Keep 5 rotated files
    "compression": "gz",           # Compress old logs
    "retention_days": 30           # Delete after 30 days
}
```

---

## 📋 Log Format

### Standard Format

```
2025-12-08 14:30:45 | INFO     | src.agents.analytics.accident_detection | Processing camera feed: cam_001
2025-12-08 14:30:46 | DEBUG    | src.agents.analytics.accident_detection | Detected 3 vehicles in frame
2025-12-08 14:30:47 | WARNING  | src.agents.analytics.accident_detection | Low confidence detection (0.65)
2025-12-08 14:30:48 | ERROR    | src.agents.analytics.accident_detection | Failed to process frame: timeout
```

### JSON Format (for log aggregation)

```python
# JSON formatter for structured logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
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
        return json.dumps(log_data)
```

### Example JSON Output

```json
{
  "timestamp": "2025-12-08T14:30:45.123456Z",
  "level": "INFO",
  "logger": "src.agents.analytics.accident_detection",
  "message": "Processing camera feed: cam_001",
  "module": "accident_detection_agent",
  "function": "process_frame",
  "line": 145
}
```

---

## 🔧 Environment Configuration

### Environment Variables

```bash
# .env file

# Log Level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
LOG_LEVEL=INFO

# Log Output
LOG_TO_FILE=true
LOG_TO_CONSOLE=true
LOG_FILE_PATH=logs/uip.log

# Log Format
LOG_FORMAT=standard  # standard or json
LOG_DATE_FORMAT=%Y-%m-%d %H:%M:%S

# Rotation Settings
LOG_MAX_BYTES=10000000
LOG_BACKUP_COUNT=5

# External Logging
LOKI_URL=http://loki:3100
LOKI_ENABLED=true
```

### Per-Component Configuration

```yaml
# config/logging.yaml
version: 1
disable_existing_loggers: false

formatters:
  standard:
    format: '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
  detailed:
    format: '%(asctime)s | %(levelname)-8s | %(name)s | %(funcName)s:%(lineno)d | %(message)s'

handlers:
  console:
    class: logging.StreamHandler
    level: DEBUG
    formatter: standard
    stream: ext://sys.stdout
    
  file:
    class: logging.handlers.RotatingFileHandler
    level: INFO
    formatter: detailed
    filename: logs/uip.log
    maxBytes: 10000000
    backupCount: 5

loggers:
  src.agents:
    level: DEBUG
    handlers: [console, file]
    propagate: false
    
  src.core:
    level: INFO
    handlers: [console, file]
    propagate: false

root:
  level: WARNING
  handlers: [console]
```

---

## 📡 Log Aggregation with Loki

### Loki Configuration

```yaml
# docker/loki/loki-config.yml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1

schema_config:
  configs:
    - from: 2025-01-01
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/index
    cache_location: /loki/cache
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
```

### Promtail Configuration

```yaml
# docker/promtail/promtail-config.yml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: uip-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: uip
          __path__: /var/log/uip/*.log
    
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        target_label: container
```

---

## 📊 Grafana Log Visualization

### Log Dashboard

Access logs in Grafana at `http://localhost:3000`:

1. Navigate to **Explore**
2. Select **Loki** as data source
3. Use LogQL queries:

```logql
# All logs from accident detection agent
{job="uip"} |= "accident_detection"

# Error logs only
{job="uip"} | json | level="ERROR"

# Logs with specific camera
{job="uip"} |= "cam_001"

# Count errors per minute
count_over_time({job="uip"} | json | level="ERROR" [1m])
```

### Alert Rules

```yaml
# Grafana alert for high error rate
groups:
  - name: uip-logging-alerts
    rules:
      - alert: HighErrorRate
        expr: |
          sum(rate({job="uip"} | json | level="ERROR" [5m])) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          description: More than 10 errors per minute in the last 5 minutes
```

---

## 🔍 Debugging with Logs

### Enable Debug Logging

```bash
# Environment variable
export LOG_LEVEL=DEBUG

# Or in .env
LOG_LEVEL=DEBUG

# Restart services
docker compose restart backend
```

### Filter Logs by Component

```bash
# View specific agent logs
docker compose logs -f backend 2>&1 | grep "accident_detection"

# View only errors
docker compose logs -f backend 2>&1 | grep "ERROR"

# View with timestamps
docker compose logs -f -t backend
```

### Tail Log Files

```bash
# Tail main log
tail -f logs/orchestrator.log

# Tail with color highlighting
tail -f logs/orchestrator.log | grep --color -E 'ERROR|WARNING|$'

# Multiple files
tail -f logs/agents/*.log
```

---

## 🛡️ Best Practices

### Do's ✅

```python
# 1. Use appropriate log levels
logger.debug("Processing item %s", item_id)  # Not in production
logger.info("Completed processing batch of %d items", count)
logger.error("Failed to connect to database: %s", error)

# 2. Include context in log messages
logger.info("Camera %s processed %d frames in %.2fs", 
            camera_id, frame_count, duration)

# 3. Use lazy formatting (% not f-strings)
logger.debug("Large object: %s", large_object)  # Only formatted if DEBUG enabled

# 4. Log exceptions with traceback
try:
    process_data()
except Exception as e:
    logger.exception("Failed to process data")  # Includes traceback

# 5. Use structured logging for metrics
logger.info("metric", extra={
    "event": "frame_processed",
    "camera_id": camera_id,
    "duration_ms": duration * 1000,
    "frame_count": count
})
```

### Don'ts ❌

```python
# 1. Don't log sensitive data
logger.info(f"User logged in with password: {password}")  # BAD!

# 2. Don't use print statements
print("Debug message")  # Use logger instead

# 3. Don't log in tight loops without rate limiting
for item in millions_of_items:
    logger.debug(f"Processing {item}")  # Too many logs!

# 4. Don't ignore exceptions silently
try:
    process()
except Exception:
    pass  # BAD! At least log the error

# 5. Don't use f-strings for lazy evaluation
logger.debug(f"Expensive: {expensive_function()}")  # Always evaluated!
```

---

## 📚 Related Documentation

- **Monitoring Guide**: [Monitoring-Guide](Monitoring-Guide) - Metrics and dashboards
- **Performance Tuning**: [Performance-Tuning](Performance-Tuning) - Optimize logging overhead
- **Troubleshooting**: [Troubleshooting](Troubleshooting) - Debug common issues
- **Configuration**: [Configuration](Configuration) - All configuration options
