# Builder Layer End - Linked Open Data Pipeline System

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Tests](https://github.com/your-org/builder-layer-end/workflows/Tests/badge.svg)](https://github.com/your-org/builder-layer-end/actions)
[![codecov](https://codecov.io/gh/your-org/builder-layer-end/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/builder-layer-end)

A professional, production-ready **Linked Open Data (LOD)** pipeline system for real-time traffic monitoring in Ho Chi Minh City. The system processes traffic camera data, performs computer vision analysis, and publishes standardized NGSI-LD entities enriched with SOSA/SSN ontologies to semantic triple stores.

## 🌟 Key Features

### Architecture Principles

- **Domain-Agnostic Design**: Configurable multi-agent system adaptable to various LOD domains
- **100% Config-Driven**: All endpoints, mappings, and transformations defined in YAML configuration files
- **Production-Ready**: Comprehensive error handling, retry logic, graceful shutdown, and monitoring
- **Scalable Architecture**: Async I/O, batch processing, connection pooling, and horizontal scaling support
- **Standards-Compliant**: Full support for NGSI-LD, SOSA/SSN, RDF, and ETSI Smart Data Models
- **Computer Vision Integration**: YOLOv8-powered vehicle detection and traffic analysis
- **Semantic Web Stack**: RDF triple stores, SPARQL queries, and linked data publishing

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Agent System](#agent-system)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Installation

### Prerequisites

- **Python 3.9 or higher**
- **pip** package manager
- **Virtual environment** (recommended)
- **Docker & Docker Compose** (for containerized deployment)
- **Git** for version control

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/builder-layer-end.git
cd Builder-Layer-End

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Linux/Mac:
source .venv/bin/activate

# Install package in editable mode with development dependencies
pip install -e .
pip install -r requirements/dev.txt

# Copy environment template and configure
cp .env.example .env
# Edit .env with your configuration

# Install pre-commit hooks for code quality
pre-commit install
```

### Production Setup

```bash
# Install production dependencies only
pip install -r requirements/prod.txt

# Configure environment variables
cp .env.example .env
# Edit .env with production settings
```

## 🎯 Quick Start

### Running the System

#### 1. Start Infrastructure Services (Docker Compose)

```bash
# Start all required services (Stellio, Neo4j, Fuseki, Kafka, Redis)
docker-compose up -d

# Check services are running
docker-compose ps
```

#### 2. Run the Orchestrator

```bash
# Run all phases of the pipeline
python orchestrator.py

# Or use the console script (if installed with pip install -e .)
builder-orchestrator
```

#### 3. Access Services

- **API Gateway**: http://localhost:8000/api/v1
- **Stellio Context Broker**: http://localhost:8080
- **Neo4j Browser**: http://localhost:7474 (user: neo4j, password: from .env)
- **Fuseki SPARQL**: http://localhost:3030
- **Grafana Dashboard**: http://localhost:3001

### Running Individual Agents

```bash
# Image refresh (data collection)
python -m src.agents.data_collection.image_refresh_agent

# CV analysis (vehicle detection)
python -m src.agents.analytics.cv_analysis_agent

# Entity publisher (NGSI-LD)
python -m src.agents.context_management.entity_publisher_agent
```

## 📁 Project Structure

```
Builder-Layer-End/
├── src/                          # Source code (importable package)
│   ├── __init__.py
│   ├── agents/                   # Multi-agent system (20+ specialized agents)
│   │   ├── __init__.py
│   │   ├── data_collection/      # Data ingestion agents
│   │   │   ├── image_refresh_agent.py
│   │   │   └── external_data_agent.py
│   │   ├── analytics/            # Computer vision & analysis
│   │   │   ├── cv_analysis_agent.py
│   │   │   ├── congestion_agent.py
│   │   │   ├── accident_agent.py
│   │   │   └── pattern_recognition_agent.py
│   │   ├── transformation/       # Data transformation
│   │   │   ├── ngsi_ld_mapper.py
│   │   │   └── sosa_ssn_mapper.py
│   │   ├── rdf_linked_data/      # RDF & semantic web
│   │   │   ├── ngsi_ld_to_rdf_agent.py
│   │   │   ├── triplestore_agent.py
│   │   │   ├── validation_agent.py
│   │   │   └── content_negotiation_agent.py
│   │   ├── context_management/   # NGSI-LD context management
│   │   │   ├── entity_publisher_agent.py
│   │   │   ├── state_updater_agent.py
│   │   │   ├── temporal_manager_agent.py
│   │   │   └── stellio_query_agent.py
│   │   ├── integration/          # External integrations
│   │   │   ├── api_gateway_agent.py
│   │   │   ├── neo4j_sync_agent.py
│   │   │   └── cache_manager_agent.py
│   │   ├── monitoring/           # System monitoring
│   │   │   ├── health_check_agent.py
│   │   │   ├── data_quality_agent.py
│   │   │   └── performance_monitor_agent.py
│   │   └── notification/         # Alerts & notifications
│   │       ├── alert_dispatcher_agent.py
│   │       ├── subscription_agent.py
│   │       └── incident_report_agent.py
│   └── core/                     # Core utilities
│       ├── __init__.py
│       ├── data_seeder.py
│       ├── config_loader.py
│       ├── logger.py
│       └── utils.py
├── config/                       # YAML configuration files
│   ├── workflow.yaml             # Multi-phase orchestration
│   ├── agents.yaml               # Agent-specific configs
│   ├── data_sources.yaml         # External API endpoints
│   ├── ngsi_ld_mappings.yaml     # Entity type mappings
│   ├── sosa_mappings.yaml        # SOSA/SSN property mappings
│   ├── validation.yaml           # Schema validation rules
│   └── ...
├── data/                         # Runtime data storage
│   ├── cache/images/             # Cached traffic images
│   ├── rdf/                      # RDF serializations
│   └── reports/                  # Generated reports
├── requirements/                 # Dependency management
│   ├── base.txt                  # Production dependencies
│   ├── dev.txt                   # Development tools
│   ├── test.txt                  # Testing frameworks
│   └── prod.txt                  # Production-specific
├── docs/                         # Documentation
│   ├── architecture/             # Architecture diagrams & docs
│   │   └── ARCHITECTURE.md
│   ├── api/                      # API documentation
│   │   └── API.md
│   ├── reports/                  # Analysis reports
│   └── guides/                   # User guides
├── scripts/                      # Utility scripts
│   ├── utilities/                # General utilities
│   ├── monitoring/               # Monitoring scripts
│   ├── testing/                  # Testing helpers
│   ├── docker/                   # Docker utilities
│   ├── database/                 # Database scripts
│   └── pipeline/                 # Pipeline tools
├── assets/                       # Static assets
│   ├── images/                   # Images & icons
│   └── models/                   # ML models (YOLOv8)
├── templates/                    # HTML templates
│   ├── incident_report.html
│   └── entity.html
├── tests/                        # Test suite
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── conftest.py               # Pytest configuration
├── .github/                      # GitHub Actions CI/CD
│   └── workflows/
│       ├── test.yml              # Automated testing
│       ├── lint.yml              # Code quality checks
│       └── deploy.yml            # Deployment pipeline
├── orchestrator.py               # Main entry point
├── setup.py                      # Package installation
├── pyproject.toml                # Modern Python project config
├── .env.example                  # Environment variable template
├── .pre-commit-config.yaml       # Pre-commit hooks
├── docker-compose.yml            # Docker services
├── Dockerfile                    # Container image
├── pytest.ini                    # Pytest configuration
├── README.md                     # This file
└── LICENSE                       # MIT License
```

**Purpose**: Refresh time-sensitive URLs by updating timestamps and verifying accessibility.

**Features**:
- ✅ URL parsing and parameter extraction
- ✅ Timestamp generation (milliseconds)
- ✅ URL reconstruction with fresh timestamps
- ✅ Async HTTP HEAD verification
- ✅ Batch processing (configurable batch size)
- ✅ Retry logic with exponential backoff
- ✅ Graceful shutdown (SIGTERM/SIGINT)
- ✅ Comprehensive error handling
- ✅ Statistics tracking and logging


## ⚙️ Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Python Configuration
PYTHONPATH=.

# Application Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
LOG_FORMAT=json

# Data Directories
DATA_DIR=./data
CONFIG_DIR=./config
LOGS_DIR=./logs
ASSETS_DIR=./assets

# Stellio Context Broker
STELLIO_URL=http://localhost:8080
STELLIO_API_KEY=your-api-key-here
STELLIO_TENANT=default

# Neo4j Graph Database
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j

# Apache Jena Fuseki
FUSEKI_URL=http://localhost:3030
FUSEKI_DATASET=traffic
FUSEKI_USER=admin
FUSEKI_PASSWORD=admin

# YOLOv8 Configuration
YOLO_MODEL=yolov8n.pt
YOLO_DEVICE=cpu
YOLO_CONFIDENCE=0.5
YOLO_MAX_VEHICLES=100

# External APIs
OPENWEATHERMAP_API_KEY=your-api-key
OPENAQ_API_KEY=your-api-key

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_PORT=9090
METRICS_ENABLED=true

# Feature Flags
ENABLE_SEEDING=true
ENABLE_CACHING=true
ENABLE_ASYNC_PROCESSING=true
```

See `.env.example` for complete configuration options (90+ variables across 9 sections).

### YAML Configuration

#### Workflow Configuration (`config/workflow.yaml`)

Defines the multi-phase pipeline:

```yaml
phases:
  - name: "Data Collection"
    description: "Collect raw data from external sources"
    parallel: true
    agents:
      - module: "src.agents.data_collection.image_refresh_agent"
        enabled: true
      - module: "src.agents.data_collection.external_data_agent"
        enabled: true

  - name: "Analysis & Transformation"
    description: "Analyze data and transform to NGSI-LD"
    parallel: false
    agents:
      - module: "src.agents.analytics.cv_analysis_agent"
        enabled: true
      - module: "src.agents.transformation.ngsi_ld_mapper"
        enabled: true
```

#### Data Sources (`config/data_sources.yaml`)

Configure external data sources:

```yaml
cameras:
  source_file: "data/cameras_raw.json"
  output_file: "data/cameras_updated.json"
  refresh_interval: 30
  batch_size: 50
  url_template: "https://api.example.com/cameras"
```

#### NGSI-LD Mappings (`config/ngsi_ld_mappings.yaml`)

Define entity type mappings:

```yaml
entity_types:
  TrafficCamera:
    properties:
      - name
      - location
      - status
      - vehicleCount
    relationships:
      - hasObservation
```

## 🧪 Development

### Code Quality Tools

The project uses comprehensive code quality automation:

```bash
# Format code with Black
black src/ tests/ --line-length=100

# Sort imports with isort
isort src/ tests/ --profile=black

# Lint with flake8
flake8 src/ tests/ --max-line-length=100

# Type check with mypy
mypy src/ --ignore-missing-imports

# Security scan with bandit
bandit -r src/ -ll

# Check docstring coverage
interrogate src/ --fail-under=50 -vv
```

### Pre-commit Hooks

Automatically run quality checks before commits:

```bash
# Install pre-commit hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

Configured hooks:
- **black**: Code formatting
- **isort**: Import sorting
- **flake8**: Linting
- **mypy**: Type checking
- **bandit**: Security scanning
- **interrogate**: Docstring coverage
- **detect-secrets**: Secret detection

### Development Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and test:
   ```bash
   pytest tests/ -v --cov=src
   ```

3. **Run quality checks**:
   ```bash
   pre-commit run --all-files
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request** - CI/CD will run automated tests and quality checks

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html --cov-report=term-missing

# Run specific test file
pytest tests/unit/test_image_refresh_agent.py -v

# Run tests matching pattern
pytest -k "test_validation" -v

# Run tests in parallel
pytest -n auto
```

### Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── test_agents/
│   │   ├── test_image_refresh_agent.py
│   │   ├── test_cv_analysis_agent.py
│   │   └── ...
│   └── test_core/
│       ├── test_config_loader.py
│       └── test_utils.py
├── integration/             # Integration tests
│   ├── test_workflow.py
│   ├── test_stellio_integration.py
│   └── test_neo4j_integration.py
└── conftest.py             # Pytest fixtures and configuration
```

### Writing Tests

```python
import pytest
from src.agents.data_collection.image_refresh_agent import ImageRefreshAgent

@pytest.fixture
def agent():
    return ImageRefreshAgent(config_path="config/test_config.yaml")

def test_refresh_urls(agent):
    result = agent.refresh_urls(["https://example.com/image.jpg"])
    assert result["success"] > 0
    assert result["failed"] == 0
```

### Continuous Integration

GitHub Actions automatically runs:
- **Tests** on Python 3.9, 3.10, 3.11 (matrix strategy)
- **Code quality checks** (black, flake8, mypy, bandit)
- **Coverage reporting** to Codecov
- **Security scanning**

See `.github/workflows/` for CI/CD configurations.

## 🚀 Deployment

### Docker Deployment

#### Build and Run

```bash
# Build Docker image
docker build -t builder-layer-end:latest .

# Run container
docker run -d \
  --name builder-layer-end \
  --env-file .env \
  -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  builder-layer-end:latest
```

#### Docker Compose (Recommended)

```bash
# Start all services (app + dependencies)
docker-compose up -d

# View logs
docker-compose logs -f builder-layer-end

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

### Production Deployment

#### Using Gunicorn + Uvicorn

```bash
# Install production dependencies
pip install -r requirements/prod.txt

# Run with Gunicorn
gunicorn src.agents.integration.api_gateway_agent:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --graceful-timeout 30
```

#### Environment Configuration

Production `.env` settings:

```bash
ENVIRONMENT=production
LOG_LEVEL=WARNING
LOG_FORMAT=json

# Enable monitoring
SENTRY_DSN=https://your-production-sentry-dsn
PROMETHEUS_PORT=9090
METRICS_ENABLED=true

# Performance tuning
MAX_WORKERS=8
BATCH_SIZE=100
REQUEST_TIMEOUT=30
RETRY_MAX_ATTEMPTS=3

# Security
SECRET_KEY=your-secure-random-key
API_KEY_HEADER=X-API-Key
CORS_ORIGINS=https://your-domain.com
```

### Health Checks

```bash
# Check system health
curl http://localhost:8000/health

# Check Prometheus metrics
curl http://localhost:9090/metrics
```

## 📚 API Documentation

Complete API documentation is available in [docs/api/API.md](docs/api/API.md).

### Quick API Examples

#### Get All Entities

```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:8000/api/v1/entities?type=TrafficCamera&limit=50"
```

#### Query Temporal Data

```bash
curl -H "X-API-Key: your-api-key" \
  "http://localhost:8000/api/v1/temporal/entities?type=TrafficObservation&timerel=between&timeAt=2025-06-10T08:00:00Z&endTimeAt=2025-06-10T12:00:00Z"
```

#### SPARQL Query

```bash
curl -X POST \
  -H "Content-Type: application/sparql-query" \
  -H "Accept: application/sparql-results+json" \
  -d "PREFIX sosa: <http://www.w3.org/ns/sosa/> SELECT * WHERE { ?s a sosa:Observation } LIMIT 10" \
  http://localhost:8000/api/v1/sparql/query
```

## 🏗️ Architecture

Comprehensive architecture documentation is available in [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

### System Overview

```
┌─────────────────────────────────────┐
│        Orchestrator Layer           │
│  (Multi-phase workflow control)     │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌─────────┐ ┌──────┐ ┌─────────┐
│  Data   │ │Analytics│ │Integration│
│Collection│ │ Layer │ │  Layer  │
└─────────┘ └──────┘ └─────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│Stellio │ │ Neo4j  │ │ Fuseki │
│Context │ │ Graph  │ │ Triple │
│ Broker │ │   DB   │ │  Store │
└────────┘ └────────┘ └────────┘
```

### Key Technologies

- **NGSI-LD**: ETSI standard for context information management
- **SOSA/SSN**: W3C ontologies for sensor observations
- **YOLOv8**: Computer vision for vehicle detection
- **Apache Jena Fuseki**: SPARQL-enabled RDF triple store
- **Neo4j**: Graph database for entity relationships
- **Stellio**: NGSI-LD Context Broker
- **Kafka**: Event streaming platform
- **Redis**: High-performance caching

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install development dependencies: `pip install -r requirements/dev.txt`
4. Install pre-commit hooks: `pre-commit install`
5. Make your changes
6. Run tests: `pytest --cov=src`
7. Run quality checks: `pre-commit run --all-files`
8. Commit changes: `git commit -m "feat: add amazing feature"`
9. Push to branch: `git push origin feature/amazing-feature`
10. Open a Pull Request

### Code Style

- **Python**: Follow PEP 8, use Black formatting (line-length: 100)
- **Imports**: Sort with isort (profile: black)
- **Type Hints**: Use type annotations for function signatures
- **Docstrings**: Google-style docstrings for all public functions/classes
- **Tests**: Write tests for all new features (target: 80%+ coverage)

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add entry to CHANGELOG.md
4. Request review from maintainers
5. Address review feedback
6. Squash commits before merge

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ETSI NGSI-LD**: Context Information Management specification
- **W3C SOSA/SSN**: Sensor observation ontologies
- **Ultralytics YOLOv8**: Computer vision framework
- **Apache Jena**: Semantic web framework
- **Stellio Context Broker**: NGSI-LD implementation

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/builder-layer-end/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/builder-layer-end/discussions)
- **Email**: support@example.com

## 🗺️ Roadmap

### Version 1.0 (Current)
- ✅ Multi-agent system architecture
- ✅ NGSI-LD entity management
- ✅ YOLOv8 computer vision integration
- ✅ RDF triple store publishing
- ✅ Docker deployment
- ✅ CI/CD pipelines

### Version 1.1 (Q3 2025)
- 🔜 Real-time streaming analytics
- 🔜 Advanced traffic prediction
- 🔜 Mobile application integration
- 🔜 Public API with rate limiting

### Version 2.0 (Q4 2025)
- 🔜 Federated learning for privacy-preserving analytics
- 🔜 Edge computing for camera-side processing
- 🔜 Knowledge graph reasoning
- 🔜 Semantic query optimization

---

**Built with ❤️ for the Semantic Web and Linked Open Data community**

- **Alert Dispatcher Agent**: Dispatch alerts based on conditions
- **Incident Report Generator Agent**: Generate incident reports

### Monitoring Agents 🔜

- **Health Check Agent**: Monitor agent and service health
- **Data Quality Validator Agent**: Validate data quality metrics
- **Performance Monitor Agent**: Track performance metrics

### Integration Agents 🔜

- **API Gateway Agent**: Expose unified API interface
- **Cache Manager Agent**: Manage distributed caching

## ⚙️ Configuration

### Configuration Files

- `config/data_sources.yaml`: Data source endpoints (domain-agnostic)
- `config/stellio.yaml`: Stellio Context Broker configuration
- `config/fuseki.yaml`: Apache Jena Fuseki triplestore configuration
- `config/agents.yaml`: Agent-specific settings

### Environment Variables

Create `.env` file (optional):

```bash
LOG_LEVEL=INFO
MAX_WORKERS=10
STELLIO_URL=http://localhost:8080
FUSEKI_URL=http://localhost:3030
```

## 🧪 Testing

### Run All Tests

```bash
pytest tests/ -v --cov=agents --cov-report=term-missing
```

### Run Specific Agent Tests

```bash
# Image Refresh Agent tests
pytest tests/data_collection/test_image_refresh_agent.py -v --cov=agents/data_collection/image_refresh_agent --cov-report=term-missing
```

### Test Coverage Goals

- **Target**: 100% code coverage for all agents
- **Current**: Image Refresh Agent - 100% coverage ✅

### Performance Benchmarks

Image Refresh Agent:
- ✅ Process 722 cameras in < 5 seconds
- ✅ Memory usage < 100MB
- ✅ No memory leaks after 1000 iterations

## 🏗️ Architecture

### Design Patterns

1. **Config-Driven Architecture**: All domain logic in YAML configuration
2. **Async I/O**: Non-blocking operations with aiohttp and asyncio
3. **Batch Processing**: Configurable batch sizes for optimal performance
4. **Retry Pattern**: Exponential backoff for transient failures
5. **Circuit Breaker**: Prevent cascading failures
6. **Observer Pattern**: Event-driven agent communication

### Data Flow

```
┌─────────────────────────────────────────────┐
│          Configuration Layer                │
│  (YAML files - domain definitions)          │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│          Data Collection Layer              │
│  - Image Refresh Agent                      │
│  - External Data Collector Agent            │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│         Transformation Layer                │
│  - NGSI-LD Transformer                      │
│  - SOSA/SSN Mapper                          │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│          Analytics Layer                    │
│  - CV Analysis, Pattern Recognition         │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│       Context Management Layer              │
│  - Stellio Context Broker Integration       │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│       RDF & Linked Data Layer               │
│  - RDF Generation, Triplestore Loading      │
└─────────────────────────────────────────────┘
```

### Technology Stack

- **Python 3.9+**: Core language
- **aiohttp**: Async HTTP client
- **PyYAML**: Configuration management
- **pytest**: Testing framework
- **Stellio**: NGSI-LD Context Broker
- **Apache Jena Fuseki**: RDF Triplestore

## 📊 Project Structure

```
Builder-Layer-End/
├── config/                      # Configuration files (YAML)
│   ├── data_sources.yaml       # Data source endpoints (domain-agnostic)
│   ├── stellio.yaml            # Context broker config
│   ├── fuseki.yaml             # Triplestore config
│   └── agents.yaml             # Agent settings
├── agents/                      # Agent implementations
│   ├── data_collection/        # Data collection agents
│   │   ├── image_refresh_agent.py ✅
│   │   └── external_data_collector_agent.py
│   ├── transformation/         # Data transformation agents
│   ├── analytics/              # Analytics agents
│   ├── context_management/     # Context management agents
│   ├── rdf_linked_data/        # RDF and linked data agents
│   ├── notification/           # Notification agents
│   ├── monitoring/             # Monitoring agents
│   └── integration/            # Integration agents
├── shared/                      # Shared utilities
│   ├── config_loader.py        # Config loading utilities
│   ├── logger.py               # Logging utilities
│   └── utils.py                # Common utilities
├── tests/                       # Test suite (mirrors agents/)
│   └── data_collection/
│       └── test_image_refresh_agent.py ✅
├── data/                        # Data files
│   ├── cameras_raw.json        # Source data
│   └── cameras_updated.json    # Processed data
├── docker-compose.yml          # Docker orchestration
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🔧 Development

### Code Quality

```bash
# Format code with black
black agents/ tests/ shared/

# Lint with flake8
flake8 agents/ tests/ shared/

# Type checking with mypy
mypy agents/ shared/
```

### Adding a New Domain

1. **No code changes required!**
2. Add domain configuration to `config/data_sources.yaml`:

```yaml
your_new_domain:
  source_file: "data/your_domain_raw.json"
  output_file: "data/your_domain_updated.json"
  refresh_interval: 60
  batch_size: 100
  url_template: "https://your-api.example.com/endpoint"
  params:
    - param1
    - param2
    - timestamp
```

3. Run the agent:
```bash
python agents/data_collection/image_refresh_agent.py --domain your_new_domain --mode once
```

### Adding a New Agent

1. Create agent file in appropriate category folder
2. Implement required interfaces
3. Add configuration to `config/agents.yaml`
4. Write comprehensive tests
5. Update README with agent documentation

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Code Quality**: All code must pass black, flake8, mypy checks
2. **Testing**: Achieve 100% test coverage for new code
3. **Documentation**: Update README and docstrings
4. **Domain-Agnostic**: Ensure no domain-specific logic in code
5. **Config-Driven**: All domain logic goes in YAML configuration

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

For questions, issues, or contributions, please open an issue on GitHub.

## 🙏 Acknowledgments

- NGSI-LD specification by ETSI
- SOSA/SSN ontology by W3C
- Smart Data Models initiative by TM Forum and FIWARE
- Apache Jena Fuseki project
- Stellio Context Broker by EGM

---

**Status**: 🚧 Active Development

**Last Updated**: November 1, 2025

**Version**: 0.1.0
