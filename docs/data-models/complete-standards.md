<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Complete data models and standards reference.

Module: apps/traffic-web-app/frontend/docs/docs/data-models/complete-standards.md
Author: UIP Team
Version: 1.0.0
-->

# Complete Data Models & Standards Reference

## Overview

Comprehensive documentation for all data models, schemas, and standards used in HCMC Traffic Management System, including NGSI-LD entities, SOSA/SSN sensor ontologies, RDF vocabularies, FIWARE Smart Data Models, and custom domain models.

**Standards Implemented:**
- **NGSI-LD**: ETSI Context Information Management API
- **SOSA/SSN**: W3C Semantic Sensor Network Ontology
- **FIWARE Smart Data Models**: Traffic, Weather, Environment, Transportation
- **Dublin Core**: Metadata standards
- **GeoSPARQL**: Geospatial RDF vocabularies
- **Schema.org**: Structured data markup

---

## Table of Contents

### [NGSI-LD Entities](#ngsi-ld-entities)
1. [TrafficCamera](#trafficcamera)
2. [TrafficAccident](#trafficaccident)
3. [TrafficFlowObserved](#trafficflowobserved)
4. [CongestionZone](#congestionzone)
5. [WeatherObserved](#weatherobserved)
6. [AirQualityObserved](#airqualityobserved)
7. [CitizenReport](#citizenreport)
8. [Alert](#alert)
9. [Road](#road)
10. [Junction](#junction)

### [SOSA/SSN Mappings](#sosa-ssn-mappings)
11. [Camera Sensor](#camera-sensor)
12. [Weather Sensor](#weather-sensor)
13. [Air Quality Sensor](#air-quality-sensor)
14. [Observations](#observations)
15. [Procedures](#procedures)

### [RDF Vocabularies](#rdf-vocabularies)
16. [Traffic Ontology](#traffic-ontology)
17. [Namespaces](#namespaces)
18. [Property Definitions](#property-definitions)
19. [Class Hierarchy](#class-hierarchy)

### [Python Data Models](#python-data-models)
20. [Camera Models](#camera-models)
21. [Accident Models](#accident-models)
22. [Traffic Models](#traffic-models)
23. [Weather Models](#weather-models)
24. [Analytics Models](#analytics-models)

### [TypeScript Interfaces](#typescript-interfaces)
25. [Frontend Types](#frontend-types)
26. [API Types](#api-types)
27. [State Management Types](#state-management-types)

### [JSON Schemas](#json-schemas)
28. [Validation Schemas](#validation-schemas)
29. [API Request/Response Schemas](#api-schemas)

---

# NGSI-LD Entities

## TrafficCamera

### Entity Definition

```json
{
  "id": "urn:ngsi-ld:TrafficCamera:CAM_001",
  "type": "TrafficCamera",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smart-data-models.github.io/dataModel.Transportation/context.jsonld"
  ],
  "name": {
    "type": "Property",
    "value": "District 1 - Nguyen Hue"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  },
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "Nguyen Hue Street",
      "addressLocality": "District 1",
      "addressRegion": "Ho Chi Minh City",
      "addressCountry": "VN",
      "postalCode": "700000"
    }
  },
  "status": {
    "type": "Property",
    "value": "active",
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "streamUrl": {
    "type": "Property",
    "value": "rtsp://stream.traffic.hcmc.gov.vn/CAM_001"
  },
  "capabilities": {
    "type": "Property",
    "value": [
      "accidentDetection",
      "vehicleCounting",
      "speedDetection",
      "licensePlateRecognition"
    ]
  },
  "detectionModel": {
    "type": "Property",
    "value": "YOLOX-X"
  },
  "lastUpdate": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-01-15T10:30:00Z"
    }
  },
  "statistics": {
    "type": "Property",
    "value": {
      "uptime24h": 99.5,
      "detectionsToday": 15234,
      "avgVehicleCount": 145
    },
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "refRoad": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Road:ROAD_001"
  }
}
```

### JSON-LD Context

```json
{
  "@context": {
    "TrafficCamera": "https://traffic.hcmc.gov.vn/datamodel#TrafficCamera",
    "streamUrl": "https://traffic.hcmc.gov.vn/datamodel#streamUrl",
    "capabilities": "https://traffic.hcmc.gov.vn/datamodel#capabilities",
    "detectionModel": "https://traffic.hcmc.gov.vn/datamodel#detectionModel",
    "statistics": "https://traffic.hcmc.gov.vn/datamodel#statistics",
    "refRoad": {
      "@id": "https://traffic.hcmc.gov.vn/datamodel#refRoad",
      "@type": "@id"
    }
  }
}
```

---

## TrafficAccident

### Entity Definition

```json
{
  "id": "urn:ngsi-ld:TrafficAccident:ACC_20240115_001",
  "type": "TrafficAccident",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smart-data-models.github.io/dataModel.Transportation/context.jsonld"
  ],
  "dateObserved": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-01-15T10:30:00Z"
    }
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  },
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "Nguyen Hue Street",
      "addressLocality": "District 1",
      "addressRegion": "Ho Chi Minh City"
    }
  },
  "accidentType": {
    "type": "Property",
    "value": "collision"
  },
  "severity": {
    "type": "Property",
    "value": "moderate"
  },
  "status": {
    "type": "Property",
    "value": "active",
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "vehiclesInvolved": {
    "type": "Property",
    "value": 2
  },
  "injuries": {
    "type": "Property",
    "value": 1
  },
  "fatalities": {
    "type": "Property",
    "value": 0
  },
  "detectionModel": {
    "type": "Property",
    "value": "yolox_x"
  },
  "confidence": {
    "type": "Property",
    "value": 0.95
  },
  "images": {
    "type": "Property",
    "value": [
      "https://storage.traffic.hcmc.gov.vn/accidents/ACC_20240115_001_1.jpg",
      "https://storage.traffic.hcmc.gov.vn/accidents/ACC_20240115_001_2.jpg"
    ]
  },
  "description": {
    "type": "Property",
    "value": "Two-vehicle collision detected at intersection"
  },
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:TrafficCamera:CAM_001"
  },
  "refRoad": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Road:ROAD_001"
  }
}
```

### Severity Levels

```json
{
  "severityLevels": {
    "minor": {
      "value": "minor",
      "description": "Minor damage, no injuries",
      "responsePriority": "low"
    },
    "moderate": {
      "value": "moderate",
      "description": "Moderate damage, minor injuries possible",
      "responsePriority": "medium"
    },
    "severe": {
      "value": "severe",
      "description": "Significant damage, serious injuries",
      "responsePriority": "high"
    },
    "critical": {
      "value": "critical",
      "description": "Major damage, life-threatening injuries",
      "responsePriority": "immediate"
    }
  }
}
```

---

## TrafficFlowObserved

### Entity Definition

```json
{
  "id": "urn:ngsi-ld:TrafficFlowObserved:TFO_20240115_CAM_001",
  "type": "TrafficFlowObserved",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smart-data-models.github.io/dataModel.Transportation/context.jsonld"
  ],
  "dateObserved": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-01-15T10:30:00Z"
    }
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  },
  "intensity": {
    "type": "Property",
    "value": 345,
    "unitCode": "vehicles/hour"
  },
  "occupancy": {
    "type": "Property",
    "value": 0.75,
    "unitCode": "ratio"
  },
  "averageVehicleSpeed": {
    "type": "Property",
    "value": 35.5,
    "unitCode": "km/h"
  },
  "averageVehicleLength": {
    "type": "Property",
    "value": 4.5,
    "unitCode": "meters"
  },
  "congestionLevel": {
    "type": "Property",
    "value": "moderate"
  },
  "vehicleType": {
    "type": "Property",
    "value": "mixed"
  },
  "vehicleSubType": {
    "type": "Property",
    "value": {
      "car": 245,
      "motorcycle": 89,
      "truck": 8,
      "bus": 3
    }
  },
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:TrafficCamera:CAM_001"
  },
  "refRoad": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Road:ROAD_001"
  }
}
```

---

## CongestionZone

### Entity Definition

```json
{
  "id": "urn:ngsi-ld:CongestionZone:ZONE_001",
  "type": "CongestionZone",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "name": {
    "type": "Property",
    "value": "District 1 Central"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Polygon",
      "coordinates": [[
        [106.7009, 10.7769],
        [106.7039, 10.7799],
        [106.7059, 10.7749],
        [106.7029, 10.7719],
        [106.7009, 10.7769]
      ]]
    }
  },
  "congestionLevel": {
    "type": "Property",
    "value": "moderate",
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "averageSpeed": {
    "type": "Property",
    "value": 25.5,
    "unitCode": "km/h",
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "vehicleCount": {
    "type": "Property",
    "value": 345,
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "incidentCount": {
    "type": "Property",
    "value": 1,
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "refCameras": {
    "type": "Relationship",
    "object": [
      "urn:ngsi-ld:TrafficCamera:CAM_001",
      "urn:ngsi-ld:TrafficCamera:CAM_002"
    ]
  }
}
```

### Congestion Levels

```json
{
  "congestionLevels": {
    "free_flow": {
      "value": "free_flow",
      "speedRange": ">= 60 km/h",
      "color": "#4caf50",
      "description": "Traffic moving freely"
    },
    "light": {
      "value": "light",
      "speedRange": "40-60 km/h",
      "color": "#8bc34a",
      "description": "Light traffic"
    },
    "moderate": {
      "value": "moderate",
      "speedRange": "20-40 km/h",
      "color": "#ffeb3b",
      "description": "Moderate congestion"
    },
    "heavy": {
      "value": "heavy",
      "speedRange": "10-20 km/h",
      "color": "#ff9800",
      "description": "Heavy congestion"
    },
    "severe": {
      "value": "severe",
      "speedRange": "< 10 km/h",
      "color": "#f44336",
      "description": "Severe congestion or standstill"
    }
  }
}
```

---

## WeatherObserved

### Entity Definition

```json
{
  "id": "urn:ngsi-ld:WeatherObserved:WEATHER_20240115_1030",
  "type": "WeatherObserved",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smart-data-models.github.io/dataModel.Weather/context.jsonld"
  ],
  "dateObserved": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-01-15T10:30:00Z"
    }
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  },
  "address": {
    "type": "Property",
    "value": {
      "addressLocality": "Ho Chi Minh City",
      "addressCountry": "VN"
    }
  },
  "temperature": {
    "type": "Property",
    "value": 32.5,
    "unitCode": "CEL"
  },
  "feelsLikeTemperature": {
    "type": "Property",
    "value": 35.2,
    "unitCode": "CEL"
  },
  "relativeHumidity": {
    "type": "Property",
    "value": 0.75,
    "unitCode": "ratio"
  },
  "atmosphericPressure": {
    "type": "Property",
    "value": 1013,
    "unitCode": "hPa"
  },
  "windSpeed": {
    "type": "Property",
    "value": 5.5,
    "unitCode": "m/s"
  },
  "windDirection": {
    "type": "Property",
    "value": 180,
    "unitCode": "degrees"
  },
  "precipitation": {
    "type": "Property",
    "value": 0,
    "unitCode": "mm"
  },
  "weatherType": {
    "type": "Property",
    "value": "partly_cloudy"
  },
  "visibility": {
    "type": "Property",
    "value": 10000,
    "unitCode": "meters"
  },
  "uvIndex": {
    "type": "Property",
    "value": 8
  }
}
```

---

## AirQualityObserved

### Entity Definition

```json
{
  "id": "urn:ngsi-ld:AirQualityObserved:AQI_20240115_1030",
  "type": "AirQualityObserved",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smart-data-models.github.io/dataModel.Environment/context.jsonld"
  ],
  "dateObserved": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-01-15T10:30:00Z"
    }
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  },
  "stationName": {
    "type": "Property",
    "value": "District 1 Monitoring Station"
  },
  "aqi": {
    "type": "Property",
    "value": 85
  },
  "category": {
    "type": "Property",
    "value": "moderate"
  },
  "pm25": {
    "type": "Property",
    "value": 35.5,
    "unitCode": "µg/m³"
  },
  "pm10": {
    "type": "Property",
    "value": 58.2,
    "unitCode": "µg/m³"
  },
  "no2": {
    "type": "Property",
    "value": 42.1,
    "unitCode": "µg/m³"
  },
  "so2": {
    "type": "Property",
    "value": 12.5,
    "unitCode": "µg/m³"
  },
  "co": {
    "type": "Property",
    "value": 0.8,
    "unitCode": "mg/m³"
  },
  "o3": {
    "type": "Property",
    "value": 55.3,
    "unitCode": "µg/m³"
  }
}
```

### AQI Categories

```json
{
  "aqiCategories": {
    "good": {
      "range": "0-50",
      "color": "#00e400",
      "description": "Air quality is satisfactory"
    },
    "moderate": {
      "range": "51-100",
      "color": "#ffff00",
      "description": "Air quality is acceptable"
    },
    "unhealthy_sensitive": {
      "range": "101-150",
      "color": "#ff7e00",
      "description": "Unhealthy for sensitive groups"
    },
    "unhealthy": {
      "range": "151-200",
      "color": "#ff0000",
      "description": "Unhealthy for everyone"
    },
    "very_unhealthy": {
      "range": "201-300",
      "color": "#8f3f97",
      "description": "Very unhealthy"
    },
    "hazardous": {
      "range": "301+",
      "color": "#7e0023",
      "description": "Hazardous"
    }
  }
}
```

---

## CitizenReport

### Entity Definition

```json
{
  "id": "urn:ngsi-ld:CitizenReport:CR_20240115_001",
  "type": "CitizenReport",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "dateCreated": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-01-15T10:30:00Z"
    }
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  },
  "category": {
    "type": "Property",
    "value": "accident"
  },
  "description": {
    "type": "Property",
    "value": "Two-vehicle collision at intersection"
  },
  "severity": {
    "type": "Property",
    "value": "moderate"
  },
  "status": {
    "type": "Property",
    "value": "submitted",
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "verificationStatus": {
    "type": "Property",
    "value": "pending",
    "observedAt": "2024-01-15T10:30:00Z"
  },
  "images": {
    "type": "Property",
    "value": [
      "https://storage.traffic.hcmc.gov.vn/citizen-reports/CR_20240115_001_1.jpg"
    ]
  },
  "reporter": {
    "type": "Property",
    "value": {
      "name": "Nguyen Van A",
      "phone": "+84901234567",
      "email": "nguyenvana@example.com"
    }
  },
  "refAccident": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:TrafficAccident:ACC_20240115_001"
  }
}
```

---

# SOSA/SSN Mappings

## Camera Sensor

### RDF Representation

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix ssn: <http://www.w3.org/ns/ssn/> .
@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> .
@prefix traffic: <http://traffic.hcmc.gov.vn/ontology#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

traffic:CAM_001
    a sosa:Sensor, traffic:TrafficCamera ;
    ssn:implements traffic:AccidentDetectionProcedure ;
    sosa:observes traffic:TrafficFlow, traffic:VehicleSpeed, traffic:Accident ;
    sosa:isHostedBy traffic:CameraSystem_001 ;
    geo:lat "10.7769"^^xsd:float ;
    geo:long "106.7009"^^xsd:float ;
    traffic:hasDetectionModel "YOLOX-X" ;
    traffic:status "active" .

traffic:CameraSystem_001
    a sosa:Platform ;
    ssn:hasSubSystem traffic:CAM_001 ;
    traffic:location "Nguyen Hue St, District 1" .

traffic:AccidentDetectionProcedure
    a sosa:Procedure ;
    ssn:hasInput traffic:VideoStream ;
    ssn:hasOutput traffic:AccidentObservation ;
    traffic:usesAlgorithm "YOLOX-X" ;
    traffic:confidence "0.95"^^xsd:float .
```

### Observation Example

```turtle
traffic:Observation_20240115_103000
    a sosa:Observation ;
    sosa:madeBySensor traffic:CAM_001 ;
    sosa:hasFeatureOfInterest traffic:RoadSegment_001 ;
    sosa:observedProperty traffic:Accident ;
    sosa:hasSimpleResult "accident_detected" ;
    sosa:resultTime "2024-01-15T10:30:00Z"^^xsd:dateTime ;
    sosa:hasResult [
        a traffic:AccidentResult ;
        traffic:severity "moderate" ;
        traffic:vehiclesInvolved 2 ;
        traffic:confidence 0.95
    ] .
```

---

## Weather Sensor

### RDF Representation

```turtle
traffic:WeatherStation_001
    a sosa:Sensor, traffic:WeatherSensor ;
    sosa:observes traffic:Temperature, traffic:Humidity, traffic:Precipitation ;
    geo:lat "10.7769"^^xsd:float ;
    geo:long "106.7009"^^xsd:float ;
    traffic:stationName "District 1 Weather Station" .

traffic:WeatherObservation_20240115_103000
    a sosa:Observation ;
    sosa:madeBySensor traffic:WeatherStation_001 ;
    sosa:observedProperty traffic:Temperature ;
    sosa:hasSimpleResult "32.5"^^xsd:float ;
    sosa:resultTime "2024-01-15T10:30:00Z"^^xsd:dateTime ;
    ssn:hasUnit <http://qudt.org/vocab/unit/DEG_C> .
```

---

## Air Quality Sensor

### RDF Representation

```turtle
traffic:AQIStation_001
    a sosa:Sensor, traffic:AirQualitySensor ;
    sosa:observes traffic:PM25, traffic:PM10, traffic:NO2, traffic:AQI ;
    geo:lat "10.7769"^^xsd:float ;
    geo:long "106.7009"^^xsd:float ;
    traffic:stationName "District 1 AQI Station" .

traffic:AQIObservation_20240115_103000
    a sosa:Observation ;
    sosa:madeBySensor traffic:AQIStation_001 ;
    sosa:observedProperty traffic:AQI ;
    sosa:hasSimpleResult "85"^^xsd:integer ;
    sosa:resultTime "2024-01-15T10:30:00Z"^^xsd:dateTime ;
    traffic:category "moderate" ;
    traffic:pm25Value "35.5"^^xsd:float ;
    traffic:pm10Value "58.2"^^xsd:float .
```

---

# RDF Vocabularies

## Traffic Ontology

### Complete Ontology Definition

```turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix dcterms: <http://purl.org/dc/terms/> .
@prefix traffic: <http://traffic.hcmc.gov.vn/ontology#> .

# Ontology Metadata
traffic:
    a owl:Ontology ;
    dcterms:title "HCMC Traffic Management Ontology" ;
    dcterms:description "Ontology for traffic management in Ho Chi Minh City" ;
    dcterms:creator "HCMC Traffic Management Team" ;
    dcterms:created "2024-01-01"^^xsd:date ;
    dcterms:modified "2024-01-15"^^xsd:date ;
    owl:versionInfo "1.0" .

# Classes
traffic:TrafficCamera
    a owl:Class ;
    rdfs:label "Traffic Camera"@en ;
    rdfs:comment "A camera used for traffic monitoring and incident detection"@en ;
    rdfs:subClassOf sosa:Sensor .

traffic:TrafficAccident
    a owl:Class ;
    rdfs:label "Traffic Accident"@en ;
    rdfs:comment "An incident involving one or more vehicles"@en .

traffic:CongestionZone
    a owl:Class ;
    rdfs:label "Congestion Zone"@en ;
    rdfs:comment "A geographic area experiencing traffic congestion"@en .

traffic:Road
    a owl:Class ;
    rdfs:label "Road"@en ;
    rdfs:comment "A roadway or street"@en .

traffic:Junction
    a owl:Class ;
    rdfs:label "Junction"@en ;
    rdfs:comment "An intersection or junction between roads"@en .

# Properties
traffic:severity
    a owl:DatatypeProperty ;
    rdfs:label "severity"@en ;
    rdfs:domain traffic:TrafficAccident ;
    rdfs:range xsd:string ;
    rdfs:comment "The severity level of an accident" .

traffic:congestionLevel
    a owl:DatatypeProperty ;
    rdfs:label "congestion level"@en ;
    rdfs:domain traffic:CongestionZone ;
    rdfs:range xsd:string ;
    rdfs:comment "The level of traffic congestion" .

traffic:detectionModel
    a owl:DatatypeProperty ;
    rdfs:label "detection model"@en ;
    rdfs:domain traffic:TrafficCamera ;
    rdfs:range xsd:string ;
    rdfs:comment "The AI model used for detection" .

traffic:refCamera
    a owl:ObjectProperty ;
    rdfs:label "references camera"@en ;
    rdfs:domain traffic:TrafficAccident ;
    rdfs:range traffic:TrafficCamera ;
    rdfs:comment "The camera that detected the accident" .
```

---

## Namespaces

### Standard Namespaces

```yaml
namespaces:
  # Core
  rdf: http://www.w3.org/1999/02/22-rdf-syntax-ns#
  rdfs: http://www.w3.org/2000/01/rdf-schema#
  owl: http://www.w3.org/2002/07/owl#
  xsd: http://www.w3.org/2001/XMLSchema#
  
  # Semantic Sensor Network
  sosa: http://www.w3.org/ns/sosa/
  ssn: http://www.w3.org/ns/ssn/
  
  # Geography
  geo: http://www.w3.org/2003/01/geo/wgs84_pos#
  geosparql: http://www.opengis.net/ont/geosparql#
  
  # Dublin Core
  dcterms: http://purl.org/dc/terms/
  dc: http://purl.org/dc/elements/1.1/
  
  # Schema.org
  schema: http://schema.org/
  
  # FIWARE
  fiware: https://uri.fiware.org/ns/data-models#
  
  # Custom
  traffic: http://traffic.hcmc.gov.vn/ontology#
  data: http://traffic.hcmc.gov.vn/data/
```

---

# Python Data Models

## Camera Models

### Complete Camera Models

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict
from enum import Enum

class CameraStatus(str, Enum):
    """Camera operational status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    MAINTENANCE = "maintenance"

@dataclass
class Location:
    """Geographic location"""
    lat: float
    lon: float
    address: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            'lat': self.lat,
            'lon': self.lon,
            'address': self.address
        }
    
    def to_geojson(self) -> Dict:
        return {
            'type': 'Point',
            'coordinates': [self.lon, self.lat]
        }

@dataclass
class CameraStatistics:
    """Camera performance statistics"""
    uptime_24h: float
    detections_today: int
    avg_vehicle_count: int
    last_detection: Optional[datetime] = None
    error_count: int = 0
    
    def to_dict(self) -> Dict:
        return {
            'uptime_24h': self.uptime_24h,
            'detections_today': self.detections_today,
            'avg_vehicle_count': self.avg_vehicle_count,
            'last_detection': self.last_detection.isoformat() if self.last_detection else None,
            'error_count': self.error_count
        }

@dataclass
class Camera:
    """Traffic camera model"""
    id: str
    name: str
    location: Location
    status: CameraStatus
    last_update: datetime
    stream_url: Optional[str] = None
    capabilities: List[str] = field(default_factory=list)
    detection_model: str = "YOLOX-X"
    statistics: Optional[CameraStatistics] = None
    ref_road: Optional[str] = None
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location.to_dict(),
            'status': self.status.value,
            'last_update': self.last_update.isoformat(),
            'stream_url': self.stream_url,
            'capabilities': self.capabilities,
            'detection_model': self.detection_model,
            'statistics': self.statistics.to_dict() if self.statistics else None,
            'ref_road': self.ref_road
        }
    
    def to_ngsi_ld(self) -> Dict:
        """Convert to NGSI-LD format"""
        return {
            'id': f'urn:ngsi-ld:TrafficCamera:{self.id}',
            'type': 'TrafficCamera',
            'name': {'type': 'Property', 'value': self.name},
            'location': {
                'type': 'GeoProperty',
                'value': self.location.to_geojson()
            },
            'status': {
                'type': 'Property',
                'value': self.status.value,
                'observedAt': self.last_update.isoformat()
            },
            'streamUrl': {'type': 'Property', 'value': self.stream_url},
            'capabilities': {'type': 'Property', 'value': self.capabilities},
            'detectionModel': {'type': 'Property', 'value': self.detection_model}
        }
```

---

## Accident Models

### Complete Accident Models

```python
class AccidentSeverity(str, Enum):
    """Accident severity levels"""
    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"

class AccidentStatus(str, Enum):
    """Accident resolution status"""
    DETECTED = "detected"
    REPORTED = "reported"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

@dataclass
class AccidentTimeline:
    """Accident event timeline entry"""
    timestamp: datetime
    event: str
    description: str
    
    def to_dict(self) -> Dict:
        return {
            'timestamp': self.timestamp.isoformat(),
            'event': self.event,
            'description': self.description
        }

@dataclass
class Accident:
    """Traffic accident model"""
    id: str
    timestamp: datetime
    location: Location
    severity: AccidentSeverity
    status: AccidentStatus
    vehicles_involved: int
    injuries: int = 0
    fatalities: int = 0
    detection_method: str = "yolox_x"
    confidence: float = 0.0
    images: List[str] = field(default_factory=list)
    description: Optional[str] = None
    camera_id: Optional[str] = None
    ref_road: Optional[str] = None
    timeline: List[AccidentTimeline] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat(),
            'location': self.location.to_dict(),
            'severity': self.severity.value,
            'status': self.status.value,
            'vehicles_involved': self.vehicles_involved,
            'injuries': self.injuries,
            'fatalities': self.fatalities,
            'detection_method': self.detection_method,
            'confidence': self.confidence,
            'images': self.images,
            'description': self.description,
            'camera_id': self.camera_id,
            'ref_road': self.ref_road,
            'timeline': [t.to_dict() for t in self.timeline]
        }
    
    def to_ngsi_ld(self) -> Dict:
        """Convert to NGSI-LD format"""
        return {
            'id': f'urn:ngsi-ld:TrafficAccident:{self.id}',
            'type': 'TrafficAccident',
            'dateObserved': {
                'type': 'Property',
                'value': {'@type': 'DateTime', '@value': self.timestamp.isoformat()}
            },
            'location': {
                'type': 'GeoProperty',
                'value': self.location.to_geojson()
            },
            'severity': {'type': 'Property', 'value': self.severity.value},
            'status': {'type': 'Property', 'value': self.status.value},
            'vehiclesInvolved': {'type': 'Property', 'value': self.vehicles_involved},
            'injuries': {'type': 'Property', 'value': self.injuries},
            'fatalities': {'type': 'Property', 'value': self.fatalities},
            'detectionMethod': {'type': 'Property', 'value': self.detection_method},
            'confidence': {'type': 'Property', 'value': self.confidence}
        }
```

---

# TypeScript Interfaces

## Frontend Types

### Complete Frontend Type Definitions

```typescript
// Location Types
export interface Location {
  lat: number;
  lon: number;
  address?: string;
}

export interface GeoJSON {
  type: 'Point' | 'Polygon' | 'LineString';
  coordinates: number[] | number[][] | number[][][];
}

// Camera Types
export enum CameraStatus {
  Active = 'active',
  Inactive = 'inactive',
  Error = 'error',
  Maintenance = 'maintenance'
}

export interface CameraStatistics {
  uptime24h: number;
  detectionsToday: number;
  avgVehicleCount: number;
  lastDetection?: string;
  errorCount: number;
}

export interface Camera {
  id: string;
  name: string;
  location: Location;
  status: CameraStatus;
  lastUpdate: string;
  streamUrl?: string;
  capabilities: string[];
  detectionModel: string;
  statistics?: CameraStatistics;
  refRoad?: string;
}

// Accident Types
export enum AccidentSeverity {
  Minor = 'minor',
  Moderate = 'moderate',
  Severe = 'severe',
  Critical = 'critical'
}

export enum AccidentStatus {
  Detected = 'detected',
  Reported = 'reported',
  InProgress = 'in_progress',
  Resolved = 'resolved',
  Closed = 'closed'
}

export interface AccidentTimeline {
  timestamp: string;
  event: string;
  description: string;
}

export interface Accident {
  id: string;
  timestamp: string;
  location: Location;
  severity: AccidentSeverity;
  status: AccidentStatus;
  vehiclesInvolved: number;
  injuries: number;
  fatalities: number;
  detectionMethod: string;
  confidence: number;
  images: string[];
  description?: string;
  cameraId?: string;
  refRoad?: string;
  timeline: AccidentTimeline[];
}

// Traffic Types
export enum CongestionLevel {
  FreeFlow = 'free_flow',
  Light = 'light',
  Moderate = 'moderate',
  Heavy = 'heavy',
  Severe = 'severe'
}

export interface TrafficFlow {
  timestamp: string;
  zoneId: string;
  congestionLevel: CongestionLevel;
  avgSpeed: number;
  vehicleCount: number;
  incidentCount: number;
}

export interface CongestionZone {
  id: string;
  name: string;
  polygon: [number, number][];
  level: CongestionLevel;
  avgSpeed: number;
  vehicleCount: number;
  incidentCount: number;
}

// Weather Types
export interface Weather {
  timestamp: string;
  location: Location;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  wind: {
    speed: number;
    direction: number;
    gust: number;
  };
  precipitation: number;
  conditions: string;
  visibility: number;
  uvIndex: number;
}

// Air Quality Types
export enum AQICategory {
  Good = 'good',
  Moderate = 'moderate',
  UnhealthySensitive = 'unhealthy_sensitive',
  Unhealthy = 'unhealthy',
  VeryUnhealthy = 'very_unhealthy',
  Hazardous = 'hazardous'
}

export interface AirQuality {
  timestamp: string;
  location: Location;
  stationName: string;
  aqi: number;
  category: AQICategory;
  pollutants: {
    pm25: number;
    pm10: number;
    no2: number;
    so2: number;
    co: number;
    o3: number;
  };
}

// Citizen Report Types
export interface CitizenReport {
  id: string;
  category: string;
  location: Location;
  description: string;
  images: string[];
  reporter?: {
    name: string;
    phone: string;
    email?: string;
  };
  status: string;
  verificationStatus: string;
  refAccident?: string;
  dateCreated: string;
}
```

---

## API Types

### API Request/Response Types

```typescript
// API Response Types
export interface APIResponse<T> {
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId: string;
  version: string;
}

// Pagination
export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  data: T[];
  pagination?: {
    nextCursor?: string;
    hasMore: boolean;
  };
}

// Authentication
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Query Parameters
export interface CameraQueryParams {
  district?: string;
  status?: CameraStatus;
  limit?: number;
  offset?: number;
}

export interface AccidentQueryParams {
  startDate?: string;
  endDate?: string;
  severity?: AccidentSeverity;
  district?: string;
  limit?: number;
  offset?: number;
}
```

---

## JSON Schemas

### Validation Schemas

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "Camera": {
      "type": "object",
      "required": ["id", "name", "location", "status", "last_update"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^CAM_[0-9]{3}$"
        },
        "name": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "location": {
          "$ref": "#/definitions/Location"
        },
        "status": {
          "type": "string",
          "enum": ["active", "inactive", "error", "maintenance"]
        },
        "last_update": {
          "type": "string",
          "format": "date-time"
        },
        "stream_url": {
          "type": "string",
          "format": "uri"
        },
        "capabilities": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
    },
    "Location": {
      "type": "object",
      "required": ["lat", "lon"],
      "properties": {
        "lat": {
          "type": "number",
          "minimum": -90,
          "maximum": 90
        },
        "lon": {
          "type": "number",
          "minimum": -180,
          "maximum": 180
        },
        "address": {
          "type": "string"
        }
      }
    },
    "Accident": {
      "type": "object",
      "required": ["id", "timestamp", "location", "severity", "vehicles_involved"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^ACC_[0-9]{8}_[0-9]{3}$"
        },
        "timestamp": {
          "type": "string",
          "format": "date-time"
        },
        "location": {
          "$ref": "#/definitions/Location"
        },
        "severity": {
          "type": "string",
          "enum": ["minor", "moderate", "severe", "critical"]
        },
        "vehicles_involved": {
          "type": "integer",
          "minimum": 1
        },
        "injuries": {
          "type": "integer",
          "minimum": 0
        },
        "fatalities": {
          "type": "integer",
          "minimum": 0
        }
      }
    }
  }
}
```

---

## Related Documentation

- [Complete Agents Reference](../agents/complete-agents-reference.md)
- [Complete Components Reference](../frontend/complete-components-reference.md)
- [Complete API Reference](../api/complete-api-reference.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)

See [LICENSE](../LICENSE) for details.
