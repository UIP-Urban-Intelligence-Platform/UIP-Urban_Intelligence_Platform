---
id: historical-routes
title: Historical Routes
sidebar_label: Historical
sidebar_position: 8
description: RESTful API endpoints for querying historical time-series traffic data and temporal aggregations.
keywords: [historical, time-series, temporal, timescaledb, aggregation]
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: backend/routes/historical.md
Module: Backend Routes - Historical Routes
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Historical Routes documentation for RESTful API endpoints for querying
  historical time-series traffic data.
============================================================================
-->

# Historical Routes

RESTful API endpoints for querying **historical time-series** traffic data and temporal aggregations from TimescaleDB.

## Base Path

```
/api/historical
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/traffic` | Historical traffic data |
| GET | `/weather` | Historical weather data |
| GET | `/air-quality` | Historical AQI data |
| GET | `/patterns` | Historical patterns |

## Endpoints

### GET /api/historical/traffic

Get historical traffic metrics.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `roadSegment` | string | No | Road segment ID |
| `from` | string | Yes | Start date (ISO 8601) |
| `to` | string | Yes | End date (ISO 8601) |
| `interval` | string | No | Aggregation: `hour`, `day`, `week` |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-11-28T08:00:00.000Z",
      "averageSpeed": 28.5,
      "vehicleCount": 1250,
      "congestionLevel": "high"
    },
    {
      "timestamp": "2025-11-28T09:00:00.000Z",
      "averageSpeed": 32.1,
      "vehicleCount": 980,
      "congestionLevel": "moderate"
    }
  ],
  "meta": {
    "interval": "hour",
    "dataPoints": 24
  }
}
```

---

### GET /api/historical/patterns

Get historical traffic pattern analysis.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `dayOfWeek` | number | Day of week (0=Sunday) |
| `hourOfDay` | number | Hour (0-23) |
| `roadSegment` | string | Road segment ID |

**Response:**

```json
{
  "success": true,
  "data": {
    "averageSpeed": 28.5,
    "averageVehicleCount": 1150,
    "sampleCount": 52,
    "standardDeviation": 5.2,
    "percentiles": {
      "p25": 24.0,
      "p50": 28.5,
      "p75": 33.0,
      "p95": 42.0
    }
  }
}
```

## Time Range Limits

| Period | Max Range | Aggregation |
|--------|-----------|-------------|
| Real-time | 24 hours | None |
| Short-term | 7 days | Hourly |
| Medium-term | 30 days | Daily |
| Long-term | 365 days | Weekly |

## Related Documentation

- [PostgresService](../services/postgresService.md) - TimescaleDB queries
- [Analytics Routes](./analytics.md) - Real-time analytics
- [FusekiService](../services/fusekiService.md) - SPARQL historical

## References

- [TimescaleDB Documentation](https://docs.timescale.com/)
