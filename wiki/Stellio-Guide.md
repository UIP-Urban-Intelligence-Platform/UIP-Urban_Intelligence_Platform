<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Stellio-Guide.md
Module: Stellio Context Broker Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Complete guide to Stellio NGSI-LD Context Broker in UIP.
============================================================================
-->

# 🌟 Stellio Guide

Complete guide to Stellio NGSI-LD Context Broker in UIP - Urban Intelligence Platform.

---

## 📊 Overview

**Stellio** is a NGSI-LD compliant context broker that provides:

- 📋 **Entity Management** - CRUD operations for NGSI-LD entities
- 🔔 **Subscriptions** - Real-time notifications
- 📈 **Temporal Data** - Time-series entity storage
- 🔍 **Query API** - Complex entity queries

**Website**: [stellio.io](https://stellio.io/)  
**GitHub**: [stellio-hub/stellio-context-broker](https://github.com/stellio-hub/stellio-context-broker)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STELLIO ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Client Applications                               │   │
│  │  [Python Agents] [TypeScript Backend] [React Dashboard]              │   │
│  └────────────────────────────┬────────────────────────────────────────┘   │
│                               │                                             │
│                               ▼ HTTP/REST (Port 8080)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      STELLIO CONTEXT BROKER                          │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                      API Gateway                              │   │   │
│  │  │                    (Spring Cloud Gateway)                     │   │   │
│  │  └────────────────────────────┬─────────────────────────────────┘   │   │
│  │                               │                                      │   │
│  │  ┌──────────────┬─────────────┴─────────────┬──────────────────┐    │   │
│  │  │              │                           │                  │    │   │
│  │  ▼              ▼                           ▼                  ▼    │   │
│  │  ┌──────────┐  ┌─────────────┐  ┌────────────────┐  ┌──────────┐   │   │
│  │  │ Entity   │  │ Search      │  │ Subscription   │  │ Temporal │   │   │
│  │  │ Service  │  │ Service     │  │ Service        │  │ Service  │   │   │
│  │  └────┬─────┘  └──────┬──────┘  └───────┬────────┘  └────┬─────┘   │   │
│  │       │               │                 │                │          │   │
│  └───────┼───────────────┼─────────────────┼────────────────┼──────────┘   │
│          │               │                 │                │               │
│          ▼               ▼                 ▼                ▼               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL + TimescaleDB                          │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Entity Store │  │ Temporal DB  │  │ Subscription Store       │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Configuration

### Docker Compose

**File**: `docker-compose.yml`

```yaml
services:
  stellio-api-gateway:
    image: stellio/stellio-api-gateway:latest
    container_name: stellio-api-gateway
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
    depends_on:
      - stellio-search-service
      - stellio-subscription-service
    networks:
      - uip-network

  stellio-search-service:
    image: stellio/stellio-search-service:latest
    container_name: stellio-search-service
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_R2DBC_URL=r2dbc:postgresql://stellio-postgres:5432/stellio_search
      - SPRING_FLYWAY_URL=jdbc:postgresql://stellio-postgres:5432/stellio_search
      - SPRING_R2DBC_USERNAME=stellio
      - SPRING_R2DBC_PASSWORD=stellio_password
    depends_on:
      - stellio-postgres
      - stellio-kafka
    networks:
      - uip-network

  stellio-subscription-service:
    image: stellio/stellio-subscription-service:latest
    container_name: stellio-subscription-service
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_R2DBC_URL=r2dbc:postgresql://stellio-postgres:5432/stellio_subscription
      - SPRING_FLYWAY_URL=jdbc:postgresql://stellio-postgres:5432/stellio_subscription
      - SPRING_R2DBC_USERNAME=stellio
      - SPRING_R2DBC_PASSWORD=stellio_password
    depends_on:
      - stellio-postgres
      - stellio-kafka
    networks:
      - uip-network

  stellio-postgres:
    image: stellio/stellio-timescale-postgis:latest
    container_name: stellio-postgres
    environment:
      - POSTGRES_USER=stellio
      - POSTGRES_PASSWORD=stellio_password
      - POSTGRES_MULTIPLE_DATABASES=stellio_search,stellio_subscription
    volumes:
      - stellio-postgres-data:/var/lib/postgresql/data
    networks:
      - uip-network

  stellio-kafka:
    image: confluentinc/cp-kafka:latest
    container_name: stellio-kafka
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_ZOOKEEPER_CONNECT=stellio-zookeeper:2181
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://stellio-kafka:9092
      - KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
    depends_on:
      - stellio-zookeeper
    networks:
      - uip-network

  stellio-zookeeper:
    image: confluentinc/cp-zookeeper:latest
    container_name: stellio-zookeeper
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181
    networks:
      - uip-network

volumes:
  stellio-postgres-data:

networks:
  uip-network:
    driver: bridge
```

### Stellio Configuration

**File**: `config/stellio.yaml`

```yaml
# ============================================================================
# Stellio Context Broker Configuration
# ============================================================================

stellio:
  # Connection settings
  base_url: "http://localhost:8080"
  api_version: "v1"
  
  # Endpoints
  endpoints:
    entities: "/ngsi-ld/v1/entities"
    subscriptions: "/ngsi-ld/v1/subscriptions"
    temporal: "/ngsi-ld/v1/temporal/entities"
    types: "/ngsi-ld/v1/types"
    contexts: "/ngsi-ld/v1/jsonldContexts"
  
  # Timeouts (seconds)
  timeouts:
    connect: 10
    read: 30
    write: 30
  
  # Batch operations
  batch:
    max_entities: 100
    retry_attempts: 3
    retry_delay: 1000  # milliseconds
  
  # Context
  default_context:
    - "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
    - "https://smartdatamodels.org/context.jsonld"
```

---

## 📡 API Reference

### Entity Operations

#### Create Entity

```bash
POST /ngsi-ld/v1/entities
Content-Type: application/ld+json

{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "id": "urn:ngsi-ld:Camera:TTH001",
  "type": "Camera",
  "name": {
    "type": "Property",
    "value": "Camera TTH001"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6882, 10.7626]
    }
  }
}
```

#### Get Entity

```bash
GET /ngsi-ld/v1/entities/urn:ngsi-ld:Camera:TTH001
Accept: application/ld+json
```

#### Query Entities

```bash
# Get all cameras
GET /ngsi-ld/v1/entities?type=Camera

# Get cameras in area (geo-query)
GET /ngsi-ld/v1/entities?type=Camera&georel=near;maxDistance==1000&geometry=Point&coordinates=[106.68,10.76]

# Get entities with specific attribute value
GET /ngsi-ld/v1/entities?type=Camera&q=status=="online"
```

#### Update Entity

```bash
PATCH /ngsi-ld/v1/entities/urn:ngsi-ld:Camera:TTH001/attrs
Content-Type: application/ld+json

{
  "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
  "status": {
    "type": "Property",
    "value": "maintenance"
  }
}
```

#### Delete Entity

```bash
DELETE /ngsi-ld/v1/entities/urn:ngsi-ld:Camera:TTH001
```

### Batch Operations

#### Batch Create

```bash
POST /ngsi-ld/v1/entityOperations/create
Content-Type: application/ld+json

[
  {
    "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
    "id": "urn:ngsi-ld:Camera:TTH001",
    "type": "Camera",
    "name": {"type": "Property", "value": "Camera 1"}
  },
  {
    "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
    "id": "urn:ngsi-ld:Camera:TTH002",
    "type": "Camera",
    "name": {"type": "Property", "value": "Camera 2"}
  }
]
```

#### Batch Upsert

```bash
POST /ngsi-ld/v1/entityOperations/upsert
Content-Type: application/ld+json

[
  {
    "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
    "id": "urn:ngsi-ld:Camera:TTH001",
    "type": "Camera",
    "status": {"type": "Property", "value": "online"}
  }
]
```

### Subscriptions

#### Create Subscription

```bash
POST /ngsi-ld/v1/subscriptions
Content-Type: application/ld+json

{
  "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
  "id": "urn:ngsi-ld:Subscription:accidents",
  "type": "Subscription",
  "entities": [
    {
      "type": "TrafficAccident"
    }
  ],
  "watchedAttributes": ["severity", "status"],
  "notification": {
    "endpoint": {
      "uri": "http://backend:3001/webhooks/stellio",
      "accept": "application/json"
    }
  }
}
```

### Temporal Queries

#### Get Temporal Entity

```bash
GET /ngsi-ld/v1/temporal/entities/urn:ngsi-ld:TrafficFlowObserved:TTH001
    ?timerel=between
    &timeAt=2025-11-25T00:00:00Z
    &endTimeAt=2025-11-25T23:59:59Z
    &attrs=intensity,averageVehicleSpeed
```

---

## 🐍 Python Integration

### Entity Publisher Agent

```python
# src/agents/entity_publisher_agent.py
import aiohttp
from typing import List, Dict, Any

class EntityPublisherAgent:
    """Agent for publishing entities to Stellio."""
    
    def __init__(self, config_path: str = "config/stellio.yaml"):
        self.config = load_config(config_path)
        self.base_url = self.config["stellio"]["base_url"]
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, *args):
        await self.session.close()
    
    async def create_entity(self, entity: Dict[str, Any]) -> bool:
        """Create a single entity in Stellio."""
        url = f"{self.base_url}/ngsi-ld/v1/entities"
        headers = {"Content-Type": "application/ld+json"}
        
        async with self.session.post(url, json=entity, headers=headers) as resp:
            if resp.status == 201:
                logger.info(f"Created entity: {entity['id']}")
                return True
            elif resp.status == 409:
                logger.warning(f"Entity exists: {entity['id']}")
                return await self.update_entity(entity)
            else:
                error = await resp.text()
                logger.error(f"Failed to create entity: {error}")
                return False
    
    async def batch_upsert(self, entities: List[Dict[str, Any]]) -> Dict:
        """Batch upsert entities to Stellio."""
        url = f"{self.base_url}/ngsi-ld/v1/entityOperations/upsert"
        headers = {"Content-Type": "application/ld+json"}
        
        async with self.session.post(url, json=entities, headers=headers) as resp:
            result = await resp.json()
            
            return {
                "success": result.get("success", []),
                "errors": result.get("errors", [])
            }
    
    async def get_entity(self, entity_id: str) -> Dict[str, Any]:
        """Get entity by ID from Stellio."""
        url = f"{self.base_url}/ngsi-ld/v1/entities/{entity_id}"
        headers = {"Accept": "application/ld+json"}
        
        async with self.session.get(url, headers=headers) as resp:
            if resp.status == 200:
                return await resp.json()
            return None
    
    async def query_entities(
        self, 
        entity_type: str, 
        query: str = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Query entities from Stellio."""
        url = f"{self.base_url}/ngsi-ld/v1/entities"
        params = {
            "type": entity_type,
            "limit": limit
        }
        if query:
            params["q"] = query
        
        headers = {"Accept": "application/ld+json"}
        
        async with self.session.get(url, params=params, headers=headers) as resp:
            if resp.status == 200:
                return await resp.json()
            return []

# Usage example
async def main():
    async with EntityPublisherAgent() as publisher:
        # Create entity
        camera = {
            "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
            "id": "urn:ngsi-ld:Camera:TTH001",
            "type": "Camera",
            "name": {"type": "Property", "value": "Camera TTH001"}
        }
        
        await publisher.create_entity(camera)
        
        # Query cameras
        cameras = await publisher.query_entities("Camera")
        print(f"Found {len(cameras)} cameras")
```

---

## 📊 TypeScript Integration

### Stellio Service

```typescript
// src/services/stellioService.ts
import axios, { AxiosInstance } from 'axios';

interface Entity {
  id: string;
  type: string;
  [key: string]: any;
}

export class StellioService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.STELLIO_URL || 'http://localhost:8080';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/ld+json',
        'Accept': 'application/ld+json'
      }
    });
  }

  async createEntity(entity: Entity): Promise<boolean> {
    try {
      await this.client.post('/ngsi-ld/v1/entities', entity);
      return true;
    } catch (error: any) {
      if (error.response?.status === 409) {
        return this.updateEntity(entity);
      }
      throw error;
    }
  }

  async getEntity(entityId: string): Promise<Entity | null> {
    try {
      const response = await this.client.get(`/ngsi-ld/v1/entities/${entityId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async queryEntities(type: string, options?: {
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<Entity[]> {
    const params = new URLSearchParams();
    params.append('type', type);
    
    if (options?.q) params.append('q', options.q);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.client.get('/ngsi-ld/v1/entities', { params });
    return response.data;
  }

  async batchUpsert(entities: Entity[]): Promise<{
    success: string[];
    errors: any[];
  }> {
    const response = await this.client.post(
      '/ngsi-ld/v1/entityOperations/upsert',
      entities
    );
    return response.data;
  }

  async subscribe(subscription: {
    id: string;
    type: string;
    entities: Array<{ type: string }>;
    watchedAttributes?: string[];
    notificationEndpoint: string;
  }): Promise<boolean> {
    const payload = {
      '@context': ['https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'],
      id: subscription.id,
      type: 'Subscription',
      entities: subscription.entities,
      watchedAttributes: subscription.watchedAttributes,
      notification: {
        endpoint: {
          uri: subscription.notificationEndpoint,
          accept: 'application/json'
        }
      }
    };

    try {
      await this.client.post('/ngsi-ld/v1/subscriptions', payload);
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

---

## 🧪 Health Check

### Check Stellio Status

```bash
# Check API Gateway
curl http://localhost:8080/actuator/health

# Check entity types
curl http://localhost:8080/ngsi-ld/v1/types

# Count entities
curl "http://localhost:8080/ngsi-ld/v1/entities?type=Camera&count=true"
```

### Python Health Check

```python
async def check_stellio_health() -> dict:
    """Check Stellio context broker health."""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(
                "http://localhost:8080/actuator/health",
                timeout=aiohttp.ClientTimeout(total=5)
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return {
                        "status": "healthy",
                        "details": data
                    }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
```

---

## 🔗 Related Pages

- [[NGSI-LD-Guide]] - NGSI-LD standards
- [[Entity-Types]] - Entity documentation
- [[Data-Flow]] - Data pipeline
- [[Docker-Services]] - Docker configuration
- [[API-Reference]] - Full API documentation

---

<p align="center">
  <sub>Part of <a href="Home">UIP - Urban Intelligence Platform</a> Documentation</sub>
</p>
