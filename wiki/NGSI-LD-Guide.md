<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/NGSI-LD-Guide.md
Module: NGSI-LD Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete guide to NGSI-LD (Next Generation Service Interface - Linked Data).
============================================================================
-->

# 🔷 NGSI-LD Guide

Complete guide to NGSI-LD (Next Generation Service Interface - Linked Data) in UIP - Urban Intelligence Platform.

---

## 📊 Overview

**NGSI-LD** is an ETSI standard for context information management that combines:
- **NGSI** - Context management APIs
- **JSON-LD** - Linked Data format
- **GeoJSON** - Geographic data

UIP - Urban Intelligence Platform uses NGSI-LD as the primary data model for all traffic entities.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NGSI-LD ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Applications & Agents                            │   │
│  │  [Python Agents] [TypeScript Agents] [React Dashboard] [APIs]       │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    STELLIO CONTEXT BROKER                           │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ API Gateway  │  │ Search       │  │ Subscription Service     │  │   │
│  │  │ Port: 8080   │  │ Service      │  │                          │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    PostgreSQL + TimescaleDB                 │   │   │
│  │  │                    (Entity Storage)                          │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Entity Structure

### Basic Entity Format

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    {
      "traffic": "https://smartdatamodels.org/dataModel.Transportation/"
    }
  ],
  "id": "urn:ngsi-ld:Camera:camera-001",
  "type": "Camera",
  "name": {
    "type": "Property",
    "value": "Traffic Camera District 1"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6297, 10.8231]
    }
  },
  "dateObserved": {
    "type": "Property",
    "value": "2025-11-29T10:30:00Z"
  },
  "isOnRoad": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Road:nguyen-hue"
  }
}
```

### Attribute Types

| Type | Description | Example |
|------|-------------|---------|
| **Property** | Simple value | `"value": "Camera 1"` |
| **GeoProperty** | Geographic location | GeoJSON Point/Polygon |
| **Relationship** | Link to another entity | `"object": "urn:ngsi-ld:Road:1"` |

---

## 📋 Entity Types

UIP - Urban Intelligence Platform defines these NGSI-LD entity types:

### Camera Entity

```json
{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:Camera:TTH%20406",
  "type": "Camera",
  "name": { "type": "Property", "value": "TTH 406" },
  "description": { "type": "Property", "value": "Traffic camera at Truong Thi Hoa" },
  "location": {
    "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [106.6297, 10.8231] }
  },
  "status": { "type": "Property", "value": "active" },
  "imageUrl": { "type": "Property", "value": "https://..." },
  "dateModified": { "type": "Property", "value": "2025-11-29T10:30:00Z" }
}
```

### TrafficFlowObserved Entity

```json
{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:TrafficFlowObserved:observation-001",
  "type": "TrafficFlowObserved",
  "dateObserved": { "type": "Property", "value": "2025-11-29T10:30:00Z" },
  "vehicleCount": { "type": "Property", "value": 45 },
  "congestionLevel": { "type": "Property", "value": 0.35 },
  "averageSpeed": { "type": "Property", "value": 25.5, "unitCode": "KMH" },
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:TTH%20406"
  }
}
```

### WeatherObserved Entity

```json
{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:WeatherObserved:weather-001",
  "type": "WeatherObserved",
  "dateObserved": { "type": "Property", "value": "2025-11-29T10:30:00Z" },
  "temperature": { "type": "Property", "value": 32.5, "unitCode": "CEL" },
  "humidity": { "type": "Property", "value": 75, "unitCode": "P1" },
  "weatherType": { "type": "Property", "value": "Clear" },
  "location": {
    "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [106.6297, 10.8231] }
  }
}
```

### AirQualityObserved Entity

```json
{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:AirQualityObserved:aqi-001",
  "type": "AirQualityObserved",
  "dateObserved": { "type": "Property", "value": "2025-11-29T10:30:00Z" },
  "airQualityIndex": { "type": "Property", "value": 85 },
  "pm25": { "type": "Property", "value": 35.2, "unitCode": "GQ" },
  "pm10": { "type": "Property", "value": 52.1, "unitCode": "GQ" },
  "location": {
    "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [106.6297, 10.8231] }
  }
}
```

---

## 🔌 API Operations

### Create Entity

```http
POST /ngsi-ld/v1/entities
Content-Type: application/ld+json

{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:Camera:new-camera",
  "type": "Camera",
  ...
}
```

### Get Entity

```http
GET /ngsi-ld/v1/entities/urn:ngsi-ld:Camera:TTH%20406
Accept: application/ld+json
```

### Query Entities

```http
GET /ngsi-ld/v1/entities?type=Camera&q=status=="active"
Accept: application/ld+json
```

### Update Entity (PATCH)

```http
PATCH /ngsi-ld/v1/entities/urn:ngsi-ld:Camera:TTH%20406/attrs
Content-Type: application/ld+json

{
  "status": {
    "type": "Property",
    "value": "inactive"
  }
}
```

### Delete Entity

```http
DELETE /ngsi-ld/v1/entities/urn:ngsi-ld:Camera:TTH%20406
```

---

## 🔔 Subscriptions

### Create Subscription

```http
POST /ngsi-ld/v1/subscriptions
Content-Type: application/ld+json

{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:Subscription:congestion-alerts",
  "type": "Subscription",
  "entities": [
    { "type": "TrafficFlowObserved" }
  ],
  "watchedAttributes": ["congestionLevel"],
  "q": "congestionLevel>0.7",
  "notification": {
    "endpoint": {
      "uri": "http://localhost:5000/api/webhooks/congestion",
      "accept": "application/json"
    }
  }
}
```

### Subscription Types

| Type | Description |
|------|-------------|
| **Entity-based** | Subscribe to specific entity types |
| **Attribute-based** | Watch specific attributes |
| **Geo-based** | Geographic area subscriptions |
| **Temporal** | Time-based subscriptions |

---

## 🔍 Query Language

### Basic Queries

```http
# Get all cameras
GET /ngsi-ld/v1/entities?type=Camera

# Filter by attribute
GET /ngsi-ld/v1/entities?type=Camera&q=status=="active"

# Multiple conditions
GET /ngsi-ld/v1/entities?type=TrafficFlowObserved&q=congestionLevel>0.5;vehicleCount>20
```

### Geo Queries

```http
# Near point (within 1km)
GET /ngsi-ld/v1/entities?type=Camera&georel=near;maxDistance==1000&geometry=Point&coordinates=[106.6297,10.8231]

# Within polygon
GET /ngsi-ld/v1/entities?type=Camera&georel=within&geometry=Polygon&coordinates=[[[106.6,10.8],[106.7,10.8],[106.7,10.9],[106.6,10.9],[106.6,10.8]]]
```

### Temporal Queries

```http
# Entities modified after date
GET /ngsi-ld/v1/entities?type=TrafficFlowObserved&timerel=after&timeAt=2025-11-29T00:00:00Z

# Entities in time range
GET /ngsi-ld/v1/temporal/entities?type=TrafficFlowObserved&timerel=between&timeAt=2025-11-29T00:00:00Z&endTimeAt=2025-11-29T23:59:59Z
```

---

## 🔗 Context & Namespaces

### Default Context

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    {
      "traffic": "https://smartdatamodels.org/dataModel.Transportation/",
      "weather": "https://smartdatamodels.org/dataModel.Weather/",
      "sosa": "http://www.w3.org/ns/sosa/",
      "ssn": "http://www.w3.org/ns/ssn/"
    }
  ]
}
```

### Smart Data Models

UIP - Urban Intelligence Platform aligns with [Smart Data Models](https://smartdatamodels.org/):

| Domain | Models Used |
|--------|-------------|
| Transportation | Camera, TrafficFlowObserved, Road |
| Weather | WeatherObserved |
| Environment | AirQualityObserved |
| Device | Device, DeviceModel |

---

## 🛠️ Python Integration

### Using ngsi-ld-client

```python
from ngsildclient import Client

# Connect to Stellio
client = Client(
    hostname="localhost",
    port=8080
)

# Create entity
entity = {
    "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "id": "urn:ngsi-ld:Camera:new-camera",
    "type": "Camera",
    "name": {"type": "Property", "value": "New Camera"}
}
client.create(entity)

# Query entities
cameras = client.query(type="Camera", q='status=="active"')

# Subscribe
subscription = {
    "type": "Subscription",
    "entities": [{"type": "TrafficFlowObserved"}],
    "notification": {
        "endpoint": {"uri": "http://localhost:5000/webhook"}
    }
}
client.subscribe(subscription)
```

---

## 🔗 Related Pages

- [[Semantic-Web-Guide]] - Semantic web overview
- [[Smart-Data-Models]] - Data model alignment
- [[LOD-Cloud-Integration]] - Linked Open Data
- [[API-Reference]] - API documentation
- [[Stellio-Guide]] - Context broker details

---

## 📚 References

- [ETSI NGSI-LD Specification](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.06.01_60/gs_cim009v010601p.pdf)
- [Smart Data Models](https://smartdatamodels.org/)
- [Stellio Documentation](https://stellio.io/docs/)
- [JSON-LD Specification](https://www.w3.org/TR/json-ld11/)
