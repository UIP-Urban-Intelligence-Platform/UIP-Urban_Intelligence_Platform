---
sidebar_label: 'NGSI-LD to RDF'
title: 'NGSI-LD to RDF Agent'
sidebar_position: 4
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
NGSI-LD to RDF Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/rdf-linked-data/ngsi-ld-to-rdf.md
Module: RDF Linked Data Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the NGSI-LD to RDF Agent component.
============================================================================
-->

# NGSI-LD to RDF Agent

The NGSI-LD to RDF Agent converts NGSI-LD entities to pure RDF/Turtle format.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.rdf_linked_data.ngsi_ld_to_rdf_agent` |
| **Class** | `NGSILDToRDFAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Convert NGSI-LD to RDF** with proper ontology mappings
- **Preserve semantic meaning** during conversion
- **Apply domain ontologies** (SOSA, SSN, GeoSPARQL)
- **Generate clean Turtle** output

## 🚀 Usage

### Convert Single Entity

```python
from src.agents.rdf_linked_data.ngsi_ld_to_rdf_agent import NGSILDToRDFAgent

agent = NGSILDToRDFAgent()

ngsi_entity = {
    "id": "urn:ngsi-ld:TrafficCamera:CAM_001",
    "type": "TrafficCamera",
    "location": {
        "type": "GeoProperty",
        "value": {"type": "Point", "coordinates": [106.6297, 10.8231]}
    },
    "vehicleCount": {
        "type": "Property",
        "value": 42,
        "observedAt": "2025-11-29T10:30:00Z"
    }
}

# Convert to RDF
rdf_graph = agent.convert(ngsi_entity)

# Serialize to Turtle
turtle = rdf_graph.serialize(format="turtle")
```

### Batch Conversion

```python
# Convert multiple entities
entities = [entity1, entity2, entity3]
combined_graph = agent.convert_batch(entities)
```

### With Ontology Mappings

```python
# Convert with SOSA/SSN ontology
rdf_graph = agent.convert(
    entity=sensor_entity,
    ontology="sosa",
    include_metadata=True
)
```

## ⚙️ Configuration

```yaml
# config/ngsi_ld_mappings.yaml
ngsi_ld_to_rdf:
  enabled: true
  
  # Base URI
  base_uri: "https://uip.city.gov/entities/"
  
  # Ontology mappings
  ontologies:
    sosa:
      prefix: "http://www.w3.org/ns/sosa/"
      mappings:
        TrafficCamera: "sosa:Platform"
        vehicleCount: "sosa:observedProperty"
    geo:
      prefix: "http://www.opengis.net/ont/geosparql#"
      mappings:
        location: "geo:hasGeometry"
  
  # Output settings
  output:
    format: "turtle"
    include_prefixes: true
    pretty_print: true
```

## 📊 Mapping Example

### NGSI-LD Input

```json
{
  "id": "urn:ngsi-ld:TrafficCamera:CAM_001",
  "type": "TrafficCamera",
  "vehicleCount": {
    "type": "Property",
    "value": 42
  }
}
```

### RDF/Turtle Output

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix uip: <https://uip.city.gov/entities/> .

uip:TrafficCamera_CAM_001 a sosa:Platform ;
    sosa:hosts uip:Sensor_CAM_001 ;
    sosa:madeObservation [
        a sosa:Observation ;
        sosa:observedProperty uip:vehicleCount ;
        sosa:hasSimpleResult 42
    ] .
```

## 📖 Related Documentation

- [SOSA-SSN Mapper](../transformation/sosa-ssn-mapper) - Sensor ontology
- [Triplestore Loader](triplestore-loader) - RDF storage
- [Content Negotiation](content-negotiation) - Format handling

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
