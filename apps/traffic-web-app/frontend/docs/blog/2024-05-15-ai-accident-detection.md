---
slug: ai-accident-detection
title: 🚨 Phát hiện Tai nạn Giao thông với AI
authors: [nguyennhatquang, nguyenviethoang]
tags: [uip, ai, yolox, accident-detection, computer-vision]
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Blog post: AI Accident Detection.

Module: apps/traffic-web-app/frontend/docs/blog/2024-05-15-ai-accident-detection.md
Author: UIP Team
Version: 1.0.0
-->

# YOLOX và Phát hiện Tai nạn Giao thông Real-time 🤖

Một trong những tính năng quan trọng nhất của UIP là khả năng **phát hiện tai nạn giao thông tự động** trong vòng vài giây. Bài viết này chia sẻ cách chúng tôi xây dựng hệ thống này.

<!-- truncate -->

## 🎯 Vấn đề cần giải quyết

Tại TP.HCM, mỗi năm có hàng nghìn vụ tai nạn giao thông. Thời gian phản ứng nhanh là yếu tố quyết định để:

- 🚑 Cứu sống nạn nhân
- 🚗 Giảm ùn tắc giao thông kéo dài
- 📊 Thu thập dữ liệu chính xác

**Mục tiêu:** Phát hiện tai nạn trong **< 3 giây** với độ chính xác **> 90%**

## 🧠 Lựa chọn Model: Tại sao YOLOX?

### So sánh các model

| Model | mAP | Speed (FPS) | Size |
|-------|-----|-------------|------|
| YOLOv5 | 50.7% | 140 | 27MB |
| YOLOv7 | 51.2% | 120 | 37MB |
| **YOLOX** | **51.1%** | **155** | **25MB** |
| YOLOR | 52.0% | 80 | 45MB |

**YOLOX** là lựa chọn tối ưu vì:
- ✅ Anchor-free design - đơn giản hơn
- ✅ Decoupled head - train nhanh hơn
- ✅ SimOTA label assignment - chính xác hơn
- ✅ Strong augmentation - robust hơn

## 🏗️ Kiến trúc hệ thống

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Camera    │────▶│   Image     │────▶│   YOLOX     │
│   Stream    │     │   Buffer    │     │   Model     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Alert     │◀────│   Post      │◀────│  Detection  │
│   System    │     │   Process   │     │   Results   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 💻 Implementation

### 1. Model Loading

```python
import torch
from yolox.exp import get_exp
from yolox.utils import postprocess

class AccidentDetector:
    def __init__(self, model_path: str, device: str = "cuda"):
        self.device = device
        self.exp = get_exp("yolox_s")
        self.model = self.exp.get_model()
        
        # Load pretrained weights
        checkpoint = torch.load(model_path, map_location=device)
        self.model.load_state_dict(checkpoint["model"])
        self.model.to(device)
        self.model.eval()
        
        # Accident-related classes
        self.accident_classes = [
            "car_crash",
            "motorcycle_fallen",
            "person_injured",
            "vehicle_damage"
        ]
```

### 2. Inference Pipeline

```python
async def detect_accidents(self, images: List[np.ndarray]) -> List[Detection]:
    """Process batch of images for accident detection"""
    detections = []
    
    # Preprocess
    batch = self.preprocess_batch(images)
    
    with torch.no_grad():
        # Forward pass
        outputs = self.model(batch)
        
        # Post-process
        outputs = postprocess(
            outputs,
            num_classes=len(self.classes),
            conf_thre=0.7,
            nms_thre=0.45
        )
    
    for i, output in enumerate(outputs):
        if output is None:
            continue
            
        for det in output:
            cls = int(det[6])
            conf = float(det[4] * det[5])
            
            if self.classes[cls] in self.accident_classes:
                detections.append(Detection(
                    image_id=i,
                    class_name=self.classes[cls],
                    confidence=conf,
                    bbox=det[:4].tolist(),
                    timestamp=datetime.now()
                ))
    
    return detections
```

### 3. Alert Dispatch

```python
async def dispatch_alert(self, detection: Detection, camera: Camera):
    """Send accident alert through multiple channels"""
    
    alert = AccidentAlert(
        camera_id=camera.id,
        location=camera.location,
        severity=self.calculate_severity(detection),
        confidence=detection.confidence,
        timestamp=detection.timestamp,
        image_url=await self.capture_snapshot(camera)
    )
    
    # Multi-channel dispatch
    await asyncio.gather(
        self.send_websocket_alert(alert),
        self.send_email_alert(alert),
        self.send_sms_alert(alert),
        self.store_in_database(alert),
        self.publish_ngsi_ld_entity(alert)
    )
```

## 📊 Training Data

### Dataset Composition

| Category | Images | Annotations |
|----------|--------|-------------|
| Car crashes | 5,000 | 12,000 |
| Motorcycle falls | 3,500 | 8,000 |
| Pedestrian incidents | 2,000 | 4,500 |
| Multi-vehicle | 1,500 | 5,000 |
| **Total** | **12,000** | **29,500** |

### Data Augmentation

```python
from albumentations import (
    Compose, RandomBrightnessContrast,
    RandomRain, RandomFog, RandomSunFlare,
    HorizontalFlip, RandomScale
)

transform = Compose([
    RandomBrightnessContrast(p=0.5),
    RandomRain(p=0.3),           # Mưa
    RandomFog(p=0.2),            # Sương mù
    RandomSunFlare(p=0.2),       # Chói sáng
    HorizontalFlip(p=0.5),
    RandomScale(scale_limit=0.2, p=0.5)
])
```

## 📈 Performance Results

### Accuracy Metrics

| Metric | Value |
|--------|-------|
| mAP@0.5 | 91.2% |
| mAP@0.5:0.95 | 72.8% |
| Precision | 89.5% |
| Recall | 93.1% |
| F1-Score | 91.3% |

### Speed Metrics

| Hardware | FPS | Latency |
|----------|-----|---------|
| RTX 3080 | 155 | 6.5ms |
| RTX 3060 | 120 | 8.3ms |
| T4 (Cloud) | 95 | 10.5ms |
| CPU (i7-12700) | 15 | 66ms |

## 🚀 Deployment

### GPU Optimization

```python
# TensorRT optimization
import tensorrt as trt

def optimize_for_tensorrt(model_path: str, output_path: str):
    """Convert ONNX model to TensorRT"""
    logger = trt.Logger(trt.Logger.INFO)
    builder = trt.Builder(logger)
    
    config = builder.create_builder_config()
    config.set_flag(trt.BuilderFlag.FP16)  # Half precision
    config.max_workspace_size = 1 << 30    # 1GB
    
    network = builder.create_network(
        1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH)
    )
    
    parser = trt.OnnxParser(network, logger)
    with open(model_path, 'rb') as f:
        parser.parse(f.read())
    
    engine = builder.build_serialized_network(network, config)
    
    with open(output_path, 'wb') as f:
        f.write(engine)
```

### Batch Processing

```python
async def process_camera_batch(cameras: List[Camera], batch_size: int = 32):
    """Process cameras in batches for efficiency"""
    
    for i in range(0, len(cameras), batch_size):
        batch = cameras[i:i + batch_size]
        
        # Fetch images concurrently
        images = await asyncio.gather(*[
            fetch_camera_image(cam) for cam in batch
        ])
        
        # Batch inference
        detections = await detector.detect_accidents(images)
        
        # Process detections
        for detection in detections:
            if detection.is_accident:
                await dispatch_alert(detection, batch[detection.image_id])
```

## 📊 Real-world Results

Sau 3 tháng triển khai thử nghiệm:

| Metric | Value |
|--------|-------|
| Tai nạn phát hiện | 127 vụ |
| Thời gian phát hiện TB | 2.3 giây |
| False positives | 8 (6.3%) |
| Thời gian phản ứng giảm | 45% |

## 🎓 Lessons Learned

1. **Lighting matters** - Augmentation với các điều kiện ánh sáng khác nhau rất quan trọng
2. **Context helps** - Kết hợp thông tin camera position cải thiện accuracy
3. **Edge cases** - Xe máy nhỏ khó phát hiện hơn ô tô
4. **False positives** - Cần filtering thông minh để giảm false alarms

## 🔜 Future Work

- [ ] Multi-camera tracking
- [ ] Severity estimation
- [ ] Incident type classification
- [ ] Integration với emergency services

---

**Bạn muốn đóng góp?** Xem [Contributing Guide](/docs/guides/contributing) để bắt đầu!

*Nguyễn Nhật Quang & Nguyễn Việt Hoàng - UIP Team*
