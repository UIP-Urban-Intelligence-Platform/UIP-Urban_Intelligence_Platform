---
id: accident-routes
title: Accident Routes
sidebar_label: Accident
sidebar_position: 5
description: RESTful API endpoints for querying traffic accident entities with severity, location, casualties, and resolution status.
keywords: [accident, traffic, incident, safety, neo4j, ngsi-ld]
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: backend/routes/accident.md
Module: Backend Routes - Accident Routes
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Accident Routes documentation for RESTful API endpoints for querying
  traffic accident entities with severity and location data.
============================================================================
-->

# Accident Routes

RESTful API endpoints for querying **traffic accident entities** (RoadAccident) with severity, location, casualties, and resolution status from Stellio and Neo4j.

## Base Path

```
/api/accidents
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all accidents |
| GET | `/:id` | Get accident by ID |
| GET | `/active` | Get unresolved accidents |
| GET | `/area` | Get accidents in area |
| GET | `/:id/relationships` | Get related entities |

## Endpoints

### GET /api/accidents

List all accidents with optional filters.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Maximum results |
| `severity` | string | - | Filter: `minor`, `moderate`, `serious`, `critical` |
| `resolved` | boolean | - | Filter by resolution status |
| `from` | string | - | Start date (ISO 8601) |
| `to` | string | - | End date (ISO 8601) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "urn:ngsi-ld:RoadAccident:001",
      "location": {
        "latitude": 10.7731,
        "longitude": 106.7030,
        "address": "123 Nguyen Hue, District 1"
      },
      "type": "collision",
      "severity": "serious",
      "description": "Multi-vehicle collision",
      "timestamp": "2025-11-29T10:30:00.000Z",
      "resolved": false,
      "casualties": 2
    }
  ]
}
```

---

### GET /api/accidents/active

Get currently unresolved accidents.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "urn:ngsi-ld:RoadAccident:001",
      "severity": "serious",
      "location": { "latitude": 10.77, "longitude": 106.70 },
      "elapsedTime": "45 minutes",
      "estimatedClearTime": "30 minutes"
    }
  ],
  "meta": {
    "activeCount": 3,
    "timestamp": "2025-11-29T10:30:00.000Z"
  }
}
```

---

### GET /api/accidents/area

Get accidents within a geographic area.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Center latitude |
| `lon` | number | Yes | Center longitude |
| `radius` | number | No | Radius in km (default: 5) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "urn:ngsi-ld:RoadAccident:001",
      "distance": 1.5,
      "severity": "serious",
      "location": { "latitude": 10.77, "longitude": 106.70 }
    }
  ]
}
```

---

### GET /api/accidents/:id/relationships

Get related entities from Neo4j graph database.

**Response:**

```json
{
  "success": true,
  "data": {
    "accidentId": "urn:ngsi-ld:RoadAccident:001",
    "relationships": [
      {
        "type": "NEAR_TO",
        "entity": "urn:ngsi-ld:Camera:nearby-001",
        "entityType": "Camera",
        "distance": 150
      },
      {
        "type": "OCCURRED_DURING",
        "entity": "urn:ngsi-ld:WeatherObserved:001",
        "entityType": "Weather",
        "conditions": "rainy"
      },
      {
        "type": "LOCATED_ON",
        "entity": "urn:ngsi-ld:RoadSegment:nguyen-hue",
        "entityType": "RoadSegment"
      }
    ]
  }
}
```

## Accident Types

| Type | Description |
|------|-------------|
| `collision` | Vehicle collision |
| `pedestrian` | Pedestrian involved |
| `rollover` | Vehicle rollover |
| `hit_and_run` | Hit and run incident |
| `debris` | Road debris/hazard |
| `other` | Other incidents |

## Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| `minor` | No injuries, minor damage | Standard |
| `moderate` | Minor injuries | Priority |
| `serious` | Multiple injuries | Urgent |
| `critical` | Fatalities or mass casualties | Emergency |

## Related Documentation

- [Neo4jService](../services/neo4jService.md) - Graph relationships
- [GraphInvestigatorAgent](../agents/GraphInvestigatorAgent.md) - Incident analysis
- [Correlation Routes](./correlation.md) - Entity correlations

## References

- [NGSI-LD RoadAccident](https://smart-data-models.github.io/dataModel.Transportation/RoadAccident/)
