<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Smart-Data-Models.md
Module: Smart Data Models Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete guide to Smart Data Models integration in UIP.
============================================================================
-->

# 📊 Smart Data Models

Complete guide to Smart Data Models integration in UIP - Urban Intelligence Platform.

---

## 📋 Overview

**Smart Data Models** is an initiative by FIWARE Foundation to provide standardized data models for smart cities and IoT. UIP - Urban Intelligence Platform aligns with Smart Data Models for:

- 🔄 **Interoperability** - Compatible with global systems
- 📐 **Standardization** - Consistent data formats
- 🌐 **Portability** - Works across platforms
- 🔗 **Linked Data** - Semantic web compatible

**Website**: [smartdatamodels.org](https://smartdatamodels.org/)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SMART DATA MODELS ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SMART DATA MODELS                                 │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │Transportation│ │   Weather   │  │ Environment │  │   Device    │ │   │
│  │  │   Domain    │  │   Domain    │  │   Domain    │  │   Domain    │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │   │
│  │         │                │                │                │         │   │
│  │         ▼                ▼                ▼                ▼         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │                    JSON Schema Repository                       ││   │
│  │  │                    github.com/smart-data-models                 ││   │
│  │  └────────────────────────────┬────────────────────────────────────┘│   │
│  └───────────────────────────────┼──────────────────────────────────────┘   │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         UIP PLATFORM                                 │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │ Schema Validator │  │ Entity Mapper    │  │ Context Builder  │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Domains Used

### Transportation Domain

| Model | Description | UIP Usage |
|-------|-------------|-----------|
| **Camera** | Traffic camera | Traffic monitoring |
| **TrafficFlowObserved** | Traffic observations | Flow analysis |
| **Road** | Road segments | Infrastructure |
| **RoadSegment** | Road sections | Detailed mapping |
| **Vehicle** | Vehicle data | Vehicle tracking |

### Weather Domain

| Model | Description | UIP Usage |
|-------|-------------|-----------|
| **WeatherObserved** | Weather readings | Climate analysis |
| **WeatherForecast** | Weather predictions | Planning |

### Environment Domain

| Model | Description | UIP Usage |
|-------|-------------|-----------|
| **AirQualityObserved** | Air quality | Pollution monitoring |
| **NoiseLevelObserved** | Noise levels | Urban noise |

### Device Domain

| Model | Description | UIP Usage |
|-------|-------------|-----------|
| **Device** | IoT devices | Sensor management |
| **DeviceModel** | Device types | Classification |

---

## 📋 Entity Schemas

### Camera Schema

```json
{
  "$schema": "http://json-schema.org/schema#",
  "$id": "https://smart-data-models.github.io/dataModel.Transportation/Camera/schema.json",
  "title": "Smart Data Models - Camera",
  "type": "object",
  "required": ["id", "type"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uri"
    },
    "type": {
      "type": "string",
      "enum": ["Camera"],
      "description": "NGSI-LD Entity Type"
    },
    "name": {
      "type": "string",
      "description": "Camera name"
    },
    "description": {
      "type": "string",
      "description": "Camera description"
    },
    "location": {
      "$ref": "https://smart-data-models.github.io/data-models/common-schema.json#/definitions/Location-Commons/properties/location"
    },
    "cameraType": {
      "type": "string",
      "enum": ["fixed", "ptz", "dome", "bullet"]
    },
    "streamingUrl": {
      "type": "string",
      "format": "uri"
    },
    "imageUrl": {
      "type": "string",
      "format": "uri"
    }
  }
}
```

### TrafficFlowObserved Schema

```json
{
  "$schema": "http://json-schema.org/schema#",
  "$id": "https://smart-data-models.github.io/dataModel.Transportation/TrafficFlowObserved/schema.json",
  "title": "Smart Data Models - TrafficFlowObserved",
  "type": "object",
  "required": ["id", "type", "dateObserved"],
  "properties": {
    "id": {
      "type": "string",
      "format": "uri"
    },
    "type": {
      "type": "string",
      "enum": ["TrafficFlowObserved"]
    },
    "dateObserved": {
      "type": "string",
      "format": "date-time"
    },
    "vehicleCount": {
      "type": "integer",
      "minimum": 0
    },
    "averageSpeed": {
      "type": "number",
      "minimum": 0
    },
    "averageHeadwayTime": {
      "type": "number",
      "minimum": 0
    },
    "congested": {
      "type": "boolean"
    },
    "congestionLevel": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "occupancy": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "refRoadSegment": {
      "type": "string",
      "format": "uri"
    }
  }
}
```

---

## 🔧 UIP Entity Examples

### Camera Entity

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://raw.githubusercontent.com/smart-data-models/dataModel.Transportation/master/context.jsonld"
  ],
  "id": "urn:ngsi-ld:Camera:TTH%20406",
  "type": "Camera",
  "name": {
    "type": "Property",
    "value": "TTH 406"
  },
  "description": {
    "type": "Property",
    "value": "Traffic camera at Truong Thi Hoa intersection"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6297, 10.8231]
    }
  },
  "cameraType": {
    "type": "Property",
    "value": "fixed"
  },
  "imageUrl": {
    "type": "Property",
    "value": "https://camera.thongtingiaothong.vn/TTH406.jpg"
  },
  "status": {
    "type": "Property",
    "value": "active"
  },
  "dateModified": {
    "type": "Property",
    "value": "2025-11-29T10:30:00Z"
  }
}
```

### TrafficFlowObserved Entity

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://raw.githubusercontent.com/smart-data-models/dataModel.Transportation/master/context.jsonld"
  ],
  "id": "urn:ngsi-ld:TrafficFlowObserved:obs-2025-11-29-TTH406",
  "type": "TrafficFlowObserved",
  "dateObserved": {
    "type": "Property",
    "value": "2025-11-29T10:30:00Z"
  },
  "vehicleCount": {
    "type": "Property",
    "value": 45,
    "unitCode": "C62"
  },
  "averageSpeed": {
    "type": "Property",
    "value": 25.5,
    "unitCode": "KMH"
  },
  "congested": {
    "type": "Property",
    "value": false
  },
  "congestionLevel": {
    "type": "Property",
    "value": 0.35
  },
  "occupancy": {
    "type": "Property",
    "value": 0.42
  },
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:TTH%20406"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6297, 10.8231]
    }
  }
}
```

---

## 🔗 Context Files

### UIP Context

```json
{
  "@context": {
    "type": "@type",
    "id": "@id",
    
    "ngsi-ld": "https://uri.etsi.org/ngsi-ld/",
    "sdm": "https://smartdatamodels.org/",
    "transportation": "https://smartdatamodels.org/dataModel.Transportation/",
    "weather": "https://smartdatamodels.org/dataModel.Weather/",
    "environment": "https://smartdatamodels.org/dataModel.Environment/",
    
    "Camera": "transportation:Camera",
    "TrafficFlowObserved": "transportation:TrafficFlowObserved",
    "WeatherObserved": "weather:WeatherObserved",
    "AirQualityObserved": "environment:AirQualityObserved",
    
    "vehicleCount": "transportation:vehicleCount",
    "averageSpeed": "transportation:averageSpeed",
    "congestionLevel": "transportation:congestionLevel",
    "cameraType": "transportation:cameraType"
  }
}
```

---

## 🛠️ Validation

### Schema Validation Agent

```python
# src/agents/schema_validation_agent.py

import jsonschema
from typing import Dict, Any, List
import requests

class SchemaValidationAgent:
    """Validates entities against Smart Data Models schemas."""
    
    SCHEMA_BASE = "https://smart-data-models.github.io"
    
    SCHEMAS = {
        "Camera": f"{SCHEMA_BASE}/dataModel.Transportation/Camera/schema.json",
        "TrafficFlowObserved": f"{SCHEMA_BASE}/dataModel.Transportation/TrafficFlowObserved/schema.json",
        "WeatherObserved": f"{SCHEMA_BASE}/dataModel.Weather/WeatherObserved/schema.json"
    }
    
    def __init__(self):
        self.schema_cache: Dict[str, dict] = {}
    
    def get_schema(self, entity_type: str) -> dict:
        """Fetch and cache schema."""
        if entity_type not in self.schema_cache:
            if entity_type in self.SCHEMAS:
                response = requests.get(self.SCHEMAS[entity_type])
                self.schema_cache[entity_type] = response.json()
        return self.schema_cache.get(entity_type)
    
    def validate(self, entity: Dict[str, Any]) -> List[str]:
        """Validate entity against schema."""
        errors = []
        entity_type = entity.get("type")
        
        schema = self.get_schema(entity_type)
        if not schema:
            return [f"No schema found for type: {entity_type}"]
        
        try:
            jsonschema.validate(entity, schema)
        except jsonschema.ValidationError as e:
            errors.append(str(e.message))
        
        return errors
    
    def validate_batch(self, entities: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Validate multiple entities."""
        results = {}
        for entity in entities:
            entity_id = entity.get("id", "unknown")
            results[entity_id] = self.validate(entity)
        return results
```

---

## 📐 Mapping Configuration

### SOSA Mappings (`config/sosa_mappings.yaml`)

```yaml
# Smart Data Models to SOSA/SSN mappings
version: "2.0.0"

mappings:
  # Camera as Sensor
  Camera:
    sosa:Sensor:
      properties:
        name: sosa:hasSimpleResult
        location: sosa:isHostedBy
        
  # TrafficFlowObserved as Observation
  TrafficFlowObserved:
    sosa:Observation:
      properties:
        dateObserved: sosa:resultTime
        vehicleCount: sosa:hasSimpleResult
        refCamera: sosa:madeBySensor
        
  # Weather as Observation
  WeatherObserved:
    sosa:Observation:
      properties:
        temperature: sosa:hasSimpleResult
        dateObserved: sosa:resultTime
```

---

## 📊 Unit Codes

Smart Data Models uses UN/CEFACT unit codes:

| Unit Code | Description | Property |
|-----------|-------------|----------|
| `KMH` | Kilometers per hour | averageSpeed |
| `C62` | One (count) | vehicleCount |
| `CEL` | Celsius | temperature |
| `P1` | Percent | humidity, occupancy |
| `GQ` | Microgram per cubic meter | PM2.5, PM10 |

### Usage Example

```json
{
  "averageSpeed": {
    "type": "Property",
    "value": 25.5,
    "unitCode": "KMH"
  },
  "temperature": {
    "type": "Property", 
    "value": 32.5,
    "unitCode": "CEL"
  }
}
```

---

## ✅ Best Practices

### 1. Always Include Context

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://raw.githubusercontent.com/smart-data-models/dataModel.Transportation/master/context.jsonld"
  ],
  ...
}
```

### 2. Use Standard URN Pattern

```
urn:ngsi-ld:{EntityType}:{identifier}
```

### 3. Include Required Properties

| Entity Type | Required |
|-------------|----------|
| Camera | id, type, location |
| TrafficFlowObserved | id, type, dateObserved |
| WeatherObserved | id, type, dateObserved |

### 4. Validate Before Publishing

```python
validator = SchemaValidationAgent()
errors = validator.validate(entity)
if not errors:
    publish_to_stellio(entity)
```

---

## 🔗 Related Pages

- [[NGSI-LD-Guide]] - NGSI-LD format
- [[Semantic-Web-Guide]] - Semantic web overview
- [[LOD-Cloud-Integration]] - Linked Open Data
- [[Data-Validation]] - Validation process
- [[Entity-Types]] - Entity documentation

---

## 📚 References

- [Smart Data Models](https://smartdatamodels.org/)
- [Transportation Domain](https://github.com/smart-data-models/dataModel.Transportation)
- [Weather Domain](https://github.com/smart-data-models/dataModel.Weather)
- [Environment Domain](https://github.com/smart-data-models/dataModel.Environment)
- [FIWARE Foundation](https://www.fiware.org/)
