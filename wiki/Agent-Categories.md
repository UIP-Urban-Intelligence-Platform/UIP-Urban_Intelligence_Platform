<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Agent-Categories.md
Module: Agent Categories Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Comprehensive guide to all agents organized by functional category.
============================================================================
-->

# 📂 Agent Categories

Comprehensive guide to all 41 agents organized by functional category.

---

## 📊 Overview

UIP - Urban Intelligence Platform organizes its **41 agents** into **14 functional categories**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AGENT CATEGORY HIERARCHY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    DATA PIPELINE (12 agents)                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Collection   │  │  Ingestion   │  │    Transformation        │  │   │
│  │  │ (2 agents)   │  │  (1 agent)   │  │    (2 agents)            │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     ANALYTICS (7 agents)                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ CV/ML        │  │  Pattern     │  │    AI Agents             │  │   │
│  │  │ (4 agents)   │  │  (Python)    │  │    (3 TypeScript)        │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   SEMANTIC WEB (9 agents)                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Context Mgmt │  │  RDF/LOD     │  │    Graph Database        │  │   │
│  │  │ (4 agents)   │  │  (5 agents)  │  │    (2 agents)            │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    OPERATIONS (13 agents)                           │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────┐ │   │
│  │  │ State Mgmt │ │ Monitoring │ │ Notify     │ │  Integration     │ │   │
│  │  │ (4 agents) │ │ (3 agents) │ │ (5 agents) │ │  (4 agents)      │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └──────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📥 Category 1: Data Collection (2 agents)

**Purpose:** Collect raw data from external sources.

| # | Agent | File | Description |
|---|-------|------|-------------|
| 1 | Image Refresh Agent | `data_collection/image_refresh_agent.py` | Fetches camera images |
| 2 | External Data Collector | `data_collection/external_data_collector_agent.py` | Weather & AQI data |

### Data Flow

```
External APIs → Collection Agents → Raw JSON Files
     ↓
[Camera API] → [Image Refresh] → cameras_updated.json
[Weather API] → [External Data] → cameras_enriched.json
[AQI API] ─────┘
```

---

## 📨 Category 2: Ingestion (1 agent)

**Purpose:** Process incoming data streams.

| # | Agent | File | Description |
|---|-------|------|-------------|
| 3 | Citizen Ingestion Agent | `ingestion/citizen_ingestion_agent.py` | Citizen reports |

---

## 🔬 Category 3: Analytics - Computer Vision (4 agents)

**Purpose:** AI/ML analysis of traffic data.

| # | Agent | File | Model |
|---|-------|------|-------|
| 4 | CV Analysis Agent | `analytics/cv_analysis_agent.py` | YOLOX |
| 5 | Congestion Detection Agent | `analytics/congestion_detection_agent.py` | Custom |
| 6 | Accident Detection Agent | `analytics/accident_detection_agent.py` | DETR |
| 7 | Pattern Recognition Agent | `analytics/pattern_recognition_agent.py` | ML |

### Models Used

| Agent | Model | Purpose |
|-------|-------|---------|
| CV Analysis | YOLOX-s | Vehicle detection |
| Accident Detection | DETR (HuggingFace) | Accident detection |
| Pattern Recognition | scikit-learn | Time-series patterns |

---

## 🔄 Category 4: Transformation (2 agents)

**Purpose:** Transform data formats.

| # | Agent | File | Output Format |
|---|-------|------|---------------|
| 8 | NGSI-LD Transformer | `transformation/ngsi_ld_transformer_agent.py` | NGSI-LD JSON-LD |
| 9 | SOSA Enhancer | `transformation/sosa_enhancer_agent.py` | SOSA/SSN RDF |

---

## 🔗 Category 5: Context Management (4 agents)

**Purpose:** Manage NGSI-LD entities in Stellio Context Broker.

| # | Agent | File | Function |
|---|-------|------|----------|
| 10 | Stellio Publisher | `context_management/stellio_publisher_agent.py` | Create/Update entities |
| 11 | Subscription Manager | `context_management/subscription_manager_agent.py` | Manage subscriptions |
| 12 | Entity Validator | `context_management/entity_validator_agent.py` | Schema validation |
| 13 | Context Linker | `context_management/context_linker_agent.py` | Link contexts |

---

## 🌐 Category 6: RDF & Linked Data (5 agents)

**Purpose:** Semantic web and LOD processing.

| # | Agent | File | Technology |
|---|-------|------|------------|
| 14 | RDF Generator | `rdf/rdf_generator_agent.py` | rdflib |
| 15 | SPARQL Query Agent | `rdf/sparql_query_agent.py` | SPARQLWrapper |
| 16 | Fuseki Uploader | `rdf/fuseki_uploader_agent.py` | Apache Jena |
| 17 | LOD Linker | `rdf/lod_linker_agent.py` | owl:sameAs |
| 18 | Ontology Mapper | `rdf/ontology_mapper_agent.py` | Schema.org |

### LOD Cloud Links

```turtle
# Example owl:sameAs links
ex:Camera:001 owl:sameAs dbpedia:Traffic_camera .
ex:District:1 owl:sameAs geonames:1566083 .
ex:City:HCM owl:sameAs wikidata:Q1854 .
```

---

## 📊 Category 7: State Management (4 agents)

**Purpose:** Application state and history.

| # | Agent | File | Function |
|---|-------|------|----------|
| 19 | State Updater | `state/state_updater_agent.py` | Update state |
| 20 | History Tracker | `state/history_tracker_agent.py` | Track changes |
| 21 | Snapshot Agent | `state/snapshot_agent.py` | Create snapshots |
| 22 | Recovery Agent | `state/recovery_agent.py` | Disaster recovery |

---

## 🔍 Category 8: Monitoring (3 agents)

**Purpose:** System health and performance.

| # | Agent | File | Metrics |
|---|-------|------|---------|
| 23 | Health Check Agent | `monitoring/health_check_agent.py` | Service health |
| 24 | Performance Monitor | `monitoring/performance_monitor_agent.py` | Performance |
| 25 | Metrics Collector | `monitoring/metrics_collector_agent.py` | Prometheus |

---

## 🔔 Category 9: Notification (5 agents)

**Purpose:** Alerts and notifications.

| # | Agent | File | Channel |
|---|-------|------|---------|
| 26 | Alert Dispatcher | `notification/alert_dispatcher_agent.py` | Router |
| 27 | Email Notifier | `notification/email_notifier_agent.py` | Email |
| 28 | Webhook Agent | `notification/webhook_agent.py` | HTTP |
| 29 | SMS Agent | `notification/sms_agent.py` | SMS |
| 30 | Push Notification | `notification/push_notification_agent.py` | Mobile |

---

## 🗄️ Category 10: Graph Database (2 agents)

**Purpose:** Neo4j graph operations.

| # | Agent | File | Operation |
|---|-------|------|-----------|
| 31 | Neo4j Sync Agent | `graph/neo4j_sync_agent.py` | Sync entities |
| 32 | Graph Analyzer | `graph/graph_analyzer_agent.py` | Graph analytics |

---

## 💾 Category 11: Cache (2 agents)

**Purpose:** Redis caching.

| # | Agent | File | Function |
|---|-------|------|----------|
| 33 | Redis Cache Agent | `cache/redis_cache_agent.py` | Cache ops |
| 34 | Cache Invalidator | `cache/cache_invalidator_agent.py` | Invalidation |

---

## 🔌 Category 12: Integration (3 agents)

**Purpose:** External system integration.

| # | Agent | File | Protocol |
|---|-------|------|----------|
| 35 | API Gateway Agent | `integration/api_gateway_agent.py` | REST |
| 36 | WebSocket Agent | `integration/websocket_agent.py` | WebSocket |
| 37 | External API Agent | `integration/external_api_agent.py` | HTTP |

---

## 📨 Category 13: Kafka (1 agent)

**Purpose:** Message streaming.

| # | Agent | File | Function |
|---|-------|------|----------|
| 38 | Kafka Producer | `kafka/kafka_producer_agent.py` | Produce messages |

---

## 🤖 Category 14: AI Agents (3 TypeScript agents)

**Purpose:** LLM-powered intelligent agents.

| # | Agent | File | Model |
|---|-------|------|-------|
| 39 | TrafficMaestro | `TrafficMaestroAgent.ts` | GPT-4 |
| 40 | GraphInvestigator | `GraphInvestigatorAgent.ts` | GPT-4 |
| 41 | EcoTwin | `EcoTwinAgent.ts` | GPT-4 |

---

## 📈 Agent Statistics

| Metric | Value |
|--------|-------|
| **Total Agents** | 41 |
| **Python Agents** | 38 |
| **TypeScript Agents** | 3 |
| **Categories** | 14 |
| **CV/ML Agents** | 4 |
| **AI/LLM Agents** | 3 |

---

## 🔗 Related Pages

- [[Python-Agents]] - Python agent details
- [[TypeScript-Agents]] - TypeScript AI agents
- [[Multi-Agent-System]] - System architecture
- [[Workflow-Orchestration]] - Agent orchestration
