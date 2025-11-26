# System Architecture - PRODUCTION READY

## Overview

Multi-agent traffic monitoring system using NGSI-LD, Semantic Web, and microservices.

## High-Level Architecture

```
┌──────────────┐
│   Cameras    │ (Traffic Cameras)
└──────┬───────┘
       │ HTTP GET
       ▼
┌──────────────────────────────┐
│  Orchestrator (Workflow Mgmt)│
│  ├─ Data Collection Agents   │
│  ├─ Analytics Agents          │
│  ├─ Transformation Agents     │
│  └─ Notification Agents       │
└──────┬───────────────────────┘
       │
       ├────────────┬─────────────┬──────────┐
       ▼            ▼             ▼          ▼
┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐
│ Stellio │  │  Neo4j   │  │  Fuseki │  │ Redis  │
│(NGSI-LD)│  │ (Graph)  │  │  (RDF)  │  │(Cache) │
└─────────┘  └──────────┘  └─────────┘  └────────┘
```

## Component Layers

### 1. Agent Layer (8 Categories)
- **Data Collection**: ImageRefreshAgent (cameras), ExternalDataCollectorAgent
- **Analytics**: AccidentDetectionAgent (YOLOv8), CongestionDetectionAgent, PatternRecognitionAgent
- **Context**: EntityPublisherAgent, StateUpdaterAgent, StellioStateQueryAgent
- **Transformation**: NGSILDTransformerAgent, SOSAMapperAgent
- **RDF**: TriplestoreLoaderAgent, SmartDataModelsValidationAgent
- **Notification**: AlertDispatcherAgent, EmailNotificationHandler, WebhookNotificationHandler
- **Cache/State**: CacheManagerAgent (Redis db=1), StateManagerAgent (Redis db=0), TemporalStateTrackerAgent
- **Graph**: Neo4jSyncAgent, Neo4jQueryAgent

### 2. Storage Layer
- **Stellio**: NGSI-LD context broker (PostgreSQL + TimescaleDB)
- **Neo4j**: Graph relationships, spatial queries (port 7687)
- **Fuseki**: SPARQL endpoint (TDB2 triple store, port 3030)
- **Redis**: Caching (db=1), state (db=0), pub/sub

### 3. Integration Layer
- **APIs**: Stellio REST, Fuseki SPARQL, Neo4j Cypher
- **Protocols**: HTTP/REST, NGSI-LD, SPARQL

## Design Patterns

### Agent Pattern
```python
class BaseAgent:
    def __init__(self, config):
        self.enabled = config.get("enabled", False)
    def run(self) -> dict:
        if not self.enabled:
            return {"status": "disabled"}
```

### Connection Pooling
- Redis: ConnectionPool (max 20)
- Neo4j: Driver pool (max 50)
- Stellio: requests.Session() with retry

### Circuit Breaker
WebhookNotificationHandler stops after 5 failures.

## Scalability
- **Horizontal**: Multiple agent instances with load balancing
- **Vertical**: Increase max_workers for parallel phases

## Security
- **Auth**: Stellio (NGSILD-Tenant), Neo4j (user/pass)
- **Encryption**: TLS for all connections
- **Rate Limiting**: 100 emails/hour

## Performance
| Component | Throughput | Latency | Bottleneck |
|-----------|------------|---------|------------|
| ImageRefreshAgent | 100 cam/min | 600ms | Network I/O |
| AccidentDetectionAgent | 30 img/min | 2s | YOLOv8 |
| Stellio Publish | 500 ent/min | 120ms | PostgreSQL |
| Neo4j Query | 1000 q/min | 60ms | Index lookup |
| Redis Cache | 10000 ops/s | 1ms | Network |

## Troubleshooting
- **Stellio**: Check container, PostgreSQL connection
- **Neo4j**: verify_connectivity(), check pool size
- **Redis**: PING, check TTL

## High-Level Architecture

```
┌─────────────┐
│ Data Sources│ (Cameras, Citizen Reports, IoT Sensors)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│         Data Ingestion Layer                │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐   │
│  │ Kafka   │  │ REST API│  │ Webhooks │   │
│  └─────────┘  └─────────┘  └──────────┘   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│       Processing & Transformation           │
│  ┌──────────────┐  ┌───────────────────┐   │
│  │ Orchestrator │→ │ Agent Framework   │   │
│  └──────────────┘  └───────────────────┘   │
│   - Accident Detection                      │
│   - Congestion Analysis                     │
│   - NGSI-LD Transformation                  │
│   - RDF Generation                          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│          Storage Layer                      │
│  ┌─────────┐  ┌──────┐  ┌─────────┐       │
│  │ Stellio │  │Neo4j │  │ Fuseki  │       │
│  │NGSI-LD  │  │Graph │  │RDF Store│       │
│  └─────────┘  └──────┘  └─────────┘       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│       Notification & Analytics              │
│  ┌──────────┐  ┌────────┐  ┌──────────┐   │
│  │Email/SMS │  │Webhooks│  │Dashboards│   │
│  └──────────┘  └────────┘  └──────────┘   │
└─────────────────────────────────────────────┘
```

## Core Components

### 1. Data Ingestion
- **Kafka**: Real-time event streaming
- **REST API**: HTTP endpoints for data submission
- **Webhooks**: External system integration

### 2. Agent Framework
Modular agent-based architecture:
- **Detection Agents**: Accident, congestion, pattern detection
- **Transformation Agents**: NGSI-LD, SOSA/SSN, RDF mapping
- **State Management**: Centralized state tracking
- **Notification Agents**: Email, SMS, webhook delivery

### 3. Storage Systems
- **Stellio Context Broker**: NGSI-LD entity storage
- **Neo4j**: Graph database for relationships
- **Apache Jena Fuseki**: RDF triple store
- **Redis**: Caching layer
- **PostgreSQL**: Relational metadata

### 4. Semantic Web Stack
- **NGSI-LD**: Context information model
- **SOSA/SSN**: Sensor observations ontology
- **RDF**: Linked data representation
- **SPARQL**: RDF query language

## Design Principles

1. **Modularity**: Independent, loosely-coupled agents
2. **Scalability**: Horizontal scaling via containerization
3. **Fault Tolerance**: Graceful degradation, retry mechanisms
4. **Semantic Interoperability**: Standards-based data models
5. **Real-time Processing**: Event-driven architecture

## Deployment Architecture

```
┌──────────────────────────────────────┐
│       Kubernetes Cluster             │
│  ┌────────────┐  ┌────────────┐     │
│  │Orchestrator│  │   Agents   │     │
│  │   Pod      │  │   Pods     │     │
│  └────────────┘  └────────────┘     │
│  ┌────────────┐  ┌────────────┐     │
│  │  Stellio   │  │   Neo4j    │     │
│  │   StatefulSet  │ StatefulSet│    │
│  └────────────┘  └────────────┘     │
└──────────────────────────────────────┘
```

## Technology Stack

- **Language**: Python 3.11+
- **Framework**: asyncio, FastAPI
- **Message Broker**: Apache Kafka
- **Context Broker**: Stellio NGSI-LD
- **Graph DB**: Neo4j
- **RDF Store**: Apache Jena Fuseki
- **Cache**: Redis
- **Container**: Docker, Kubernetes
- **Monitoring**: Prometheus, Grafana
