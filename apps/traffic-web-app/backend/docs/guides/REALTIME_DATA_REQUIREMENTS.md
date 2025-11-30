# Yêu cầu Dữ liệu Realtime cho Routing System

## Tổng quan
Để hệ thống routing tính toán routes dựa trên dữ liệu thực tế (không dùng mock data), cần các nguồn dữ liệu realtime sau:

---

## 1. 🌫️ DỮ LIỆU CHẤT LƯỢNG KHÔNG KHÍ (Air Quality)

### Entity Type: `AirQualityObserved`
### Nguồn dữ liệu: Stellio Context Broker (port 8080)

### Các trường bắt buộc:
```typescript
interface AirQuality {
  id: string;
  type: 'AirQualityObserved';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  aqi: {
    type: 'Property';
    value: number; // 0-500 (AQI Index)
  };
  co?: number;    // Carbon monoxide (µg/m³)
  no2?: number;   // Nitrogen dioxide (µg/m³)
  pm10?: number;  // PM10 (µg/m³)
  pm25?: number;  // PM2.5 (µg/m³)
  so2?: number;   // Sulfur dioxide (µg/m³)
  observedAt: string; // ISO timestamp
}
```

### Yêu cầu:
- **Số lượng tối thiểu**: 10-20 trạm đo khắp TP.HCM
- **Tần suất cập nhật**: Mỗi 15-30 phút
- **Vị trí**: Phân bố đều các quận (Quận 1, 3, 5, 7, Bình Thạnh, Thủ Đức, v.v.)
- **Giá trị AQI thực tế**: 
  - Good: 0-50
  - Moderate: 51-100
  - Unhealthy for Sensitive Groups: 101-150
  - Unhealthy: 151-200
  - Very Unhealthy: 201-300
  - Hazardous: 301-500

### API để lấy dữ liệu:
```bash
GET http://localhost:8080/ngsi-ld/v1/entities?type=AirQualityObserved
```

### Nguồn tích hợp gợi ý:
- **IQAir API**: https://www.iqair.com/vietnam/ho-chi-minh-city
- **OpenWeatherMap Air Pollution API**: https://openweathermap.org/api/air-pollution
- **Government sensors**: Sở Tài nguyên & Môi trường TP.HCM
- **IoT sensors**: Mạng lưới cảm biến IoT riêng

---

## 2. 🌦️ DỮ LIỆU THỜI TIẾT (Weather)

### Entity Type: `WeatherObserved`
### Nguồn dữ liệu: Stellio Context Broker (port 8080)

### Các trường bắt buộc:
```typescript
interface Weather {
  id: string;
  type: 'WeatherObserved';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  temperature: {
    type: 'Property';
    value: number; // Celsius
  };
  humidity: {
    type: 'Property';
    value: number; // 0-100%
  };
  precipitation: {
    type: 'Property';
    value: number; // mm/h (lượng mưa)
  };
  visibility: {
    type: 'Property';
    value: number; // km
  };
  windSpeed?: number;      // km/h
  windDirection?: number;  // degrees
  pressure?: number;       // hPa
  observedAt: string;      // ISO timestamp
}
```

### Yêu cầu:
- **Số lượng tối thiểu**: 10-15 trạm khí tượng
- **Tần suất cập nhật**: Mỗi 10-15 phút
- **Vị trí**: Phân bố theo các khu vực khác nhau
- **Giá trị quan trọng**:
  - **precipitation** (lượng mưa): 0-100mm/h - ảnh hưởng đến an toàn lái xe
  - **visibility** (tầm nhìn): 0-10km - quan trọng cho điều kiện giao thông

### API để lấy dữ liệu:
```bash
GET http://localhost:8080/ngsi-ld/v1/entities?type=WeatherObserved
```

### Nguồn tích hợp gợi ý:
- **OpenWeatherMap API**: https://openweathermap.org/api
- **WeatherAPI**: https://www.weatherapi.com/
- **AccuWeather**: https://developer.accuweather.com/
- **Vietnam Meteorological Service**: Trung tâm Khí tượng Thủy văn Quốc gia

---

## 3. 🚗 DỮ LIỆU TAI NẠN (Accidents)

### Entity Type: `Accident`
### Nguồn dữ liệu: Neo4j Database (port 7687)

### Các trường bắt buộc:
```typescript
interface Accident {
  id: string;
  type: 'Accident';
  location: {
    latitude: number;
    longitude: number;
  };
  severity: 'fatal' | 'severe' | 'moderate' | 'minor';
  timestamp: string; // ISO timestamp
  description?: string;
  vehiclesInvolved?: number;
  casualties?: number;
  roadCondition?: string;
  weatherCondition?: string;
}
```

### Yêu cầu:
- **Dữ liệu lịch sử**: 6-12 tháng gần nhất
- **Realtime**: Tai nạn xảy ra trong vòng 2-4 giờ gần đây
- **Tần suất cập nhật**: Realtime (khi có báo cáo)
- **Nguồn**: 
  - Báo cáo từ CSGT
  - Báo cáo từ người dân qua app
  - Camera AI phát hiện tai nạn
  - Hệ thống 911/113

### API để lấy dữ liệu:
```bash
# Neo4j Cypher Query
MATCH (a:Accident)
WHERE a.timestamp > datetime() - duration({hours: 4})
RETURN a
```

### Nguồn tích hợp gợi ý:
- **Police Traffic System**: Hệ thống CSGT
- **Emergency Call System**: Tổng đài 113
- **Crowdsourcing**: App báo cáo từ người dân (Zalo, Facebook groups)
- **Camera AI**: Phát hiện tai nạn từ camera giao thông

---

## 4. 🚦 DỮ LIỆU GIAO THÔNG (Traffic Patterns)

### Entity Type: `TrafficPattern` hoặc `TrafficFlowPattern`
### Nguồn dữ liệu: Stellio Context Broker (port 8080)

### Các trường bắt buộc:
```typescript
interface TrafficPattern {
  id: string;
  type: 'TrafficPattern';
  location: {
    startPoint: {
      latitude: number;
      longitude: number;
    };
    endPoint?: {
      latitude: number;
      longitude: number;
    };
  };
  congestionLevel: 'low' | 'moderate' | 'high' | 'severe';
  averageSpeed: number;      // km/h
  vehicleCount?: number;     // số xe/phút
  occupancyRate?: number;    // 0-100%
  timestamp: string;         // ISO timestamp
}
```

### Yêu cầu:
- **Số lượng**: 40-100 điểm đo khắp TP.HCM
- **Tần suất cập nhật**: Mỗi 1-5 phút (realtime)
- **Nguồn**: Camera giao thông, cảm biến đường
- **Giá trị congestionLevel**:
  - **low**: < 30% occupancy, speed > 40 km/h
  - **moderate**: 30-60% occupancy, speed 20-40 km/h
  - **high**: 60-85% occupancy, speed 10-20 km/h
  - **severe**: > 85% occupancy, speed < 10 km/h

### API để lấy dữ liệu:
```bash
GET http://localhost:8080/ngsi-ld/v1/entities?type=TrafficPattern
# hoặc
GET http://localhost:8080/ngsi-ld/v1/entities?type=TrafficFlowPattern
```

### Nguồn tích hợp gợi ý:
- **Camera giao thông**: Phân tích video từ 300+ camera CSGT
- **Google Maps Traffic API**: https://developers.google.com/maps/documentation/javascript/trafficlayer
- **HERE Traffic API**: https://developer.here.com/products/traffic-api
- **TomTom Traffic API**: https://developer.tomtom.com/traffic-api
- **GPS data**: Từ các app như Grab, Gojek, Be

---

## 5. 🎥 DỮ LIỆU CAMERA (Camera Locations)

### Entity Type: `Camera`
### Nguồn dữ liệu: Stellio Context Broker (port 8080)

### Các trường bắt buộc:
```typescript
interface Camera {
  id: string;
  type: 'Camera';
  name?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    // hoặc
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive' | 'maintenance';
  address?: string;
  direction?: string;
}
```

### Yêu cầu:
- **Số lượng**: 40-300+ cameras
- **Vị trí**: Phân bố đều khắp TP.HCM
- **Mục đích**: Dùng để tạo Voronoi zones phân vùng thành phố

---

## 📊 Kiến trúc Tích hợp Dữ liệu

```
┌─────────────────────────────────────────────────────────┐
│              External Data Sources                       │
├─────────────────────────────────────────────────────────┤
│  • Air Quality Sensors (IQAir, OpenWeather)            │
│  • Weather Stations (OpenWeatherMap, AccuWeather)       │
│  • Traffic Cameras (CSGT, Google Maps Traffic)         │
│  • Accident Reports (Police, 113, Crowdsource)         │
│  • GPS Tracking (Grab, Gojek, Be)                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           Data Ingestion Layer (ETL)                     │
├─────────────────────────────────────────────────────────┤
│  • API Polling Services (Python/Node.js)                │
│  • Webhooks / Real-time listeners                       │
│  • Data transformation & validation                     │
│  • Rate limiting & caching                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Data Storage Layer                          │
├─────────────────────────────────────────────────────────┤
│  • Stellio Context Broker (NGSI-LD)                    │
│    - AirQualityObserved entities                       │
│    - WeatherObserved entities                          │
│    - TrafficPattern entities                           │
│    - Camera entities                                   │
│                                                         │
│  • Neo4j Graph Database                                │
│    - Accident nodes & relationships                    │
│                                                         │
│  • PostgreSQL (optional)                               │
│    - Historical data for analytics                     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│           Backend API (Current System)                  │
├─────────────────────────────────────────────────────────┤
│  • routing.ts - Route calculation                       │
│  • genericNgsiService.ts - Fetch from Stellio          │
│  • neo4jService.ts - Fetch accidents                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend (User Interface)                   │
├─────────────────────────────────────────────────────────┤
│  • RoutePlanner component                               │
│  • RouteVisualization component                        │
│  • Real-time score updates                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Cách Tích hợp Dữ liệu Realtime

### Option 1: Polling từ External APIs
```typescript
// backend/src/services/dataIngestionService.ts

import axios from 'axios';
import { stellioService } from './stellioService';

class DataIngestionService {
  // Poll OpenWeatherMap mỗi 15 phút
  async pollWeatherData() {
    const cities = ['Ho Chi Minh City', 'Thu Duc', 'Binh Thanh'];
    
    for (const city of cities) {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: city,
            appid: process.env.OPENWEATHER_API_KEY,
            units: 'metric'
          }
        }
      );
      
      // Transform to NGSI-LD format
      const weatherEntity = {
        id: `urn:ngsi-ld:WeatherObserved:${city}`,
        type: 'WeatherObserved',
        location: {
          type: 'Point',
          coordinates: [response.data.coord.lon, response.data.coord.lat]
        },
        temperature: { type: 'Property', value: response.data.main.temp },
        humidity: { type: 'Property', value: response.data.main.humidity },
        precipitation: { type: 'Property', value: response.data.rain?.['1h'] || 0 },
        visibility: { type: 'Property', value: response.data.visibility / 1000 }
      };
      
      // Push to Stellio
      await stellioService.createOrUpdateEntity(weatherEntity);
    }
  }
  
  // Tương tự cho AQI, Traffic, v.v.
}
```

### Option 2: Webhooks
```typescript
// backend/src/routes/webhooks.ts

router.post('/webhooks/accident', async (req, res) => {
  const accidentData = req.body;
  
  // Validate data
  if (!accidentData.location || !accidentData.severity) {
    return res.status(400).json({ error: 'Invalid data' });
  }
  
  // Save to Neo4j
  await neo4jService.createAccident({
    id: `accident-${Date.now()}`,
    location: accidentData.location,
    severity: accidentData.severity,
    timestamp: new Date().toISOString()
  });
  
  // Broadcast to WebSocket clients
  websocketService.broadcast('accident_reported', accidentData);
  
  res.json({ success: true });
});
```

### Option 3: Cron Jobs
```typescript
// backend/src/jobs/dataUpdateJob.ts

import cron from 'node-cron';

// Chạy mỗi 10 phút
cron.schedule('*/10 * * * *', async () => {
  console.log('Updating realtime data...');
  
  await Promise.all([
    dataIngestionService.pollWeatherData(),
    dataIngestionService.pollAirQualityData(),
    dataIngestionService.pollTrafficData()
  ]);
  
  console.log('Data update complete');
});
```

---

## 📝 Checklist Triển khai

### Phase 1: Setup Data Sources
- [ ] Đăng ký API keys cho OpenWeatherMap, IQAir
- [ ] Thiết lập webhook endpoints cho accident reports
- [ ] Cấu hình Stellio Context Broker với entities mẫu
- [ ] Thiết lập Neo4j database với accident data

### Phase 2: Data Ingestion
- [ ] Tạo service polling dữ liệu từ external APIs
- [ ] Transform data sang NGSI-LD format
- [ ] Push data vào Stellio Context Broker
- [ ] Setup cron jobs để update định kỳ

### Phase 3: Validation & Testing
- [ ] Verify data có đủ các trường bắt buộc
- [ ] Test routing với data thực
- [ ] Monitor API rate limits
- [ ] Setup error handling & retry logic

### Phase 4: Monitoring & Optimization
- [ ] Dashboard để monitor data freshness
- [ ] Alert khi data quá cũ (> 30 phút)
- [ ] Cache data để giảm API calls
- [ ] Log data quality metrics

---

## 🎯 Kết luận

**Để hệ thống routing hoạt động với dữ liệu realtime**, bạn cần:

1. **Tích hợp ít nhất 3 nguồn dữ liệu chính**:
   - Air Quality API (IQAir/OpenWeather)
   - Weather API (OpenWeatherMap)
   - Traffic API (Google Maps/HERE/TomTom)

2. **Setup data pipeline**:
   - Polling service chạy mỗi 10-15 phút
   - Transform data sang NGSI-LD format
   - Store vào Stellio Context Broker

3. **Hoặc sử dụng mock data có biến đổi** (như code đã sửa):
   - Dựa trên vị trí camera để tạo giá trị đa dạng
   - Đủ để demo và test chức năng
   - Không cần API keys hay external services

**Mock data hiện tại** đã đủ để:
- ✅ Demo chức năng routing
- ✅ Test algorithm tính scores
- ✅ Show khác biệt giữa các routes
- ✅ Development và testing

**Realtime data** cần khi:
- ⚠️ Production deployment
- ⚠️ Cần độ chính xác cao
- ⚠️ Phục vụ người dùng thật
- ⚠️ Ra quyết định dựa trên điều kiện thực tế
