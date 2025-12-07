<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/LOD-Cloud-Integration.md
Module: LOD Cloud Integration Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete guide to Linked Open Data (LOD) Cloud integration in UIP.
============================================================================
-->

# 🌐 LOD Cloud Integration

Complete guide to Linked Open Data (LOD) Cloud integration in UIP - Urban Intelligence Platform.

---

## 📊 Overview

**LOD Cloud** (Linked Open Data Cloud) is a global network of interconnected datasets that follow Linked Data principles. UIP - Urban Intelligence Platform integrates with LOD Cloud to:

- 🔗 **Link** traffic data to global datasets
- 🌍 **Enrich** with geographic and administrative data
- 📚 **Connect** to domain knowledge bases
- 🔍 **Enable** SPARQL federation queries

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOD CLOUD ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                           ┌─────────────────────┐                           │
│                           │    LOD CLOUD        │                           │
│                           │                     │                           │
│      ┌──────────┐         │  ┌─────────────┐   │                           │
│      │ DBpedia  │◄────────┼──│             │   │                           │
│      └──────────┘         │  │             │   │                           │
│                           │  │  SPARQL     │   │                           │
│      ┌──────────┐         │  │ Federation  │   │                           │
│      │ Wikidata │◄────────┼──│             │   │                           │
│      └──────────┘         │  │             │   │                           │
│                           │  └──────┬──────┘   │                           │
│      ┌──────────┐         │         │          │                           │
│      │ GeoNames │◄────────┼─────────┘          │                           │
│      └──────────┘         └─────────────────────┘                           │
│                                     ▲                                       │
│                                     │                                       │
│  ┌──────────────────────────────────┼────────────────────────────────────┐ │
│  │                       UIP PLATFORM                                    │ │
│  │                                  │                                    │ │
│  │  ┌────────────────┐    ┌────────┴────────┐    ┌────────────────────┐ │ │
│  │  │ RDF Assembler  │───▶│  Apache Jena    │◀───│ SPARQL Engine      │ │ │
│  │  │ Agent          │    │  Fuseki         │    │ (Federation)       │ │ │
│  │  └────────────────┘    └────────┬────────┘    └────────────────────┘ │ │
│  │                                 │                                    │ │
│  │  ┌────────────────┐    ┌────────▼────────┐                          │ │
│  │  │ LOD Enrichment │───▶│   RDF Store     │                          │ │
│  │  │ Agent          │    │   (TDB2)        │                          │ │
│  │  └────────────────┘    └─────────────────┘                          │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔗 External Datasets

### Connected LOD Sources

| Dataset | Description | URI Pattern |
|---------|-------------|-------------|
| **DBpedia** | Wikipedia structured data | `http://dbpedia.org/resource/` |
| **Wikidata** | Collaborative knowledge base | `http://www.wikidata.org/entity/` |
| **GeoNames** | Geographic database | `https://sws.geonames.org/` |
| **OpenStreetMap** | Map data | `https://www.openstreetmap.org/` |
| **Schema.org** | Web vocabulary | `https://schema.org/` |

### Vietnam-Specific Datasets

| Dataset | Description | URI Pattern |
|---------|-------------|-------------|
| **Wikidata Vietnam** | VN entities | `http://www.wikidata.org/entity/Q881` |
| **DBpedia Vietnam** | VN Wikipedia | `http://vi.dbpedia.org/resource/` |
| **GeoNames Vietnam** | VN locations | `https://sws.geonames.org/1562822/` |

---

## 📋 Linkset Mappings

### Configuration (`config/lod_linkset_mappings.yaml`)

```yaml
# LOD Linkset Mappings Configuration
version: "2.0.0"

# Dataset Links
datasets:
  dbpedia:
    endpoint: "https://dbpedia.org/sparql"
    prefix: "http://dbpedia.org/resource/"
    
  wikidata:
    endpoint: "https://query.wikidata.org/sparql"
    prefix: "http://www.wikidata.org/entity/"
    
  geonames:
    endpoint: "https://sws.geonames.org/"
    prefix: "https://sws.geonames.org/"

# Entity Mappings
mappings:
  # Ho Chi Minh City
  - local: "urn:ngsi-ld:City:hcmc"
    links:
      - external: "http://dbpedia.org/resource/Ho_Chi_Minh_City"
        predicate: "owl:sameAs"
      - external: "http://www.wikidata.org/entity/Q1854"
        predicate: "owl:sameAs"
      - external: "https://sws.geonames.org/1566083/"
        predicate: "gn:locatedIn"

  # District mappings
  - local: "urn:ngsi-ld:District:district-1"
    links:
      - external: "http://www.wikidata.org/entity/Q575054"
        predicate: "owl:sameAs"

# Road Types
road_type_mappings:
  - local: "primary"
    links:
      - external: "http://www.wikidata.org/entity/Q34442"
        predicate: "skos:broadMatch"
```

### RDF Linkset Output

```turtle
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix uip: <https://uip.hcmut.edu.vn/ontology#> .

# City Link
<urn:ngsi-ld:City:hcmc>
    owl:sameAs <http://dbpedia.org/resource/Ho_Chi_Minh_City> ;
    owl:sameAs <http://www.wikidata.org/entity/Q1854> ;
    skos:exactMatch <https://sws.geonames.org/1566083/> .

# District Link  
<urn:ngsi-ld:District:district-1>
    owl:sameAs <http://www.wikidata.org/entity/Q575054> .
```

---

## 🔍 SPARQL Federation

### Federated Query Example

```sparql
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX dbo: <http://dbpedia.org/ontology/>
PREFIX uip: <https://uip.hcmut.edu.vn/ontology#>

SELECT ?camera ?road ?population
WHERE {
  # Local data
  ?camera a uip:Camera ;
          uip:isOnRoad ?road .
  
  # Federated query to DBpedia
  SERVICE <https://dbpedia.org/sparql> {
    ?dbpediaCity owl:sameAs ?road ;
                 dbo:populationTotal ?population .
  }
}
```

### Wikidata Federation

```sparql
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX uip: <https://uip.hcmut.edu.vn/ontology#>

SELECT ?district ?area ?population
WHERE {
  # Local district
  ?localDistrict a uip:District ;
                 owl:sameAs ?wikidataEntity .
  
  # Wikidata federation
  SERVICE <https://query.wikidata.org/sparql> {
    ?wikidataEntity wdt:P2046 ?area ;      # area
                    wdt:P1082 ?population . # population
  }
}
```

---

## 🛠️ LOD Enrichment Agent

### Agent Overview

The **LOD Enrichment Agent** automatically:
1. Discovers linked entities in LOD Cloud
2. Retrieves additional properties
3. Integrates enriched data into UIP - Urban Intelligence Platform

### Python Implementation

```python
# src/agents/lod_enrichment_agent.py

from typing import Dict, Any, List
from SPARQLWrapper import SPARQLWrapper, JSON

class LODEnrichmentAgent:
    """Agent for LOD Cloud enrichment."""
    
    def __init__(self):
        self.endpoints = {
            "dbpedia": "https://dbpedia.org/sparql",
            "wikidata": "https://query.wikidata.org/sparql"
        }
    
    def enrich_from_wikidata(self, entity_uri: str) -> Dict[str, Any]:
        """Enrich entity with Wikidata properties."""
        sparql = SPARQLWrapper(self.endpoints["wikidata"])
        
        query = f"""
        PREFIX wd: <http://www.wikidata.org/entity/>
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        
        SELECT ?property ?value
        WHERE {{
          <{entity_uri}> ?property ?value .
        }}
        LIMIT 100
        """
        
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        
        results = sparql.query().convert()
        return self._parse_results(results)
    
    def find_linked_entities(self, label: str, type_filter: str = None) -> List[str]:
        """Find linked entities by label."""
        sparql = SPARQLWrapper(self.endpoints["wikidata"])
        
        type_clause = f"?item wdt:P31 wd:{type_filter} ." if type_filter else ""
        
        query = f"""
        SELECT ?item ?label
        WHERE {{
          ?item rdfs:label "{label}"@en .
          {type_clause}
        }}
        LIMIT 10
        """
        
        sparql.setQuery(query)
        sparql.setReturnFormat(JSON)
        
        results = sparql.query().convert()
        return [r["item"]["value"] for r in results["results"]["bindings"]]
```

---

## 📊 Link Types

### OWL Linking Properties

| Property | Description | Usage |
|----------|-------------|-------|
| `owl:sameAs` | Identity link | Exact same entity |
| `rdfs:seeAlso` | Related resource | Reference link |
| `skos:exactMatch` | Exact match | Vocabulary alignment |
| `skos:closeMatch` | Close match | Similar concept |
| `skos:broadMatch` | Broader match | Parent concept |
| `skos:narrowMatch` | Narrower match | Child concept |

### Link Examples

```turtle
# Identity Links
<urn:ngsi-ld:City:hcmc>
    owl:sameAs <http://dbpedia.org/resource/Ho_Chi_Minh_City> ;
    owl:sameAs <http://www.wikidata.org/entity/Q1854> .

# Vocabulary Alignment
<urn:ngsi-ld:RoadType:primary>
    skos:exactMatch <http://dbpedia.org/resource/Primary_road> ;
    skos:broadMatch <http://www.wikidata.org/entity/Q34442> .

# See Also
<urn:ngsi-ld:Camera:TTH-406>
    rdfs:seeAlso <https://hcmctraffic.gov.vn/cameras/TTH-406> .
```

---

## 🔧 Configuration

### Fuseki LOD Configuration

```yaml
# config/fuseki_lod.yaml
version: "2.0.0"

# Enable federation
federation:
  enabled: true
  timeout: 30000  # 30 seconds
  
# External endpoints
endpoints:
  - name: dbpedia
    url: https://dbpedia.org/sparql
    enabled: true
    
  - name: wikidata
    url: https://query.wikidata.org/sparql
    enabled: true
    
  - name: geonames
    url: https://sws.geonames.org/
    enabled: true

# Cache settings
cache:
  enabled: true
  ttl: 3600  # 1 hour
  max_size: 10000
```

### Environment Variables

```bash
# .env
LOD_DBPEDIA_ENDPOINT=https://dbpedia.org/sparql
LOD_WIKIDATA_ENDPOINT=https://query.wikidata.org/sparql
LOD_CACHE_ENABLED=true
LOD_CACHE_TTL=3600
LOD_FEDERATION_TIMEOUT=30000
```

---

## 📈 Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Local RDF     │────▶│   Link          │────▶│   Enriched      │
│   Entities      │     │   Discovery     │     │   Entities      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Label         │────▶│   SPARQL        │────▶│   Property      │
│   Matching      │     │   Federation    │     │   Merge         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## ✅ Best Practices

### 1. Link Quality

```python
# Use confidence scores for links
def create_link(local: str, external: str, confidence: float):
    if confidence >= 0.9:
        return (local, "owl:sameAs", external)
    elif confidence >= 0.7:
        return (local, "skos:closeMatch", external)
    else:
        return (local, "rdfs:seeAlso", external)
```

### 2. Caching

```python
# Cache external lookups
from functools import lru_cache

@lru_cache(maxsize=1000)
def fetch_external_properties(uri: str) -> dict:
    """Cached fetch from LOD Cloud."""
    return sparql_query(uri)
```

### 3. Rate Limiting

```python
# Respect endpoint rate limits
import time

class RateLimiter:
    def __init__(self, requests_per_second: float = 1.0):
        self.min_interval = 1.0 / requests_per_second
        self.last_request = 0
    
    def wait(self):
        elapsed = time.time() - self.last_request
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request = time.time()
```

---

## 🔗 Related Pages

- [[Semantic-Web-Guide]] - Semantic web overview
- [[NGSI-LD-Guide]] - NGSI-LD format
- [[Smart-Data-Models]] - Data model alignment
- [[RDF-Assembler-Agent]] - RDF generation
- [[Apache-Fuseki-Guide]] - SPARQL endpoint

---

## 📚 References

- [LOD Cloud Diagram](https://lod-cloud.net/)
- [DBpedia](https://dbpedia.org/)
- [Wikidata](https://www.wikidata.org/)
- [GeoNames](https://www.geonames.org/)
- [SPARQL Federation](https://www.w3.org/TR/sparql11-federated-query/)
