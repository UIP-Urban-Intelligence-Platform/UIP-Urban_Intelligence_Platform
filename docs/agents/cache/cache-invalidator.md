---
sidebar_position: 2
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: agents/cache/cache-invalidator.md
Module: Cache - Cache Invalidator Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Cache Invalidator Agent documentation for intelligent cache invalidation
  strategies to maintain data consistency across the platform.
============================================================================
-->

# Cache Invalidator Agent

The Cache Invalidator Agent handles intelligent cache invalidation strategies to maintain data consistency across the platform.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.cache.cache_invalidator_agent` |
| **Class** | `CacheInvalidatorAgent` |
| **Author** | Nguyen Viet Hoang |
| **Version** | 1.0.0 |

## 🎯 Purpose

Cache invalidation ensures data consistency by:

- **Removing stale data** when source data changes
- **Propagating updates** across distributed cache nodes
- **Maintaining consistency** between cache and database
- **Optimizing memory** by removing unused entries

## 🔧 Invalidation Strategies

### Time-Based Invalidation (TTL)

```python
# Set TTL during caching
cache.set("camera:CAM_001", data, ttl=300)  # Expires in 5 minutes
```

### Event-Based Invalidation

```python
# Invalidate on data change event
invalidator.on_entity_update("camera:CAM_001")
invalidator.on_entity_delete("camera:CAM_001")
```

### Pattern-Based Invalidation

```python
# Invalidate all matching keys
invalidator.invalidate_pattern("observation:*")
invalidator.invalidate_pattern("camera:CAM_00*")
```

### Dependency-Based Invalidation

```python
# Invalidate dependent caches
invalidator.invalidate_with_dependencies("camera:CAM_001", [
    "observations:CAM_001:*",
    "stats:CAM_001:*"
])
```

## 📊 Architecture

```text
┌─────────────────┐
│ Data Change     │
│ Event           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   Invalidator   │───▶│  Cache Manager  │
└────────┬────────┘    └─────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ Redis │ │ Local │
│ Cache │ │ Cache │
└───────┘ └───────┘
```

## 🚀 Usage

### Basic Invalidation

```python
from src.agents.cache.cache_invalidator_agent import CacheInvalidatorAgent

invalidator = CacheInvalidatorAgent()

# Invalidate single key
invalidator.invalidate("camera:CAM_001")

# Invalidate multiple keys
invalidator.invalidate_many([
    "camera:CAM_001",
    "camera:CAM_002"
])

# Invalidate by pattern
invalidator.invalidate_pattern("observation:2025-11-*")
```

### Event-Driven Invalidation

```python
# Subscribe to entity changes
invalidator.subscribe_to_changes([
    "Camera",
    "Observation",
    "Accident"
])

# Handle change event
def on_camera_update(entity_id: str):
    invalidator.invalidate(f"camera:{entity_id}")
    invalidator.invalidate_pattern(f"observations:{entity_id}:*")
```

## ⚙️ Configuration

```yaml
# config/cache_config.yaml
cache_invalidation:
  enabled: true
  
  # Invalidation strategies
  strategies:
    time_based:
      default_ttl: 3600
      camera_ttl: 300
      observation_ttl: 60
    
    event_based:
      enabled: true
      entity_types:
        - Camera
        - Observation
        - Accident
        - Congestion
    
    pattern_based:
      batch_size: 1000
      scan_count: 100
```

## 📈 Metrics

| Metric | Description |
|--------|-------------|
| `invalidations_total` | Total invalidation operations |
| `invalidations_by_pattern` | Pattern-based invalidations |
| `invalidation_latency` | Average invalidation time |
| `cascade_invalidations` | Dependency cascade operations |

## 🛡️ Best Practices

### 1. Use Specific Keys

```python
# Good: Specific key
invalidator.invalidate("camera:CAM_001:location")

# Avoid: Broad pattern
invalidator.invalidate_pattern("camera:*")
```

### 2. Batch Invalidations

```python
# Batch for better performance
invalidator.invalidate_many(key_list)
```

### 3. Log Invalidations

```python
# Enable audit logging
invalidator.set_audit_logging(True)
```

## 📖 Related Documentation

- [Cache Manager Agent](cache-manager) - Primary caching operations
- [State Updater Agent](../context-management/state-updater) - State change handling
- [Entity Publisher Agent](../context-management/entity-publisher) - Entity updates

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
