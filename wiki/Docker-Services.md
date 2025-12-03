# 🐳 Docker Services

Complete Docker infrastructure documentation for Builder Layer End.

---

## 📊 Overview

Builder Layer End uses Docker Compose to orchestrate 12+ services:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Docker Infrastructure                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Stellio   │  │   Fuseki    │  │   Neo4j     │  │  PostgreSQL │        │
│  │  Port 8080  │  │  Port 3030  │  │  Port 7687  │  │  Port 5432  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   MongoDB   │  │    Redis    │  │    Kafka    │  │  Zookeeper  │        │
│  │  Port 27017 │  │  Port 6379  │  │  Port 9092  │  │  Port 2181  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Grafana    │  │ Prometheus  │  │   Backend   │  │  Frontend   │        │
│  │  Port 3000  │  │  Port 9090  │  │  Port 5000  │  │  Port 3001  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Service Reference

### Core Services

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `stellio` | `stellio/stellio-api-gateway` | 8080 | NGSI-LD Context Broker |
| `fuseki` | `apache/jena-fuseki` | 3030 | SPARQL Triplestore |
| `neo4j` | `neo4j:5.12-community` | 7474, 7687 | Graph Database |
| `postgres` | `timescale/timescaledb` | 5432 | PostgreSQL + TimescaleDB |

### Data Services

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `mongodb` | `mongo:7.0` | 27017 | Document Store |
| `redis` | `redis:7-alpine` | 6379 | Cache & Message Queue |

### Messaging

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `kafka` | `confluentinc/cp-kafka` | 9092 | Event Streaming |
| `zookeeper` | `confluentinc/cp-zookeeper` | 2181 | Kafka Coordination |

### Monitoring

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `grafana` | `grafana/grafana` | 3000 | Dashboards |
| `prometheus` | `prom/prometheus` | 9090 | Metrics |

### Applications

| Service | Image | Ports | Description |
|---------|-------|-------|-------------|
| `backend` | Custom | 5000 | Express.js API |
| `frontend` | Custom | 3001 | React Application |

---

## 🗄️ Database Services

### PostgreSQL + TimescaleDB

```yaml
postgres:
  image: timescale/timescaledb:latest-pg15
  container_name: traffic-postgres
  ports:
    - "5432:5432"
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: password
    POSTGRES_DB: traffic_lod
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./init-stellio-dbs-timescale.sql:/docker-entrypoint-initdb.d/init.sql
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 10s
    timeout: 5s
    retries: 5
```

**Features:**
- TimescaleDB extension for time-series data
- PostGIS extension for spatial queries
- Automatic database initialization

**Connection:**
```bash
psql -h localhost -U postgres -d traffic_lod
```

---

### Neo4j Graph Database

```yaml
neo4j:
  image: neo4j:5.12-community
  container_name: traffic-neo4j
  ports:
    - "7474:7474"  # HTTP
    - "7687:7687"  # Bolt
  environment:
    NEO4J_AUTH: neo4j/password
    NEO4J_PLUGINS: '["apoc"]'
    NEO4J_dbms_memory_heap_max__size: 2G
  volumes:
    - neo4j_data:/data
    - neo4j_logs:/logs
```

**Features:**
- APOC plugin for advanced procedures
- Bolt protocol for applications
- HTTP interface for browser access

**Connection:**
```
http://localhost:7474/browser/
bolt://localhost:7687
```

---

### MongoDB Document Store

```yaml
mongodb:
  image: mongo:7.0
  container_name: traffic-mongodb
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: password
    MONGO_INITDB_DATABASE: traffic_data
  volumes:
    - mongodb_data:/data/db
```

**Features:**
- Document storage for JSON data
- Aggregation pipeline
- Change streams for real-time updates

**Connection:**
```bash
mongosh "mongodb://admin:password@localhost:27017"
```

---

### Redis Cache

```yaml
redis:
  image: redis:7-alpine
  container_name: traffic-redis
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes --requirepass password
  volumes:
    - redis_data:/data
```

**Features:**
- AOF persistence
- Pub/Sub messaging
- Cache with TTL support

**Connection:**
```bash
redis-cli -h localhost -a password
```

---

## 🌐 Semantic Web Services

### Stellio Context Broker

```yaml
stellio-api-gateway:
  image: stellio/stellio-api-gateway:2.5.0
  container_name: stellio-api-gateway
  ports:
    - "8080:8080"
  environment:
    SPRING_PROFILES_ACTIVE: docker
    SPRING_R2DBC_URL: r2dbc:postgresql://postgres:5432/stellio_search
  depends_on:
    - postgres
    - kafka
```

**Stellio Components:**
- `stellio-api-gateway` - API Gateway (8080)
- `stellio-search-service` - Entity search
- `stellio-subscription-service` - Subscriptions

**NGSI-LD API:**
```bash
# Get entities
curl http://localhost:8080/ngsi-ld/v1/entities?type=Device

# Create entity
curl -X POST http://localhost:8080/ngsi-ld/v1/entities \
  -H "Content-Type: application/ld+json" \
  -d '{"@context": "...", "id": "...", "type": "..."}'
```

---

### Apache Fuseki

```yaml
fuseki:
  image: apache/jena-fuseki:4.9.0
  container_name: traffic-fuseki
  ports:
    - "3030:3030"
  environment:
    ADMIN_PASSWORD: admin
    JVM_ARGS: -Xmx2g
  volumes:
    - fuseki_data:/fuseki
    - ./config/fuseki.ttl:/fuseki/configuration/traffic.ttl
```

**Features:**
- SPARQL 1.1 Query/Update
- TDB2 storage backend
- Web UI for queries

**SPARQL Endpoint:**
```bash
# Query
curl http://localhost:3030/traffic/query \
  -H "Content-Type: application/sparql-query" \
  -d "SELECT * WHERE { ?s ?p ?o } LIMIT 10"

# Update
curl http://localhost:3030/traffic/update \
  -H "Content-Type: application/sparql-update" \
  -d "INSERT DATA { <s> <p> <o> }"
```

---

## 📨 Messaging Services

### Apache Kafka

```yaml
kafka:
  image: confluentinc/cp-kafka:7.5.0
  container_name: traffic-kafka
  ports:
    - "9092:9092"
  environment:
    KAFKA_BROKER_ID: 1
    KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
  depends_on:
    - zookeeper

zookeeper:
  image: confluentinc/cp-zookeeper:7.5.0
  container_name: traffic-zookeeper
  ports:
    - "2181:2181"
  environment:
    ZOOKEEPER_CLIENT_PORT: 2181
    ZOOKEEPER_TICK_TIME: 2000
```

**Topics:**
- `traffic-events` - Traffic data events
- `alerts` - Alert notifications
- `entity-changes` - NGSI-LD entity changes

---

## 📊 Monitoring Stack

### Grafana

```yaml
grafana:
  image: grafana/grafana:10.1.0
  container_name: traffic-grafana
  ports:
    - "3000:3000"
  environment:
    GF_SECURITY_ADMIN_PASSWORD: admin
    GF_INSTALL_PLUGINS: grafana-clock-panel,grafana-simple-json-datasource
  volumes:
    - grafana_data:/var/lib/grafana
    - ./config/grafana_dashboard.json:/etc/grafana/provisioning/dashboards/traffic.json
```

**Access:** http://localhost:3000 (admin/admin)

### Prometheus

```yaml
prometheus:
  image: prom/prometheus:v2.47.0
  container_name: traffic-prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
```

**Access:** http://localhost:9090

---

## 🚀 Docker Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres neo4j redis

# Start with build
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f stellio-api-gateway
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop fuseki
```

### Maintenance

```bash
# Check service health
docker-compose ps

# Restart a service
docker-compose restart neo4j

# Scale a service
docker-compose up -d --scale backend=3

# Remove unused resources
docker system prune -a
```

---

## 📁 Volumes

| Volume | Path | Description |
|--------|------|-------------|
| `postgres_data` | `/var/lib/postgresql/data` | PostgreSQL data |
| `neo4j_data` | `/data` | Neo4j data |
| `mongodb_data` | `/data/db` | MongoDB data |
| `redis_data` | `/data` | Redis persistence |
| `fuseki_data` | `/fuseki` | Fuseki triplestore |
| `grafana_data` | `/var/lib/grafana` | Grafana dashboards |
| `prometheus_data` | `/prometheus` | Prometheus metrics |

---

## 🔐 Environment Variables

Create a `.env` file:

```bash
# Database credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=traffic_lod

# Neo4j
NEO4J_AUTH=neo4j/your-secure-password

# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your-secure-password

# Redis
REDIS_PASSWORD=your-secure-password

# Grafana
GF_SECURITY_ADMIN_PASSWORD=your-secure-password

# Fuseki
FUSEKI_ADMIN_PASSWORD=your-secure-password
```

---

## 🏥 Health Checks

All services include health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

Check health status:

```bash
# All services
docker-compose ps

# Specific service
docker inspect --format='{{.State.Health.Status}}' traffic-postgres
```

---

## 📚 Related Pages

- [[Installation]] - Setup instructions
- [[Configuration]] - Configuration reference
- [[System-Architecture]] - Architecture overview
