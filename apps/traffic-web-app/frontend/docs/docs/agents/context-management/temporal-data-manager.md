---
sidebar_position: 4
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Temporal Data Manager Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/context-management/temporal-data-manager.md
Module: Context Management Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Temporal Data Manager Agent component.
============================================================================
-->

# Temporal Data Manager Agent

The Temporal Data Manager Agent handles NGSI-LD temporal entity representations in Stellio.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.context_management.temporal_data_manager_agent` |
| **Class** | `TemporalDataManagerAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Manage temporal entity instances** in Stellio
- **Handle time-series attributes** with proper NGSI-LD format
- **Support temporal operations** (append, delete, modify)
- **Optimize storage** with retention policies

## 🚀 Usage

### Append Temporal Values

```python
from src.agents.context_management.temporal_data_manager_agent import TemporalDataManagerAgent

manager = TemporalDataManagerAgent()

# Append temporal attribute value
await manager.append_temporal(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attribute="vehicleCount",
    value=42,
    observed_at="2025-11-29T10:30:00Z"
)
```

### Batch Append

```python
# Append multiple values
values = [
    {"observed_at": "2025-11-29T10:30:00Z", "value": 42},
    {"observed_at": "2025-11-29T10:31:00Z", "value": 45},
    {"observed_at": "2025-11-29T10:32:00Z", "value": 48}
]

await manager.batch_append(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attribute="vehicleCount",
    values=values
)
```

### Query Temporal Data

```python
# Get temporal evolution
evolution = await manager.get_temporal_evolution(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attrs=["vehicleCount", "avgSpeed"],
    timerel="between",
    timeAt="2025-11-29T00:00:00Z",
    endTimeAt="2025-11-29T23:59:59Z"
)
```

### Delete Temporal Data

```python
# Delete temporal values in range
await manager.delete_temporal_range(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attribute="vehicleCount",
    deleteAll=False,
    timerel="before",
    timeAt="2025-11-20T00:00:00Z"
)
```

## ⚙️ Configuration

```yaml
# config/temporal_config.yaml
temporal_data_manager:
  enabled: true
  
  # Stellio temporal settings
  stellio:
    url: "http://localhost:8080"
    temporal_api: "/ngsi-ld/v1/temporal/entities"
  
  # Retention policy
  retention:
    enabled: true
    default_days: 365
    high_frequency_days: 30  # For per-minute data
  
  # Batch settings
  batch:
    max_size: 1000
    timeout_seconds: 60
```

## 📊 Temporal API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/temporal/entities` | POST | Create temporal entity |
| `/temporal/entities/{id}` | GET | Get temporal entity |
| `/temporal/entities/{id}/attrs` | POST | Append temporal values |
| `/temporal/entities/{id}/attrs/{attr}` | DELETE | Delete temporal values |

## 📖 Related Documentation

- [Stellio State Query](stellio-state-query) - Query operations
- [Temporal State Tracker](../state-management/temporal-state-tracker) - Local tracking
- [NGSI-LD Transformer](../transformation/ngsi-ld-transformer) - Entity format

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
