<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Apache-Fuseki-Guide.md
Module: Apache Fuseki SPARQL Server Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Complete guide to Apache Jena Fuseki SPARQL endpoint in UIP.
============================================================================
-->

# 🔥 Apache Fuseki Guide

Complete guide to Apache Jena Fuseki SPARQL server for semantic queries in UIP.

---

## 📊 Overview

**Apache Jena Fuseki** is a SPARQL server providing:

- 🔍 **SPARQL Endpoint** - Query RDF data
- 📊 **Dataset Management** - Named graphs
- 🔄 **Update Support** - SPARQL Update operations
- 🌐 **Web UI** - Browser-based interface

**Website**: [jena.apache.org/documentation/fuseki2](https://jena.apache.org/documentation/fuseki2/)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FUSEKI ARCHITECTURE IN UIP                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Data Sources                                                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐   │
│  │ RDF Assembler   │ │ NGSI-LD         │ │ External RDF                │   │
│  │ Agent           │ │ Converter       │ │ Sources                     │   │
│  └────────┬────────┘ └────────┬────────┘ └──────────────┬──────────────┘   │
│           │                   │                         │                   │
│           └───────────────────┼─────────────────────────┘                   │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       APACHE FUSEKI SERVER                           │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                      HTTP Interface                           │   │   │
│  │  │                    (Port 3030)                                │   │   │
│  │  └────────────────────────────┬─────────────────────────────────┘   │   │
│  │                               │                                      │   │
│  │  ┌──────────────┬─────────────┴─────────────┬──────────────────┐    │   │
│  │  │              │                           │                  │    │   │
│  │  ▼              ▼                           ▼                  ▼    │   │
│  │  ┌──────────┐  ┌─────────────┐  ┌────────────────┐  ┌──────────┐   │   │
│  │  │ SPARQL   │  │ SPARQL      │  │ Graph Store    │  │ Web UI   │   │   │
│  │  │ Query    │  │ Update      │  │ Protocol       │  │          │   │   │
│  │  │ /query   │  │ /update     │  │ /data          │  │ /        │   │   │
│  │  └────┬─────┘  └──────┬──────┘  └───────┬────────┘  └────┬─────┘   │   │
│  │       │               │                 │                │          │   │
│  │       └───────────────┼─────────────────┼────────────────┘          │   │
│  │                       │                 │                            │   │
│  │                       ▼                 ▼                            │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                      TDB2 Triple Store                        │   │   │
│  │  │                                                               │   │   │
│  │  │  ┌────────────────┐  ┌─────────────────────────────────────┐ │   │   │
│  │  │  │ Default Graph  │  │ Named Graphs                        │ │   │   │
│  │  │  │                │  │                                     │ │   │   │
│  │  │  │  • Cameras     │  │  • uip:cameras                      │ │   │   │
│  │  │  │  • Districts   │  │  • uip:observations                 │ │   │   │
│  │  │  │                │  │  • uip:accidents                    │ │   │   │
│  │  │  └────────────────┘  └─────────────────────────────────────┘ │   │   │
│  │  │                                                               │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Consumers                                                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────────┐   │
│  │ Python Agents   │ │ TypeScript      │ │ React Dashboard             │   │
│  │ (SPARQLWrapper) │ │ Backend         │ │                             │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration

### Docker Compose

```yaml
# docker-compose.yml
services:
  fuseki:
    image: stain/jena-fuseki
    container_name: uip-fuseki
    ports:
      - "3030:3030"
    environment:
      - ADMIN_PASSWORD=admin123
      - FUSEKI_DATASET_1=uip
    volumes:
      - fuseki-data:/fuseki
      - ./data/rdf:/staging:ro
    networks:
      - uip-network

volumes:
  fuseki-data:
```

### Fuseki Configuration

**File**: `config/fuseki.yaml`

```yaml
# ============================================================================
# Apache Fuseki Configuration for UIP
# ============================================================================

fuseki:
  # Server settings
  base_url: "http://localhost:3030"
  dataset: "uip"
  
  # Endpoints
  endpoints:
    query: "/uip/query"
    update: "/uip/update"
    data: "/uip/data"
    upload: "/uip/upload"
  
  # Authentication
  auth:
    admin_user: "admin"
    admin_password: "${FUSEKI_ADMIN_PASSWORD}"
  
  # Timeouts (seconds)
  timeouts:
    query: 30
    update: 60
  
  # Named graphs
  graphs:
    cameras: "https://uip.hcmc.gov.vn/graph/cameras"
    observations: "https://uip.hcmc.gov.vn/graph/observations"
    accidents: "https://uip.hcmc.gov.vn/graph/accidents"
    districts: "https://uip.hcmc.gov.vn/graph/districts"
```

### Dataset Configuration (TTL)

**File**: `config/fuseki-config.ttl`

```turtle
@prefix :        <#> .
@prefix fuseki:  <http://jena.apache.org/fuseki#> .
@prefix rdf:     <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs:    <http://www.w3.org/2000/01/rdf-schema#> .
@prefix tdb2:    <http://jena.apache.org/2016/tdb#> .
@prefix ja:      <http://jena.hpl.hp.com/2005/11/Assembler#> .

[] rdf:type fuseki:Server ;
   fuseki:services (
     :uip_service
   ) .

:uip_service rdf:type fuseki:Service ;
    fuseki:name "uip" ;
    fuseki:serviceQuery "query" ;
    fuseki:serviceUpdate "update" ;
    fuseki:serviceReadWriteGraphStore "data" ;
    fuseki:serviceUpload "upload" ;
    fuseki:dataset :uip_dataset ;
    .

:uip_dataset rdf:type tdb2:DatasetTDB2 ;
    tdb2:location "/fuseki/databases/uip" ;
    .
```

---

## 📡 SPARQL Queries

### Basic Queries

```sparql
# Get all cameras
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX uip: <https://uip.hcmc.gov.vn/ontology#>

SELECT ?camera ?name ?lat ?lon
WHERE {
  ?camera a sosa:Sensor ;
          a uip:TrafficCamera ;
          rdfs:label ?name .
  OPTIONAL {
    ?camera geo:hasGeometry/geo:asWKT ?wkt .
  }
}
ORDER BY ?name
LIMIT 100
```

```sparql
# Get observations from specific camera
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?obs ?time ?intensity ?speed
WHERE {
  ?obs a sosa:Observation ;
       sosa:madeBySensor <urn:ngsi-ld:Camera:TTH001> ;
       sosa:resultTime ?time ;
       sosa:hasResult ?result1, ?result2 .
  
  ?result1 rdfs:label "intensity" ;
           sosa:hasSimpleResult ?intensity .
  
  ?result2 rdfs:label "averageVehicleSpeed" ;
           sosa:hasSimpleResult ?speed .
}
ORDER BY DESC(?time)
LIMIT 50
```

### Aggregation Queries

```sparql
# Average traffic intensity by district
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX uip: <https://uip.hcmc.gov.vn/ontology#>

SELECT ?district (AVG(?intensity) AS ?avgIntensity)
WHERE {
  ?obs a sosa:Observation ;
       sosa:hasFeatureOfInterest ?segment ;
       sosa:hasResult ?result .
  
  ?result rdfs:label "intensity" ;
          sosa:hasSimpleResult ?intensity .
  
  ?segment uip:inDistrict ?district .
}
GROUP BY ?district
ORDER BY DESC(?avgIntensity)
```

```sparql
# Count observations per hour
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT (HOURS(?time) AS ?hour) (COUNT(*) AS ?count)
WHERE {
  ?obs a sosa:Observation ;
       sosa:resultTime ?time .
  
  FILTER (?time >= "2025-11-25T00:00:00Z"^^xsd:dateTime)
  FILTER (?time < "2025-11-26T00:00:00Z"^^xsd:dateTime)
}
GROUP BY (HOURS(?time))
ORDER BY ?hour
```

### Federated Queries

```sparql
# Link to DBpedia
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dbpedia: <http://dbpedia.org/resource/>
PREFIX dbo: <http://dbpedia.org/ontology/>

SELECT ?localEntity ?label ?dbpediaPopulation
WHERE {
  ?localEntity owl:sameAs ?dbpediaEntity .
  
  SERVICE <http://dbpedia.org/sparql> {
    ?dbpediaEntity rdfs:label ?label ;
                   dbo:populationTotal ?dbpediaPopulation .
    FILTER (lang(?label) = "en")
  }
}
```

---

## 🐍 Python Integration

### SPARQLWrapper Client

```python
# src/utils/sparql_client.py
"""
SPARQL client for Apache Fuseki.
"""
from SPARQLWrapper import SPARQLWrapper, JSON, POST, DIGEST
from typing import List, Dict, Any
import yaml

class SPARQLClient:
    """Client for querying Apache Fuseki."""
    
    def __init__(self, config_path: str = "config/fuseki.yaml"):
        self.config = self._load_config(config_path)
        self.base_url = self.config["fuseki"]["base_url"]
        self.dataset = self.config["fuseki"]["dataset"]
        
        # Query endpoint
        self.query_endpoint = SPARQLWrapper(
            f"{self.base_url}/{self.dataset}/query"
        )
        self.query_endpoint.setReturnFormat(JSON)
        
        # Update endpoint
        self.update_endpoint = SPARQLWrapper(
            f"{self.base_url}/{self.dataset}/update"
        )
        self.update_endpoint.setMethod(POST)
    
    def _load_config(self, path: str) -> Dict:
        with open(path) as f:
            return yaml.safe_load(f)
    
    def query(self, sparql: str) -> List[Dict[str, Any]]:
        """Execute SPARQL SELECT query."""
        self.query_endpoint.setQuery(sparql)
        
        results = self.query_endpoint.query().convert()
        
        bindings = results["results"]["bindings"]
        return [
            {
                var: binding[var]["value"]
                for var in binding
            }
            for binding in bindings
        ]
    
    def ask(self, sparql: str) -> bool:
        """Execute SPARQL ASK query."""
        self.query_endpoint.setQuery(sparql)
        results = self.query_endpoint.query().convert()
        return results["boolean"]
    
    def update(self, sparql: str) -> bool:
        """Execute SPARQL UPDATE query."""
        self.update_endpoint.setQuery(sparql)
        try:
            self.update_endpoint.query()
            return True
        except Exception as e:
            logger.error(f"SPARQL update failed: {e}")
            return False
    
    def insert_data(self, turtle_data: str, graph: str = None) -> bool:
        """Insert Turtle data into graph."""
        if graph:
            query = f"""
            INSERT DATA {{
                GRAPH <{graph}> {{
                    {turtle_data}
                }}
            }}
            """
        else:
            query = f"INSERT DATA {{ {turtle_data} }}"
        
        return self.update(query)
    
    def get_cameras(self) -> List[Dict]:
        """Get all cameras from Fuseki."""
        query = """
        PREFIX sosa: <http://www.w3.org/ns/sosa/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        PREFIX uip: <https://uip.hcmc.gov.vn/ontology#>
        
        SELECT ?id ?name
        WHERE {
            ?id a sosa:Sensor ;
                a uip:TrafficCamera ;
                rdfs:label ?name .
        }
        ORDER BY ?name
        """
        return self.query(query)
    
    def get_observations(
        self, 
        camera_id: str = None,
        start_time: str = None,
        end_time: str = None,
        limit: int = 100
    ) -> List[Dict]:
        """Get traffic observations with filters."""
        filters = []
        
        if camera_id:
            filters.append(f'FILTER (?sensor = <{camera_id}>)')
        
        if start_time:
            filters.append(f'FILTER (?time >= "{start_time}"^^xsd:dateTime)')
        
        if end_time:
            filters.append(f'FILTER (?time < "{end_time}"^^xsd:dateTime)')
        
        filter_str = "\n".join(filters)
        
        query = f"""
        PREFIX sosa: <http://www.w3.org/ns/sosa/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT ?obs ?sensor ?time ?intensity ?speed
        WHERE {{
            ?obs a sosa:Observation ;
                 sosa:madeBySensor ?sensor ;
                 sosa:resultTime ?time ;
                 sosa:hasResult ?r1, ?r2 .
            
            ?r1 rdfs:label "intensity" ;
                sosa:hasSimpleResult ?intensity .
            
            ?r2 rdfs:label "averageVehicleSpeed" ;
                sosa:hasSimpleResult ?speed .
            
            {filter_str}
        }}
        ORDER BY DESC(?time)
        LIMIT {limit}
        """
        
        return self.query(query)

# Usage
if __name__ == "__main__":
    client = SPARQLClient()
    
    # Get cameras
    cameras = client.get_cameras()
    print(f"Found {len(cameras)} cameras")
    
    # Get recent observations
    observations = client.get_observations(
        start_time="2025-11-25T00:00:00Z",
        limit=10
    )
    for obs in observations:
        print(f"Observation: {obs['intensity']} vehicles at {obs['speed']} km/h")
```

### RDF Upload

```python
# src/utils/rdf_uploader.py
"""
Upload RDF files to Fuseki.
"""
import requests
from pathlib import Path

class RDFUploader:
    """Upload RDF data to Fuseki."""
    
    def __init__(self, fuseki_url: str = "http://localhost:3030"):
        self.fuseki_url = fuseki_url
        self.dataset = "uip"
    
    def upload_file(
        self, 
        filepath: str, 
        graph: str = None,
        content_type: str = "text/turtle"
    ) -> bool:
        """Upload RDF file to Fuseki."""
        url = f"{self.fuseki_url}/{self.dataset}/data"
        
        if graph:
            url = f"{url}?graph={graph}"
        
        with open(filepath, 'rb') as f:
            data = f.read()
        
        headers = {"Content-Type": content_type}
        
        response = requests.post(url, data=data, headers=headers)
        
        if response.status_code in [200, 201, 204]:
            logger.info(f"Uploaded {filepath} to Fuseki")
            return True
        else:
            logger.error(f"Upload failed: {response.status_code}")
            return False
    
    def upload_directory(
        self, 
        directory: str,
        file_pattern: str = "*.ttl"
    ) -> Dict[str, bool]:
        """Upload all RDF files from directory."""
        results = {}
        
        for filepath in Path(directory).glob(file_pattern):
            graph_name = f"https://uip.hcmc.gov.vn/graph/{filepath.stem}"
            results[str(filepath)] = self.upload_file(
                str(filepath),
                graph=graph_name
            )
        
        return results
```

---

## 🌐 Web UI

Access Fuseki Web UI at: **http://localhost:3030**

### Features

1. **Dataset Management** - Create, delete, backup datasets
2. **Query Editor** - Write and execute SPARQL queries
3. **Upload** - Upload RDF files directly
4. **Statistics** - View triple counts and graph info

### Query Interface

1. Navigate to http://localhost:3030
2. Select dataset "uip"
3. Click "query" button
4. Enter SPARQL query
5. Click "Run Query"

---

## 📋 CLI Commands

### Using SOH (SPARQL over HTTP)

```bash
# Query
curl -X POST http://localhost:3030/uip/query \
  -H "Content-Type: application/sparql-query" \
  -H "Accept: application/json" \
  -d "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# Upload Turtle file
curl -X POST http://localhost:3030/uip/data \
  -H "Content-Type: text/turtle" \
  --data-binary @data/rdf/cameras.ttl

# Upload to named graph
curl -X POST "http://localhost:3030/uip/data?graph=https://uip.hcmc.gov.vn/graph/cameras" \
  -H "Content-Type: text/turtle" \
  --data-binary @data/rdf/cameras.ttl

# SPARQL Update
curl -X POST http://localhost:3030/uip/update \
  -H "Content-Type: application/sparql-update" \
  -d "INSERT DATA { <urn:test> <urn:label> 'Test' }"

# Clear graph
curl -X POST http://localhost:3030/uip/update \
  -H "Content-Type: application/sparql-update" \
  -d "CLEAR GRAPH <https://uip.hcmc.gov.vn/graph/cameras>"
```

### Using Python Script

```bash
# Query Fuseki
python -m src.utils.sparql_client \
  --query "SELECT * WHERE { ?s a ?type } LIMIT 10"

# Upload RDF files
python -m src.utils.rdf_uploader \
  --directory data/rdf \
  --pattern "*.ttl"
```

---

## 🧪 Health Check

```python
async def check_fuseki_health() -> dict:
    """Check Fuseki server health."""
    import aiohttp
    
    async with aiohttp.ClientSession() as session:
        try:
            # Check server status
            async with session.get(
                "http://localhost:3030/$/ping",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    # Check dataset
                    async with session.get(
                        "http://localhost:3030/$/datasets/uip"
                    ) as ds_resp:
                        if ds_resp.status == 200:
                            return {
                                "status": "healthy",
                                "dataset": "uip",
                                "details": await ds_resp.json()
                            }
                
                return {"status": "degraded", "error": "Dataset not found"}
                
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Check if Fuseki container is running |
| Query timeout | Add LIMIT clause, optimize query |
| Upload fails | Check content-type header |
| Out of memory | Increase Java heap in Docker |

### Logs

```bash
# View Fuseki logs
docker logs uip-fuseki

# Follow logs
docker logs -f uip-fuseki
```

---

## 🔗 Related Pages

- [[Semantic-Web-Guide]] - Semantic web concepts
- [[RDF-Assembler-Agent]] - RDF generation
- [[SOSA-SSN-Ontology]] - Sensor ontology
- [[Data-Flow]] - Data pipeline
- [[Docker-Services]] - Docker configuration

---

<p align="center">
  <sub>Part of <a href="Home">UIP - Urban Intelligence Platform</a> Documentation</sub>
</p>
