---
sidebar_position: 1
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Neo4j Sync Agent Documentation.

File: apps/traffic-web-app/frontend/docs/docs/agents/graph-database/neo4j-sync.md
Module: Graph Database Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for the Neo4j Sync Agent component.
============================================================================
-->

# Neo4j Sync Agent

The Neo4j Sync Agent synchronizes traffic entities and relationships to Neo4j graph database for advanced relationship queries and graph-based analytics.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.graph_database.neo4j_sync_agent` |
| **Class** | `Neo4jSyncAgent` |
| **Author** | Nguyen Viet Hoang |
| **Version** | 1.0.0 |

## 🎯 Purpose

The Neo4j Sync Agent enables:

- **Graph-based relationships** between traffic entities
- **Advanced pattern queries** using Cypher
- **Spatial analytics** with geographic relationships
- **Real-time graph updates** from streaming data

## 📊 Graph Schema

### Node Types

| Node Label | Description | Properties |
|------------|-------------|------------|
| `Camera` | Traffic camera | id, name, location, status |
| `Observation` | Traffic observation | id, timestamp, vehicle_count, speed |
| `Accident` | Accident event | id, severity, location, timestamp |
| `Congestion` | Congestion zone | id, level, duration, affected_roads |
| `Pattern` | Traffic pattern | id, type, frequency, time_of_day |

### Relationship Types

| Relationship | From | To | Description |
|--------------|------|-----|-------------|
| `OBSERVES` | Camera | Observation | Camera captures observation |
| `DETECTS` | Camera | Accident | Camera detects accident |
| `CAUSES` | Accident | Congestion | Accident causes congestion |
| `CORRELATES_WITH` | Pattern | Pattern | Pattern correlation |
| `NEAR_TO` | Camera | Camera | Spatial proximity |

## 🔧 Architecture

```text
┌─────────────────┐    ┌─────────────────┐
│  NGSI-LD        │───▶│   Neo4j Sync    │
│  Entities       │    │     Agent       │
└─────────────────┘    └────────┬────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │  Create  │ │  Update  │ │  Delete  │
             │  Nodes   │ │  Props   │ │  Nodes   │
             └──────────┘ └──────────┘ └──────────┘
                    │           │           │
                    └───────────┼───────────┘
                                ▼
                       ┌────────────────┐
                       │     Neo4j      │
                       │   Database     │
                       └────────────────┘
```

## 🚀 Usage

### Basic Synchronization

```python
from src.agents.graph_database.neo4j_sync_agent import Neo4jSyncAgent

config = {
    "enabled": True,
    "neo4j_uri": "bolt://localhost:7687",
    "username": "neo4j",
    "password": "password"
}
sync_agent = Neo4jSyncAgent(config)

# Sync camera entity
camera = {
    "id": "urn:ngsi-ld:Camera:CAM_001",
    "type": "Camera",
    "name": {"value": "Camera 001"},
    "location": {
        "value": {
            "coordinates": [106.660172, 10.762622]
        }
    }
}
sync_agent.sync_entity(camera)
```

### Batch Synchronization

```python
# Sync multiple entities
entities = [camera1, camera2, camera3]
sync_agent.sync_entities(entities)

# Sync with relationships
sync_agent.sync_with_relationships(
    entity=observation,
    relationships=[
        ("OBSERVED_BY", camera_id),
        ("PART_OF", pattern_id)
    ]
)
```

### Query Graph

```python
# Find all accidents near a camera
results = sync_agent.query("""
    MATCH (c:Camera {id: $camera_id})-[:DETECTS]->(a:Accident)
    WHERE a.severity = 'severe'
    RETURN a
    ORDER BY a.timestamp DESC
    LIMIT 10
""", {"camera_id": "CAM_001"})
```

## ⚙️ Configuration

### Environment Variables

```bash
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

### YAML Configuration

```yaml
# config/neo4j_sync.yaml
neo4j:
  enabled: true
  uri: bolt://localhost:7687
  username: neo4j
  password: ${NEO4J_PASSWORD}
  
  pool:
    max_size: 50
    acquisition_timeout: 30
  
  sync:
    batch_size: 100
    create_indexes: true
    
  indexes:
    - label: Camera
      property: id
    - label: Observation
      property: timestamp
    - label: Accident
      property: severity
```

## 📈 Cypher Query Examples

### Find Traffic Patterns

```cypher
// Find cameras with high accident rates
MATCH (c:Camera)-[:DETECTS]->(a:Accident)
WITH c, count(a) as accident_count
WHERE accident_count > 5
RETURN c.name, accident_count
ORDER BY accident_count DESC
```

### Spatial Queries

```cypher
// Find cameras within 1km radius
MATCH (c1:Camera), (c2:Camera)
WHERE c1.id <> c2.id
AND point.distance(
    point({longitude: c1.lon, latitude: c1.lat}),
    point({longitude: c2.lon, latitude: c2.lat})
) < 1000
RETURN c1.name, c2.name
```

### Pattern Correlation

```cypher
// Find correlated congestion patterns
MATCH (p1:Pattern)-[:CORRELATES_WITH]->(p2:Pattern)
WHERE p1.type = 'morning_rush'
RETURN p1, p2, p1.correlation_score
```

## 🛡️ Error Handling

```python
try:
    sync_agent.sync_entity(entity)
except ConnectionError:
    logger.error("Neo4j connection failed")
    # Fallback to queue for retry
    retry_queue.add(entity)
except ConstraintError:
    logger.warning("Duplicate entity, updating instead")
    sync_agent.update_entity(entity)
```

## 📖 Related Documentation

- [Neo4j Query Agent](neo4j-query) - Graph query operations
- [Entity Publisher Agent](../context-management/entity-publisher) - Entity source
- [Triplestore Loader](../rdf-linked-data/triplestore-loader) - RDF storage

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
