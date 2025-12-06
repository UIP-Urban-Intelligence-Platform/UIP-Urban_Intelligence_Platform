---
id: pattern-routes
title: Pattern Routes
sidebar_label: Pattern
sidebar_position: 6
description: RESTful API endpoints for querying traffic congestion patterns, hotspots, and traffic flow observations.
keywords: [pattern, congestion, traffic-flow, hotspot, analytics, ngsi-ld]
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team
-->

# Pattern Routes

RESTful API endpoints for querying **traffic congestion patterns**, hotspots, and traffic flow observations from Stellio and Fuseki.

## Base Path

```
/api/patterns
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all patterns |
| GET | `/:id` | Get pattern by ID |
| GET | `/hotspots` | Get congestion hotspots |
| GET | `/road-segment/:id` | Get patterns for road |

## Endpoints

### GET /api/patterns

List all traffic patterns.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Maximum results |
| `congestionLevel` | string | - | Filter: `low`, `moderate`, `high`, `severe` |
| `roadSegment` | string | - | Filter by road segment ID |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "urn:ngsi-ld:TrafficPattern:001",
      "roadSegment": "urn:ngsi-ld:RoadSegment:nguyen-hue",
      "location": {
        "latitude": 10.7731,
        "longitude": 106.7030
      },
      "averageSpeed": 25.5,
      "vehicleCount": 150,
      "occupancy": 0.75,
      "congestionLevel": "high",
      "observedAt": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### GET /api/patterns/hotspots

Get current congestion hotspots.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "location": { "latitude": 10.77, "longitude": 106.70 },
      "roadSegment": "Nguyen Hue Boulevard",
      "congestionLevel": "severe",
      "averageSpeed": 8.5,
      "delayMinutes": 25,
      "affectedLength": 1.5
    }
  ],
  "meta": {
    "totalHotspots": 5,
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

## Congestion Levels

| Level | Speed Reduction | Description |
|-------|-----------------|-------------|
| `low` | 0-25% | Free flow |
| `moderate` | 25-50% | Light congestion |
| `high` | 50-75% | Heavy congestion |
| `severe` | 75-100% | Gridlock |

## Related Documentation

- [FusekiService](../services/fusekiService.md) - SPARQL queries
- [Analytics Routes](./analytics.md) - Statistical analysis
- [TrafficMaestroAgent](../agents/TrafficMaestroAgent.md) - Predictions

## References

- [NGSI-LD TrafficFlowObserved](https://smart-data-models.github.io/dataModel.Transportation/TrafficFlowObserved/)
