<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Complete API reference documentation.

Module: apps/traffic-web-app/frontend/docs/docs/api/complete-api-reference.md
Author: UIP Team
Version: 1.0.0
-->

# Complete API Reference

## Overview

Comprehensive API documentation for HCMC Traffic Management System covering REST API, WebSocket API, NGSI-LD Context Broker API, SPARQL Endpoint, and GraphQL API.

**Base URLs:**
- REST API: `https://api.traffic.hcmc.gov.vn/v1`
- WebSocket: `wss://api.traffic.hcmc.gov.vn/ws`
- NGSI-LD: `https://context.traffic.hcmc.gov.vn/ngsi-ld/v1`
- SPARQL: `https://rdf.traffic.hcmc.gov.vn/sparql`
- GraphQL: `https://api.traffic.hcmc.gov.vn/graphql`

---

## Table of Contents

### [REST API](#rest-api)
1. [Authentication](#authentication)
2. [Cameras](#cameras-api)
3. [Accidents](#accidents-api)
4. [Traffic](#traffic-api)
5. [Weather](#weather-api)
6. [Air Quality](#air-quality-api)
7. [Analytics](#analytics-api)
8. [Citizen Reports](#citizen-reports-api)
9. [Alerts](#alerts-api)
10. [Users](#users-api)

### [WebSocket API](#websocket-api)
11. [Connection](#websocket-connection)
12. [Real-Time Traffic](#realtime-traffic)
13. [Accident Updates](#accident-updates)
14. [Weather Updates](#weather-updates)
15. [Alert Notifications](#alert-notifications)

### [NGSI-LD API](#ngsi-ld-api)
16. [Entities](#ngsi-ld-entities)
17. [Subscriptions](#ngsi-ld-subscriptions)
18. [Temporal Queries](#temporal-queries)
19. [Geo Queries](#geo-queries)

### [SPARQL API](#sparql-api)
20. [Query Endpoint](#sparql-query)
21. [Update Endpoint](#sparql-update)
22. [Common Queries](#common-sparql-queries)

### [GraphQL API](#graphql-api)
23. [Schema](#graphql-schema)
24. [Queries](#graphql-queries)
25. [Mutations](#graphql-mutations)
26. [Subscriptions](#graphql-subscriptions)

---

# REST API

## Authentication

### Overview
Token-based authentication using JWT (JSON Web Tokens).

### Login

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "username": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**cURL:**
```bash
curl -X POST https://api.traffic.hcmc.gov.vn/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user@example.com","password":"securePassword123"}'
```

### Refresh Token

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Python:**
```python
import requests

def refresh_access_token(refresh_token: str) -> str:
    response = requests.post(
        'https://api.traffic.hcmc.gov.vn/v1/auth/refresh',
        json={'refresh_token': refresh_token}
    )
    return response.json()['access_token']
```

### Using Authentication

Include the access token in the `Authorization` header:

```bash
curl -X GET https://api.traffic.hcmc.gov.vn/v1/cameras \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

```python
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}
response = requests.get('https://api.traffic.hcmc.gov.vn/v1/cameras', headers=headers)
```

---

## Cameras API

### List Cameras

**Endpoint:** `GET /cameras`

**Query Parameters:**
- `district` (optional): Filter by district (e.g., "District 1")
- `status` (optional): Filter by status ("active", "inactive", "error")
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "total": 150,
  "limit": 50,
  "offset": 0,
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
      "stream_url": "rtsp://stream.traffic.hcmc.gov.vn/CAM_001",
      "capabilities": ["accident_detection", "vehicle_count", "speed_detection"]
    }
  ]
}
```

**cURL:**
```bash
curl -X GET "https://api.traffic.hcmc.gov.vn/v1/cameras?district=District%201&status=active&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Python:**
```python
import requests

def get_cameras(district=None, status=None, limit=50):
    params = {'limit': limit}
    if district:
        params['district'] = district
    if status:
        params['status'] = status
    
    response = requests.get(
        'https://api.traffic.hcmc.gov.vn/v1/cameras',
        headers={'Authorization': f'Bearer {access_token}'},
        params=params
    )
    return response.json()
```

### Get Camera Details

**Endpoint:** `GET /cameras/{camera_id}`

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
  "last_update": "2024-01-15T10:30:00Z",
  "stream_url": "rtsp://stream.traffic.hcmc.gov.vn/CAM_001",
  "capabilities": ["accident_detection", "vehicle_count", "speed_detection"],
  "statistics": {
    "uptime_24h": 99.5,
    "detections_today": 15234,
    "avg_vehicle_count": 145
  }
}
```

### Get Camera Latest Image

**Endpoint:** `GET /cameras/{camera_id}/latest-image`

**Response:** Binary image data (JPEG)

**cURL:**
```bash
curl -X GET "https://api.traffic.hcmc.gov.vn/v1/cameras/CAM_001/latest-image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o latest_image.jpg
```

### Get Camera Statistics

**Endpoint:** `GET /cameras/{camera_id}/statistics`

**Query Parameters:**
- `start_date` (required): Start date (ISO 8601)
- `end_date` (required): End date (ISO 8601)
- `interval` (optional): Data interval ("hour", "day", "week") default: "hour"

**Response:**
```json
{
  "camera_id": "CAM_001",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-01-31T23:59:59Z",
  "interval": "day",
  "data": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "vehicle_count": 12345,
      "avg_speed": 35.5,
      "accidents_detected": 2
    }
  ]
}
```

---

## Accidents API

### List Accidents

**Endpoint:** `GET /accidents`

**Query Parameters:**
- `start_date` (optional): Filter from date
- `end_date` (optional): Filter to date
- `severity` (optional): Filter by severity ("minor", "moderate", "severe", "critical")
- `district` (optional): Filter by district
- `limit` (optional): Results limit (default: 50)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "total": 234,
  "limit": 50,
  "offset": 0,
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
      "vehicles_involved": 2,
      "injuries": 1,
      "fatalities": 0,
      "status": "resolved",
      "camera_id": "CAM_001",
      "detection_method": "yolox_x",
      "confidence": 0.95,
      "images": [
        "https://storage.traffic.hcmc.gov.vn/accidents/ACC_20240115_001_1.jpg"
      ]
    }
  ]
}
```

**Python:**
```python
from datetime import datetime, timedelta

def get_accidents_today(severity=None):
    today = datetime.now().date()
    params = {
        'start_date': today.isoformat(),
        'end_date': (today + timedelta(days=1)).isoformat()
    }
    if severity:
        params['severity'] = severity
    
    response = requests.get(
        'https://api.traffic.hcmc.gov.vn/v1/accidents',
        headers={'Authorization': f'Bearer {access_token}'},
        params=params
    )
    return response.json()
```

### Get Accident Details

**Endpoint:** `GET /accidents/{accident_id}`

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
  "vehicles_involved": 2,
  "injuries": 1,
  "fatalities": 0,
  "status": "resolved",
  "camera_id": "CAM_001",
  "detection_method": "yolox_x",
  "confidence": 0.95,
  "images": [
    "https://storage.traffic.hcmc.gov.vn/accidents/ACC_20240115_001_1.jpg"
  ],
  "timeline": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "event": "detected",
      "description": "Accident detected by camera CAM_001"
    },
    {
      "timestamp": "2024-01-15T10:35:00Z",
      "event": "alert_sent",
      "description": "Emergency services notified"
    },
    {
      "timestamp": "2024-01-15T11:15:00Z",
      "event": "resolved",
      "description": "Scene cleared, traffic resumed"
    }
  ]
}
```

### Create Accident Report (Citizen)

**Endpoint:** `POST /accidents/report`

**Request:**
```json
{
  "location": {
    "lat": 10.7769,
    "lon": 106.7009
  },
  "severity": "moderate",
  "description": "Two-vehicle collision at intersection",
  "vehicles_involved": 2,
  "injuries": 1,
  "reporter": {
    "name": "Nguyen Van A",
    "phone": "+84901234567",
    "email": "nguyenvana@example.com"
  },
  "images": [
    "base64_encoded_image_data_1",
    "base64_encoded_image_data_2"
  ]
}
```

**Response:**
```json
{
  "id": "ACC_20240115_CR_001",
  "status": "submitted",
  "verification_status": "pending",
  "message": "Report submitted successfully. Thank you for your contribution."
}
```

---

## Traffic API

### Get Real-Time Traffic

**Endpoint:** `GET /traffic/realtime`

**Query Parameters:**
- `zone_id` (optional): Filter by zone
- `district` (optional): Filter by district

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "zones": [
    {
      "id": "ZONE_001",
      "name": "District 1 Central",
      "congestion_level": "moderate",
      "avg_speed": 25.5,
      "vehicle_count": 345,
      "incident_count": 1
    }
  ]
}
```

### Get Traffic Forecast

**Endpoint:** `GET /traffic/forecast`

**Query Parameters:**
- `zone_id` (required): Zone ID
- `hours` (optional): Forecast hours ahead (default: 24, max: 72)

**Response:**
```json
{
  "zone_id": "ZONE_001",
  "forecast": [
    {
      "timestamp": "2024-01-15T11:00:00Z",
      "predicted_congestion": "moderate",
      "predicted_speed": 28.3,
      "confidence": 0.85
    }
  ]
}
```

### Get Congestion Zones

**Endpoint:** `GET /traffic/congestion-zones`

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "zones": [
    {
      "id": "ZONE_001",
      "name": "District 1 Central",
      "polygon": [
        [10.7769, 106.7009],
        [10.7799, 106.7039],
        [10.7749, 106.7059]
      ],
      "level": "moderate",
      "avg_speed": 25.5
    }
  ]
}
```

---

## Weather API

### Get Current Weather

**Endpoint:** `GET /weather/current`

**Query Parameters:**
- `location` (optional): Location coordinates "lat,lon"

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "location": {
    "lat": 10.7769,
    "lon": 106.7009
  },
  "temperature": 32.5,
  "feels_like": 35.2,
  "humidity": 75,
  "pressure": 1013,
  "wind": {
    "speed": 5.5,
    "direction": 180,
    "gust": 8.2
  },
  "precipitation": 0,
  "conditions": "partly_cloudy",
  "visibility": 10000
}
```

### Get Weather Forecast

**Endpoint:** `GET /weather/forecast`

**Query Parameters:**
- `hours` (optional): Forecast hours (default: 24, max: 168)

**Response:**
```json
{
  "forecast": [
    {
      "timestamp": "2024-01-15T11:00:00Z",
      "temperature": 33.0,
      "precipitation_probability": 15,
      "conditions": "sunny"
    }
  ]
}
```

---

## Air Quality API

### Get Current AQI

**Endpoint:** `GET /air-quality/current`

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "stations": [
    {
      "id": "AQI_001",
      "name": "District 1 Monitoring Station",
      "location": {
        "lat": 10.7769,
        "lon": 106.7009
      },
      "aqi": 85,
      "category": "moderate",
      "pollutants": {
        "pm25": 35.5,
        "pm10": 58.2,
        "no2": 42.1,
        "so2": 12.5,
        "co": 0.8,
        "o3": 55.3
      }
    }
  ]
}
```

### Get AQI History

**Endpoint:** `GET /air-quality/history`

**Query Parameters:**
- `station_id` (required): Station ID
- `start_date` (required): Start date
- `end_date` (required): End date
- `interval` (optional): "hour" or "day"

**Response:**
```json
{
  "station_id": "AQI_001",
  "data": [
    {
      "timestamp": "2024-01-15T00:00:00Z",
      "aqi": 85,
      "category": "moderate",
      "pm25": 35.5
    }
  ]
}
```

---

## Analytics API

### Get Analytics Summary

**Endpoint:** `GET /analytics/summary`

**Query Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `metrics` (optional): Comma-separated metrics list

**Response:**
```json
{
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "metrics": {
    "total_vehicles": 1234567,
    "avg_speed": 35.5,
    "total_accidents": 234,
    "avg_congestion": 0.45,
    "peak_hours": ["08:00-09:00", "17:00-19:00"]
  }
}
```

### Get Pattern Analysis

**Endpoint:** `GET /analytics/patterns`

**Query Parameters:**
- `type` (required): Pattern type ("temporal", "spatial", "correlation")
- `start_date` (required): Start date
- `end_date` (required): End date

**Response:**
```json
{
  "pattern_type": "temporal",
  "patterns": [
    {
      "pattern": "peak_hour",
      "time_range": "08:00-09:00",
      "frequency": 0.95,
      "confidence": 0.87,
      "description": "Consistent morning peak observed"
    }
  ]
}
```

### Get Correlation Analysis

**Endpoint:** `GET /analytics/correlations`

**Response:**
```json
{
  "correlations": [
    {
      "factor1": "weather_rain",
      "factor2": "accidents",
      "correlation": 0.65,
      "p_value": 0.001,
      "significance": "high"
    },
    {
      "factor1": "aqi",
      "factor2": "congestion",
      "correlation": 0.42,
      "p_value": 0.05,
      "significance": "moderate"
    }
  ]
}
```

---

## Citizen Reports API

### Submit Report

**Endpoint:** `POST /citizen-reports`

**Request:**
```json
{
  "category": "accident",
  "location": {
    "lat": 10.7769,
    "lon": 106.7009
  },
  "description": "Traffic accident at intersection",
  "images": ["base64_image_1", "base64_image_2"],
  "reporter": {
    "name": "Nguyen Van A",
    "phone": "+84901234567"
  }
}
```

**Response:**
```json
{
  "id": "CR_20240115_001",
  "status": "submitted",
  "verification_status": "pending",
  "estimated_verification_time": "5-10 minutes"
}
```

### Get Report Status

**Endpoint:** `GET /citizen-reports/{report_id}`

**Response:**
```json
{
  "id": "CR_20240115_001",
  "status": "verified",
  "verification_status": "confirmed",
  "verified_at": "2024-01-15T10:35:00Z",
  "linked_accident_id": "ACC_20240115_001"
}
```

---

## Alerts API

### Subscribe to Alerts

**Endpoint:** `POST /alerts/subscriptions`

**Request:**
```json
{
  "user_id": "USER_001",
  "alert_types": ["accident", "congestion", "weather"],
  "locations": ["District 1", "District 3"],
  "severity_threshold": "moderate",
  "channels": ["email", "push", "sms"]
}
```

**Response:**
```json
{
  "subscription_id": "SUB_001",
  "status": "active",
  "message": "Subscription created successfully"
}
```

### Get Active Alerts

**Endpoint:** `GET /alerts/active`

**Response:**
```json
{
  "alerts": [
    {
      "id": "ALERT_001",
      "type": "accident",
      "severity": "high",
      "location": {
        "lat": 10.7769,
        "lon": 106.7009,
        "address": "Nguyen Hue St, District 1"
      },
      "message": "Severe accident reported. Expect delays.",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

# WebSocket API

## WebSocket Connection

### Connection

**Endpoint:** `wss://api.traffic.hcmc.gov.vn/ws`

**Authentication:** Include token in query parameter or connection header

**JavaScript:**
```javascript
const ws = new WebSocket('wss://api.traffic.hcmc.gov.vn/ws?token=YOUR_TOKEN');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  
  // Subscribe to channels
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['traffic', 'accidents', 'weather']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket');
};
```

**Python:**
```python
import asyncio
import websockets
import json

async def connect_websocket():
    uri = f"wss://api.traffic.hcmc.gov.vn/ws?token={access_token}"
    
    async with websockets.connect(uri) as websocket:
        # Subscribe to channels
        await websocket.send(json.dumps({
            'type': 'subscribe',
            'channels': ['traffic', 'accidents', 'weather']
        }))
        
        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data}")

asyncio.run(connect_websocket())
```

---

## Real-Time Traffic

### Subscribe to Traffic Updates

**Message:**
```json
{
  "type": "subscribe",
  "channels": ["traffic"],
  "zones": ["ZONE_001", "ZONE_002"]
}
```

**Updates:**
```json
{
  "channel": "traffic",
  "type": "update",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "zone_id": "ZONE_001",
    "congestion_level": "moderate",
    "avg_speed": 25.5,
    "vehicle_count": 345
  }
}
```

---

## Accident Updates

### Subscribe to Accident Alerts

**Message:**
```json
{
  "type": "subscribe",
  "channels": ["accidents"],
  "severity": ["moderate", "severe", "critical"]
}
```

**Alerts:**
```json
{
  "channel": "accidents",
  "type": "alert",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "ACC_20240115_001",
    "severity": "severe",
    "location": {
      "lat": 10.7769,
      "lon": 106.7009
    },
    "message": "Severe accident detected on Nguyen Hue St"
  }
}
```

---

# NGSI-LD API

## NGSI-LD Entities

### Create Entity

**Endpoint:** `POST /ngsi-ld/v1/entities`

**Request:**
```json
{
  "id": "urn:ngsi-ld:TrafficCamera:CAM_001",
  "type": "TrafficCamera",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  },
  "status": {
    "type": "Property",
    "value": "active"
  },
  "lastUpdate": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-01-15T10:30:00Z"
    }
  }
}
```

**cURL:**
```bash
curl -X POST https://context.traffic.hcmc.gov.vn/ngsi-ld/v1/entities \
  -H "Content-Type: application/ld+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @entity.json
```

### Query Entities

**Endpoint:** `GET /ngsi-ld/v1/entities`

**Query Parameters:**
- `type`: Entity type
- `q`: Query string
- `georel`: Geo-relationship
- `geometry`: Geometry type
- `coordinates`: Coordinates
- `limit`: Results limit

**Example:**
```bash
# Get all cameras within 1km of a point
curl -X GET "https://context.traffic.hcmc.gov.vn/ngsi-ld/v1/entities?type=TrafficCamera&georel=near;maxDistance==1000&geometry=Point&coordinates=[106.7009,10.7769]" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Entity

**Endpoint:** `PATCH /ngsi-ld/v1/entities/{entityId}/attrs`

**Request:**
```json
{
  "status": {
    "type": "Property",
    "value": "inactive"
  }
}
```

---

## NGSI-LD Subscriptions

### Create Subscription

**Endpoint:** `POST /ngsi-ld/v1/subscriptions`

**Request:**
```json
{
  "id": "urn:ngsi-ld:Subscription:SUB_001",
  "type": "Subscription",
  "entities": [
    {
      "type": "TrafficAccident"
    }
  ],
  "watchedAttributes": ["severity", "status"],
  "notification": {
    "endpoint": {
      "uri": "https://myapp.example.com/notifications",
      "accept": "application/json"
    }
  }
}
```

---

## Temporal Queries

### Query Temporal Data

**Endpoint:** `GET /ngsi-ld/v1/temporal/entities`

**Example:**
```bash
curl -X GET "https://context.traffic.hcmc.gov.vn/ngsi-ld/v1/temporal/entities?type=TrafficCamera&timerel=between&timeAt=2024-01-01T00:00:00Z&endTimeAt=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

# SPARQL API

## SPARQL Query

### Query Endpoint

**Endpoint:** `POST /sparql`

**Content-Type:** `application/sparql-query`

**Example Query:**
```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX traffic: <http://traffic.hcmc.gov.vn/ontology#>

SELECT ?camera ?lat ?lon ?status
WHERE {
  ?camera a traffic:TrafficCamera ;
          geo:lat ?lat ;
          geo:long ?lon ;
          traffic:status ?status .
  FILTER(?status = "active")
}
LIMIT 100
```

**cURL:**
```bash
curl -X POST https://rdf.traffic.hcmc.gov.vn/sparql \
  -H "Content-Type: application/sparql-query" \
  -H "Accept: application/sparql-results+json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --data-binary @query.sparql
```

**Python:**
```python
from SPARQLWrapper import SPARQLWrapper, JSON

sparql = SPARQLWrapper("https://rdf.traffic.hcmc.gov.vn/sparql")
sparql.setHTTPAuth('Bearer')
sparql.setCredentials('', access_token)

sparql.setQuery("""
    PREFIX traffic: <http://traffic.hcmc.gov.vn/ontology#>
    SELECT ?camera ?lat ?lon
    WHERE {
        ?camera a traffic:TrafficCamera ;
                geo:lat ?lat ;
                geo:long ?lon .
    }
    LIMIT 10
""")

sparql.setReturnFormat(JSON)
results = sparql.query().convert()

for result in results["results"]["bindings"]:
    print(f"Camera: {result['camera']['value']}")
```

---

## Common SPARQL Queries

### Get All Accidents in Date Range

```sparql
PREFIX traffic: <http://traffic.hcmc.gov.vn/ontology#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?accident ?timestamp ?severity ?location
WHERE {
  ?accident a traffic:TrafficAccident ;
            traffic:timestamp ?timestamp ;
            traffic:severity ?severity ;
            traffic:location ?location .
  FILTER(?timestamp >= "2024-01-01T00:00:00Z"^^xsd:dateTime &&
         ?timestamp <= "2024-01-31T23:59:59Z"^^xsd:dateTime)
}
ORDER BY DESC(?timestamp)
```

### Get Cameras Near Location

```sparql
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX traffic: <http://traffic.hcmc.gov.vn/ontology#>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>

SELECT ?camera ?distance
WHERE {
  ?camera a traffic:TrafficCamera ;
          geo:lat ?lat ;
          geo:long ?lon .
  
  BIND(geof:distance(
    "POINT(106.7009 10.7769)"^^geo:wktLiteral,
    CONCAT("POINT(", STR(?lon), " ", STR(?lat), ")")
  ) AS ?distance)
  
  FILTER(?distance < 1000)
}
ORDER BY ?distance
```

---

# GraphQL API

## GraphQL Schema

### Types

```graphql
type Camera {
  id: ID!
  name: String!
  location: Location!
  status: CameraStatus!
  lastUpdate: DateTime!
  capabilities: [String!]!
  statistics: CameraStatistics
}

type Location {
  lat: Float!
  lon: Float!
  address: String
}

enum CameraStatus {
  ACTIVE
  INACTIVE
  ERROR
}

type Accident {
  id: ID!
  timestamp: DateTime!
  location: Location!
  severity: AccidentSeverity!
  vehiclesInvolved: Int!
  injuries: Int!
  fatalities: Int!
  status: AccidentStatus!
  camera: Camera
  images: [String!]!
}

enum AccidentSeverity {
  MINOR
  MODERATE
  SEVERE
  CRITICAL
}

type Query {
  cameras(
    district: String
    status: CameraStatus
    limit: Int
    offset: Int
  ): CameraConnection!
  
  camera(id: ID!): Camera
  
  accidents(
    startDate: DateTime
    endDate: DateTime
    severity: AccidentSeverity
    district: String
    limit: Int
    offset: Int
  ): AccidentConnection!
  
  accident(id: ID!): Accident
  
  traffic(zoneId: String): TrafficData!
  
  weather: WeatherData!
  
  airQuality: AirQualityData!
}

type Mutation {
  submitCitizenReport(input: CitizenReportInput!): CitizenReport!
  
  updateCameraStatus(id: ID!, status: CameraStatus!): Camera!
}

type Subscription {
  trafficUpdates(zones: [String!]): TrafficData!
  
  accidentAlerts(severity: [AccidentSeverity!]): Accident!
  
  weatherUpdates: WeatherData!
}
```

---

## GraphQL Queries

### Query Cameras

```graphql
query GetCameras($district: String, $status: CameraStatus) {
  cameras(district: $district, status: $status, limit: 10) {
    edges {
      node {
        id
        name
        location {
          lat
          lon
          address
        }
        status
        lastUpdate
        capabilities
      }
    }
    totalCount
  }
}
```

**Variables:**
```json
{
  "district": "District 1",
  "status": "ACTIVE"
}
```

**JavaScript:**
```javascript
const query = `
  query GetCameras($district: String) {
    cameras(district: $district, limit: 10) {
      edges {
        node {
          id
          name
          location {
            lat
            lon
          }
        }
      }
    }
  }
`;

fetch('https://api.traffic.hcmc.gov.vn/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query,
    variables: { district: 'District 1' }
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

### Query Accidents with Details

```graphql
query GetAccidents($startDate: DateTime!, $severity: AccidentSeverity) {
  accidents(
    startDate: $startDate
    severity: $severity
    limit: 20
  ) {
    edges {
      node {
        id
        timestamp
        location {
          lat
          lon
          address
        }
        severity
        vehiclesInvolved
        injuries
        fatalities
        status
        camera {
          id
          name
        }
        images
      }
    }
    totalCount
  }
}
```

---

## GraphQL Mutations

### Submit Citizen Report

```graphql
mutation SubmitReport($input: CitizenReportInput!) {
  submitCitizenReport(input: $input) {
    id
    status
    verificationStatus
    message
  }
}
```

**Variables:**
```json
{
  "input": {
    "category": "ACCIDENT",
    "location": {
      "lat": 10.7769,
      "lon": 106.7009
    },
    "description": "Traffic accident at intersection",
    "images": ["base64_image_1"],
    "reporter": {
      "name": "Nguyen Van A",
      "phone": "+84901234567"
    }
  }
}
```

---

## GraphQL Subscriptions

### Subscribe to Accident Alerts

```graphql
subscription AccidentAlerts($severity: [AccidentSeverity!]) {
  accidentAlerts(severity: $severity) {
    id
    timestamp
    location {
      lat
      lon
      address
    }
    severity
    vehiclesInvolved
  }
}
```

**JavaScript:**
```javascript
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'wss://api.traffic.hcmc.gov.vn/graphql',
    connectionParams: {
      authorization: `Bearer ${token}`
    }
  })
);

const subscription = client.subscribe({
  query: gql`
    subscription {
      accidentAlerts(severity: [SEVERE, CRITICAL]) {
        id
        severity
        location {
          lat
          lon
        }
      }
    }
  `
});

subscription.subscribe({
  next: (data) => console.log('New accident:', data),
  error: (error) => console.error('Error:', error)
});
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Response Format

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid district parameter",
    "details": {
      "parameter": "district",
      "value": "Invalid District",
      "expected": "District 1-12"
    }
  }
}
```

---

## Rate Limiting

### Limits

- **Free Tier**: 100 requests/hour
- **Basic Tier**: 1,000 requests/hour
- **Premium Tier**: 10,000 requests/hour
- **Enterprise**: Custom limits

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642248000
```

---

## Pagination

### Cursor-Based Pagination

```bash
GET /cameras?limit=50&cursor=eyJpZCI6IkNBTV8wNTAifQ
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6IkNBTV8xMDAifQ",
    "has_more": true
  }
}
```

---

## SDKs and Libraries

### Python SDK

```python
pip install hcmc-traffic-sdk

from hcmc_traffic import TrafficAPI

client = TrafficAPI(api_key='YOUR_API_KEY')

# Get cameras
cameras = client.cameras.list(district='District 1')

# Get accidents
accidents = client.accidents.list(
    start_date='2024-01-01',
    severity='severe'
)
```

### JavaScript SDK

```bash
npm install @hcmc-traffic/sdk
```

```javascript
import TrafficAPI from '@hcmc-traffic/sdk';

const client = new TrafficAPI({ apiKey: 'YOUR_API_KEY' });

// Get cameras
const cameras = await client.cameras.list({ district: 'District 1' });

// Get accidents
const accidents = await client.accidents.list({
  startDate: '2024-01-01',
  severity: 'severe'
});
```

---

## Related Documentation

- [Complete Agents Reference](../agents/complete-agents-reference.md)
- [Complete Components Reference](../frontend/complete-components-reference.md)
- [Data Models & Standards](../data-models/complete-standards.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)

See [LICENSE](../LICENSE) for details.
