<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Entity-Types.md
Module: Entity Types Reference
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Complete reference for all NGSI-LD entity types in UIP.
============================================================================
-->

# 📋 Entity Types

Complete reference for all NGSI-LD entity types in UIP - Urban Intelligence Platform.

---

## 📊 Overview

UIP - Urban Intelligence Platform uses NGSI-LD entities based on FIWARE Smart Data Models:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY TYPE HIERARCHY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Core Entities                                │   │
│  │                                                                      │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐   │   │
│  │  │  Camera  │  │ RoadSegment  │  │   District   │  │   Device   │   │   │
│  │  └────┬─────┘  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘   │   │
│  │       │               │                 │                │          │   │
│  └───────┼───────────────┼─────────────────┼────────────────┼──────────┘   │
│          │               │                 │                │               │
│  ┌───────┼───────────────┼─────────────────┼────────────────┼──────────┐   │
│  │       ▼               ▼                 ▼                ▼          │   │
│  │                     Observation Entities                            │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │TrafficFlowObs   │  │ WeatherObserved │  │ AirQualityObserved  │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Event Entities                                 │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │   │
│  │  │ TrafficAccident │  │  CitizenReport  │  │     Alert           │  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎥 Camera

Traffic camera entity for monitoring road segments.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smartdatamodels.org/context.jsonld"
  ],
  "id": "urn:ngsi-ld:Camera:TTH001",
  "type": "Camera",
  "name": {
    "type": "Property",
    "value": "Trần Hưng Đạo - Nguyễn Thái Học"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6882, 10.7626]
    }
  },
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "Trần Hưng Đạo",
      "addressLocality": "Quận 1",
      "addressRegion": "TP.HCM"
    }
  },
  "status": {
    "type": "Property",
    "value": "online"
  },
  "cameraType": {
    "type": "Property",
    "value": "PTZ"
  },
  "streamUrl": {
    "type": "Property",
    "value": "https://camera.hcm.gov.vn/stream/TTH001"
  },
  "refDistrict": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:District:Q1"
  },
  "dateCreated": {
    "type": "Property",
    "value": "2025-11-20T00:00:00Z"
  },
  "dateModified": {
    "type": "Property",
    "value": "2025-11-25T10:30:00Z"
  }
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | URN | ✅ | Unique identifier |
| `type` | String | ✅ | Must be "Camera" |
| `name` | Property | ✅ | Camera name/location |
| `location` | GeoProperty | ✅ | GPS coordinates |
| `address` | Property | ❌ | Street address |
| `status` | Property | ✅ | online/offline/maintenance |
| `cameraType` | Property | ❌ | PTZ/Fixed/Dome |
| `streamUrl` | Property | ❌ | Video stream URL |
| `refDistrict` | Relationship | ❌ | Link to District |

---

## 🚗 TrafficFlowObserved

Traffic flow observation from cameras.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smartdatamodels.org/context.jsonld"
  ],
  "id": "urn:ngsi-ld:TrafficFlowObserved:TTH001-20251125103000",
  "type": "TrafficFlowObserved",
  "dateObserved": {
    "type": "Property",
    "value": "2025-11-25T10:30:00Z"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6882, 10.7626]
    }
  },
  "intensity": {
    "type": "Property",
    "value": 450,
    "unitCode": "vehicles/hour"
  },
  "occupancy": {
    "type": "Property",
    "value": 0.65,
    "observedAt": "2025-11-25T10:30:00Z"
  },
  "averageVehicleSpeed": {
    "type": "Property",
    "value": 35,
    "unitCode": "KMH"
  },
  "congestionLevel": {
    "type": "Property",
    "value": "moderate"
  },
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:TTH001"
  },
  "refRoadSegment": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:RoadSegment:THD_NTH"
  }
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | URN | ✅ | Unique identifier |
| `type` | String | ✅ | Must be "TrafficFlowObserved" |
| `dateObserved` | Property | ✅ | Observation timestamp |
| `location` | GeoProperty | ✅ | GPS coordinates |
| `intensity` | Property | ❌ | Vehicle count per hour |
| `occupancy` | Property | ❌ | Road occupancy (0-1) |
| `averageVehicleSpeed` | Property | ❌ | Average speed |
| `congestionLevel` | Property | ❌ | none/low/moderate/high/severe |
| `refCamera` | Relationship | ✅ | Link to Camera |

---

## 🌤️ WeatherObserved

Weather observation data.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smartdatamodels.org/context.jsonld"
  ],
  "id": "urn:ngsi-ld:WeatherObserved:TTH001-20251125103000",
  "type": "WeatherObserved",
  "dateObserved": {
    "type": "Property",
    "value": "2025-11-25T10:30:00Z"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6882, 10.7626]
    }
  },
  "temperature": {
    "type": "Property",
    "value": 32.5,
    "unitCode": "CEL"
  },
  "relativeHumidity": {
    "type": "Property",
    "value": 75,
    "unitCode": "P1"
  },
  "windSpeed": {
    "type": "Property",
    "value": 12,
    "unitCode": "KMH"
  },
  "weatherType": {
    "type": "Property",
    "value": "partlyCloudy"
  },
  "visibility": {
    "type": "Property",
    "value": 10000,
    "unitCode": "MTR"
  },
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:TTH001"
  }
}
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | URN | ✅ | Unique identifier |
| `type` | String | ✅ | Must be "WeatherObserved" |
| `dateObserved` | Property | ✅ | Observation timestamp |
| `location` | GeoProperty | ✅ | GPS coordinates |
| `temperature` | Property | ❌ | Temperature in Celsius |
| `relativeHumidity` | Property | ❌ | Humidity percentage |
| `windSpeed` | Property | ❌ | Wind speed |
| `weatherType` | Property | ❌ | Weather condition |
| `visibility` | Property | ❌ | Visibility in meters |

---

## 🌫️ AirQualityObserved

Air quality observation data.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smartdatamodels.org/context.jsonld"
  ],
  "id": "urn:ngsi-ld:AirQualityObserved:TTH001-20251125103000",
  "type": "AirQualityObserved",
  "dateObserved": {
    "type": "Property",
    "value": "2025-11-25T10:30:00Z"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6882, 10.7626]
    }
  },
  "aqi": {
    "type": "Property",
    "value": 85
  },
  "aqiCategory": {
    "type": "Property",
    "value": "moderate"
  },
  "pm25": {
    "type": "Property",
    "value": 28.5,
    "unitCode": "GQ"
  },
  "pm10": {
    "type": "Property",
    "value": 45.2,
    "unitCode": "GQ"
  },
  "no2": {
    "type": "Property",
    "value": 35.0,
    "unitCode": "GQ"
  },
  "o3": {
    "type": "Property",
    "value": 52.0,
    "unitCode": "GQ"
  },
  "co": {
    "type": "Property",
    "value": 0.8,
    "unitCode": "GP"
  },
  "so2": {
    "type": "Property",
    "value": 12.0,
    "unitCode": "GQ"
  },
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:TTH001"
  }
}
```

### AQI Categories

| AQI Range | Category | Color | Health Implications |
|-----------|----------|-------|---------------------|
| 0-50 | Good | 🟢 Green | Air quality is satisfactory |
| 51-100 | Moderate | 🟡 Yellow | Acceptable quality |
| 101-150 | Unhealthy (Sensitive) | 🟠 Orange | Sensitive groups affected |
| 151-200 | Unhealthy | 🔴 Red | Everyone may experience effects |
| 201-300 | Very Unhealthy | 🟣 Purple | Health alert |
| 301+ | Hazardous | 🟤 Maroon | Emergency conditions |

---

## 🚨 TrafficAccident

Traffic accident/incident entity.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smartdatamodels.org/context.jsonld"
  ],
  "id": "urn:ngsi-ld:TrafficAccident:ACC_20251125_001",
  "type": "TrafficAccident",
  "accidentType": {
    "type": "Property",
    "value": "vehicleCollision"
  },
  "severity": {
    "type": "Property",
    "value": "high"
  },
  "status": {
    "type": "Property",
    "value": "active"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6882, 10.7626]
    }
  },
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "Ngã tư Trần Hưng Đạo - Nguyễn Thái Học",
      "addressLocality": "Quận 1"
    }
  },
  "detectedAt": {
    "type": "Property",
    "value": "2025-11-25T10:30:00Z"
  },
  "resolvedAt": {
    "type": "Property",
    "value": null
  },
  "description": {
    "type": "Property",
    "value": "Two-vehicle collision at intersection"
  },
  "vehiclesInvolved": {
    "type": "Property",
    "value": 2
  },
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:TTH001"
  }
}
```

### Accident Types

| Type | Description |
|------|-------------|
| `vehicleCollision` | Vehicle-to-vehicle collision |
| `pedestrianAccident` | Involving pedestrian |
| `singleVehicle` | Single vehicle accident |
| `multiVehicle` | Multiple vehicles involved |
| `hitAndRun` | Hit and run incident |

### Severity Levels

| Level | Description | Response |
|-------|-------------|----------|
| `low` | Minor incident | Standard response |
| `moderate` | Moderate impact | Priority response |
| `high` | Significant incident | Emergency response |
| `critical` | Major emergency | All units response |

---

## 📝 CitizenReport

Reports from citizens.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smartdatamodels.org/context.jsonld"
  ],
  "id": "urn:ngsi-ld:CitizenReport:CR_20251125_001",
  "type": "CitizenReport",
  "reportType": {
    "type": "Property",
    "value": "trafficCongestion"
  },
  "description": {
    "type": "Property",
    "value": "Heavy traffic congestion near market area"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6882, 10.7626]
    }
  },
  "reportedAt": {
    "type": "Property",
    "value": "2025-11-25T10:30:00Z"
  },
  "status": {
    "type": "Property",
    "value": "verified"
  },
  "priority": {
    "type": "Property",
    "value": "medium"
  },
  "attachments": {
    "type": "Property",
    "value": [
      "https://storage.uip.vn/reports/CR_20251125_001_1.jpg"
    ]
  },
  "refNearbyCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:TTH001"
  }
}
```

---

## 🏘️ District

Administrative district entity.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "id": "urn:ngsi-ld:District:Q1",
  "type": "District",
  "name": {
    "type": "Property",
    "value": "Quận 1"
  },
  "alternateName": {
    "type": "Property",
    "value": "District 1"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Polygon",
      "coordinates": [[[106.68, 10.76], [106.70, 10.76], [106.70, 10.78], [106.68, 10.78], [106.68, 10.76]]]
    }
  },
  "area": {
    "type": "Property",
    "value": 7.73,
    "unitCode": "KMK"
  },
  "population": {
    "type": "Property",
    "value": 187435
  },
  "cameraCount": {
    "type": "Property",
    "value": 85
  }
}
```

---

## 🛣️ RoadSegment

Road segment entity.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smartdatamodels.org/context.jsonld"
  ],
  "id": "urn:ngsi-ld:RoadSegment:THD_NTH",
  "type": "RoadSegment",
  "name": {
    "type": "Property",
    "value": "Trần Hưng Đạo - Nguyễn Thái Học"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "LineString",
      "coordinates": [[106.6875, 10.7620], [106.6890, 10.7630]]
    }
  },
  "startPoint": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6875, 10.7620]
    }
  },
  "endPoint": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6890, 10.7630]
    }
  },
  "length": {
    "type": "Property",
    "value": 250,
    "unitCode": "MTR"
  },
  "laneCount": {
    "type": "Property",
    "value": 4
  },
  "speedLimit": {
    "type": "Property",
    "value": 50,
    "unitCode": "KMH"
  },
  "refDistrict": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:District:Q1"
  }
}
```

---

## 📊 Entity Summary

| Entity Type | Count (HCMC) | Update Frequency | Primary Use |
|-------------|--------------|------------------|-------------|
| Camera | 722 | Static | Base monitoring |
| TrafficFlowObserved | ~722/interval | 5 min | Flow analysis |
| WeatherObserved | ~722/interval | 5 min | Weather context |
| AirQualityObserved | ~722/interval | 5 min | Air quality |
| TrafficAccident | Variable | Event-driven | Incident response |
| CitizenReport | Variable | Event-driven | Public input |
| District | 24 | Static | Administrative |
| RoadSegment | ~1000 | Static | Infrastructure |

---

## 🔗 Related Pages

- [[NGSI-LD-Guide]] - NGSI-LD standards
- [[Smart-Data-Models]] - Smart Data Models reference
- [[Data-Validation]] - Entity validation
- [[Stellio-Guide]] - Context broker
- [[API-Reference]] - Entity APIs

---

<p align="center">
  <sub>Part of <a href="Home">UIP - Urban Intelligence Platform</a> Documentation</sub>
</p>
