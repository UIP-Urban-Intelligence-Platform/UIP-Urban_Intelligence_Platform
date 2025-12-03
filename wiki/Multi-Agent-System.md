# 🤖 Multi-Agent System

Builder Layer End employs a sophisticated multi-agent architecture with **41 specialized agents** (38 Python + 3 TypeScript) organized into 14 functional categories.

---

## 📊 Agent Overview

| Category | Python Agents | TypeScript Agents | Total |
|----------|---------------|-------------------|-------|
| Data Collection | 2 | 0 | 2 |
| Ingestion | 1 | 0 | 1 |
| Analytics | 4 | 0 | 4 |
| Transformation | 2 | 0 | 2 |
| Context Management | 4 | 0 | 4 |
| RDF & Linked Data | 5 | 0 | 5 |
| State Management | 4 | 0 | 4 |
| Monitoring | 3 | 0 | 3 |
| Notification | 5 | 0 | 5 |
| Graph Database | 2 | 0 | 2 |
| Cache | 2 | 0 | 2 |
| Integration | 3 | 0 | 3 |
| Kafka | 1 | 0 | 1 |
| AI Agents | 0 | 3 | 3 |
| **Total** | **38** | **3** | **41** |

---

## 📁 Python Agents (38)

### 1. Data Collection Agents (2)

| Agent | File | Description |
|-------|------|-------------|
| **Image Refresh Agent** | `data_collection/image_refresh_agent.py` | Fetches camera images from Ho Chi Minh City traffic cameras, updates image URLs and metadata |
| **External Data Collector Agent** | `data_collection/external_data_collector_agent.py` | Enriches camera data with weather (OpenWeatherMap) and air quality (AQI) data |

#### Image Refresh Agent
```python
# Input: data/cameras_raw.json
# Output: data/cameras_updated.json

Features:
- Fetches latest camera images
- Updates image URLs
- Adds timestamp metadata
- Handles connection errors
- Retries on failure
```

#### External Data Collector Agent
```python
# Input: data/cameras_updated.json
# Output: data/cameras_enriched.json

Features:
- Queries OpenWeatherMap API
- Queries Air Quality API
- Adds weather observations to cameras
- Adds AQI observations to cameras
- Geocoding with coordinates
```

---

### 2. Ingestion Agents (1)

| Agent | File | Description |
|-------|------|-------------|
| **Citizen Ingestion Agent** | `ingestion/citizen_ingestion_agent.py` | Processes citizen science reports (accidents, traffic conditions) from mobile app |

---

### 3. Analytics Agents (4)

| Agent | File | Description |
|-------|------|-------------|
| **CV Analysis Agent** | `analytics/cv_analysis_agent.py` | Computer vision analysis using YOLOX for vehicle detection and counting |
| **Congestion Detection Agent** | `analytics/congestion_detection_agent.py` | Detects traffic congestion based on vehicle density |
| **Accident Detection Agent** | `analytics/accident_detection_agent.py` | Uses DETR model to detect accidents in camera images |
| **Pattern Recognition Agent** | `analytics/pattern_recognition_agent.py` | Identifies traffic patterns and predicts future conditions |

#### CV Analysis Agent (YOLOX)
```python
# Input: data/cameras_enriched.json
# Output: data/observations.json

Features:
- YOLOX object detection
- Vehicle counting (car, motorcycle, truck, bus)
- Confidence thresholds
- Batch processing
- GPU/CPU support
```

#### Accident Detection Agent (DETR)
```python
# Input: data/observations.json
# Output: data/accidents.json

Features:
- DETR transformer model
- Traffic accident detection
- Severity classification
- Real-time alerts
- Historical tracking
```

---

### 4. Transformation Agents (2)

| Agent | File | Description |
|-------|------|-------------|
| **NGSI-LD Transformer Agent** | `transformation/ngsi_ld_transformer_agent.py` | Transforms raw data to NGSI-LD entities (Camera, WeatherObserved, AirQualityObserved) |
| **SOSA/SSN Mapper Agent** | `transformation/sosa_ssn_mapper_agent.py` | Adds W3C SOSA/SSN semantic annotations (Sensor, Observation types) |

#### NGSI-LD Transformer
```python
# Input: data/cameras_enriched.json
# Output: data/ngsi_ld_entities.json

Entity Types Created:
- Camera (40 entities)
- WeatherObserved (40 entities)
- AirQualityObserved (40 entities)
- Total: ~120 entities
```

#### SOSA/SSN Mapper
```python
# Input: data/ngsi_ld_entities.json
# Output: data/sosa_enhanced_entities.json

Annotations Added:
- sosa:Sensor type
- sosa:Observation type
- sosa:observedProperty
- sosa:hasResult
```

---

### 5. Context Management Agents (4)

| Agent | File | Description |
|-------|------|-------------|
| **Entity Publisher Agent** | `context_management/entity_publisher_agent.py` | Publishes NGSI-LD entities to Stellio Context Broker |
| **State Updater Agent** | `context_management/state_updater_agent.py` | Updates entity states (congested, accident) in Stellio |
| **Stellio State Query Agent** | `context_management/stellio_state_query_agent.py` | Queries Stellio for entity states |
| **Temporal Data Manager Agent** | `context_management/temporal_data_manager_agent.py` | Manages temporal/historical data in Stellio |

---

### 6. RDF & Linked Data Agents (5)

| Agent | File | Description |
|-------|------|-------------|
| **NGSI-LD to RDF Agent** | `rdf_linked_data/ngsi_ld_to_rdf_agent.py` | Converts NGSI-LD entities to RDF formats (Turtle, N-Triples, RDF/XML, JSON-LD) |
| **Triplestore Loader Agent** | `rdf_linked_data/triplestore_loader_agent.py` | Loads RDF triples into Apache Jena Fuseki |
| **LOD Linkset Enrichment Agent** | `rdf_linked_data/lod_linkset_enrichment_agent.py` | Adds owl:sameAs links to GeoNames, DBpedia, Wikidata |
| **Content Negotiation Agent** | `rdf_linked_data/content_negotiation_agent.py` | HTTP content negotiation for RDF formats |
| **Smart Data Models Validation Agent** | `rdf_linked_data/smart_data_models_validation_agent.py` | Validates entities against FIWARE Smart Data Models |

#### NGSI-LD to RDF Agent
```python
# Input: data/validated_entities.json
# Output: data/rdf/*.ttl, *.nt, *.rdf, *.jsonld

Formats Generated:
- Turtle (.ttl)
- N-Triples (.nt)
- RDF/XML (.rdf)
- JSON-LD (.jsonld)
```

#### LOD Linkset Enrichment Agent
```python
# Input: data/validated_entities.json
# Output: data/enriched_entities.json

LOD Cloud Links:
- GeoNames (geographic)
- DBpedia (encyclopedia)
- Wikidata (structured data)
- owl:sameAs relationships
```

---

### 7. State Management Agents (4)

| Agent | File | Description |
|-------|------|-------------|
| **State Manager Agent** | `state_management/state_manager_agent.py` | Central state management |
| **Accident State Manager Agent** | `state_management/accident_state_manager_agent.py` | Tracks accident states |
| **Congestion State Manager Agent** | `state_management/congestion_state_manager_agent.py` | Tracks congestion states |
| **Temporal State Tracker Agent** | `state_management/temporal_state_tracker_agent.py` | Historical state tracking |

---

### 8. Monitoring Agents (3)

| Agent | File | Description |
|-------|------|-------------|
| **Health Check Agent** | `monitoring/health_check_agent.py` | Service health monitoring |
| **Data Quality Validator Agent** | `monitoring/data_quality_validator_agent.py` | Data quality validation |
| **Performance Monitor Agent** | `monitoring/performance_monitor_agent.py` | System performance monitoring |

---

### 9. Notification Agents (5)

| Agent | File | Description |
|-------|------|-------------|
| **Alert Dispatcher Agent** | `notification/alert_dispatcher_agent.py` | Dispatches alerts to subscribers |
| **Incident Report Generator Agent** | `notification/incident_report_generator_agent.py` | Generates PDF incident reports |
| **Subscription Manager Agent** | `notification/subscription_manager_agent.py` | Manages notification subscriptions |
| **Email Notification Handler** | `notification/email_notification_handler.py` | Sends email notifications |
| **Webhook Notification Handler** | `notification/webhook_notification_handler.py` | Sends webhook notifications |

---

### 10. Graph Database Agents (2)

| Agent | File | Description |
|-------|------|-------------|
| **Neo4j Query Agent** | `graph_database/neo4j_query_agent.py` | Executes Cypher queries on Neo4j |
| **Neo4j Sync Agent** | `graph_database/neo4j_sync_agent.py` | Syncs NGSI-LD entities to Neo4j graph |

#### Neo4j Sync Agent
```python
# Process:
# 1. Connect to Stellio PostgreSQL
# 2. Extract entities
# 3. Create Neo4j nodes
# 4. Create relationships

Output:
- 42 nodes (40 Camera + 1 Platform + 1 ObservableProperty)
- 80 relationships (IS_HOSTED_BY, OBSERVES)
- Spatial indexes
```

---

### 11. Cache Agents (2)

| Agent | File | Description |
|-------|------|-------------|
| **Cache Manager Agent** | `cache/cache_manager_agent.py` | Manages Redis cache |
| **Cache Invalidator Agent** | `cache/cache_invalidator_agent.py` | Invalidates stale cache entries |

---

### 12. Integration Agents (3)

| Agent | File | Description |
|-------|------|-------------|
| **API Gateway Agent** | `integration/api_gateway_agent.py` | Kong API Gateway integration |
| **Neo4j Sync Agent** | `integration/neo4j_sync_agent.py` | Graph database sync |
| **Cache Manager Agent** | `integration/cache_manager_agent.py` | Distributed caching |

---

### 13. Kafka Agent (1)

| Agent | File | Description |
|-------|------|-------------|
| **Kafka Entity Publisher Agent** | `kafka_entity_publisher_agent.py` | Publishes entities to Apache Kafka |

---

## 🔷 TypeScript AI Agents (3)

Located in `apps/traffic-web-app/backend/src/agents/`:

### 1. Traffic Maestro Agent
```typescript
// File: TrafficMaestroAgent.ts

Purpose: Central traffic management AI
Features:
- Natural language traffic queries
- Real-time traffic analysis
- Route suggestions
- Congestion predictions
- Integration with all data sources
```

### 2. Graph Investigator Agent
```typescript
// File: GraphInvestigatorAgent.ts

Purpose: Neo4j graph analysis
Features:
- Graph pattern queries
- Relationship exploration
- Path finding
- Network analysis
- Anomaly detection
```

### 3. EcoTwin Agent
```typescript
// File: EcoTwinAgent.ts

Purpose: Sustainability and environmental
Features:
- Carbon footprint analysis
- Green route planning
- Air quality correlation
- Environmental impact assessment
- Sustainability recommendations
```

---

## 🔄 Agent Communication

### Workflow Phases

```
Phase 1: Data Collection
    └── image_refresh_agent → external_data_collector_agent

Phase 2: Transformation
    └── ngsi_ld_transformer_agent → sosa_ssn_mapper_agent

Phase 3: Validation
    └── smart_data_models_validation_agent

Phase 3.5: LOD Enrichment (Optional)
    └── lod_linkset_enrichment_agent

Phase 4: Publishing
    └── entity_publisher_agent ─┬─► ngsi_ld_to_rdf_agent
                                └─► Parallel execution

Phase 5: Analytics
    └── cv_analysis_agent → congestion_detection_agent
                         → accident_detection_agent
                         → pattern_recognition_agent

Phase 6-9: Sync & Update
    └── triplestore_loader_agent → neo4j_sync_agent
```

### Inter-Agent Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Data Exchange                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  cameras_raw.json                                           │
│       │                                                      │
│       ▼                                                      │
│  ┌────────────────────┐                                     │
│  │ image_refresh_agent │                                     │
│  └──────────┬─────────┘                                     │
│             │ cameras_updated.json                          │
│             ▼                                                │
│  ┌──────────────────────────┐                               │
│  │ external_data_collector  │                               │
│  └──────────┬───────────────┘                               │
│             │ cameras_enriched.json                         │
│             ▼                                                │
│  ┌─────────────────────────┐                                │
│  │ ngsi_ld_transformer     │                                │
│  └──────────┬──────────────┘                                │
│             │ ngsi_ld_entities.json                         │
│             ▼                                                │
│  ┌─────────────────────────┐                                │
│  │ sosa_ssn_mapper         │                                │
│  └──────────┬──────────────┘                                │
│             │ sosa_enhanced_entities.json                   │
│             ▼                                                │
│  ┌─────────────────────────────────┐                        │
│  │ smart_data_models_validation   │                         │
│  └──────────┬──────────────────────┘                        │
│             │ validated_entities.json                       │
│             │                                                │
│        ┌────┴────┐                                          │
│        ▼         ▼                                          │
│  ┌──────────┐ ┌──────────────────┐                          │
│  │ entity   │ │ ngsi_ld_to_rdf   │                          │
│  │ publisher│ │ agent            │                          │
│  └────┬─────┘ └────────┬─────────┘                          │
│       │                │                                     │
│       ▼                ▼                                     │
│   Stellio          RDF Files                                │
│   Context          (Turtle,                                 │
│   Broker           N-Triples)                               │
│                        │                                     │
│                        ▼                                     │
│               ┌──────────────────┐                          │
│               │ triplestore      │                          │
│               │ loader           │                          │
│               └────────┬─────────┘                          │
│                        │                                     │
│                        ▼                                     │
│                 Apache Jena                                 │
│                   Fuseki                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Pages

- [[System-Architecture]] - Overall system design
- [[Python-Agents]] - Detailed Python agent docs
- [[TypeScript-Agents]] - Detailed TypeScript agent docs
- [[Configuration]] - Agent configuration
