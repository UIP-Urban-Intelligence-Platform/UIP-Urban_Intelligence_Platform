---
id: air-quality-routes
title: Air Quality Routes
sidebar_label: Air Quality
sidebar_position: 4
description: RESTful API endpoints for querying air quality observation entities with PM2.5, PM10, O3, NO2, CO, SO2, and AQI data.
keywords: [air-quality, aqi, pm25, pollution, sensors, ngsi-ld]
---

{/*
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/frontend/docs/docs/backend/routes/airQuality.md
Module: Traffic Web App - Air Quality Routes Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Air quality routes documentation for air quality API endpoints.
============================================================================
*/}

# Air Quality Routes

RESTful API endpoints for querying **air quality observation entities** (AirQualityObserved) with PM2.5, PM10, O3, NO2, CO, SO2, and AQI data from Stellio Context Broker.

## Base Path

```
/api/air-quality
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all AQI observations |
| GET | `/:id` | Get observation by ID |
| GET | `/current` | Get current AQI for location |
| GET | `/stations` | List monitoring stations |

## Endpoints

### GET /api/air-quality

List all air quality observations.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Maximum results |
| `lat` | number | - | Filter by latitude |
| `lon` | number | - | Filter by longitude |
| `maxDistance` | number | 10000 | Search radius (meters) |
| `minAqi` | number | - | Minimum AQI threshold |
| `maxAqi` | number | - | Maximum AQI threshold |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "urn:ngsi-ld:AirQualityObserved:001",
      "location": {
        "latitude": 10.7731,
        "longitude": 106.7030
      },
      "aqi": 125,
      "category": "Unhealthy for Sensitive Groups",
      "pm25": 45.2,
      "pm10": 68.5,
      "o3": 35.0,
      "no2": 28.5,
      "co": 0.8,
      "so2": 12.0,
      "observedAt": "2025-11-29T10:30:00.000Z"
    }
  ]
}
```

---

### GET /api/air-quality/current

Get current air quality for a specific location.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Latitude |
| `lon` | number | Yes | Longitude |

**Response:**

```json
{
  "success": true,
  "data": {
    "aqi": 125,
    "category": "Unhealthy for Sensitive Groups",
    "dominantPollutant": "PM2.5",
    "pollutants": {
      "pm25": { "value": 45.2, "unit": "µg/m³" },
      "pm10": { "value": 68.5, "unit": "µg/m³" },
      "o3": { "value": 35.0, "unit": "ppb" },
      "no2": { "value": 28.5, "unit": "ppb" },
      "co": { "value": 0.8, "unit": "ppm" },
      "so2": { "value": 12.0, "unit": "ppb" }
    },
    "healthRecommendations": {
      "general": "Acceptable for most people",
      "sensitive": "Limit outdoor exertion",
      "children": "Reduce prolonged outdoor activity"
    },
    "observedAt": "2025-11-29T10:30:00.000Z"
  }
}
```

## AQI Categories

| AQI Range | Category | Color |
|-----------|----------|-------|
| 0-50 | Good | Green |
| 51-100 | Moderate | Yellow |
| 101-150 | Unhealthy for Sensitive Groups | Orange |
| 151-200 | Unhealthy | Red |
| 201-300 | Very Unhealthy | Purple |
| 301-500 | Hazardous | Maroon |

## Related Documentation

- [StellioService](../services/stellioService.md) - NGSI-LD queries
- [EcoTwinAgent](../agents/EcoTwinAgent.md) - Environmental health advice
- [Weather Routes](./weather.md) - Weather data

## References

- [NGSI-LD AirQualityObserved](https://smart-data-models.github.io/dataModel.Environment/AirQualityObserved/)
- [US EPA AQI](https://www.airnow.gov/aqi/aqi-basics/)
