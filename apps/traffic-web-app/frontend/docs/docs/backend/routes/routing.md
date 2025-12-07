---
id: routing-routes
title: Routing Routes
sidebar_label: Routing
sidebar_position: 10
description: RESTful API endpoints for turn-by-turn navigation and route optimization using OSRM.
keywords: [routing, navigation, directions, osrm, route-optimization]
---

{/*
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/backend/routes/routing.md
Module: Traffic Web App - Routing Routes Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Routing routes documentation for navigation API endpoints.
============================================================================
*/}

# Routing Routes

RESTful API endpoints for **turn-by-turn navigation** and route optimization using OSRM (Open Source Routing Machine).

## Base Path

```
/api/routing
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/directions` | Get turn-by-turn directions |
| GET | `/alternatives` | Get alternative routes |
| GET | `/matrix` | Distance/time matrix |
| GET | `/optimize` | Route optimization (TSP) |

## Endpoints

### GET /api/routing/directions

Get turn-by-turn directions between two points.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `origin` | string | Yes | Start: `lat,lon` |
| `destination` | string | Yes | End: `lat,lon` |
| `profile` | string | No | `driving`, `cycling`, `walking` |
| `alternatives` | boolean | No | Include alternatives |

**Response:**

```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "distance": 5420,
        "duration": 845,
        "geometry": "encoded_polyline_string",
        "legs": [
          {
            "steps": [
              {
                "instruction": "Head north on Nguyen Hue",
                "distance": 250,
                "duration": 45,
                "maneuver": "depart"
              },
              {
                "instruction": "Turn right onto Le Loi",
                "distance": 800,
                "duration": 120,
                "maneuver": "turn-right"
              }
            ]
          }
        ]
      }
    ],
    "waypoints": [
      { "name": "Start", "location": [106.70, 10.77] },
      { "name": "End", "location": [106.75, 10.80] }
    ]
  }
}
```

---

### GET /api/routing/matrix

Get distance/duration matrix for multiple points.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `origins` | string | Yes | Origin points: `lat1,lon1;lat2,lon2` |
| `destinations` | string | Yes | Destination points |

**Response:**

```json
{
  "success": true,
  "data": {
    "durations": [
      [0, 600, 900],
      [650, 0, 450],
      [850, 400, 0]
    ],
    "distances": [
      [0, 3500, 5200],
      [3800, 0, 2800],
      [5000, 2600, 0]
    ]
  }
}
```

## Related Documentation

- [Geocoding Routes](./geocoding.md) - Address lookup
- [TrafficMaestroAgent](../agents/TrafficMaestroAgent.md) - Traffic-aware routing

## References

- [OSRM Documentation](http://project-osrm.org/docs/)
- [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)
