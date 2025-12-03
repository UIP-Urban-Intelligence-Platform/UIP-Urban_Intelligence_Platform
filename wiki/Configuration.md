# ⚙️ Configuration Guide

Complete configuration reference for Builder Layer End.

---

## 📁 Configuration Files

All configuration files are located in the `config/` directory:

```
config/
├── agents.yaml              # Agent configurations
├── workflow.yaml            # Workflow orchestration
├── data_sources.yaml        # Data source settings
├── stellio.yaml             # Stellio Context Broker
├── fuseki.yaml              # Apache Fuseki triplestore
├── neo4j_sync.yaml          # Neo4j graph sync
├── ngsi_ld_mappings.yaml    # NGSI-LD entity mappings
├── sosa_mappings.yaml       # SOSA ontology mappings
├── namespaces.yaml          # RDF namespace prefixes
├── subscriptions.yaml       # Event subscriptions
├── validation.yaml          # Data validation rules
├── cache_config.yaml        # Redis cache settings
├── pattern_config.yaml      # Pattern recognition
├── cv_config.yaml           # Computer vision
├── accident_config.yaml     # Accident detection
├── congestion_config.yaml   # Congestion analysis
├── alert_dispatcher_config.yaml  # Alert dispatch
├── health_check_config.yaml # Health monitoring
└── ... (more config files)
```

---

## 🔄 Workflow Configuration

### `workflow.yaml`

Defines the 9-phase execution workflow:

```yaml
workflow:
  name: "Traffic LOD Pipeline"
  version: "2.0.0"
  phases:
    - name: "ingestion"
      agents:
        - camera_ingestion_agent
        - weather_enrichment_agent
        - air_quality_enrichment_agent
      parallel: true
      timeout: 300
      
    - name: "processing"
      agents:
        - cv_analysis_agent
        - pattern_recognition_agent
      parallel: true
      timeout: 600
      
    # ... more phases
```

**Configuration Options:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Phase name |
| `agents` | array | List of agents to run |
| `parallel` | boolean | Run agents in parallel |
| `timeout` | integer | Phase timeout in seconds |
| `depends_on` | array | Dependent phases |
| `retry` | integer | Retry count on failure |

---

## 📊 Data Sources Configuration

### `data_sources.yaml`

External data source settings:

```yaml
# Camera data source
cameras:
  source_file: "data/cameras_raw.json"
  output_file: "data/cameras_updated.json"
  refresh_interval: 30  # seconds
  batch_size: 50
  request_timeout: 30
  max_retries: 2
  url_template: "https://traffic-api.example.com/camera"

# External APIs
external_apis:
  openweathermap:
    base_url: "https://api.openweathermap.org/data/2.5/weather"
    api_key: "${OPENWEATHERMAP_API_KEY}"
    rate_limit: 10  # requests per minute
    timeout: 10
    cache_ttl: 600
    enabled: true

  air_quality:
    source: "openweathermap"
    base_url: "https://api.openweathermap.org/data/2.5/air_pollution"
    api_key: "${OPENWEATHERMAP_API_KEY}"
    rate_limit: 10
    timeout: 10
    cache_ttl: 600
    enabled: true

# Geo-matching
geo_match_radius: 25000  # meters

# Batch processing
batch_size: 5
max_concurrent_requests: 2
request_delay: 3.0  # seconds
batch_delay: 10.0   # seconds
```

**API Key Environment Variables:**

```bash
OPENWEATHERMAP_API_KEY=your-key-here
OPENAQ_API_KEY=your-key-here
```

---

## 🌐 Stellio Context Broker

### `stellio.yaml`

NGSI-LD Context Broker configuration:

```yaml
stellio:
  host: "localhost"
  port: 8080
  base_path: "/ngsi-ld/v1"
  
  # Authentication (optional)
  auth:
    enabled: false
    type: "bearer"
    token: "${STELLIO_TOKEN}"
  
  # Context URL
  context:
    - "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
    - "https://smartdatamodels.org/context.jsonld"
  
  # Connection settings
  connection:
    timeout: 30
    max_retries: 3
    retry_delay: 1.0
  
  # Entity types
  entity_types:
    - TrafficFlowObserved
    - WeatherObserved
    - AirQualityObserved
    - Device
    - Vehicle
```

---

## 📚 Apache Fuseki Triplestore

### `fuseki.yaml`

SPARQL endpoint configuration:

```yaml
fuseki:
  host: "localhost"
  port: 3030
  dataset: "traffic"
  
  endpoints:
    query: "/traffic/query"
    update: "/traffic/update"
    data: "/traffic/data"
  
  # Authentication
  auth:
    enabled: true
    username: "${FUSEKI_USERNAME}"
    password: "${FUSEKI_PASSWORD}"
  
  # Query settings
  query:
    timeout: 60000  # ms
    max_results: 10000
  
  # Inference
  inference:
    enabled: true
    reasoner: "OWL_MEM_TRANS_INF"
```

---

## 🔵 Neo4j Graph Database

### `neo4j_sync.yaml`

Graph synchronization settings:

```yaml
neo4j:
  uri: "bolt://localhost:7687"
  username: "${NEO4J_USER}"
  password: "${NEO4J_PASSWORD}"
  database: "neo4j"
  
  sync:
    enabled: true
    interval: 60  # seconds
    batch_size: 1000
  
  # Node labels
  labels:
    camera: "Camera"
    sensor: "Sensor"
    road: "Road"
    junction: "Junction"
    observation: "Observation"
  
  # Relationship types
  relationships:
    located_at: "LOCATED_AT"
    connected_to: "CONNECTED_TO"
    observed_by: "OBSERVED_BY"
    affects: "AFFECTS"
```

---

## 🗺️ NGSI-LD Mappings

### `ngsi_ld_mappings.yaml`

Entity type mappings:

```yaml
mappings:
  camera:
    type: "Device"
    attributes:
      id: "id"
      name: "name"
      location:
        type: "GeoProperty"
        mapping: "location"
      status:
        type: "Property"
        mapping: "status"
      dateObserved:
        type: "Property"
        mapping: "timestamp"

  traffic_flow:
    type: "TrafficFlowObserved"
    attributes:
      intensity:
        type: "Property"
        unitCode: "VH"
      speed:
        type: "Property"
        unitCode: "KMH"
      occupancy:
        type: "Property"
        unitCode: "P1"

  weather:
    type: "WeatherObserved"
    attributes:
      temperature:
        type: "Property"
        unitCode: "CEL"
      humidity:
        type: "Property"
        unitCode: "P1"
      windSpeed:
        type: "Property"
        unitCode: "MTS"
```

---

## 🔬 SOSA Ontology Mappings

### `sosa_mappings.yaml`

Sensor observation mappings:

```yaml
sosa:
  prefixes:
    sosa: "http://www.w3.org/ns/sosa/"
    ssn: "http://www.w3.org/ns/ssn/"
    
  observation:
    class: "sosa:Observation"
    properties:
      madeBySensor: "sosa:madeBySensor"
      observedProperty: "sosa:observedProperty"
      hasResult: "sosa:hasResult"
      resultTime: "sosa:resultTime"
      phenomenonTime: "sosa:phenomenonTime"
      
  sensor:
    class: "sosa:Sensor"
    properties:
      observes: "sosa:observes"
      isHostedBy: "sosa:isHostedBy"
```

---

## 📮 Subscriptions

### `subscriptions.yaml`

Event subscription configuration:

```yaml
subscriptions:
  traffic_alerts:
    type: "Subscription"
    entities:
      - type: "TrafficFlowObserved"
    watchedAttributes:
      - "intensity"
      - "congestionLevel"
    q: "congestionLevel>0.7"
    notification:
      endpoint: "http://localhost:5000/api/alerts"
      format: "normalized"
      
  accident_alerts:
    type: "Subscription"
    entities:
      - type: "AccidentObserved"
    notification:
      endpoint: "http://localhost:5000/api/accidents/notify"
      format: "normalized"
```

---

## ✅ Validation Rules

### `validation.yaml`

Data validation configuration:

```yaml
validation:
  rules:
    temperature:
      type: "number"
      min: -50
      max: 60
      required: true
      
    humidity:
      type: "number"
      min: 0
      max: 100
      required: true
      
    coordinates:
      type: "array"
      items: "number"
      minItems: 2
      maxItems: 2
      
    timestamp:
      type: "string"
      format: "date-time"
      required: true
      
  actions:
    on_invalid: "reject"  # reject, fix, log
    log_level: "warning"
```

---

## 🗄️ Cache Configuration

### `cache_config.yaml`

Redis cache settings:

```yaml
cache:
  redis:
    host: "localhost"
    port: 6379
    password: "${REDIS_PASSWORD}"
    db: 0
    
  ttl:
    default: 300  # seconds
    weather: 600
    traffic: 60
    entities: 180
    
  strategies:
    weather: "cache-first"
    traffic: "stale-while-revalidate"
    entities: "network-first"
    
  invalidation:
    enabled: true
    patterns:
      - "traffic:*"
      - "weather:*"
```

---

## 🎯 Pattern Recognition

### `pattern_config.yaml`

Pattern detection settings:

```yaml
patterns:
  congestion:
    threshold: 0.7
    min_duration: 300  # seconds
    clustering:
      algorithm: "DBSCAN"
      eps: 0.5
      min_samples: 3
      
  anomaly:
    sensitivity: 0.8
    window_size: 60  # minutes
    z_score_threshold: 3.0
    
  temporal:
    peak_hours:
      morning: [7, 9]
      evening: [17, 19]
    weekend_factor: 0.6
```

---

## 👁️ Computer Vision

### `cv_config.yaml`

Computer vision settings:

```yaml
cv:
  model:
    name: "yolox"
    weights: "assets/models/yolox_l.pth"
    confidence_threshold: 0.5
    nms_threshold: 0.4
    
  detection:
    classes:
      - car
      - truck
      - bus
      - motorcycle
      - bicycle
      - pedestrian
      
  tracking:
    algorithm: "SORT"
    max_age: 30
    min_hits: 3
    
  processing:
    batch_size: 8
    resize: [640, 640]
    normalize: true
```

---

## 🚨 Alert Dispatcher

### `alert_dispatcher_config.yaml`

Alert dispatch configuration:

```yaml
alerts:
  channels:
    - type: "webhook"
      url: "${ALERT_WEBHOOK_URL}"
      enabled: true
      
    - type: "email"
      smtp_host: "${SMTP_HOST}"
      smtp_port: 587
      enabled: false
      
  severity_levels:
    critical:
      priority: 1
      channels: ["webhook", "email"]
    high:
      priority: 2
      channels: ["webhook"]
    medium:
      priority: 3
      channels: ["webhook"]
      
  throttling:
    enabled: true
    window: 300  # seconds
    max_alerts: 10
```

---

## 🏥 Health Check

### `health_check_config.yaml`

Health monitoring configuration:

```yaml
health:
  interval: 30  # seconds
  timeout: 10
  
  checks:
    - name: "database"
      type: "postgres"
      critical: true
      
    - name: "redis"
      type: "redis"
      critical: true
      
    - name: "stellio"
      type: "http"
      url: "http://localhost:8080/actuator/health"
      critical: true
      
    - name: "fuseki"
      type: "http"
      url: "http://localhost:3030/$/ping"
      critical: false
      
  notifications:
    on_failure: true
    on_recovery: true
```

---

## 🔐 Environment Variables

Required environment variables:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=traffic_lod

# Neo4j
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Redis
REDIS_PASSWORD=password

# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password

# External APIs
OPENWEATHERMAP_API_KEY=your-key
OPENAQ_API_KEY=your-key

# Fuseki
FUSEKI_USERNAME=admin
FUSEKI_PASSWORD=password

# Application
LOG_LEVEL=INFO
DEBUG=false
```

---

## 📚 Related Pages

- [[Installation]] - Setup instructions
- [[Docker-Services]] - Container configuration
- [[API-Reference]] - API documentation
