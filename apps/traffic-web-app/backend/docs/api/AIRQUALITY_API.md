# Air Quality Endpoint Documentation

## Overview

The Air Quality endpoint provides access to AQI (Air Quality Index) data from the Stellio Context Broker with automatic camera location joining and comprehensive pollutant information.

## Endpoint

```
GET /api/air-quality
```

## Description

Fetches AirQualityObserved entities from Stellio and joins them with camera locations through the `refDevice` relationship. Extracts all major pollutants (PM2.5, PM10, NO2, O3, CO, SO2), calculates AQI level categories, and provides color codes for visualization.

## Query Parameters

| Parameter | Type | Values | Description | Example |
|-----------|------|--------|-------------|---------|
| `level` | string | See below | Filter by AQI level category | `?level=hazardous` |
| `minAqi` | number | 0+ | Filter by minimum AQI value | `?minAqi=100` |
| `limit` | integer | 1-1000 | Maximum records (default: 100) | `?limit=50` |

### AQI Level Categories

| Level | AQI Range | Color Code | Description |
|-------|-----------|------------|-------------|
| `good` | 0-50 | `#00e400` (Green) | Air quality is satisfactory |
| `moderate` | 51-100 | `#ffff00` (Yellow) | Acceptable for most people |
| `unhealthy_sensitive` | 101-150 | `#ff7e00` (Orange) | Unhealthy for sensitive groups |
| `unhealthy` | 151-200 | `#ff0000` (Red) | Everyone may experience health effects |
| `very_unhealthy` | 201-300 | `#8f3f97` (Purple) | Health alert: everyone may experience more serious effects |
| `hazardous` | 301+ | `#7e0023` (Maroon) | Health warning of emergency conditions |

### Query Parameter Details

#### level
- **Type**: `string`
- **Valid Values**: `good`, `moderate`, `unhealthy_sensitive`, `unhealthy`, `very_unhealthy`, `hazardous`
- **Case Sensitive**: No (converted to lowercase)
- **Example**: `GET /api/air-quality?level=hazardous`
- **Description**: Returns only observations matching the specified AQI level

#### minAqi
- **Type**: `number`
- **Range**: 0+
- **Example**: `GET /api/air-quality?minAqi=100`
- **Description**: Returns observations with AQI >= specified value
- **Use Case**: Find areas with concerning air quality

#### limit
- **Type**: `integer`
- **Range**: 1-1000
- **Default**: 100
- **Example**: `GET /api/air-quality?limit=50`
- **Description**: Limits the maximum number of observations returned

## Request Examples

### Basic Request
```bash
curl http://localhost:5000/api/air-quality
```

### Filter by AQI Level
```bash
# Get hazardous air quality areas
curl http://localhost:5000/api/air-quality?level=hazardous

# Get unhealthy areas
curl http://localhost:5000/api/air-quality?level=unhealthy

# Get good air quality areas
curl http://localhost:5000/api/air-quality?level=good
```

### Filter by Minimum AQI
```bash
# Get areas with AQI >= 100 (unhealthy and above)
curl "http://localhost:5000/api/air-quality?minAqi=100"

# Get areas with AQI >= 150 (very concerning)
curl "http://localhost:5000/api/air-quality?minAqi=150"
```

### Combined Filters
```bash
# Get hazardous areas with AQI >= 300, limited to 20 results
curl "http://localhost:5000/api/air-quality?level=hazardous&minAqi=300&limit=20"
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "count": 3,
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
    },
    {
      "id": "urn:ngsi-ld:AirQualityObserved:002",
      "cameraId": "urn:ngsi-ld:Camera:002",
      "location": {
        "lat": 10.7850,
        "lng": 106.6869
      },
      "aqi": 165,
      "pm25": 85.3,
      "pm10": 125.7,
      "no2": 78.2,
      "o3": 95.4,
      "co": 3.5,
      "so2": 45.6,
      "level": "unhealthy",
      "colorCode": "#ff0000",
      "dateObserved": "2025-11-10T10:05:00Z"
    },
    {
      "id": "urn:ngsi-ld:AirQualityObserved:003",
      "cameraId": "urn:ngsi-ld:Camera:003",
      "location": {
        "lat": 10.7350,
        "lng": 106.7190
      },
      "aqi": 320,
      "pm25": 195.8,
      "pm10": 285.3,
      "no2": 145.7,
      "o3": 178.2,
      "co": 8.9,
      "so2": 95.4,
      "level": "hazardous",
      "colorCode": "#7e0023",
      "dateObserved": "2025-11-10T10:10:00Z"
    }
  ]
}
```

### Response Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Indicates if the request was successful |
| `count` | integer | Yes | Number of air quality observations returned |
| `data` | Array<AirQuality> | Yes | Array of air quality observation objects |

### AirQuality Object Schema

| Field | Type | Required | Unit | Description |
|-------|------|----------|------|-------------|
| `id` | string | Yes | - | Unique observation identifier (NGSI-LD format) |
| `cameraId` | string | Yes | - | Associated camera ID ('unknown' if not linked) |
| `location.lat` | number | Yes | degrees | Observation latitude (WGS84) |
| `location.lng` | number | Yes | degrees | Observation longitude (WGS84) |
| `aqi` | number | Yes | index | Air Quality Index (0-500+) |
| `pm25` | number | Yes | μg/m³ | Fine particulate matter (PM2.5) |
| `pm10` | number | Yes | μg/m³ | Coarse particulate matter (PM10) |
| `no2` | number | Yes | μg/m³ | Nitrogen Dioxide |
| `o3` | number | Yes | μg/m³ | Ozone |
| `co` | number | Yes | mg/m³ | Carbon Monoxide |
| `so2` | number | Yes | μg/m³ | Sulfur Dioxide |
| `level` | string | Yes | - | AQI level category (see table above) |
| `colorCode` | string | Yes | hex | Color code for visualization |
| `dateObserved` | string | Yes | ISO 8601 | Timestamp of observation |

## Pollutant Information

### PM2.5 (Fine Particulate Matter)
- **Size**: ≤ 2.5 micrometers
- **Sources**: Vehicle emissions, industrial processes, wood burning
- **Health Impact**: Can penetrate deep into lungs
- **Unit**: μg/m³ (micrograms per cubic meter)

### PM10 (Coarse Particulate Matter)
- **Size**: ≤ 10 micrometers
- **Sources**: Dust, pollen, mold spores
- **Health Impact**: Can irritate respiratory system
- **Unit**: μg/m³

### NO2 (Nitrogen Dioxide)
- **Sources**: Vehicle emissions, power plants
- **Health Impact**: Respiratory irritation
- **Unit**: μg/m³

### O3 (Ozone)
- **Sources**: Photochemical reactions
- **Health Impact**: Respiratory problems
- **Unit**: μg/m³

### CO (Carbon Monoxide)
- **Sources**: Vehicle exhaust, incomplete combustion
- **Health Impact**: Reduces oxygen delivery to organs
- **Unit**: mg/m³ (milligrams per cubic meter)

### SO2 (Sulfur Dioxide)
- **Sources**: Fossil fuel combustion
- **Health Impact**: Respiratory system irritation
- **Unit**: μg/m³

## Error Responses

### 400 Bad Request - Invalid Level

```json
{
  "success": false,
  "message": "Invalid level parameter. Must be one of: good, moderate, unhealthy_sensitive, unhealthy, very_unhealthy, hazardous.",
  "error": "Invalid value: bad"
}
```

**Cause**: Level parameter is not one of the valid AQI levels

### 400 Bad Request - Invalid minAqi

```json
{
  "success": false,
  "message": "Invalid minAqi parameter. Must be a non-negative number.",
  "error": "Invalid value: -10"
}
```

**Cause**: minAqi parameter is negative or not a number

### 400 Bad Request - Invalid Limit

```json
{
  "success": false,
  "message": "Invalid limit parameter. Must be a number between 1 and 1000.",
  "error": "Invalid value: 1500"
}
```

**Cause**: Limit parameter is outside valid range

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to fetch air quality data",
  "error": "Connection to Stellio Context Broker failed"
}
```

**Cause**: Server-side error (Stellio unavailable, connection issues)

## AQI Calculation

The AQI level is automatically calculated based on the AQI value using EPA standards:

```typescript
function calculateAQILevel(aqi: number) {
  if (aqi <= 50) return 'good';                  // Green
  if (aqi <= 100) return 'moderate';             // Yellow
  if (aqi <= 150) return 'unhealthy_sensitive';  // Orange
  if (aqi <= 200) return 'unhealthy';            // Red
  if (aqi <= 300) return 'very_unhealthy';       // Purple
  return 'hazardous';                            // Maroon
}
```

### Color Code Mapping

```json
{
  "good": "#00e400",              // Green
  "moderate": "#ffff00",           // Yellow
  "unhealthy_sensitive": "#ff7e00", // Orange
  "unhealthy": "#ff0000",          // Red
  "very_unhealthy": "#8f3f97",     // Purple
  "hazardous": "#7e0023"           // Maroon
}
```

## Camera Join Mechanism

### How It Works

1. **Fetch AQ Entities**: Query Stellio for `AirQualityObserved` entities
2. **Extract refDevice**: Get camera reference from `refDevice` property
3. **Lookup Camera**: Fetch camera entity to get location
4. **Merge Data**: Combine air quality data with camera location
5. **Calculate Level**: Determine AQI category and color code
6. **Fallback**: If camera lookup fails, use AQ entity's own location

### NGSI-LD refDevice Formats Supported

```json
// Format 1: Direct string reference
{
  "refDevice": "urn:ngsi-ld:Camera:001"
}

// Format 2: NGSI-LD Relationship
{
  "refDevice": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:001"
  }
}

// Format 3: Property with value
{
  "refDevice": {
    "type": "Property",
    "value": "urn:ngsi-ld:Camera:001"
  }
}
```

## NGSI-LD Transformation

### Input (NGSI-LD Entity from Stellio)

```json
{
  "id": "urn:ngsi-ld:AirQualityObserved:001",
  "type": "AirQualityObserved",
  "refDevice": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:001"
  },
  "aqi": {
    "type": "Property",
    "value": 85
  },
  "pm25": {
    "type": "Property",
    "value": 35.5,
    "unitCode": "GQ"
  },
  "pm10": {
    "type": "Property",
    "value": 65.2,
    "unitCode": "GQ"
  },
  "no2": {
    "type": "Property",
    "value": 42.3,
    "unitCode": "GQ"
  },
  "o3": {
    "type": "Property",
    "value": 58.7,
    "unitCode": "GQ"
  },
  "co": {
    "type": "Property",
    "value": 1.2,
    "unitCode": "GP"
  },
  "so2": {
    "type": "Property",
    "value": 15.8,
    "unitCode": "GQ"
  },
  "dateObserved": {
    "type": "Property",
    "value": "2025-11-10T10:00:00Z"
  },
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ]
}
```

### Output (Flat Structure with Level & Color)

```json
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
```

## Data Source

- **Source**: Stellio Context Broker
- **Entity Type**: `AirQualityObserved`
- **Endpoint**: `http://localhost:8080/ngsi-ld/v1/entities`
- **Protocol**: NGSI-LD
- **Format**: JSON-LD

## Implementation Details

### Transformation Logic

1. **refDevice Extraction**: Handles multiple NGSI-LD relationship formats
2. **Camera Lookup**: Asynchronous camera entity fetch via getCameraById
3. **Location Fallback**: Uses AQ entity's own location if camera lookup fails
4. **Pollutant Extraction**: Supports both direct values and NGSI-LD Property format
5. **AQI Calculation**: Automatic level categorization based on AQI value
6. **Color Assignment**: Maps level to standard EPA color codes

### Performance Characteristics

- **Response Time**: <250ms (typical, includes camera lookups)
- **Stellio Timeout**: 10 seconds
- **Default Limit**: 100 observations
- **Maximum Limit**: 1000 observations
- **Async Operations**: Parallel camera lookups
- **Caching**: None (real-time data)

## Error Handling

Comprehensive error handling includes:

1. **Parameter Validation**: Validates level, minAqi, and limit parameters
2. **Stellio Connection**: Catches and logs connection failures
3. **Camera Lookup**: Gracefully handles missing cameras
4. **Data Transformation**: Handles missing/malformed NGSI-LD properties with defaults
5. **Level Calculation**: Always returns valid level and color code
6. **Logging**: All operations logged with full context

## Testing

### Manual Testing

```bash
# Start backend
cd backend
npm run dev

# Test basic endpoint
curl http://localhost:5000/api/air-quality

# Test with filters
curl "http://localhost:5000/api/air-quality?level=hazardous"
curl "http://localhost:5000/api/air-quality?minAqi=100"
curl "http://localhost:5000/api/air-quality?level=unhealthy&minAqi=150"
```

### Using JavaScript/TypeScript

```typescript
import axios from 'axios';

// Get all air quality data
const response = await axios.get('http://localhost:5000/api/air-quality');
const { success, count, data } = response.data;

// Get hazardous areas
const response = await axios.get('http://localhost:5000/api/air-quality', {
  params: {
    level: 'hazardous'
  }
});

// Get areas with high AQI
const response = await axios.get('http://localhost:5000/api/air-quality', {
  params: {
    minAqi: 100
  }
});

// Display with color coding
data.forEach(aq => {
  console.log(`AQI: ${aq.aqi} - Level: ${aq.level} - Color: ${aq.colorCode}`);
  addMarkerToMap(aq.location, { color: aq.colorCode, aqi: aq.aqi });
});
```

## Health Recommendations by Level

### Good (0-50)
- **Color**: Green
- **Recommendation**: Air quality is satisfactory. Enjoy outdoor activities.

### Moderate (51-100)
- **Color**: Yellow
- **Recommendation**: Unusually sensitive people should consider limiting prolonged outdoor exertion.

### Unhealthy for Sensitive Groups (101-150)
- **Color**: Orange
- **Recommendation**: People with respiratory disease, children, and older adults should limit prolonged outdoor exertion.

### Unhealthy (151-200)
- **Color**: Red
- **Recommendation**: Everyone should limit prolonged outdoor exertion.

### Very Unhealthy (201-300)
- **Color**: Purple
- **Recommendation**: People with respiratory disease should avoid outdoor exertion. Everyone else should limit outdoor exertion.

### Hazardous (301+)
- **Color**: Maroon
- **Recommendation**: Everyone should avoid all outdoor exertion.

## Related Endpoints

- `GET /api/cameras` - Get camera data
- `GET /api/weather` - Get weather data
- `GET /api/air-quality/:id` - Get single air quality observation by ID
- `GET /health` - System health check

## Integration Notes

### Frontend Integration

```typescript
// Fetch and visualize air quality
const fetchAirQuality = async (level?: string) => {
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  
  const response = await fetch(`/api/air-quality?${params}`);
  const { data } = await response.json();
  
  // Add colored markers to map
  data.forEach(aq => {
    addAQMarker(aq.location, {
      aqi: aq.aqi,
      level: aq.level,
      color: aq.colorCode,
      pollutants: {
        pm25: aq.pm25,
        pm10: aq.pm10,
        no2: aq.no2,
        o3: aq.o3
      }
    });
  });
};
```

### WebSocket Updates

Air quality data is pushed via WebSocket for real-time updates:

```typescript
ws://localhost:5001
Message format: { type: 'air_quality', data: AirQuality[] }
```

## Changelog

### Version 1.0.0 (2025-11-10)
- Initial implementation
- Camera join via refDevice
- All 6 major pollutants (PM2.5, PM10, NO2, O3, CO, SO2)
- AQI level calculation
- Color code assignment
- Query parameter filtering (level, minAqi)
- Comprehensive error handling

## Support

For issues or questions:
- Check logs in `backend/logs/error.log`
- Verify Stellio: `http://localhost:8080/ngsi-ld/v1/entities?type=AirQualityObserved`
- Run connection test: `npm run test:connections`
- Enable debug logging: Set `NODE_ENV=development` in `.env`

## References

- [EPA AQI Guide](https://www.airnow.gov/aqi/aqi-basics/)
- [NGSI-LD Specification](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.04.01_60/gs_cim009v010401p.pdf)
- [Air Quality Health Index](https://www.airnow.gov/)
