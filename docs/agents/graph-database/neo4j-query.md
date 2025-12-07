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
File: agents/graph-database/neo4j-query.md
Module: Graph Database - Neo4j Query Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Neo4j Query Agent documentation for high-level graph query operations
  for traffic analytics and relationship analysis.
============================================================================
-->

# Neo4j Query Agent

The Neo4j Query Agent provides high-level graph query operations for traffic analytics and relationship analysis.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.graph_database.neo4j_query_agent` |
| **Class** | `Neo4jQueryAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

The Neo4j Query Agent enables:

- **Complex graph queries** using Cypher language
- **Path finding** between traffic entities
- **Aggregation queries** for analytics dashboards
- **Real-time graph traversal** for pattern detection

## 🔧 Query Types

### Entity Queries

```python
# Get camera with relationships
agent.get_camera_with_observations("CAM_001", limit=100)

# Get accident with related entities
agent.get_accident_context("ACC_001")
```

### Path Queries

```python
# Find shortest path between cameras
agent.find_path("CAM_001", "CAM_050", max_hops=5)

# Find all paths through congestion zones
agent.find_congestion_paths(start_camera, end_camera)
```

### Analytics Queries

```python
# Get hotspot cameras
agent.get_accident_hotspots(min_accidents=5)

# Get traffic flow patterns
agent.get_flow_patterns(time_range="24h")
```

## 📊 Query Examples

### Find Nearby Cameras

```python
from src.agents.graph_database.neo4j_query_agent import Neo4jQueryAgent

query_agent = Neo4jQueryAgent()

# Find cameras within spatial proximity
nearby = query_agent.find_nearby_cameras(
    camera_id="CAM_001",
    max_distance_km=1.0
)
```

### Traffic Pattern Analysis

```python
# Analyze morning rush patterns
patterns = query_agent.analyze_patterns(
    time_window="07:00-09:00",
    days=["Monday", "Tuesday", "Wednesday"]
)

# Get congestion correlations
correlations = query_agent.get_congestion_correlations(
    threshold=0.7
)
```

### Accident Impact Analysis

```python
# Find all entities affected by accident
impact = query_agent.get_accident_impact("ACC_001")

# Result includes:
# - Affected cameras
# - Traffic flow changes
# - Congestion ripple effects
# - Estimated recovery time
```

## 🚀 Usage

### Initialize Agent

```python
from src.agents.graph_database.neo4j_query_agent import Neo4jQueryAgent

config = {
    "enabled": True,
    "neo4j_uri": "bolt://localhost:7687",
    "username": "neo4j",
    "password": "password"
}
query_agent = Neo4jQueryAgent(config)
```

### Execute Custom Queries

```python
# Run custom Cypher query
result = query_agent.execute_query("""
    MATCH (c:Camera)-[:OBSERVES]->(o:Observation)
    WHERE o.timestamp > datetime() - duration('PT1H')
    RETURN c.name, avg(o.vehicle_count) as avg_count
    ORDER BY avg_count DESC
""")

# Run with parameters
result = query_agent.execute_query(
    query="MATCH (c:Camera {id: $id}) RETURN c",
    params={"id": "CAM_001"}
)
```

### Aggregate Functions

```python
# Get statistics
stats = query_agent.get_statistics()
# Returns:
# {
#     "total_cameras": 150,
#     "total_observations": 45000,
#     "total_accidents": 234,
#     "avg_observations_per_camera": 300
# }
```

## ⚙️ Configuration

```yaml
# config/neo4j_sync.yaml
neo4j_query:
  enabled: true
  
  # Query optimization
  optimization:
    use_indexes: true
    cache_results: true
    cache_ttl: 60
  
  # Query limits
  limits:
    max_results: 10000
    timeout_seconds: 30
    max_path_length: 10
```

## 📈 Performance Optimization

### Index Usage

```cypher
// Ensure indexes exist
CREATE INDEX camera_id_index FOR (c:Camera) ON (c.id)
CREATE INDEX observation_timestamp_index FOR (o:Observation) ON (o.timestamp)
```

### Query Profiling

```python
# Profile query performance
profile = query_agent.profile_query("""
    MATCH (c:Camera)-[:DETECTS]->(a:Accident)
    RETURN c, a
""")
# Returns execution plan and timing
```

## 📖 Related Documentation

- [Neo4j Sync Agent](neo4j-sync) - Entity synchronization
- [Pattern Recognition Agent](../analytics/pattern-recognition) - Pattern analysis
- [Congestion Detection Agent](../analytics/congestion-detection) - Congestion analytics

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
