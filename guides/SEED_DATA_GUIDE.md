<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: guides/SEED_DATA_GUIDE.md
Module: Seed Data Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Seed data feature guide for testing without real detections.
============================================================================
-->

# Seed Data Feature - Testing Without Real Detections

## Tổng Quan

Tính năng **Seed Data** cho phép test workflow hoàn chỉnh mà không cần có accidents/patterns thực từ CV analysis. Rất hữu ích khi:

- ✅ Test workflow logic mà không cần chờ accidents xảy ra
- ✅ Verify RDF conversion, Stellio publishing cho tất cả entity types
- ✅ Demo hệ thống với data đầy đủ
- ✅ Eliminate "Empty entity list" warnings khi test

## Cấu Hình

### Bật/Tắt Seed Data

File: `config/workflow.yaml`

```yaml
seed_data:
  enabled: true  # true = mock data, false = real data
  files:
    - path: "data/accidents.json"
      count: 2  # Number of mock accidents
    - path: "data/traffic_patterns.json"
      count: 3  # Number of mock patterns
    - path: "data/updated_cameras.json"
      count: 5  # Number of mock updates
```

### enabled: true (MOCK DATA MODE)
- Orchestrator sẽ tự động generate mock entities sau Phase 5 (Analytics)
- Mock data có cấu trúc NGSI-LD chuẩn
- Validation agents sẽ xử lý mock data như real data
- **Không có warnings** về empty files

### enabled: false (REAL DATA MODE)
- Sử dụng data thực từ CV analysis
- Nếu không có accidents/patterns → warnings xuất hiện (bình thường)
- Production mode

## Cách Sử Dụng

### 1. Test Mode (với mock data)

```powershell
# Bật seed data trong config/workflow.yaml
# seed_data.enabled: true

# Run orchestrator
.\.venv\Scripts\python.exe orchestrator.py
```

**Kết quả:**
```
Phase Analytics completed
Seeding mock data after Analytics phase...
  ✓ Seeded 2 mock entities to data/accidents.json
  ✓ Seeded 3 mock entities to data/traffic_patterns.json
  ✓ Seeded 5 mock entities to data/updated_cameras.json
Phase Analytics Data Loop completed: success
  ✓ Published 2 accidents to Stellio
  ✓ Published 3 patterns to Stellio
  ✓ NO WARNINGS!
```

### 2. Production Mode (real data)

```powershell
# Tắt seed data trong config/workflow.yaml
# seed_data.enabled: false

# Run orchestrator
.\.venv\Scripts\python.exe orchestrator.py
```

**Kết quả:**
```
Phase Analytics completed
Seed data disabled - using real data
Phase Analytics Data Loop completed
  WARNING - Empty entity list in data/validated_accidents.json (OK - no accidents detected)
  WARNING - Empty entity list in data/validated_patterns.json (OK - no patterns found)
```

## Demo

```powershell
# Xem demo seed data feature
.\.venv\Scripts\python.exe demo_seed_data.py
```

## Mock Data Structure

### Mock Accident
```json
{
  "id": "urn:ngsi-ld:Accident:mock-0-...",
  "type": "Accident",
  "accidentType": "collision",
  "severity": "minor",
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6296, 10.7629]
    }
  },
  "vehiclesInvolved": 2,
  "detectedBy": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:0"
  }
}
```

### Mock Traffic Pattern
```json
{
  "id": "urn:ngsi-ld:TrafficPattern:mock-0-...",
  "type": "TrafficPattern",
  "name": "Mock Pattern 0: Rush Hour",
  "patternType": "temporal",
  "confidence": 0.7,
  "averageSpeed": 45.0,
  "averageIntensity": 0.3,
  "peakTime": "7:00-9:00"
}
```

## Workflow Logic

```
Phase 1-4: Data Collection, Transformation, Validation, Publishing
    ↓
Phase 5: Analytics (CV Analysis)
    ├─→ Real Mode: accidents.json, patterns.json từ detection
    └─→ Mock Mode: seed mock data vào accidents.json, patterns.json
    ↓
Phase 6: Analytics Data Loop
    ├─→ Validation agents process data
    ├─→ RDF conversion
    ├─→ Stellio publishing
    └─→ ✓ NO WARNINGS (because files exist with data)
```

## Lợi Ích

| Tính Năng | Real Mode | Mock Mode |
|-----------|-----------|-----------|
| Accuracy | ✓ 100% real | ~ 80% (structure correct) |
| Speed | Depends on detections | ✓ Always fast |
| Testing | ✗ Must wait for events | ✓ Instant test |
| Warnings | ✓ Expected if no data | ✗ None |
| CI/CD | ✗ Unpredictable | ✓ Predictable |

## Best Practices

1. **Development**: `enabled: true` để test nhanh
2. **Staging**: `enabled: false` để verify với data thật
3. **Production**: `enabled: false` luôn luôn
4. **CI/CD Pipeline**: `enabled: true` để test tự động

## Troubleshooting

### Q: Mock data bị ghi đè?
**A:** Seed data chạy SAU Phase Analytics, nên nó ghi đè output của analytics. Đây là behavior đúng cho test mode.

### Q: Vẫn thấy warnings?
**A:** Kiểm tra:
- `seed_data.enabled = true` trong workflow.yaml?
- Orchestrator có log "Seeding mock data after Analytics phase"?
- Files được tạo trong `data/` folder?

### Q: Làm sao biết đang dùng mock hay real data?
**A:** Check log:
```
Seed data enabled - generating mock data for testing  → Mock mode
Seed data disabled - using real data from processing   → Real mode
```

## Files

- `config/workflow.yaml` - Configuration
- `data_seeder.py` - Seed data generator
- `demo_seed_data.py` - Demo script
- `orchestrator.py` - Integrated seeding logic

---

**Tóm Tắt:** Set `seed_data.enabled: true` để test với mock data, `false` để production với real data! 🎯
