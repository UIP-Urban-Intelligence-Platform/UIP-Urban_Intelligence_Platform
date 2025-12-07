---
id: correlation-routes
title: Correlation Routes
sidebar_label: Correlation
sidebar_position: 9
description: RESTful API endpoints for analyzing entity correlations and causal relationships between traffic, weather, and accidents.
keywords: [correlation, causation, relationship, neo4j, analysis]
---

{/*
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/backend/routes/correlation.md
Module: Traffic Web App - Correlation Routes Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Correlation routes documentation for entity correlation analysis.
============================================================================
*/}

# Correlation Routes

RESTful API endpoints for analyzing **entity correlations** and causal relationships between traffic, weather, and accidents using Neo4j graph analysis.

## Base Path

```
/api/correlation
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accident-weather` | Weather-accident correlation |
| GET | `/traffic-patterns` | Traffic pattern correlation |
| GET | `/entity-relationships` | Entity relationship graph |
| GET | `/causal-analysis` | Causal factor analysis |

## Endpoints

### GET /api/correlation/accident-weather

Analyze correlation between weather conditions and accidents.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Start date |
| `to` | string | End date |
| `weatherType` | string | Weather filter |

**Response:**

```json
{
  "success": true,
  "data": {
    "correlations": [
      {
        "weatherCondition": "rain",
        "accidentIncrease": 45,
        "confidence": 0.87,
        "sampleSize": 150
      },
      {
        "weatherCondition": "fog",
        "accidentIncrease": 62,
        "confidence": 0.79,
        "sampleSize": 45
      }
    ],
    "topFactors": [
      { "factor": "wet_road", "impact": 0.42 },
      { "factor": "visibility", "impact": 0.35 },
      { "factor": "wind_speed", "impact": 0.15 }
    ]
  }
}
```

---

### GET /api/correlation/entity-relationships

Get relationship graph for an entity.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `entityId` | string | Yes | Entity URN |
| `depth` | number | No | Traversal depth (default: 2) |
| `types` | string | No | Relationship types (comma-separated) |

**Response:**

```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": "urn:ngsi-ld:RoadAccident:001", "type": "Accident" },
      { "id": "urn:ngsi-ld:Camera:nearby-001", "type": "Camera" },
      { "id": "urn:ngsi-ld:WeatherObserved:001", "type": "Weather" }
    ],
    "edges": [
      { "source": "RoadAccident:001", "target": "Camera:nearby-001", "type": "NEAR_TO" },
      { "source": "RoadAccident:001", "target": "WeatherObserved:001", "type": "OCCURRED_DURING" }
    ]
  }
}
```

## Related Documentation

- [Neo4jService](../services/neo4jService.md) - Graph database
- [GraphInvestigatorAgent](../agents/GraphInvestigatorAgent.md) - Advanced analysis
- [Accident Routes](./accident.md) - Accident data

## References

- [Neo4j Graph Algorithms](https://neo4j.com/docs/graph-data-science/current/)
