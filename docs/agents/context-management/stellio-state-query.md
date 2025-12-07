---
sidebar_position: 3
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: agents/context-management/stellio-state-query.md
Module: Context Management - Stellio State Query Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Stellio State Query Agent documentation for advanced query capabilities
  for the Stellio NGSI-LD context broker.
============================================================================
-->

# Stellio State Query Agent

The Stellio State Query Agent provides advanced query capabilities for the Stellio NGSI-LD context broker.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.context_management.stellio_state_query_agent` |
| **Class** | `StellioStateQueryAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Execute NGSI-LD queries** against Stellio
- **Support geo-queries** for spatial filtering
- **Handle temporal queries** for historical data
- **Optimize query performance** with caching

## 🚀 Usage

### Basic Query

```python
from src.agents.context_management.stellio_state_query_agent import StellioStateQueryAgent

query = StellioStateQueryAgent()

# Query by type
cameras = await query.get_by_type("TrafficCamera")

# Query by ID
camera = await query.get_by_id("urn:ngsi-ld:TrafficCamera:CAM_001")
```

### Geo-Query

```python
# Query within radius
nearby = await query.geo_query(
    entity_type="TrafficCamera",
    geo_property="location",
    geometry="Point",
    coordinates=[106.6297, 10.8231],
    georel="near;maxDistance==1000"  # 1km radius
)

# Query within polygon
in_area = await query.geo_query(
    entity_type="TrafficCamera",
    geo_property="location",
    geometry="Polygon",
    coordinates=[[[106.6, 10.8], [106.7, 10.8], [106.7, 10.9], [106.6, 10.9], [106.6, 10.8]]],
    georel="within"
)
```

### Temporal Query

```python
# Query historical values
history = await query.temporal_query(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attrs=["vehicleCount", "avgSpeed"],
    timerel="between",
    timeAt="2025-11-29T00:00:00Z",
    endTimeAt="2025-11-29T23:59:59Z"
)
```

### Complex Query

```python
# Query with multiple conditions
result = await query.query(
    entity_type="TrafficCamera",
    q="status==active;vehicleCount>50",
    georel="near;maxDistance==2000",
    geometry="Point",
    coordinates=[106.6297, 10.8231],
    attrs=["status", "vehicleCount", "location"]
)
```

## ⚙️ Configuration

```yaml
# config/stellio.yaml
stellio_query:
  enabled: true
  
  # Connection settings
  url: "http://localhost:8080"
  timeout_seconds: 30
  
  # Query defaults
  defaults:
    limit: 100
    offset: 0
    include_sysAttrs: false
  
  # Caching
  cache:
    enabled: true
    ttl_seconds: 60
    max_size: 1000
```

## 📊 Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `type` | Entity type filter | `TrafficCamera` |
| `attrs` | Attributes to return | `status,vehicleCount` |
| `q` | Query expression | `status==active` |
| `georel` | Geo relationship | `near;maxDistance==1000` |
| `geometry` | Geometry type | `Point`, `Polygon` |
| `coordinates` | Geo coordinates | `[106.6, 10.8]` |
| `timerel` | Temporal relation | `before`, `after`, `between` |

## 📖 Related Documentation

- [State Updater](state-updater) - Update operations
- [Entity Publisher](entity-publisher) - Entity creation
- [Temporal State Tracker](../state-management/temporal-state-tracker) - Time-series

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
