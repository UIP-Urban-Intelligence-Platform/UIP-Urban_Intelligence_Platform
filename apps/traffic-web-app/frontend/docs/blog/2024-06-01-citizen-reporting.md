---
slug: citizen-reporting-system
title: 📱 Xây dựng Hệ thống Báo cáo Công dân
authors: [nguyendinhanhtuan]
tags: [uip, citizen-report, api, backend, mobile]
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Blog post: Citizen Reporting System.

Module: apps/traffic-web-app/frontend/docs/blog/2024-06-01-citizen-reporting.md
Author: UIP Team
Version: 1.0.0
-->

# Citizen Reporting - Dân chủ hóa Giám sát Giao thông 👥

UIP không chỉ dựa vào camera - chúng tôi tin rằng **người dân** là nguồn thông tin quý giá nhất. Bài viết này chia sẻ cách xây dựng hệ thống Citizen Reporting.

<!-- truncate -->

## 🎯 Tầm nhìn

> "Mỗi người dân là một sensor di động cho thành phố thông minh"

### Lợi ích của Citizen Reports

- 📍 **Phủ sóng rộng** - Đến cả nơi không có camera
- 🔍 **Chi tiết hơn** - Mô tả ngữ cảnh đầy đủ
- ⚡ **Real-time** - Báo cáo ngay lập tức
- 💡 **Insight mới** - Phát hiện vấn đề chưa biết

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  CitizenReportForm → CitizenReportMap → CitizenReportList   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (FastAPI)                     │
│  POST /api/citizen-reports → Validation → Processing        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Processing Pipeline                       │
│  Image Analysis → Location Verification → NGSI-LD Transform │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Storage Layer                           │
│  MongoDB (reports) → Stellio (NGSI-LD) → Fuseki (RDF)       │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Data Model

### TypeScript Interface

```typescript
// types/citizenReport.ts
export interface CitizenReport {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
    address?: string;
  };
  images: string[];
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "verified" | "resolved" | "rejected";
  reporter: {
    name?: string;
    phone?: string;
    email?: string;
    isAnonymous: boolean;
  };
  metadata: {
    submittedAt: string;
    verifiedAt?: string;
    resolvedAt?: string;
    source: "web" | "mobile" | "api";
    deviceInfo?: string;
  };
}

export enum ReportType {
  ACCIDENT = "accident",
  CONGESTION = "congestion",
  ROAD_DAMAGE = "road_damage",
  ILLEGAL_PARKING = "illegal_parking",
  TRAFFIC_LIGHT = "traffic_light",
  FLOODING = "flooding",
  OTHER = "other"
}
```

### NGSI-LD Entity

```json
{
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "id": "urn:ngsi-ld:CitizenReport:CR2024051501",
  "type": "CitizenReport",
  "reportType": {
    "type": "Property",
    "value": "accident"
  },
  "description": {
    "type": "Property",
    "value": "Va chạm giữa 2 xe máy tại ngã tư"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6885, 10.7626]
    }
  },
  "severity": {
    "type": "Property",
    "value": "high"
  },
  "status": {
    "type": "Property",
    "value": "verified"
  },
  "reportedAt": {
    "type": "Property",
    "value": "2024-05-15T08:30:00Z"
  },
  "refNearbyCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:TrafficCamera:CAM045"
  }
}
```

## 💻 Backend Implementation

### FastAPI Endpoint

```python
# api/citizen_reports.py
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel, validator

router = APIRouter(prefix="/api/citizen-reports", tags=["Citizen Reports"])

class CitizenReportCreate(BaseModel):
    type: ReportType
    title: str
    description: str
    latitude: float
    longitude: float
    severity: Severity
    reporter_name: Optional[str] = None
    reporter_phone: Optional[str] = None
    is_anonymous: bool = False
    
    @validator('latitude')
    def validate_lat(cls, v):
        if not (10.3 <= v <= 11.2):  # HCMC bounds
            raise ValueError('Location must be in HCMC')
        return v

@router.post("/", response_model=CitizenReportResponse)
async def create_report(
    report: CitizenReportCreate,
    images: List[UploadFile] = File(default=[]),
    db: MongoDB = Depends(get_db),
    stellio: StellioClient = Depends(get_stellio)
):
    """Submit a new citizen report"""
    
    # 1. Validate and process images
    image_urls = await process_images(images)
    
    # 2. Reverse geocode location
    address = await reverse_geocode(report.latitude, report.longitude)
    
    # 3. Find nearby cameras for correlation
    nearby_cameras = await find_nearby_cameras(
        report.latitude, 
        report.longitude,
        radius_meters=500
    )
    
    # 4. Create report document
    report_doc = {
        "id": generate_report_id(),
        "type": report.type.value,
        "title": report.title,
        "description": report.description,
        "location": {
            "type": "Point",
            "coordinates": [report.longitude, report.latitude],
            "address": address
        },
        "images": image_urls,
        "severity": report.severity.value,
        "status": "pending",
        "reporter": {
            "name": report.reporter_name,
            "phone": report.reporter_phone,
            "isAnonymous": report.is_anonymous
        },
        "nearbyCameras": [cam.id for cam in nearby_cameras],
        "metadata": {
            "submittedAt": datetime.utcnow().isoformat(),
            "source": "web"
        }
    }
    
    # 5. Store in MongoDB
    result = await db.citizen_reports.insert_one(report_doc)
    
    # 6. Publish to Stellio as NGSI-LD
    ngsi_entity = transform_to_ngsi_ld(report_doc)
    await stellio.create_entity(ngsi_entity)
    
    # 7. Trigger verification workflow
    await trigger_verification(report_doc)
    
    return CitizenReportResponse(**report_doc)
```

### Image Processing

```python
# services/image_processor.py
from PIL import Image
import boto3
from io import BytesIO

async def process_images(files: List[UploadFile]) -> List[str]:
    """Process and upload images to S3"""
    urls = []
    s3 = boto3.client('s3')
    
    for file in files:
        # Read and validate
        content = await file.read()
        img = Image.open(BytesIO(content))
        
        # Resize if too large
        max_size = (1920, 1080)
        img.thumbnail(max_size, Image.LANCZOS)
        
        # Strip EXIF (privacy)
        img_clean = Image.new(img.mode, img.size)
        img_clean.putdata(list(img.getdata()))
        
        # Compress
        buffer = BytesIO()
        img_clean.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        
        # Upload to S3
        key = f"citizen-reports/{uuid4()}.jpg"
        s3.upload_fileobj(
            buffer,
            BUCKET_NAME,
            key,
            ExtraArgs={'ContentType': 'image/jpeg'}
        )
        
        urls.append(f"https://{BUCKET_NAME}.s3.amazonaws.com/{key}")
    
    return urls
```

## 🎨 Frontend Implementation

### Report Form Component

```tsx
// components/CitizenReportForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapContainer, Marker, useMapEvents } from 'react-leaflet';

const reportSchema = z.object({
  type: z.enum(['accident', 'congestion', 'road_damage', ...]),
  title: z.string().min(10).max(100),
  description: z.string().min(20).max(1000),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  images: z.array(z.instanceof(File)).max(5),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  })
});

export const CitizenReportForm: React.FC = () => {
  const [location, setLocation] = useState<LatLng | null>(null);
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(reportSchema)
  });
  
  const mutation = useMutation({
    mutationFn: submitReport,
    onSuccess: () => {
      toast.success('Báo cáo đã được gửi thành công!');
      navigate('/reports');
    }
  });
  
  return (
    <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
      {/* Report Type */}
      <div>
        <label>Loại báo cáo</label>
        <select {...register('type')} className="w-full p-3 border rounded">
          <option value="accident">🚨 Tai nạn</option>
          <option value="congestion">🚗 Ùn tắc</option>
          <option value="road_damage">🛣️ Hư hỏng đường</option>
          <option value="illegal_parking">🅿️ Đậu xe trái phép</option>
          <option value="flooding">🌊 Ngập nước</option>
        </select>
      </div>
      
      {/* Location Picker */}
      <div>
        <label>Vị trí</label>
        <MapContainer 
          center={[10.7731, 106.7004]} 
          zoom={15}
          className="h-64 rounded"
        >
          <LocationPicker onLocationSelect={setLocation} />
          {location && <Marker position={location} />}
        </MapContainer>
      </div>
      
      {/* Image Upload */}
      <div>
        <label>Hình ảnh (tối đa 5)</label>
        <ImageUploader
          maxFiles={5}
          accept="image/*"
          {...register('images')}
        />
      </div>
      
      {/* Description */}
      <div>
        <label>Mô tả chi tiết</label>
        <textarea 
          {...register('description')}
          rows={4}
          placeholder="Mô tả tình huống bạn gặp phải..."
          className="w-full p-3 border rounded"
        />
      </div>
      
      {/* Severity */}
      <div>
        <label>Mức độ nghiêm trọng</label>
        <SeveritySelector {...register('severity')} />
      </div>
      
      <button 
        type="submit" 
        disabled={mutation.isPending}
        className="w-full py-3 bg-blue-600 text-white rounded"
      >
        {mutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
      </button>
    </form>
  );
};
```

## 📊 Verification Workflow

```python
# workflows/verify_citizen_report.py
from prefect import flow, task

@flow(name="verify-citizen-report")
async def verify_report(report_id: str):
    """Automatic verification workflow"""
    
    # 1. Load report
    report = await load_report(report_id)
    
    # 2. Image analysis
    image_analysis = await analyze_images(report.images)
    
    # 3. Cross-reference with camera data
    camera_correlation = await correlate_with_cameras(
        report.location,
        report.metadata.submittedAt,
        report.type
    )
    
    # 4. Check for duplicates
    duplicates = await find_similar_reports(
        report.location,
        report.type,
        time_window_minutes=30
    )
    
    # 5. Calculate confidence score
    confidence = calculate_confidence(
        image_analysis,
        camera_correlation,
        duplicates
    )
    
    # 6. Auto-verify or queue for manual review
    if confidence > 0.85:
        await verify_report(report_id, auto=True)
    elif confidence > 0.5:
        await queue_for_review(report_id, priority="normal")
    else:
        await queue_for_review(report_id, priority="high")
    
    return {
        "report_id": report_id,
        "confidence": confidence,
        "action_taken": "auto_verified" if confidence > 0.85 else "queued"
    }
```

## 📈 Statistics

Sau 2 tháng triển khai:

| Metric | Value |
|--------|-------|
| Tổng báo cáo | 2,847 |
| Đã xác minh | 2,431 (85%) |
| Thời gian xác minh TB | 12 phút |
| Báo cáo/ngày | ~47 |
| Loại phổ biến nhất | Ùn tắc (42%) |

## 🎓 Key Learnings

1. **Trust but verify** - Cần cơ chế xác minh tự động
2. **Privacy first** - Strip EXIF, allow anonymous
3. **Gamification helps** - Reward active reporters
4. **Mobile-first** - 78% báo cáo từ mobile

---

**Bạn muốn báo cáo sự cố?** Truy cập [Dashboard](/dashboard) ngay!

*Nguyễn Đình Anh Tuấn - Backend Developer @ UIP Team*
