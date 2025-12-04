# NGSI-LD Entity Generation Workflow Documentation

## 📋 Executive Summary

This document provides a comprehensive analysis of the NGSI-LD entity generation workflow in the UIP - Urban Intelligence Platform traffic monitoring system. The project implements a sophisticated multi-agent pipeline that transforms raw sensor data into standardized NGSI-LD entities compliant with ETSI CIM 009 v1.6.1 specifications.

**Project**: UIP - Urban Intelligence Platform - Smart City Traffic Monitoring System  
**Standard**: NGSI-LD (ETSI CIM 009 v1.6.1)  
**Ontologies**: SOSA/SSN (W3C Semantic Sensor Network)  
**Created**: 2024-10-01  
**Version**: 2.0.0  
**Last Updated**: 2024-12-20

---

## 🎯 Overview

### What is NGSI-LD?

NGSI-LD (Next Generation Service Interfaces - Linked Data) is a standardized API and data model specification for context information management systems. It enables:
- **Semantic interoperability** through JSON-LD and RDF compatibility
- **Graph-based relationships** between entities using `@context` and linked data principles
- **Temporal queries** for time-series data analysis
- **Geospatial queries** using GeoJSON geometries
- **Subscriptions** for real-time event notifications

### Project Architecture

The system follows a **6-phase pipeline** orchestrated by `orchestrator.py`:

```
Phase 1: Data Collection
  ↓
Phase 2: Transformation (NGSI-LD + SOSA/SSN)  ← Primary NGSI-LD Generation
  ↓
Phase 3: Analytics (Computer Vision, Congestion, Accidents)  ← Entity Updates
  ↓
Phase 4: Publishing (Stellio, Neo4j, Fuseki)
  ↓
Phase 5: Monitoring & Validation
  ↓
Phase 6: Cleanup & Maintenance
```

---

## 🏗️ NGSI-LD Entity Generation Pipeline

### Phase 1: Data Collection

**Purpose**: Collect raw data from external sources

**Agents**:
- `camera_data_collector_agent.py` - Fetches camera metadata from CCTV API
- `realtime_data_collector_agent.py` - Collects real-time traffic data
- `citizen_ingestion_agent.py` - Ingests citizen reports from mobile apps

**Output Files**:
- `data/cameras_raw.json` - Raw camera metadata (~40 cameras in Ho Chi Minh City)
- `data/citizen_reports.json` - Citizen observations (accidents, potholes, etc.)

**Data Flow**:
```
External APIs → Collection Agents → Raw JSON Files
```

---

### Phase 2: Transformation (Core NGSI-LD Generation)

This is the **primary phase** where raw data is transformed into NGSI-LD entities.

#### 2.1 NGSI-LD Transformer Agent

**File**: `src/agents/transformation/ngsi_ld_transformer_agent.py` (969 lines)

**Purpose**: Configuration-driven transformation of raw data to NGSI-LD entities

**Key Classes**:
- `NGSILDTransformerAgent` - Main transformer orchestrator
- `TransformationEngine` - Applies value transformations (date formatting, boolean mapping, etc.)
- `NGSILDValidator` - Validates entities against NGSI-LD schema
- `EntityBatchProcessor` - Batch processing with concurrency control

**Configuration**: `config/ngsi_ld_mappings.yaml` (282 lines)

**Transformation Process**:
```python
# Pseudocode workflow
for each raw_record in cameras_raw.json:
    entity = {
        "id": f"urn:ngsi-ld:Camera:{record['id']}",
        "@type": "Camera",
        "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"]
    }
    
    # Apply property mappings from config
    for source_field, target_property in mappings:
        value = apply_transformations(record[source_field])
        entity[target_property] = create_property_object(value)
    
    # Add timestamps
    entity["dateObserved"] = {"type": "Property", "value": now_iso()}
    
    # Validate against NGSI-LD schema
    validate_entity(entity)
    
    ngsi_ld_entities.append(entity)
```

**Entity Types Generated**:
1. **Camera** (urn:ngsi-ld:Camera:{id})
   - Properties: `cameraName`, `location` (GeoProperty), `status`, `imageURL`
   - Relationships: `refRoadSegment`, `refArea`
   
2. **WeatherObserved** (urn:ngsi-ld:WeatherObserved:{id})
   - Properties: `temperature`, `humidity`, `windSpeed`, `atmosphericPressure`
   - Enriched from OpenWeatherMap API
   
3. **AirQualityObserved** (urn:ngsi-ld:AirQualityObserved:{id})
   - Properties: `pm25`, `pm10`, `no2`, `o3`, `aqi`
   - Enriched from OpenAQ API v3

**Output**: `data/ngsi_ld_entities.json` (~120 entities)

**Example Camera Entity**:
```json
{
  "id": "urn:ngsi-ld:Camera:CAM001_NGUYENTRAI",
  "type": "Camera",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://raw.githubusercontent.com/smart-data-models/dataModel.Device/master/context.jsonld"
  ],
  "cameraName": {
    "type": "Property",
    "value": "Camera Nguyễn Trãi - Điện Biên Phủ"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6682, 10.7627]
    }
  },
  "status": {
    "type": "Property",
    "value": "active"
  },
  "imageURL": {
    "type": "Property",
    "value": "https://giaothong.hochiminhcity.gov.vn/render/ImageHandler.ashx?id=CAM001"
  },
  "dateObserved": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-12-20T10:30:00Z"
    }
  },
  "refRoadSegment": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:RoadSegment:ROAD_NGUYENTRAI_01"
  }
}
```

#### 2.2 SOSA/SSN Semantic Mapper Agent

**File**: `src/agents/transformation/sosa_ssn_mapper_agent.py`

**Purpose**: Enrich NGSI-LD entities with SOSA/SSN sensor ontology annotations

**Semantic Enhancements**:
- Adds `sosa:observes` relationships (Camera observes TrafficFlow)
- Maps `sosa:hasSimpleResult` to observed properties
- Establishes `sosa:madeBySensor` provenance links
- Creates `ssn:System` hierarchies for sensor networks

**Output**: `data/sosa_enhanced_entities.json`

**Example SOSA Enhancement**:
```json
{
  "id": "urn:ngsi-ld:Camera:CAM001_NGUYENTRAI",
  "type": "Camera",
  "sosa:observes": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:ObservableProperty:TrafficFlow"
  },
  "sosa:hosts": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Sensor:VISION_SENSOR_CAM001"
  },
  "ssn:hasDeployment": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Deployment:HCMC_TRAFFIC_NETWORK"
  }
}
```

#### 2.3 Citizen Ingestion Agent

**File**: `src/agents/ingestion/citizen_ingestion_agent.py` (683 lines)

**Purpose**: Transform citizen reports into CitizenObservation NGSI-LD entities

**Key Classes**:
- `CitizenIngestionAgent` - Main ingestion orchestrator
- `NGSILDTransformer` - Citizen-specific NGSI-LD transformer
- `WeatherEnricher` - Contextual weather enrichment (OpenWeatherMap API)
- `AirQualityEnricher` - Air quality context (OpenAQ API v3)

**Entity Type Generated**:
- **CitizenObservation** (urn:ngsi-ld:CitizenObservation:{uuid})
  - Properties: `reportType`, `description`, `severity`, `status`, `verificationStatus`
  - GeoProperty: `location` (citizen's GPS coordinates)
  - Relationships: `refCamera` (nearest camera), `refReporter`

**Transformation Process**:
```python
class NGSILDTransformer:
    def transform_citizen_report(self, report: Dict) -> Dict:
        entity = {
            "id": f"urn:ngsi-ld:CitizenObservation:{report['report_id']}",
            "type": "CitizenObservation",
            "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
            
            "reportType": {
                "type": "Property",
                "value": report['report_type']  # 'accident', 'pothole', 'congestion'
            },
            
            "location": {
                "type": "GeoProperty",
                "value": {
                    "type": "Point",
                    "coordinates": [report['longitude'], report['latitude']]
                }
            },
            
            "severity": {
                "type": "Property",
                "value": report['severity'],  # 'low', 'medium', 'high', 'critical'
                "observedAt": report['timestamp']
            },
            
            "verificationStatus": {
                "type": "Property",
                "value": "pending"  # 'pending', 'verified', 'rejected'
            },
            
            "weatherContext": {
                "type": "Property",
                "value": weather_data  # From WeatherEnricher
            },
            
            "refCamera": {
                "type": "Relationship",
                "object": f"urn:ngsi-ld:Camera:{nearest_camera_id}"
            }
        }
        
        return entity
```

**Output**: `data/citizen_observations.json`

---

### Phase 3: Analytics (Entity Generation & Updates)

Analytics agents generate **new entities** or **update existing entities** based on real-time analysis.

#### 3.1 Computer Vision Analysis Agent

**File**: `src/agents/analytics/cv_analysis_agent.py` (1659 lines)

**Purpose**: YOLOX-powered vehicle detection that generates ItemFlowObserved entities

**Key Classes**:
- `CVAnalysisAgent` - Main CV orchestrator
- `YOLOXDetector` - Object detection (80 COCO classes)
- `AccidentDetector` - Specialized accident detection model
- `NGSILDEntityGenerator` - Entity creation from detection results
- `ImageDownloader` - Async batch image downloading
- `MetricsCalculator` - Traffic metrics (intensity, occupancy, speed, congestion)

**Entity Type Generated**:
- **ItemFlowObserved** (urn:ngsi-ld:ItemFlowObserved:{camera_id}:{timestamp})
  - Properties: `intensity`, `occupancy`, `averageVehicleSpeed`, `congestionLevel`, `vehicleTypes`
  - GeoProperty: `location`
  - Relationships: `refCamera`, `refRoadSegment`

**Computer Vision Pipeline**:
```python
class CVAnalysisAgent:
    async def analyze_camera_batch(self, cameras: List[Dict]) -> List[Dict]:
        # Step 1: Download images asynchronously
        image_tasks = [self.download_image(cam['imageURL']) for cam in cameras]
        images = await asyncio.gather(*image_tasks)
        
        # Step 2: Run YOLOX detection
        detections = self.yolo_detector.detect_batch(images)
        
        # Step 3: Calculate traffic metrics
        for cam, detection in zip(cameras, detections):
            metrics = self.calculate_metrics(detection)
            
            # Step 4: Generate ItemFlowObserved entity
            entity = NGSILDEntityGenerator.create_item_flow_observed(
                camera_ref=cam['id'],
                location=cam['location'],
                metrics=metrics,
                observed_at=now_iso()
            )
            
            ngsi_ld_entities.append(entity)
        
        return ngsi_ld_entities
```

**YOLOX Detection**:
```python
class YOLOXDetector:
    VEHICLE_CLASSES = [2, 3, 5, 7]  # car, motorcycle, bus, truck (COCO classes)
    
    def detect(self, image: np.ndarray) -> Dict:
        results = self.model.predict(image, conf=0.25, iou=0.45)
        
        vehicles = []
        for box in results[0].boxes:
            if box.cls in self.VEHICLE_CLASSES:
                vehicles.append({
                    'class': box.cls,
                    'confidence': box.conf,
                    'bbox': box.xyxy,
                    'class_name': self.model.names[box.cls]
                })
        
        return {
            'vehicle_count': len(vehicles),
            'vehicles': vehicles,
            'detections': results
        }
```

**ItemFlowObserved Entity Generation**:
```python
class NGSILDEntityGenerator:
    @staticmethod
    def create_item_flow_observed(
        camera_ref: str,
        location: Dict,
        metrics: Dict,
        observed_at: str
    ) -> Dict:
        return {
            "id": f"urn:ngsi-ld:ItemFlowObserved:{camera_ref}:{observed_at.replace(':', '-')}",
            "type": "ItemFlowObserved",
            "@context": [
                "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
                "https://raw.githubusercontent.com/smart-data-models/dataModel.Transportation/master/context.jsonld"
            ],
            
            "dateObserved": {
                "type": "Property",
                "value": {
                    "@type": "DateTime",
                    "@value": observed_at
                }
            },
            
            "location": {
                "type": "GeoProperty",
                "value": location  # GeoJSON Point
            },
            
            "intensity": {
                "type": "Property",
                "value": metrics['intensity'],  # vehicles per minute
                "unitCode": "C62"  # vehicles/minute
            },
            
            "occupancy": {
                "type": "Property",
                "value": metrics['occupancy'],  # percentage [0-1]
                "unitCode": "P1"  # percentage
            },
            
            "averageVehicleSpeed": {
                "type": "Property",
                "value": metrics['average_speed'],  # km/h (estimated)
                "unitCode": "KMH"
            },
            
            "congestionLevel": {
                "type": "Property",
                "value": metrics['congestion_level']  # 'low', 'medium', 'high', 'critical'
            },
            
            "vehicleTypes": {
                "type": "Property",
                "value": {
                    "car": metrics['vehicle_types']['car'],
                    "motorcycle": metrics['vehicle_types']['motorcycle'],
                    "bus": metrics['vehicle_types']['bus'],
                    "truck": metrics['vehicle_types']['truck']
                }
            },
            
            "refCamera": {
                "type": "Relationship",
                "object": f"urn:ngsi-ld:Camera:{camera_ref}"
            }
        }
```

**Citizen Report Verification**:
The CV agent also verifies citizen reports by analyzing images from nearby cameras:

```python
async def process_citizen_reports(self, reports: List[Dict]) -> List[Dict]:
    """Verify citizen reports using AI vision analysis"""
    for report in reports:
        # Find nearest camera
        camera = self.find_nearest_camera(report['location'])
        
        # Download and analyze camera image
        image = await self.download_image(camera['imageURL'])
        detections = self.yolo_detector.detect(image)
        
        # Verify accident claim
        if report['report_type'] == 'accident':
            is_accident = self.accident_detector.detect(image)
            confidence = self.accident_detector.get_confidence()
            
            # Update CitizenObservation entity in Stellio
            verification_result = {
                "verificationStatus": "verified" if is_accident else "rejected",
                "verificationConfidence": confidence,
                "verificationMethod": "YOLOX + AccidentDetector",
                "verifiedAt": now_iso()
            }
            
            # PATCH Stellio entity
            self.update_citizen_observation(report['id'], verification_result)
```

**Output**: `data/item_flow_observations.json` (~40 entities per cycle, updated every 5 minutes)

#### 3.2 Congestion Detection Agent

**File**: `src/agents/analytics/congestion_detection_agent.py` (738 lines)

**Purpose**: Evaluate traffic congestion and update Camera entity states

**Key Classes**:
- `CongestionDetectionAgent` - Main detector
- `CongestionDetector` - Rule-based evaluation
- `StateStore` - Persistent state tracking

**NGSI-LD Operations**:
- **Reads**: ItemFlowObserved entities from data/item_flow_observations.json
- **Updates**: Camera entities via PATCH to Stellio when congestion thresholds breached

**Congestion Evaluation**:
```python
class CongestionDetector:
    def evaluate(self, observation: Dict) -> Tuple[bool, Dict]:
        """
        Evaluate congestion based on ItemFlowObserved properties
        
        Thresholds (from config/congestion_config.yaml):
        - occupancy > 0.75
        - average_speed < 20 km/h
        - intensity > 30 vehicles/min
        """
        metrics = observation
        
        is_congested = (
            metrics['occupancy']['value'] > 0.75 and
            metrics['averageVehicleSpeed']['value'] < 20 and
            metrics['intensity']['value'] > 30
        )
        
        return is_congested, {
            'congestion_score': self.calculate_score(metrics),
            'primary_cause': self.identify_cause(metrics)
        }
```

**Camera Entity Update** (PATCH to Stellio):
```python
def update_camera_state(self, camera_ref: str, congested: bool, first_breach_ts: str):
    """Update Camera entity with congestion state"""
    
    # Only PATCH changed attributes (delta updates)
    patch_payload = {
        "congestionStatus": {
            "type": "Property",
            "value": "congested" if congested else "normal",
            "observedAt": now_iso()
        },
        "congestionStartTime": {
            "type": "Property",
            "value": first_breach_ts
        }
    }
    
    # PATCH request to Stellio
    url = f"{STELLIO_BASE_URL}/ngsi-ld/v1/entities/urn:ngsi-ld:Camera:{camera_ref}/attrs"
    response = requests.patch(url, json=patch_payload, headers={
        'Content-Type': 'application/json',
        'Link': '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"'
    })
```

**Output**: 
- Updates to existing Camera entities in Stellio
- `data/congestion_alerts.json` (new Alert entities)

#### 3.3 Accident Detection Agent

**File**: `src/agents/analytics/accident_detection_agent.py` (1039 lines)

**Purpose**: Anomaly detection for traffic accidents, creates RoadAccident entities

**Detection Methods**:
- `SpeedVarianceDetector` - Statistical speed variance analysis
- `OccupancySpikeDetector` - Rule-based occupancy spike detection
- `SuddenStopDetector` - Sudden speed drop detection
- `PatternAnomalyDetector` - Historical pattern deviation

**Entity Type Generated**:
- **RoadAccident** (urn:ngsi-ld:RoadAccident:{camera_id}:{timestamp})
  - Properties: `severity`, `accidentType`, `detectionConfidence`, `detectionMethod`, `status`
  - GeoProperty: `location`
  - Relationships: `refCamera`, `refRoadSegment`

**Accident Detection Pipeline**:
```python
class AccidentDetectionAgent:
    def detect_accidents(self, observations: List[Dict]) -> List[Dict]:
        """Multi-method accident detection"""
        
        accidents = []
        
        for camera_ref, obs_list in self.group_by_camera(observations):
            # Run all detection methods
            scores = {
                'speed_variance': self.speed_variance_detector.detect(obs_list),
                'occupancy_spike': self.occupancy_spike_detector.detect(obs_list),
                'sudden_stop': self.sudden_stop_detector.detect(obs_list),
                'pattern_anomaly': self.pattern_anomaly_detector.detect(obs_list)
            }
            
            # Weighted combination
            combined_score = sum(
                score * method['weight'] 
                for method, score in zip(self.methods, scores.values())
            )
            
            # Threshold check
            if combined_score > self.accident_threshold:
                severity = self.classify_severity(combined_score)
                
                # Create RoadAccident entity
                accident_entity = self.create_road_accident(
                    camera_ref=camera_ref,
                    severity=severity,
                    confidence=combined_score,
                    location=obs_list[-1]['location'],
                    observed_at=now_iso()
                )
                
                accidents.append(accident_entity)
        
        return accidents
```

**RoadAccident Entity**:
```json
{
  "id": "urn:ngsi-ld:RoadAccident:CAM001_NGUYENTRAI:2024-12-20T10-35-00Z",
  "type": "RoadAccident",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://raw.githubusercontent.com/smart-data-models/dataModel.Transportation/master/context.jsonld"
  ],
  
  "dateObserved": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2024-12-20T10:35:00Z"
    }
  },
  
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6682, 10.7627]
    }
  },
  
  "severity": {
    "type": "Property",
    "value": "moderate"
  },
  
  "accidentType": {
    "type": "Property",
    "value": "collision"
  },
  
  "detectionConfidence": {
    "type": "Property",
    "value": 0.87
  },
  
  "detectionMethod": {
    "type": "Property",
    "value": ["speed_variance", "occupancy_spike", "sudden_stop"]
  },
  
  "status": {
    "type": "Property",
    "value": "active"
  },
  
  "refCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:CAM001_NGUYENTRAI"
  },
  
  "refRoadSegment": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:RoadSegment:ROAD_NGUYENTRAI_01"
  }
}
```

**Output**: `data/accidents.json` (batch created in Stellio)

---

### Phase 4: Publishing (NGSI-LD Entity Storage)

#### 4.1 Stellio Context Broker

**Agent**: `src/agents/publishing/stellio_publisher_agent.py`

**Purpose**: Publish all NGSI-LD entities to Stellio Context Broker

**Stellio Configuration** (docker-compose.yml):
```yaml
stellio:
  image: stellio/stellio-context-broker:2.26.1
  ports:
    - "8080:8080"
  environment:
    - APPLICATION_TENANTS_0_NAME=default
    - SPRING_PROFILES_ACTIVE=default
```

**Publishing Operations**:
```python
class StellioPublisher:
    def publish_entities(self, entities: List[Dict]):
        """Batch upsert entities to Stellio"""
        
        for entity in entities:
            # POST (create) or PATCH (update)
            if self.entity_exists(entity['id']):
                self.patch_entity(entity['id'], entity)
            else:
                self.create_entity(entity)
    
    def create_entity(self, entity: Dict):
        """POST to /ngsi-ld/v1/entities"""
        response = requests.post(
            f"{STELLIO_BASE_URL}/ngsi-ld/v1/entities",
            json=entity,
            headers={
                'Content-Type': 'application/ld+json',
                'Link': '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"'
            }
        )
```

**Stellio Features Used**:
- **Temporal API**: Time-series queries for historical traffic data
- **Geospatial API**: Proximity queries (find cameras within radius)
- **Subscriptions**: Real-time notifications on entity changes
- **Batch Operations**: Efficient bulk entity creation

#### 4.2 NGSI-LD to RDF Conversion

**Agent**: `src/agents/transformation/ngsi_ld_to_rdf_agent.py`

**Purpose**: Convert NGSI-LD entities to RDF triples for Fuseki

**RDF Conversion**:
```python
class NGSILDToRDFAgent:
    def convert_to_rdf(self, entity: Dict) -> Graph:
        """Convert NGSI-LD entity to RDF graph"""
        
        g = Graph()
        
        # Entity URI
        entity_uri = URIRef(entity['id'])
        
        # Type assertion
        g.add((entity_uri, RDF.type, URIRef(f"https://example.org/{entity['type']}")))
        
        # Properties
        for key, value in entity.items():
            if value.get('type') == 'Property':
                predicate = URIRef(f"https://example.org/{key}")
                literal = Literal(value['value'])
                g.add((entity_uri, predicate, literal))
            
            elif value.get('type') == 'Relationship':
                predicate = URIRef(f"https://example.org/{key}")
                object_uri = URIRef(value['object'])
                g.add((entity_uri, predicate, object_uri))
            
            elif value.get('type') == 'GeoProperty':
                # Serialize as WKT
                coords = value['value']['coordinates']
                wkt = f"POINT({coords[0]} {coords[1]})"
                g.add((entity_uri, GEO.asWKT, Literal(wkt, datatype=GEO.wktLiteral)))
        
        return g
```

**Output**: RDF triples published to Apache Jena Fuseki for SPARQL queries

#### 4.3 Neo4j Graph Sync

**Agent**: `src/agents/publishing/neo4j_sync_agent.py`

**Purpose**: Sync NGSI-LD relationship graph to Neo4j property graph

**Cypher Query Generation**:
```cypher
// Create Camera node
MERGE (c:Camera {id: 'urn:ngsi-ld:Camera:CAM001_NGUYENTRAI'})
SET c.cameraName = 'Camera Nguyễn Trãi - Điện Biên Phủ',
    c.location = point({longitude: 106.6682, latitude: 10.7627}),
    c.status = 'active'

// Create RoadSegment node and relationship
MERGE (r:RoadSegment {id: 'urn:ngsi-ld:RoadSegment:ROAD_NGUYENTRAI_01'})
MERGE (c)-[:REF_ROAD_SEGMENT]->(r)
```

---

## 📊 Entity Type Summary

| Entity Type | Source | Agent | Count | Update Frequency |
|------------|--------|-------|-------|-----------------|
| **Camera** | CCTV API | ngsi_ld_transformer_agent | 40 | Daily |
| **WeatherObserved** | OpenWeatherMap | ngsi_ld_transformer_agent | 40 | Hourly |
| **AirQualityObserved** | OpenAQ | ngsi_ld_transformer_agent | 40 | Hourly |
| **ItemFlowObserved** | YOLOX CV | cv_analysis_agent | 40/cycle | 5 minutes |
| **CitizenObservation** | Mobile App | citizen_ingestion_agent | Variable | Real-time |
| **RoadAccident** | Anomaly Detection | accident_detection_agent | Variable | Real-time |
| **Alert** | Congestion/Accident | alert_dispatcher_agent | Variable | Real-time |

**Total Entities**: ~120 base entities + real-time updates

---

## 🔄 Data Flow Diagram

```
┌─────────────────────┐
│  External Sources   │
│  - CCTV API (40)    │
│  - OpenWeatherMap   │
│  - OpenAQ API       │
│  - Citizen App      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│         Phase 1: Data Collection                        │
│  - camera_data_collector_agent                          │
│  - citizen_ingestion_agent                              │
└──────────┬──────────────────────────────────────────────┘
           │
           ▼  cameras_raw.json, citizen_reports.json
┌─────────────────────────────────────────────────────────┐
│         Phase 2: NGSI-LD Transformation                 │
│  ┌────────────────────────────────────────┐             │
│  │ ngsi_ld_transformer_agent              │             │
│  │  - Camera (40)                         │             │
│  │  - WeatherObserved (40)                │             │
│  │  - AirQualityObserved (40)             │             │
│  └────────────┬───────────────────────────┘             │
│               │                                          │
│               ▼  ngsi_ld_entities.json                   │
│  ┌────────────────────────────────────────┐             │
│  │ sosa_ssn_mapper_agent                  │             │
│  │  + Sensor ontology annotations         │             │
│  └────────────┬───────────────────────────┘             │
│               │                                          │
│               ▼  sosa_enhanced_entities.json             │
│  ┌────────────────────────────────────────┐             │
│  │ citizen_ingestion_agent                │             │
│  │  - CitizenObservation (variable)       │             │
│  └────────────┬───────────────────────────┘             │
└───────────────┼──────────────────────────────────────────┘
                │
                ▼  All base entities created
┌─────────────────────────────────────────────────────────┐
│         Phase 3: Analytics (Entity Updates)             │
│  ┌────────────────────────────────────────┐             │
│  │ cv_analysis_agent (YOLOX)              │             │
│  │  - Downloads camera images             │             │
│  │  - Detects vehicles (car, bike, etc.)  │             │
│  │  - Calculates traffic metrics          │             │
│  │  → ItemFlowObserved (40/cycle)         │             │
│  │  - Verifies citizen reports            │             │
│  │  → PATCH CitizenObservation            │             │
│  └────────────┬───────────────────────────┘             │
│               │                                          │
│               ▼  item_flow_observations.json             │
│  ┌────────────────────────────────────────┐             │
│  │ congestion_detection_agent             │             │
│  │  - Reads ItemFlowObserved              │             │
│  │  - Evaluates congestion rules          │             │
│  │  → PATCH Camera.congestionStatus       │             │
│  │  → Creates Alert entities              │             │
│  └────────────┬───────────────────────────┘             │
│               │                                          │
│               ▼  congestion_alerts.json                  │
│  ┌────────────────────────────────────────┐             │
│  │ accident_detection_agent               │             │
│  │  - Multi-method anomaly detection      │             │
│  │  → RoadAccident (variable)             │             │
│  └────────────┬───────────────────────────┘             │
└───────────────┼──────────────────────────────────────────┘
                │
                ▼  accidents.json, alerts.json
┌─────────────────────────────────────────────────────────┐
│         Phase 4: Publishing                             │
│  ┌────────────────────────────────────────┐             │
│  │ stellio_publisher_agent                │             │
│  │  → POST/PATCH to Stellio               │             │
│  │  → Temporal & Geospatial API           │             │
│  └────────────┬───────────────────────────┘             │
│               │                                          │
│               ▼  Stellio Context Broker                  │
│  ┌────────────────────────────────────────┐             │
│  │ ngsi_ld_to_rdf_agent                   │             │
│  │  → Convert to RDF triples              │             │
│  │  → Publish to Fuseki                   │             │
│  └────────────┬───────────────────────────┘             │
│               │                                          │
│               ▼  Apache Jena Fuseki (SPARQL)             │
│  ┌────────────────────────────────────────┐             │
│  │ neo4j_sync_agent                       │             │
│  │  → Sync relationship graph             │             │
│  │  → Cypher queries                      │             │
│  └────────────┬───────────────────────────┘             │
└───────────────┼──────────────────────────────────────────┘
                │
                ▼  Neo4j Property Graph
┌─────────────────────────────────────────────────────────┐
│         Phase 5: Monitoring & Validation                │
│  - smart_data_models_validation_agent                   │
│  - performance_monitor_agent                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Configuration Files

### 1. NGSI-LD Mappings (`config/ngsi_ld_mappings.yaml`)

```yaml
entity_mappings:
  - entity_type: "Camera"
    uri_prefix: "urn:ngsi-ld:Camera:"
    id_field: "camera_id"
    
    property_mappings:
      - source_field: "name"
        target_property: "cameraName"
        value_type: "string"
      
      - source_field: "location"
        target_property: "location"
        value_type: "geoproperty"
        geo_format: "geojson"
      
      - source_field: "status"
        target_property: "status"
        value_type: "string"
        transform: "boolean_map"
        transform_params:
          true: "active"
          false: "inactive"
      
      - source_field: "image_url"
        target_property: "imageURL"
        value_type: "string"
    
    relationship_mappings:
      - source_field: "road_segment_id"
        target_relationship: "refRoadSegment"
        target_entity_type: "RoadSegment"
        uri_prefix: "urn:ngsi-ld:RoadSegment:"

contexts:
  - "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  - "https://raw.githubusercontent.com/smart-data-models/dataModel.Device/master/context.jsonld"
```

### 2. Workflow Configuration (`config/workflow.yaml`)

```yaml
phases:
  - phase: 2
    name: "Transformation"
    description: "Transform raw data to NGSI-LD and enhance with SOSA/SSN"
    
    agents:
      - name: "ngsi_ld_transformer_agent"
        module: "src.agents.transformation.ngsi_ld_transformer_agent"
        class: "NGSILDTransformerAgent"
        enabled: true
        priority: 1
        execution: "parallel"
        
        config:
          input_file: "data/cameras_enriched.json"
          output_file: "data/ngsi_ld_entities.json"
          mappings_config: "config/ngsi_ld_mappings.yaml"
          batch_size: 50
          validate: true
      
      - name: "sosa_ssn_mapper_agent"
        module: "src.agents.transformation.sosa_ssn_mapper_agent"
        class: "SOSASSNMapperAgent"
        enabled: true
        priority: 2
        execution: "sequential"
        depends_on: ["ngsi_ld_transformer_agent"]
        
        config:
          input_file: "data/ngsi_ld_entities.json"
          output_file: "data/sosa_enhanced_entities.json"

  - phase: 3
    name: "Analytics"
    description: "Computer vision analysis and anomaly detection"
    
    agents:
      - name: "cv_analysis_agent"
        module: "src.agents.analytics.cv_analysis_agent"
        class: "CVAnalysisAgent"
        enabled: true
        priority: 1
        execution: "parallel"
        
        config:
          input_cameras: "data/ngsi_ld_entities.json"
          output_file: "data/item_flow_observations.json"
          yolo_model: "yolox_x.pt"
          confidence_threshold: 0.25
          batch_size: 8
```

### 3. Congestion Config (`config/congestion_config.yaml`)

```yaml
congestion_detection:
  thresholds:
    occupancy: 0.75        # 75% occupancy
    average_speed: 20      # km/h
    intensity: 30          # vehicles/min
  
  rules:
    severity_mapping:
      low: [0.5, 0.7]
      medium: [0.7, 0.85]
      high: [0.85, 1.0]
  
  stellio:
    base_url: "http://localhost:8080"
    update_endpoint: "/ngsi-ld/v1/entities"
    batch_size: 10
```

---

## 🧪 Testing NGSI-LD Workflow

### Test Files

1. **test_citizen_complete_workflow.py** - End-to-end citizen report workflow
2. **test_congestion_full.py** - Full congestion detection pipeline
3. **test_jsonld_extraction.py** - JSON-LD context resolution
4. **test_citizen_with_real_image.py** - CV verification with real images

### Example Test: Verify NGSI-LD Entity Structure

```python
import json
import requests

def test_camera_entity_structure():
    """Verify Camera entity conforms to NGSI-LD spec"""
    
    # Load generated entity
    with open('data/ngsi_ld_entities.json') as f:
        entities = json.load(f)
        camera = next(e for e in entities if e['type'] == 'Camera')
    
    # Check required NGSI-LD fields
    assert 'id' in camera
    assert camera['id'].startswith('urn:ngsi-ld:')
    assert 'type' in camera
    assert '@context' in camera
    
    # Verify property structure
    assert camera['cameraName']['type'] == 'Property'
    assert 'value' in camera['cameraName']
    
    # Verify GeoProperty
    assert camera['location']['type'] == 'GeoProperty'
    assert camera['location']['value']['type'] == 'Point'
    assert len(camera['location']['value']['coordinates']) == 2
    
    # Verify Relationship
    assert camera['refRoadSegment']['type'] == 'Relationship'
    assert 'object' in camera['refRoadSegment']
    
    print("✅ Camera entity structure valid")

def test_stellio_query():
    """Test querying Stellio Context Broker"""
    
    # Query all Camera entities
    response = requests.get(
        'http://localhost:8080/ngsi-ld/v1/entities',
        params={'type': 'Camera'},
        headers={
            'Accept': 'application/ld+json',
            'Link': '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"'
        }
    )
    
    assert response.status_code == 200
    cameras = response.json()
    assert len(cameras) == 40
    
    print(f"✅ Stellio returned {len(cameras)} Camera entities")

def test_geospatial_query():
    """Test geospatial proximity query"""
    
    # Find cameras within 1km of center point
    response = requests.get(
        'http://localhost:8080/ngsi-ld/v1/entities',
        params={
            'type': 'Camera',
            'georel': 'near;maxDistance==1000',
            'geometry': 'Point',
            'coordinates': '[106.6682,10.7627]'
        },
        headers={'Accept': 'application/ld+json'}
    )
    
    assert response.status_code == 200
    nearby_cameras = response.json()
    
    print(f"✅ Found {len(nearby_cameras)} cameras within 1km")
```

---

## 📈 Key Metrics

### Entity Generation Statistics

- **Base Entities Created**: ~120 (Phase 2)
- **Real-time Entities/Hour**: ~480 ItemFlowObserved (40 cameras × 12 cycles/hour)
- **Citizen Reports/Day**: Variable (10-100)
- **Accidents Detected/Day**: Variable (0-10)
- **Congestion Alerts/Day**: Variable (5-50)

### Performance Metrics

- **NGSI-LD Transformation Time**: ~2 seconds (120 entities)
- **CV Analysis Time**: ~15 seconds (40 cameras with YOLOX)
- **Stellio POST Time**: ~50ms per entity
- **Total Pipeline Time**: ~5 minutes (all phases)

### Data Quality

- **NGSI-LD Schema Validation**: 100% (enforced by NGSILDValidator)
- **GeoProperty Validity**: 100% (WGS84 coordinates validated)
- **Context Resolution**: 100% (all @context URLs accessible)
- **Relationship Integrity**: 100% (all referenced entities exist)

---

## 🚀 Running the Workflow

### Start Infrastructure

```bash
# Start Docker services
docker-compose up -d

# Verify Stellio is running
curl http://localhost:8080/ngsi-ld/v1/entities?limit=1
```

### Execute Full Pipeline

```bash
# Run orchestrator (all 6 phases)
python orchestrator.py

# Or run specific phase
python orchestrator.py --phase 2  # NGSI-LD transformation only
```

### Verify NGSI-LD Entities

```bash
# Query Stellio
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=Camera" \
  -H "Accept: application/ld+json" \
  -H "Link: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel=\"http://www.w3.org/ns/json-ld#context\""

# Query Fuseki (SPARQL)
curl -X POST "http://localhost:3030/traffic/sparql" \
  -d "query=SELECT ?camera WHERE { ?camera a <Camera> }"
```

---

## 🔍 SPARQL Query Examples

### Find All Congested Cameras

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>
PREFIX ex: <https://example.org/>

SELECT ?camera ?name ?location ?congestionLevel
WHERE {
  ?camera a ex:Camera ;
          ex:cameraName ?name ;
          ex:location ?location ;
          ex:congestionStatus ?congestionStatus .
  
  FILTER(?congestionStatus = "congested")
}
```

### Find Recent Accidents Near Camera

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/>
PREFIX ex: <https://example.org/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>

SELECT ?accident ?severity ?dateObserved
WHERE {
  ?accident a ex:RoadAccident ;
            ex:refCamera <urn:ngsi-ld:Camera:CAM001_NGUYENTRAI> ;
            ex:severity ?severity ;
            ex:dateObserved ?dateObserved .
  
  FILTER(?dateObserved > "2024-12-20T00:00:00Z"^^xsd:dateTime)
}
ORDER BY DESC(?dateObserved)
LIMIT 10
```

---

## 📚 References

### Standards

- **NGSI-LD Specification**: [ETSI GS CIM 009 V1.6.1](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.06.01_60/gs_CIM009v010601p.pdf)
- **JSON-LD 1.1**: [W3C Recommendation](https://www.w3.org/TR/json-ld11/)
- **SOSA/SSN Ontology**: [W3C Recommendation](https://www.w3.org/TR/vocab-ssn/)
- **Smart Data Models**: [FIWARE Smart Data Models](https://smartdatamodels.org/)

### Tools

- **Stellio Context Broker**: [Documentation](https://stellio.readthedocs.io/)
- **Apache Jena Fuseki**: [Documentation](https://jena.apache.org/documentation/fuseki2/)
- **YOLOX**: [Megvii YOLOX GitHub](https://github.com/Megvii-BaseDetection/YOLOX)

### Project Files

- `orchestrator.py` - Main workflow orchestrator
- `config/workflow.yaml` - Phase configuration
- `config/ngsi_ld_mappings.yaml` - Entity mappings
- `docker-compose.yml` - Infrastructure stack

---

## 🎓 Conclusion

The UIP - Urban Intelligence Platform project implements a comprehensive NGSI-LD entity generation workflow that:

1. **Collects** raw data from 40+ traffic cameras and citizen reports
2. **Transforms** data into 120+ NGSI-LD entities using configuration-driven mappings
3. **Enhances** entities with semantic annotations (SOSA/SSN)
4. **Analyzes** real-time traffic using YOLOX computer vision
5. **Detects** congestion and accidents with multi-method anomaly detection
6. **Publishes** entities to Stellio Context Broker with temporal/geospatial capabilities
7. **Converts** to RDF triples for SPARQL queries in Fuseki
8. **Syncs** relationship graph to Neo4j for graph analytics

The system demonstrates **full compliance with NGSI-LD specifications** and provides a scalable, domain-agnostic architecture for smart city applications.

---

**Generated**: 2024-12-20  
**Version**: 1.0.0  
**Author**: UIP Team (Nguyen Nhat Quang, Nguyen Viet Hoang, Nguyen Dinh Anh Tuan)  
**License**: MIT
