---
sidebar_label: 'LOD Linkset Enrichment'
title: 'LOD Linkset Enrichment Agent'
sidebar_position: 3
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
LOD Linkset Enrichment Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/rdf-linked-data/lod-linkset-enrichment.md
Module: RDF Linked Data Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the LOD Linkset Enrichment Agent component.
============================================================================
-->

# LOD Linkset Enrichment Agent

The LOD Linkset Enrichment Agent creates links to external Linked Open Data sources.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.rdf_linked_data.lod_linkset_enrichment_agent` |
| **Class** | `LODLinksetEnrichmentAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Link to external LOD sources** (DBpedia, Wikidata, GeoNames)
- **Create owl:sameAs relations** for entity reconciliation
- **Enrich entities** with external knowledge
- **Maintain linkset quality** metrics

## 🌐 External Sources

| Source | Type | Link Predicate |
|--------|------|----------------|
| DBpedia | Knowledge base | `owl:sameAs` |
| Wikidata | Knowledge graph | `owl:sameAs` |
| GeoNames | Geographic | `gn:geonamesId` |
| OpenStreetMap | Geographic | `osm:node` |

## 🚀 Usage

### Enrich Entity

```python
from src.agents.rdf_linked_data.lod_linkset_enrichment_agent import LODLinksetEnrichmentAgent

agent = LODLinksetEnrichmentAgent()

# Enrich with external links
enriched = await agent.enrich(
    entity_id="urn:ngsi-ld:TrafficCamera:CAM_001",
    sources=["geonames", "osm"]
)
```

### Create Linkset

```python
# Create linkset for entity type
linkset = await agent.create_linkset(
    entity_type="TrafficCamera",
    target_source="osm",
    match_property="location"
)
```

### Query External Data

```python
# Fetch external data for entity
external_data = await agent.fetch_external(
    entity_id="urn:ngsi-ld:District:D1",
    source="wikidata"
)
# Returns Wikidata properties for District 1
```

## ⚙️ Configuration

```yaml
# config/lod_linkset_mappings.yaml
lod_linkset:
  enabled: true
  
  # External endpoints
  endpoints:
    dbpedia:
      sparql: "https://dbpedia.org/sparql"
      lookup: "https://lookup.dbpedia.org/api/search"
    wikidata:
      sparql: "https://query.wikidata.org/sparql"
      api: "https://www.wikidata.org/w/api.php"
    geonames:
      api: "http://api.geonames.org"
      username: "${GEONAMES_USER}"
    osm:
      overpass: "https://overpass-api.de/api/interpreter"
  
  # Matching rules
  matching:
    TrafficCamera:
      sources: ["osm"]
      match_by: "location"
      radius_km: 0.1
    District:
      sources: ["wikidata", "geonames"]
      match_by: "name"
```

## 🔗 Link Types

| Predicate | Description | Use Case |
|-----------|-------------|----------|
| `owl:sameAs` | Same entity | Entity reconciliation |
| `rdfs:seeAlso` | Related resource | Additional info |
| `skos:exactMatch` | Exact concept match | Vocabulary mapping |
| `skos:closeMatch` | Close concept match | Approximate mapping |

## 📖 Related Documentation

- [NGSI-LD to RDF](ngsi-ld-to-rdf) - RDF conversion
- [Triplestore Loader](triplestore-loader) - Storage
- [Content Negotiation](content-negotiation) - Format handling

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
