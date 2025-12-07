---
sidebar_position: 4
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Temporal State Tracker Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/state-management/temporal-state-tracker.md
Module: State Management Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Temporal State Tracker Agent component.
============================================================================
-->

# Temporal State Tracker Agent

The Temporal State Tracker Agent maintains time-series state data with NGSI-LD temporal compliance.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.state_management.temporal_state_tracker_agent` |
| **Class** | `TemporalStateTrackerAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Track state history** with precise timestamps
- **Maintain NGSI-LD temporal** representations
- **Enable time-travel queries** for historical analysis
- **Support temporal aggregations** and analytics

## 🚀 Usage

### Initialize Tracker

```python
from src.agents.state_management.temporal_state_tracker_agent import TemporalStateTrackerAgent

tracker = TemporalStateTrackerAgent()

# Record state change
tracker.record_state(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attribute="status",
    value="active",
    observed_at="2025-11-29T10:30:00Z"
)
```

### Query Historical States

```python
# Get state at specific time
state = tracker.get_state_at(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    timestamp="2025-11-29T10:00:00Z"
)

# Get state history
history = tracker.get_history(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attribute="vehicleCount",
    start_time="2025-11-29T00:00:00Z",
    end_time="2025-11-29T23:59:59Z"
)
```

### Temporal Aggregations

```python
# Aggregate by time interval
aggregated = tracker.aggregate(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attribute="vehicleCount",
    interval="1h",
    aggregation="avg",
    time_range="24h"
)

# Result: hourly averages
# [
#     {"time": "2025-11-29T00:00:00Z", "value": 45.2},
#     {"time": "2025-11-29T01:00:00Z", "value": 23.8},
#     ...
# ]
```

## ⚙️ Configuration

```yaml
# config/temporal_config.yaml
temporal_state_tracker:
  enabled: true
  
  # Storage settings
  storage:
    backend: "timescaledb"  # timescaledb, mongodb, stellio
    retention_days: 365
    compression: true
  
  # Resolution settings
  resolution:
    default: "1m"  # 1 minute
    min: "1s"
    max: "1h"
  
  # Aggregation presets
  aggregations:
    - interval: "5m"
      functions: ["avg", "min", "max"]
    - interval: "1h"
      functions: ["avg", "min", "max", "sum", "count"]
    - interval: "1d"
      functions: ["avg", "min", "max", "sum", "count"]
```

## 📊 NGSI-LD Temporal Format

### Temporal Entity Representation

```json
{
  "id": "urn:ngsi-ld:TrafficCamera:CAM_001",
  "type": "TrafficCamera",
  "vehicleCount": [
    {
      "type": "Property",
      "value": 42,
      "observedAt": "2025-11-29T10:30:00Z"
    },
    {
      "type": "Property",
      "value": 45,
      "observedAt": "2025-11-29T10:31:00Z"
    }
  ]
}
```

### Temporal Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `timerel` | Temporal relation | `before`, `after`, `between` |
| `timeAt` | Reference time | `2025-11-29T10:00:00Z` |
| `endTimeAt` | End time for `between` | `2025-11-29T12:00:00Z` |
| `timeproperty` | Property to use | `observedAt`, `createdAt` |

## 📈 Analytics Queries

### Time-Based Analysis

```python
# Peak hour detection
peak_hours = tracker.find_peaks(
    entity_type="TrafficCamera",
    attribute="vehicleCount",
    time_range="7d",
    top_n=5
)

# Trend analysis
trend = tracker.analyze_trend(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attribute="vehicleCount",
    time_range="30d"
)
# {"direction": "increasing", "rate": 2.3, "confidence": 0.85}
```

## 📖 Related Documentation

- [NGSI-LD Transformer](../transformation/ngsi-ld-transformer) - Entity transformation
- [Temporal Data Manager](../context-management/temporal-data-manager) - Stellio temporal
- [State Manager](state-manager) - Core state management

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
