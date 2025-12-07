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
File: agents/notification/email-notification-handler.md
Module: Notification - Email Notification Handler Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Email Notification Handler Agent documentation for sending email
  notifications for alerts and reports.
============================================================================
-->

# Email Notification Handler Agent

The Email Notification Handler Agent sends email notifications for alerts and reports.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.notification.email_notification_handler_agent` |
| **Class** | `EmailNotificationHandlerAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Send email alerts** for traffic incidents
- **Deliver scheduled reports** to subscribers
- **Template-based emails** for consistency
- **Track delivery status** and retries

## 🚀 Usage

### Send Alert Email

```python
from src.agents.notification.email_notification_handler_agent import EmailNotificationHandlerAgent

handler = EmailNotificationHandlerAgent()

# Send alert email
await handler.send_alert(
    recipients=["admin@city.gov", "traffic@city.gov"],
    alert_type="accident",
    data={
        "location": "Nguyen Hue Street",
        "severity": "high",
        "description": "Two-vehicle collision"
    }
)
```

### Send Report

```python
# Send daily report
await handler.send_report(
    recipients=["management@city.gov"],
    report_type="daily_summary",
    date="2025-11-29",
    attachments=["report.pdf"]
)
```

### Bulk Send

```python
# Send to subscriber list
await handler.bulk_send(
    template="congestion_alert",
    subscriber_list="traffic_updates",
    data={
        "affected_areas": ["District 1", "District 3"],
        "estimated_delay": "30 minutes"
    }
)
```

## ⚙️ Configuration

```yaml
# config/notification_config.yaml
email_handler:
  enabled: true
  
  # SMTP settings
  smtp:
    host: "smtp.gmail.com"
    port: 587
    username: "${SMTP_USER}"
    password: "${SMTP_PASSWORD}"
    use_tls: true
  
  # Sender info
  sender:
    name: "UIP Traffic Alerts"
    email: "alerts@uip-platform.com"
  
  # Templates
  templates:
    path: "templates/email"
    default: "base.html"
  
  # Retry settings
  retry:
    max_attempts: 3
    delay_seconds: 60
```

## 📧 Email Templates

| Template | Purpose | Variables |
|----------|---------|-----------|
| `accident_alert` | Accident notification | location, severity, time |
| `congestion_alert` | Traffic jam alert | areas, delay, alternatives |
| `daily_summary` | Daily report | stats, incidents, trends |
| `weekly_report` | Weekly analytics | charts, comparisons |

## 📖 Related Documentation

- [Alert Dispatcher](alert-dispatcher) - Alert generation
- [Subscription Manager](subscription-manager) - Subscriber management
- [Webhook Handler](webhook-notification-handler) - Alternative delivery

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
