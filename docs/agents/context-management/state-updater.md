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
File: agents/context-management/state-updater.md
Module: Context Management - State Updater Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  State Updater Agent documentation for synchronizing local entity states
  with the NGSI-LD context broker (Stellio).
============================================================================
-->

# State Updater Agent

The State Updater Agent synchronizes local entity states with the NGSI-LD context broker (Stellio).

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.context_management.state_updater_agent` |
| **Class** | `StateUpdaterAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Synchronize entity states** with Stellio context broker
- **Batch updates** for efficiency
- **Handle conflicts** and version management
- **Maintain consistency** between local and remote state

## 🚀 Usage

### Update Entity State

```python
from src.agents.context_management.state_updater_agent import StateUpdaterAgent

updater = StateUpdaterAgent()

# Update single entity
await updater.update(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    attributes={
        "status": {"value": "active"},
        "vehicleCount": {"value": 42}
    }
)
```

### Batch Updates

```python
# Batch update multiple entities
updates = [
    {
        "id": "urn:ngsi-ld:TrafficCamera:CAM_001",
        "status": {"value": "active"}
    },
    {
        "id": "urn:ngsi-ld:TrafficCamera:CAM_002",
        "status": {"value": "offline"}
    }
]

result = await updater.batch_update(updates)
print(f"Updated: {result['success']}, Failed: {result['failed']}")
```

### Upsert Pattern

```python
# Create or update entity
await updater.upsert(
    entity={
        "id": "urn:ngsi-ld:TrafficCamera:CAM_003",
        "type": "TrafficCamera",
        "location": {
            "type": "GeoProperty",
            "value": {"type": "Point", "coordinates": [106.6297, 10.8231]}
        }
    }
)
```

## ⚙️ Configuration

```yaml
# config/state_updater_config.yaml
state_updater:
  enabled: true
  
  # Stellio connection
  stellio:
    url: "http://localhost:8080"
    tenant: "urn:ngsi-ld:tenant:hcmc"
  
  # Batch settings
  batch:
    size: 100
    timeout_seconds: 30
    retry_failed: true
  
  # Conflict resolution
  conflict:
    strategy: "last-write-wins"  # last-write-wins, merge, reject
    timestamp_field: "modifiedAt"
  
  # Update mode
  update:
    mode: "patch"  # patch, replace
    include_observed_at: true
```

## 🔄 Update Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `patch` | Update only specified attributes | Incremental updates |
| `replace` | Replace all attributes | Full state sync |
| `append` | Add to multi-valued attributes | Historical data |

## 📖 Related Documentation

- [Entity Publisher](entity-publisher) - Entity creation
- [Stellio State Query](stellio-state-query) - Query operations
- [NGSI-LD Transformer](../transformation/ngsi-ld-transformer) - Entity format

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
