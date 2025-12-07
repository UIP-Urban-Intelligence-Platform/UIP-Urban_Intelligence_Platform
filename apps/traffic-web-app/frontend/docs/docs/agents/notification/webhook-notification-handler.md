---
sidebar_position: 5
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Webhook Notification Handler Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/notification/webhook-notification-handler.md
Module: Notification Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Webhook Notification Handler Agent component.
============================================================================
-->

# Webhook Notification Handler Agent

The Webhook Notification Handler Agent delivers notifications to external systems via HTTP webhooks.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.notification.webhook_notification_handler_agent` |
| **Class** | `WebhookNotificationHandlerAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Deliver notifications** to external HTTP endpoints
- **Support various authentication** methods
- **Handle retries** for failed deliveries
- **Track delivery status** and metrics

## 🚀 Usage

### Register Webhook

```python
from src.agents.notification.webhook_notification_handler_agent import WebhookNotificationHandlerAgent

handler = WebhookNotificationHandlerAgent()

# Register webhook endpoint
webhook = await handler.register_webhook({
    "name": "Emergency Services",
    "url": "https://emergency.city.gov/api/alerts",
    "events": ["accident.high", "accident.critical"],
    "auth": {
        "type": "bearer",
        "token": "${EMERGENCY_API_TOKEN}"
    }
})
```

### Send Notification

```python
# Send webhook notification
result = await handler.send(
    webhook_id="WH_001",
    event="accident.high",
    payload={
        "incident_id": "ACC_001",
        "location": {"lat": 10.8231, "lon": 106.6297},
        "severity": "high",
        "timestamp": "2025-11-29T10:30:00Z"
    }
)
```

### Batch Send

```python
# Send to multiple webhooks
results = await handler.broadcast(
    event="congestion.severe",
    payload=congestion_data,
    webhook_filter={"category": "traffic_ops"}
)
```

## ⚙️ Configuration

```yaml
# config/webhook_config.yaml
webhook_handler:
  enabled: true
  
  # Delivery settings
  delivery:
    timeout_seconds: 30
    max_retries: 5
    retry_delays: [1, 5, 30, 300, 900]  # Exponential backoff
  
  # Security
  security:
    sign_payloads: true
    signing_algorithm: "HMAC-SHA256"
    include_timestamp: true
  
  # Registered webhooks
  webhooks:
    - name: "Emergency Services"
      url: "https://emergency.city.gov/api/alerts"
      events: ["accident.*"]
      auth:
        type: "bearer"
        token: "${EMERGENCY_TOKEN}"
    
    - name: "Traffic Control"
      url: "https://traffic.city.gov/webhooks"
      events: ["congestion.*", "accident.*"]
      auth:
        type: "basic"
        username: "${TC_USER}"
        password: "${TC_PASS}"
```

## 📊 Webhook Events

| Event Pattern | Description | Priority |
|---------------|-------------|----------|
| `accident.*` | All accident events | High |
| `accident.critical` | Critical accidents | Immediate |
| `congestion.severe` | Severe congestion | High |
| `system.health` | Health status | Low |

## 🔐 Authentication Types

| Type | Description | Headers |
|------|-------------|---------|
| `bearer` | Bearer token | `Authorization: Bearer <token>` |
| `basic` | Basic auth | `Authorization: Basic <base64>` |
| `api_key` | API key header | `X-API-Key: <key>` |
| `custom` | Custom headers | User-defined |

## 📖 Related Documentation

- [Alert Dispatcher](alert-dispatcher) - Alert generation
- [Email Handler](email-notification-handler) - Email alternative
- [Subscription Manager](subscription-manager) - Event subscriptions

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
