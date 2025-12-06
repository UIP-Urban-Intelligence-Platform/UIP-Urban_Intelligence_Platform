---
slug: agent-system-deep-dive
title: 🤖 Deep Dive vào Agent System của UIP
authors: [nguyennhatquang]
tags: [uip, architecture, agents, python, technical]
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Blog post: Agent System Deep Dive.

Module: apps/traffic-web-app/frontend/docs/blog/2024-02-20-agent-system-deep-dive.md
Author: UIP Team
Version: 1.0.0
-->

# Khám phá Agent System - Trái tim của UIP 💡

Trong bài viết này, tôi sẽ chia sẻ chi tiết về **Agent System** - thành phần cốt lõi giúp UIP hoạt động mạnh mẽ và linh hoạt.

<!-- truncate -->

## 🎯 Tại sao sử dụng Agent Architecture?

Khi thiết kế UIP, chúng tôi đối mặt với nhiều thách thức:

1. **Xử lý song song** - Cần xử lý dữ liệu từ 1000+ camera
2. **Modular** - Dễ thêm/bớt tính năng
3. **Fault Tolerant** - Một agent lỗi không ảnh hưởng toàn hệ thống
4. **Scalable** - Mở rộng theo nhu cầu

**Agent Architecture** là giải pháp hoàn hảo!

## 🏗️ Cấu trúc Agent

### Base Agent Interface

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

class AgentStatus(Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    PARTIAL = "partial"
    SKIPPED = "skipped"

@dataclass
class AgentResult:
    status: AgentStatus
    data: dict
    errors: list
    execution_time: float

class BaseAgent(ABC):
    """Base class cho tất cả agents trong UIP"""
    
    def __init__(self, config: dict):
        self.config = config
        self.logger = self._setup_logger()
    
    @abstractmethod
    async def execute(self, context: dict) -> AgentResult:
        """Execute agent logic"""
        pass
    
    async def pre_execute(self, context: dict) -> bool:
        """Hook trước khi execute"""
        return True
    
    async def post_execute(self, result: AgentResult) -> None:
        """Hook sau khi execute"""
        pass
```

## 📊 Các loại Agent trong UIP

### 1. Data Collection Agents 📥

Thu thập dữ liệu từ nhiều nguồn:

| Agent | Chức năng | Frequency |
|-------|-----------|-----------|
| `ImageRefreshAgent` | Lấy ảnh từ camera | 5s |
| `WeatherIntegrationAgent` | Dữ liệu thời tiết | 10m |
| `AirQualityAgent` | Chỉ số AQI | 30m |

```python
class ImageRefreshAgent(BaseAgent):
    """Refresh camera images from HCM traffic system"""
    
    async def execute(self, context: dict) -> AgentResult:
        cameras = await self.fetch_camera_list()
        
        async with aiohttp.ClientSession() as session:
            tasks = [
                self.fetch_image(session, cam) 
                for cam in cameras
            ]
            results = await asyncio.gather(*tasks)
        
        return AgentResult(
            status=AgentStatus.SUCCESS,
            data={"images": results, "count": len(results)},
            errors=[],
            execution_time=time.time() - start
        )
```

### 2. Analytics Agents 📈

Phân tích dữ liệu thông minh:

- **`CVAnalysisAgent`** - Phân tích hình ảnh với YOLOX
- **`AccidentDetectionAgent`** - Phát hiện tai nạn
- **`CongestionDetectionAgent`** - Phát hiện ùn tắc
- **`PatternRecognitionAgent`** - Nhận dạng pattern giao thông

```python
class AccidentDetectionAgent(BaseAgent):
    """Detect accidents using YOLOX model"""
    
    def __init__(self, config: dict):
        super().__init__(config)
        self.model = self._load_yolox_model()
        self.threshold = config.get("confidence_threshold", 0.7)
    
    async def execute(self, context: dict) -> AgentResult:
        images = context.get("camera_images", [])
        accidents = []
        
        for img in images:
            detections = self.model.predict(img)
            if self._is_accident(detections):
                accidents.append({
                    "camera_id": img["camera_id"],
                    "confidence": detections["confidence"],
                    "location": img["location"],
                    "timestamp": datetime.now().isoformat()
                })
        
        # Dispatch alerts if accidents detected
        if accidents:
            await self.dispatch_alerts(accidents)
        
        return AgentResult(
            status=AgentStatus.SUCCESS,
            data={"accidents": accidents},
            errors=[],
            execution_time=self.execution_time
        )
```

### 3. Transformation Agents 🔄

Chuyển đổi dữ liệu sang các format chuẩn:

- **`NGSILDTransformerAgent`** - Chuyển sang NGSI-LD
- **`SOSASSNMapperAgent`** - Map sang SOSA/SSN ontology

```python
class NGSILDTransformerAgent(BaseAgent):
    """Transform data to NGSI-LD format"""
    
    async def execute(self, context: dict) -> AgentResult:
        entities = []
        
        for camera in context.get("cameras", []):
            entity = {
                "@context": NGSI_LD_CONTEXT,
                "id": f"urn:ngsi-ld:TrafficCamera:{camera['id']}",
                "type": "TrafficCamera",
                "location": {
                    "type": "GeoProperty",
                    "value": {
                        "type": "Point",
                        "coordinates": [camera["lon"], camera["lat"]]
                    }
                },
                "vehicleCount": {
                    "type": "Property",
                    "value": camera["vehicle_count"],
                    "observedAt": datetime.now().isoformat()
                }
            }
            entities.append(entity)
        
        return AgentResult(
            status=AgentStatus.SUCCESS,
            data={"entities": entities},
            errors=[],
            execution_time=self.execution_time
        )
```

### 4. RDF/LOD Agents 🔗

Xử lý Linked Open Data:

- **`TriplestoreLoaderAgent`** - Load RDF vào Fuseki
- **`ContentNegotiationAgent`** - Serve RDF với nhiều format
- **`LODLinksetEnrichmentAgent`** - Liên kết với external datasets

## 🔄 Orchestrator - Điều phối viên

Orchestrator quản lý việc thực thi các agents:

```python
class Orchestrator:
    """Điều phối execution của agents"""
    
    def __init__(self, config_path: str):
        self.config = load_config(config_path)
        self.agents = self._load_agents()
        self.scheduler = AsyncIOScheduler()
    
    async def run_pipeline(self):
        """Execute full pipeline"""
        context = {}
        
        # Phase 1: Data Collection
        for agent in self.agents["collection"]:
            result = await agent.execute(context)
            context.update(result.data)
        
        # Phase 2: Analytics
        analytics_tasks = [
            agent.execute(context) 
            for agent in self.agents["analytics"]
        ]
        results = await asyncio.gather(*analytics_tasks)
        
        # Phase 3: Transformation & Publishing
        for agent in self.agents["transformation"]:
            result = await agent.execute(context)
            context.update(result.data)
        
        return context
```

## 📈 Performance Metrics

Sau 6 tháng vận hành:

| Metric | Value |
|--------|-------|
| Agents deployed | 30+ |
| Avg execution time | 2.3s |
| Success rate | 99.7% |
| Data processed/day | 50GB+ |
| Cameras monitored | 1000+ |

## 🎓 Lessons Learned

1. **Async is key** - Sử dụng `asyncio` cho tất cả I/O operations
2. **Graceful degradation** - Agent lỗi không crash hệ thống
3. **Observability** - Log và metric cho mọi agent
4. **Config-driven** - Thay đổi behavior không cần code

## 🚀 Kết luận

Agent System giúp UIP:
- ✅ Xử lý **1000+ cameras** real-time
- ✅ Phát hiện tai nạn trong **< 3 giây**
- ✅ Scale horizontally dễ dàng
- ✅ Maintain và extend đơn giản

---

**Bạn có câu hỏi về Agent System?** Comment bên dưới hoặc mở issue trên [GitHub](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform)!

*Nguyễn Nhật Quang - Lead Developer @ UIP Team*
