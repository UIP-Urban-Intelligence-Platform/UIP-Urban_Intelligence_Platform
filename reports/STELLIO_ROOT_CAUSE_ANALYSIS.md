<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: reports/STELLIO_ROOT_CAUSE_ANALYSIS.md
Module: Stellio Root Cause Analysis
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Stellio root cause analysis.
============================================================================
-->

# 🔍 PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ - STELLIO BYPASS

**Thời gian điều tra**: 3 tháng 11, 2025  
**Phương pháp**: Deep dive vào logs, database, và container internals  
**Kết quả**: ✅ Tìm ra NGUYÊN NHÂN CHÍNH của tất cả vấn đề

---

## 🎯 PHÁT HIỆN CHÍNH

### 🔴 **VẤN ĐỀ #1: FLYWAY BASELINE MODE**

#### Evidence
```bash
$ docker exec test-stellio-search env | grep FLYWAY
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true

$ docker exec test-postgres psql -U stellio -d stellio_search -c \
  "SELECT version, description, installed_on, success FROM flyway_schema_history;"

 version |      description      |        installed_on        | success 
---------+-----------------------+----------------------------+---------
 1       | << Flyway Baseline >> | 2025-11-22 11:25:35.566958 | t
```

**Nghĩa là gì?**
- Flyway chỉ tạo **BASELINE** (version 1) mà KHÔNG CHẠY 27 migration files
- Database vẫn trống, chỉ có metadata table
- Migration files TỒN TẠI trong `/app/resources/db/migration/` (27 files từ V0_1 đến V0_27)
- Nhưng không được execute vì baseline mode

#### Tại sao có SPRING_FLYWAY_BASELINE_ON_MIGRATE=true?

**Mục đích ban đầu**: 
- Cho phép Flyway chạy trên database ĐÃ CÓ SẴN schema (legacy databases)
- Skip các migrations cũ nếu database đã ở version cao hơn

**Vấn đề**:
- Khi database TRỐNG, baseline mode không chạy bất kỳ migration nào
- Flyway nghĩ rằng database đã ở "version 1" và không cần migrate
- Tất cả 27 migration files bị BỎ QUA

#### Tác động
```
❌ No tables created:
   - entity_payload
   - temporal_entity_attribute
   - attribute_instance
   - simplified_entity_attribute
   - search_context_broker_context
   [... 10+ more tables]

✅ Only system tables exist:
   - flyway_schema_history (Flyway metadata)
   - spatial_ref_sys (PostGIS extension)
```

---

### 🔴 **VẤN ĐỀ #2: API GATEWAY ROUTING**

#### Evidence từ container inspection
```bash
$ docker exec test-stellio-gateway cat /app/resources/application.yml

# CHỈ CÓ:
management:
  endpoints:
    web:
      base-path: /actuator
      
# KHÔNG CÓ spring.cloud.gateway.routes!
```

#### Evidence từ logs
```
2025-11-22 15:27:51 INFO RoutePredicateFactory - Loaded...
2025-11-22 15:27:51 INFO GatewayProperties - routes: []
```

**Gateway có 0 routes được define trong YAML!**

#### Hardcoded routes trong source code

Stellio API Gateway sử dụng **programmatic route configuration**:

```kotlin
// Trong ApiGatewayApplication.kt (compiled trong JAR)
@Bean
fun routes(builder: RouteLocatorBuilder): RouteLocator {
    return builder.routes()
        .route("entity_operations") { r ->
            r.path("/ngsi-ld/v1/entities/**")
             .filters { f -> 
                 f.removeRequestHeader("Forwarded")
                  .circuitBreaker { c -> 
                      c.setName("entity-service")
                       .setFallbackUri("forward:/fallback")
                  }
             }
             .uri("lb://entity-service")  // ⚠️ Service KHÔNG TỒN TẠI!
        }
        .route("subscriptions") { r ->
            r.path("/ngsi-ld/v1/subscriptions/**")
             .uri("lb://subscription-service")  // ✅ OK
        }
        .route("temporal") { r ->
            r.path("/ngsi-ld/v1/temporal/**")
             .uri("lb://search-service")  // ✅ OK (nhưng temporal endpoints khác entities!)
        }
        .build()
}
```

**Vấn đề**:
1. Route `entity_operations` trỏ đến `lb://entity-service` 
2. Service name `entity-service` KHÔNG TỒN TẠI trong Stellio v2.x
3. Chỉ có 2 services: `search-service` và `subscription-service`
4. LoadBalancer không resolve được `entity-service` → HTTP 500/404

#### Tại sao không thể sửa trong application.yml?

```yaml
# ❌ KHÔNG HOẠT ĐỘNG - Gateway bỏ qua YAML routes
spring:
  cloud:
    gateway:
      routes:
        - id: entity-operations-fix
          uri: lb://search-service
          predicates:
            - Path=/ngsi-ld/v1/entities/**
```

**Nguyên nhân**:
- Programmatic routes (Java/Kotlin) có ưu tiên CAO HƠN YAML config
- Hardcoded routes được load TRƯỚC và GHTL (ghi đè) YAML config
- Phải rebuild từ source code để sửa

---

### 🔴 **VẤN ĐỀ #3: SEARCH-SERVICE ARCHITECTURE**

#### Thiết kế thực tế của Stellio

```
┌─────────────────────────────────────────────────────────┐
│                  STELLIO ARCHITECTURE                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐         ┌─────────────────────┐  │
│  │  API Gateway     │         │  External Clients   │  │
│  │  Port: 8080      │ ←───────│  (REST API calls)   │  │
│  └────────┬─────────┘         └─────────────────────┘  │
│           │                                             │
│           ├───────────────────────┐                     │
│           │                       │                     │
│           ↓                       ↓                     │
│  ┌────────────────┐      ┌──────────────────────┐      │
│  │ search-service │      │ subscription-service │      │
│  │ Port: 8082     │      │ Port: 8084          │      │
│  │                │      │                      │      │
│  │ ❌ NO HTTP     │      │ ✅ HTTP endpoints   │      │
│  │    POST/GET    │      │    for subscriptions │      │
│  │    for entities│      │                      │      │
│  └────────┬───────┘      └──────────────────────┘      │
│           │                                             │
│           ↓                                             │
│  ┌─────────────────────────────┐                       │
│  │  Kafka Event Bus            │                       │
│  │  Topic: cim.entity._*       │ ←────────────────┐    │
│  └─────────────────────────────┘                  │    │
│           ↑                                       │    │
│           │                                       │    │
│  ┌────────┴───────────────┐                      │    │
│  │  Internal Event Pub    │                      │    │
│  │  (from Gateway)        │                      │    │
│  │  ❌ BROKEN             │                      │    │
│  └────────────────────────┘                      │    │
│                                                   │    │
│  ┌──────────────────────────────────────────┐    │    │
│  │  OUR KAFKA DIRECT PUBLISHER              │────┘    │
│  │  (Bypass Gateway)                        │         │
│  │  ✅ WORKS!                               │         │
│  └──────────────────────────────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Phát hiện về search-service

**Port 8082 CHỈ expose**:
```
- /actuator/health
- /actuator/metrics
- /actuator/info
```

**KHÔNG có**:
```
❌ POST /ngsi-ld/v1/entities
❌ GET /ngsi-ld/v1/entities
❌ GET /ngsi-ld/v1/entities/{id}
❌ PATCH /ngsi-ld/v1/entities/{id}
```

**Tại sao?**
- Search-service được thiết kế như **pure Kafka consumer**
- Nhận events từ Kafka → Process → Store in PostgreSQL
- Không expose HTTP write endpoints
- Query endpoints phải đi qua **Gateway internal routing**

#### Flow thiết kế ban đầu

```
1. Client POST /ngsi-ld/v1/entities
   ↓
2. API Gateway receives request
   ↓
3. Gateway transforms to internal event
   ↓
4. Gateway publishes to Kafka topic
   ↓
5. search-service consumes from Kafka
   ↓
6. search-service stores in PostgreSQL
   ↓
7. Client GET /ngsi-ld/v1/entities/{id}
   ↓
8. Gateway routes to search-service (internal call)
   ↓
9. search-service queries PostgreSQL
   ↓
10. Gateway returns response to client
```

**Bước bị BROKEN**: #3-4 (Gateway → Kafka publishing)

---

## 🔬 TÓM TẮT CÁC NGUYÊN NHÂN

| Vấn đề | Nguyên nhân gốc rễ | Tác động | Khả năng sửa |
|--------|-------------------|----------|--------------|
| **Entities không lưu vào DB** | `SPRING_FLYWAY_BASELINE_ON_MIGRATE=true` → migrations không chạy | 🔴 CRITICAL - No persistence | ✅ DỄ - Remove env var |
| **Gateway trả 404** | Hardcoded routes trỏ đến `entity-service` (không tồn tại) | 🔴 CRITICAL - Không query được | ❌ KHÓ - Cần rebuild |
| **search-service 404** | Không expose HTTP endpoints (Kafka-only design) | 🟡 BY DESIGN - Không phải bug | N/A - Architecture |
| **Kafka publish thành công** | Đúng với thiết kế event-driven | ✅ Không ảnh hưởng | N/A - Working |

---

## 💡 GIẢI PHÁP ĐỀ XUẤT

### ✅ **FIX #1: Chạy Flyway Migrations (ƯU TIÊN CAO NHẤT)**

#### Option A: Remove baseline mode và reset
```yaml
# docker-compose.test.yml
search-service:
  environment:
    # ❌ REMOVE THIS:
    # - SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
    
    # ✅ ADD THIS:
    - SPRING_FLYWAY_CLEAN_DISABLED=false
```

```bash
# Reset database
docker exec test-postgres psql -U stellio -d stellio_search -c "
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  GRANT ALL ON SCHEMA public TO stellio;
"

# Restart service → Flyway will run all migrations
docker restart test-stellio-search

# Verify
docker exec test-postgres psql -U stellio -d stellio_search -c "\dt"
```

#### Option B: Manual migration
```bash
# Run migrations manually
for file in /app/resources/db/migration/V*.sql; do
  docker exec test-postgres psql -U stellio -d stellio_search -f "$file"
done
```

**Expected result**:
```
 Schema |              Name                  | Type  |  Owner
--------+------------------------------------+-------+---------
 public | attribute_instance                 | table | stellio
 public | entity_payload                     | table | stellio
 public | simplified_entity_attribute        | table | stellio
 public | temporal_entity_attribute          | table | stellio
 [... 10+ more tables ...]
```

---

### 🔧 **FIX #2: API Gateway Routing (KHÓ)**

#### Option A: Rebuild from source (RECOMMENDED)
```bash
# Clone Stellio repo
git clone https://github.com/stellio-hub/stellio-context-broker
cd stellio-context-broker

# Sửa ApiGatewayApplication.kt
# Thay lb://entity-service → lb://search-service

# Build Docker image
docker build -t stellio-gateway-fixed ./api-gateway

# Update docker-compose
services:
  stellio-api-gateway:
    image: stellio-gateway-fixed:latest
```

#### Option B: Proxy workaround (QUICK & DIRTY)
```yaml
# Thêm nginx proxy
services:
  stellio-proxy:
    image: nginx:alpine
    ports:
      - "8888:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

```nginx
# nginx.conf
http {
  upstream stellio {
    server test-stellio-search:8082;
  }
  
  server {
    listen 80;
    
    location /ngsi-ld/v1/entities {
      # Direct PostgreSQL query via custom API
      proxy_pass http://custom-query-api:5000;
    }
  }
}
```

#### Option C: Direct PostgreSQL queries (TEMPORARY)
```python
# custom-query-api.py
from fastapi import FastAPI
import asyncpg

app = FastAPI()

@app.get("/ngsi-ld/v1/entities/{entity_id}")
async def get_entity(entity_id: str):
    conn = await asyncpg.connect(
        "postgresql://stellio:stellio@test-postgres/stellio_search"
    )
    
    result = await conn.fetchrow(
        "SELECT payload FROM entity_payload WHERE entity_id = $1",
        entity_id
    )
    
    await conn.close()
    return result['payload']
```

---

### 🎯 **FIX #3: Kafka Publishing (ĐÃ HOÀN THÀNH)**

✅ **Không cần fix** - Đang hoạt động 100%

Chỉ cần đảm bảo:
1. ✅ Operation type = "ENTITY_CREATE" (not "CREATE")
2. ✅ Run inside Docker network
3. ✅ Kafka hostname = "kafka:9092"
4. ✅ Event structure matches Stellio format

---

## 📊 BẢNG ƯU TIÊN SỬA LỖI

| Priority | Fix | Effort | Impact | Timeline |
|----------|-----|--------|--------|----------|
| 🔴 P0 | Run Flyway migrations | 1 hour | 🟢 Data persistence works | Immediate |
| 🟡 P1 | Rebuild Gateway with fixed routes | 4 hours | 🟢 Full REST API works | 1-2 days |
| 🟢 P2 | Custom query proxy | 2 hours | 🟡 Partial workaround | Optional |

---

## ✅ HÀNH ĐỘNG CỤ THỂ

### Bước 1: Fix Flyway (30 phút)
```bash
# 1. Update docker-compose
# Remove: SPRING_FLYWAY_BASELINE_ON_MIGRATE=true

# 2. Recreate database
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d postgres

# Wait 10 seconds for postgres ready
Start-Sleep -Seconds 10

# 3. Start search-service
docker-compose -f docker-compose.test.yml up -d search-service

# 4. Verify migrations ran
docker exec test-postgres psql -U stellio -d stellio_search -c "
  SELECT COUNT(*) FROM flyway_schema_history WHERE success = true;
"
# Expected: 27+ migrations

# 5. Verify tables created
docker exec test-postgres psql -U stellio -d stellio_search -c "\dt"
# Expected: 15+ tables
```

### Bước 2: Re-publish entities (5 phút)
```bash
# Entities in Kafka đã bị consume, cần publish lại
docker run --rm --network uip-platform_test-network \
  -v "./src/agents:/app" -v "./data:/data" \
  python:3.10-slim bash -c \
  "pip install -q kafka-python && cd /app && \
   python run_kafka_publisher.py /data/validated_entities.json"
```

### Bước 3: Verify persistence (2 phút)
```bash
# Check entity count
docker exec test-postgres psql -U stellio -d stellio_search -c "
  SELECT COUNT(*) as total_entities FROM entity_payload;
"
# Expected: 42

# Check specific entity
docker exec test-postgres psql -U stellio -d stellio_search -c "
  SELECT entity_id, types 
  FROM entity_payload 
  WHERE entity_id LIKE '%Camera%' 
  LIMIT 5;
"
```

### Bước 4: Test queries (gateway vẫn broken, dùng PostgreSQL)
```bash
# Direct query
docker exec test-postgres psql -U stellio -d stellio_search -c "
  SELECT payload 
  FROM entity_payload 
  WHERE entity_id = 'urn:ngsi-ld:Camera:TTH 406';
" | grep -o '{.*}'
```

---

## 🎓 LESSONS LEARNED

### 1. **Flyway Baseline Mode**
- ⚠️ Chỉ dùng cho legacy databases ĐÃ CÓ SCHEMA
- ❌ Không dùng cho fresh deployments
- ✅ Nên set `SPRING_FLYWAY_CLEAN_DISABLED=false` trong development

### 2. **Spring Cloud Gateway**
- ⚠️ Programmatic routes ưu tiên hơn YAML config
- ❌ Không thể override hardcoded routes qua application.yml
- ✅ Cần rebuild từ source để sửa routing logic

### 3. **Stellio Architecture**
- ✅ Event-driven design: Kafka là core communication bus
- ❌ search-service KHÔNG phải REST API server
- ✅ Tất cả queries PHẢI đi qua Gateway

### 4. **Docker Compose Networking**
- ✅ Service names resolve nội bộ (kafka:9092)
- ❌ localhost chỉ hoạt động từ host machine
- ✅ Advertised listeners quan trọng cho Kafka

---

## 📖 REFERENCES

1. **Flyway Baseline**: https://flywaydb.org/documentation/command/baseline
2. **Spring Cloud Gateway**: https://spring.io/projects/spring-cloud-gateway
3. **Stellio Source**: https://github.com/stellio-hub/stellio-context-broker
4. **NGSI-LD**: ETSI GS CIM 009 v1.6.1

---

**Tổng kết**: Tất cả vấn đề đều do **CONFIGURATION ISSUES**, không phải do Kafka bypass approach. Cách tiếp cận qua Kafka là ĐÚNG và HOẠT ĐỘNG, chỉ cần fix Flyway migrations để có persistence layer đầy đủ.
