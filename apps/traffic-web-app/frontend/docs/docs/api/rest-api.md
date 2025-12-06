<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
REST API reference documentation.

Module: apps/traffic-web-app/frontend/docs/docs/api/rest-api.md
Author: UIP Team
Version: 1.0.0
-->

# REST API Reference

## Overview

Complete REST API documentation for the HCMC Traffic Management System providing access to cameras, traffic data, accidents, weather, air quality, and analytics.

## Base URL

```
https://api.traffic.example.com/api/v1
```

## Authentication

All API requests require authentication using JWT tokens:

```bash
# Get token
POST /auth/login
{
  "username": "user@example.com",
  "password": "password"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}

# Use token in requests
Authorization: Bearer <access_token>
```

## Cameras

### List Cameras

```http
GET /cameras
```

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20)
- `status` (string): Filter by status (active, inactive, error)
- `location` (string): Filter by location/district

**Response:**

```json
{
  "cameras": [
    {
      "id": "CAM_001",
      "name": "District 1 - Nguyen Hue",
      "location": {
        "lat": 10.7769,
        "lon": 106.7009,
        "address": "Nguyen Hue St, District 1"
      },
      "status": "active",
      "last_update": "2024-01-15T10:30:00Z",
      "capabilities": ["image", "video", "thermal"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get Camera Details

```http
GET /cameras/{camera_id}
```

**Response:**

```json
{
  "id": "CAM_001",
  "name": "District 1 - Nguyen Hue",
  "location": {
    "lat": 10.7769,
    "lon": 106.7009,
    "address": "Nguyen Hue St, District 1"
  },
  "status": "active",
  "stream_url": "rtsp://camera.example.com/stream/CAM_001",
  "last_image": "https://api.traffic.example.com/images/CAM_001/latest.jpg",
  "last_update": "2024-01-15T10:30:00Z",
  "metadata": {
    "resolution": "1920x1080",
    "fps": 30,
    "manufacturer": "Hikvision"
  }
}
```

### Get Camera Image

```http
GET /cameras/{camera_id}/image
```

**Query Parameters:**
- `timestamp` (string, ISO 8601): Get historical image (optional)

**Response:** Image file (JPEG)

### Get Camera Stats

```http
GET /cameras/{camera_id}/stats
```

**Query Parameters:**
- `start_time` (string, ISO 8601): Start time
- `end_time` (string, ISO 8601): End time

**Response:**

```json
{
  "camera_id": "CAM_001",
  "period": {
    "start": "2024-01-15T00:00:00Z",
    "end": "2024-01-15T23:59:59Z"
  },
  "stats": {
    "total_vehicles": 15420,
    "avg_speed": 35.5,
    "peak_hour": "17:00",
    "congestion_minutes": 120,
    "accidents": 2
  }
}
```

## Traffic Flow

### Get Traffic Flow

```http
GET /traffic/flow
```

**Query Parameters:**
- `camera_id` (string): Filter by camera
- `start_time` (string, ISO 8601): Start time
- `end_time` (string, ISO 8601): End time
- `interval` (string): Aggregation interval (1m, 5m, 15m, 1h)

**Response:**

```json
{
  "observations": [
    {
      "id": "urn:ngsi-ld:TrafficFlowObserved:CAM_001:20240115T103000Z",
      "camera_id": "CAM_001",
      "timestamp": "2024-01-15T10:30:00Z",
      "location": {"lat": 10.7769, "lon": 106.7009},
      "intensity": 45,
      "average_speed": 35.5,
      "vehicle_types": {
        "car": 28,
        "motorcycle": 12,
        "truck": 3,
        "bus": 2
      },
      "occupancy": 0.65
    }
  ]
}
```

### Get Real-time Traffic

```http
GET /traffic/realtime
```

**Response:**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "zones": [
    {
      "zone_id": "ZONE_001",
      "name": "District 1 Central",
      "status": "moderate",
      "avg_speed": 25.3,
      "congestion_level": 0.6,
      "cameras": ["CAM_001", "CAM_002", "CAM_003"]
    }
  ]
}
```

## Accidents

### List Accidents

```http
GET /accidents
```

**Query Parameters:**
- `status` (string): active, resolved, investigating
- `severity` (string): minor, moderate, severe, critical
- `start_time` (string, ISO 8601)
- `end_time` (string, ISO 8601)
- `location` (string): Geo-search (lat,lon,radius_km)

**Response:**

```json
{
  "accidents": [
    {
      "id": "ACC_20240115_001",
      "timestamp": "2024-01-15T10:30:00Z",
      "location": {
        "lat": 10.7769,
        "lon": 106.7009,
        "address": "Nguyen Hue St, District 1"
      },
      "severity": "moderate",
      "status": "active",
      "confidence": 0.92,
      "camera_id": "CAM_001",
      "vehicles_involved": 2,
      "injuries": 0,
      "description": "Two-vehicle collision at intersection"
    }
  ]
}
```

### Get Accident Details

```http
GET /accidents/{accident_id}
```

**Response:**

```json
{
  "id": "ACC_20240115_001",
  "timestamp": "2024-01-15T10:30:00Z",
  "location": {
    "lat": 10.7769,
    "lon": 106.7009,
    "address": "Nguyen Hue St, District 1"
  },
  "severity": "moderate",
  "status": "active",
  "confidence": 0.92,
  "camera_id": "CAM_001",
  "vehicles_involved": 2,
  "injuries": 0,
  "description": "Two-vehicle collision at intersection",
  "detection": {
    "model": "YOLOX-X",
    "confidence": 0.92,
    "bounding_boxes": [...]
  },
  "timeline": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "event": "Accident detected",
      "source": "CV Agent"
    },
    {
      "timestamp": "2024-01-15T10:31:30Z",
      "event": "Emergency services notified",
      "source": "Alert Dispatcher"
    }
  ],
  "images": [
    "https://api.traffic.example.com/images/accidents/ACC_20240115_001_1.jpg",
    "https://api.traffic.example.com/images/accidents/ACC_20240115_001_2.jpg"
  ]
}
```

### Report Accident

```http
POST /accidents
```

**Request Body:**

```json
{
  "location": {
    "lat": 10.7769,
    "lon": 106.7009
  },
  "description": "Multi-vehicle accident blocking two lanes",
  "severity": "severe",
  "reported_by": "citizen",
  "images": [
    "base64_encoded_image_1",
    "base64_encoded_image_2"
  ]
}
```

**Response:**

```json
{
  "id": "ACC_20240115_002",
  "status": "created",
  "verification_status": "pending"
}
```

## Weather

### Get Current Weather

```http
GET /weather/current
```

**Query Parameters:**
- `location` (string): lat,lon or zone_id

**Response:**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "location": {"lat": 10.7769, "lon": 106.7009},
  "temperature": 32.5,
  "humidity": 75,
  "pressure": 1013.25,
  "wind": {
    "speed": 5.2,
    "direction": 180
  },
  "precipitation": 0,
  "conditions": "Partly Cloudy",
  "visibility": 10000,
  "uv_index": 8
}
```

### Get Weather Forecast

```http
GET /weather/forecast
```

**Query Parameters:**
- `location` (string): lat,lon
- `hours` (integer): Forecast hours (default: 24)

**Response:**

```json
{
  "forecast": [
    {
      "timestamp": "2024-01-15T11:00:00Z",
      "temperature": 33.0,
      "precipitation_probability": 20,
      "conditions": "Partly Cloudy"
    }
  ]
}
```

## Air Quality

### Get Air Quality

```http
GET /air-quality
```

**Query Parameters:**
- `location` (string): lat,lon or zone_id

**Response:**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "location": {"lat": 10.7769, "lon": 106.7009},
  "aqi": 85,
  "category": "Moderate",
  "dominant_pollutant": "PM2.5",
  "pollutants": {
    "pm25": 35.2,
    "pm10": 58.3,
    "no2": 42.1,
    "so2": 8.5,
    "co": 0.8,
    "o3": 65.2
  },
  "health_implications": "Unusually sensitive people should consider limiting prolonged outdoor exertion"
}
```

## Analytics

### Get Zone Analytics

```http
GET /analytics/zones/{zone_id}
```

**Query Parameters:**
- `start_time` (string, ISO 8601)
- `end_time` (string, ISO 8601)
- `metrics` (array): List of metrics to include

**Response:**

```json
{
  "zone_id": "ZONE_001",
  "period": {
    "start": "2024-01-15T00:00:00Z",
    "end": "2024-01-15T23:59:59Z"
  },
  "metrics": {
    "total_vehicles": 45320,
    "avg_speed": 32.5,
    "peak_traffic": {
      "time": "17:30",
      "intensity": 98
    },
    "accidents": 3,
    "congestion_hours": 2.5
  }
}
```

### Get Pattern Analysis

```http
GET /analytics/patterns
```

**Response:**

```json
{
  "patterns": [
    {
      "type": "recurring_congestion",
      "location": {"lat": 10.7769, "lon": 106.7009},
      "time_pattern": "weekdays 17:00-19:00",
      "confidence": 0.89,
      "severity": "high"
    }
  ]
}
```

## Citizen Reports

### Submit Report

```http
POST /citizen-reports
```

**Request Body:**

```json
{
  "category": "accident",
  "location": {"lat": 10.7769, "lon": 106.7009},
  "description": "Traffic accident blocking left lane",
  "images": ["base64_encoded_image"],
  "reporter": {
    "name": "Anonymous",
    "contact": "user@example.com"
  }
}
```

**Response:**

```json
{
  "id": "CR_20240115_001",
  "status": "submitted",
  "verification_status": "pending",
  "priority": "high"
}
```

## Error Responses

All endpoints may return these error codes:

```json
// 400 Bad Request
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required parameter: camera_id",
    "details": {}
  }
}

// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Camera CAM_999 not found"
  }
}

// 429 Too Many Requests
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 60 seconds",
    "retry_after": 60
  }
}

// 500 Internal Server Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "request_id": "req_abc123"
  }
}
```

## Rate Limiting

- **Rate Limit**: 1000 requests per hour per API key
- **Burst**: 20 requests per second
- **Headers**: 
  - `X-RateLimit-Limit`: 1000
  - `X-RateLimit-Remaining`: 950
  - `X-RateLimit-Reset`: 1610000000

## Pagination

All list endpoints support pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "next": "/cameras?page=2",
    "prev": null
  }
}
```

## Related Documentation

- [WebSocket API](./websocket.md)
- [NGSI-LD API](./ngsi-ld.md)
- [SPARQL Endpoint](./sparql.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)
