<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Performance-Tuning.md
Module: Performance Optimization Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-12-08
Version: 1.0.0
License: MIT

Description:
  Comprehensive performance tuning and optimization guide for UIP
  development and production environments.
============================================================================
-->
# ⚡ Performance Tuning

Comprehensive performance optimization guide for UIP - Urban Intelligence Platform.

---

## 📊 Performance Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      UIP Performance Metrics                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Target Metrics:                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Response Time   │  │ Throughput      │  │ Resource Usage  │             │
│  │ < 200ms (API)   │  │ 1000 req/s      │  │ < 4GB RAM       │             │
│  │ < 50ms (cache)  │  │ 100 agents/min  │  │ < 50% CPU       │             │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘             │
│                                                                             │
│  Critical Paths:                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ Camera Feed → CV Analysis → Pattern Detection → Stellio Publish    │  │
│  │     10ms         50ms            30ms              100ms            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🐍 Python Backend Optimization

### Async/Await Best Practices

```python
# ✅ Good: Concurrent I/O operations
import asyncio
import aiohttp

async def fetch_all_cameras(camera_ids: list[str]) -> list[dict]:
    """Fetch multiple cameras concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_camera(session, cam_id) for cam_id in camera_ids]
        return await asyncio.gather(*tasks)

async def fetch_camera(session: aiohttp.ClientSession, camera_id: str) -> dict:
    async with session.get(f"{STELLIO_URL}/entities/{camera_id}") as response:
        return await response.json()

# ❌ Bad: Sequential I/O
async def fetch_all_cameras_slow(camera_ids: list[str]) -> list[dict]:
    results = []
    for cam_id in camera_ids:
        result = await fetch_camera_single(cam_id)  # Waits for each one
        results.append(result)
    return results
```

### Connection Pooling

```python
# Database connection pooling
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,           # Base pool size
    max_overflow=30,        # Additional connections when needed
    pool_pre_ping=True,     # Verify connections before use
    pool_recycle=3600,      # Recycle connections after 1 hour
    echo=False              # Disable SQL logging in production
)

async_session = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# MongoDB connection pooling
from motor.motor_asyncio import AsyncIOMotorClient

mongo_client = AsyncIOMotorClient(
    MONGODB_URL,
    maxPoolSize=100,
    minPoolSize=10,
    maxIdleTimeMS=30000,
    waitQueueTimeoutMS=5000
)
```

### Memory Optimization

```python
# Use generators for large datasets
def process_large_dataset(filepath: str):
    """Process file line by line without loading all into memory."""
    with open(filepath, 'r') as f:
        for line in f:
            yield process_line(line)

# Use __slots__ for frequently created objects
class CameraObservation:
    __slots__ = ['camera_id', 'timestamp', 'vehicle_count', 'speed_avg']
    
    def __init__(self, camera_id: str, timestamp: float, 
                 vehicle_count: int, speed_avg: float):
        self.camera_id = camera_id
        self.timestamp = timestamp
        self.vehicle_count = vehicle_count
        self.speed_avg = speed_avg

# Use dataclasses with slots (Python 3.10+)
from dataclasses import dataclass

@dataclass(slots=True)
class TrafficPattern:
    pattern_id: str
    camera_ids: list[str]
    congestion_level: float
    timestamp: float
```

### CPU Optimization

```python
# Use ProcessPoolExecutor for CPU-bound tasks
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

def cpu_intensive_analysis(frame_data: bytes) -> dict:
    """CPU-bound image analysis."""
    # Heavy computation here
    return analysis_result

async def process_frames_parallel(frames: list[bytes]) -> list[dict]:
    """Process frames in parallel using multiple CPU cores."""
    cpu_count = multiprocessing.cpu_count()
    with ProcessPoolExecutor(max_workers=cpu_count) as executor:
        loop = asyncio.get_event_loop()
        tasks = [
            loop.run_in_executor(executor, cpu_intensive_analysis, frame)
            for frame in frames
        ]
        return await asyncio.gather(*tasks)
```

---

## 🗄️ Database Optimization

### PostgreSQL/TimescaleDB

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_observations_camera_time 
ON observations (camera_id, observed_at DESC);

CREATE INDEX idx_observations_location 
ON observations USING GIST (location);

-- Partition large tables by time (TimescaleDB)
SELECT create_hypertable('observations', 'observed_at', 
    chunk_time_interval => INTERVAL '1 day');

-- Enable compression for old data
ALTER TABLE observations 
SET (timescaledb.compress, 
     timescaledb.compress_segmentby = 'camera_id');

SELECT add_compression_policy('observations', INTERVAL '7 days');

-- Query optimization with EXPLAIN ANALYZE
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT camera_id, AVG(vehicle_count) 
FROM observations 
WHERE observed_at > NOW() - INTERVAL '1 hour'
GROUP BY camera_id;
```

### MongoDB

```javascript
// Create compound indexes
db.observations.createIndex(
    { "camera_id": 1, "timestamp": -1 },
    { background: true }
);

db.observations.createIndex(
    { "location": "2dsphere" },
    { background: true }
);

// Use aggregation pipeline efficiently
db.observations.aggregate([
    { $match: { 
        timestamp: { $gte: ISODate("2025-12-08T00:00:00Z") }
    }},
    { $group: {
        _id: "$camera_id",
        avgSpeed: { $avg: "$speed" },
        count: { $sum: 1 }
    }},
    { $sort: { avgSpeed: -1 }},
    { $limit: 100 }
], { allowDiskUse: true });

// Enable profiling to find slow queries
db.setProfilingLevel(1, { slowms: 100 });
db.system.profile.find().sort({ ts: -1 }).limit(10);
```

### Redis Caching

```python
import redis.asyncio as redis
import json
from functools import wraps

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True,
    max_connections=50
)

def cache_result(ttl: int = 300):
    """Cache function results in Redis."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # Try to get from cache
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Compute and cache
            result = await func(*args, **kwargs)
            await redis_client.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache_result(ttl=60)
async def get_traffic_summary(region_id: str) -> dict:
    """Get traffic summary with 60s cache."""
    # Expensive computation
    return await compute_traffic_summary(region_id)
```

---

## 🌐 API Performance

### FastAPI Optimization

```python
from fastapi import FastAPI, Depends
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import ORJSONResponse

app = FastAPI(
    default_response_class=ORJSONResponse,  # Faster JSON serialization
)

# Enable gzip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Connection pooling middleware
@app.on_event("startup")
async def startup():
    app.state.db_pool = await create_db_pool()
    app.state.redis = await create_redis_pool()

@app.on_event("shutdown")
async def shutdown():
    await app.state.db_pool.close()
    await app.state.redis.close()

# Use dependency injection for connections
async def get_db():
    async with app.state.db_pool.acquire() as conn:
        yield conn

@app.get("/cameras/{camera_id}")
async def get_camera(camera_id: str, db=Depends(get_db)):
    return await db.fetch_one(
        "SELECT * FROM cameras WHERE id = $1", camera_id
    )
```

### Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/traffic")
@limiter.limit("100/minute")
async def get_traffic(request: Request):
    return await fetch_traffic_data()

# Tiered rate limiting
@app.get("/api/heavy-analysis")
@limiter.limit("10/minute")
async def heavy_analysis(request: Request):
    return await perform_heavy_analysis()
```

### Response Optimization

```python
from fastapi import Query
from pydantic import BaseModel
from typing import Optional

class PaginatedResponse(BaseModel):
    data: list
    total: int
    page: int
    page_size: int
    has_next: bool

@app.get("/observations", response_model=PaginatedResponse)
async def get_observations(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),  # Limit max page size
    fields: Optional[str] = None  # Field selection
):
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Build query with only requested fields
    selected_fields = fields.split(",") if fields else ["*"]
    
    data = await db.fetch_all(
        f"SELECT {','.join(selected_fields)} FROM observations "
        f"LIMIT {page_size} OFFSET {offset}"
    )
    
    total = await db.fetch_val("SELECT COUNT(*) FROM observations")
    
    return PaginatedResponse(
        data=data,
        total=total,
        page=page,
        page_size=page_size,
        has_next=(offset + page_size) < total
    )
```

---

## 🐳 Docker Performance

### Resource Limits

```yaml
# docker-compose.yml
services:
  backend:
    image: uip-backend
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    
  stellio:
    image: stellio/stellio-context-broker
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 4G
    environment:
      JAVA_OPTS: "-Xms1g -Xmx3g -XX:+UseG1GC"
```

### Multi-Stage Builds

```dockerfile
# Dockerfile - optimized for production
# Stage 1: Build
FROM python:3.11-slim as builder

WORKDIR /app
RUN pip install --no-cache-dir poetry

COPY pyproject.toml poetry.lock ./
RUN poetry export -f requirements.txt --output requirements.txt

# Stage 2: Production
FROM python:3.11-slim

WORKDIR /app

# Install only production dependencies
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only necessary files
COPY src/ ./src/
COPY config/ ./config/

# Run as non-root user
RUN useradd -m appuser
USER appuser

CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "5000"]
```

---

## 📈 Monitoring Performance

### Key Metrics to Track

```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Request metrics
REQUEST_COUNT = Counter(
    'uip_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'uip_request_latency_seconds',
    'Request latency',
    ['method', 'endpoint'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

# Agent metrics
AGENT_PROCESSING_TIME = Histogram(
    'uip_agent_processing_seconds',
    'Agent processing time',
    ['agent_name']
)

ACTIVE_AGENTS = Gauge(
    'uip_active_agents',
    'Number of active agents'
)

# Database metrics
DB_QUERY_TIME = Histogram(
    'uip_db_query_seconds',
    'Database query time',
    ['operation', 'table']
)

# Middleware to track metrics
@app.middleware("http")
async def track_metrics(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response
```

### Grafana Dashboard Queries

```promql
# API Response Time (P95)
histogram_quantile(0.95, 
    sum(rate(uip_request_latency_seconds_bucket[5m])) by (le, endpoint)
)

# Requests per Second
sum(rate(uip_requests_total[1m])) by (endpoint)

# Error Rate
sum(rate(uip_requests_total{status=~"5.."}[5m])) 
/ sum(rate(uip_requests_total[5m])) * 100

# Agent Processing Time
histogram_quantile(0.95, 
    sum(rate(uip_agent_processing_seconds_bucket[5m])) by (le, agent_name)
)

# Memory Usage
container_memory_usage_bytes{container_name=~"uip.*"}
```

---

## 🔧 Performance Checklist

### Development

- [ ] Use async/await for all I/O operations
- [ ] Enable connection pooling for all databases
- [ ] Add proper indexes to frequently queried columns
- [ ] Implement caching for expensive computations
- [ ] Use pagination for list endpoints

### Production

- [ ] Set appropriate resource limits in Docker
- [ ] Enable gzip compression for API responses
- [ ] Configure CDN for static assets
- [ ] Set up Redis cluster for high availability
- [ ] Enable query result caching

### Monitoring

- [ ] Track request latency percentiles (P50, P95, P99)
- [ ] Monitor database query times
- [ ] Set up alerts for high error rates
- [ ] Track memory and CPU usage trends
- [ ] Monitor cache hit rates

---

## 📚 Related Documentation

- **Monitoring Guide**: [Monitoring-Guide](Monitoring-Guide) - Prometheus & Grafana setup
- **Docker Setup**: [Docker-Setup](Docker-Setup) - Container configuration
- **Logging Guide**: [Logging-Guide](Logging-Guide) - Optimize logging overhead
- **Database Guide**: [Database-Guide](Database-Guide) - Database optimization
