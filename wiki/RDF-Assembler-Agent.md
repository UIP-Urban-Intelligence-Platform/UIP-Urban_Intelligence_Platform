<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/RDF-Assembler-Agent.md
Module: RDF Assembler Agent Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Complete guide to RDF Assembler Agent for semantic data generation.
============================================================================
-->

# 🔗 RDF Assembler Agent

Complete guide to RDF Assembler Agent for generating semantic RDF data in UIP.

---

## 📊 Overview

The **RDF Assembler Agent** transforms traffic data into semantic RDF format:

- 🔗 **RDF Generation** - Create RDF triples from entities
- 📋 **SOSA/SSN Mapping** - Apply sensor ontology
- 🌐 **Turtle/JSON-LD** - Multiple output formats
- 🔍 **LOD Links** - Linked Open Data connections

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     RDF ASSEMBLER AGENT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Input Sources                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐   │
│  │ NGSI-LD         │ │ CSV/JSON        │ │ External APIs               │   │
│  │ Entities        │ │ Files           │ │ (Weather, OSM)              │   │
│  └────────┬────────┘ └────────┬────────┘ └──────────────┬──────────────┘   │
│           │                   │                         │                   │
│           └───────────────────┼─────────────────────────┘                   │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      RDF ASSEMBLER AGENT                             │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    1. Data Extraction                         │   │   │
│  │  │  • Parse input data                                           │   │   │
│  │  │  • Extract properties                                         │   │   │
│  │  │  • Identify entity types                                      │   │   │
│  │  └────────────────────────────┬─────────────────────────────────┘   │   │
│  │                               │                                      │   │
│  │                               ▼                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    2. Ontology Mapping                        │   │   │
│  │  │  • SOSA/SSN (Sensors)                                         │   │   │
│  │  │  • GeoSPARQL (Locations)                                      │   │   │
│  │  │  • Schema.org                                                 │   │   │
│  │  │  • Dublin Core                                                │   │   │
│  │  └────────────────────────────┬─────────────────────────────────┘   │   │
│  │                               │                                      │   │
│  │                               ▼                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    3. Triple Generation                       │   │   │
│  │  │  • Subject-Predicate-Object                                   │   │   │
│  │  │  • URI construction                                           │   │   │
│  │  │  • Blank nodes                                                │   │   │
│  │  └────────────────────────────┬─────────────────────────────────┘   │   │
│  │                               │                                      │   │
│  │                               ▼                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    4. LOD Linking                             │   │   │
│  │  │  • DBpedia                                                    │   │   │
│  │  │  • Wikidata                                                   │   │   │
│  │  │  • GeoNames                                                   │   │   │
│  │  │  • OpenStreetMap                                              │   │   │
│  │  └────────────────────────────┬─────────────────────────────────┘   │   │
│  │                               │                                      │   │
│  └───────────────────────────────┼──────────────────────────────────────┘   │
│                                  ▼                                          │
│  Output Formats                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐   │
│  │ Turtle (.ttl)   │ │ JSON-LD         │ │ N-Triples (.nt)             │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────────┘   │
│                                                                             │
│  Storage Destinations                                                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐   │
│  │ Apache Fuseki   │ │ File System     │ │ Triple Store                │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration

### SOSA Mappings

**File**: `config/sosa_mappings.yaml`

```yaml
# ============================================================================
# SOSA/SSN Ontology Mappings
# ============================================================================

sosa_mappings:
  # Sensor mappings
  Camera:
    type: "sosa:Sensor"
    properties:
      name: "rdfs:label"
      description: "dcterms:description"
      status: "sosa:isHostedBy"
      location: "geo:hasGeometry"
    observations:
      - type: "sosa:Observation"
        result: "TrafficFlowObserved"
        feature_of_interest: "RoadSegment"
  
  # Observation mappings
  TrafficFlowObserved:
    type: "sosa:Observation"
    properties:
      observedAt: "sosa:resultTime"
      intensity: "sosa:hasSimpleResult"
      averageVehicleSpeed: "sosa:hasSimpleResult"
      occupancy: "sosa:hasSimpleResult"
    observable_properties:
      - "uip:VehicleIntensity"
      - "uip:AverageSpeed"
      - "uip:RoadOccupancy"
  
  # Platform mappings
  District:
    type: "sosa:Platform"
    properties:
      name: "rdfs:label"
      location: "geo:hasGeometry"
```

### LOD Linkset Mappings

**File**: `config/lod_linkset_mappings.yaml`

```yaml
# ============================================================================
# Linked Open Data Linkset Mappings
# ============================================================================

lod_mappings:
  # DBpedia links
  dbpedia:
    base_uri: "http://dbpedia.org/resource/"
    predicates:
      same_as: "owl:sameAs"
      see_also: "rdfs:seeAlso"
    entities:
      - local: "urn:ngsi-ld:City:HoChiMinhCity"
        remote: "Ho_Chi_Minh_City"
      - local: "urn:ngsi-ld:District:Q1"
        remote: "District_1,_Ho_Chi_Minh_City"
  
  # Wikidata links
  wikidata:
    base_uri: "http://www.wikidata.org/entity/"
    predicates:
      same_as: "owl:sameAs"
    entities:
      - local: "urn:ngsi-ld:City:HoChiMinhCity"
        remote: "Q1854"  # Ho Chi Minh City
  
  # GeoNames links
  geonames:
    base_uri: "http://sws.geonames.org/"
    predicates:
      same_as: "owl:sameAs"
    entities:
      - local: "urn:ngsi-ld:City:HoChiMinhCity"
        remote: "1566083/"

# Namespace prefixes
namespaces:
  owl: "http://www.w3.org/2002/07/owl#"
  rdfs: "http://www.w3.org/2000/01/rdf-schema#"
  sosa: "http://www.w3.org/ns/sosa/"
  ssn: "http://www.w3.org/ns/ssn/"
  geo: "http://www.opengis.net/ont/geosparql#"
  dcterms: "http://purl.org/dc/terms/"
  schema: "https://schema.org/"
  uip: "https://uip.hcmc.gov.vn/ontology#"
```

---

## 🐍 Implementation

### RDF Assembler Agent

```python
# src/agents/rdf_assembler_agent.py
"""
RDF Assembler Agent for semantic data generation.
"""
import yaml
from rdflib import Graph, Namespace, Literal, URIRef, BNode
from rdflib.namespace import RDF, RDFS, OWL, XSD, DCTERMS
from typing import List, Dict, Any
from datetime import datetime

# Define namespaces
SOSA = Namespace("http://www.w3.org/ns/sosa/")
SSN = Namespace("http://www.w3.org/ns/ssn/")
GEO = Namespace("http://www.opengis.net/ont/geosparql#")
SCHEMA = Namespace("https://schema.org/")
UIP = Namespace("https://uip.hcmc.gov.vn/ontology#")

class RDFAssemblerAgent:
    """Agent for assembling RDF data from traffic entities."""
    
    def __init__(self, config_path: str = "config/sosa_mappings.yaml"):
        self.config = self._load_config(config_path)
        self.graph = Graph()
        self._bind_namespaces()
    
    def _load_config(self, path: str) -> Dict:
        """Load SOSA mappings configuration."""
        with open(path, 'r') as f:
            return yaml.safe_load(f)
    
    def _bind_namespaces(self):
        """Bind common namespaces to graph."""
        self.graph.bind("sosa", SOSA)
        self.graph.bind("ssn", SSN)
        self.graph.bind("geo", GEO)
        self.graph.bind("schema", SCHEMA)
        self.graph.bind("dcterms", DCTERMS)
        self.graph.bind("owl", OWL)
        self.graph.bind("uip", UIP)
    
    def assemble_camera_rdf(self, camera: Dict[str, Any]) -> Graph:
        """Generate RDF triples for a Camera entity."""
        camera_uri = URIRef(camera["id"])
        
        # Type assertion
        self.graph.add((camera_uri, RDF.type, SOSA.Sensor))
        self.graph.add((camera_uri, RDF.type, UIP.TrafficCamera))
        
        # Basic properties
        if "name" in camera:
            name = camera["name"].get("value", camera["name"])
            self.graph.add((camera_uri, RDFS.label, Literal(name)))
        
        if "description" in camera:
            desc = camera["description"].get("value", camera["description"])
            self.graph.add((camera_uri, DCTERMS.description, Literal(desc)))
        
        # Location (GeoSPARQL)
        if "location" in camera:
            location = camera["location"].get("value", camera["location"])
            self._add_location(camera_uri, location)
        
        # Observable properties
        self.graph.add((
            camera_uri,
            SOSA.observes,
            UIP.VehicleIntensity
        ))
        self.graph.add((
            camera_uri,
            SOSA.observes,
            UIP.AverageVehicleSpeed
        ))
        
        return self.graph
    
    def assemble_observation_rdf(self, observation: Dict[str, Any]) -> Graph:
        """Generate RDF triples for a TrafficFlowObserved entity."""
        obs_uri = URIRef(observation["id"])
        
        # Type assertion
        self.graph.add((obs_uri, RDF.type, SOSA.Observation))
        self.graph.add((obs_uri, RDF.type, UIP.TrafficFlowObservation))
        
        # Result time
        if "observedAt" in observation:
            time_str = observation["observedAt"]
            self.graph.add((
                obs_uri,
                SOSA.resultTime,
                Literal(time_str, datatype=XSD.dateTime)
            ))
        
        # Observation results
        if "intensity" in observation:
            intensity = observation["intensity"].get("value", observation["intensity"])
            self._add_observation_result(obs_uri, "intensity", intensity)
        
        if "averageVehicleSpeed" in observation:
            speed = observation["averageVehicleSpeed"].get("value", 
                    observation["averageVehicleSpeed"])
            self._add_observation_result(obs_uri, "averageVehicleSpeed", speed)
        
        # Made by sensor
        if "refDevice" in observation:
            device_id = observation["refDevice"].get("object", observation["refDevice"])
            self.graph.add((
                obs_uri,
                SOSA.madeBySensor,
                URIRef(device_id)
            ))
        
        # Feature of interest
        if "refRoadSegment" in observation:
            segment_id = observation["refRoadSegment"].get("object", 
                        observation["refRoadSegment"])
            self.graph.add((
                obs_uri,
                SOSA.hasFeatureOfInterest,
                URIRef(segment_id)
            ))
        
        return self.graph
    
    def _add_location(self, subject: URIRef, location: Dict):
        """Add GeoSPARQL geometry to an entity."""
        geom_node = BNode()
        self.graph.add((subject, GEO.hasGeometry, geom_node))
        self.graph.add((geom_node, RDF.type, GEO.Geometry))
        
        if location.get("type") == "Point":
            coords = location["coordinates"]
            wkt = f"POINT({coords[0]} {coords[1]})"
            self.graph.add((
                geom_node,
                GEO.asWKT,
                Literal(wkt, datatype=GEO.wktLiteral)
            ))
    
    def _add_observation_result(
        self, 
        obs_uri: URIRef, 
        prop_name: str, 
        value: Any
    ):
        """Add observation result with proper typing."""
        result_node = BNode()
        self.graph.add((obs_uri, SOSA.hasResult, result_node))
        self.graph.add((result_node, RDF.type, SOSA.Result))
        
        # Determine datatype
        if isinstance(value, int):
            lit_value = Literal(value, datatype=XSD.integer)
        elif isinstance(value, float):
            lit_value = Literal(value, datatype=XSD.double)
        else:
            lit_value = Literal(value)
        
        self.graph.add((result_node, SOSA.hasSimpleResult, lit_value))
        self.graph.add((
            result_node,
            RDFS.label,
            Literal(prop_name)
        ))
    
    def add_lod_links(self, entity_uri: str, lod_config_path: str = None):
        """Add Linked Open Data links to entity."""
        if lod_config_path:
            with open(lod_config_path) as f:
                lod_config = yaml.safe_load(f)
        else:
            lod_config = self.config.get("lod_mappings", {})
        
        entity_ref = URIRef(entity_uri)
        
        # Check DBpedia mappings
        for mapping in lod_config.get("dbpedia", {}).get("entities", []):
            if mapping["local"] == entity_uri:
                dbpedia_uri = URIRef(
                    lod_config["dbpedia"]["base_uri"] + mapping["remote"]
                )
                self.graph.add((entity_ref, OWL.sameAs, dbpedia_uri))
        
        # Check Wikidata mappings
        for mapping in lod_config.get("wikidata", {}).get("entities", []):
            if mapping["local"] == entity_uri:
                wikidata_uri = URIRef(
                    lod_config["wikidata"]["base_uri"] + mapping["remote"]
                )
                self.graph.add((entity_ref, OWL.sameAs, wikidata_uri))
    
    def serialize(self, format: str = "turtle") -> str:
        """Serialize graph to specified format."""
        return self.graph.serialize(format=format)
    
    def save(self, filepath: str, format: str = "turtle"):
        """Save graph to file."""
        self.graph.serialize(destination=filepath, format=format)
    
    def clear(self):
        """Clear the graph for reuse."""
        self.graph = Graph()
        self._bind_namespaces()
```

### Batch Processing

```python
# src/agents/rdf_batch_processor.py
"""
Batch RDF processing for large datasets.
"""
import json
from pathlib import Path
from rdf_assembler_agent import RDFAssemblerAgent

class RDFBatchProcessor:
    """Process entities in batches for RDF generation."""
    
    def __init__(self, output_dir: str = "data/rdf"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.agent = RDFAssemblerAgent()
    
    def process_cameras(self, cameras_file: str) -> str:
        """Process cameras and generate RDF."""
        with open(cameras_file) as f:
            cameras = json.load(f)
        
        for camera in cameras:
            self.agent.assemble_camera_rdf(camera)
        
        output_file = self.output_dir / "cameras.ttl"
        self.agent.save(str(output_file))
        self.agent.clear()
        
        return str(output_file)
    
    def process_observations(self, observations_file: str) -> str:
        """Process observations and generate RDF."""
        with open(observations_file) as f:
            observations = json.load(f)
        
        for obs in observations:
            self.agent.assemble_observation_rdf(obs)
        
        output_file = self.output_dir / "observations.ttl"
        self.agent.save(str(output_file))
        self.agent.clear()
        
        return str(output_file)
    
    def process_all(self, data_dir: str) -> Dict[str, str]:
        """Process all entity types."""
        data_path = Path(data_dir)
        results = {}
        
        # Process each entity type
        if (data_path / "cameras_enriched.json").exists():
            results["cameras"] = self.process_cameras(
                str(data_path / "cameras_enriched.json")
            )
        
        if (data_path / "observations.json").exists():
            results["observations"] = self.process_observations(
                str(data_path / "observations.json")
            )
        
        return results

# Usage
if __name__ == "__main__":
    processor = RDFBatchProcessor()
    results = processor.process_all("data")
    print(f"Generated RDF files: {results}")
```

---

## 📄 Output Examples

### Turtle Format

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix ssn: <http://www.w3.org/ns/ssn/> .
@prefix geo: <http://www.opengis.net/ont/geosparql#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix uip: <https://uip.hcmc.gov.vn/ontology#> .

# Camera as Sensor
<urn:ngsi-ld:Camera:TTH001> a sosa:Sensor, uip:TrafficCamera ;
    rdfs:label "Camera Tran Hung Dao 001" ;
    sosa:observes uip:VehicleIntensity, uip:AverageVehicleSpeed ;
    geo:hasGeometry [
        a geo:Geometry ;
        geo:asWKT "POINT(106.6882 10.7626)"^^geo:wktLiteral
    ] ;
    owl:sameAs <http://dbpedia.org/resource/Ho_Chi_Minh_City> .

# Traffic Flow Observation
<urn:ngsi-ld:TrafficFlowObserved:TTH001:20251125T100000> 
    a sosa:Observation, uip:TrafficFlowObservation ;
    sosa:resultTime "2025-11-25T10:00:00Z"^^xsd:dateTime ;
    sosa:madeBySensor <urn:ngsi-ld:Camera:TTH001> ;
    sosa:hasFeatureOfInterest <urn:ngsi-ld:RoadSegment:THD001> ;
    sosa:hasResult [
        a sosa:Result ;
        rdfs:label "intensity" ;
        sosa:hasSimpleResult "245"^^xsd:integer
    ] , [
        a sosa:Result ;
        rdfs:label "averageVehicleSpeed" ;
        sosa:hasSimpleResult "35.5"^^xsd:double
    ] .
```

### JSON-LD Format

```json
{
  "@context": {
    "sosa": "http://www.w3.org/ns/sosa/",
    "geo": "http://www.opengis.net/ont/geosparql#",
    "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "uip": "https://uip.hcmc.gov.vn/ontology#"
  },
  "@graph": [
    {
      "@id": "urn:ngsi-ld:Camera:TTH001",
      "@type": ["sosa:Sensor", "uip:TrafficCamera"],
      "rdfs:label": "Camera Tran Hung Dao 001",
      "sosa:observes": [
        {"@id": "uip:VehicleIntensity"},
        {"@id": "uip:AverageVehicleSpeed"}
      ],
      "geo:hasGeometry": {
        "@type": "geo:Geometry",
        "geo:asWKT": {
          "@value": "POINT(106.6882 10.7626)",
          "@type": "geo:wktLiteral"
        }
      }
    }
  ]
}
```

---

## 🧪 Testing

### Unit Tests

```python
# tests/test_rdf_assembler.py
import pytest
from src.agents.rdf_assembler_agent import RDFAssemblerAgent

class TestRDFAssembler:
    """Test RDF Assembler Agent."""
    
    def setup_method(self):
        self.agent = RDFAssemblerAgent()
    
    def test_camera_rdf_generation(self):
        """Test camera to RDF conversion."""
        camera = {
            "id": "urn:ngsi-ld:Camera:TEST001",
            "type": "Camera",
            "name": {"type": "Property", "value": "Test Camera"},
            "location": {
                "type": "GeoProperty",
                "value": {"type": "Point", "coordinates": [106.68, 10.76]}
            }
        }
        
        graph = self.agent.assemble_camera_rdf(camera)
        
        # Verify triples
        assert len(graph) > 0
        turtle = graph.serialize(format="turtle")
        assert "sosa:Sensor" in turtle
        assert "Test Camera" in turtle
    
    def test_observation_rdf_generation(self):
        """Test observation to RDF conversion."""
        observation = {
            "id": "urn:ngsi-ld:TrafficFlowObserved:TEST001",
            "type": "TrafficFlowObserved",
            "observedAt": "2025-11-25T10:00:00Z",
            "intensity": {"type": "Property", "value": 100},
            "averageVehicleSpeed": {"type": "Property", "value": 35.5}
        }
        
        graph = self.agent.assemble_observation_rdf(observation)
        
        assert len(graph) > 0
        turtle = graph.serialize(format="turtle")
        assert "sosa:Observation" in turtle
        assert "sosa:resultTime" in turtle
    
    def test_lod_linking(self):
        """Test LOD link generation."""
        self.agent.add_lod_links("urn:ngsi-ld:City:HoChiMinhCity")
        
        turtle = self.agent.serialize()
        assert "owl:sameAs" in turtle
```

---

## 📋 CLI Usage

```bash
# Generate RDF from cameras
python -m src.agents.rdf_assembler_agent \
    --input data/cameras_enriched.json \
    --output data/rdf/cameras.ttl \
    --format turtle

# Generate RDF from all entities
python -m src.agents.rdf_batch_processor \
    --data-dir data \
    --output-dir data/rdf

# Validate RDF output
python -m rdflib.tools.rdfpipe data/rdf/cameras.ttl
```

---

## 🔗 Related Pages

- [[SOSA-SSN-Ontology]] - Sensor ontology
- [[Semantic-Web-Guide]] - Semantic web concepts
- [[Apache-Fuseki-Guide]] - SPARQL endpoint
- [[Data-Flow]] - Data pipeline
- [[Agent-Architecture]] - Agent system

---

<p align="center">
  <sub>Part of <a href="Home">UIP - Urban Intelligence Platform</a> Documentation</sub>
</p>
