<p align="center">
  <img src="assets/images/logo.png" alt="Builder Layer End Logo" width="200" height="200">
</p>

<h1 align="center">Builder Layer End</h1>

<p align="center">
  <strong>Multi-Agent Linked Open Data Pipeline for Smart Traffic Management</strong>
</p>

<p align="center">
  <a href="https://github.com/NguyenNhatquang522004/builder-layer-end/actions/workflows/test.yml">
    <img src="https://github.com/NguyenNhatquang522004/builder-layer-end/actions/workflows/test.yml/badge.svg" alt="Tests">
  </a>
  <a href="https://github.com/NguyenNhatquang522004/builder-layer-end/actions/workflows/lint.yml">
    <img src="https://github.com/NguyenNhatquang522004/builder-layer-end/actions/workflows/lint.yml/badge.svg" alt="Lint">
  </a>
  <a href="https://codecov.io/gh/NguyenNhatquang522004/builder-layer-end">
    <img src="https://codecov.io/gh/NguyenNhatquang522004/builder-layer-end/branch/main/graph/badge.svg" alt="codecov">
  </a>
  <a href="https://github.com/NguyenNhatquang522004/builder-layer-end/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT">
  </a>
</p>

<p align="center">
  <a href="https://www.python.org/downloads/">
    <img src="https://img.shields.io/badge/Python-3.9%2B-blue.svg" alt="Python 3.9+">
  </a>
  <a href="https://nodejs.org/">
    <img src="https://img.shields.io/badge/Node.js-18%2B-green.svg" alt="Node.js 18+">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg" alt="TypeScript 5.0+">
  </a>
  <a href="https://github.com/psf/black">
    <img src="https://img.shields.io/badge/code%20style-black-000000.svg" alt="Code style: black">
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-one-command-run">One Command</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ⚡ One Command Run

```powershell
# Windows PowerShell - Just run everything with ONE command!
.\justrun.ps1 dev
```

```bash
# Linux/macOS
./justrun.sh dev
```

**That's it!** This single command will:
1. ✅ Auto-detect prerequisites (Python, Node.js, Docker)
2. ✅ Auto-install all dependencies if needed
3. ✅ Copy environment files (`.env.example` → `.env`)
4. ✅ Create required directories (`logs/`, `data/`, etc.)
5. ✅ Start Docker infrastructure (12 services)
6. ✅ Wait for databases to be healthy
7. ✅ Launch Python Orchestrator + Citizen API (port 8001)
8. ✅ Start TypeScript Backend API (port 5000)
9. ✅ Start React Frontend (port 5173)

**First time setup?** The script handles everything automatically!

| Command | Description |
|---------|-------------|
| `.\justrun.ps1 dev` | 🚀 Start everything (auto-setup if needed) |
| `.\justrun.ps1 setup` | 📦 Install all dependencies only |
| `.\justrun.ps1 prod` | 🐳 Start with Docker (production) |
| `.\justrun.ps1 stop` | ⏹️ Stop all services |
| `.\justrun.ps1 status` | 📊 Check status of all services |
| `.\justrun.ps1 test` | 🧪 Run all tests |
| `.\justrun.ps1 clean` | 🧹 Clean and reset |

### Access Points (after `.\justrun.ps1 dev`)

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** (React) | http://localhost:5173 | - |
| **Backend** (Express) | http://localhost:5000 | - |
| **Citizen API** (FastAPI) | http://localhost:8001/docs | - |
| Stellio Context Broker | http://localhost:8080 | - |
| Neo4j Browser | http://localhost:7474 | `neo4j` / `test12345` |
| Apache Jena Fuseki | http://localhost:3030 | `admin` / `test_admin` |

---

## 📖 Overview

**Builder Layer End** is a production-ready, multi-agent system for processing real-time traffic data in Ho Chi Minh City and publishing it as **Linked Open Data (LOD)**. The system integrates computer vision (YOLOX + DETR), semantic web technologies (RDF, NGSI-LD, SOSA/SSN), and modern microservices architecture.

### Why Builder Layer End?

- 🚀 **Production-Ready**: Battle-tested with comprehensive error handling, retry logic, and graceful shutdown
- 🔧 **Config-Driven**: 100% YAML-configurable — no code changes needed for new domains
- 🌐 **Standards-Compliant**: Full support for ETSI NGSI-LD, W3C SOSA/SSN, and Smart Data Models
- 📊 **Full Stack**: Python backend + React/TypeScript frontend + Docusaurus documentation
- 🐳 **Cloud-Native**: Docker Compose orchestration with 12 integrated services

---

## ✨ Features

### 🤖 Multi-Agent System (38 Python Agents + 3 TypeScript Agents)

| Category | Count | Agents |
|----------|-------|--------|
| **Data Collection** | 2 | image_refresh, external_data_collector |
| **Ingestion** | 1 | citizen_ingestion |
| **Analytics** | 4 | cv_analysis, congestion_detection, accident_detection, pattern_recognition |
| **Transformation** | 2 | ngsi_ld_transformer, sosa_ssn_mapper |
| **Context Management** | 4 | entity_publisher, state_updater, temporal_data_manager, stellio_state_query |
| **RDF & Linked Data** | 5 | ngsi_ld_to_rdf, triplestore_loader, lod_linkset_enrichment, content_negotiation, smart_data_models_validation |
| **State Management** | 4 | state_manager, accident_state_manager, congestion_state_manager, temporal_state_tracker |
| **Monitoring** | 3 | health_check, data_quality_validator, performance_monitor |
| **Notification** | 5 | alert_dispatcher, incident_report_generator, subscription_manager, email_notification, webhook_notification |
| **Graph Database** | 2 | neo4j_query, neo4j_sync |
| **Cache** | 2 | cache_manager, cache_invalidator |
| **Integration** | 3 | api_gateway, cache_manager, neo4j_sync |
| **Kafka** | 1 | kafka_entity_publisher |
| **TypeScript AI** | 3 | TrafficMaestroAgent, GraphInvestigatorAgent, EcoTwinAgent |

### 🔬 Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Python 3.9+, FastAPI, AsyncIO, APScheduler, YOLOX, DETR |
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Zustand |
| **Databases** | PostgreSQL/TimescaleDB, Neo4j 5.12, MongoDB 7.0, Redis 7 |
| **Semantic Web** | Apache Jena Fuseki, Stellio Context Broker, RDF/SPARQL |
| **Messaging** | Apache Kafka (KRaft), WebSocket, Socket.IO |
| **DevOps** | Docker Compose (12 services), GitHub Actions, Prometheus, Grafana |
| **Documentation** | Docusaurus 3.0, OpenAPI/Swagger |

### 🌍 Semantic Web Standards

- **NGSI-LD**: ETSI CIM standard for context information management
- **SOSA/SSN**: W3C ontologies for sensor observations
- **Smart Data Models**: TM Forum/FIWARE standardized data models
- **LOD Cloud**: Integration with GeoNames, DBpedia, Wikidata

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.9 or higher
- **Node.js** 18 or higher
- **Docker** & Docker Compose
- **Git**

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/NguyenNhatquang522004/builder-layer-end.git
cd builder-layer-end

# Copy environment configuration
cp .env.example .env

# Start all services
docker-compose up -d

# Check services status
docker-compose ps
```

**Access Points:**

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend (React) | http://localhost:5173 | - |
| Backend (Express) | http://localhost:5000 | - |
| Citizen API (FastAPI) | http://localhost:8001 | - |
| API Docs (Swagger) | http://localhost:8001/docs | - |
| Stellio Context Broker | http://localhost:8080 | - |
| Neo4j Browser | http://localhost:7474 | neo4j / test12345 |
| Fuseki SPARQL | http://localhost:3030 | admin / test_admin |

### Option 2: Local Development

```bash
# Clone repository
git clone https://github.com/NguyenNhatquang522004/builder-layer-end.git
cd builder-layer-end

# Create Python virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements/base.txt
pip install -r requirements/dev.txt

# Copy environment configuration
cp .env.example .env

# Run the unified system
python main.py
```

### Option 3: Building From Source (GNU Make)

This project supports standard GNU Make targets for building and installing:

```bash
# Clone repository
git clone https://github.com/NguyenNhatquang522004/builder-layer-end.git
cd builder-layer-end

# View all available targets
make help

# Build the Python package
make            # or: make all

# Build and install the package
make install

# Run tests
make check      # or: make test

# Clean build artifacts
make clean

# Clean everything (including venv, node_modules)
make distclean

# Uninstall the package
make uninstall
```

**GNU Make Standard Targets:**

| Target | Description |
|--------|-------------|
| `make` / `make all` | Build the Python package (creates dist/) |
| `make install` | Build and install the package |
| `make uninstall` | Uninstall the package |
| `make check` | Run all tests |
| `make clean` | Remove build artifacts |
| `make distclean` | Remove all generated files |

**Project-Specific Targets:**

| Target | Description |
|--------|-------------|
| `make setup` | Install all dependencies (Python + Node.js) |
| `make dev` | Run all services in development mode |
| `make prod` | Run all services with Docker Compose |
| `make stop` | Stop all running services |

### Running Options

```bash
# Full system (API + Orchestrator every 60 minutes)
python main.py

# Custom orchestrator interval (30 minutes)
python main.py --orchestrator-interval 30

# Run orchestrator immediately on startup
python main.py --run-orchestrator-now

# API only (no orchestrator)
python main.py --no-orchestrator

# Orchestrator only (no API)
python main.py --no-api

# Run specific workflow phase
python orchestrator.py --phase transformation

# Dry run (validate without execution)
python orchestrator.py --dry-run
```

---

## 📁 Project Structure

```
builder-layer-end/
│
├── 📂 src/                              # Python source code
│   ├── agents/                          # Multi-agent system (38 agents in 12 categories)
│   │   ├── analytics/                   # CV analysis, congestion, accidents (4)
│   │   ├── cache/                       # Cache management (2)
│   │   ├── context_management/          # Entity publishing, state (4)
│   │   ├── data_collection/             # Image refresh, external data (2)
│   │   ├── graph_database/              # Neo4j query, sync (2)
│   │   ├── ingestion/                   # Citizen report ingestion (1)
│   │   ├── integration/                 # API gateway, Neo4j sync (3)
│   │   ├── monitoring/                  # Health checks, data quality (3)
│   │   ├── notification/                # Alerts, webhooks, email (5)
│   │   ├── rdf_linked_data/             # RDF conversion, triplestore (5)
│   │   ├── state_management/            # State tracking (4)
│   │   ├── transformation/              # NGSI-LD, SOSA/SSN mapping (2)
│   │   └── kafka_entity_publisher_agent.py  # Kafka streaming (1)
│   ├── core/                            # Core utilities
│   │   ├── config_loader.py             # Configuration management
│   │   ├── data_seeder.py               # Data seeding utilities
│   │   ├── logger.py                    # Logging configuration
│   │   └── utils.py                     # Common utilities
│   ├── cli/                             # Command-line interface tools
│   │   ├── cache/                       # Cache CLI commands
│   │   ├── graph/                       # Graph database CLI
│   │   ├── monitoring/                  # Monitoring CLI
│   │   ├── pipeline/                    # Pipeline management CLI
│   │   └── rdf/                         # RDF processing CLI
│   ├── utils/                           # Helper utilities
│   │   └── mongodb_helper.py            # MongoDB helper functions
│   └── orchestrator.py                  # Workflow orchestrator
│
├── 📂 apps/                             # Web applications
│   ├── shared/                          # Shared code between apps
│   │   ├── configs/                     # Shared configurations
│   │   └── types/                       # Shared TypeScript types
│   └── traffic-web-app/                 # Main traffic web application
│       ├── backend/                     # Express.js + TypeScript API
│       │                                # (3 AI agents, 12 routes, 7 services)
│       ├── frontend/                    # React + Vite + TailwindCSS
│       │                                # (2 pages, 30+ components)
│       └── docs/                        # Web app documentation
│
├── 📂 config/                           # YAML configuration files (31 files)
│   ├── workflow.yaml                    # Orchestrator workflow definition
│   ├── agents.yaml                      # Agent-specific configurations
│   ├── ngsi_ld_mappings.yaml            # NGSI-LD entity mappings
│   ├── sosa_mappings.yaml               # SOSA/SSN ontology mappings
│   ├── stellio.yaml                     # Stellio Context Broker config
│   ├── fuseki.yaml                      # Apache Jena Fuseki config
│   ├── neo4j_sync.yaml                  # Neo4j synchronization config
│   ├── mongodb_config.yaml              # MongoDB configuration
│   ├── kafka_config.yaml                # Apache Kafka config
│   └── ...                              # 22 more configuration files
│
├── 📂 tests/                            # Test suite
│   ├── unit/                            # Unit tests
│   ├── integration/                     # Integration tests
│   ├── ingestion/                       # Ingestion tests
│   └── conftest.py                      # Pytest fixtures & configuration
│
├── 📂 scripts/                          # Utility scripts
│   ├── database/                        # Database initialization scripts
│   ├── monitoring/                      # Monitoring setup scripts
│   ├── pipeline/                        # Pipeline utilities
│   ├── python/                          # Python utility scripts
│   ├── node/                            # Node.js utility scripts
│   ├── utilities/                       # General utilities
│   ├── deploy.sh                        # Deployment script
│   ├── rollback.sh                      # Rollback script
│   └── health_check.sh                  # Health check script
│
├── 📂 docs/                             # Documentation (Docusaurus 3.0)
│   ├── api/                             # API documentation
│   ├── architecture/                    # Architecture guides
│   ├── workflows/                       # Workflow documentation
│   ├── data-access/                     # Data access guides
│   ├── web-application/                 # Web app documentation
│   ├── python-orchestrator/             # Orchestrator documentation
│   ├── competition/                     # Competition materials
│   ├── src/                             # Docusaurus source
│   ├── docusaurus.config.ts             # Docusaurus configuration
│   ├── sidebars.ts                      # Documentation sidebar
│   └── package.json                     # Docs dependencies
│
├── 📂 .github/                          # GitHub configurations
│   ├── workflows/                       # CI/CD pipelines (9 workflows)
│   │   ├── test.yml                     # Unit & integration tests
│   │   ├── lint.yml                     # Code linting
│   │   ├── codeql.yml                   # Security analysis
│   │   ├── deploy.yml                   # Deployment pipeline
│   │   ├── release.yml                  # Release automation
│   │   ├── integration-tests.yml        # Integration testing
│   │   ├── dependency-review.yml        # Dependency review
│   │   ├── auto-label.yml               # Auto labeling
│   │   └── stale.yml                    # Stale issue management
│   ├── ISSUE_TEMPLATE/                  # Issue templates
│   ├── CODEOWNERS                       # Code ownership
│   ├── CONTRIBUTING.md                  # Contribution guidelines
│   ├── SECURITY.md                      # Security policy
│   ├── SUPPORT.md                       # Support information
│   ├── FUNDING.yml                      # Funding information
│   ├── dependabot.yml                   # Dependabot configuration
│   ├── labeler.yml                      # Label configuration
│   └── pull_request_template.md         # PR template
│
├── 📂 requirements/                     # Python dependencies
│   ├── base.txt                         # Base dependencies
│   ├── dev.txt                          # Development dependencies
│   ├── prod.txt                         # Production dependencies
│   ├── test.txt                         # Testing dependencies
│   └── citizen_science_deps.txt         # Citizen science features
│
├── 📂 docker/                           # Docker configurations
│   ├── docker-compose.dev.yml           # Development Docker Compose
│   ├── Dockerfile.test                  # Test container
│   ├── Dockerfile.test.optimized        # Optimized test container
│   └── reference/                       # Reference configurations
│
├── 📂 data/                             # Data files & cache
│   ├── cache/                           # Cached data
│   ├── rdf/                             # RDF exports
│   ├── rdf_accidents/                   # Accident RDF data
│   ├── rdf_observations/                # Observation RDF data
│   ├── rdf_patterns/                    # Pattern RDF data
│   ├── rdf_updates/                     # Update RDF data
│   ├── reports/                         # Generated reports
│   └── *.json                           # JSON data files
│
├── 📂 assets/                           # Static assets
│   ├── models/                          # AI/ML models (YOLOX, DETR)
│   └── images/                          # Image assets
│
├── 📂 examples/                         # Example files
│   └── NGSI_LD_STRUCTURE_EXAMPLES.py    # NGSI-LD structure examples
│
├── 📂 guides/                           # User guides
│   ├── QUICKSTART.md                    # Quick start guide
│   ├── DATA_ACCESS_GUIDE.md             # Data access guide
│   ├── SEED_DATA_GUIDE.md               # Seed data guide
│   ├── DOCKER_SCRIPTS_GUIDE.md          # Docker scripts guide
│   └── GUIDE_NEO4J_LOD_USAGE.md         # Neo4j LOD usage guide
│
├── 📂 templates/                        # HTML templates
│   ├── entity.html                      # Entity template
│   ├── incident_report.html             # Incident report template
│   └── incident_web.html                # Web incident template
│
├── 📂 logs/                             # Application logs
├── 📂 reports/                          # Generated reports
├── 📂 runs/                             # Execution runs data
├── 📂 test_data/                        # Test data files
├── 📂 test_output/                      # Test output files
│
├── 📄 main.py                           # Unified entry point
├── 📄 orchestrator.py                   # Orchestrator CLI
├── 📄 justrun.ps1                       # Windows one-command runner
├── 📄 docker-compose.yml                # Docker services (12 containers)
├── 📄 Dockerfile                        # Application container
├── 📄 pyproject.toml                    # Python project configuration (PEP 518)
├── 📄 setup.py                          # Python package setup
├── 📄 pytest.ini                        # Pytest configuration
├── 📄 MANIFEST.in                       # Package manifest
├── 📄 Makefile                          # Build automation
├── 📄 .env.example                      # Environment template
├── 📄 .gitignore                        # Git ignore rules
├── 📄 .gitattributes                    # Git attributes
├── 📄 .dockerignore                     # Docker ignore rules
├── 📄 .pre-commit-config.yaml           # Pre-commit hooks
├── 📄 LICENSE                           # MIT License
├── 📄 JUSTRUN.md                        # One-command documentation
├── 📄 EXECUTION_ORDER.md                # Execution order guide
└── 📄 README.md                         # Project documentation
```

---

## 🏗️ Architecture

### System Overview

> **38 Python Agents** | **3 TypeScript AI Agents** | **12 Docker Services** | **7 Backend Services** | **12 API Routes**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              BUILDER LAYER END                                       │
│                    Multi-Agent Linked Open Data Pipeline                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│   │   CLIENT    │────▶│   BACKEND   │────▶│ ORCHESTRATOR│────▶│   STORAGE   │      │
│   │   LAYER     │     │   LAYER     │     │   LAYER     │     │   LAYER     │      │
│   └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘      │
│                                                                                     │
│   React Frontend      Express.js API      38 Python Agents    6 Databases          │
│   Port: 3000          Port: 3001          FastAPI: 8001       Kafka: 9092          │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  🌐 CLIENT LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌────────────────────────────────────┐    ┌────────────────────────────────────┐      │
│  │     🖥️ React Frontend (Port 3000)   │    │     📱 External Clients             │      │
│  │     Vite + TailwindCSS + Zustand   │    │     Mobile & Third-Party Apps      │      │
│  │                                    │    │                                    │      │
│  │  Pages:                            │    │  Protocols:                        │      │
│  │  ├── Dashboard.tsx                 │    │  ├── REST API Consumers            │      │
│  │  └── LandingPage.tsx               │    │  ├── WebSocket Clients             │      │
│  │                                    │    │  └── SPARQL Clients                │      │
│  │  Components (30+):                 │    │                                    │      │
│  │  ├── TrafficMap                    │    │                                    │      │
│  │  ├── AnalyticsDashboard            │    │                                    │      │
│  │  ├── CitizenReportForm             │    │                                    │      │
│  │  ├── RoutePlanner                  │    │                                    │      │
│  │  ├── agents/ (3 components)        │    │                                    │      │
│  │  └── landing/ (8 components)       │    │                                    │      │
│  └─────────────────┬──────────────────┘    └─────────────────┬──────────────────┘      │
│                    │ HTTP/WebSocket                          │                         │
└────────────────────┼─────────────────────────────────────────┼─────────────────────────┘
                     │                                         │
                     ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          🔀 API GATEWAY LAYER (Port 3001)                                │
│                          Express.js + TypeScript Backend                                │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────┐  ┌─────────────────────────────────────┐      │
│  │     📡 Routes (12 endpoints)         │  │     ⚙️ Services (7 services)         │      │
│  │                                     │  │                                     │      │
│  │  /api/accidents    /api/agents      │  │  stellioService.ts                  │      │
│  │  /api/airQuality   /api/analytics   │  │  neo4jService.ts                    │      │
│  │  /api/cameras      /api/correlation │  │  fusekiService.ts                   │      │
│  │  /api/geocoding    /api/historical  │  │  postgresService.ts                 │      │
│  │  /api/multiAgent   /api/patterns    │  │  websocketService.ts                │      │
│  │  /api/routing      /api/weather     │  │  dataAggregator.ts                  │      │
│  │                                     │  │  genericNgsiService.ts              │      │
│  └─────────────────────────────────────┘  └─────────────────────────────────────┘      │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────┐      │
│  │                      🤖 TypeScript AI Agents (3 agents)                       │      │
│  │                                                                              │      │
│  │  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐       │      │
│  │  │ TrafficMaestroAgent│ │GraphInvestigator   │ │ EcoTwinAgent       │       │      │
│  │  │                    │ │Agent               │ │                    │       │      │
│  │  │ Real-time traffic  │ │ Graph analysis &   │ │ Environmental      │       │      │
│  │  │ orchestration      │ │ pattern discovery  │ │ impact modeling    │       │      │
│  │  └────────────────────┘ └────────────────────┘ └────────────────────┘       │      │
│  └──────────────────────────────────────────────────────────────────────────────┘      │
│                                         │                                              │
└─────────────────────────────────────────┼──────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          🐍 PYTHON ORCHESTRATOR LAYER                                    │
│                          main.py + orchestrator.py                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐       │
│  │                    📡 Citizen Ingestion API (Port 8001)                      │       │
│  │                    FastAPI + Uvicorn + YOLOX + DETR                        │       │
│  │                                                                             │       │
│  │  Endpoints:                           Features:                             │       │
│  │  POST /api/v1/citizen-reports         • Image upload with geolocation      │       │
│  │  GET  /api/v1/citizen-reports         • CV verification (YOLOX/DETR)       │       │
│  │  GET  /api/v1/citizen-reports/{id}    • Category classification            │       │
│  │  GET  /docs (OpenAPI/Swagger)         • Real-time validation               │       │
│  └─────────────────────────────────────────────────────────────────────────────┘       │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐       │
│  │                    ⏱️ Scheduled Orchestrator (APScheduler)                   │       │
│  │                    Interval: every 60 minutes (configurable)                │       │
│  │                                                                             │       │
│  │  Phase 1: Data Collection      ──▶  Gather from cameras, APIs, citizens    │       │
│  │  Phase 2: Analytics & CV       ──▶  YOLOX/DETR detection, pattern analysis  │       │
│  │  Phase 3: Transformation       ──▶  NGSI-LD mapping, SOSA/SSN enrichment   │       │
│  │  Phase 4: Context Management   ──▶  Stellio publishing, state updates      │       │
│  │  Phase 5: RDF & LOD Publishing ──▶  Triplestore, LOD Cloud linksets        │       │
│  └─────────────────────────────────────────────────────────────────────────────┘       │
│                                         │                                              │
└─────────────────────────────────────────┼──────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          🤖 MULTI-AGENT SYSTEM (38 Python Agents)                        │
│                          src/agents/ — 12 Categories                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐            │
│  │ 📥 DATA COLLECTION   │ │ 📤 INGESTION         │ │ 🔬 ANALYTICS          │            │
│  │ (2 agents)           │ │ (1 agent)            │ │ (4 agents)           │            │
│  │                      │ │                      │ │                      │            │
│  │ • image_refresh      │ │ • citizen_ingestion  │ │ • cv_analysis        │            │
│  │ • external_data      │ │                      │ │ • congestion_detect  │            │
│  │   _collector         │ │                      │ │ • accident_detect    │            │
│  │                      │ │                      │ │ • pattern_recognition│            │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘            │
│                                                                                         │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐            │
│  │ 🔄 TRANSFORMATION    │ │ 📤 CONTEXT MGMT      │ │ 🔗 RDF & LINKED DATA │            │
│  │ (2 agents)           │ │ (4 agents)           │ │ (5 agents)           │            │
│  │                      │ │                      │ │                      │            │
│  │ • ngsi_ld_           │ │ • entity_publisher   │ │ • ngsi_ld_to_rdf     │            │
│  │   transformer        │ │ • state_updater      │ │ • triplestore_loader │            │
│  │ • sosa_ssn_mapper    │ │ • temporal_data_mgr  │ │ • lod_linkset_enrich │            │
│  │                      │ │ • stellio_state_query│ │ • content_negotiation│            │
│  │                      │ │                      │ │ • smart_data_valid   │            │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘            │
│                                                                                         │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐            │
│  │ 💾 STATE MANAGEMENT  │ │ 📊 MONITORING        │ │ 🔔 NOTIFICATION      │            │
│  │ (4 agents)           │ │ (3 agents)           │ │ (5 agents)           │            │
│  │                      │ │                      │ │                      │            │
│  │ • state_manager      │ │ • health_check       │ │ • alert_dispatcher   │            │
│  │ • accident_state_mgr │ │ • data_quality_valid │ │ • incident_report_gen│            │
│  │ • congestion_state   │ │ • performance_monitor│ │ • subscription_mgr   │            │
│  │ • temporal_tracker   │ │                      │ │ • email_notification │            │
│  │                      │ │                      │ │ • webhook_notification│           │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘            │
│                                                                                         │
│  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐            │
│  │ 🗄️ GRAPH DATABASE    │ │ 💨 CACHE             │ │ 🔌 INTEGRATION       │            │
│  │ (2 agents)           │ │ (2 agents)           │ │ (3 agents)           │            │
│  │                      │ │                      │ │                      │            │
│  │ • neo4j_query        │ │ • cache_manager      │ │ • api_gateway        │            │
│  │ • neo4j_sync         │ │ • cache_invalidator  │ │ • cache_manager      │            │
│  │                      │ │                      │ │ • neo4j_sync         │            │
│  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘            │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────┐       │
│  │ 📨 KAFKA PUBLISHER (1 agent) — kafka_entity_publisher_agent.py              │       │
│  │ Real-time entity streaming to Apache Kafka topics                           │       │
│  └─────────────────────────────────────────────────────────────────────────────┘       │
│                                         │                                              │
└─────────────────────────────────────────┼──────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────┼─────────────────────────────────────────────┐
│                                           ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        📨 MESSAGE QUEUE LAYER                                     │  │
│  ├────────────────────────────────────┬─────────────────────────────────────────────┤  │
│  │                                    │                                              │  │
│  │   ┌────────────────────────────────┴────────────────────────────────┐            │  │
│  │   │                    Apache Kafka (Port 9092)                      │            │  │
│  │   │                    KRaft Mode (No Zookeeper)                     │            │  │
│  │   │                                                                  │            │  │
│  │   │   Topics:                                                        │            │  │
│  │   │   • cim.entity.TrafficObservation                               │            │  │
│  │   │   • cim.entity.TrafficCamera                                    │            │  │
│  │   │   • cim.entity.AccidentEvent                                    │            │  │
│  │   │   • cim.entity.CongestionLevel                                  │            │  │
│  │   │   • cim.entity.CitizenReport                                    │            │  │
│  │   └──────────────────────────────────────────────────────────────────┘            │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                           │                                             │
└───────────────────────────────────────────┼─────────────────────────────────────────────┘
                                            │
┌───────────────────────────────────────────┼─────────────────────────────────────────────┐
│                                           ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         🗄️ DATA STORAGE LAYER                                     │  │
│  ├──────────────────────────────────────────────────────────────────────────────────┤  │
│  │                                                                                   │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ 🌐 Stellio       │  │ 🔷 Neo4j         │  │ 🔺 Fuseki        │                │  │
│  │  │ Context Broker   │  │ Graph Database   │  │ Triplestore      │                │  │
│  │  │ (Port 8080)      │  │ (Port 7474/7687) │  │ (Port 3030)      │                │  │
│  │  │                  │  │                  │  │                  │                │  │
│  │  │ • NGSI-LD API    │  │ • Cypher Queries │  │ • SPARQL Queries │                │  │
│  │  │ • Entity CRUD    │  │ • Graph Traversal│  │ • RDF Storage    │                │  │
│  │  │ • Subscriptions  │  │ • Path Finding   │  │ • Turtle/N3/JSON │                │  │
│  │  │ • Temporal API   │  │ • APOC Plugins   │  │ • Content Neg.   │                │  │
│  │  │                  │  │                  │  │                  │                │  │
│  │  │ Services:        │  │                  │  │ Datasets:        │                │  │
│  │  │ • api-gateway    │  │                  │  │ • /traffic       │                │  │
│  │  │ • search-service │  │                  │  │ • /observations  │                │  │
│  │  │ • subscription   │  │                  │  │                  │                │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘                │  │
│  │                                                                                   │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                │  │
│  │  │ 🐘 PostgreSQL    │  │ 🍃 MongoDB       │  │ 🔴 Redis         │                │  │
│  │  │ + TimescaleDB    │  │ Document Store   │  │ Cache Layer      │                │  │
│  │  │ (Port 5432)      │  │ (Port 27017)     │  │ (Port 6379)      │                │  │
│  │  │                  │  │                  │  │                  │                │  │
│  │  │ • Stellio Backend│  │ • NGSI-LD Docs   │  │ • Session Cache  │                │  │
│  │  │ • Time-series    │  │ • Citizen Reports│  │ • Query Cache    │                │  │
│  │  │ • PostGIS (Geo)  │  │ • Raw JSON Store │  │ • Rate Limiting  │                │  │
│  │  │ • Hypertables    │  │                  │  │ • Pub/Sub        │                │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘                │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              🌍 EXTERNAL INTEGRATIONS                                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ 📷 Traffic      │  │ 🌤️ Weather APIs  │  │ 🌐 LOD Cloud    │  │ 🤖 AI/ML        │   │
│  │ Camera APIs     │  │                 │  │ Linksets        │  │ Services        │   │
│  │                 │  │                 │  │                 │  │                 │   │
│  │ • HCMC Camera   │  │ • OpenWeather   │  │ • GeoNames      │  │ • YOLOX         │   │
│  │   Network       │  │ • OpenAQ        │  │ • DBpedia       │  │ • DETR (HF)     │   │
│  │ • RTSP Streams  │  │ • AirVisual     │  │ • Wikidata      │  │ • Google Gemini │   │
│  │                 │  │                 │  │ • Schema.org    │  │   (Optional)    │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              📊 DATA FLOW PIPELINE                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Phase 1: DATA COLLECTION
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ 📷 Traffic  │    │ 🌤️ Weather  │    │ 💨 Air      │    │ 👤 Citizen  │
│ Cameras     │    │ APIs        │    │ Quality     │    │ Reports     │
│ (722 feeds) │    │             │    │             │    │ (Mobile)    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       └──────────────────┴──────────────────┴──────────────────┘
                                   │
                                   ▼
Phase 2: ANALYTICS & COMPUTER VISION
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 🚗 YOLOX    │  │ 🚦 Congestion│  │ 🚨 Accident │             │
│  │ Detection   │  │ Analysis    │  │ Detection   │             │
│  │ (DETR for   │  │             │  │ (DETR)      │             │
│  │ accidents)  │  │ • Speed     │  │ • Collision │             │
│  │ • Vehicles  │  │ • Density   │  │ • Severity  │             │
│  │ • Counting  │  │ • Patterns  │  │ • Location  │             │
│  │ • Types     │  │             │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         └────────────────┴────────────────┘                    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
Phase 3: SEMANTIC TRANSFORMATION
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 NGSI-LD Transformer                      │   │
│  │                                                          │   │
│  │   Raw Data → Smart Data Models → NGSI-LD Entities       │   │
│  │                                                          │   │
│  │   Entity Types:                                          │   │
│  │   • TrafficObservation    • WeatherObserved             │   │
│  │   • TrafficCamera         • AirQualityObserved          │   │
│  │   • AccidentEvent         • CitizenReport               │   │
│  │   • CongestionLevel       • TrafficPattern              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  SOSA/SSN Enrichment                     │   │
│  │                                                          │   │
│  │   NGSI-LD Entities → W3C SOSA/SSN Ontology Mapping      │   │
│  │                                                          │   │
│  │   • sosa:Observation      • ssn:Sensor                  │   │
│  │   • sosa:FeatureOfInterest• sosa:ObservableProperty     │   │
│  │   • sosa:Result           • sosa:Procedure              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
Phase 4: CONTEXT MANAGEMENT & PUBLISHING
┌─────────────────────────────────────────────────────────────────┐
│         ┌───────────────────┴───────────────────┐               │
│         ▼                                       ▼               │
│  ┌─────────────────┐                    ┌─────────────────┐    │
│  │ Stellio Context │                    │ MongoDB Storage │    │
│  │ Broker          │                    │                 │    │
│  │                 │                    │ • Raw entities  │    │
│  │ • Entity CRUD   │                    │ • Audit logs    │    │
│  │ • Subscriptions │                    │ • Citizen data  │    │
│  │ • Temporal API  │                    │                 │    │
│  └────────┬────────┘                    └─────────────────┘    │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │ Kafka Topics    │                                           │
│  │                 │                                           │
│  │ cim.entity.*   │ ◄─── Real-time event streaming            │
│  └─────────────────┘                                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
Phase 5: RDF & LINKED OPEN DATA
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   RDF Conversion                         │   │
│  │                                                          │   │
│  │   NGSI-LD → RDF Serializations:                         │   │
│  │   • Turtle (.ttl)    • N-Triples (.nt)                  │   │
│  │   • RDF/XML (.rdf)   • JSON-LD (.jsonld)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │ Fuseki      │     │ Neo4j       │     │ LOD Cloud   │      │
│  │ Triplestore │     │ Graph DB    │     │ Linksets    │      │
│  │             │     │             │     │             │      │
│  │ • SPARQL    │     │ • Cypher    │     │ • GeoNames  │      │
│  │ • RDF Store │     │ • Graph Viz │     │ • DBpedia   │      │
│  │ • Reasoning │     │ • Analytics │     │ • Wikidata  │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              🛠️ TECHNOLOGY STACK                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  FRONTEND                    BACKEND                      INFRASTRUCTURE               │
│  ─────────                   ────────                     ──────────────               │
│  ┌─────────────┐            ┌─────────────┐              ┌─────────────┐               │
│  │ React 18    │            │ Python 3.11 │              │ Docker      │               │
│  │ TypeScript  │            │ FastAPI     │              │ Compose     │               │
│  │ Vite        │            │ AsyncIO     │              │             │               │
│  │ TailwindCSS │            │ APScheduler │              │ 10+ Services│               │
│  │ Zustand     │            │             │              │             │               │
│  │ React-Leaflet│           │ Express.js  │              │             │               │
│  │ Recharts    │            │ TypeScript  │              │             │               │
│  └─────────────┘            └─────────────┘              └─────────────┘               │
│                                                                                         │
│  DATABASES                   SEMANTIC WEB                 AI/ML                        │
│  ─────────                   ────────────                 ─────                        │
│  ┌─────────────┐            ┌─────────────┐              ┌─────────────┐               │
│  │ PostgreSQL  │            │ Stellio     │              │ YOLOX       │               │
│  │ TimescaleDB │            │ NGSI-LD     │              │ (Apache-2.0)│               │
│  │ Neo4j 5.x   │            │             │              │             │               │
│  │ MongoDB 7.0 │            │ Fuseki      │              │ DETR        │               │
│  │ Redis 7     │            │ SPARQL/RDF  │              │ (HuggingFace)│              │
│  │             │            │             │              │ OpenCV      │               │
│  │             │            │ SOSA/SSN    │              │ PyTorch     │               │
│  └─────────────┘            └─────────────┘              └─────────────┘               │
│                                                                                         │
│  MESSAGING                   DEVOPS                       STANDARDS                    │
│  ─────────                   ──────                       ─────────                    │
│  ┌─────────────┐            ┌─────────────┐              ┌─────────────┐               │
│  │ Kafka       │            │ GitHub      │              │ NGSI-LD     │               │
│  │ KRaft Mode  │            │ Actions     │              │ ETSI CIM    │               │
│  │             │            │ (9 workflows)│             │             │               │
│  │ WebSocket   │            │             │              │ SOSA/SSN    │               │
│  │ Socket.IO   │            │ Prometheus  │              │ W3C         │               │
│  │             │            │ Grafana     │              │             │               │
│  │             │            │             │              │ Smart Data  │               │
│  │             │            │ Codecov     │              │ Models      │               │
│  └─────────────┘            └─────────────┘              └─────────────┘               │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Docker Services Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           🐳 DOCKER COMPOSE SERVICES (12 Containers)                     │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          STELLIO CONTEXT BROKER CLUSTER                          │   │
│  │                                                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │   │
│  │  │ stellio-api-    │  │ search-service  │  │ subscription-   │                  │   │
│  │  │ gateway :8080   │  │ :8083           │  │ service         │                  │   │
│  │  │                 │  │                 │  │                 │                  │   │
│  │  │ NGSI-LD REST API│  │ Entity Search   │  │ Notifications   │                  │   │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                  │   │
│  │           └───────────────────┬┴───────────────────┘                            │   │
│  │                               ▼                                                 │   │
│  │           ┌─────────────────────────────────────────┐                          │   │
│  │           │        postgres :5432                    │                          │   │
│  │           │        TimescaleDB + PostGIS             │                          │   │
│  │           └─────────────────────────────────────────┘                          │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              DATA STORES & MESSAGING                             │   │
│  │                                                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │   │
│  │  │ neo4j 5.12.0    │  │ fuseki          │  │ mongodb 7.0     │                  │   │
│  │  │ :7474 :7687     │  │ :3030           │  │ :27017          │                  │   │
│  │  │                 │  │                 │  │                 │                  │   │
│  │  │ Graph Database  │  │ RDF Triplestore │  │ Document Store  │                  │   │
│  │  │ Cypher + APOC   │  │ SPARQL Endpoint │  │ NGSI-LD Docs    │                  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │   │
│  │                                                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                                       │   │
│  │  │ redis 7-alpine  │  │ kafka           │                                       │   │
│  │  │ :6379           │  │ :9092           │                                       │   │
│  │  │                 │  │                 │                                       │   │
│  │  │ Cache + Pub/Sub │  │ KRaft Mode      │                                       │   │
│  │  └─────────────────┘  └─────────────────┘                                       │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              APPLICATION SERVICES                                │   │
│  │                                                                                  │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │   │
│  │  │ backend         │  │ frontend        │  │ cv-verification │                  │   │
│  │  │ :3001           │  │ :3000           │  │ -service        │                  │   │
│  │  │                 │  │                 │  │                 │                  │   │
│  │  │ Express.js API  │  │ React + Vite    │  │ YOLOX/DETR API  │                  │   │
│  │  │ TypeScript      │  │ TailwindCSS     │  │ FastAPI         │                  │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  Network: test-network (bridge mode)                                                   │
│  Volumes: neo4j_data, fuseki_data, mongodb_data, postgres_data, redis_data, kafka_data │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Agent Categories Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              📊 AGENT DISTRIBUTION (38 Total)                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   Category             │ Count │ Location                                              │
│   ─────────────────────┼───────┼───────────────────────────────────────────────────── │
│   Data Collection      │   2   │ src/agents/data_collection/                          │
│   Ingestion            │   1   │ src/agents/ingestion/                                │
│   Analytics            │   4   │ src/agents/analytics/                                │
│   Transformation       │   2   │ src/agents/transformation/                           │
│   Context Management   │   4   │ src/agents/context_management/                       │
│   RDF & Linked Data    │   5   │ src/agents/rdf_linked_data/                          │
│   State Management     │   4   │ src/agents/state_management/                         │
│   Monitoring           │   3   │ src/agents/monitoring/                               │
│   Notification         │   5   │ src/agents/notification/                             │
│   Graph Database       │   2   │ src/agents/graph_database/                           │
│   Cache                │   2   │ src/agents/cache/                                    │
│   Integration          │   3   │ src/agents/integration/                              │
│   Kafka Publisher      │   1   │ src/agents/kafka_entity_publisher_agent.py           │
│   ─────────────────────┼───────┼───────────────────────────────────────────────────── │
│   TOTAL                │  38   │                                                       │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Application Settings
ENVIRONMENT=development          # development | staging | production
LOG_LEVEL=INFO                   # DEBUG | INFO | WARNING | ERROR

# Orchestrator Configuration
ORCHESTRATOR_INTERVAL=60         # Minutes between runs
WORKFLOW_CONFIG=config/workflow.yaml

# Data Stores
STELLIO_URL=http://localhost:8080
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
FUSEKI_URL=http://localhost:3030
MONGODB_URI=mongodb://localhost:27017

# Message Queue
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# Computer Vision (YOLOX + DETR)
YOLOX_MODEL=assets/models/yolox_s.pth
YOLOX_DEVICE=cpu                  # cpu | cuda
YOLOX_CONFIDENCE=0.25
# DETR accident model is auto-downloaded from HuggingFace

# External APIs
OPENWEATHERMAP_API_KEY=your_key
GEONAMES_USERNAME=your_username
```

### Workflow Configuration

Define orchestration phases in `config/workflow.yaml`:

```yaml
workflow:
  name: "Traffic LOD Pipeline"
  version: "2.0.0"

phases:
  - name: data_collection
    parallel: true
    agents:
      - module: src.agents.data_collection.image_refresh_agent
        enabled: true
      - module: src.agents.data_collection.external_data_collector_agent
        enabled: true

  - name: analytics
    parallel: false
    agents:
      - module: src.agents.analytics.cv_analysis_agent
        enabled: true
        config:
          model: yolox_s.pth         # YOLOX model
          confidence: 0.25
          accident_model: hilmantm/detr-traffic-accident-detection  # DETR from HuggingFace

  - name: transformation
    agents:
      - module: src.agents.transformation.ngsi_ld_transformer_agent
      - module: src.agents.transformation.sosa_ssn_mapper_agent
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html --cov-report=term-missing

# Run specific test category
pytest tests/unit/ -v
pytest tests/integration/ -v

# Run tests in parallel
pytest -n auto

# Run with specific markers
pytest -m "not slow"
```

### Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Core modules | 90% | ✅ |
| Agents | 80% | ✅ |
| Integration | 70% | ✅ |

---

## 📚 Documentation

### Available Documentation

| Resource | Description | Link |
|----------|-------------|------|
| **API Reference** | OpenAPI/Swagger documentation | [docs/api/](docs/api/) |
| **Architecture Guide** | System design & data flow | [docs/architecture/](docs/architecture/) |
| **Configuration Guide** | YAML configuration reference | [docs/data-access/](docs/data-access/) |
| **Contributing Guide** | Development workflow | [CONTRIBUTING.md](.github/CONTRIBUTING.md) |
| **Security Policy** | Vulnerability reporting | [SECURITY.md](.github/SECURITY.md) |
| **Changelog** | Version history | [docs/CHANGELOG.md](docs/CHANGELOG.md) |

### Build Documentation Site

```bash
cd docs
npm install
npm run start    # Development server
npm run build    # Production build
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for details.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Install** dev dependencies: `pip install -r requirements/dev.txt`
4. **Install** pre-commit hooks: `pre-commit install`
5. **Make** your changes
6. **Test** your changes: `pytest --cov=src`
7. **Lint** your code: `pre-commit run --all-files`
8. **Commit** your changes: `git commit -m "feat: add amazing feature"`
9. **Push** to the branch: `git push origin feature/amazing-feature`
10. **Open** a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### Code Style

- **Python**: Black formatter, 100 character line length
- **TypeScript**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Docs**: Google-style docstrings

---

## 🛡️ Security

Please see our [Security Policy](.github/SECURITY.md) for reporting vulnerabilities.

### Security Features

- 🔐 API key authentication
- 🔒 CORS configuration
- 🛡️ Input validation
- 📝 Audit logging
- 🔑 Secret management via environment variables

---

## 📜 License

This project is licensed under the **MIT License**.

### Why MIT License?

This project uses **MIT-compatible** computer vision libraries:
- **YOLOX** (Apache-2.0 by Megvii) — Object detection for vehicles and pedestrians
- **DETR** (Apache-2.0) — Accident detection via HuggingFace Transformers
- **PyTorch** (BSD-style) — Deep learning framework

All dependencies use permissive licenses (MIT, Apache-2.0, BSD) that are compatible with MIT licensing.

| License | File | Description |
|---------|------|-------------|
| **MIT** | [LICENSE](LICENSE) | Main project license with third-party attribution |
| **N/A** | [COPYING](COPYING) | Licensing information and third-party notices |

### License Documentation

| Document | Description |
|----------|-------------|
| [LICENSE](LICENSE) | MIT license with third-party attribution |
| [COPYING](COPYING) | Detailed licensing information |
| [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) | Complete list of 120+ third-party dependencies and their licenses |

### License Summary

The **MIT License** covers all code in this project. You are free to:
- ✅ Use commercially
- ✅ Modify and distribute
- ✅ Sublicense
- ✅ Use in proprietary software

### Third-Party Licenses

| Component | License | Use Case |
|-----------|---------|----------|
| YOLOX | Apache-2.0 | Vehicle/pedestrian detection |
| DETR (HuggingFace) | Apache-2.0 | Accident detection |
| PyTorch | BSD-style | Deep learning framework |
| FastAPI | MIT | Web framework |
| RDFLib | BSD-3-Clause | RDF/Linked Data processing |

```
MIT License

Copyright (c) 2024-2025 Traffic LOD Pipeline Project Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 🙏 Acknowledgments

### Standards & Specifications

- [ETSI NGSI-LD](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.04.01_60/gs_cim009v010401p.pdf) — Context Information Management
- [W3C SOSA/SSN](https://www.w3.org/TR/vocab-ssn/) — Sensor Observation Ontologies
- [Smart Data Models](https://smartdatamodels.org/) — TM Forum & FIWARE

### Open Source Projects

- [Stellio Context Broker](https://github.com/stellio-hub/stellio-context-broker) — NGSI-LD implementation
- [Apache Jena](https://jena.apache.org/) — Semantic Web framework
- [YOLOX](https://github.com/Megvii-BaseDetection/YOLOX) — Object Detection (Apache-2.0)
- [HuggingFace Transformers](https://github.com/huggingface/transformers) — DETR Accident Detection
- [FastAPI](https://fastapi.tiangolo.com/) — Modern Python web framework

---

## 📞 Support

### Community Channels

| Channel | Description | Link |
|---------|-------------|------|
| 📧 **Mailing List** | Announcements & discussions | [builder-layer-end@googlegroups.com](https://groups.google.com/g/builder-layer-end) |
| 💬 **Discord** | Real-time chat & support | [Join Discord](https://discord.gg/builder-layer-end) |
| 💬 **Discussions** | Q&A & community | [GitHub Discussions](https://github.com/NguyenNhatquang522004/builder-layer-end/discussions) |

### Other Resources

- 📖 **Documentation**: [docs/](docs/)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/NguyenNhatquang522004/builder-layer-end/issues)
- 📧 **Email**: nguyennhatquang522004@gmail.com

---

## 🗺️ Roadmap

### v1.0.0 (Legacy) ✅

- [x] Multi-agent system architecture (37 agents)
- [x] NGSI-LD entity management
- [x] YOLOX computer vision integration (Apache-2.0)
- [x] RDF triple store publishing
- [x] Docker Compose deployment
- [x] CI/CD pipelines (9 workflows)
- [x] Docusaurus documentation site

### v2.0.0 (Current - MIT License) ✅

- [x] Multi-agent system architecture (38 agents)
- [x] **YOLOX** object detection (Apache-2.0 by Megvii)
- [x] **DETR** accident detection via HuggingFace (Apache-2.0)
- [x] Full MIT license compatibility
- [x] All dependencies use permissive licenses
- [x] NGSI-LD entity management
- [x] RDF triple store publishing
- [x] Docker Compose deployment

### v2.1.0 (Q1 2026)

- [ ] Real-time streaming analytics
- [ ] Advanced traffic prediction (ML)
- [ ] Mobile application
- [ ] Public API with rate limiting

### v2.0.0 (Q2 2026)

- [ ] Federated learning
- [ ] Edge computing support
- [ ] Knowledge graph reasoning
- [ ] Multi-city deployment

---

<p align="center">
  <strong>Built with ❤️ for the Semantic Web and Linked Open Data community</strong>
</p>

<p align="center">
  <a href="#-overview">Back to top</a>
</p>
