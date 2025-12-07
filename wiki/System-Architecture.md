<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/System-Architecture.md
Module: System Architecture Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  High-level architecture of UIP - Urban Intelligence Platform.
============================================================================
-->
# 🏗️ System Architecture

This page describes the high-level architecture of UIP - Urban Intelligence Platform.

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    UIP - URBAN INTELLIGENCE PLATFORM                       │
│                    Multi-Agent LOD Pipeline Architecture                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         PRESENTATION LAYER                           │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │  │
│  │  │ React Frontend │  │ Docusaurus     │  │ API Documentation   │   │  │
│  │  │ (Vite + TS)    │  │ (Docs Site)    │  │ (Swagger/OpenAPI)   │   │  │
│  │  └───────┬────────┘  └────────────────┘  └─────────────────────┘   │  │
│  └──────────┼────────────────────────────────────────────────────────────┘  │
│             │                                                                │
│  ┌──────────▼────────────────────────────────────────────────────────────┐  │
│  │                          API LAYER                                    │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │  │
│  │  │ Express.js     │  │ FastAPI        │  │ WebSocket           │   │  │
│  │  │ Backend API    │  │ Citizen API    │  │ Real-time Events    │   │  │
│  │  │ (TypeScript)   │  │ (Python)       │  │ (Socket.IO)         │   │  │
│  │  └───────┬────────┘  └───────┬────────┘  └──────────┬──────────┘   │  │
│  └──────────┼───────────────────┼───────────────────────┼────────────────┘  │
│             │                   │                       │                    │
│  ┌──────────▼───────────────────▼───────────────────────▼────────────────┐  │
│  │                     MULTI-AGENT ORCHESTRATION                         │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    Python Orchestrator                          │ │  │
│  │  │  • Phase-based workflow execution                               │ │  │
│  │  │  • Agent lifecycle management                                   │ │  │
│  │  │  • Error handling and retry logic                               │ │  │
│  │  │  • Health monitoring                                            │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                   38 Python Agents                               │ │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │  │
│  │  │  │ Data     │ │ Analytics│ │ Transform│ │ Context          │   │ │  │
│  │  │  │ Collect  │ │ (CV/AI)  │ │ (NGSI-LD)│ │ Management       │   │ │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │ │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │  │
│  │  │  │ RDF &    │ │ State    │ │ Monitor  │ │ Notification     │   │ │  │
│  │  │  │ LOD      │ │ Mgmt     │ │ & Health │ │ & Alerts         │   │ │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                   3 TypeScript AI Agents                         │ │  │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐│ │  │
│  │  │  │TrafficMaestro│ │GraphInvestig │ │ EcoTwin Agent            ││ │  │
│  │  │  │ Agent        │ │ ator Agent   │ │ (Sustainability)         ││ │  │
│  │  │  └──────────────┘ └──────────────┘ └──────────────────────────┘│ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         DATA LAYER                                    │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │PostgreSQL│ │  Neo4j   │ │ MongoDB  │ │  Redis   │ │  Kafka   │  │  │
│  │  │TimescaleDB│ │ Graph DB │ │ Document │ │  Cache   │ │ Streaming│  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │                                                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────┐   │  │
│  │  │              SEMANTIC WEB INFRASTRUCTURE                      │   │  │
│  │  │  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │   │  │
│  │  │  │   Stellio    │    │ Apache Jena  │    │   LOD Cloud   │  │   │  │
│  │  │  │ NGSI-LD CB   │    │   Fuseki     │    │   Linksets    │  │   │  │
│  │  │  │              │    │ (Triplestore)│    │               │  │   │  │
│  │  │  └──────────────┘    └──────────────┘    └───────────────┘  │   │  │
│  │  └──────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     EXTERNAL INTEGRATIONS                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Traffic  │ │ Weather  │ │ Air      │ │ GeoNames │ │ DBpedia  │  │  │
│  │  │ Cameras  │ │   API    │ │ Quality  │ │   API    │ │ Wikidata │  │  │
│  │  │ HCM City │ │          │ │   API    │ │          │ │          │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW PIPELINE                                 │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐
     │ Raw Camera  │
     │ Data (JSON) │
     └──────┬──────┘
            │
            ▼
┌───────────────────────┐
│ Phase 1: Collection   │ → image_refresh_agent
│ • Fetch camera images │   external_data_collector_agent
│ • Enrich with weather │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Phase 2: Transform    │ → ngsi_ld_transformer_agent
│ • Convert to NGSI-LD  │   sosa_ssn_mapper_agent
│ • Add SOSA/SSN types  │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Phase 3: Validation   │ → smart_data_models_validation_agent
│ • Validate schemas    │
│ • Check constraints   │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Phase 3.5: LOD Enrich │ → lod_linkset_enrichment_agent
│ • Add owl:sameAs      │   (Optional)
│ • Link to DBpedia     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Phase 4: Publishing   │ → entity_publisher_agent
│ • Push to Stellio     │   ngsi_ld_to_rdf_agent
│ • Convert to RDF      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Phase 5: Analytics    │ → cv_analysis_agent
│ • Vehicle detection   │   congestion_detection_agent
│ • Accident detection  │   accident_detection_agent
│ • Pattern recognition │   pattern_recognition_agent
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Phase 6: RDF Loading  │ → triplestore_loader_agent
│ • Load to Fuseki      │
│ • Create named graphs │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Phase 7-9: Sync       │ → neo4j_sync_agent
│ • Sync to Neo4j       │   state_updater_agent
│ • Update states       │
└───────────────────────┘
```

---

## 🧩 Component Diagram

### Python Backend Components

```
src/
├── agents/                    # 38 Python Agents
│   ├── analytics/             # CV & AI Analysis (4 agents)
│   │   ├── cv_analysis_agent.py
│   │   ├── congestion_detection_agent.py
│   │   ├── accident_detection_agent.py
│   │   └── pattern_recognition_agent.py
│   │
│   ├── cache/                 # Caching (2 agents)
│   │   ├── cache_manager_agent.py
│   │   └── cache_invalidator_agent.py
│   │
│   ├── context_management/    # NGSI-LD Context (4 agents)
│   │   ├── entity_publisher_agent.py
│   │   ├── state_updater_agent.py
│   │   ├── stellio_state_query_agent.py
│   │   └── temporal_data_manager_agent.py
│   │
│   ├── data_collection/       # Data Sources (2 agents)
│   │   ├── image_refresh_agent.py
│   │   └── external_data_collector_agent.py
│   │
│   ├── graph_database/        # Neo4j (2 agents)
│   │   ├── neo4j_query_agent.py
│   │   └── neo4j_sync_agent.py
│   │
│   ├── ingestion/             # Citizen Science (1 agent)
│   │   └── citizen_ingestion_agent.py
│   │
│   ├── integration/           # External Systems (3 agents)
│   │   ├── api_gateway_agent.py
│   │   ├── neo4j_sync_agent.py
│   │   └── cache_manager_agent.py
│   │
│   ├── monitoring/            # Health & Quality (3 agents)
│   │   ├── health_check_agent.py
│   │   ├── data_quality_validator_agent.py
│   │   └── performance_monitor_agent.py
│   │
│   ├── notification/          # Alerts (5 agents)
│   │   ├── alert_dispatcher_agent.py
│   │   ├── incident_report_generator_agent.py
│   │   ├── subscription_manager_agent.py
│   │   ├── email_notification_handler.py
│   │   └── webhook_notification_handler.py
│   │
│   ├── rdf_linked_data/       # Semantic Web (5 agents)
│   │   ├── ngsi_ld_to_rdf_agent.py
│   │   ├── triplestore_loader_agent.py
│   │   ├── lod_linkset_enrichment_agent.py
│   │   ├── content_negotiation_agent.py
│   │   └── smart_data_models_validation_agent.py
│   │
│   ├── state_management/      # State Tracking (4 agents)
│   │   ├── state_manager_agent.py
│   │   ├── accident_state_manager_agent.py
│   │   ├── congestion_state_manager_agent.py
│   │   └── temporal_state_tracker_agent.py
│   │
│   ├── transformation/        # Data Transform (2 agents)
│   │   ├── ngsi_ld_transformer_agent.py
│   │   └── sosa_ssn_mapper_agent.py
│   │
│   └── kafka_entity_publisher_agent.py  # Kafka (1 agent)
│
├── core/                      # Core Utilities
│   ├── config_loader.py
│   ├── data_seeder.py
│   ├── logger.py
│   └── utils.py
│
├── cli/                       # CLI Tools
│   ├── cache/
│   ├── graph/
│   ├── monitoring/
│   ├── pipeline/
│   └── rdf/
│
└── utils/                     # Helpers
    └── mongodb_helper.py
```

### TypeScript Backend Components

```
apps/traffic-web-app/backend/src/
├── agents/                    # 3 AI Agents
│   ├── TrafficMaestroAgent.ts     # Traffic management
│   ├── GraphInvestigatorAgent.ts  # Graph analysis
│   └── EcoTwinAgent.ts            # Sustainability
│
├── routes/                    # 12 API Routes
│   ├── accidentRoutes.ts
│   ├── agentRoutes.ts
│   ├── airQualityRoutes.ts
│   ├── analyticsRoutes.ts
│   ├── cameraRoutes.ts
│   ├── correlationRoutes.ts
│   ├── geocoding.ts
│   ├── historicalRoutes.ts
│   ├── multiAgentRoutes.ts
│   ├── patternRoutes.ts
│   ├── routing.ts
│   └── weatherRoutes.ts
│
├── services/                  # Business Logic
├── middlewares/               # Express Middlewares
├── config/                    # Configuration
├── types/                     # TypeScript Types
├── utils/                     # Utilities
└── server.ts                  # Entry Point
```

### React Frontend Components

```
apps/traffic-web-app/frontend/src/
├── components/                # 30+ Components
│   ├── TrafficMap.tsx             # Main map component
│   ├── FilterPanel.tsx            # Filter controls
│   ├── AnalyticsDashboard.tsx     # Analytics view
│   ├── CitizenReportForm.tsx      # Citizen reports
│   ├── RoutePlanner.tsx           # Route planning
│   ├── agents/                    # Agent chat UI
│   ├── landing/                   # Landing page
│   └── ...
│
├── pages/                     # Page Components
├── services/                  # API Services
├── store/                     # Zustand State
├── hooks/                     # Custom Hooks
├── types/                     # TypeScript Types
├── App.tsx                    # Root Component
└── main.tsx                   # Entry Point
```

---

## 🔗 Integration Points

### External APIs

| Service | Purpose | Protocol |
|---------|---------|----------|
| Ho Chi Minh Traffic Cameras | Camera images | HTTP/REST |
| OpenWeatherMap | Weather data | HTTP/REST |
| AQI API | Air quality | HTTP/REST |
| GeoNames | Geographic data | HTTP/REST |
| DBpedia Lookup | Linked data | HTTP/REST |
| Wikidata Search | Linked data | HTTP/REST |

### Internal Communication

| From | To | Protocol |
|------|-----|----------|
| Frontend | Backend | HTTP/REST + WebSocket |
| Backend | Stellio | HTTP/REST (NGSI-LD) |
| Backend | Neo4j | Bolt |
| Backend | PostgreSQL | TCP |
| Backend | MongoDB | TCP |
| Backend | Redis | TCP |
| Backend | Kafka | TCP |
| Backend | Fuseki | HTTP/SPARQL |

---

## 🔗 Related Pages

- [[Multi-Agent-System]] - Detailed agent documentation
- [[Data-Flow]] - Complete data flow diagrams
- [[Technology-Stack]] - All technologies used
- [[Docker-Services]] - Infrastructure services
