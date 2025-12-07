<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: guides/GUIDE_NEO4J_LOD_USAGE.md
Module: Neo4j and LOD Cloud Usage Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Neo4j and LOD Cloud usage guide.
============================================================================
-->

# 📘 HƯỚNG DẪN SỬ DỤNG DATA TỪ NEO4J VÀ LOD CLOUD

## 🎯 MỤC ĐÍCH
Guide này hướng dẫn cách query và sử dụng data từ:
- **Neo4j Graph Database**: Camera nodes, Platform nodes, Relationships
- **Apache Jena Fuseki (LOD Cloud)**: RDF triples, SPARQL queries

---

## 🔹 PHẦN 1: SỬ DỤNG NEO4J GRAPH DATABASE

### 1.1. Kết nối Neo4j

**A. Sử dụng Neo4j Browser (Web UI)**
```
URL: http://localhost:7474
Username: neo4j
Password: test12345
```

**B. Sử dụng Python neo4j Driver**
```python
from neo4j import GraphDatabase

# Kết nối
driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "test12345")
)

# Query function
def run_query(query, parameters=None):
    with driver.session() as session:
        result = session.run(query, parameters or {})
        return [record.data() for record in result]

# Đóng kết nối khi xong
driver.close()
```

**C. Sử dụng Cypher-Shell (CLI)**
```bash
docker exec test-neo4j cypher-shell -u neo4j -p test12345
```

---

### 1.2. Queries Cơ Bản

**Query 1: Đếm tổng số nodes**
```cypher
MATCH (n)
RETURN count(n) as totalNodes;
```

**Query 2: Xem tất cả node labels**
```cypher
CALL db.labels();
```

**Query 3: Lấy tất cả Camera nodes (giới hạn 10)**
```cypher
MATCH (c)
WHERE c.type CONTAINS 'Camera'
RETURN c.id, c.type, c
LIMIT 10;
```

**Query 4: Tìm Camera theo ID**
```cypher
MATCH (c)
WHERE c.id = 'urn:ngsi-ld:Camera:TTH%20406'
RETURN c;
```

**Query 5: Lấy Platform và ObservableProperty**
```cypher
MATCH (p)
WHERE p.type CONTAINS 'Platform'
RETURN p.id, p.type;

MATCH (o)
WHERE o.type CONTAINS 'ObservableProperty'
RETURN o.id, o.type;
```

---

### 1.3. Queries Nâng Cao

**Query 6: Tìm tất cả Cameras và Properties của chúng**
```cypher
MATCH (c)
WHERE c.type CONTAINS 'Camera'
RETURN c.id as cameraId,
       properties(c) as allProperties
LIMIT 5;
```

**Query 7: Tìm Cameras theo khu vực (nếu có location data)**
```cypher
MATCH (c)
WHERE c.type CONTAINS 'Camera'
  AND c.address IS NOT NULL
RETURN c.id, c.address
LIMIT 10;
```

**Query 8: Relationships (nếu có)**
```cypher
// Tìm tất cả relationships
MATCH (a)-[r]->(b)
RETURN type(r) as relationshipType,
       a.id as fromNode,
       b.id as toNode
LIMIT 10;

// Tìm Cameras hosted by Platform
MATCH (c)-[:IS_HOSTED_BY]->(p)
WHERE c.type CONTAINS 'Camera'
  AND p.type CONTAINS 'Platform'
RETURN c.id as camera, p.id as platform;

// Tìm Cameras observes ObservableProperty
MATCH (c)-[:OBSERVES]->(o)
WHERE c.type CONTAINS 'Camera'
  AND o.type CONTAINS 'ObservableProperty'
RETURN c.id as camera, o.id as observableProperty;
```

---

### 1.4. Python Examples

**Example 1: Lấy tất cả Cameras**
```python
from neo4j import GraphDatabase

driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "test12345")
)

def get_all_cameras():
    query = """
    MATCH (c)
    WHERE c.type CONTAINS 'Camera'
    RETURN c.id as id, properties(c) as props
    """
    
    with driver.session() as session:
        result = session.run(query)
        cameras = []
        for record in result:
            cameras.append({
                'id': record['id'],
                'properties': record['props']
            })
        return cameras

cameras = get_all_cameras()
print(f"Found {len(cameras)} cameras")
for cam in cameras[:3]:
    print(f"Camera: {cam['id']}")
    print(f"Properties: {cam['properties']}")
```

**Example 2: Tìm Camera theo pattern**
```python
def find_cameras_by_pattern(pattern):
    query = """
    MATCH (c)
    WHERE c.type CONTAINS 'Camera'
      AND c.id CONTAINS $pattern
    RETURN c.id, c
    """
    
    with driver.session() as session:
        result = session.run(query, pattern=pattern)
        return [dict(record['c']) for record in result]

# Tìm cameras có "TTH" trong ID
tth_cameras = find_cameras_by_pattern("TTH")
print(f"Found {len(tth_cameras)} TTH cameras")
```

**Example 3: Get Platform và all Cameras**
```python
def get_platform_with_cameras():
    query = """
    MATCH (p)
    WHERE p.type CONTAINS 'Platform'
    OPTIONAL MATCH (c)-[:IS_HOSTED_BY]->(p)
    RETURN p.id as platform,
           collect(c.id) as cameras
    """
    
    with driver.session() as session:
        result = session.run(query)
        return [record.data() for record in result]

platform_data = get_platform_with_cameras()
print(platform_data)
```

---

## 🔹 PHẦN 2: SỬ DỤNG LOD CLOUD (FUSEKI TRIPLESTORE)

### 2.1. Kết nối Fuseki

**A. Sử dụng Fuseki Web UI**
```
URL: http://localhost:3030
Dataset: lod-dataset
Username: admin
Password: test_admin
```

**B. Sử dụng Python SPARQLWrapper**
```python
from SPARQLWrapper import SPARQLWrapper, JSON

# Setup SPARQL endpoint
sparql = SPARQLWrapper("http://localhost:3030/lod-dataset/sparql")
sparql.setCredentials("admin", "test_admin")
sparql.setReturnFormat(JSON)

def run_sparql(query):
    sparql.setQuery(query)
    results = sparql.query().convert()
    return results['results']['bindings']
```

**C. Sử dụng cURL**
```bash
curl -X POST http://localhost:3030/lod-dataset/sparql \
  -u admin:test_admin \
  -H "Content-Type: application/sparql-query" \
  --data-binary "@query.rq"
```

---

### 2.2. SPARQL Queries Cơ Bản

**Query 1: Đếm tổng số triples**
```sparql
SELECT (COUNT(*) as ?count)
WHERE {
  GRAPH ?g {
    ?s ?p ?o
  }
}
```

**Query 2: Liệt kê tất cả named graphs**
```sparql
SELECT DISTINCT ?graph
WHERE {
  GRAPH ?graph { ?s ?p ?o }
}
ORDER BY ?graph
LIMIT 50
```

**Query 3: Lấy tất cả Camera entities**
```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>

SELECT DISTINCT ?camera ?type
WHERE {
  GRAPH ?g {
    ?camera a ?type .
    FILTER(CONTAINS(STR(?type), "Camera"))
  }
}
LIMIT 10
```

**Query 4: Lấy Camera với properties**
```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>

SELECT ?camera ?property ?value
WHERE {
  GRAPH ?g {
    ?camera a ?cameraType .
    FILTER(CONTAINS(STR(?cameraType), "Camera"))
    ?camera ?property ?value .
  }
}
LIMIT 50
```

---

### 2.3. SPARQL Queries Nâng Cao

**Query 5: Tìm Cameras với Location (GeoSPARQL)**
```sparql
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>

SELECT ?camera ?location ?lat ?lon
WHERE {
  GRAPH ?g {
    ?camera a ?type .
    FILTER(CONTAINS(STR(?type), "Camera"))
    
    OPTIONAL {
      ?camera ngsi-ld:location ?location .
      ?location geo:asWKT ?wkt .
    }
  }
}
LIMIT 10
```

**Query 6: Tìm Platform và Cameras hosted by Platform**
```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>

SELECT ?platform ?camera
WHERE {
  GRAPH ?g {
    ?platform a ?platformType .
    FILTER(CONTAINS(STR(?platformType), "Platform"))
    
    ?camera ngsi-ld:isHostedBy ?platform .
  }
}
```

**Query 7: Tìm ObservableProperty và Cameras observing it**
```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>

SELECT ?observableProperty ?camera
WHERE {
  GRAPH ?g {
    ?observableProperty a ?obsType .
    FILTER(CONTAINS(STR(?obsType), "ObservableProperty"))
    
    ?camera ngsi-ld:observes ?observableProperty .
  }
}
```

**Query 8: Full-text search Cameras theo address**
```sparql
PREFIX text: <http://jena.apache.org/text#>
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>

SELECT ?camera ?address
WHERE {
  GRAPH ?g {
    ?camera a ?type .
    FILTER(CONTAINS(STR(?type), "Camera"))
    
    ?camera ngsi-ld:address ?address .
    FILTER(CONTAINS(LCASE(STR(?address)), "nguyen"))
  }
}
LIMIT 10
```

---

### 2.4. Python Examples với SPARQL

**Example 1: Count triples**
```python
from SPARQLWrapper import SPARQLWrapper, JSON

sparql = SPARQLWrapper("http://localhost:3030/lod-dataset/sparql")
sparql.setCredentials("admin", "test_admin")
sparql.setReturnFormat(JSON)

query = """
SELECT (COUNT(*) as ?count)
WHERE {
  GRAPH ?g {
    ?s ?p ?o
  }
}
"""

sparql.setQuery(query)
results = sparql.query().convert()
count = results['results']['bindings'][0]['count']['value']
print(f"Total triples: {count}")
```

**Example 2: Get all Cameras**
```python
query = """
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>

SELECT DISTINCT ?camera
WHERE {
  GRAPH ?g {
    ?camera a ?type .
    FILTER(CONTAINS(STR(?type), "Camera"))
  }
}
"""

sparql.setQuery(query)
results = sparql.query().convert()

cameras = []
for result in results['results']['bindings']:
    cameras.append(result['camera']['value'])

print(f"Found {len(cameras)} cameras:")
for cam in cameras[:5]:
    print(f"  - {cam}")
```

**Example 3: Get Camera details**
```python
def get_camera_details(camera_uri):
    query = f"""
    SELECT ?property ?value
    WHERE {{
      GRAPH ?g {{
        <{camera_uri}> ?property ?value .
      }}
    }}
    """
    
    sparql.setQuery(query)
    results = sparql.query().convert()
    
    details = {}
    for result in results['results']['bindings']:
        prop = result['property']['value']
        val = result['value']['value']
        details[prop] = val
    
    return details

camera_id = "urn:ngsi-ld:Camera:TTH%20406"
details = get_camera_details(camera_id)
print(f"Camera {camera_id} details:")
for key, value in details.items():
    print(f"  {key}: {value}")
```

---

## 🔹 PHẦN 3: TÍCH HỢP NEO4J + FUSEKI

### 3.1. Combined Query Strategy

**Use Case 1: Get Camera from Neo4j, enrich with RDF data from Fuseki**
```python
from neo4j import GraphDatabase
from SPARQLWrapper import SPARQLWrapper, JSON

# Neo4j connection
neo4j_driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "test12345")
)

# Fuseki connection
sparql = SPARQLWrapper("http://localhost:3030/lod-dataset/sparql")
sparql.setCredentials("admin", "test_admin")
sparql.setReturnFormat(JSON)

def get_camera_combined(camera_id):
    # 1. Get from Neo4j (fast property access)
    neo4j_query = """
    MATCH (c)
    WHERE c.id = $camera_id
    RETURN c
    """
    
    with neo4j_driver.session() as session:
        result = session.run(neo4j_query, camera_id=camera_id)
        neo4j_data = result.single()['c'] if result.single() else None
    
    # 2. Get from Fuseki (semantic relationships)
    sparql_query = f"""
    PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>
    
    SELECT ?property ?value
    WHERE {{
      GRAPH ?g {{
        <{camera_id}> ?property ?value .
      }}
    }}
    """
    
    sparql.setQuery(sparql_query)
    fuseki_results = sparql.query().convert()
    
    fuseki_data = {}
    for result in fuseki_results['results']['bindings']:
        prop = result['property']['value']
        val = result['value']['value']
        fuseki_data[prop] = val
    
    return {
        'neo4j': dict(neo4j_data) if neo4j_data else {},
        'fuseki': fuseki_data
    }

# Example usage
camera_id = "urn:ngsi-ld:Camera:TTH%20406"
combined_data = get_camera_combined(camera_id)
print(f"Neo4j Data: {combined_data['neo4j']}")
print(f"Fuseki Data: {combined_data['fuseki']}")
```

---

### 3.2. Analytics Use Cases

**Use Case 2: Geospatial Analysis**
```python
def find_cameras_near_location(lat, lon, radius_km):
    # Use Fuseki for geospatial query
    query = f"""
    PREFIX geo: <http://www.opengis.net/ont/geosparql#>
    PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
    PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>
    
    SELECT ?camera ?distance
    WHERE {{
      GRAPH ?g {{
        ?camera a ?type .
        FILTER(CONTAINS(STR(?type), "Camera"))
        
        ?camera ngsi-ld:location ?location .
        ?location geo:asWKT ?cameraWKT .
        
        BIND(geof:distance(?cameraWKT, 
             "POINT({lon} {lat})"^^geo:wktLiteral, 
             <http://www.opengis.net/def/uom/OGC/1.0/kilometre>) 
             as ?distance)
        
        FILTER(?distance < {radius_km})
      }}
    }}
    ORDER BY ?distance
    """
    
    sparql.setQuery(query)
    results = sparql.query().convert()
    
    nearby_cameras = []
    for result in results['results']['bindings']:
        nearby_cameras.append({
            'camera': result['camera']['value'],
            'distance_km': float(result['distance']['value'])
        })
    
    return nearby_cameras

# Find cameras within 5km of coordinate
cameras = find_cameras_near_location(10.762622, 106.660172, 5.0)
print(f"Found {len(cameras)} cameras within 5km")
```

**Use Case 3: Graph Traversal + Semantic Query**
```python
def get_platform_ecosystem():
    # 1. Neo4j: Fast graph traversal
    neo4j_query = """
    MATCH (p)
    WHERE p.type CONTAINS 'Platform'
    OPTIONAL MATCH (c)-[:IS_HOSTED_BY]->(p)
    OPTIONAL MATCH (c)-[:OBSERVES]->(o)
    RETURN p.id as platform,
           collect(DISTINCT c.id) as cameras,
           collect(DISTINCT o.id) as observables
    """
    
    with neo4j_driver.session() as session:
        result = session.run(neo4j_query)
        ecosystem = [record.data() for record in result]
    
    # 2. Fuseki: Enrich with semantic metadata
    for item in ecosystem:
        platform_id = item['platform']
        
        sparql_query = f"""
        SELECT ?property ?value
        WHERE {{
          GRAPH ?g {{
            <{platform_id}> ?property ?value .
          }}
        }}
        """
        
        sparql.setQuery(sparql_query)
        metadata = sparql.query().convert()
        
        item['metadata'] = {}
        for result in metadata['results']['bindings']:
            prop = result['property']['value'].split('/')[-1]
            val = result['value']['value']
            item['metadata'][prop] = val
    
    return ecosystem

ecosystem = get_platform_ecosystem()
print(f"Platform ecosystem: {ecosystem}")
```

---

## 🔹 PHẦN 4: BEST PRACTICES

### 4.1. Khi nào dùng Neo4j?
- ✅ Graph traversal (tìm paths, relationships)
- ✅ Real-time queries (low latency)
- ✅ Pattern matching (tìm subgraphs)
- ✅ Recommendation engines
- ✅ Fraud detection

### 4.2. Khi nào dùng Fuseki?
- ✅ Semantic reasoning (OWL, RDFS)
- ✅ Linked Data federation
- ✅ SPARQL queries với vocabulary chuẩn
- ✅ Data integration từ multiple sources
- ✅ Compliance với W3C standards

### 4.3. Performance Tips

**Neo4j:**
```cypher
// Bad: Scan all nodes
MATCH (n) WHERE n.type = 'Camera' RETURN n;

// Good: Use index
CREATE INDEX camera_type FOR (n) ON (n.type);
MATCH (n:Camera) RETURN n;
```

**Fuseki:**
```sparql
# Bad: Unbounded query
SELECT * WHERE { ?s ?p ?o }

# Good: Use LIMIT and specific patterns
SELECT ?camera ?address
WHERE {
  GRAPH ?g {
    ?camera a <CameraType> .
    ?camera <hasAddress> ?address .
  }
}
LIMIT 100
```

---

## 🔹 PHẦN 5: TROUBLESHOOTING

### 5.1. Neo4j Connection Issues
```python
# Test connection
try:
    driver.verify_connectivity()
    print("✅ Neo4j connected")
except Exception as e:
    print(f"❌ Neo4j error: {e}")
```

### 5.2. Fuseki Connection Issues
```python
# Test SPARQL endpoint
import requests

response = requests.get(
    "http://localhost:3030/lod-dataset/sparql",
    params={'query': 'ASK { ?s ?p ?o }'},
    auth=('admin', 'test_admin')
)

if response.status_code == 200:
    print("✅ Fuseki connected")
else:
    print(f"❌ Fuseki error: {response.status_code}")
```

---

## 📚 REFERENCE DOCS

- Neo4j Cypher Manual: https://neo4j.com/docs/cypher-manual/
- SPARQL 1.1 Spec: https://www.w3.org/TR/sparql11-query/
- Neo4j Python Driver: https://neo4j.com/docs/python-manual/
- SPARQLWrapper: https://sparqlwrapper.readthedocs.io/

---

**Created by:** Neo4j Sync Agent
**Last Updated:** 2025-11-04
