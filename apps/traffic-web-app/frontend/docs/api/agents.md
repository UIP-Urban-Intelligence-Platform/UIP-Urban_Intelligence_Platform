<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Agent API reference documentation.

Module: apps/traffic-web-app/frontend/docs/api/agents.md
Author: UIP Team
Version: 1.0.0
-->

# Agent API Reference - PRODUCTION READY

✅ **Complete API documentation for all production agents.**

## 📋 Table of Contents
1. [Data Collection Agents](#data-collection)
2. [Analytics Agents](#analytics)
3. [Context Management Agents](#context)
4. [Transformation Agents](#transformation)
5. [Cache & State Management](#cache-state)
6. [Notification Agents](#notification)
7. [Graph Database Agents](#graph)
8. [Monitoring Agents](#monitoring)

---

## 1. Data Collection Agents {#data-collection}

### ImageRefreshAgent
**Module:** `src.agents.data_collection.image_refresh_agent`

```python
from src.agents.data_collection.image_refresh_agent import ImageRefreshAgent

agent = ImageRefreshAgent(config={
    "enabled": True,
    "camera_sources": ["data/cameras_raw.json"],
    "refresh_interval": 300  # seconds
})

result = agent.run()
# Returns: {"status": "success", "images_refreshed": 42}
```

---

## 2. Analytics Agents {#analytics}

### AccidentDetectionAgent
```python
from src.agents.analytics.accident_detection_agent import AccidentDetectionAgent

agent = AccidentDetectionAgent(config={
    "enabled": True,
    "model_path": "yolox_x.pt",
    "confidence_threshold": 0.6
})

detections = agent.run()
```

**Methods:**
- `detect_accidents(observations: List[Dict]) -> List[Dict]`
- `classify_severity(accident: Dict) -> str`

**Detection Algorithm:**
- Speed drop > 40 km/h + density increase > 30%
- Severity: minor | moderate | severe

### CongestionDetectionAgent
```python
from src.agents.analytics.congestion_detection_agent import CongestionDetectionAgent

agent = CongestionDetectionAgent(config={"enabled": True})
result = agent.run()
```

**Methods:**
- `analyze_traffic(observations: List[Dict]) -> Dict`
- `calculate_congestion_level(speed: float) -> str`

**Congestion Levels:**
- `FREE_FLOW`: 0-20% utilization
- `LIGHT`: 20-40%
- `MODERATE`: 40-60%
- `HEAVY`: 60-80%
- `SEVERE`: 80-100%

### PatternRecognitionAgent
```python
patterns = agent.run()
# Returns: [{"zone": "zone1", "hour": 8, "pattern": "rush_hour", "count": 5}]
```

---

## 3. State Management Agents {#cache-state}

### StateManagerAgent
```python
from src.agents.state_management.state_manager_agent import StateManagerAgent

manager = StateManagerAgent(config={
    "enabled": True,
    "redis_host": "localhost",
    "redis_port": 6379
})

# Redis operations with optimistic locking
state = manager.get_state("entity_id")
manager.set_state("entity_id", data, version=1, ttl=3600)
```

**Redis Configuration:**
- Connection pool: max 10 connections
- Socket keepalive enabled
- Automatic fallback to in-memory

### AccidentStateManagerAgent
```python
from src.agents.state_management.accident_state_manager_agent import AccidentStateManager

manager = AccidentStateManager(config={"enabled": True})
result = manager.run()  # Process state transitions
```

**State Machine:**
```
DETECTED → CONFIRMED → ACTIVE → RESOLVING → RESOLVED → ARCHIVED
```

**Methods:**
- `create_accident(accident_data)` → Initialize new accident
- `update_accident_state(accident_id, new_state)` → Transition state
- `get_active_accidents()` → List all active incidents

---

## 4. Graph Database Agents {#graph}

### Neo4jSyncAgent
```python
from src.agents.graph_database.neo4j_sync_agent import Neo4jSyncAgent

sync = Neo4jSyncAgent(config={
    "enabled": True,
    "uri": "bolt://localhost:7687",
    "user": "neo4j",
    "password": "***",
    "max_pool_size": 50
})

result = sync.sync_camera(camera_entity)
```

**Features:**
- verify_connectivity() health check
- Session management with auto-cleanup
- Parameterized Cypher queries

### Neo4jQueryAgent
```python
nearby = agent.find_nearby(lat=10.762, lon=106.660, radius=1000)
hotspots = agent.find_accident_patterns(min_count=5)
```

**Query Types:**
- Spatial: point.distance() queries
- Pattern: Hotspot detection
- Centrality: GDS algorithms

---

## 5. Notification Handlers {#notification}

### EmailNotificationHandler
```python
from src.agents.notification.email_notification_handler import EmailNotificationHandler

handler = EmailNotificationHandler(config={
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "alerts@example.com",
    "rate_limit": 100  # emails/hour
})

handler.send_alert_email("user@example.com", alert)
```

**Features:**
- SMTP with TLS
- HTML email support
- Attachment support (MIMEApplication)
- Rate limiting: 100 emails/hour

### WebhookNotificationHandler
```python
from src.agents.notification.webhook_notification_handler import WebhookNotificationHandler

handler = WebhookNotificationHandler(config={"enabled": True})
handler.send_alert_webhook("https://webhook.example.com", alert)
```

**Features:**
- Retry strategy: 3 attempts, exponential backoff
- Circuit breaker: Opens after 5 failures
- HMAC signature generation
- Connection pooling with requests.Session()

---

## 6. Cache Agents {#cache}

### CacheManagerAgent
```python
from src.agents.cache.cache_manager_agent import CacheManagerAgent

cache = CacheManagerAgent(config={
    "enabled": True,
    "redis_db": 1,
    "default_ttl": 3600
})

cache.set("key", value, ttl=300)
data = cache.get("key")
cache.delete("key")
```

**Redis Configuration:**
- Connection pool: max 20 connections
- Database: 1 (separate from state)
- Fallback: In-memory dict

### CacheInvalidatorAgent
```python
agent = CacheInvalidatorAgent(config={"enabled": True})
agent.invalidate_pattern("camera:*")  # Pattern-based deletion
```

**Features:**
- Redis pub/sub: `cache_invalidation` channel
- SCAN-based deletion
- Cascade invalidation

---

## 7. Monitoring Agents {#monitoring}

### PerformanceMonitorAgent
**Metrics:**
- Agent execution time
- Memory usage
- Cache hit rate
- API response time

### HealthCheckAgent
**Health Checks:**
- PostgreSQL: pg_isready
- Redis: PING
- Stellio: HTTP health endpoint
- Neo4j: Cypher test query
