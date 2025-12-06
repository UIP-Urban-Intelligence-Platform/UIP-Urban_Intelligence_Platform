<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Main API documentation.

Module: apps/traffic-web-app/frontend/docs/api/API.md
Author: UIP Team
Version: 1.0.0
-->

# UIP - Urban Intelligence Platform - API Documentation

## Overview

The UIP - Urban Intelligence Platform system provides a RESTful API for accessing traffic monitoring data, querying entities, and managing system operations.

**Base URL**: `http://localhost:8000/api/v1`

**Authentication**: API Key (Header: `X-API-Key`)

## API Endpoints

### Health & Status

#### `GET /health`
Check system health status.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-10T10:30:00Z",
  "components": {
    "stellio": "up",
    "neo4j": "up",
    "fuseki": "up",
    "kafka": "up",
    "redis": "up"
  },
  "version": "1.0.0"
}
```

#### `GET /metrics`
Get Prometheus metrics.

**Response**: Prometheus text format

---

### Entities

#### `GET /entities`
Retrieve NGSI-LD entities.

**Query Parameters**:
- `type` (string): Entity type filter (e.g., `TrafficCamera`, `TrafficObservation`)
- `limit` (integer): Maximum number of entities (default: 100, max: 1000)
- `offset` (integer): Pagination offset (default: 0)
- `q` (string): NGSI-LD query filter
- `georel` (string): Geo-relationship (e.g., `near;maxDistance==5000`)
- `geometry` (string): Geometry type (e.g., `Point`)
- `coordinates` (string): GeoJSON coordinates
- `timerel` (string): Temporal relationship (e.g., `after`, `before`, `between`)
- `timeAt` (string): Timestamp for temporal query (ISO 8601)
- `endTimeAt` (string): End timestamp for temporal range

**Example Request**:
```http
GET /entities?type=TrafficCamera&limit=50&georel=near;maxDistance==5000&geometry=Point&coordinates=[106.660172,10.762622]
```

**Response**:
```json
[
  {
    "id": "urn:ngsi-ld:TrafficCamera:CAM001",
    "type": "TrafficCamera",
    "name": {
      "type": "Property",
      "value": "Camera Nguyen Hue"
    },
    "location": {
      "type": "GeoProperty",
      "value": {
        "type": "Point",
        "coordinates": [106.700981, 10.775264]
      }
    },
    "status": {
      "type": "Property",
      "value": "active"
    },
    "vehicleCount": {
      "type": "Property",
      "value": 42,
      "observedAt": "2025-06-10T10:30:00Z"
    },
    "@context": [
      "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
    ]
  }
]
```

#### `GET /entities/{entityId}`
Retrieve a specific entity by ID.

**Path Parameters**:
- `entityId` (string, required): NGSI-LD entity ID

**Query Parameters**:
- `options` (string): Options like `keyValues`, `sysAttrs`

**Example Request**:
```http
GET /entities/urn:ngsi-ld:TrafficCamera:CAM001?options=keyValues
```

**Response**:
```json
{
  "id": "urn:ngsi-ld:TrafficCamera:CAM001",
  "type": "TrafficCamera",
  "name": "Camera Nguyen Hue",
  "location": {
    "type": "Point",
    "coordinates": [106.700981, 10.775264]
  },
  "status": "active",
  "vehicleCount": 42,
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ]
}
```

#### `POST /entities`
Create a new NGSI-LD entity.

**Request Body**:
```json
{
  "id": "urn:ngsi-ld:TrafficCamera:CAM999",
  "type": "TrafficCamera",
  "name": {
    "type": "Property",
    "value": "New Camera"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.700981, 10.775264]
    }
  },
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ]
}
```

**Response**: `201 Created`
```json
{
  "id": "urn:ngsi-ld:TrafficCamera:CAM999",
  "createdAt": "2025-06-10T10:30:00Z"
}
```

#### `PATCH /entities/{entityId}/attrs`
Update entity attributes.

**Path Parameters**:
- `entityId` (string, required): NGSI-LD entity ID

**Request Body**:
```json
{
  "vehicleCount": {
    "type": "Property",
    "value": 55
  },
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ]
}
```

**Response**: `204 No Content`

#### `DELETE /entities/{entityId}`
Delete an entity.

**Path Parameters**:
- `entityId` (string, required): NGSI-LD entity ID

**Response**: `204 No Content`

---

### Temporal Queries

#### `GET /temporal/entities`
Query entities with temporal information.

**Query Parameters**:
- `type` (string): Entity type filter
- `timerel` (string, required): Temporal relationship (`before`, `after`, `between`)
- `timeAt` (string, required): Start timestamp (ISO 8601)
- `endTimeAt` (string): End timestamp for `between` queries
- `limit` (integer): Maximum results
- `offset` (integer): Pagination offset

**Example Request**:
```http
GET /temporal/entities?type=TrafficObservation&timerel=between&timeAt=2025-06-10T08:00:00Z&endTimeAt=2025-06-10T12:00:00Z
```

**Response**:
```json
[
  {
    "id": "urn:ngsi-ld:TrafficObservation:OBS001",
    "type": "TrafficObservation",
    "vehicleCount": [
      {
        "type": "Property",
        "value": 42,
        "observedAt": "2025-06-10T09:00:00Z"
      },
      {
        "type": "Property",
        "value": 55,
        "observedAt": "2025-06-10T10:00:00Z"
      }
    ],
    "@context": [
      "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
    ]
  }
]
```

---

### SPARQL Queries

#### `POST /sparql/query`
Execute SPARQL queries on RDF triple store.

**Request Headers**:
- `Content-Type: application/sparql-query` or `application/x-www-form-urlencoded`
- `Accept: application/sparql-results+json` or `text/turtle`

**Request Body** (SPARQL Query):
```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX ex: <http://example.org/hcmc-traffic/>

SELECT ?observation ?vehicleCount ?timestamp
WHERE {
  ?observation a sosa:Observation ;
               sosa:hasSimpleResult ?vehicleCount ;
               sosa:resultTime ?timestamp .
  FILTER(?timestamp > "2025-06-10T00:00:00Z"^^xsd:dateTime)
}
LIMIT 100
```

**Response**:
```json
{
  "head": {
    "vars": ["observation", "vehicleCount", "timestamp"]
  },
  "results": {
    "bindings": [
      {
        "observation": {
          "type": "uri",
          "value": "http://example.org/hcmc-traffic/observation/001"
        },
        "vehicleCount": {
          "type": "literal",
          "value": "42",
          "datatype": "http://www.w3.org/2001/XMLSchema#integer"
        },
        "timestamp": {
          "type": "literal",
          "value": "2025-06-10T09:00:00Z",
          "datatype": "http://www.w3.org/2001/XMLSchema#dateTime"
        }
      }
    ]
  }
}
```

---

### Subscriptions

#### `POST /subscriptions`
Create NGSI-LD subscription for real-time notifications.

**Request Body**:
```json
{
  "id": "urn:ngsi-ld:Subscription:SUB001",
  "type": "Subscription",
  "entities": [
    {
      "type": "TrafficObservation"
    }
  ],
  "watchedAttributes": ["vehicleCount"],
  "q": "vehicleCount>50",
  "notification": {
    "endpoint": {
      "uri": "http://example.com/notifications",
      "accept": "application/json"
    }
  },
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ]
}
```

**Response**: `201 Created`

#### `GET /subscriptions`
List all subscriptions.

**Response**:
```json
[
  {
    "id": "urn:ngsi-ld:Subscription:SUB001",
    "type": "Subscription",
    "entities": [{"type": "TrafficObservation"}],
    "watchedAttributes": ["vehicleCount"],
    "notification": {
      "endpoint": {
        "uri": "http://example.com/notifications"
      }
    }
  }
]
```

#### `DELETE /subscriptions/{subscriptionId}`
Delete a subscription.

**Path Parameters**:
- `subscriptionId` (string, required): Subscription ID

**Response**: `204 No Content`

---

### Reports

#### `GET /reports/incidents`
List incident reports.

**Query Parameters**:
- `startDate` (string): Filter start date (ISO 8601)
- `endDate` (string): Filter end date (ISO 8601)
- `severity` (string): Filter by severity (`low`, `medium`, `high`, `critical`)
- `limit` (integer): Maximum results

**Response**:
```json
[
  {
    "id": "INC001",
    "timestamp": "2025-06-10T10:30:00Z",
    "severity": "high",
    "type": "accident",
    "location": {
      "type": "Point",
      "coordinates": [106.700981, 10.775264]
    },
    "description": "Traffic accident detected",
    "cameraId": "urn:ngsi-ld:TrafficCamera:CAM001",
    "reportUrl": "/reports/incidents/INC001.pdf"
  }
]
```

#### `GET /reports/incidents/{incidentId}`
Get specific incident report.

**Path Parameters**:
- `incidentId` (string, required): Incident ID

**Query Parameters**:
- `format` (string): Response format (`json`, `html`, `pdf`)

**Response** (JSON):
```json
{
  "id": "INC001",
  "timestamp": "2025-06-10T10:30:00Z",
  "severity": "high",
  "type": "accident",
  "location": {
    "type": "Point",
    "coordinates": [106.700981, 10.775264]
  },
  "description": "Traffic accident detected",
  "cameraId": "urn:ngsi-ld:TrafficCamera:CAM001",
  "vehicleCount": 5,
  "congestionLevel": "high",
  "imageUrl": "/data/cache/images/CAM001_20250610_103000.jpg"
}
```

---

### Traffic Patterns

#### `GET /patterns`
Retrieve detected traffic patterns.

**Query Parameters**:
- `type` (string): Pattern type (`congestion`, `accident`, `normal`)
- `startDate` (string): Filter start date
- `endDate` (string): Filter end date
- `cameraId` (string): Filter by camera

**Response**:
```json
[
  {
    "id": "urn:ngsi-ld:TrafficPattern:PAT001",
    "type": "TrafficPattern",
    "patternType": "congestion",
    "startTime": "2025-06-10T08:00:00Z",
    "endTime": "2025-06-10T10:00:00Z",
    "location": {
      "type": "Point",
      "coordinates": [106.700981, 10.775264]
    },
    "confidence": 0.92,
    "affectedCameras": [
      "urn:ngsi-ld:TrafficCamera:CAM001",
      "urn:ngsi-ld:TrafficCamera:CAM002"
    ]
  }
]
```

---

### Congestion Analysis

#### `GET /congestion/current`
Get current congestion levels.

**Query Parameters**:
- `georel` (string): Geo-relationship filter
- `geometry` (string): Geometry type
- `coordinates` (string): GeoJSON coordinates

**Response**:
```json
[
  {
    "cameraId": "urn:ngsi-ld:TrafficCamera:CAM001",
    "location": {
      "type": "Point",
      "coordinates": [106.700981, 10.775264]
    },
    "congestionLevel": "high",
    "vehicleCount": 55,
    "timestamp": "2025-06-10T10:30:00Z"
  }
]
```

#### `GET /congestion/historical`
Get historical congestion data.

**Query Parameters**:
- `cameraId` (string, required): Camera ID
- `startDate` (string, required): Start date
- `endDate` (string, required): End date
- `interval` (string): Aggregation interval (`1h`, `6h`, `1d`)

**Response**:
```json
[
  {
    "timestamp": "2025-06-10T08:00:00Z",
    "avgCongestionLevel": "medium",
    "avgVehicleCount": 35,
    "maxVehicleCount": 55
  },
  {
    "timestamp": "2025-06-10T09:00:00Z",
    "avgCongestionLevel": "high",
    "avgVehicleCount": 48,
    "maxVehicleCount": 65
  }
]
```

---

## Error Responses

### Standard Error Format
```json
{
  "type": "https://uri.etsi.org/ngsi-ld/errors/BadRequestData",
  "title": "Invalid Entity",
  "detail": "Entity validation failed: missing required property 'location'",
  "status": 400
}
```

### HTTP Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `204 No Content`: Successful request with no response body
- `400 Bad Request`: Invalid request parameters or body
- `401 Unauthorized`: Missing or invalid API key
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

---

## Rate Limiting

API requests are rate limited to:
- **100 requests/minute** for standard endpoints
- **10 requests/minute** for SPARQL queries
- **1000 requests/hour** per API key

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1686394800
```

---

## Pagination

For endpoints returning lists, use `limit` and `offset` parameters:

```http
GET /entities?type=TrafficCamera&limit=50&offset=100
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 500,
    "limit": 50,
    "offset": 100,
    "next": "/entities?type=TrafficCamera&limit=50&offset=150"
  }
}
```

---

## Content Negotiation

The API supports multiple content types via the `Accept` header:

- `application/json` (default)
- `application/ld+json` (JSON-LD with context)
- `text/turtle` (RDF Turtle format)
- `application/n-triples` (RDF N-Triples)
- `application/rdf+xml` (RDF/XML)

**Example**:
```http
GET /entities/urn:ngsi-ld:TrafficCamera:CAM001
Accept: text/turtle
```

**Response**:
```turtle
@prefix ngsi-ld: <https://uri.etsi.org/ngsi-ld/> .
@prefix sosa: <http://www.w3.org/ns/sosa/> .

<urn:ngsi-ld:TrafficCamera:CAM001> a sosa:Platform ;
    ngsi-ld:name "Camera Nguyen Hue" ;
    ngsi-ld:location [ a ngsi-ld:Point ;
        ngsi-ld:coordinates "106.700981,10.775264" ] .
```

---

## Authentication

Include API key in request header:

```http
X-API-Key: your-api-key-here
```

To obtain an API key, contact the system administrator or use the registration endpoint (if enabled).

---

## WebSocket API

For real-time updates, connect to WebSocket endpoint:

**URL**: `ws://localhost:8000/ws/notifications`

**Authentication**: Send API key as first message
```json
{"type": "auth", "apiKey": "your-api-key"}
```

**Subscription**: Subscribe to entity types
```json
{"type": "subscribe", "entityType": "TrafficObservation"}
```

**Notifications**: Receive real-time updates
```json
{
  "type": "notification",
  "data": {
    "id": "urn:ngsi-ld:TrafficObservation:OBS001",
    "type": "TrafficObservation",
    "vehicleCount": {
      "type": "Property",
      "value": 42
    }
  }
}
```

---

## SDK Examples

### Python
```python
import requests

API_URL = "http://localhost:8000/api/v1"
API_KEY = "your-api-key"

headers = {"X-API-Key": API_KEY}

# Get all cameras
response = requests.get(f"{API_URL}/entities?type=TrafficCamera", headers=headers)
cameras = response.json()

# Get specific entity
entity_id = "urn:ngsi-ld:TrafficCamera:CAM001"
response = requests.get(f"{API_URL}/entities/{entity_id}", headers=headers)
camera = response.json()
```

### JavaScript
```javascript
const API_URL = "http://localhost:8000/api/v1";
const API_KEY = "your-api-key";

const headers = {
  "X-API-Key": API_KEY,
  "Content-Type": "application/json"
};

// Get all cameras
fetch(`${API_URL}/entities?type=TrafficCamera`, { headers })
  .then(response => response.json())
  .then(cameras => console.log(cameras));

// Create subscription
const subscription = {
  type: "Subscription",
  entities: [{ type: "TrafficObservation" }],
  watchedAttributes: ["vehicleCount"],
  notification: {
    endpoint: { uri: "http://example.com/notify" }
  }
};

fetch(`${API_URL}/subscriptions`, {
  method: "POST",
  headers,
  body: JSON.stringify(subscription)
});
```

---

## Support

For API support and questions:
- **Email**: support@example.com
- **Documentation**: https://docs.example.com
- **GitHub**: https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
