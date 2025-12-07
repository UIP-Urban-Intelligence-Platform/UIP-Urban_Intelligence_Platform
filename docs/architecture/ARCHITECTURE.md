<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: docs/architecture/ARCHITECTURE.md
Module: System Architecture Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Comprehensive LOD pipeline system for real-time traffic monitoring.
============================================================================
-->

# UIP - Urban Intelligence Platform - Architecture Documentation

## Overview

UIP - Urban Intelligence Platform is a comprehensive **Linked Open Data (LOD)** pipeline system for real-time traffic monitoring in Ho Chi Minh City. The system processes traffic camera data, performs computer vision analysis, and publishes standardized NGSI-LD entities enriched with SOSA/SSN ontologies to semantic triple stores.

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Layer                        │
│  (Multi-phase workflow coordination & agent lifecycle)       │
└──────────────────┬──────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
┌─────────┐  ┌─────────┐  ┌──────────────┐
│  Data   │  │Analytics│  │ Integration  │
│Collection│  │ Layer  │  │    Layer     │
└─────────┘  └─────────┘  └──────────────┘
    │              │              │
    │              │              │
    ▼              ▼              ▼
┌──────────────────────────────────────────┐
│         Context Broker (Stellio)         │
│    (NGSI-LD temporal entity storage)     │
└──────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌────────┐ ┌────────┐ ┌────────┐
   │Neo4j   │ │Fuseki  │ │Kafka   │
   │Graph DB│ │Triple  │ │Message │
   │        │ │Store   │ │Queue   │
   └────────┘ └────────┘ └────────┘
```

## Agent Architecture

The system follows a **multi-agent** design pattern with 20+ specialized agents organized into 8 functional groups:

### 1. Data Collection Agents (`src/agents/data_collection/`)
- **image_refresh_agent**: Fetches traffic camera images from external APIs
- **external_data_agent**: Collects weather, air quality, and environmental data

### 2. Analytics Agents (`src/agents/analytics/`)
- **cv_analysis_agent**: YOLOX-based vehicle detection and counting
- **congestion_agent**: Traffic congestion level detection
- **accident_agent**: Accident detection from image analysis
- **pattern_recognition_agent**: Traffic pattern analysis

### 3. Transformation Agents (`src/agents/transformation/`)
- **ngsi_ld_mapper**: Converts raw data to NGSI-LD format
- **sosa_ssn_mapper**: Enriches entities with SOSA/SSN semantic annotations

### 4. RDF & Linked Data Agents (`src/agents/rdf_linked_data/`)
- **ngsi_ld_to_rdf_agent**: Converts NGSI-LD JSON-LD to RDF triples
- **triplestore_agent**: Publishes RDF to Apache Jena Fuseki
- **validation_agent**: Validates NGSI-LD entities against schemas
- **content_negotiation_agent**: Handles multiple RDF serializations (JSON-LD, Turtle, N-Triples)

### 5. Context Management Agents (`src/agents/context_management/`)
- **entity_publisher_agent**: Publishes entities to Stellio Context Broker
- **state_updater_agent**: Updates entity states based on observations
- **temporal_manager_agent**: Manages temporal aspects of entities
- **stellio_query_agent**: Queries historical data from Stellio

### 6. Integration Agents (`src/agents/integration/`)
- **api_gateway_agent**: RESTful API for external access
- **neo4j_sync_agent**: Synchronizes entities to Neo4j graph database
- **cache_manager_agent**: Redis caching for performance optimization

### 7. Monitoring Agents (`src/agents/monitoring/`)
- **health_check_agent**: System health monitoring
- **data_quality_agent**: Data quality validation
- **performance_monitor_agent**: Performance metrics collection

### 8. Notification Agents (`src/agents/notification/`)
- **alert_dispatcher_agent**: Sends alerts for critical events
- **subscription_agent**: Manages NGSI-LD subscriptions
- **incident_report_agent**: Generates incident reports (HTML/PDF)

## Data Flow

### Phase 1: Data Collection
```
External APIs → image_refresh_agent → Raw Camera Data
                                              ↓
Weather/AQ APIs → external_data_agent → Environmental Data
```

### Phase 2: Analysis & Transformation
```
Raw Camera Images → cv_analysis_agent → Vehicle Counts
                                              ↓
                         congestion_agent → Congestion Levels
                                              ↓
                         accident_agent → Accident Detection
                                              ↓
                         ngsi_ld_mapper → NGSI-LD Entities
                                              ↓
                         sosa_ssn_mapper → SOSA/SSN Enrichment
```

### Phase 3: Validation & Publishing
```
NGSI-LD Entities → validation_agent → Validated Entities
                                              ↓
                   entity_publisher_agent → Stellio Context Broker
                                              ↓
                   ngsi_ld_to_rdf_agent → RDF Triples
                                              ↓
                   triplestore_agent → Apache Jena Fuseki
```

### Phase 4: Integration & Synchronization
```
Stellio Entities → neo4j_sync_agent → Neo4j Graph Database
                                              ↓
                   cache_manager_agent → Redis Cache
                                              ↓
                   api_gateway_agent → External API Access
```

### Phase 5: Monitoring & Notifications
```
System Metrics → health_check_agent → Health Status
                                              ↓
Data Validation → data_quality_agent → Quality Reports
                                              ↓
Critical Events → alert_dispatcher_agent → Email/Webhook Alerts
                                              ↓
Incident Detection → incident_report_agent → PDF/HTML Reports
```

## Technology Stack

### Core Technologies
- **Python 3.9+**: Primary programming language
- **NGSI-LD**: ETSI standard for context information management
- **SOSA/SSN**: W3C ontologies for sensor observations
- **RDF/OWL**: Semantic web standards

### Key Libraries
- **YOLOX (Apache-2.0)**: Computer vision for vehicle detection
- **DETR (Apache-2.0)**: Accident detection via HuggingFace Transformers
- **rdflib**: RDF graph manipulation and serialization
- **aiohttp/httpx**: Asynchronous HTTP clients
- **PyYAML**: Configuration management
- **FastAPI**: REST API framework

### Data Storage
- **Stellio Context Broker**: NGSI-LD temporal storage
- **Apache Jena Fuseki**: SPARQL-enabled RDF triple store
- **Neo4j**: Graph database for entity relationships
- **Redis**: High-performance caching

### Message Queue
- **Apache Kafka**: Event streaming platform

### Monitoring
- **Prometheus**: Metrics collection
- **Sentry**: Error tracking
- **Grafana**: Metrics visualization

## Configuration Management

### Environment Variables
All configurations managed through `.env` file with 9 major sections:
- Python configuration
- Application settings
- Data directories
- Stellio Context Broker
- Neo4j Graph Database
- Kafka Message Queue
- Apache Jena Fuseki
- YOLOX settings
- External APIs (OpenWeatherMap, OpenAQ)
- Email SMTP
- Monitoring (Sentry, Prometheus)
- Performance tuning
- Security keys
- Feature flags

### YAML Configuration Files
Located in `config/` directory:
- `workflow.yaml`: Multi-phase agent orchestration
- `agents.yaml`: Individual agent configurations
- `data_sources.yaml`: External API endpoints
- `namespaces.yaml`: RDF namespace mappings
- `ngsi_ld_mappings.yaml`: Entity type mappings
- `sosa_mappings.yaml`: SOSA/SSN property mappings
- `validation.yaml`: Schema validation rules
- `subscriptions.yaml`: NGSI-LD subscription templates

## Deployment Architecture

### Docker Deployment
```
┌─────────────────────────────────────────┐
│    Docker Compose Stack                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  UIP Platform Container          │   │
│  │  - Orchestrator                  │   │
│  │  - All agents                    │   │
│  │  - Port: 8000 (API Gateway)      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Stellio Context Broker          │   │
│  │  - Port: 8080                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Neo4j Graph Database            │   │
│  │  - Port: 7687 (Bolt)             │   │
│  │  - Port: 7474 (Browser)          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Apache Jena Fuseki              │   │
│  │  - Port: 3030 (SPARQL)           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Apache Kafka                    │   │
│  │  - Port: 9092                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Redis Cache                     │   │
│  │  - Port: 6379                    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Security Considerations

### Authentication & Authorization
- API key-based authentication for external APIs
- Token-based authentication for Stellio Context Broker
- Credentials management through environment variables
- Secret detection using pre-commit hooks

### Data Privacy
- No personal data collected from traffic cameras
- GDPR-compliant data retention policies
- Encrypted connections for all external communications

### Code Security
- **Bandit**: Security vulnerability scanning
- **detect-secrets**: Prevent credential leaks
- Regular dependency updates
- Security patches monitoring

## Performance Optimization

### Caching Strategy
- Redis caching for frequently accessed entities
- TTL-based cache invalidation
- Cache warming for critical data

### Asynchronous Processing
- Async HTTP requests using aiohttp/httpx
- Parallel agent execution within phases
- Non-blocking I/O operations

### Batch Processing
- Configurable batch sizes for image processing
- Bulk entity publishing to reduce API calls
- Batch RDF triple insertion

### Resource Management
- Configurable worker threads
- Request timeout limits
- Retry mechanisms with exponential backoff
- Connection pooling for databases

## Monitoring & Observability

### Metrics Collection
- **Prometheus metrics**: Request counts, latencies, error rates
- **Custom metrics**: Processing times, entity counts, validation failures
- **System metrics**: CPU, memory, disk usage

### Error Tracking
- **Sentry integration**: Real-time error reporting
- Structured logging with contextual information
- Error aggregation and alerting

### Health Checks
- Endpoint health monitoring
- Database connection validation
- External API availability checks
- Service dependency verification

## Testing Strategy

### Unit Tests
- **pytest**: Test framework
- **pytest-cov**: Coverage reporting (target: 80%+)
- **pytest-asyncio**: Async test support
- **pytest-mock**: Mocking external dependencies

### Integration Tests
- End-to-end workflow validation
- Database integration tests
- API endpoint testing
- Kafka message flow tests

### Code Quality
- **Black**: Code formatting (line-length: 100)
- **Ruff**: Linting + import sorting (replaces flake8, isort, pylint - 10-100x faster)
- **mypy**: Type checking

### CI/CD Pipeline
- Automated testing on push/PR (Python 3.9, 3.10, 3.11)
- Code quality checks (black, ruff, mypy, bandit)
- Coverage reporting to Codecov
- Docker image building and publishing
- Automated deployment to staging/production

## Scalability Considerations

### Horizontal Scaling
- Stateless agent design for multiple instances
- Load balancing across agent replicas
- Kafka partitioning for parallel processing

### Vertical Scaling
- Configurable resource limits
- Optimized memory usage
- Efficient data structures

### Data Partitioning
- Time-based data partitioning in Stellio
- Sharding strategies for Neo4j
- Kafka topic partitioning by camera location

## Future Enhancements

### Planned Features
- Real-time streaming analytics
- Machine learning model improvements
- Advanced traffic prediction
- Mobile application integration
- Public API with rate limiting

### Research Directions
- Federated learning for privacy-preserving analytics
- Edge computing for camera-side processing
- Knowledge graph reasoning
- Semantic query optimization

## References

- **NGSI-LD Specification**: [ETSI GS CIM 009](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.06.01_60/gs_CIM009v010601p.pdf)
- **SOSA/SSN Ontology**: [W3C Recommendation](https://www.w3.org/TR/vocab-ssn/)
- **Context Broker API**: [Stellio Documentation](https://stellio.readthedocs.io/)
- **YOLOX**: [Megvii GitHub](https://github.com/Megvii-BaseDetection/YOLOX)
- **DETR**: [HuggingFace Model](https://huggingface.co/hilmantm/detr-traffic-accident-detection)
- **Apache Jena Fuseki**: [Documentation](https://jena.apache.org/documentation/fuseki2/)
