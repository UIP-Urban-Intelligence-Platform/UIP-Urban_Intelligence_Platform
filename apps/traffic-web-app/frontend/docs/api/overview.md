<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
REST API reference overview.

Module: apps/traffic-web-app/frontend/docs/api/overview.md
Author: UIP Team
Version: 1.0.0
-->

# REST API Reference

The HCMC Traffic Monitoring System provides a comprehensive RESTful API for accessing traffic data.

## 🔗 Base URL

```
Development: http://localhost:8001
Production: https://api.traffic.hcmc.gov.vn
```

## 🔐 Authentication

### API Key Authentication

```bash
curl -H "X-API-Key: your_api_key" \
  http://localhost:8001/api/cameras
```

### JWT Token Authentication

```bash
# Get token
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Use token
curl -H "Authorization: Bearer <token>" \
  http://localhost:8001/api/accidents
```

## 📡 Endpoints

### Health Check

#### `GET /health`

Check API server health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "neo4j": "up",
    "fuseki": "up",
    "redis": "up",
    "mongodb": "up"
  }
}
```

---

### Cameras

#### `GET /api/cameras`

Get all camera locations.

**Query Parameters:**
- `status` (optional): Filter by status (`active`, `inactive`, `maintenance`)
- `bbox` (optional): Bounding box `minLon,minLat,maxLon,maxLat`
- `limit` (optional): Max results (default: 100)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "total": 1234,
  "cameras": [
    {
      "id": "CAM_001",
      "name": "Nguyen Hue - Le Loi",
      "location": {
        "type": "Point",
        "coordinates": [106.7009, 10.7769]
      },
      "status": "active",
      "lastUpdate": "2024-01-15T10:30:00Z",
      "imageUrl": "https://cameras.hcmc.gov.vn/CAM_001/latest.jpg"
    }
  ]
}
```

**Example:**
```bash
# Get all active cameras
curl http://localhost:8001/api/cameras?status=active

# Get cameras in bounding box
curl "http://localhost:8001/api/cameras?bbox=106.6,10.7,106.8,10.9"
```

---

#### `GET /api/cameras/{id}`

Get specific camera details.

**Response:**
```json
{
  "id": "CAM_001",
  "name": "Nguyen Hue - Le Loi",
  "location": {
    "type": "Point",
    "coordinates": [106.7009, 10.7769]
  },
  "status": "active",
  "lastUpdate": "2024-01-15T10:30:00Z",
  "imageUrl": "https://cameras.hcmc.gov.vn/CAM_001/latest.jpg",
  "metadata": {
    "resolution": "1920x1080",
    "fps": 30,
    "manufacturer": "Hikvision"
  },
  "recentAccidents": [
    {
      "id": "ACC_123",
      "timestamp": "2024-01-15T09:15:00Z",
      "severity": "high"
    }
  ]
}
```

---

#### `GET /api/cameras/{id}/image`

Get latest camera image.

**Response:** Image data (JPEG)

**Example:**
```bash
curl http://localhost:8001/api/cameras/CAM_001/image \
  -o camera_image.jpg
```

---

### Accidents

#### `GET /api/accidents`

Get accident data.

**Query Parameters:**
- `status` (optional): `active`, `resolved`, `false_alarm`
- `severity` (optional): `low`, `medium`, `high`, `critical`
- `startTime` (optional): ISO 8601 timestamp
- `endTime` (optional): ISO 8601 timestamp
- `bbox` (optional): Bounding box filter
- `limit` (optional): Max results
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "total": 45,
  "accidents": [
    {
      "id": "ACC_123",
      "type": "vehicle_collision",
      "severity": "high",
      "status": "active",
      "location": {
        "type": "Point",
        "coordinates": [106.7009, 10.7769]
      },
      "timestamp": "2024-01-15T09:15:00Z",
      "cameraId": "CAM_001",
      "detectedBy": "yolox",
      "confidence": 0.92,
      "affectedLanes": 2,
      "estimatedDuration": 45,
      "description": "Two-vehicle collision blocking lanes",
      "imageUrl": "https://storage/accidents/ACC_123.jpg"
    }
  ]
}
```

**Example:**
```bash
# Get active accidents
curl http://localhost:8001/api/accidents?status=active

# Get high-severity accidents in last hour
curl "http://localhost:8001/api/accidents?severity=high&startTime=2024-01-15T09:00:00Z"
```

---

#### `GET /api/accidents/{id}`

Get specific accident details.

**Response:**
```json
{
  "id": "ACC_123",
  "type": "vehicle_collision",
  "severity": "high",
  "status": "active",
  "location": {
    "type": "Point",
    "coordinates": [106.7009, 10.7769]
  },
  "timestamp": "2024-01-15T09:15:00Z",
  "resolvedAt": null,
  "cameraId": "CAM_001",
  "detectedBy": "yolox",
  "confidence": 0.92,
  "vehiclesInvolved": [
    {
      "type": "car",
      "bbox": [100, 200, 300, 400],
      "damage": "severe"
    },
    {
      "type": "motorcycle",
      "bbox": [350, 180, 420, 380],
      "damage": "moderate"
    }
  ],
  "affectedLanes": 2,
  "trafficImpact": "high",
  "estimatedDuration": 45,
  "emergencyServicesNotified": true,
  "updates": [
    {
      "timestamp": "2024-01-15T09:20:00Z",
      "status": "emergency_services_dispatched",
      "message": "Ambulance and police en route"
    }
  ]
}
```

---

### Weather

#### `GET /api/weather`

Get current weather data for Ho Chi Minh City.

**Response:**
```json
{
  "location": "Ho Chi Minh City",
  "timestamp": "2024-01-15T10:30:00Z",
  "temperature": 32.5,
  "humidity": 75,
  "conditions": "partly_cloudy",
  "windSpeed": 15,
  "windDirection": "NE",
  "rainfall": 0,
  "visibility": 10000,
  "pressure": 1013
}
```

---

#### `GET /api/weather/forecast`

Get weather forecast (next 7 days).

**Response:**
```json
{
  "location": "Ho Chi Minh City",
  "forecast": [
    {
      "date": "2024-01-16",
      "tempMin": 25,
      "tempMax": 34,
      "conditions": "sunny",
      "rainProbability": 10
    }
  ]
}
```

---

### Air Quality

#### `GET /api/air-quality`

Get current air quality data.

**Response:**
```json
{
  "location": "Ho Chi Minh City",
  "timestamp": "2024-01-15T10:30:00Z",
  "aqi": 78,
  "level": "moderate",
  "pm25": 35,
  "pm10": 65,
  "no2": 42,
  "so2": 15,
  "co": 0.8,
  "o3": 55
}
```

---

### Traffic Flow

#### `GET /api/traffic-flow`

Get traffic flow data.

**Query Parameters:**
- `roadSegmentId` (optional): Specific road segment
- `startTime` (optional): Start time
- `endTime` (optional): End time

**Response:**
```json
{
  "segments": [
    {
      "id": "SEG_001",
      "name": "Nguyen Hue Boulevard",
      "coordinates": [[106.7, 10.77], [106.71, 10.78]],
      "currentSpeed": 25,
      "normalSpeed": 40,
      "congestionLevel": "medium",
      "vehicleCount": 245,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Citizen Reports

#### `POST /api/citizen-reports`

Submit a citizen traffic report.

**Request Body:**
```json
{
  "type": "accident",
  "location": {
    "type": "Point",
    "coordinates": [106.7009, 10.7769]
  },
  "description": "Two-car collision blocking right lane",
  "severity": "medium",
  "image": "<base64_encoded_image>"
}
```

**Response:**
```json
{
  "id": "REPORT_456",
  "status": "pending",
  "submittedAt": "2024-01-15T10:32:00Z",
  "verificationStatus": "in_progress",
  "message": "Report received. Verification in progress."
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:8001/api/citizen-reports \
  -H "Content-Type: application/json" \
  -d '{
    "type": "accident",
    "location": {"type": "Point", "coordinates": [106.7009, 10.7769]},
    "description": "Car accident on highway",
    "severity": "high"
  }'
```

---

#### `GET /api/citizen-reports/{id}`

Get citizen report status.

**Response:**
```json
{
  "id": "REPORT_456",
  "type": "accident",
  "status": "verified",
  "submittedAt": "2024-01-15T10:32:00Z",
  "verifiedAt": "2024-01-15T10:35:00Z",
  "verificationMethod": "yolox",
  "confidence": 0.88,
  "location": {
    "type": "Point",
    "coordinates": [106.7009, 10.7769]
  },
  "description": "Two-car collision blocking right lane",
  "severity": "medium",
  "linkedAccidentId": "ACC_124"
}
```

---

### Analytics

#### `GET /api/analytics/summary`

Get traffic analytics summary.

**Query Parameters:**
- `timeRange` (optional): `1h`, `24h`, `7d`, `30d` (default: `24h`)

**Response:**
```json
{
  "timeRange": "24h",
  "totalAccidents": 45,
  "accidentsByType": {
    "vehicle_collision": 32,
    "pedestrian_incident": 8,
    "motorcycle_accident": 5
  },
  "accidentsBySeverity": {
    "low": 20,
    "medium": 15,
    "high": 8,
    "critical": 2
  },
  "averageResponseTime": 12.5,
  "topAccidentLocations": [
    {
      "location": "Nguyen Hue - Le Loi",
      "count": 8
    }
  ],
  "congestionHotspots": [
    {
      "location": "District 1 Center",
      "avgCongestionLevel": 85
    }
  ]
}
```

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (missing/invalid API key) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## 🚦 Rate Limiting

- **Anonymous**: 100 requests/hour
- **Authenticated**: 1,000 requests/hour
- **Premium**: 10,000 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1673791200
```

## 🔧 Error Responses

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid bounding box format",
    "details": {
      "parameter": "bbox",
      "expected": "minLon,minLat,maxLon,maxLat"
    }
  }
}
```

---

Next: [WebSocket API](../api/websocket/connection) for real-time updates.
