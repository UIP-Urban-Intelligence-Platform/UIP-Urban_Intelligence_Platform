---
sidebar_label: 'Congestion State Manager'
title: 'Congestion State Manager Agent'
sidebar_position: 3
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Congestion State Manager Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/state-management/congestion-state-manager.md
Module: State Management Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Congestion State Manager Agent component.
============================================================================
-->

# Congestion State Manager Agent

The Congestion State Manager Agent tracks the lifecycle of traffic congestion zones from formation to clearance.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.state_management.congestion_state_manager_agent` |
| **Class** | `CongestionStateManagerAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Track congestion lifecycle** from formation to clearance
- **Monitor congestion levels** (light, moderate, heavy, severe)
- **Correlate with accidents** and other events
- **Provide predictive insights** for congestion duration

## 📊 Congestion States

| State | Description | Triggers |
|-------|-------------|----------|
| `forming` | Congestion beginning to form | Speed drops below threshold |
| `active` | Congestion fully established | Sustained low speeds |
| `dissipating` | Congestion clearing | Speeds improving |
| `cleared` | Congestion resolved | Normal flow restored |

### Congestion Levels

| Level | Speed Reduction | Color |
|-------|-----------------|-------|
| Light | 20-40% | Yellow |
| Moderate | 40-60% | Orange |
| Heavy | 60-80% | Red |
| Severe | 80%+ | Dark Red |

## 🚀 Usage

### Track Congestion

```python
from src.agents.state_management.congestion_state_manager_agent import CongestionStateManagerAgent

manager = CongestionStateManagerAgent()

# Create congestion zone
congestion = manager.create_congestion({
    "id": "CONG_001",
    "affected_roads": ["Road_A", "Road_B"],
    "affected_cameras": ["CAM_001", "CAM_002", "CAM_003"],
    "level": "moderate",
    "avg_speed": 15,  # km/h
    "normal_speed": 50,
    "estimated_duration_minutes": 30
})
```

### Update Level

```python
# Update congestion level
manager.update_level(
    congestion_id="CONG_001",
    level="heavy",
    avg_speed=8
)

# Mark as dissipating
manager.transition(
    congestion_id="CONG_001",
    to_state="dissipating"
)
```

### Query Congestion

```python
# Get active congestion
active = manager.get_active()

# Get by road
road_congestion = manager.get_by_road("Road_A")

# Get historical patterns
patterns = manager.get_patterns(
    time_range="7d",
    location="district_1"
)
```

## ⚙️ Configuration

```yaml
# config/congestion_config.yaml
congestion_state_manager:
  enabled: true
  
  # Level thresholds (speed reduction %)
  levels:
    light:
      min: 20
      max: 40
    moderate:
      min: 40
      max: 60
    heavy:
      min: 60
      max: 80
    severe:
      min: 80
      max: 100
  
  # State transitions
  transitions:
    forming:
      timeout_minutes: 10
      auto_transition: active
    active:
      min_duration_minutes: 5
    dissipating:
      timeout_minutes: 15
      auto_transition: cleared
  
  # Correlation settings
  correlation:
    accident_radius_km: 2.0
    include_nearby_cameras: true
```

## 📈 Analytics

### Duration Statistics

```python
# Get average duration by level
stats = manager.get_duration_stats()
# {
#     "light": {"avg_minutes": 15, "max": 45},
#     "moderate": {"avg_minutes": 30, "max": 90},
#     "heavy": {"avg_minutes": 45, "max": 120},
#     "severe": {"avg_minutes": 60, "max": 180}
# }
```

### Prediction

```python
# Predict congestion duration
prediction = manager.predict_duration("CONG_001")
print(f"Estimated clearance: {prediction['estimated_clear_time']}")
print(f"Confidence: {prediction['confidence']}%")
```

## 📖 Related Documentation

- [Congestion Detection Agent](../analytics/congestion-detection) - Detection logic
- [Accident State Manager](accident-state-manager) - Accident correlation
- [Pattern Recognition](../analytics/pattern-recognition) - Pattern analysis

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
