<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Database-Guide.md
Module: Database Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete documentation for all database systems.
============================================================================
-->
# 💾 Database Guide

Complete documentation for all database systems.

---

## 📊 Database Overview

| Database | Purpose | Port | Protocol |
|----------|---------|------|----------|
| Neo4j | Knowledge Graph | 7474/7687 | Cypher |
| Apache Fuseki | RDF Triple Store | 3030 | SPARQL |
| PostgreSQL | Relational Data | 5432 | SQL |
| MongoDB | Document Store | 27017 | BSON |
| Redis | Cache/Queue | 6379 | Redis Protocol |
| TimescaleDB | Time-series | 5433 | SQL |

---

## 🔷 Neo4j (Graph Database)

### Purpose

- **Knowledge Graph** storage
- **Entity relationships** (Camera → Road → District)
- **Path analysis** and graph algorithms

### Connection

```python
from neo4j import GraphDatabase

driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "neo4j123")
)

def run_query(query, params=None):
    with driver.session() as session:
        result = session.run(query, params or {})
        return list(result)
```

### Schema

```cypher
// Create indexes
CREATE INDEX camera_id IF NOT EXISTS FOR (c:Camera) ON (c.id);
CREATE INDEX road_name IF NOT EXISTS FOR (r:Road) ON (r.name);

// Create constraints
CREATE CONSTRAINT camera_unique IF NOT EXISTS 
FOR (c:Camera) REQUIRE c.id IS UNIQUE;

// Node types
(:Camera {id, name, lat, lng, status, type})
(:Road {id, name, lanes, speedLimit})
(:District {id, name})
(:TrafficState {id, timestamp, level, density})

// Relationship types
(:Camera)-[:MONITORS]->(:Road)
(:Road)-[:LOCATED_IN]->(:District)
(:Road)-[:CONNECTS_TO]->(:Road)
(:Camera)-[:HAS_STATE]->(:TrafficState)
```

### Common Queries

```cypher
// Find cameras monitoring a road
MATCH (c:Camera)-[:MONITORS]->(r:Road {name: 'Nguyen Van Linh'})
RETURN c.name, c.status;

// Get traffic state for all cameras
MATCH (c:Camera)-[:HAS_STATE]->(s:TrafficState)
WHERE s.timestamp > datetime() - duration('PT1H')
RETURN c.name, s.level, s.density
ORDER BY s.timestamp DESC;

// Find connected roads
MATCH path = (r1:Road)-[:CONNECTS_TO*1..3]->(r2:Road)
WHERE r1.name = 'Le Loi'
RETURN path;

// District traffic summary
MATCH (d:District)<-[:LOCATED_IN]-(r:Road)<-[:MONITORS]-(c:Camera)-[:HAS_STATE]->(s:TrafficState)
WHERE s.timestamp > datetime() - duration('PT1H')
RETURN d.name, 
       count(DISTINCT c) as cameras,
       avg(s.density) as avgDensity
ORDER BY avgDensity DESC;
```

### Visualization

Access Neo4j Browser: http://localhost:7474

---

## 🔶 Apache Fuseki (RDF/SPARQL)

### Purpose

- **Linked Data** storage
- **SPARQL** query interface
- **Semantic Web** integration

### Connection

```python
from SPARQLWrapper import SPARQLWrapper, JSON

sparql = SPARQLWrapper("http://localhost:3030/traffic/query")
sparql.setReturnFormat(JSON)

def query_fuseki(query):
    sparql.setQuery(query)
    results = sparql.query().convert()
    return results["results"]["bindings"]
```

### Ontologies Used

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix ssn: <http://www.w3.org/ns/ssn/> .
@prefix fiware: <https://uri.fiware.org/ns/dataModels#> .
@prefix sdm: <https://smart-data-models.github.io/> .
@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> .
```

### Common SPARQL Queries

```sparql
# Get all traffic observations
PREFIX sosa: <http://www.w3.org/ns/sosa/>
SELECT ?observation ?sensor ?result ?time
WHERE {
    ?observation a sosa:Observation ;
                 sosa:madeBySensor ?sensor ;
                 sosa:hasSimpleResult ?result ;
                 sosa:resultTime ?time .
}
ORDER BY DESC(?time)
LIMIT 100

# Find sensors by location
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX sosa: <http://www.w3.org/ns/sosa/>
SELECT ?sensor ?lat ?long
WHERE {
    ?sensor a sosa:Sensor ;
            geo:lat ?lat ;
            geo:long ?long .
    FILTER (?lat > 10.7 && ?lat < 10.9)
    FILTER (?long > 106.5 && ?long < 106.8)
}

# Aggregate traffic data by road
PREFIX sdm: <https://smart-data-models.github.io/>
SELECT ?road (AVG(?intensity) as ?avgIntensity)
WHERE {
    ?obs a sdm:TrafficFlowObserved ;
         sdm:refRoadSegment ?road ;
         sdm:intensity ?intensity .
}
GROUP BY ?road
ORDER BY DESC(?avgIntensity)
```

### Dataset Management

```bash
# Create dataset
curl -X POST http://localhost:3030/$/datasets \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "dbName=traffic&dbType=tdb2"

# Upload RDF data
curl -X POST http://localhost:3030/traffic/data \
  -H "Content-Type: text/turtle" \
  --data-binary @data.ttl

# Query endpoint
curl -G http://localhost:3030/traffic/query \
  --data-urlencode "query=SELECT * WHERE { ?s ?p ?o } LIMIT 10"
```

---

## 🐘 PostgreSQL (Relational)

### Purpose

- **Structured data** storage
- **User management**
- **Application state**
- **TimescaleDB** extension for time-series

### Connection

```python
import asyncio
import asyncpg

async def connect():
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        database="traffic",
        user="traffic_user",
        password="password"
    )
    return conn

async def query(sql, params=None):
    conn = await connect()
    try:
        if params:
            rows = await conn.fetch(sql, *params)
        else:
            rows = await conn.fetch(sql)
        return [dict(row) for row in rows]
    finally:
        await conn.close()

# Sync wrapper for non-async contexts
def query_sync(sql, params=None):
    return asyncio.run(query(sql, params))
```

### Schema

```sql
-- Cameras table
CREATE TABLE cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Traffic readings (TimescaleDB hypertable)
CREATE TABLE traffic_readings (
    time TIMESTAMPTZ NOT NULL,
    camera_id UUID REFERENCES cameras(id),
    vehicle_count INTEGER,
    average_speed DECIMAL(5, 2),
    congestion_level VARCHAR(20),
    density DECIMAL(5, 2)
);

SELECT create_hypertable('traffic_readings', 'time');

-- Indexes
CREATE INDEX idx_cameras_location ON cameras USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);
CREATE INDEX idx_readings_camera ON traffic_readings(camera_id, time DESC);
```

### Common Queries

```sql
-- Get recent readings
SELECT c.name, r.vehicle_count, r.congestion_level, r.time
FROM traffic_readings r
JOIN cameras c ON r.camera_id = c.id
WHERE r.time > NOW() - INTERVAL '1 hour'
ORDER BY r.time DESC;

-- Hourly aggregates
SELECT time_bucket('1 hour', time) AS hour,
       camera_id,
       AVG(vehicle_count) as avg_vehicles,
       AVG(average_speed) as avg_speed
FROM traffic_readings
WHERE time > NOW() - INTERVAL '24 hours'
GROUP BY hour, camera_id
ORDER BY hour DESC;

-- Cameras near location
SELECT id, name, 
       ST_Distance(
           ST_SetSRID(ST_MakePoint(lng, lat), 4326),
           ST_SetSRID(ST_MakePoint(106.6297, 10.8231), 4326)
       ) as distance
FROM cameras
ORDER BY distance
LIMIT 10;
```

---

## 🍃 MongoDB (Document Store)

### Purpose

- **Flexible schemas**
- **JSON documents**
- **Agent configurations**
- **Logs and events**

### Connection

```python
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client["traffic"]

# Collections
cameras = db["cameras"]
events = db["events"]
configs = db["configs"]
```

### Schema Examples

```javascript
// Camera document
{
    "_id": ObjectId("..."),
    "name": "Camera Nguyen Van Linh",
    "location": {
        "type": "Point",
        "coordinates": [106.6297, 10.8231]
    },
    "config": {
        "resolution": [1920, 1080],
        "fps": 30,
        "detection_zones": [...]
    },
    "metadata": {
        "installed_date": ISODate("2025-11-29"),
        "vendor": "Hikvision"
    }
}

// Event document
{
    "_id": ObjectId("..."),
    "type": "CONGESTION",
    "severity": "HIGH",
    "camera_id": ObjectId("..."),
    "timestamp": ISODate("2025-11-29T10:30:00Z"),
    "data": {
        "vehicle_count": 150,
        "density": 85.5,
        "duration_minutes": 15
    }
}
```

### Common Operations

```python
# Insert camera
cameras.insert_one({
    "name": "New Camera",
    "location": {"type": "Point", "coordinates": [106.6, 10.8]},
    "status": "active"
})

# Find by location
cameras.find({
    "location": {
        "$near": {
            "$geometry": {"type": "Point", "coordinates": [106.6, 10.8]},
            "$maxDistance": 1000
        }
    }
})

# Aggregate events by type
events.aggregate([
    {"$match": {"timestamp": {"$gte": datetime.now() - timedelta(days=1)}}},
    {"$group": {"_id": "$type", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}}
])
```

---

## 🔴 Redis (Cache/Queue)

### Purpose

- **Caching** query results
- **Session storage**
- **Message queue** (pub/sub)
- **Rate limiting**

### Connection

```python
import redis

r = redis.Redis(
    host='localhost',
    port=6379,
    decode_responses=True
)

# Or with connection pool
pool = redis.ConnectionPool(host='localhost', port=6379, db=0)
r = redis.Redis(connection_pool=pool)
```

### Common Patterns

```python
# Caching
def get_camera(camera_id):
    # Check cache
    cached = r.get(f"camera:{camera_id}")
    if cached:
        return json.loads(cached)
    
    # Fetch from DB
    camera = db.cameras.find_one({"_id": camera_id})
    
    # Cache for 5 minutes
    r.setex(f"camera:{camera_id}", 300, json.dumps(camera))
    return camera

# Rate limiting
def check_rate_limit(user_id, limit=100, window=60):
    key = f"rate:{user_id}"
    current = r.incr(key)
    if current == 1:
        r.expire(key, window)
    return current <= limit

# Pub/Sub
def publish_alert(alert):
    r.publish("alerts", json.dumps(alert))

def subscribe_alerts():
    pubsub = r.pubsub()
    pubsub.subscribe("alerts")
    for message in pubsub.listen():
        if message["type"] == "message":
            yield json.loads(message["data"])
```

### Data Structures

```bash
# Strings - simple cache
SET camera:123 '{"name":"Camera 1"}'
GET camera:123

# Hashes - object fields
HSET traffic:stats total_cameras 100
HSET traffic:stats active_cameras 95
HGETALL traffic:stats

# Lists - queues
LPUSH process_queue '{"job":"analyze","camera":"123"}'
RPOP process_queue

# Sets - unique items
SADD active_cameras "cam-1" "cam-2" "cam-3"
SMEMBERS active_cameras

# Sorted Sets - leaderboards
ZADD congestion_scores 85 "road-1" 92 "road-2" 45 "road-3"
ZREVRANGE congestion_scores 0 10 WITHSCORES
```

---

## 📊 Database Selection Guide

| Use Case | Recommended DB |
|----------|----------------|
| Knowledge graph queries | Neo4j |
| Semantic web, LOD | Fuseki |
| Structured transactions | PostgreSQL |
| Time-series data | TimescaleDB |
| Flexible documents | MongoDB |
| Caching, queues | Redis |

---

## 🔄 Data Synchronization

### Multi-Database Write

```python
# agents/data_storage_agent.py
class DataStorageAgent:
    async def store(self, entity: dict):
        await asyncio.gather(
            self.store_postgres(entity),
            self.store_neo4j(entity),
            self.store_mongodb(entity),
            self.cache_redis(entity)
        )
```

### Change Data Capture

```python
# Sync from PostgreSQL to Neo4j
def sync_camera_to_neo4j(camera: dict):
    query = """
    MERGE (c:Camera {id: $id})
    SET c.name = $name,
        c.lat = $lat,
        c.lng = $lng,
        c.status = $status
    """
    neo4j_driver.execute_query(query, camera)
```

---

## 🔗 Related Pages

- [[Docker-Services]] - Database containers
- [[Configuration]] - Database configuration
- [[Data-Flow]] - Data pipeline
