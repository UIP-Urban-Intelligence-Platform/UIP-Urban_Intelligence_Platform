---
sidebar_position: 1
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: agents/state-management/state-manager.md
Module: State Management - State Manager Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  State Manager Agent documentation for centralized state management
  for traffic entities across the platform.
============================================================================
-->

# State Manager Agent

The State Manager Agent provides centralized state management for traffic entities across the platform.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.state_management.state_manager_agent` |
| **Class** | `StateManagerAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

The State Manager Agent handles:

- **Centralized state storage** for all traffic entities
- **State transitions** with validation
- **Event sourcing** for state history
- **State synchronization** across services

## 📊 State Model

### Entity States

| Entity Type | Possible States |
|-------------|-----------------|
| Camera | active, inactive, maintenance, offline |
| Observation | pending, validated, published, archived |
| Accident | detected, confirmed, responding, resolved |
| Congestion | forming, active, dissipating, cleared |

### State Transitions

```text
Camera State Machine:
                    
    ┌──────────────────────────┐
    ▼                          │
┌────────┐   activate    ┌─────┴────┐
│inactive│──────────────▶│  active  │
└────┬───┘               └────┬─────┘
     │                        │
     │ maintenance     offline│
     ▼                        ▼
┌────────────┐         ┌──────────┐
│maintenance │         │ offline  │
└────────────┘         └──────────┘
```

## 🔧 Architecture

```text
┌─────────────────────────────────────────────┐
│            State Manager Agent              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
│  │  State  │  │ Event   │  │    State    │ │
│  │  Store  │  │ Source  │  │  Validator  │ │
│  └────┬────┘  └────┬────┘  └──────┬──────┘ │
│       │            │              │         │
│       └────────────┼──────────────┘         │
│                    ▼                        │
│           ┌───────────────┐                 │
│           │ State Machine │                 │
│           └───────┬───────┘                 │
│                   │                         │
│       ┌───────────┼───────────┐            │
│       ▼           ▼           ▼            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  Redis  │ │ MongoDB │ │  Event  │       │
│  │  Cache  │ │  Store  │ │  Bus    │       │
│  └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘
```

## 🚀 Usage

### Get State

```python
from src.agents.state_management.state_manager_agent import StateManagerAgent

state_manager = StateManagerAgent()

# Get current state
state = state_manager.get_state("camera:CAM_001")
print(f"Current state: {state['status']}")
```

### Update State

```python
# Update state with transition
state_manager.transition(
    entity_id="camera:CAM_001",
    from_state="inactive",
    to_state="active",
    metadata={"activated_by": "system"}
)
```

### State History

```python
# Get state history
history = state_manager.get_history(
    entity_id="camera:CAM_001",
    limit=10
)

for event in history:
    print(f"{event['timestamp']}: {event['from_state']} -> {event['to_state']}")
```

## ⚙️ Configuration

```yaml
# config/state_manager_config.yaml
state_manager:
  enabled: true
  
  # Storage backends
  storage:
    primary: redis
    persistent: mongodb
  
  # State definitions
  entities:
    camera:
      states:
        - active
        - inactive
        - maintenance
        - offline
      transitions:
        inactive:
          - active
          - maintenance
        active:
          - inactive
          - offline
        maintenance:
          - active
          - inactive
        offline:
          - active
    
    accident:
      states:
        - detected
        - confirmed
        - responding
        - resolved
      transitions:
        detected:
          - confirmed
          - resolved
        confirmed:
          - responding
          - resolved
        responding:
          - resolved
  
  # Event sourcing
  event_sourcing:
    enabled: true
    retention_days: 30
```

## 📈 State Events

### Event Types

| Event | Description |
|-------|-------------|
| `state.created` | New entity state created |
| `state.updated` | State transition occurred |
| `state.deleted` | Entity state removed |

### Event Publishing

```python
# Subscribe to state changes
state_manager.subscribe("camera:*", on_camera_state_change)

# Handler function
def on_camera_state_change(event):
    print(f"Camera {event['entity_id']} changed to {event['new_state']}")
```

## 📖 Related Documentation

- [Accident State Manager](accident-state-manager) - Accident state handling
- [Congestion State Manager](congestion-state-manager) - Congestion state handling
- [Temporal State Tracker](temporal-state-tracker) - Time-based state tracking

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
