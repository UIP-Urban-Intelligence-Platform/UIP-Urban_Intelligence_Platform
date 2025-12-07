<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/API-Reference.md
Module: API Reference Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete API documentation for UIP platform services.
============================================================================
-->
# 🔌 API Reference

Complete API documentation for UIP - Urban Intelligence Platform services.

---

## 📊 Overview

UIP - Urban Intelligence Platform exposes multiple API services:

| Service | Port | Base URL | Description |
|---------|------|----------|-------------|
| **Express Backend** | 5000 | `/api/v1` | Main REST API |
| **Agent APIs** | Various | Agent-specific | Individual agent endpoints |
| **Stellio Context Broker** | 8080 | `/ngsi-ld/v1` | NGSI-LD API |
| **Apache Fuseki** | 3030 | `/traffic` | SPARQL endpoint |
| **Neo4j** | 7474 | `/db/neo4j/tx` | Graph API |

---

## 🌐 Express Backend API

### Base URL

```
http://localhost:5000/api
```

### API Routes Overview

| Route | Description |
|-------|-------------|
| `/api/cameras` | Traffic camera data |
| `/api/weather` | Weather information |
| `/api/air-quality` | Air quality data |
| `/api/accidents` | Accident reports |
| `/api/patterns` | Traffic patterns |
| `/api/analytics` | Analytics dashboard |
| `/api/historical` | Historical data |
| `/api/correlations` | Data correlations |
| `/api/routing` | Route planning |
| `/api/geocoding` | Geocoding service |
| `/api/agents` | Agent management |

---

### 📸 Camera API

#### Get All Cameras

```http
GET /api/cameras
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `active`, `inactive` |
| `type` | string | Filter by camera type |
| `bounds` | string | Geographic bounds (lat1,lng1,lat2,lng2) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "camera-001",
      "name": "Camera Intersection 1",
      "location": {
        "type": "Point",
        "coordinates": [105.8342, 21.0278]
      },
      "status": "active",
      "type": "traffic",
      "streamUrl": "rtsp://...",
      "lastUpdate": "2025-11-29T10:30:00Z"
    }
  ],
  "total": 50
}
```

#### Get Camera by ID

```http
GET /api/cameras/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "camera-001",
    "name": "Camera Intersection 1",
    "location": {...},
    "status": "active",
    "metrics": {
      "vehicleCount": 1234,
      "avgSpeed": 45.5,
      "congestionLevel": 0.3
    }
  }
}
```

---

### 🌤️ Weather API

#### Get Current Weather

```http
GET /api/weather
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | number | Latitude |
| `lng` | number | Longitude |

**Response:**
```json
{
  "success": true,
  "data": {
    "temperature": 28.5,
    "humidity": 75,
    "conditions": "Partly Cloudy",
    "windSpeed": 12.3,
    "visibility": 10000,
    "timestamp": "2025-11-29T10:30:00Z"
  }
}
```

#### Get Weather Forecast

```http
GET /api/weather/forecast
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `days` | number | Forecast days (1-7) |

---

### 🌫️ Air Quality API

#### Get Air Quality Index

```http
GET /api/air-quality
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `radius` | number | Search radius in km |

**Response:**
```json
{
  "success": true,
  "data": {
    "aqi": 42,
    "level": "Good",
    "pollutants": {
      "pm25": 15.3,
      "pm10": 28.1,
      "o3": 45.2,
      "no2": 22.5,
      "co": 0.5
    },
    "recommendations": ["Safe for outdoor activities"],
    "timestamp": "2025-11-29T10:30:00Z"
  }
}
```

---

### 🚗 Accidents API

#### Get All Accidents

```http
GET /api/accidents
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `severity` | string | Filter: `minor`, `moderate`, `severe` |
| `status` | string | Filter: `active`, `cleared`, `pending` |
| `startDate` | string | ISO date string |
| `endDate` | string | ISO date string |
| `bounds` | string | Geographic bounds |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "acc-001",
      "type": "collision",
      "severity": "moderate",
      "location": {
        "type": "Point",
        "coordinates": [105.8342, 21.0278]
      },
      "description": "Two-vehicle collision",
      "timestamp": "2025-11-29T08:15:00Z",
      "status": "cleared",
      "vehiclesInvolved": 2,
      "injuries": 0,
      "affectedLanes": ["Lane 1", "Lane 2"]
    }
  ],
  "total": 15,
  "page": 1,
  "pages": 2
}
```

#### Get Accident by ID

```http
GET /api/accidents/:id
```

#### Create Accident Report

```http
POST /api/accidents
```

**Request Body:**
```json
{
  "type": "collision",
  "severity": "minor",
  "location": {
    "coordinates": [105.8342, 21.0278]
  },
  "description": "Minor fender bender",
  "vehiclesInvolved": 2
}
```

---

### 📊 Patterns API

#### Get Traffic Patterns

```http
GET /api/patterns
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Pattern type: `congestion`, `flow`, `anomaly` |
| `timeRange` | string | Time range: `1h`, `6h`, `24h`, `7d` |
| `area` | string | Geographic area ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "patterns": [
      {
        "id": "pattern-001",
        "type": "congestion",
        "severity": 0.75,
        "location": {...},
        "startTime": "2025-11-29T07:00:00Z",
        "endTime": "2025-11-29T09:00:00Z",
        "description": "Morning rush hour congestion"
      }
    ],
    "summary": {
      "totalPatterns": 15,
      "avgSeverity": 0.45,
      "hotspots": 3
    }
  }
}
```

#### Analyze Patterns

```http
POST /api/patterns/analyze
```

**Request Body:**
```json
{
  "area": "downtown",
  "timeRange": "24h",
  "analysisType": "deep"
}
```

---

### 📈 Analytics API

#### Get Dashboard Data

```http
GET /api/analytics/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "activeIncidents": 5,
      "trafficFlow": 0.72,
      "avgSpeed": 35.5,
      "congestionLevel": 0.28
    },
    "trends": {
      "hourly": [...],
      "daily": [...]
    },
    "alerts": [...]
  }
}
```

#### Get Heatmap Data

```http
GET /api/analytics/heatmap
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Type: `traffic`, `accidents`, `congestion` |
| `resolution` | string | Resolution: `low`, `medium`, `high` |

---

### 📜 Historical API

#### Get Historical Data

```http
GET /api/historical
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Start date (ISO format) |
| `endDate` | string | End date (ISO format) |
| `metrics` | string | Comma-separated metrics |
| `aggregation` | string | Aggregation: `hourly`, `daily`, `weekly` |

**Response:**
```json
{
  "success": true,
  "data": {
    "timeRange": {
      "start": "2025-11-20T00:00:00Z",
      "end": "2025-11-29T23:59:59Z"
    },
    "metrics": {
      "avgSpeed": [...],
      "vehicleCount": [...],
      "congestionIndex": [...]
    }
  }
}
```

---

### 🔄 Correlations API

#### Get Correlations

```http
GET /api/correlations
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `variables` | string | Variables to correlate |
| `timeRange` | string | Time range for analysis |

**Response:**
```json
{
  "success": true,
  "data": {
    "correlations": [
      {
        "variable1": "traffic_volume",
        "variable2": "air_quality",
        "coefficient": -0.72,
        "significance": 0.001
      }
    ]
  }
}
```

---

### 🗺️ Routing API

#### Get Optimal Route

```http
GET /api/routing/route
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `origin` | string | Origin coordinates (lat,lng) |
| `destination` | string | Destination coordinates |
| `mode` | string | Mode: `fastest`, `shortest`, `eco` |

**Response:**
```json
{
  "success": true,
  "data": {
    "route": {
      "distance": 12.5,
      "duration": 25,
      "polyline": "...",
      "steps": [...]
    },
    "alternatives": [...]
  }
}
```

---

### 📍 Geocoding API

#### Forward Geocoding

```http
GET /api/geocoding/search
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `limit` | number | Max results |

#### Reverse Geocoding

```http
GET /api/geocoding/reverse
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | number | Latitude |
| `lng` | number | Longitude |

---

### 🤖 Agents API

#### List Agents

```http
GET /api/agents
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "traffic-maestro",
      "name": "TrafficMaestroAgent",
      "status": "active",
      "lastAction": "2025-11-29T10:30:00Z",
      "metrics": {
        "tasksCompleted": 150,
        "avgResponseTime": 250
      }
    }
  ]
}
```

#### Invoke Agent

```http
POST /api/agents/:id/invoke
```

**Request Body:**
```json
{
  "task": "analyze",
  "params": {
    "area": "downtown",
    "timeRange": "1h"
  }
}
```

---

## 🌍 NGSI-LD API (Stellio)

### Base URL

```
http://localhost:8080/ngsi-ld/v1
```

### Entities

#### Get Entities

```http
GET /ngsi-ld/v1/entities
```

**Headers:**
```
Accept: application/ld+json
Link: <context-url>; rel="http://www.w3.org/ns/json-ld#context"
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Entity type |
| `q` | string | Query filter |
| `geoQ` | string | Geo-spatial query |
| `attrs` | string | Attributes to return |

#### Create Entity

```http
POST /ngsi-ld/v1/entities
Content-Type: application/ld+json
```

**Request Body:**
```json
{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:TrafficFlowObserved:001",
  "type": "TrafficFlowObserved",
  "dateObserved": {
    "type": "Property",
    "value": "2025-11-29T10:30:00Z"
  },
  "intensity": {
    "type": "Property",
    "value": 150
  }
}
```

### Subscriptions

#### Create Subscription

```http
POST /ngsi-ld/v1/subscriptions
```

**Request Body:**
```json
{
  "type": "Subscription",
  "entities": [
    {"type": "TrafficFlowObserved"}
  ],
  "watchedAttributes": ["intensity"],
  "notification": {
    "endpoint": {
      "uri": "http://callback-url/notify"
    }
  }
}
```

---

## 📊 SPARQL API (Fuseki)

### Base URL

```
http://localhost:3030/traffic
```

### Query Endpoint

```http
POST /traffic/query
Content-Type: application/sparql-query
Accept: application/sparql-results+json
```

**Example Query:**
```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX schema: <https://schema.org/>

SELECT ?sensor ?value ?time
WHERE {
  ?obs a sosa:Observation ;
       sosa:madeBySensor ?sensor ;
       sosa:hasSimpleResult ?value ;
       sosa:resultTime ?time .
}
ORDER BY DESC(?time)
LIMIT 100
```

### Update Endpoint

```http
POST /traffic/update
Content-Type: application/sparql-update
```

---

## 🔵 Neo4j HTTP API

### Base URL

```
http://localhost:7474/db/neo4j/tx/commit
```

### Execute Cypher Query

```http
POST /db/neo4j/tx/commit
Content-Type: application/json
Authorization: Basic base64(neo4j:password)
```

**Request Body:**
```json
{
  "statements": [
    {
      "statement": "MATCH (n:TrafficNode)-[r:CONNECTED_TO]->(m) RETURN n, r, m LIMIT 100"
    }
  ]
}
```

---

## 🔐 Authentication

### API Key Authentication

Include API key in header:
```http
Authorization: Bearer <api-key>
```

### Environment Configuration

```bash
API_KEY=your-api-key
JWT_SECRET=your-jwt-secret
```

---

## 📝 Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parameters provided",
    "details": [
      {
        "field": "lat",
        "message": "Latitude must be between -90 and 90"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## 🚦 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| General API | 1000 requests/hour |
| Analytics | 100 requests/minute |
| Agent Invoke | 10 requests/minute |

---

## 🔗 Related Pages

- [[Installation]] - Setup instructions
- [[Configuration]] - Configuration reference
- [[Multi-Agent-System]] - Agent documentation
