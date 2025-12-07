---
sidebar_position: 2
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: agents/rdf-linked-data/content-negotiation.md
Module: RDF Linked Data - Content Negotiation Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Content Negotiation Agent documentation for handling HTTP content
  negotiation for RDF data in multiple formats.
============================================================================
-->

# Content Negotiation Agent

The Content Negotiation Agent handles HTTP content negotiation for RDF data in multiple formats.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.rdf_linked_data.content_negotiation_agent` |
| **Class** | `ContentNegotiationAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Negotiate content types** for RDF responses
- **Serialize RDF data** in requested formats
- **Support multiple RDF syntaxes** (Turtle, JSON-LD, N-Triples, RDF/XML)
- **Handle format conversion** transparently

## 📊 Supported Formats

| Format | MIME Type | Extension |
|--------|-----------|-----------|
| Turtle | `text/turtle` | `.ttl` |
| JSON-LD | `application/ld+json` | `.jsonld` |
| N-Triples | `application/n-triples` | `.nt` |
| RDF/XML | `application/rdf+xml` | `.rdf` |
| N-Quads | `application/n-quads` | `.nq` |

## 🚀 Usage

### Negotiate Format

```python
from src.agents.rdf_linked_data.content_negotiation_agent import ContentNegotiationAgent

agent = ContentNegotiationAgent()

# Determine best format from Accept header
format = agent.negotiate(
    accept_header="text/turtle, application/ld+json;q=0.8"
)
# Returns: "text/turtle"
```

### Serialize RDF

```python
# Serialize graph to requested format
from rdflib import Graph

graph = Graph()
# ... populate graph ...

output = agent.serialize(
    graph=graph,
    format="text/turtle"
)
```

### Handle Request

```python
# Complete request handling
async def handle_rdf_request(request, entity_id):
    graph = await get_entity_graph(entity_id)
    
    format = agent.negotiate(request.headers.get("Accept"))
    content = agent.serialize(graph, format)
    
    return Response(
        content=content,
        media_type=format
    )
```

## ⚙️ Configuration

```yaml
# config/content_negotiation_config.yaml
content_negotiation:
  enabled: true
  
  # Default format if no Accept header
  default_format: "application/ld+json"
  
  # Format preferences (quality values)
  preferences:
    "text/turtle": 1.0
    "application/ld+json": 0.9
    "application/n-triples": 0.8
    "application/rdf+xml": 0.7
  
  # Serialization options
  serialization:
    turtle:
      indent: 2
      base: "https://uip.city.gov/"
    jsonld:
      compact: true
      context: "https://uip.city.gov/context.jsonld"
```

## 📖 Related Documentation

- [Triplestore Loader](triplestore-loader) - RDF storage
- [NGSI-LD to RDF](ngsi-ld-to-rdf) - Format conversion
- [LOD Linkset Enrichment](lod-linkset-enrichment) - Linked data

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
