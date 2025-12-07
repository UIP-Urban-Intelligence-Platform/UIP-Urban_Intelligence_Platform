---
id: weather-routes
title: Weather Routes
sidebar_label: Weather
sidebar_position: 3
description: RESTful API endpoints for querying weather observation entities with temperature, humidity, precipitation, and wind data.
keywords: [weather, api, temperature, humidity, precipitation, ngsi-ld]
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: backend/routes/weather.md
Module: Backend Routes - Weather Routes
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Weather Routes documentation for RESTful API endpoints for querying
  weather observation entities from Stellio.
============================================================================
-->

# Weather Routes

RESTful API endpoints for querying **weather observation entities** (WeatherObserved) with temperature, humidity, precipitation, and wind data from Stellio Context Broker.

## Base Path

```
/api/weather
```

## Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all weather observations |
| GET | `/:id` | Get weather by ID |
| GET | `/current` | Get current weather for location |
| GET | `/forecast` | Get weather forecast |

## Endpoints

### GET /api/weather

List all weather observations.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 100 | Maximum results |
| `lat` | number | - | Filter by latitude |
| `lon` | number | - | Filter by longitude |
| `maxDistance` | number | 10000 | Search radius (meters) |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "urn:ngsi-ld:WeatherObserved:001",
      "location": {
        "latitude": 10.7731,
        "longitude": 106.7030
      },
      "temperature": 32.5,
      "humidity": 75,
      "precipitation": 0,
      "windSpeed": 3.5,
      "windDirection": 180,
      "weatherType": "partly_cloudy",
      "observedAt": "2025-11-29T10:30:00.000Z"
    }
  ]
}
```

---

### GET /api/weather/current

Get current weather for a specific location.

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
    "temperature": 32.5,
    "feelsLike": 36.2,
    "humidity": 75,
    "precipitation": 0,
    "windSpeed": 3.5,
    "windDirection": 180,
    "weatherType": "partly_cloudy",
    "uvIndex": 7,
    "visibility": 10000,
    "observedAt": "2025-11-29T10:30:00.000Z"
  }
}
```

## Weather Types

| Type | Description |
|------|-------------|
| `clear` | Clear sky |
| `partly_cloudy` | Partly cloudy |
| `cloudy` | Overcast |
| `rain` | Light to moderate rain |
| `heavy_rain` | Heavy rain |
| `thunderstorm` | Thunderstorm |
| `fog` | Foggy conditions |

## Related Documentation

- [StellioService](../services/stellioService.md) - NGSI-LD queries
- [Air Quality Routes](./airQuality.md) - AQI data

## References

- [NGSI-LD WeatherObserved](https://smart-data-models.github.io/dataModel.Weather/WeatherObserved/)
