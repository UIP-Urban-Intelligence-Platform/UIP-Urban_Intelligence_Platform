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
File: agents/state-management/accident-state-manager.md
Module: State Management - Accident State Manager Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Accident State Manager Agent documentation for handling the lifecycle
  and state transitions of traffic accidents.
============================================================================
-->

# Accident State Manager Agent

The Accident State Manager Agent handles the lifecycle and state transitions of traffic accidents from detection to resolution.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.state_management.accident_state_manager_agent` |
| **Class** | `AccidentStateManagerAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Track accident lifecycle** from detection to resolution
- **Manage state transitions** with validation rules
- **Coordinate response workflows** based on state changes
- **Maintain accident history** for analytics

## 📊 Accident States

| State | Description | Next States |
|-------|-------------|-------------|
| `detected` | Initial detection by CV analysis | confirmed, false_positive |
| `confirmed` | Verified by additional data | responding, resolved |
| `responding` | Emergency services dispatched | resolved |
| `resolved` | Accident cleared | - |
| `false_positive` | Detection was incorrect | - |

### State Machine

```text
┌──────────┐
│ detected │
└────┬─────┘
     │
     ├─────────────────────┐
     ▼                     ▼
┌──────────┐        ┌─────────────┐
│confirmed │        │false_positive│
└────┬─────┘        └─────────────┘
     │
     ├───────────────┐
     ▼               ▼
┌───────────┐   ┌──────────┐
│responding │──▶│ resolved │
└───────────┘   └──────────┘
```

## 🚀 Usage

### Create Accident

```python
from src.agents.state_management.accident_state_manager_agent import AccidentStateManagerAgent

manager = AccidentStateManagerAgent()

# Create new accident
accident = manager.create_accident({
    "id": "ACC_001",
    "location": {"lat": 10.762, "lon": 106.660},
    "severity": "moderate",
    "detected_by": "CAM_025",
    "timestamp": "2025-11-29T10:30:00Z"
})
```

### Transition State

```python
# Confirm accident
manager.transition(
    accident_id="ACC_001",
    to_state="confirmed",
    metadata={
        "confirmed_by": "operator_1",
        "confirmation_source": "visual_verification"
    }
)

# Mark as responding
manager.transition(
    accident_id="ACC_001",
    to_state="responding",
    metadata={
        "response_unit": "UNIT_12",
        "eta_minutes": 5
    }
)

# Resolve accident
manager.transition(
    accident_id="ACC_001",
    to_state="resolved",
    metadata={
        "resolution_time": "2025-11-29T11:00:00Z",
        "lane_cleared": True
    }
)
```

### Query Accidents

```python
# Get active accidents
active = manager.get_by_state(["detected", "confirmed", "responding"])

# Get accident history
history = manager.get_state_history("ACC_001")

# Get accidents by location
nearby = manager.get_by_location(
    lat=10.762,
    lon=106.660,
    radius_km=1.0
)
```

## ⚙️ Configuration

```yaml
# config/accident_config.yaml
accident_state_manager:
  enabled: true
  
  # State definitions
  states:
    detected:
      auto_expire_minutes: 30
      allowed_transitions:
        - confirmed
        - false_positive
    
    confirmed:
      allowed_transitions:
        - responding
        - resolved
    
    responding:
      allowed_transitions:
        - resolved
    
    resolved:
      final: true
    
    false_positive:
      final: true
  
  # Notifications
  notifications:
    on_detected:
      - alert_dispatcher
      - dashboard
    on_confirmed:
      - emergency_services
      - traffic_management
    on_resolved:
      - analytics
      - reporting
```

## 📈 Events

| Event | Trigger | Payload |
|-------|---------|---------|
| `accident.detected` | New detection | accident details |
| `accident.confirmed` | Confirmation | verification info |
| `accident.response_started` | Response begins | unit details |
| `accident.resolved` | Accident cleared | resolution details |

## 📖 Related Documentation

- [Accident Detection Agent](../analytics/accident-detection) - Detection logic
- [Alert Dispatcher](../notification/alert-dispatcher) - Alerting
- [Congestion State Manager](congestion-state-manager) - Related congestion

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
