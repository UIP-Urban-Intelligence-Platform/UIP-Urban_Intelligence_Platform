<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/SOSA-SSN-Ontology.md
Module: SOSA/SSN Ontology Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete guide to SOSA and SSN ontology integration in UIP.
============================================================================
-->

# 🔬 SOSA/SSN Ontology

Complete guide to SOSA (Sensor, Observation, Sample, and Actuator) and SSN (Semantic Sensor Network) ontology integration in UIP - Urban Intelligence Platform.

---

## 📊 Overview

**SOSA/SSN** is a W3C recommendation for describing sensors, observations, and actuators:

- **SOSA** - Lightweight core ontology
- **SSN** - Extended ontology with more detail
- **W3C Standard** - [https://www.w3.org/TR/vocab-ssn/](https://www.w3.org/TR/vocab-ssn/)

UIP - Urban Intelligence Platform uses SOSA/SSN to:
- 🔬 **Model sensors** (cameras, weather stations)
- 📊 **Describe observations** (traffic counts, weather readings)
- 🔗 **Enable semantic interoperability**
- 🌐 **Link to LOD Cloud**

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SOSA/SSN ONTOLOGY ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         SSN (Extended)                               │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ ssn:System   │  │ ssn:Property │  │ ssn:Deployment           │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                     SOSA (Core)                              │    │   │
│  │  │                                                              │    │   │
│  │  │  ┌──────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐  │    │   │
│  │  │  │ Sensor   │  │ Observation │  │ Sample   │  │ Actuator │  │    │   │
│  │  │  └────┬─────┘  └──────┬──────┘  └────┬─────┘  └────┬─────┘  │    │   │
│  │  │       │               │              │             │         │    │   │
│  │  │       ▼               ▼              ▼             ▼         │    │   │
│  │  │  ┌──────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐  │    │   │
│  │  │  │ Platform │  │ Result      │  │ Sampling │  │ Actuation│  │    │   │
│  │  │  └──────────┘  └─────────────┘  └──────────┘  └──────────┘  │    │   │
│  │  │                                                              │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         UIP IMPLEMENTATION                           │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │ Traffic Cameras  │  │ Weather Stations │  │ Air Quality      │   │   │
│  │  │ (sosa:Sensor)    │  │ (sosa:Sensor)    │  │ (sosa:Sensor)    │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Core Classes

### SOSA Classes

| Class | Description | UIP Usage |
|-------|-------------|-----------|
| `sosa:Sensor` | Device that observes | Traffic cameras |
| `sosa:Observation` | Act of observing | Traffic counts |
| `sosa:ObservableProperty` | Property being observed | Vehicle count |
| `sosa:Result` | Observation result | Count value |
| `sosa:Platform` | Hosts sensors | Road infrastructure |
| `sosa:FeatureOfInterest` | Entity being observed | Road segment |
| `sosa:Actuator` | Device that acts | Traffic signals |
| `sosa:Actuation` | Act of actuating | Signal change |
| `sosa:Sample` | Representative sample | Traffic sample |

### SSN Classes

| Class | Description | UIP Usage |
|-------|-------------|-----------|
| `ssn:System` | System of sensors | Camera network |
| `ssn:Deployment` | Deployment context | Installation |
| `ssn:Property` | Observable property | Traffic flow |
| `ssn:Stimulus` | Trigger for sensor | Vehicle movement |

---

## 🔗 Key Properties

### Observation Properties

| Property | Domain | Range | Description |
|----------|--------|-------|-------------|
| `sosa:madeBySensor` | Observation | Sensor | Sensor that made observation |
| `sosa:hasResult` | Observation | Result | Observation result |
| `sosa:resultTime` | Observation | xsd:dateTime | Time of result |
| `sosa:observedProperty` | Observation | Property | Observed property |
| `sosa:hasFeatureOfInterest` | Observation | Feature | Observed feature |

### Sensor Properties

| Property | Domain | Range | Description |
|----------|--------|-------|-------------|
| `sosa:observes` | Sensor | Property | Property sensor observes |
| `sosa:isHostedBy` | Sensor | Platform | Hosting platform |
| `sosa:madeObservation` | Sensor | Observation | Observations made |

---

## 📝 RDF Examples

### Traffic Camera as Sensor

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix ssn: <http://www.w3.org/ns/ssn/> .
@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix uip: <https://uip.hcmut.edu.vn/ontology#> .

# Camera as Sensor
<urn:ngsi-ld:Camera:TTH-406> a sosa:Sensor ;
    rdfs:label "TTH 406 Traffic Camera" ;
    sosa:observes uip:VehicleCount, uip:CongestionLevel ;
    sosa:isHostedBy <urn:ngsi-ld:Road:truong-thi-hoa> ;
    geo:lat "10.8231"^^xsd:decimal ;
    geo:long "106.6297"^^xsd:decimal ;
    ssn:implements <urn:ngsi-ld:Procedure:cv-detection> .
```

### Traffic Observation

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix uip: <https://uip.hcmut.edu.vn/ontology#> .

# Traffic Flow Observation
<urn:ngsi-ld:Observation:obs-2025-11-29-TTH406>
    a sosa:Observation ;
    rdfs:label "Traffic observation at TTH 406" ;
    sosa:madeBySensor <urn:ngsi-ld:Camera:TTH-406> ;
    sosa:observedProperty uip:VehicleCount ;
    sosa:hasFeatureOfInterest <urn:ngsi-ld:Road:truong-thi-hoa> ;
    sosa:resultTime "2025-11-29T10:30:00Z"^^xsd:dateTime ;
    sosa:hasResult [
        a sosa:Result ;
        uip:vehicleCount 45 ;
        uip:congestionLevel 0.35
    ] .
```

### Weather Station

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix ssn: <http://www.w3.org/ns/ssn/> .
@prefix uip: <https://uip.hcmut.edu.vn/ontology#> .

# Weather Station as System
<urn:ngsi-ld:WeatherStation:ws-001>
    a ssn:System, sosa:Platform ;
    rdfs:label "District 1 Weather Station" ;
    ssn:hasSubSystem 
        <urn:ngsi-ld:Sensor:temperature-001>,
        <urn:ngsi-ld:Sensor:humidity-001>,
        <urn:ngsi-ld:Sensor:rainfall-001> .

# Temperature Sensor
<urn:ngsi-ld:Sensor:temperature-001>
    a sosa:Sensor ;
    sosa:observes uip:Temperature ;
    sosa:isHostedBy <urn:ngsi-ld:WeatherStation:ws-001> .

# Weather Observation
<urn:ngsi-ld:Observation:weather-2025-11-29>
    a sosa:Observation ;
    sosa:madeBySensor <urn:ngsi-ld:Sensor:temperature-001> ;
    sosa:observedProperty uip:Temperature ;
    sosa:resultTime "2025-11-29T10:30:00Z"^^xsd:dateTime ;
    sosa:hasResult [
        a sosa:Result ;
        uip:temperatureValue 32.5 ;
        uip:unit "CEL"
    ] .
```

---

## ⚙️ Configuration

### SOSA Mappings (`config/sosa_mappings.yaml`)

```yaml
# SOSA/SSN Mappings for UIP
version: "2.0.0"

# Namespace prefixes
prefixes:
  sosa: "http://www.w3.org/ns/sosa/"
  ssn: "http://www.w3.org/ns/ssn/"
  uip: "https://uip.hcmut.edu.vn/ontology#"
  geo: "http://www.w3.org/2003/01/geo/wgs84_pos#"

# Entity type mappings
entity_mappings:
  # Camera → Sensor
  Camera:
    rdf_type: sosa:Sensor
    properties:
      name: rdfs:label
      location:
        lat: geo:lat
        lng: geo:long
      status: uip:sensorStatus
      
  # TrafficFlowObserved → Observation
  TrafficFlowObserved:
    rdf_type: sosa:Observation
    properties:
      dateObserved: sosa:resultTime
      refCamera: sosa:madeBySensor
      vehicleCount: 
        path: sosa:hasResult/uip:vehicleCount
      congestionLevel:
        path: sosa:hasResult/uip:congestionLevel
      averageSpeed:
        path: sosa:hasResult/uip:averageSpeed
        
  # WeatherObserved → Observation
  WeatherObserved:
    rdf_type: sosa:Observation
    properties:
      dateObserved: sosa:resultTime
      temperature:
        path: sosa:hasResult/uip:temperatureValue
      humidity:
        path: sosa:hasResult/uip:humidityValue
        
  # Road → FeatureOfInterest
  Road:
    rdf_type: sosa:FeatureOfInterest
    properties:
      name: rdfs:label
      location: geo:geometry

# Observable properties
observable_properties:
  - id: uip:VehicleCount
    label: "Vehicle Count"
    unit: "C62"
    
  - id: uip:CongestionLevel
    label: "Congestion Level"
    unit: "P1"
    
  - id: uip:AverageSpeed
    label: "Average Speed"
    unit: "KMH"
    
  - id: uip:Temperature
    label: "Temperature"
    unit: "CEL"
    
  - id: uip:Humidity
    label: "Relative Humidity"
    unit: "P1"
```

---

## 🛠️ Python Implementation

### SOSA-Enhanced Entity Converter

```python
# src/utils/sosa_converter.py

from typing import Dict, Any, List
from rdflib import Graph, Namespace, Literal, URIRef, BNode
from rdflib.namespace import RDF, RDFS, XSD
from datetime import datetime

# Namespaces
SOSA = Namespace("http://www.w3.org/ns/sosa/")
SSN = Namespace("http://www.w3.org/ns/ssn/")
GEO = Namespace("http://www.w3.org/2003/01/geo/wgs84_pos#")
UIP = Namespace("https://uip.hcmut.edu.vn/ontology#")

class SOSAConverter:
    """Convert NGSI-LD entities to SOSA/SSN RDF."""
    
    def __init__(self):
        self.graph = Graph()
        self._bind_namespaces()
    
    def _bind_namespaces(self):
        """Bind namespace prefixes."""
        self.graph.bind("sosa", SOSA)
        self.graph.bind("ssn", SSN)
        self.graph.bind("geo", GEO)
        self.graph.bind("uip", UIP)
    
    def convert_camera(self, entity: Dict[str, Any]) -> Graph:
        """Convert Camera entity to SOSA Sensor."""
        uri = URIRef(entity["id"])
        
        self.graph.add((uri, RDF.type, SOSA.Sensor))
        
        # Label
        if "name" in entity:
            name = entity["name"].get("value", entity["name"])
            self.graph.add((uri, RDFS.label, Literal(name)))
        
        # Location
        if "location" in entity:
            loc = entity["location"].get("value", entity["location"])
            if "coordinates" in loc:
                lng, lat = loc["coordinates"]
                self.graph.add((uri, GEO.lat, Literal(lat, datatype=XSD.decimal)))
                self.graph.add((uri, GEO.long, Literal(lng, datatype=XSD.decimal)))
        
        # Observable properties
        self.graph.add((uri, SOSA.observes, UIP.VehicleCount))
        self.graph.add((uri, SOSA.observes, UIP.CongestionLevel))
        
        return self.graph
    
    def convert_observation(self, entity: Dict[str, Any]) -> Graph:
        """Convert TrafficFlowObserved to SOSA Observation."""
        uri = URIRef(entity["id"])
        
        self.graph.add((uri, RDF.type, SOSA.Observation))
        
        # Result time
        if "dateObserved" in entity:
            dt = entity["dateObserved"].get("value", entity["dateObserved"])
            self.graph.add((uri, SOSA.resultTime, Literal(dt, datatype=XSD.dateTime)))
        
        # Made by sensor
        if "refCamera" in entity:
            camera = entity["refCamera"].get("object", entity["refCamera"])
            self.graph.add((uri, SOSA.madeBySensor, URIRef(camera)))
        
        # Result (as blank node)
        result = BNode()
        self.graph.add((uri, SOSA.hasResult, result))
        self.graph.add((result, RDF.type, SOSA.Result))
        
        if "vehicleCount" in entity:
            count = entity["vehicleCount"].get("value", entity["vehicleCount"])
            self.graph.add((result, UIP.vehicleCount, Literal(count, datatype=XSD.integer)))
        
        if "congestionLevel" in entity:
            level = entity["congestionLevel"].get("value", entity["congestionLevel"])
            self.graph.add((result, UIP.congestionLevel, Literal(level, datatype=XSD.decimal)))
        
        if "averageSpeed" in entity:
            speed = entity["averageSpeed"].get("value", entity["averageSpeed"])
            self.graph.add((result, UIP.averageSpeed, Literal(speed, datatype=XSD.decimal)))
        
        return self.graph
    
    def serialize(self, format: str = "turtle") -> str:
        """Serialize graph to string."""
        return self.graph.serialize(format=format)
    
    def to_file(self, filepath: str, format: str = "turtle"):
        """Write graph to file."""
        self.graph.serialize(destination=filepath, format=format)
```

### SOSA Enhancement Agent

```python
# src/agents/sosa_enhancement_agent.py

from typing import Dict, Any, List
from sosa_converter import SOSAConverter

class SOSAEnhancementAgent:
    """Agent for enhancing entities with SOSA semantics."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.converter = SOSAConverter()
    
    def enhance_entity(self, entity: Dict[str, Any]) -> Dict[str, Any]:
        """Add SOSA context to entity."""
        entity_type = entity.get("type")
        
        # Add SOSA context
        if "@context" not in entity:
            entity["@context"] = []
        elif isinstance(entity["@context"], str):
            entity["@context"] = [entity["@context"]]
        
        sosa_context = {
            "sosa": "http://www.w3.org/ns/sosa/",
            "ssn": "http://www.w3.org/ns/ssn/"
        }
        entity["@context"].append(sosa_context)
        
        # Add SOSA type
        if entity_type == "Camera":
            entity["sosaType"] = {
                "type": "Property",
                "value": "sosa:Sensor"
            }
        elif entity_type == "TrafficFlowObserved":
            entity["sosaType"] = {
                "type": "Property",
                "value": "sosa:Observation"
            }
        
        return entity
    
    def generate_rdf(self, entities: List[Dict[str, Any]]) -> str:
        """Generate SOSA RDF from entities."""
        for entity in entities:
            entity_type = entity.get("type")
            
            if entity_type == "Camera":
                self.converter.convert_camera(entity)
            elif entity_type == "TrafficFlowObserved":
                self.converter.convert_observation(entity)
        
        return self.converter.serialize()
```

---

## 📊 SPARQL Queries

### Find All Sensors

```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?sensor ?label ?property
WHERE {
  ?sensor a sosa:Sensor ;
          rdfs:label ?label ;
          sosa:observes ?property .
}
```

### Get Observations by Sensor

```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX uip: <https://uip.hcmut.edu.vn/ontology#>

SELECT ?obs ?time ?vehicleCount ?congestion
WHERE {
  ?obs a sosa:Observation ;
       sosa:madeBySensor <urn:ngsi-ld:Camera:TTH-406> ;
       sosa:resultTime ?time ;
       sosa:hasResult ?result .
  
  ?result uip:vehicleCount ?vehicleCount ;
          uip:congestionLevel ?congestion .
}
ORDER BY DESC(?time)
LIMIT 100
```

### Aggregate Observations by Time

```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX uip: <https://uip.hcmut.edu.vn/ontology#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?hour (AVG(?count) AS ?avgCount) (AVG(?congestion) AS ?avgCongestion)
WHERE {
  ?obs a sosa:Observation ;
       sosa:resultTime ?time ;
       sosa:hasResult ?result .
  
  ?result uip:vehicleCount ?count ;
          uip:congestionLevel ?congestion .
  
  BIND(HOURS(?time) AS ?hour)
}
GROUP BY ?hour
ORDER BY ?hour
```

---

## 🔗 Integration with NGSI-LD

### Enhanced Entity Example

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    {
      "sosa": "http://www.w3.org/ns/sosa/",
      "ssn": "http://www.w3.org/ns/ssn/"
    }
  ],
  "id": "urn:ngsi-ld:Camera:TTH-406",
  "type": "Camera",
  "sosaType": {
    "type": "Property",
    "value": "sosa:Sensor"
  },
  "observes": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Property:VehicleCount"
  },
  "name": {
    "type": "Property",
    "value": "TTH 406"
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

## ✅ Best Practices

### 1. Use Standard URIs

```turtle
# ✅ Good - Use W3C standard URIs
sosa:Sensor
sosa:Observation
sosa:resultTime

# ❌ Bad - Custom non-standard URIs
ex:MySensor
ex:MyObservation
```

### 2. Include Provenance

```turtle
# Include observation provenance
<urn:ngsi-ld:Observation:obs-001>
    sosa:madeBySensor <urn:ngsi-ld:Camera:TTH-406> ;
    sosa:resultTime "2025-11-29T10:30:00Z"^^xsd:dateTime ;
    prov:wasGeneratedBy <urn:ngsi-ld:Activity:cv-detection> .
```

### 3. Link to Features of Interest

```turtle
# Always link to what is being observed
<urn:ngsi-ld:Observation:obs-001>
    sosa:hasFeatureOfInterest <urn:ngsi-ld:Road:truong-thi-hoa> .
```

---

## 🔗 Related Pages

- [[Semantic-Web-Guide]] - Semantic web overview
- [[NGSI-LD-Guide]] - NGSI-LD format
- [[Smart-Data-Models]] - Data model alignment
- [[LOD-Cloud-Integration]] - Linked Open Data
- [[RDF-Assembler-Agent]] - RDF generation

---

## 📚 References

- [W3C SOSA/SSN Ontology](https://www.w3.org/TR/vocab-ssn/)
- [SOSA/SSN Primer](https://www.w3.org/TR/vocab-ssn/)
- [Semantic Sensor Network](https://www.w3.org/2005/Incubator/ssn/)
- [RDFLib Python Library](https://rdflib.readthedocs.io/)
