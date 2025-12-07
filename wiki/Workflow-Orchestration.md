<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Workflow-Orchestration.md
Module: Workflow Orchestration Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Complete guide to the 9-phase workflow system in UIP.
============================================================================
-->
# 🔄 Workflow Orchestration

Complete guide to the 9-phase workflow system in UIP - Urban Intelligence Platform.

---

## 📊 Overview

UIP - Urban Intelligence Platform uses a sophisticated 9-phase workflow to process traffic data from raw ingestion to LOD publication. The workflow is orchestrated by `orchestrator.py` and configured via `config/workflow.yaml`.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   UIP - Urban Intelligence Platform Workflow                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Phase 1      Phase 2       Phase 3        Phase 4        Phase 5          │
│ ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────────┐  │
│ │Ingestion│→ │Processing│→ │ Semantic  │→ │Integration│→ │Context Broker │  │
│ │         │  │          │  │Enrichment │  │           │  │               │  │
│ └─────────┘  └──────────┘  └───────────┘  └──────────┘  └───────────────┘  │
│                                                                             │
│  Phase 6       Phase 7       Phase 8        Phase 9                        │
│ ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐                    │
│ │ Citizen  │→ │  Alerting │→ │Reporting │→ │   LOD    │                    │
│ │ Reports  │  │           │  │          │  │Publishing│                    │
│ └──────────┘  └───────────┘  └──────────┘  └──────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase Details

### Phase 1: Data Ingestion

**Purpose:** Collect raw data from various sources

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `camera_ingestion_agent` | Fetch camera images and metadata |
| `device_ingestion_agent` | Collect IoT device data |
| `weather_enrichment_agent` | Get weather data from OpenWeatherMap |
| `air_quality_enrichment_agent` | Fetch air quality metrics |
| `citizen_ingestion_agent` | Process citizen reports |

**Data Flow:**
```
External APIs → Ingestion Agents → data/*.json
Camera Feeds → Camera Agent → data/cameras_raw.json
Weather API → Weather Agent → data/weather_data.json
AQI API → AQ Agent → data/air_quality_data.json
```

**Configuration:**
```yaml
ingestion:
  parallel: true
  timeout: 300
  retry: 3
  agents:
    - camera_ingestion_agent
    - weather_enrichment_agent
    - air_quality_enrichment_agent
```

---

### Phase 2: Data Processing

**Purpose:** Analyze and extract insights from raw data

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `cv_analysis_agent` | Computer vision on camera feeds |
| `congestion_analysis_agent` | Detect traffic congestion |
| `accident_detection_agent` | Identify accidents |
| `pattern_recognition_agent` | Find traffic patterns |

**Data Flow:**
```
Camera Images → CV Agent → Vehicle counts, speeds
Camera Data → Congestion Agent → Congestion levels
Multi-source → Accident Agent → Accident alerts
Historical → Pattern Agent → Traffic patterns
```

**Output:**
- Vehicle detection results
- Congestion heat maps
- Accident reports
- Traffic patterns

---

### Phase 3: Semantic Enrichment

**Purpose:** Transform data to semantic web formats (RDF, NGSI-LD)

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `ngsi_ld_generator_agent` | Create NGSI-LD entities |
| `rdf_transformer_agent` | Convert to RDF triples |
| `sosa_semantic_agent` | Apply SOSA/SSN ontology |
| `lod_linkset_agent` | Link to external LOD sources |

**Data Flow:**
```
JSON Data → NGSI-LD Generator → NGSI-LD Entities
JSON Data → RDF Transformer → RDF Triples
Sensor Data → SOSA Agent → SOSA Observations
Entities → Linkset Agent → LOD Links (DBpedia, Wikidata)
```

**Example NGSI-LD Entity:**
```json
{
  "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
  "id": "urn:ngsi-ld:TrafficFlowObserved:camera-001",
  "type": "TrafficFlowObserved",
  "intensity": {
    "type": "Property",
    "value": 150,
    "observedAt": "2025-11-29T10:30:00Z"
  }
}
```

---

### Phase 4: Data Integration

**Purpose:** Integrate and synchronize data across stores

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `stellio_sync_agent` | Sync to Stellio Context Broker |
| `fuseki_sync_agent` | Sync to Apache Fuseki |
| `neo4j_sync_agent` | Sync to Neo4j graph database |
| `cache_manager_agent` | Manage Redis cache |
| `temporal_agent` | Handle time-series data |

**Data Flow:**
```
NGSI-LD Entities → Stellio Sync → Stellio Context Broker
RDF Triples → Fuseki Sync → Apache Fuseki
Graph Data → Neo4j Sync → Neo4j Database
All Data → Cache Manager → Redis Cache
Time-series → Temporal Agent → TimescaleDB
```

---

### Phase 5: Context Broker Integration

**Purpose:** Manage context information and subscriptions

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `subscription_agent` | Manage NGSI-LD subscriptions |
| `state_updater_agent` | Update entity states |
| `content_negotiation_agent` | Content type negotiation |

**Subscription Example:**
```json
{
  "type": "Subscription",
  "entities": [{"type": "TrafficFlowObserved"}],
  "watchedAttributes": ["congestionLevel"],
  "q": "congestionLevel>0.7",
  "notification": {
    "endpoint": {"uri": "http://alert-service/notify"}
  }
}
```

---

### Phase 6: Citizen Reports Processing

**Purpose:** Process and verify citizen-submitted reports

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `citizen_ingestion_agent` | Receive citizen reports |
| `cv_verification_agent` | Verify report images |
| `report_enrichment_agent` | Add context to reports |

**Report Flow:**
```
Mobile App → Citizen Agent → Raw Report
Report Image → CV Verification → Verified/Rejected
Verified Report → Enrichment → Enriched Report
Enriched Report → NGSI-LD Generator → Entity
```

---

### Phase 7: Alerting & Notification

**Purpose:** Generate and dispatch alerts

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `alert_dispatcher_agent` | Send alerts to subscribers |
| `incident_report_agent` | Generate incident reports |
| `escalation_agent` | Handle alert escalation |

**Alert Types:**
- 🔴 **Critical:** Severe accidents, road closures
- 🟠 **High:** Heavy congestion, moderate accidents
- 🟡 **Medium:** Building congestion, minor incidents
- 🟢 **Low:** Normal fluctuations

---

### Phase 8: Reporting

**Purpose:** Generate analytics and reports

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `report_generator_agent` | Create PDF/HTML reports |
| `analytics_agent` | Compute analytics |
| `performance_monitor_agent` | System performance metrics |
| `data_quality_agent` | Data quality assessment |

**Report Types:**
- Daily traffic summary
- Weekly trend analysis
- Incident reports
- System health reports
- Data quality reports

---

### Phase 9: LOD Publishing

**Purpose:** Publish Linked Open Data

**Agents Involved:**
| Agent | Function |
|-------|----------|
| `lod_publishing_agent` | Publish to LOD cloud |
| `dereferencing_agent` | Handle URI dereferencing |
| `void_description_agent` | Generate VoID descriptions |

**LOD Features:**
- Dereferenceable URIs
- Content negotiation
- VoID dataset descriptions
- SPARQL endpoint
- Data dumps (N-Triples, Turtle)

---

## 🎛️ Orchestrator

### Running the Orchestrator

```bash
# Run full workflow
python orchestrator.py

# Run specific phases
python orchestrator.py --phases 1,2,3

# Run with custom config
python orchestrator.py --config custom_workflow.yaml

# Dry run (no execution)
python orchestrator.py --dry-run
```

### Orchestrator API

```python
from orchestrator import WorkflowOrchestrator

# Initialize
orchestrator = WorkflowOrchestrator(config_path="config/workflow.yaml")

# Run all phases
await orchestrator.run()

# Run specific phases
await orchestrator.run_phases([1, 2, 3])

# Get status
status = orchestrator.get_status()

# Pause/Resume
orchestrator.pause()
orchestrator.resume()
```

---

## 📊 Workflow Monitoring

### Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `/workflow/status` | Current workflow status |
| `/workflow/phases` | Phase completion status |
| `/workflow/agents` | Agent health status |
| `/workflow/metrics` | Performance metrics |

### Grafana Dashboard

The workflow dashboard shows:
- Phase execution times
- Agent success/failure rates
- Data throughput
- Queue depths
- Error rates

---

## ⚙️ Configuration

### `workflow.yaml`

```yaml
workflow:
  name: "UIP - Urban Intelligence Platform"
  version: "2.0.0"
  
  settings:
    max_parallel_agents: 5
    default_timeout: 300
    retry_policy:
      max_attempts: 3
      backoff: exponential
      
  phases:
    - name: "ingestion"
      order: 1
      agents:
        - name: camera_ingestion_agent
          timeout: 120
          priority: high
        - name: weather_enrichment_agent
          timeout: 60
          priority: medium
      parallel: true
      
    - name: "processing"
      order: 2
      depends_on: ["ingestion"]
      agents:
        - cv_analysis_agent
        - congestion_analysis_agent
      parallel: true
      
    # ... more phases
```

---

## 🔄 Error Handling

### Retry Strategies

| Strategy | Description |
|----------|-------------|
| `linear` | Fixed delay between retries |
| `exponential` | Exponentially increasing delay |
| `fibonacci` | Fibonacci sequence delay |

### Failure Modes

| Mode | Behavior |
|------|----------|
| `fail_fast` | Stop workflow on first error |
| `continue` | Skip failed agents, continue |
| `retry` | Retry failed agents |
| `fallback` | Use fallback agents |

---

## 🔗 Related Pages

- [[Multi-Agent-System]] - Agent documentation
- [[Configuration]] - Configuration reference
- [[System-Architecture]] - Architecture overview
