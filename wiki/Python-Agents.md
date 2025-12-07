<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Python-Agents.md
Module: Python Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Comprehensive documentation for all 38 Python agents in UIP.
============================================================================
-->

# 🐍 Python Agents

Comprehensive documentation for all 38 Python agents in UIP - Urban Intelligence Platform.

---

## 📊 Overview

UIP - Urban Intelligence Platform contains **38 Python agents** organized into **13 categories**:

| Category | Count | Description |
|----------|-------|-------------|
| Data Collection | 2 | External data fetching |
| Ingestion | 1 | Citizen reports processing |
| Analytics | 4 | Computer vision & traffic analysis |
| Transformation | 2 | Data format conversion |
| Context Management | 4 | NGSI-LD entity management |
| RDF & Linked Data | 5 | Semantic web processing |
| State Management | 4 | Application state handling |
| Monitoring | 3 | System health & performance |
| Notification | 5 | Alerts & notifications |
| Graph Database | 2 | Neo4j operations |
| Cache | 2 | Redis caching |
| Integration | 3 | External system integration |
| Kafka | 1 | Message streaming |

---

## 📁 Agent Directory Structure

```
src/agents/
├── data_collection/
│   ├── image_refresh_agent.py
│   └── external_data_collector_agent.py
├── ingestion/
│   └── citizen_ingestion_agent.py
├── analytics/
│   ├── cv_analysis_agent.py
│   ├── congestion_detection_agent.py
│   ├── accident_detection_agent.py
│   └── pattern_recognition_agent.py
├── transformation/
│   ├── ngsi_ld_transformer_agent.py
│   └── sosa_enhancer_agent.py
├── context_management/
│   ├── stellio_publisher_agent.py
│   ├── subscription_manager_agent.py
│   ├── entity_validator_agent.py
│   └── context_linker_agent.py
├── rdf/
│   ├── rdf_generator_agent.py
│   ├── sparql_query_agent.py
│   ├── fuseki_uploader_agent.py
│   ├── lod_linker_agent.py
│   └── ontology_mapper_agent.py
├── state/
│   ├── state_updater_agent.py
│   ├── history_tracker_agent.py
│   ├── snapshot_agent.py
│   └── recovery_agent.py
├── monitoring/
│   ├── health_check_agent.py
│   ├── performance_monitor_agent.py
│   └── metrics_collector_agent.py
├── notification/
│   ├── alert_dispatcher_agent.py
│   ├── email_notifier_agent.py
│   ├── webhook_agent.py
│   ├── sms_agent.py
│   └── push_notification_agent.py
├── graph/
│   ├── neo4j_sync_agent.py
│   └── graph_analyzer_agent.py
├── cache/
│   ├── redis_cache_agent.py
│   └── cache_invalidator_agent.py
├── integration/
│   ├── api_gateway_agent.py
│   ├── websocket_agent.py
│   └── external_api_agent.py
└── kafka/
    └── kafka_producer_agent.py
```

---

## 📥 Data Collection Agents (2)

### 1. Image Refresh Agent

**File:** `src/agents/data_collection/image_refresh_agent.py`

**Purpose:** Fetches latest camera images from Ho Chi Minh City traffic cameras.

```python
class ImageRefreshAgent:
    """
    Refreshes camera images by fetching latest snapshots.
    
    Input: data/cameras_raw.json
    Output: data/cameras_updated.json
    """
    
    def run(self) -> dict:
        # Fetch images for all cameras
        # Update timestamps
        # Handle connection errors
        pass
```

**Configuration:**
```yaml
# config/agents.yaml
image_refresh:
  input_file: data/cameras_raw.json
  output_file: data/cameras_updated.json
  timeout: 30
  max_retries: 3
  concurrent_requests: 10
```

### 2. External Data Collector Agent

**File:** `src/agents/data_collection/external_data_collector_agent.py`

**Purpose:** Enriches camera data with weather and air quality information.

```python
class ExternalDataCollectorAgent:
    """
    Collects external data (weather, AQI) for camera locations.
    
    Input: data/cameras_updated.json
    Output: data/cameras_enriched.json
    """
    
    async def collect_weather(self, lat: float, lng: float) -> dict:
        # Query OpenWeatherMap API
        pass
    
    async def collect_air_quality(self, lat: float, lng: float) -> dict:
        # Query AQI API
        pass
```

---

## 📥 Ingestion Agents (1)

### 3. Citizen Ingestion Agent

**File:** `src/agents/ingestion/citizen_ingestion_agent.py`

**Purpose:** Processes citizen science reports from mobile app.

```python
class CitizenIngestionAgent:
    """
    Ingests citizen reports (accidents, traffic conditions).
    
    Input: Stellio subscription events
    Output: Processed citizen reports
    """
    
    def process_report(self, report: dict) -> dict:
        # Validate report
        # Geocode location
        # Transform to NGSI-LD
        pass
```

---

## 🔬 Analytics Agents (4)

### 4. CV Analysis Agent

**File:** `src/agents/analytics/cv_analysis_agent.py`

**Purpose:** Computer vision analysis using YOLOX for vehicle detection.

```python
class CVAnalysisAgent:
    """
    Performs computer vision analysis on camera images.
    
    Input: data/cameras_enriched.json
    Output: data/observations.json
    
    Model: YOLOX-s (object detection)
    """
    
    def analyze_image(self, image_url: str) -> dict:
        # Download image
        # Run YOLOX inference
        # Count vehicles by type
        # Calculate density
        pass
```

**Vehicle Types Detected:**
- Cars
- Motorcycles
- Trucks
- Buses
- Bicycles
- Pedestrians

### 5. Congestion Detection Agent

**File:** `src/agents/analytics/congestion_detection_agent.py`

**Purpose:** Detects traffic congestion based on vehicle density.

```python
class CongestionDetectionAgent:
    """
    Analyzes traffic flow and detects congestion.
    
    Input: data/observations.json
    Output: data/congestion_state.json
    """
    
    def calculate_congestion_level(self, observation: dict) -> float:
        # 0.0 = free flow
        # 0.5 = moderate
        # 1.0 = severe congestion
        pass
```

### 6. Accident Detection Agent

**File:** `src/agents/analytics/accident_detection_agent.py`

**Purpose:** Uses DETR model to detect accidents in camera images.

```python
class AccidentDetectionAgent:
    """
    Detects traffic accidents using DETR model.
    
    Input: data/observations.json
    Output: data/accidents.json
    
    Model: hilmantm/detr-traffic-accident-detection
    """
    
    def detect_accident(self, image_url: str) -> dict:
        # Run DETR inference
        # Classify accident type
        # Calculate severity
        pass
```

### 7. Pattern Recognition Agent

**File:** `src/agents/analytics/pattern_recognition_agent.py`

**Purpose:** Identifies traffic patterns and predicts future conditions.

```python
class PatternRecognitionAgent:
    """
    Recognizes traffic patterns from historical data.
    
    Input: Historical observations
    Output: data/patterns.json
    """
    
    def recognize_patterns(self) -> list:
        # Time-based patterns
        # Day-of-week patterns
        # Seasonal patterns
        pass
```

---

## 🔄 Transformation Agents (2)

### 8. NGSI-LD Transformer Agent

**File:** `src/agents/transformation/ngsi_ld_transformer_agent.py`

**Purpose:** Transforms raw data to NGSI-LD format.

```python
class NGSILDTransformerAgent:
    """
    Transforms data to NGSI-LD format.
    
    Input: data/observations.json
    Output: data/ngsi_ld_entities.json
    """
    
    def transform_to_ngsi_ld(self, data: dict) -> dict:
        # Add @context
        # Create entity structure
        # Add properties and relationships
        pass
```

### 9. SOSA Enhancer Agent

**File:** `src/agents/transformation/sosa_enhancer_agent.py`

**Purpose:** Enhances entities with SOSA/SSN ontology annotations.

```python
class SOSAEnhancerAgent:
    """
    Adds SOSA/SSN ontology annotations.
    
    Input: data/ngsi_ld_entities.json
    Output: data/sosa_enhanced_entities.json
    """
    
    def enhance_with_sosa(self, entity: dict) -> dict:
        # Add sosa:Observation
        # Add sosa:Sensor references
        # Add sosa:FeatureOfInterest
        pass
```

---

## 🔗 Context Management Agents (4)

### 10. Stellio Publisher Agent

**File:** `src/agents/context_management/stellio_publisher_agent.py`

**Purpose:** Publishes NGSI-LD entities to Stellio Context Broker.

### 11. Subscription Manager Agent

**File:** `src/agents/context_management/subscription_manager_agent.py`

**Purpose:** Manages NGSI-LD subscriptions for real-time updates.

### 12. Entity Validator Agent

**File:** `src/agents/context_management/entity_validator_agent.py`

**Purpose:** Validates NGSI-LD entities against schemas.

### 13. Context Linker Agent

**File:** `src/agents/context_management/context_linker_agent.py`

**Purpose:** Links entities to external context sources.

---

## 🌐 RDF & Linked Data Agents (5)

### 14. RDF Generator Agent

**File:** `src/agents/rdf/rdf_generator_agent.py`

**Purpose:** Generates RDF triples from NGSI-LD entities.

### 15. SPARQL Query Agent

**File:** `src/agents/rdf/sparql_query_agent.py`

**Purpose:** Executes SPARQL queries against Fuseki.

### 16. Fuseki Uploader Agent

**File:** `src/agents/rdf/fuseki_uploader_agent.py`

**Purpose:** Uploads RDF data to Apache Fuseki.

### 17. LOD Linker Agent

**File:** `src/agents/rdf/lod_linker_agent.py`

**Purpose:** Creates owl:sameAs links to LOD Cloud resources.

### 18. Ontology Mapper Agent

**File:** `src/agents/rdf/ontology_mapper_agent.py`

**Purpose:** Maps data to external ontologies.

---

## 📊 State Management Agents (4)

### 19-22. State Agents

- **State Updater Agent** - Updates application state
- **History Tracker Agent** - Tracks state changes
- **Snapshot Agent** - Creates state snapshots
- **Recovery Agent** - Recovers from failures

---

## 🔍 Monitoring Agents (3)

### 23-25. Monitoring Agents

- **Health Check Agent** - Service health monitoring
- **Performance Monitor Agent** - Performance metrics
- **Metrics Collector Agent** - Prometheus metrics

---

## 🔔 Notification Agents (5)

### 26-30. Notification Agents

- **Alert Dispatcher Agent** - Routes alerts
- **Email Notifier Agent** - Email notifications
- **Webhook Agent** - Webhook callbacks
- **SMS Agent** - SMS notifications
- **Push Notification Agent** - Mobile push

---

## 🗄️ Graph Database Agents (2)

### 31-32. Graph Agents

- **Neo4j Sync Agent** - Syncs to Neo4j
- **Graph Analyzer Agent** - Graph analytics

---

## 💾 Cache Agents (2)

### 33-34. Cache Agents

- **Redis Cache Agent** - Caching operations
- **Cache Invalidator Agent** - Cache invalidation

---

## 🔌 Integration Agents (3)

### 35-37. Integration Agents

- **API Gateway Agent** - API routing
- **WebSocket Agent** - Real-time communication
- **External API Agent** - External API calls

---

## 📨 Kafka Agents (1)

### 38. Kafka Producer Agent

**File:** `src/agents/kafka/kafka_producer_agent.py`

**Purpose:** Produces messages to Kafka topics.

---

## 🔗 Related Pages

- [[Multi-Agent-System]] - System overview
- [[TypeScript-Agents]] - TypeScript agents
- [[Agent-Categories]] - Organized by function
- [[Workflow-Orchestration]] - Agent orchestration
