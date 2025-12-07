---
id: analytics-routes
title: Analytics Routes
sidebar_label: Analytics
sidebar_position: 7
description: RESTful API endpoints for traffic analytics, statistics, summaries, and dashboard metrics.
keywords: [analytics, statistics, dashboard, metrics, aggregation]
---

{/*
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/backend/routes/analytics.md
Module: Traffic Web App - Analytics Routes Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Analytics routes documentation for traffic analytics API endpoints.
============================================================================
*/}

# Analytics Routes

RESTful API endpoints for **traffic analytics**, statistics, summaries, and dashboard metrics.

## Base Path

```
/api/analytics
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summary` | Get traffic summary |
| GET | `/dashboard` | Dashboard metrics |
| GET | `/trends` | Traffic trends |
| GET | `/comparison` | Period comparison |

## Endpoints

### GET /api/analytics/summary

Get overall traffic summary.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCameras": 520,
    "activeCameras": 485,
    "totalAccidents": 12,
    "activeAccidents": 3,
    "averageSpeed": 35.5,
    "congestionIndex": 0.42,
    "airQuality": {
      "averageAqi": 85,
      "category": "Moderate"
    },
    "timestamp": "2025-11-29T10:30:00.000Z"
  }
}
```

---

### GET /api/analytics/dashboard

Get real-time dashboard metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "traffic": {
      "currentFlow": 12500,
      "change24h": "+5.2%",
      "peakHour": "17:00-18:00"
    },
    "incidents": {
      "active": 3,
      "resolved24h": 8,
      "averageResolutionTime": "45 min"
    },
    "environment": {
      "aqi": 85,
      "temperature": 32,
      "humidity": 75
    },
    "alerts": [
      {
        "type": "accident",
        "severity": "high",
        "message": "Serious accident on Nguyen Hue"
      }
    ]
  }
}
```

---

### GET /api/analytics/trends

Get traffic trends over time.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `24h` | Time period: `24h`, `7d`, `30d` |
| `metric` | string | `speed` | Metric: `speed`, `volume`, `congestion` |

**Response:**

```json
{
  "success": true,
  "data": {
    "metric": "speed",
    "period": "24h",
    "dataPoints": [
      { "time": "00:00", "value": 45.2 },
      { "time": "06:00", "value": 38.5 },
      { "time": "12:00", "value": 28.3 },
      { "time": "18:00", "value": 22.1 }
    ],
    "average": 33.5,
    "min": 22.1,
    "max": 45.2
  }
}
```

## Related Documentation

- [Historical Routes](./historical.md) - Time-series data
- [Pattern Routes](./pattern.md) - Congestion patterns
- [DataAggregator](../services/dataAggregator.md) - Data collection

## References

- [Traffic Analytics Best Practices](https://ops.fhwa.dot.gov/publications/)
