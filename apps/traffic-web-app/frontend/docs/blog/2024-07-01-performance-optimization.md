---
slug: performance-optimization
title: ⚡ Tối ưu Performance cho 1000+ Camera Streams
authors: [nguyennhatquang, nguyendinhanhtuan]
tags: [uip, performance, optimization, python, backend]
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Blog post: Performance Optimization.

Module: apps/traffic-web-app/frontend/docs/blog/2024-07-01-performance-optimization.md
Author: UIP Team
Version: 1.0.0
-->

Xử lý real-time data từ **1000+ camera** là thách thức không nhỏ. Bài viết này chia sẻ các kỹ thuật tối ưu performance mà UIP team đã áp dụng.

<!-- truncate -->

## 📊 Thách thức ban đầu

Khi scale từ 100 lên 1000 camera, chúng tôi gặp các vấn đề:

| Metric | 100 cameras | 1000 cameras |
|--------|-------------|--------------|
| Memory | 2GB | 25GB ❌ |
| CPU | 40% | 95% ❌ |
| Latency | 500ms | 8s ❌ |
| Error rate | 0.1% | 12% ❌ |

**Mục tiêu:** Xử lý 1000+ camera với latency < 1s

## 🔧 Optimization Techniques

### 1. Async Everything

**Before (Sync):**
```python
def process_cameras(cameras: List[Camera]) -> List[Result]:
    results = []
    for camera in cameras:
        image = fetch_image(camera.url)  # Blocking!
        result = analyze(image)
        results.append(result)
    return results
# Time: 1000 cameras × 500ms = 500s 😱
```

**After (Async):**
```python
async def process_cameras(cameras: List[Camera]) -> List[Result]:
    tasks = [process_single(cam) for cam in cameras]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if not isinstance(r, Exception)]

async def process_single(camera: Camera) -> Result:
    async with aiohttp.ClientSession() as session:
        async with session.get(camera.url) as response:
            image = await response.read()
    return await analyze_async(image)
# Time: ~2-3s total 🚀
```

### 2. Connection Pooling

```python
# Global connection pool
class ConnectionManager:
    def __init__(self):
        self.http_pool = aiohttp.TCPConnector(
            limit=500,           # Max connections
            limit_per_host=10,   # Per host limit
            ttl_dns_cache=300,   # DNS cache TTL
            keepalive_timeout=30
        )
        self.mongo_pool = AsyncIOMotorClient(
            maxPoolSize=100,
            minPoolSize=10,
            waitQueueTimeoutMS=5000
        )
        self.redis_pool = redis.ConnectionPool(
            max_connections=50,
            timeout=5
        )
    
    async def get_session(self) -> aiohttp.ClientSession:
        return aiohttp.ClientSession(connector=self.http_pool)
```

### 3. Batch Processing

```python
async def batch_process(items: List[Item], batch_size: int = 100):
    """Process items in batches to control resource usage"""
    results = []
    
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        
        # Process batch concurrently
        batch_results = await asyncio.gather(*[
            process_item(item) for item in batch
        ])
        
        results.extend(batch_results)
        
        # Small delay between batches to prevent overwhelming
        await asyncio.sleep(0.1)
    
    return results
```

### 4. Smart Caching

```python
from functools import lru_cache
from cachetools import TTLCache
import redis.asyncio as redis

class MultiLevelCache:
    def __init__(self):
        # L1: In-memory (fastest)
        self.l1_cache = TTLCache(maxsize=1000, ttl=60)
        
        # L2: Redis (shared across instances)
        self.redis = redis.Redis(
            host='redis',
            port=6379,
            decode_responses=True
        )
    
    async def get(self, key: str) -> Optional[Any]:
        # Try L1 first
        if key in self.l1_cache:
            return self.l1_cache[key]
        
        # Try L2
        value = await self.redis.get(key)
        if value:
            self.l1_cache[key] = json.loads(value)
            return self.l1_cache[key]
        
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 300):
        self.l1_cache[key] = value
        await self.redis.setex(key, ttl, json.dumps(value))
```

### 5. Lazy Loading & Pagination

```python
async def get_cameras_paginated(
    page: int = 1,
    limit: int = 100,
    filters: Optional[CameraFilter] = None
) -> PaginatedResponse:
    """Paginated camera fetching with cursor-based pagination"""
    
    skip = (page - 1) * limit
    
    # Build query
    query = {}
    if filters:
        if filters.status:
            query["status"] = filters.status
        if filters.district:
            query["location.district"] = filters.district
    
    # Execute with projection (only needed fields)
    cameras = await db.cameras.find(
        query,
        projection={
            "_id": 1,
            "name": 1,
            "location": 1,
            "status": 1,
            "lastUpdate": 1
        }
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.cameras.count_documents(query)
    
    return PaginatedResponse(
        items=cameras,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit)
    )
```

### 6. Worker Pool Pattern

```python
import asyncio
from asyncio import Queue

class WorkerPool:
    def __init__(self, num_workers: int = 10):
        self.num_workers = num_workers
        self.queue: Queue = Queue()
        self.workers: List[asyncio.Task] = []
    
    async def start(self):
        """Start worker pool"""
        for i in range(self.num_workers):
            worker = asyncio.create_task(self._worker(i))
            self.workers.append(worker)
    
    async def _worker(self, worker_id: int):
        """Individual worker process"""
        while True:
            job = await self.queue.get()
            try:
                await job.execute()
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
            finally:
                self.queue.task_done()
    
    async def submit(self, job: Job):
        """Submit job to queue"""
        await self.queue.put(job)
    
    async def wait_completion(self):
        """Wait for all jobs to complete"""
        await self.queue.join()
```

## 📈 Results After Optimization

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Memory | 25GB | 4GB | **84% ↓** |
| CPU | 95% | 45% | **53% ↓** |
| Latency | 8s | 800ms | **90% ↓** |
| Error rate | 12% | 0.5% | **96% ↓** |
| Throughput | 2 req/s | 150 req/s | **75x ↑** |

## 🔍 Profiling Tools

### Memory Profiling

```python
from memory_profiler import profile

@profile
def memory_intensive_function():
    # Your code here
    pass

# Run with: python -m memory_profiler script.py
```

### CPU Profiling

```python
import cProfile
import pstats

def profile_function(func):
    profiler = cProfile.Profile()
    profiler.enable()
    
    result = func()
    
    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(20)
    
    return result
```

### Async Tracing

```python
import opentelemetry
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

# Setup tracer
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

async def traced_operation():
    with tracer.start_as_current_span("camera_processing"):
        with tracer.start_as_current_span("fetch_image"):
            image = await fetch_image()
        
        with tracer.start_as_current_span("analyze"):
            result = await analyze(image)
        
        return result
```

## 📋 Performance Checklist

- [ ] Use `async/await` for I/O operations
- [ ] Implement connection pooling
- [ ] Add multi-level caching (L1: memory, L2: Redis)
- [ ] Use batch processing for bulk operations
- [ ] Implement pagination for large datasets
- [ ] Profile before optimizing
- [ ] Monitor in production

## 🎓 Key Takeaways

1. **Async is essential** - Không thể scale với sync code
2. **Cache aggressively** - Multi-level cache giảm load đáng kể
3. **Batch processing** - Kiểm soát resource usage
4. **Profile first** - Đo lường trước khi optimize
5. **Connection pooling** - Tái sử dụng connections

---

**Bạn có tips optimization nào khác?** Chia sẻ trong [Discussions](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/discussions)!

*Nguyễn Nhật Quang & Nguyễn Đình Anh Tuấn - UIP Team*
