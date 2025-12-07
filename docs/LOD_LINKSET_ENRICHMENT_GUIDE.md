<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: docs/LOD_LINKSET_ENRICHMENT_GUIDE.md
Module: LOD Linkset Enrichment Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Guide for LOD Cloud linkset enrichment (DBpedia, Wikidata, GeoNames).
============================================================================
-->

# LOD Linkset Enrichment Guide

**Hướng dẫn sử dụng tính năng liên kết với LOD Cloud (DBpedia, Wikidata, GeoNames)**

---

## 📋 Mục Lục

1. [Giới Thiệu](#giới-thiệu)
2. [Yêu Cầu Cuộc Thi OLP 2025](#yêu-cầu-cuộc-thi-olp-2025)
3. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
4. [Cài Đặt và Cấu Hình](#cài-đặt-và-cấu-hình)
5. [Sử Dụng](#sử-dụng)
6. [Ví Dụ](#ví-dụ)
7. [Tùy Chỉnh](#tùy-chỉnh)
8. [Xử Lý Lỗi](#xử-lý-lỗi)
9. [Câu Hỏi Thường Gặp](#câu-hỏi-thường-gặp)

---

## Giới Thiệu

### Tính Năng LOD Linkset Enrichment Là Gì?

LOD Linkset Enrichment Agent là một agent tùy chọn trong workflow, có nhiệm vụ **bổ sung các liên kết (linksets)** từ các entity NGSI-LD trong hệ thống của bạn đến các bộ dữ liệu bên ngoài trong **LOD Cloud** (Linked Open Data Cloud).

### Mục Đích

- **Tuân thủ yêu cầu cuộc thi OLP 2025**: "Có liên kết (linkset) tới ít nhất một bộ dữ liệu khác trong LOD Cloud"
- **Nâng cấp dữ liệu lên LOD Level 5**: Linked Data với cross-dataset references
- **Kết nối với các hub datasets**: DBpedia, Wikidata, GeoNames
- **Tăng khả năng tái sử dụng và khám phá dữ liệu**: Dữ liệu được liên kết với các nguồn uy tín

### Nguyên Tắc Thiết Kế: 100% Non-Invasive

⚠️ **Quan trọng**: Agent này được thiết kế để **KHÔNG ẢNH HƯỞNG** đến chức năng hiện tại của hệ thống:

- ✅ Chỉ **thêm** quan hệ `owl:sameAs` mới
- ✅ **Không sửa đổi** các property hiện có
- ✅ **Không xóa** bất kỳ dữ liệu nào
- ✅ **Tùy chọn** (disabled by default) - bật khi cần
- ✅ Workflow vẫn chạy bình thường nếu không bật agent này

---

## Yêu Cầu Cuộc Thi OLP 2025

### Thông Tin Cuộc Thi

- **Tên cuộc thi**: Olympic Tin học Sinh viên Việt Nam 2025 - Cuộc thi Phần mềm Nguồn mở
- **Chủ đề**: "Ứng dụng dữ liệu mở liên kết phục vụ chuyển đổi số"
- **Deadline**: 08/12/2025 17:00
- **Yêu cầu kỹ thuật**: Linked Open Data (LOD) - 5 sao (Tim Berners-Lee)

### LOD 5-Star Model

| Sao | Mô Tả | Ví Dụ |
|-----|-------|-------|
| ⭐ | Dữ liệu công khai với giấy phép mở | PDF, Excel |
| ⭐⭐ | Dữ liệu có cấu trúc, máy đọc được | CSV, JSON |
| ⭐⭐⭐ | Sử dụng định dạng không độc quyền | JSON, XML |
| ⭐⭐⭐⭐ | Sử dụng URI để định danh, RDF cho liên kết | NGSI-LD, Turtle |
| ⭐⭐⭐⭐⭐ | **Liên kết với dữ liệu khác (linksets)** | owl:sameAs → DBpedia |

**Yêu cầu cốt lõi**: Đạt chuẩn 5 sao bằng cách có **linkset tới ít nhất một bộ dữ liệu khác trong LOD Cloud**.

### LOD Cloud - Hub Datasets

LOD Cloud có hơn 1,000+ datasets, các hub datasets chính:

1. **DBpedia** (http://dbpedia.org/)
   - Structured information từ Wikipedia
   - 4.6 triệu entities, 3 tỷ triples
   - Hỗ trợ tiếng Việt: `dbpedia.org/resource/Hanoi`

2. **Wikidata** (https://www.wikidata.org/)
   - Community-maintained knowledge base
   - 100+ triệu items, 1.4+ tỷ statements
   - Q-numbers: `wikidata.org/entity/Q1858` (Hà Nội)

3. **GeoNames** (https://www.geonames.org/)
   - Geographic database, 25+ triệu địa danh
   - Coordinate-based: `sws.geonames.org/1581130/` (Hanoi)
   - Free API với username registration

### Tiêu Chuẩn W3C

- **OWL (Web Ontology Language)**: `owl:sameAs` predicate
  - Ý nghĩa: Hai URI refer đến cùng một thực thể
  - Ví dụ: `Camera:cam001 owl:sameAs dbpedia:Hanoi`
  
- **RDF (Resource Description Framework)**: Triple format
  - Subject - Predicate - Object
  - Ví dụ: `<cam001> <sameAs> <dbpedia:Hanoi>`

---

## Kiến Trúc Hệ Thống

### Vị Trí Trong Workflow

LOD Linkset Enrichment Agent nằm ở **Phase 10** (optional) trong workflow pipeline:

```
Phase 1: Data Collection       → cameras_raw.json
Phase 2: Transformation         → ngsi_ld_entities.json
Phase 3: Validation             → validated_entities.json
Phase 4: Publishing             → Stellio + RDF
Phase 5: Analytics              → observations.json
Phase 6-9: RDF Loading + Sync   → Fuseki + Neo4j
Phase 10: LOD Linkset Enrichment → enriched_entities_with_linksets.json (OPTIONAL)
```

### Kiến Trúc Agent

```
LODLinksetEnrichmentAgent
├── GeoNamesLinker
│   ├── find_nearest_place(lat, lon, radius_km)
│   ├── GeoNames API (findNearbyPlaceName)
│   └── Cache (coordinate → URI)
│
├── DBpediaLinker
│   ├── find_resource(name, type_hint)
│   ├── DBpedia Lookup API
│   ├── DBpedia SPARQL Endpoint
│   └── Cache (name+type → URI)
│
├── WikidataLinker
│   ├── find_item(name, language)
│   ├── Wikidata Search API
│   ├── Wikidata SPARQL Endpoint
│   └── Cache (name → Q-number)
│
└── enrich(entities) → enriched_entities
    ├── Extract location/name/address
    ├── Query linkers (parallel)
    ├── Add owl:sameAs relationships
    ├── Update @context
    └── Preserve original structure
```

### Workflow Logic

```python
# Input: NGSI-LD entity
{
  "id": "urn:ngsi-ld:Camera:cam001",
  "type": "Camera",
  "cameraName": {"type": "Property", "value": "Cam Hoan Kiem"},
  "location": {
    "type": "GeoProperty",
    "value": {"type": "Point", "coordinates": [105.8542, 21.0285]}
  }
}

# Processing Steps:
1. Extract coordinates: [105.8542, 21.0285]
2. GeoNames API → "Hanoi" → http://sws.geonames.org/1581130/
3. Extract name: "Cam Hoan Kiem"
4. DBpedia Lookup → http://dbpedia.org/resource/Hanoi
5. Add owl:sameAs relationships

# Output: Enriched entity
{
  "id": "urn:ngsi-ld:Camera:cam001",
  "type": "Camera",
  "cameraName": {"type": "Property", "value": "Cam Hoan Kiem"},
  "location": {...},
  "sameAs": [  # NEW - Added linksets
    {
      "type": "Relationship",
      "object": "http://sws.geonames.org/1581130/",
      "datasetId": {"type": "Property", "value": "geonames"},
      "matchScore": {"type": "Property", "value": 1.0}
    },
    {
      "type": "Relationship",
      "object": "http://dbpedia.org/resource/Hanoi",
      "datasetId": {"type": "Property", "value": "dbpedia"}
    }
  ],
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "http://www.w3.org/2002/07/owl#"  # NEW - OWL vocabulary
  ]
}
```

---

## Cài Đặt và Cấu Hình

### Bước 1: Kiểm Tra Files

Agent và config files đã được tạo sẵn:

```
project/
├── src/agents/rdf_linked_data/
│   └── lod_linkset_enrichment_agent.py  # Agent chính (693 lines)
├── config/
│   ├── lod_linkset_mappings.yaml        # Configuration
│   ├── namespaces.yaml                  # Updated với LOD namespaces
│   └── workflow.yaml                    # Updated với Phase 10
└── docs/
    └── LOD_LINKSET_ENRICHMENT_GUIDE.md  # Tài liệu này
```

### Bước 2: Đăng Ký GeoNames Username

GeoNames API yêu cầu username miễn phí:

1. Truy cập: https://www.geonames.org/login
2. Đăng ký tài khoản (free)
3. Kích hoạt "Free Web Services" trong account settings
4. Lưu username (ví dụ: `your_username`)

### Bước 3: Cấu Hình Environment Variables

Tạo/cập nhật file `.env`:

```bash
# LOD Cloud Linkset Enrichment (Optional)
GEONAMES_USERNAME=your_username  # Replace với username thật
```

Hoặc export trực tiếp:

```bash
# Windows PowerShell
$env:GEONAMES_USERNAME = "your_username"

# Linux/Mac
export GEONAMES_USERNAME="your_username"
```

### Bước 4: Cấu Hình Workflow

Edit `config/workflow.yaml`:

```yaml
# Phase 10: LOD Linkset Enrichment
- name: "LOD Linkset Enrichment"
  enabled: true  # CHANGE: Set to true to enable
  agents:
    - name: "lod_linkset_enrichment_agent"
      enabled: true  # CHANGE: Set to true to enable
      config:
        enable_geonames: true    # Enable GeoNames linking
        enable_dbpedia: true     # Enable DBpedia linking
        enable_wikidata: false   # Disable Wikidata (optional)
        geonames_username: "${GEONAMES_USERNAME:demo}"
```

### Bước 5: Tùy Chỉnh Entity Mappings (Optional)

Edit `config/lod_linkset_mappings.yaml` nếu muốn custom:

```yaml
entity_types:
  Camera:
    enable_geonames: true
    enable_dbpedia: true
    enable_wikidata: false
    name_field: "cameraName.value"     # Field chứa tên camera
    address_field: "address.value"     # Field chứa địa chỉ
    match_strategy: "geographic"       # Dùng coordinates
  
  CitizenObservation:
    enable_geonames: true
    enable_dbpedia: false
    enable_wikidata: false
```

---

## Sử Dụng

### Chạy Workflow Đầy Đủ

```bash
# Chạy toàn bộ workflow (bao gồm Phase 10 nếu enabled)
python orchestrator.py

# Hoặc qua main.py
python main.py --mode orchestrator
```

### Chạy Standalone (Testing)

Chạy agent độc lập để test:

```bash
# Syntax
python src/agents/rdf_linked_data/lod_linkset_enrichment_agent.py <input_file> <output_file>

# Ví dụ: Enrich camera entities
python src/agents/rdf_linked_data/lod_linkset_enrichment_agent.py \
    data/validated_entities.json \
    data/enriched_entities_with_linksets.json
```

### Dry Run Mode

Test mà không ghi file output:

Edit `config/lod_linkset_mappings.yaml`:

```yaml
development:
  dry_run: true        # Enable dry-run mode
  max_entities: 5      # Only process 5 entities for testing
```

Chạy workflow hoặc standalone → output được log nhưng không ghi file.

### Kiểm Tra Kết Quả

```bash
# Xem file output
cat data/enriched_entities_with_linksets.json | jq '.[] | select(.sameAs)'

# Đếm số entities có linksets
cat data/enriched_entities_with_linksets.json | jq '[.[] | select(.sameAs)] | length'

# Xem chi tiết linksets của một entity
cat data/enriched_entities_with_linksets.json | jq '.[] | select(.id == "urn:ngsi-ld:Camera:cam001")'
```

### Monitoring và Logs

```bash
# Xem logs real-time
tail -f logs/lod_linkset_enrichment.log

# Xem statistics
cat logs/lod_linkset_enrichment.log | grep "Statistics"
```

Expected output:

```
2025-11-20 10:30:45 - LODLinksetEnrichmentAgent - INFO - Enrichment Statistics:
  Total Entities: 40
  Enriched Entities: 38 (95.0%)
  GeoNames Links: 38
  DBpedia Links: 25
  Wikidata Links: 0
  Errors: 2
  Execution Time: 45.3s
```

---

## Ví Dụ

### Ví Dụ 1: Camera Entity

**Input** (`data/validated_entities.json`):

```json
{
  "id": "urn:ngsi-ld:Camera:cam001",
  "type": "Camera",
  "cameraName": {
    "type": "Property",
    "value": "Camera Hoan Kiem"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.8542, 21.0285]
    }
  },
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "Hoan Kiem District",
      "addressLocality": "Hanoi",
      "addressCountry": "Vietnam"
    }
  },
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ]
}
```

**Output** (`data/enriched_entities_with_linksets.json`):

```json
{
  "id": "urn:ngsi-ld:Camera:cam001",
  "type": "Camera",
  "cameraName": {
    "type": "Property",
    "value": "Camera Hoan Kiem"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [105.8542, 21.0285]
    }
  },
  "address": {
    "type": "Property",
    "value": {
      "streetAddress": "Hoan Kiem District",
      "addressLocality": "Hanoi",
      "addressCountry": "Vietnam"
    }
  },
  "sameAs": [
    {
      "type": "Relationship",
      "object": "http://sws.geonames.org/1581130/",
      "datasetId": {
        "type": "Property",
        "value": "geonames"
      },
      "matchScore": {
        "type": "Property",
        "value": 1.0
      },
      "matchedAt": {
        "type": "Property",
        "value": "2025-11-20T10:30:12Z"
      }
    },
    {
      "type": "Relationship",
      "object": "http://dbpedia.org/resource/Hanoi",
      "datasetId": {
        "type": "Property",
        "value": "dbpedia"
      },
      "matchScore": {
        "type": "Property",
        "value": 0.95
      }
    }
  ],
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "http://www.w3.org/2002/07/owl#"
  ]
}
```

**Giải thích**:

- ✅ Original properties giữ nguyên (cameraName, location, address)
- ✅ Thêm property `sameAs` (type: Relationship)
- ✅ 2 linksets: GeoNames (geographic) + DBpedia (semantic)
- ✅ Metadata: datasetId, matchScore, matchedAt
- ✅ @context updated với OWL vocabulary

### Ví Dụ 2: RDF Turtle Output

Entity trên được convert sang RDF Turtle:

```turtle
@prefix camera: <urn:ngsi-ld:Camera:> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix dbpedia: <http://dbpedia.org/resource/> .
@prefix geonames: <http://sws.geonames.org/> .

camera:cam001 a <https://smartdatamodels.org/dataModel.Device/Camera> ;
    <https://smartdatamodels.org/dataModel.Device/cameraName> "Camera Hoan Kiem" ;
    <http://www.w3.org/2003/01/geo/wgs84_pos#lat> 21.0285 ;
    <http://www.w3.org/2003/01/geo/wgs84_pos#long> 105.8542 ;
    owl:sameAs geonames:1581130/ ;   # GeoNames linkset
    owl:sameAs dbpedia:Hanoi .       # DBpedia linkset
```

**Lợi ích**:

- Dữ liệu camera có thể query kết hợp với DBpedia/GeoNames
- SPARQL federated queries: `SELECT * WHERE { camera:cam001 owl:sameAs ?external }`
- Khai thác knowledge từ Wikipedia về Hanoi
- Geospatial queries qua GeoNames API

---

## Tùy Chỉnh

### 1. Thay Đổi LOD Sources

Edit `config/lod_linkset_mappings.yaml`:

```yaml
entity_types:
  Camera:
    enable_geonames: true    # Geographic linksets
    enable_dbpedia: true     # Semantic linksets (Wikipedia)
    enable_wikidata: true    # Wikidata linksets (thêm mới)
```

### 2. Điều Chỉnh Matching Strategy

```yaml
entity_types:
  Camera:
    match_strategy: "geographic"   # Dùng coordinates (mặc định)
    fallback_strategy: "name"      # Fallback sang name matching
    
  RoadAccident:
    match_strategy: "name"         # Dùng name/address
```

### 3. Tùy Chỉnh Search Radius

```yaml
geonames:
  radius_km: 10              # Default: 10km
  prefer_city: true          # Ưu tiên city/town hơn village
  priority_feature_classes:
    - "P"  # Populated places (highest priority)
    - "A"  # Administrative divisions
```

### 4. Thêm Vietnam-specific City Cache

```yaml
vietnam_context:
  major_cities:
    "Hà Nội":
      dbpedia: "http://dbpedia.org/resource/Hanoi"
      wikidata: "http://www.wikidata.org/entity/Q1858"
      geonames: "http://sws.geonames.org/1581130/"
    
    "Đà Nẵng":
      dbpedia: "http://dbpedia.org/resource/Da_Nang"
      wikidata: "http://www.wikidata.org/entity/Q7033"
      geonames: "http://sws.geonames.org/1583992/"
  
  use_city_cache: true       # Enable pre-configured cache
  fallback_to_english: true  # Fallback nếu không tìm thấy tiếng Việt
```

### 5. Tùy Chỉnh Performance

```yaml
performance:
  enable_parallel: true      # Parallel API calls
  max_workers: 5             # Number of concurrent workers
  batch_size: 50             # Entities per batch
  
  rate_limit:
    geonames: 1000           # Requests/hour (free tier limit)
    dbpedia: 3000            # Requests/hour
    wikidata: 5000           # Requests/hour
  
  cache_enabled: true        # Enable caching
  cache_ttl_hours: 24        # Cache expiry
```

### 6. Thêm Entity Type Mới

Ví dụ: Thêm linksets cho `WeatherObserved`:

```yaml
entity_types:
  WeatherObserved:
    enable_geonames: true
    enable_dbpedia: false    # Not applicable
    enable_wikidata: false
    
    location_field: "location"
    match_strategy: "geographic"
```

---

## Xử Lý Lỗi

### Lỗi Thường Gặp

#### 1. GeoNames API Error: "User not enabled for web services"

**Nguyên nhân**: Chưa enable Free Web Services trong GeoNames account.

**Giải pháp**:

1. Login vào https://www.geonames.org/login
2. Vào account settings
3. Tìm "Free Web Services" và click "Click here to enable"
4. Đợi vài phút để activate
5. Thử lại

#### 2. HTTP 429 Too Many Requests

**Nguyên nhân**: Vượt quá rate limit API.

**Giải pháp**:

- Giảm `max_workers` trong config
- Tăng cache TTL để giảm API calls
- Hoặc nâng cấp GeoNames account (paid tier)

```yaml
performance:
  max_workers: 3             # Giảm từ 5 xuống 3
  cache_ttl_hours: 72        # Tăng cache lifetime
```

#### 3. No Matches Found

**Nguyên nhân**: Entity không có coordinates hoặc name/address không rõ ràng.

**Giải pháp**:

- Kiểm tra entity có `location.value.coordinates`
- Kiểm tra `name_field` và `address_field` trong config
- Sử dụng fallback strategy

```yaml
entity_types:
  Camera:
    match_strategy: "geographic"
    fallback_strategy: "name"  # Enable fallback
```

#### 4. Agent Timeout

**Nguyên nhân**: Processing quá lâu (nhiều entities, network slow).

**Giải pháp**:

- Tăng timeout trong `config/workflow.yaml`
- Giảm batch size
- Enable cache

```yaml
agents:
  - name: "lod_linkset_enrichment_agent"
    timeout: 300  # Tăng từ 180 lên 300 seconds
    config:
      batch_size: 25  # Giảm từ 50 xuống 25
```

#### 5. Module Import Error

**Nguyên nhân**: Missing dependencies.

**Giải pháp**:

```bash
# Install required packages
pip install requests pyyaml python-dotenv

# Verify installation
python -c "import requests, yaml, dotenv; print('OK')"
```

### Logging và Debugging

#### Enable Debug Logging

Edit `config/lod_linkset_mappings.yaml`:

```yaml
logging:
  level: "DEBUG"             # Change từ INFO sang DEBUG
  log_successful_links: true # Log all successful links
  log_failures: true         # Log all failed lookups
```

#### Kiểm Tra Logs

```bash
# Xem errors
cat logs/lod_linkset_enrichment.log | grep "ERROR"

# Xem successful links
cat logs/lod_linkset_enrichment.log | grep "Linked"

# Xem API calls
cat logs/lod_linkset_enrichment.log | grep "API"
```

#### Test Connectivity

```bash
# Test GeoNames API
curl "http://api.geonames.org/findNearbyPlaceNameJSON?lat=21.0285&lng=105.8542&username=demo"

# Test DBpedia Lookup
curl "https://lookup.dbpedia.org/api/search?query=Hanoi&format=json"

# Test Wikidata Search
curl "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=Hanoi&language=vi&format=json"
```

---

## Câu Hỏi Thường Gặp

### Q1: Agent này có ảnh hưởng đến workflow hiện tại không?

**A**: **KHÔNG**. Agent được thiết kế 100% non-invasive:

- ✅ Disabled by default (enabled: false)
- ✅ Optional phase (required: false)
- ✅ Chỉ thêm property `sameAs` mới, không sửa existing properties
- ✅ Workflow vẫn chạy bình thường nếu agent bị disable

### Q2: Tôi có bắt buộc phải dùng cả 3 LOD sources không?

**A**: **KHÔNG**. Bạn có thể enable/disable từng source:

```yaml
config:
  enable_geonames: true    # Required - geographic matching tốt nhất
  enable_dbpedia: true     # Recommended - rich semantic data
  enable_wikidata: false   # Optional - có thể skip
```

Tối thiểu: Enable 1 source (GeoNames) là đủ yêu cầu cuộc thi.

### Q3: Agent này có tốn phí không?

**A**: **MIỄN PHÍ** với một số giới hạn:

- **GeoNames**: Free tier 20,000 requests/day (đủ cho hầu hết use cases)
- **DBpedia**: Free, no limits (public SPARQL endpoint)
- **Wikidata**: Free, no limits (community-maintained)

**Lưu ý**: Nếu cần > 20k requests/day cho GeoNames, có thể upgrade account (paid).

### Q4: Làm sao kiểm tra linksets đã đúng chưa?

**A**: Có nhiều cách:

**1. Kiểm tra URI resolvable**:

```bash
# GeoNames URI
curl -L http://sws.geonames.org/1581130/

# DBpedia URI
curl -H "Accept: application/rdf+xml" http://dbpedia.org/resource/Hanoi

# Wikidata URI
curl https://www.wikidata.org/entity/Q1858
```

**2. SPARQL Query**:

```sparql
# Query tất cả entities có linksets
SELECT ?entity ?external WHERE {
  ?entity <http://www.w3.org/2002/07/owl#sameAs> ?external .
}

# Query chi tiết về một entity
SELECT * WHERE {
  <urn:ngsi-ld:Camera:cam001> <http://www.w3.org/2002/07/owl#sameAs> ?external .
  OPTIONAL { ?external <http://www.w3.org/2000/01/rdf-schema#label> ?label }
}
```

**3. Validate với LOD Cloud**:

- Upload RDF to LOD Laundromat: https://lodlaundromat.org/
- Validate với RDF validator: http://www.w3.org/RDF/Validator/

### Q5: Có thể thêm LOD sources khác không (ví dụ: OpenStreetMap)?

**A**: **CÓ**. Thiết kế agent là pluggable, bạn có thể extend:

**Cách 1: Edit agent code** (cho advanced users):

```python
# File: src/agents/rdf_linked_data/lod_linkset_enrichment_agent.py

class OpenStreetMapLinker:
    """Link entities to OpenStreetMap via Overpass API"""
    
    def find_osm_node(self, lat: float, lon: float) -> Optional[str]:
        # Implementation: Query Overpass API
        url = f"https://overpass-api.de/api/interpreter"
        query = f"[out:json];node(around:100,{lat},{lon});out;"
        # ... API call ...
        return f"https://www.openstreetmap.org/node/{node_id}"

# Add to LODLinksetEnrichmentAgent.enrich():
osm_linker = OpenStreetMapLinker()
osm_uri = osm_linker.find_osm_node(lat, lon)
if osm_uri:
    entity['sameAs'].append({
        'type': 'Relationship',
        'object': osm_uri,
        'datasetId': {'type': 'Property', 'value': 'openstreetmap'}
    })
```

**Cách 2: Request feature** (cho non-technical users):

- Tạo issue trên GitHub
- Mô tả LOD source cần thêm (endpoint, API docs, example)
- Team sẽ implement

### Q6: Performance như thế nào với dataset lớn (1000+ entities)?

**A**: Agent được tối ưu cho production:

- **Parallel processing**: 5 workers mặc định
- **Batch processing**: 50 entities/batch
- **Caching**: Cache API results (TTL 24h)
- **Rate limiting**: Tuân thủ API limits

**Benchmark** (1000 entities, GeoNames + DBpedia):

- **With cache (warm)**: ~30 seconds
- **Without cache (cold)**: ~10 minutes
- **Memory usage**: < 512 MB

**Tips tối ưu**:

```yaml
performance:
  enable_parallel: true
  max_workers: 10          # Increase workers (nếu network tốt)
  batch_size: 100          # Increase batch size
  cache_enabled: true      # Must enable
  cache_ttl_hours: 72      # Longer cache lifetime
```

### Q7: Có cần chạy lại agent này mỗi lần workflow chạy không?

**A**: **KHÔNG NHẤT THIẾT**. Linksets thường stable (không thay đổi thường xuyên).

**Recommendation**:

- **Lần đầu**: Enable agent để tạo linksets
- **Các lần sau**: Disable agent (enabled: false) để tăng tốc
- **Khi cần**: Enable lại khi có entities mới hoặc update

**Alternative approach**: Run standalone một lần duy nhất:

```bash
# Run once để enrich tất cả entities
python src/agents/rdf_linked_data/lod_linkset_enrichment_agent.py \
    data/validated_entities.json \
    data/enriched_entities_with_linksets.json

# Use enriched file cho các workflow sau
# (Thay `validated_entities.json` bằng `enriched_entities_with_linksets.json`)
```

### Q8: Làm sao submit data cho LOD Cloud registry?

**A**: Sau khi có linksets, submit dataset lên LOD Cloud:

**Bước 1: Tạo VoID Description**

Create file `void.ttl`:

```turtle
@prefix void: <http://rdfs.org/ns/void#> .
@prefix dcterms: <http://purl.org/dc/terms/> .

<https://example.org/dataset/smart-city-vietnam> a void:Dataset ;
    dcterms:title "Smart City Vietnam - Traffic Management"@en ;
    dcterms:description "NGSI-LD entities for smart city traffic monitoring in Vietnam"@en ;
    dcterms:creator <https://github.com/your-repo> ;
    dcterms:license <https://creativecommons.org/licenses/by/4.0/> ;
    void:triples "150000"^^xsd:integer ;
    void:entities "5000"^^xsd:integer ;
    void:sparqlEndpoint <http://your-server/sparql> ;
    
    # Linksets
    void:subset [
        a void:Linkset ;
        void:linkPredicate owl:sameAs ;
        void:target <http://sws.geonames.org/> ;
        void:triples "3800"^^xsd:integer
    ] ;
    
    void:subset [
        a void:Linkset ;
        void:linkPredicate owl:sameAs ;
        void:target <http://dbpedia.org/> ;
        void:triples "2500"^^xsd:integer
    ] .
```

**Bước 2: Submit to LOD Cloud**

- Visit: https://lod-cloud.net/contribute
- Fill form với VoID file URL
- Wait for approval (thường 1-2 tuần)

**Bước 3: Monitoring**

- Check dataset stats: https://lod-cloud.net/dataset/your-dataset
- Monitor linksets: https://lod-cloud.net/linksets

---

## Tổng Kết

### Checklist Triển Khai

- [ ] Đăng ký GeoNames username (https://www.geonames.org/login)
- [ ] Enable Free Web Services trong GeoNames account
- [ ] Set environment variable `GEONAMES_USERNAME`
- [ ] Update `config/workflow.yaml`: enabled: true (Phase 10)
- [ ] Update `config/workflow.yaml`: agent enabled: true
- [ ] (Optional) Customize `config/lod_linkset_mappings.yaml`
- [ ] Run workflow: `python orchestrator.py`
- [ ] Verify output: `data/enriched_entities_with_linksets.json`
- [ ] Check logs: `logs/lod_linkset_enrichment.log`
- [ ] (Optional) Submit to LOD Cloud registry

### Lợi Ích Của Linksets

✅ **Tuân thủ yêu cầu OLP 2025**: LOD Cloud Level 5 compliance  
✅ **Tăng khả năng tái sử dụng**: Data được liên kết với nguồn uy tín  
✅ **Khám phá dữ liệu tốt hơn**: SPARQL federated queries  
✅ **Knowledge enrichment**: Khai thác thông tin từ DBpedia/Wikidata  
✅ **Geospatial queries**: Spatial analysis qua GeoNames  
✅ **Community integration**: Tham gia LOD Cloud ecosystem  

### Hỗ Trợ

- **GitHub Issues**: https://github.com/your-repo/issues
- **Documentation**: https://github.com/your-repo/docs
- **Email**: your-email@example.com

---

**Phiên bản**: 1.0.0  
**Cập nhật**: 20/11/2025  
**Tác giả**: Smart City Vietnam Team  
**License**: MIT License  

---

**Happy Linking! 🔗🌐**
