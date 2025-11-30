# Quick Reference Guide: Weather & Air Quality Endpoints

## Running the Backend

```bash
cd backend
npm run dev
```

Backend will be available at: `http://localhost:5000`

## Running Tests

```bash
# Test all endpoints
npm run test:all

# Test individual endpoints
npm run test:camera
npm run test:weather
npm run test:airquality

# Test connections
npm run test:connections
```

## Weather Endpoint

### Base URL
```
GET http://localhost:5000/api/weather
```

### Quick Examples

```bash
# Get all weather data
curl http://localhost:5000/api/weather

# Filter by camera
curl "http://localhost:5000/api/weather?cameraId=urn:ngsi-ld:Camera:001"

# Limit results
curl "http://localhost:5000/api/weather?limit=10"

# Get single observation
curl http://localhost:5000/api/weather/urn:ngsi-ld:WeatherObserved:001
```

### Response Example
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "urn:ngsi-ld:WeatherObserved:001",
      "cameraId": "urn:ngsi-ld:Camera:001",
      "location": {
        "lat": 10.7769,
        "lng": 106.7009
      },
      "temperature": 28.5,
      "humidity": 75,
      "precipitation": 0,
      "windSpeed": 15,
      "windDirection": "N",
      "weatherType": "Clear",
      "pressure": 1013,
      "visibility": 10000,
      "dateObserved": "2025-11-10T10:00:00Z"
    }
  ]
}
```

### Query Parameters

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `cameraId` | string | `?cameraId=urn:ngsi-ld:Camera:001` | Filter by specific camera |
| `limit` | integer | `?limit=50` | Limit results (1-1000, default: 100) |

## Air Quality Endpoint

### Base URL
```
GET http://localhost:5000/api/air-quality
```

### Quick Examples

```bash
# Get all air quality data
curl http://localhost:5000/api/air-quality

# Filter by AQI level
curl "http://localhost:5000/api/air-quality?level=hazardous"

# Filter by minimum AQI
curl "http://localhost:5000/api/air-quality?minAqi=100"

# Combined filters
curl "http://localhost:5000/api/air-quality?level=unhealthy&minAqi=150"

# Limit results
curl "http://localhost:5000/api/air-quality?limit=10"

# Get single observation
curl http://localhost:5000/api/air-quality/urn:ngsi-ld:AirQualityObserved:001
```

### Response Example
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "urn:ngsi-ld:AirQualityObserved:001",
      "cameraId": "urn:ngsi-ld:Camera:001",
      "location": {
        "lat": 10.7769,
        "lng": 106.7009
      },
      "aqi": 85,
      "pm25": 35.5,
      "pm10": 65.2,
      "no2": 42.3,
      "o3": 58.7,
      "co": 1.2,
      "so2": 15.8,
      "level": "moderate",
      "colorCode": "#ffff00",
      "dateObserved": "2025-11-10T10:00:00Z"
    }
  ]
}
```

### Query Parameters

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `level` | string | `good`, `moderate`, `unhealthy_sensitive`, `unhealthy`, `very_unhealthy`, `hazardous` | Filter by AQI level |
| `minAqi` | number | 0+ | Filter by minimum AQI value |
| `limit` | integer | 1-1000 | Limit results (default: 100) |

### AQI Levels Quick Reference

| Level | AQI Range | Color | Hex Code |
|-------|-----------|-------|----------|
| good | 0-50 | 🟢 Green | #00e400 |
| moderate | 51-100 | 🟡 Yellow | #ffff00 |
| unhealthy_sensitive | 101-150 | 🟠 Orange | #ff7e00 |
| unhealthy | 151-200 | 🔴 Red | #ff0000 |
| very_unhealthy | 201-300 | 🟣 Purple | #8f3f97 |
| hazardous | 301+ | 🟤 Maroon | #7e0023 |

## Camera Endpoint (Reference)

### Base URL
```
GET http://localhost:5000/api/cameras
```

### Quick Examples

```bash
# Get all cameras
curl http://localhost:5000/api/cameras

# Filter by status
curl "http://localhost:5000/api/cameras?status=active"

# Filter by type
curl "http://localhost:5000/api/cameras?type=traffic"

# Bounding box filter
curl "http://localhost:5000/api/cameras?minLat=10.7&maxLat=10.8&minLng=106.6&maxLng=106.8"
```

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
// Fetch weather data
async function getWeather(cameraId?: string) {
  const params = new URLSearchParams();
  if (cameraId) params.append('cameraId', cameraId);
  
  const response = await fetch(`http://localhost:5000/api/weather?${params}`);
  const { data } = await response.json();
  return data;
}

// Fetch air quality data with color
async function getAirQuality(level?: string, minAqi?: number) {
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  if (minAqi) params.append('minAqi', minAqi.toString());
  
  const response = await fetch(`http://localhost:5000/api/air-quality?${params}`);
  const { data } = await response.json();
  return data;
}

// Display on map with colored markers
data.forEach(aq => {
  addMarker(aq.location, {
    color: aq.colorCode,
    label: `AQI: ${aq.aqi}`,
    popup: `Level: ${aq.level}<br>PM2.5: ${aq.pm25}`
  });
});
```

### React Example

```tsx
import { useEffect, useState } from 'react';

function AirQualityMap() {
  const [airQuality, setAirQuality] = useState([]);
  const [level, setLevel] = useState('');
  
  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      
      const response = await fetch(`/api/air-quality?${params}`);
      const { data } = await response.json();
      setAirQuality(data);
    };
    
    fetchData();
  }, [level]);
  
  return (
    <div>
      <select onChange={(e) => setLevel(e.target.value)}>
        <option value="">All Levels</option>
        <option value="good">Good</option>
        <option value="moderate">Moderate</option>
        <option value="unhealthy">Unhealthy</option>
        <option value="hazardous">Hazardous</option>
      </select>
      
      {airQuality.map(aq => (
        <Marker
          key={aq.id}
          position={[aq.location.lat, aq.location.lng]}
          icon={{ color: aq.colorCode }}
        >
          <Popup>
            <h3>AQI: {aq.aqi}</h3>
            <p>Level: {aq.level}</p>
            <p>PM2.5: {aq.pm25} μg/m³</p>
            <p>PM10: {aq.pm10} μg/m³</p>
          </Popup>
        </Marker>
      ))}
    </div>
  );
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid limit parameter. Must be a number between 1 and 1000.",
  "error": "Invalid value: 1500"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Weather observation not found",
  "error": "Entity not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch air quality data",
  "error": "Connection to Stellio Context Broker failed"
}
```

### Handling Errors in Code

```typescript
async function fetchAirQuality(level?: string) {
  try {
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    
    const response = await fetch(`/api/air-quality?${params}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const { data } = await response.json();
    return data;
    
  } catch (error) {
    console.error('Failed to fetch air quality:', error.message);
    // Show user-friendly error message
    alert('Unable to load air quality data. Please try again.');
    return [];
  }
}
```

## Troubleshooting

### Backend not responding
```bash
# Check if backend is running
curl http://localhost:5000/health

# Restart backend
cd backend
npm run dev
```

### No data returned
```bash
# Check Stellio connection
curl http://localhost:8080/ngsi-ld/v1/entities?type=WeatherObserved
curl http://localhost:8080/ngsi-ld/v1/entities?type=AirQualityObserved

# Check backend logs
tail -f backend/logs/error.log
```

### Type errors in TypeScript
```bash
# Rebuild TypeScript
cd backend
npm run build
```

## Performance Tips

1. **Use appropriate limits**
   ```bash
   # Don't fetch all data if you only need a few records
   curl "http://localhost:5000/api/weather?limit=20"
   ```

2. **Cache on frontend**
   ```typescript
   // Cache for 5 minutes
   const CACHE_TIME = 5 * 60 * 1000;
   let cachedData = null;
   let cacheTime = 0;
   
   async function getWeather() {
     if (Date.now() - cacheTime < CACHE_TIME && cachedData) {
       return cachedData;
     }
     
     const response = await fetch('/api/weather');
     cachedData = await response.json();
     cacheTime = Date.now();
     return cachedData;
   }
   ```

3. **Use WebSocket for real-time updates**
   ```typescript
   const ws = new WebSocket('ws://localhost:5001');
   
   ws.onmessage = (event) => {
     const { type, data } = JSON.parse(event.data);
     
     if (type === 'weather') {
       updateWeatherMarkers(data);
     } else if (type === 'air_quality') {
       updateAQMarkers(data);
     }
   };
   ```

## Documentation Files


- **Weather API**: `WEATHER_API.md` - Complete weather endpoint documentation
- **Air Quality API**: `AIRQUALITY_API.md` - Complete air quality endpoint documentation
- **Implementation**: `WEATHER_AIRQUALITY_IMPLEMENTATION.md` - Technical implementation details
- **Camera API**: `CAMERA_API.md` - Camera endpoint documentation
- **New Endpoints**: `NEW_ENDPOINTS_DOCUMENTATION.md` - Historical AQI & Hotspots documentation

---

## 🆕 NEW ENDPOINTS (Historical AQI & Accident Hotspots)

### Historical AQI Trends - GET /api/historical/aqi

Query historical AQI data from Fuseki via SPARQL:

```bash
# Last 7 days, raw data
curl "http://localhost:5000/api/historical/aqi?days=7"

# Last 30 days, daily averages
curl "http://localhost:5000/api/historical/aqi?days=30&groupBy=day"

# Specific camera, hourly data
curl "http://localhost:5000/api/historical/aqi?cameraId=urn:ngsi-ld:Camera:001&groupBy=hour"
```

**Parameters:**
- `days` (number, default: 7): Days to query (1-365)
- `cameraId` (string, optional): Filter by camera ID
- `groupBy` (string, optional): 'hour', 'day', or none

**Response Format:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "cameraId": "urn:ngsi-ld:Camera:001",
      "timestamps": ["2025-11-04T10:00:00Z", ...],
      "aqi": [45, 52, 48, ...],
      "pm25": [12.3, 15.2, 14.1, ...],
      "pm10": [23.4, 28.1, 26.5, ...],
      "no2": [18.2, 20.5, 19.3, ...],
      "o3": [35.6, 38.2, 36.8, ...],
      "co": [0.8, 0.9, 0.85, ...],
      "so2": [5.2, 6.1, 5.8, ...]
    }
  ]
}
```

---

### Accident Hotspots - GET /api/analytics/hotspots

Identify accident hotspot cameras with risk analysis:

```bash
# Default: last 30 days, min 3 accidents
curl "http://localhost:5000/api/analytics/hotspots"

# Custom: last 60 days, min 5 accidents
curl "http://localhost:5000/api/analytics/hotspots?minAccidents=5&days=60"

# All accident locations in last 7 days
curl "http://localhost:5000/api/analytics/hotspots?minAccidents=1&days=7"
```

**Parameters:**
- `minAccidents` (number, default: 3): Minimum accidents to qualify
- `days` (number, default: 30): Days to analyze (1-365)

**Response Format:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "cameraId": "urn:ngsi-ld:Camera:001",
      "cameraName": "Nguyen Hue & Le Loi",
      "location": { "lat": 10.7769, "lng": 106.7009 },
      "accidentCount": 12,
      "severityBreakdown": {
        "severe": 3,
        "moderate": 5,
        "minor": 4
      },
      "mostCommonType": "collision",
      "timePattern": {
        "morning": 2,
        "afternoon": 5,
        "evening": 4,
        "night": 1
      },
      "riskScore": 78
    }
  ]
}
```

**Risk Score Algorithm (0-100):**
- 40% - Total accident count (normalized)
- 35% - Severe accidents (weighted)
- 15% - Moderate accidents (weighted)
- 10% - Time consistency (lower variance = higher risk)

**Time Patterns:**
- Morning: 6:00 - 12:00
- Afternoon: 12:00 - 18:00
- Evening: 18:00 - 00:00
- Night: 00:00 - 6:00

---

## Testing Scripts

- `test-weather-endpoint.js` - Weather API test suite (6 tests)
- `test-airquality-endpoint.js` - Air quality API test suite (8 tests)
- `test-all-endpoints.js` - Combined test runner for all endpoints

---

## 🆕 NEW ENDPOINTS

### WebSocket Real-Time Updates

**Connection:** `ws://localhost:8081`

```javascript
const ws = new WebSocket('ws://localhost:8081');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'ping') {
    ws.send(JSON.stringify({ type: 'pong' }));
  } else if (msg.type === 'accident_alert') {
    alert('SEVERE ACCIDENT: ' + msg.data.message);
  } else {
    console.log('Update:', msg.type);
  }
};
```

**Event Types:**
- `initial` - Full data snapshot on connection
- `camera_update` - Camera data changed
- `weather_update` - Weather data changed
- `aqi_update` - Air quality data changed
- `new_accident` - New accident detected
- `pattern_change` - Traffic pattern updated
- `accident_alert` - Severe accident (HIGH PRIORITY)
- `aqi_warning` - AQI > 150 (MEDIUM PRIORITY)
- `ping` - Heartbeat (respond with pong)

**Features:**
- ✅ Change detection (only broadcasts what changed)
- ✅ Polls Stellio every 30 seconds
- ✅ Heartbeat ping/pong every 10 seconds
- ✅ Priority alerts for severe accidents & high AQI

**📚 Full Documentation:** [WEBSOCKET_REALTIME_UPDATES.md](./WEBSOCKET_REALTIME_UPDATES.md)

---

### Correlation API

**Endpoint:** `GET /api/correlations/accident-pattern`

```bash
# Get accident-pattern correlation analysis
curl http://localhost:5000/api/correlations/accident-pattern | jq
```

**Response:**
```json
{
  "success": true,
  "data": {
    "correlationRate": 71,
    "totalAccidents": 45,
    "accidentsWithPatterns": 32,
    "byCongestion": { "high": 20, "medium": 8, "low": 4 },
    "byPattern": [{
      "patternType": "rush_hour",
      "accidentCount": 12,
      "avgSeverity": "moderate",
      "congestionLevel": "high"
    }],
    "insights": "71% of accidents correlate with known traffic patterns..."
  }
}
```

**What It Does:**
- Matches accidents with traffic patterns by camera, time, and day
- Calculates correlation rate (% of accidents matching patterns)
- Shows congestion breakdown (high/medium/low)
- Identifies most dangerous patterns
- Generates human-readable insights

**📚 Full Documentation:** [CORRELATION_API_DOCUMENTATION.md](./CORRELATION_API_DOCUMENTATION.md)

---

## Support

Need help? Check:
- Backend logs: `backend/logs/error.log`
- Stellio entities: `http://localhost:8080/ngsi-ld/v1/entities`
- Connection test: `npm run test:connections`
- Debug mode: Set `NODE_ENV=development` in `.env`
- **Historical & Analytics Docs**: `NEW_ENDPOINTS_DOCUMENTATION.md`
- **WebSocket & Correlation Docs**: `NEW_ENDPOINTS_SUMMARY.md`

---

**Last Updated:** January 15, 2024  
**Version:** 1.2.0  
**Status:** ✅ Production Ready (Including WebSocket & Correlation APIs)

