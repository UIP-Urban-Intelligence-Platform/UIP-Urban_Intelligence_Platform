---
sidebar_label: 'Image Refresh'
title: 'Image Refresh Agent'
sidebar_position: 4
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Image Refresh Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/data-collection/image-refresh.md
Module: Data Collection Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Image Refresh Agent component.
============================================================================
-->

# Image Refresh Agent

The Image Refresh Agent manages periodic refresh of traffic camera images for real-time monitoring.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.data_collection.image_refresh_agent` |
| **Class** | `ImageRefreshAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Refresh camera images** at configurable intervals
- **Monitor image availability** and quality
- **Trigger CV analysis** on new images
- **Manage image storage** and lifecycle

## 🚀 Usage

### Start Image Refresh

```python
from src.agents.data_collection.image_refresh_agent import ImageRefreshAgent

agent = ImageRefreshAgent()

# Start refresh for all cameras
await agent.start_refresh(
    interval_seconds=30,
    cameras="all"
)
```

### Refresh Specific Cameras

```python
# Refresh specific cameras
await agent.refresh_cameras([
    "CAM_001", "CAM_002", "CAM_003"
])

# Refresh by zone
await agent.refresh_zone("district_1")
```

### Get Image Status

```python
# Get refresh status
status = await agent.get_status()
# {
#     "total_cameras": 150,
#     "active": 145,
#     "failed": 3,
#     "offline": 2,
#     "last_refresh": "2025-11-29T10:30:00Z"
# }
```

## ⚙️ Configuration

```yaml
# config/cv_config.yaml
image_refresh:
  enabled: true
  
  # Refresh settings
  refresh:
    default_interval_seconds: 30
    priority_interval_seconds: 10  # For high-priority cameras
    max_concurrent: 50
  
  # Image settings
  image:
    format: "jpeg"
    quality: 85
    max_size_kb: 500
  
  # Storage
  storage:
    local_path: "data/images"
    retention_hours: 24
  
  # Failure handling
  failure:
    max_retries: 3
    retry_delay_seconds: 5
    offline_threshold: 5  # Mark offline after N failures
```

## 📊 Image Events

| Event | Description | Trigger |
|-------|-------------|---------|
| `image.refreshed` | New image captured | Successful refresh |
| `image.failed` | Refresh failed | Network/camera error |
| `camera.offline` | Camera marked offline | Multiple failures |
| `camera.online` | Camera back online | Successful after offline |

## 🔄 Integration with CV

```python
# Register CV analysis callback
agent.on_refresh(lambda camera_id, image: 
    cv_agent.analyze(camera_id, image)
)
```

## 📖 Related Documentation

- [Camera Image Fetch](camera-image-fetch) - Initial image fetch
- [CV Analysis Agent](../analytics/cv-analysis) - Computer vision analysis
- [Pattern Recognition](../analytics/pattern-recognition) - Traffic patterns

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
