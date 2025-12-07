<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Semantic-Web-Guide.md
Module: Semantic Web Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Understanding the Semantic Web technologies in UIP.
============================================================================
-->
# 🌐 Semantic Web Guide

Understanding the Semantic Web technologies in UIP - Urban Intelligence Platform.

---

## 📊 Overview

UIP - Urban Intelligence Platform implements a comprehensive Semantic Web stack:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Semantic Web Stack                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Application Layer                        │   │
│  │  React Dashboard • Express API • Python Agents           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  NGSI-LD Layer                           │   │
│  │  Stellio Context Broker • Entities • Subscriptions       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   RDF/SPARQL Layer                       │   │
│  │  Apache Fuseki • Triples • SPARQL Queries                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Ontology Layer                           │   │
│  │  SOSA/SSN • Schema.org • Smart Data Models               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               LOD Cloud Integration                      │   │
│  │  GeoNames • DBpedia • Wikidata • owl:sameAs              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔷 NGSI-LD

### What is NGSI-LD?

**NGSI-LD** (Next Generation Service Interface - Linked Data) is an ETSI standard for context information management using JSON-LD.

### Entity Structure

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smartdatamodels.org/context.jsonld"
  ],
  "id": "urn:ngsi-ld:Device:camera-001",
  "type": "Device",
  "name": {
    "type": "Property",
    "value": "Traffic Camera 001"
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
    "value": "2025-11-29T10:30:00Z",
    "observedAt": "2025-11-29T10:30:00Z"
  },
  "controlledAsset": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Road:nguyen-hue"
  }
}
```

### Entity Types Used

| Type | Description | Count |
|------|-------------|-------|
| `Device` | Traffic cameras | ~40 |
| `WeatherObserved` | Weather data | ~40 |
| `AirQualityObserved` | Air quality | ~40 |
| `TrafficFlowObserved` | Traffic flow | ~100 |
| `AccidentObserved` | Accidents | Variable |

### API Operations

```bash
# Create entity
POST /ngsi-ld/v1/entities
Content-Type: application/ld+json

# Get entities
GET /ngsi-ld/v1/entities?type=Device

# Update entity
PATCH /ngsi-ld/v1/entities/{entityId}/attrs

# Delete entity
DELETE /ngsi-ld/v1/entities/{entityId}

# Subscriptions
POST /ngsi-ld/v1/subscriptions
```

---

## 🔬 SOSA/SSN Ontology

### What is SOSA/SSN?

**SOSA** (Sensor, Observation, Sample, and Actuator) and **SSN** (Semantic Sensor Network) are W3C ontologies for describing sensors and observations.

### Mapping Example

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix ssn: <http://www.w3.org/ns/ssn/> .

# Camera as a Sensor
<urn:ngsi-ld:Device:camera-001> a sosa:Sensor ;
    sosa:observes <urn:ngsi-ld:ObservableProperty:traffic-flow> ;
    sosa:isHostedBy <urn:ngsi-ld:Platform:hcmc-traffic> ;
    ssn:implements <urn:ngsi-ld:Procedure:camera-observation> .

# Observation
<urn:ngsi-ld:Observation:obs-001> a sosa:Observation ;
    sosa:madeBySensor <urn:ngsi-ld:Device:camera-001> ;
    sosa:observedProperty <urn:ngsi-ld:ObservableProperty:traffic-flow> ;
    sosa:hasSimpleResult 150 ;
    sosa:resultTime "2025-11-29T10:30:00Z"^^xsd:dateTime .
```

### SOSA Classes Used

| Class | Description |
|-------|-------------|
| `sosa:Sensor` | Traffic cameras |
| `sosa:Observation` | Individual measurements |
| `sosa:ObservableProperty` | What is measured (traffic flow, speed) |
| `sosa:Platform` | Hosting platform |
| `sosa:Procedure` | Observation method |

---

## 📊 RDF & SPARQL

### RDF Formats Supported

| Format | Extension | MIME Type |
|--------|-----------|-----------|
| Turtle | `.ttl` | `text/turtle` |
| N-Triples | `.nt` | `application/n-triples` |
| RDF/XML | `.rdf` | `application/rdf+xml` |
| JSON-LD | `.jsonld` | `application/ld+json` |
| N-Quads | `.nq` | `application/n-quads` |

### SPARQL Examples

#### Get All Cameras

```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX schema: <https://schema.org/>
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>

SELECT ?camera ?name ?lat ?long
WHERE {
  ?camera a sosa:Sensor ;
          schema:name ?name ;
          ngsi-ld:location ?loc .
  ?loc schema:latitude ?lat ;
       schema:longitude ?long .
}
ORDER BY ?name
```

#### Get Recent Observations

```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?sensor ?value ?time
WHERE {
  ?obs a sosa:Observation ;
       sosa:madeBySensor ?sensor ;
       sosa:hasSimpleResult ?value ;
       sosa:resultTime ?time .
  FILTER (?time > "2025-11-29T00:00:00Z"^^xsd:dateTime)
}
ORDER BY DESC(?time)
LIMIT 100
```

#### Congestion Analysis

```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX traffic: <https://traffic.hcmc.gov.vn/ontology/>

SELECT ?sensor (AVG(?flow) AS ?avgFlow) (COUNT(?obs) AS ?obsCount)
WHERE {
  ?obs a sosa:Observation ;
       sosa:madeBySensor ?sensor ;
       sosa:observedProperty traffic:trafficFlow ;
       sosa:hasSimpleResult ?flow .
}
GROUP BY ?sensor
HAVING (AVG(?flow) > 0.7)
ORDER BY DESC(?avgFlow)
```

### Fuseki Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| Query | `/traffic/query` | SPARQL SELECT/CONSTRUCT |
| Update | `/traffic/update` | SPARQL INSERT/DELETE |
| Data | `/traffic/data` | Direct RDF upload |
| Graph Store | `/traffic/data?graph=` | Named graph access |

---

## 🌍 LOD Cloud Integration

### Linked Datasets

| Dataset | URI Pattern | Purpose |
|---------|-------------|---------|
| **GeoNames** | `http://sws.geonames.org/{id}/` | Geographic locations |
| **DBpedia** | `http://dbpedia.org/resource/{name}` | Encyclopedia data |
| **Wikidata** | `http://www.wikidata.org/entity/{id}` | Structured data |
| **OpenStreetMap** | `https://www.openstreetmap.org/node/{id}` | Map data |

### owl:sameAs Linking

```turtle
# Camera linked to GeoNames location
<urn:ngsi-ld:Device:camera-001>
    owl:sameAs <http://sws.geonames.org/1566083/> .  # Ho Chi Minh City

# Road linked to Wikidata
<urn:ngsi-ld:Road:nguyen-hue>
    owl:sameAs <http://www.wikidata.org/entity/Q6982785> .
```

### LOD Linkset Agent

The `lod_linkset_enrichment_agent.py` automatically adds LOD links:

```python
# Automatic enrichment process
1. Extract entity coordinates
2. Query GeoNames for nearby locations
3. Query DBpedia for related resources
4. Add owl:sameAs relationships
5. Save enriched entities
```

---

## 📐 Smart Data Models

### What are Smart Data Models?

Smart Data Models are standardized data models from FIWARE and TM Forum for IoT and smart city applications.

### Models Used

| Model | Domain | Link |
|-------|--------|------|
| `Device` | IoT | [smartdatamodels.org/Device](https://smartdatamodels.org/dataModel.Device/Device/) |
| `WeatherObserved` | Weather | [smartdatamodels.org/Weather](https://smartdatamodels.org/dataModel.Weather/WeatherObserved/) |
| `AirQualityObserved` | Environment | [smartdatamodels.org/Environment](https://smartdatamodels.org/dataModel.Environment/AirQualityObserved/) |
| `TrafficFlowObserved` | Transportation | [smartdatamodels.org/Transportation](https://smartdatamodels.org/dataModel.Transportation/TrafficFlowObserved/) |

### Validation

The `smart_data_models_validation_agent.py` validates entities against official schemas:

```python
# Validation process
1. Load entity
2. Fetch JSON Schema from smartdatamodels.org
3. Validate entity structure
4. Check required properties
5. Validate data types
6. Report validation results
```

---

## 🔄 Content Negotiation

### HTTP Accept Headers

```http
GET /entities/camera-001
Accept: text/turtle

GET /entities/camera-001
Accept: application/ld+json

GET /entities/camera-001
Accept: application/rdf+xml
```

### 303 Redirect Pattern

```
Client Request:
GET http://traffic.hcmc.gov.vn/id/camera/001

Server Response:
303 See Other
Location: http://traffic.hcmc.gov.vn/data/camera/001.ttl

(or .jsonld, .rdf based on Accept header)
```

### Implementation

The `content_negotiation_agent.py` handles:

1. Parse Accept header
2. Determine best format
3. Convert entity to requested format
4. Return with correct Content-Type

---

## 📜 Namespaces

### Prefix Declarations

```turtle
@prefix rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .
@prefix sosa:    <http://www.w3.org/ns/sosa/> .
@prefix ssn:     <http://www.w3.org/ns/ssn/> .
@prefix schema:  <https://schema.org/> .
@prefix ngsi-ld: <https://uri.etsi.org/ngsi-ld/> .
@prefix fiware:  <https://uri.fiware.org/ns/datamodels#> .
@prefix geo:     <http://www.opengis.net/ont/geosparql#> .
@prefix traffic: <https://traffic.hcmc.gov.vn/ontology/> .
```

### Configuration

`config/namespaces.yaml`:
```yaml
namespaces:
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  rdfs: "http://www.w3.org/2000/01/rdf-schema#"
  owl: "http://www.w3.org/2002/07/owl#"
  xsd: "http://www.w3.org/2001/XMLSchema#"
  sosa: "http://www.w3.org/ns/sosa/"
  ssn: "http://www.w3.org/ns/ssn/"
  schema: "https://schema.org/"
  ngsi-ld: "https://uri.etsi.org/ngsi-ld/"
  traffic: "https://traffic.hcmc.gov.vn/ontology/"
```

---

## 🔗 Related Pages

- [[System-Architecture]] - Overall architecture
- [[API-Reference]] - API endpoints
- [[Configuration]] - Configuration options
- [[Glossary]] - Term definitions
