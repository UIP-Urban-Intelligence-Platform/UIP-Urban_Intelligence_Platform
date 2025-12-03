# 🔧 Technology Stack

Complete list of technologies, frameworks, and tools used in Builder Layer End.

---

## 📊 Overview

| Layer | Primary Technologies |
|-------|---------------------|
| **Frontend** | React 18, TypeScript 5, Vite, TailwindCSS |
| **Backend** | Python 3.9+, FastAPI, Express.js, TypeScript |
| **Databases** | PostgreSQL/TimescaleDB, Neo4j, MongoDB, Redis |
| **Semantic Web** | Stellio, Apache Jena Fuseki, RDF, SPARQL |
| **Messaging** | Apache Kafka |
| **DevOps** | Docker Compose, GitHub Actions |
| **AI/ML** | YOLOX, DETR, PyTorch, Transformers |

---

## 🐍 Python Backend

### Core Frameworks

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.9+ | Runtime |
| FastAPI | 0.104+ | REST API framework |
| Uvicorn | 0.24+ | ASGI server |
| AsyncIO | Built-in | Async/await support |
| APScheduler | 3.10+ | Job scheduling |

### HTTP & Networking

| Technology | Version | Purpose |
|------------|---------|---------|
| aiohttp | 3.9+ | Async HTTP client |
| httpx | 0.24+ | HTTP client |
| requests | 2.31+ | HTTP library |

### Data Processing

| Technology | Version | Purpose |
|------------|---------|---------|
| pandas | 2.0+ | Data manipulation |
| numpy | 1.24+ | Numerical computing |
| PyYAML | 6.0+ | YAML parsing |

### Semantic Web

| Technology | Version | Purpose |
|------------|---------|---------|
| rdflib | 7.0+ | RDF processing |
| SPARQLWrapper | - | SPARQL queries |

### AI/ML & Computer Vision

| Technology | Version | Purpose |
|------------|---------|---------|
| PyTorch | 2.0+ | Deep learning |
| torchvision | 0.15+ | Vision models |
| Transformers | 4.35+ | HuggingFace models |
| Pillow | 10.0+ | Image processing |
| opencv-python | 4.8+ | Computer vision |

### Databases

| Technology | Version | Purpose |
|------------|---------|---------|
| neo4j | 5.0+ | Neo4j driver |
| psycopg2-binary | 2.9+ | PostgreSQL driver |
| pymongo | 4.6+ | MongoDB driver |
| kafka-python | 2.0+ | Kafka client |

### Reporting

| Technology | Version | Purpose |
|------------|---------|---------|
| reportlab | 4.0+ | PDF generation |
| weasyprint | 60.0+ | HTML to PDF |
| Jinja2 | 3.1+ | Templating |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| black | 23.11+ | Code formatter |
| isort | 5.12+ | Import sorter |
| flake8 | 6.1+ | Linter |
| pylint | 3.0+ | Linter |
| mypy | 1.7+ | Type checker |
| pytest | 7.4+ | Testing |
| pytest-asyncio | 0.21+ | Async testing |
| pytest-cov | 4.1+ | Coverage |
| pre-commit | 3.5+ | Git hooks |

---

## 🟦 TypeScript Backend

### Core Frameworks

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express.js | 4.18+ | Web framework |
| TypeScript | 5.0+ | Type safety |

### Real-time

| Technology | Version | Purpose |
|------------|---------|---------|
| Socket.IO | 4.6+ | WebSocket |
| ws | 8.14+ | WebSocket client |

### Development

| Technology | Version | Purpose |
|------------|---------|---------|
| ts-node | 10.9+ | TypeScript execution |
| tsx | 4.1+ | TypeScript runner |
| nodemon | 3.0+ | Hot reload |
| Jest | 29+ | Testing |

---

## ⚛️ React Frontend

### Core

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2+ | UI library |
| TypeScript | 5.0+ | Type safety |
| Vite | 5.0+ | Build tool |

### Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| TailwindCSS | 3.3+ | Utility-first CSS |
| PostCSS | 8.4+ | CSS processing |
| Autoprefixer | 10.4+ | CSS vendor prefixes |

### State Management

| Technology | Version | Purpose |
|------------|---------|---------|
| Zustand | 4.4+ | State management |
| React Query | 5.0+ | Server state |

### UI Components

| Technology | Version | Purpose |
|------------|---------|---------|
| Leaflet | 1.9+ | Maps |
| React-Leaflet | 4.2+ | React map wrapper |
| Recharts | 2.8+ | Charts |
| Lucide React | 0.294+ | Icons |

### Forms & Validation

| Technology | Version | Purpose |
|------------|---------|---------|
| React Hook Form | 7.48+ | Form handling |
| Zod | 3.22+ | Schema validation |

---

## 🗄️ Databases

### Relational

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15+ | Primary database |
| TimescaleDB | 2.12+ | Time-series extension |
| PostGIS | 3.3+ | Spatial extension |

### Graph

| Technology | Version | Purpose |
|------------|---------|---------|
| Neo4j | 5.12+ | Graph database |
| APOC | 5.12+ | Neo4j procedures |

### Document

| Technology | Version | Purpose |
|------------|---------|---------|
| MongoDB | 7.0+ | Document store |

### Cache

| Technology | Version | Purpose |
|------------|---------|---------|
| Redis | 7.0+ | In-memory cache |

---

## 🌐 Semantic Web Stack

### Context Broker

| Technology | Version | Purpose |
|------------|---------|---------|
| Stellio | 2.5+ | NGSI-LD Context Broker |
| ETSI NGSI-LD | 1.6 | Context information standard |

### Triplestore

| Technology | Version | Purpose |
|------------|---------|---------|
| Apache Jena Fuseki | 4.9+ | SPARQL triplestore |
| SPARQL 1.1 | - | Query language |

### Ontologies

| Ontology | Purpose |
|----------|---------|
| SOSA/SSN | Sensor observations |
| Schema.org | General vocabulary |
| NGSI-LD Core | Context information |
| Smart Data Models | FIWARE/TM Forum |

### LOD Cloud

| Dataset | Purpose |
|---------|---------|
| GeoNames | Geographic names |
| DBpedia | Wikipedia data |
| Wikidata | Structured data |

---

## 📨 Messaging & Streaming

| Technology | Version | Purpose |
|------------|---------|---------|
| Apache Kafka | 3.5+ | Event streaming |
| Kafka KRaft | 3.5+ | Controller mode |
| Socket.IO | 4.6+ | Real-time events |

---

## 🐳 DevOps & Infrastructure

### Containerization

| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | 24+ | Container runtime |
| Docker Compose | 2.20+ | Orchestration |

### CI/CD

| Technology | Purpose |
|------------|---------|
| GitHub Actions | CI/CD pipelines |
| CodeQL | Security scanning |
| Dependabot | Dependency updates |

### Monitoring

| Technology | Version | Purpose |
|------------|---------|---------|
| Prometheus | 2.47+ | Metrics |
| Grafana | 10.1+ | Dashboards |

---

## 📚 Documentation

| Technology | Version | Purpose |
|------------|---------|---------|
| Docusaurus | 3.0+ | Documentation site |
| OpenAPI/Swagger | 3.0 | API documentation |
| Markdown | - | Content format |

---

## 🧪 Testing

### Python Testing

| Tool | Purpose |
|------|---------|
| pytest | Test framework |
| pytest-asyncio | Async testing |
| pytest-cov | Coverage |
| pytest-mock | Mocking |

### JavaScript Testing

| Tool | Purpose |
|------|---------|
| Jest | Test framework |
| Testing Library | React testing |
| Supertest | API testing |

### Quality

| Tool | Purpose |
|------|---------|
| SonarQube | Code quality |
| CodeCov | Coverage tracking |
| ESLint | JS/TS linting |
| Prettier | Code formatting |

---

## 📦 Build Tools

### Python

| Tool | Purpose |
|------|---------|
| setuptools | Package building |
| wheel | Binary packages |
| build | PEP 517 builder |
| GNU Make | Build automation |

### JavaScript

| Tool | Purpose |
|------|---------|
| Vite | Frontend bundler |
| tsc | TypeScript compiler |
| esbuild | Fast bundling |

---

## 🔐 Security

| Technology | Purpose |
|------------|---------|
| python-dotenv | Environment variables |
| Helmet | HTTP security headers |
| CORS | Cross-origin security |
| Rate Limiting | API protection |

---

## 📚 Related Pages

- [[System-Architecture]] - Architecture overview
- [[Docker-Services]] - Container details
- [[Installation]] - Setup instructions
