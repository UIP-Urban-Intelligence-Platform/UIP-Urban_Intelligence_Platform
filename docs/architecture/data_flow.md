# Data Flow Architecture - PRODUCTION READY

## Data Flow Overview

```
Camera → ImageRefreshAgent → AccidentDetectionAgent → NGSILDTransformerAgent
  ↓                                                              ↓
  Raw JSON (1MB)                                        NGSI-LD Entity
                                                                 ↓
                                          ┌────────────────────┴──────────────────┐
                                          ▼                    ▼                   ▼
                                    Stellio (120ms)      Neo4j (60ms)       Redis Cache
                                          ↓
                                    SOSAMapperAgent
                                          ↓
                                    Fuseki (80ms)
```

## Phase-by-Phase Flow

### Phase 1: Data Collection (60s, 100MB)
```python
# ImageRefreshAgent
cameras = load_cameras("data/cameras_raw.json")  # 100 cameras
# Output: {"id": "CAM001", "image_url": "...", "last_updated": "..."}
```

### Phase 2: Analytics (120s, 50KB)
```python
# AccidentDetectionAgent (YOLOv8, 2s/image)
detections = detect_accidents(images)
# Output: [{"camera_id": "CAM001", "type": "accident", "confidence": 0.92}]
```

### Phase 3: Transformation (1s, 50KB)
```python
# NGSILDTransformerAgent
ngsi_ld = transform(detection)
# Output: {"id": "urn:ngsi-ld:Accident:ACC001", "type": "TrafficAccident", ...}
```

### Phase 4: Publishing (1.2s)
```python
# EntityPublisherAgent → Stellio
POST /ngsi-ld/v1/entities  # 120ms/entity
# 10 entities × 120ms = 1.2s
```

### Phase 5: Graph Sync (0.6s)
```python
# Neo4jSyncAgent
CREATE (a:Accident)-[:DETECTED_BY]->(c:Camera)  # 60ms/op
# 10 ops × 60ms = 0.6s
```

### Phase 6: RDF Mapping (0.8s)
```python
# SOSAMapperAgent → Fuseki
INSERT DATA { <urn:...> a sosa:Observation ... }  # 80ms/insert
# 10 inserts × 80ms = 0.8s
```

### Phase 7: Notification (1-3s)
```python
# AlertDispatcherAgent
await dispatch_alert({"severity": "high", "channels": ["email", "webhook"]})
# Email: 1s, Webhook: 500ms
```

**Total Pipeline Duration**: ~185s for 100 cameras

## Data Volumes & Performance

| Phase | Input | Output | Duration | Throughput |
|-------|-------|--------|----------|------------|
| Collection | - | 100MB | 60s | 100 cam/min |
| Analytics | 100MB | 50KB | 120s | 50 img/min |
| Transform | 50KB | 50KB | 1s | 10 ent/s |
| Stellio | 50KB | - | 1.2s | 500 ent/min |
| Neo4j | 50KB | - | 0.6s | 1000 ops/min |
| RDF | 50KB | 10KB | 0.8s | 100 triples/s |
| Notify | 5KB | - | 1-3s | 100 alerts/hr |

## Error Handling

### Retry Strategy
```python
for attempt in range(3):
    try:
        response = requests.post(stellio_url, json=entity)
        break
    except RequestException:
        time.sleep(2 ** attempt)  # Exponential backoff
```

### Circuit Breaker
```python
if failure_count >= 5:
    circuit_state = "OPEN"  # Stop requests
```

## Optimization
1. **Parallel**: Process cameras in batches of 10
2. **Connection Pooling**: Reuse HTTP connections
3. **Caching**: Cache metadata for 5 minutes
4. **Batching**: Batch Neo4j updates (10/txn)
```
NGSI-LD Entity
    ↓
SOSA Mapper Agent
    ↓
RDF Triples (Turtle)
    ↓
Apache Jena Fuseki
```

### 3. Event Detection

**Accident Detection Flow:**
```
Observations
    ↓
Accident Detection Agent
    ↓
[Speed < 20km/h AND vehicleCount > 5]
    ↓
Accident Entity Created
    ↓
Notification Pipeline
```

**Congestion Detection Flow:**
```
Observations
    ↓
Congestion Detection Agent
    ↓
[avgSpeed < threshold]
    ↓
Congestion Level Calculated
    ↓
Alert Dispatcher
```

### 4. State Management

**State Lifecycle:**
```
Event Detected
    ↓
State Manager Agent
    ↓
State Stored (Redis)
    ↓
Temporal State Tracker
    ↓
Historical Analysis
```

**State Transitions (Accident):**
```
DETECTED → CONFIRMED → ACTIVE → RESOLVING → RESOLVED → ARCHIVED
```

### 5. Notification Pipeline

**Multi-Channel Delivery:**
```
Alert Created
    ↓
Alert Dispatcher
    ├→ Email Notification Handler → SMTP Server
    ├→ SMS Notification Handler → Twilio API
    └→ Webhook Handler → External Systems
```

### 6. Cache Management

**Cache Strategy:**
```
Request
    ↓
Cache Manager Agent
    ├─ Cache Hit → Return Cached Data
    └─ Cache Miss → Fetch from Source
                    ↓
                 Store in Cache (Redis)
                    ↓
                 Return Data
```

**Cache Invalidation:**
```
Entity Update Event
    ↓
Cache Invalidator Agent
    ↓
Invalidate Related Keys
    ↓
Propagate to Dependent Caches
```

### 7. Graph Synchronization

**Neo4j Sync Flow:**
```
NGSI-LD Entity (Stellio)
    ↓
Neo4j Sync Agent
    ↓
CREATE (camera:Camera {id: "001"})
CREATE (obs:Observation {value: 50})
CREATE (camera)-[:OBSERVES]->(obs)
    ↓
Neo4j Graph Database
```

## Data Formats

### Raw Observation
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "cameraId": "CAM001",
  "vehicleCount": 45,
  "avgSpeed": 35.5
}
```

### NGSI-LD Entity
```json
{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:Observation:001",
  "type": "Observation",
  "observedProperty": {
    "type": "Property",
    "value": "vehicleCount"
  },
  "hasResult": {
    "type": "Property",
    "value": 45
  }
}
```

### RDF (Turtle)
```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/> .

<urn:ngsi-ld:Observation:001> a sosa:Observation ;
    sosa:observedProperty <vehicleCount> ;
    sosa:hasResult 45 ;
    sosa:madeBySensor <urn:camera:CAM001> .
```

## Performance Considerations

- **Caching**: 5-minute TTL for observations
- **Batch Processing**: 100 entities per batch
- **Async I/O**: Non-blocking operations
- **Rate Limiting**: 100 emails/hour per user
