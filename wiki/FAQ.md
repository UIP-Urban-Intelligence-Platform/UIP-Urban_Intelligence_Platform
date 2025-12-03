# ❓ Frequently Asked Questions

Common questions and answers about UIP - Urban Intelligence Platform.

---

## 📋 Table of Contents

- [General](#-general)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Agents](#-agents)
- [Databases](#-databases)
- [Semantic Web](#-semantic-web)
- [Docker](#-docker)
- [Troubleshooting](#-troubleshooting)

---

## 🌐 General

### What is UIP - Urban Intelligence Platform?

UIP - Urban Intelligence Platform is a Multi-Agent Linked Open Data (LOD) Pipeline for Smart Traffic Management. It transforms raw traffic data (cameras, sensors, weather, air quality) into semantic web formats (RDF, NGSI-LD) and publishes them as Linked Open Data.

### What are the main features?

- **41 AI Agents**: Automated data processing pipeline
- **NGSI-LD Support**: Context broker integration with Stellio
- **Semantic Web**: RDF generation, SPARQL queries, LOD publishing
- **Real-time Processing**: Live traffic analysis and alerts
- **Multi-Database**: PostgreSQL, Neo4j, MongoDB, Redis
- **React Dashboard**: Modern web interface

### What data sources are supported?

- Traffic cameras (Ho Chi Minh City)
- OpenWeatherMap API
- OpenWeatherMap Air Pollution API
- Citizen reports via mobile app
- IoT sensors (extensible)

### Is this production-ready?

Yes, UIP - Urban Intelligence Platform is designed for production use. However, you should:
- Configure proper authentication
- Set up monitoring and logging
- Review security settings
- Plan for scalability

---

## 🛠️ Installation

### What are the system requirements?

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| Storage | 20 GB | 50 GB |
| CPU | 4 cores | 8 cores |
| Docker | 24.0+ | Latest |
| Python | 3.9+ | 3.11 |
| Node.js | 18+ | 20 LTS |

### How do I install on Windows?

```powershell
# Install Docker Desktop
winget install Docker.DockerDesktop

# Clone repository
git clone https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform

# Start services
docker-compose up -d
```

### How do I install on Linux?

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone repository
git clone https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform

# Start services
docker-compose up -d
```

### Do I need all Docker services?

No. You can run minimal services:

```bash
# Core services only
docker-compose up -d postgres redis stellio-api-gateway

# Without monitoring
docker-compose up -d --scale grafana=0 --scale prometheus=0
```

---

## ⚙️ Configuration

### Where are configuration files?

All configuration is in the `config/` directory:

```
config/
├── workflow.yaml        # Workflow orchestration
├── data_sources.yaml    # External data sources
├── stellio.yaml         # Context broker settings
├── fuseki.yaml          # SPARQL endpoint
├── neo4j_sync.yaml      # Graph database
└── ... (30+ config files)
```

### How do I configure API keys?

Create a `.env` file in the project root:

```bash
# Required API keys
OPENWEATHERMAP_API_KEY=your-key-here
OPENAQ_API_KEY=your-key-here

# Database passwords
POSTGRES_PASSWORD=secure-password
NEO4J_PASSWORD=secure-password
REDIS_PASSWORD=secure-password
```

### How do I change port numbers?

Edit `docker-compose.yml`:

```yaml
services:
  stellio-api-gateway:
    ports:
      - "9080:8080"  # Change 8080 to 9080
```

### How do I add a new data source?

1. Add configuration in `config/data_sources.yaml`:
   ```yaml
   new_source:
     base_url: "https://api.example.com"
     api_key: "${NEW_SOURCE_API_KEY}"
     rate_limit: 60
   ```

2. Create an ingestion agent in `src/agents/ingestion/`

3. Register in `config/workflow.yaml`

---

## 🤖 Agents

### What is an agent?

An agent is an autonomous Python module that performs a specific task in the data pipeline. Each agent:
- Has a single responsibility
- Processes data independently
- Communicates via message queues
- Can be scaled horizontally

### How many agents are there?

41 agents in 12 categories:
- Ingestion: 6 agents
- Processing: 7 agents
- Semantic Enrichment: 6 agents
- Integration: 5 agents
- And more...

### How do I create a custom agent?

```python
# src/agents/custom/my_agent.py

from src.agents.base_agent import BaseAgent

class MyCustomAgent(BaseAgent):
    def __init__(self, config):
        super().__init__("MyCustomAgent", config)
    
    async def process(self, data):
        # Your logic here
        return processed_data
```

### How do I disable an agent?

Edit `config/workflow.yaml`:

```yaml
phases:
  - name: "processing"
    agents:
      - cv_analysis_agent
      # - pattern_recognition_agent  # Disabled
```

---

## 🗄️ Databases

### Which databases are used?

| Database | Purpose |
|----------|---------|
| PostgreSQL + TimescaleDB | Primary data, time-series |
| Neo4j | Graph relationships |
| MongoDB | Document storage |
| Redis | Cache, message queue |
| Apache Fuseki | RDF triplestore |
| Stellio | NGSI-LD entities |

### How do I access PostgreSQL?

```bash
# Via Docker
docker exec -it traffic-postgres psql -U postgres -d traffic_lod

# Via psql client
psql -h localhost -U postgres -d traffic_lod
```

### How do I access Neo4j?

- **Browser**: http://localhost:7474
- **Bolt**: bolt://localhost:7687
- **Credentials**: neo4j / password (from .env)

### How do I backup databases?

```bash
# PostgreSQL
docker exec traffic-postgres pg_dump -U postgres traffic_lod > backup.sql

# Neo4j
docker exec traffic-neo4j neo4j-admin dump --database=neo4j --to=/backups/neo4j.dump

# MongoDB
docker exec traffic-mongodb mongodump --out /backups/
```

---

## 🌐 Semantic Web

### What is NGSI-LD?

NGSI-LD is a standard API for context information management. It represents data as entities with properties and relationships in JSON-LD format.

### What ontologies are used?

- **SOSA/SSN**: Sensor observations
- **Schema.org**: General vocabulary
- **NGSI-LD Core**: Context information
- **Smart Data Models**: FIWARE standards

### How do I query SPARQL?

```bash
# Via Fuseki UI
http://localhost:3030/#/dataset/traffic/query

# Via curl
curl http://localhost:3030/traffic/query \
  -H "Content-Type: application/sparql-query" \
  -d "SELECT * WHERE { ?s ?p ?o } LIMIT 10"
```

### How do I create NGSI-LD entities?

```bash
curl -X POST http://localhost:8080/ngsi-ld/v1/entities \
  -H "Content-Type: application/ld+json" \
  -d '{
    "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "id": "urn:ngsi-ld:Device:001",
    "type": "Device",
    "name": {"type": "Property", "value": "Camera 1"}
  }'
```

---

## 🐳 Docker

### How do I start all services?

```bash
docker-compose up -d
```

### How do I stop all services?

```bash
docker-compose down
```

### How do I view logs?

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f stellio-api-gateway
```

### How do I reset everything?

```bash
# Stop and remove volumes
docker-compose down -v

# Remove all Docker resources
docker system prune -a --volumes
```

### Services won't start?

1. Check available resources:
   ```bash
   docker system df
   ```

2. Increase Docker resources in Docker Desktop settings

3. Start services one by one:
   ```bash
   docker-compose up -d postgres
   docker-compose up -d redis
   # etc.
   ```

---

## 🔧 Troubleshooting

### Stellio won't start

**Problem**: Stellio container keeps restarting

**Solution**:
1. Ensure PostgreSQL is running:
   ```bash
   docker-compose up -d postgres
   sleep 30  # Wait for initialization
   docker-compose up -d stellio-api-gateway
   ```

2. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify database exists:
   ```bash
   docker exec traffic-postgres psql -U postgres -c "\l"
   ```

### API returning 500 errors

**Problem**: Backend API returns internal server errors

**Solution**:
1. Check service health:
   ```bash
   curl http://localhost:5000/health
   ```

2. View backend logs:
   ```bash
   docker-compose logs backend
   ```

3. Verify database connections:
   ```bash
   docker-compose ps
   ```

### Out of memory

**Problem**: Docker containers crash with OOM

**Solution**:
1. Increase Docker memory in settings
2. Limit container memory:
   ```yaml
   services:
     neo4j:
       deploy:
         resources:
           limits:
             memory: 2G
   ```

### Tests failing

**Problem**: pytest tests fail

**Solution**:
1. Ensure Docker services are running:
   ```bash
   docker-compose up -d
   ```

2. Install test dependencies:
   ```bash
   pip install -r requirements/dev.txt
   ```

3. Run tests with verbose output:
   ```bash
   pytest -v --tb=long
   ```

### Port already in use

**Problem**: `Error: port is already allocated`

**Solution**:
1. Find process using port:
   ```bash
   # Linux/Mac
   lsof -i :8080
   
   # Windows
   netstat -ano | findstr :8080
   ```

2. Kill the process or change port in `docker-compose.yml`

---

## 📞 Getting More Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions
- **Wiki**: For documentation
- **Stack Overflow**: Tag with `uip-urban-intelligence`

---

## 📚 Related Pages

- [[Installation]] - Setup instructions
- [[Configuration]] - Configuration guide
- [[Troubleshooting]] - Detailed troubleshooting
