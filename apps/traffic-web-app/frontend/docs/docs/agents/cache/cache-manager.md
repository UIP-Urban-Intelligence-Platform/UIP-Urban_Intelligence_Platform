---
sidebar_label: 'Cache Manager'
title: 'Cache Manager Agent'
sidebar_position: 1
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Cache Manager Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/cache/cache-manager.md
Module: Cache Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Cache Manager Agent component.
============================================================================
-->

# Cache Manager Agent

The Cache Manager Agent provides distributed caching with Redis backend for improved performance across the UIP platform.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.cache.cache_manager_agent` |
| **Class** | `CacheManagerAgent` |
| **Author** | Nguyen Viet Hoang |
| **Version** | 1.0.0 |

## 🎯 Purpose

The Cache Manager Agent manages distributed caching to:

- **Reduce database load** by caching frequently accessed data
- **Improve response times** for API requests
- **Enable horizontal scaling** with shared cache state
- **Implement cache invalidation** strategies

## 🔧 Cache Strategies

### Write-Through

Updates cache immediately when data is written to the database.

```python
# Data written to DB and cache simultaneously
cache_manager.set("camera:CAM_001", camera_data, ttl=3600)
```

### Write-Behind (Async)

Asynchronous cache updates for better write performance.

```python
# Queue cache update for async processing
cache_manager.set_async("observations:latest", observations)
```

### Cache-Aside (Lazy Loading)

Load data into cache only on cache miss.

```python
# Check cache first, load from DB on miss
data = cache_manager.get_or_load("pattern:P001", loader_func)
```

## 📊 Architecture

```text
┌─────────────────┐    ┌─────────────────┐
│   API Request   │───▶│  Cache Manager  │
└─────────────────┘    └────────┬────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │  Redis   │ │  Local   │ │ Database │
             │  Cache   │ │  Cache   │ │ Fallback │
             └──────────┘ └──────────┘ └──────────┘
```

## 🚀 Usage

### Basic Usage

```python
from src.agents.cache.cache_manager_agent import CacheManagerAgent

# Initialize with configuration
config = {
    "enabled": True,
    "redis_host": "localhost",
    "redis_port": 6379,
    "default_ttl": 3600
}
cache_manager = CacheManagerAgent(config)

# Set value
cache_manager.set("key", {"data": "value"}, ttl=300)

# Get value
value = cache_manager.get("key")

# Delete value
cache_manager.delete("key")
```

### Cache Key Patterns

```python
# Entity caching
cache_manager.set("camera:CAM_001", camera_entity)
cache_manager.set("observation:OBS_001", observation)

# Query result caching
cache_manager.set("query:accidents:severe", results, ttl=60)

# Aggregation caching
cache_manager.set("stats:hourly:2025-11-29T10", hourly_stats)
```

## ⚙️ Configuration

### Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=1
```

### YAML Configuration

```yaml
# config/cache_config.yaml
cache:
  enabled: true
  redis_host: localhost
  redis_port: 6379
  redis_db: 1
  default_ttl: 3600
  
  # TTL by category
  ttl_settings:
    cameras: 300
    observations: 60
    patterns: 600
    statistics: 3600
```

## 📈 Performance Metrics

The Cache Manager tracks:

- **Hit Rate**: Percentage of successful cache hits
- **Miss Rate**: Percentage of cache misses
- **Latency**: Average cache operation latency
- **Memory Usage**: Redis memory consumption

## 🔄 Cache Invalidation

### Manual Invalidation

```python
# Invalidate single key
cache_manager.delete("camera:CAM_001")

# Invalidate by pattern
cache_manager.delete_pattern("camera:*")

# Clear all cache
cache_manager.flush()
```

### Automatic Invalidation

TTL-based expiration ensures stale data is automatically removed.

## 🛡️ Fallback Behavior

When Redis is unavailable, the agent falls back to:

1. **In-memory cache** for local operations
2. **Direct database queries** for critical data
3. **Graceful degradation** without errors

## 📖 Related Documentation

- [Cache Invalidator Agent](cache-invalidator) - Cache invalidation strategies
- [Performance Monitor](../monitoring/performance-monitor) - Cache performance tracking
- [Redis Configuration](../../installation/environment-config) - Redis setup

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
