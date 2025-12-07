<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/backend/docs/api/WEATHER_API.md
Module: Weather API Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Weather Data Endpoint Documentation.
============================================================================
-->

# Weather Data Endpoint Documentation

## Overview

The Weather Data endpoint provides access to weather observations from the Stellio Context Broker with automatic camera location joining via the refDevice relationship.

## Endpoint

```
GET /api/weather
```

## Description

Fetches WeatherObserved entities from Stellio and joins them with camera locations through the `refDevice` relationship. Extracts comprehensive weather data including temperature, humidity, precipitation, wind conditions, pressure, and visibility.

## Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `cameraId` | string | Filter weather data for specific camera | `?cameraId=urn:ngsi-ld:Camera:001` |
| `limit` | integer | Maximum number of records (1-1000, default: 100) | `?limit=50` |

### Query Parameter Details

#### cameraId
- **Type**: `string`
- **Format**: NGSI-LD entity ID (typically URN format)
- **Example**: `GET /api/weather?cameraId=urn:ngsi-ld:Camera:001`
- **Description**: Returns only weather observations linked to the specified camera

#### limit
- **Type**: `integer`
- **Range**: 1-1000
- **Default**: 100
- **Example**: `GET /api/weather?limit=50`
- **Description**: Limits the maximum number of weather observations returned

## Request Examples

### Basic Request
```bash
curl http://localhost:5000/api/weather
```

### Filter by Camera
```bash
curl "http://localhost:5000/api/weather?cameraId=urn:ngsi-ld:Camera:001"
```

### With Limit
```bash
curl "http://localhost:5000/api/weather?limit=20"
```

### Combined Filters
```bash
curl "http://localhost:5000/api/weather?cameraId=urn:ngsi-ld:Camera:001&limit=10"
```

## Response Format

### Success Response (200 OK)

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
      "temperature": 32.5,
      "humidity": 75.0,
      "precipitation": 0.0,
      "windSpeed": 12.5,
      "windDirection": "NE",
      "weatherType": "Clear",
      "pressure": 1013.25,
      "visibility": 10000,
      "dateObserved": "2025-11-10T10:00:00Z"
    },
    {
      "id": "urn:ngsi-ld:WeatherObserved:002",
      "cameraId": "urn:ngsi-ld:Camera:002",
      "location": {
        "lat": 10.7850,
        "lng": 106.6869
      },
      "temperature": 31.8,
      "humidity": 78.5,
      "precipitation": 2.5,
      "windSpeed": 8.3,
      "windDirection": "SW",
      "weatherType": "Rainy",
      "pressure": 1012.5,
      "visibility": 8000,
      "dateObserved": "2025-11-10T10:05:00Z"
    }
  ]
}
```

### Response Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | boolean | Yes | Indicates if the request was successful |
| `count` | integer | Yes | Number of weather observations returned |
| `data` | Array<Weather> | Yes | Array of weather observation objects |

### Weather Object Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique weather observation identifier (NGSI-LD format) |
| `cameraId` | string | Yes | Associated camera ID ('unknown' if not linked) |
| `location.lat` | number | Yes | Observation latitude (WGS84) |
| `location.lng` | number | Yes | Observation longitude (WGS84) |
| `temperature` | number | Yes | Temperature in degrees Celsius |
| `humidity` | number | Yes | Relative humidity percentage (0-100) |
| `precipitation` | number | Yes | Precipitation amount in millimeters |
| `windSpeed` | number | Yes | Wind speed in km/h |
| `windDirection` | string | Yes | Wind direction (N, NE, E, SE, S, SW, W, NW) |
| `weatherType` | string | Yes | Weather condition description |
| `pressure` | number | No | Atmospheric pressure in hPa (optional) |
| `visibility` | number | No | Visibility in meters (optional) |
| `dateObserved` | string | Yes | ISO 8601 timestamp of observation |

## Error Responses

### 400 Bad Request - Invalid Limit

```json
{
  "success": false,
  "message": "Invalid limit parameter. Must be a number between 1 and 1000.",
  "error": "Invalid value: 1500"
}
```

**Cause**: Limit parameter is not a number or is outside the valid range (1-1000)

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to fetch weather data",
  "error": "Connection to Stellio Context Broker failed"
}
```

**Cause**: Server-side error (database connection, Stellio unavailable, etc.)

## Camera Join Mechanism

### How It Works

1. **Fetch Weather Entities**: Query Stellio for `WeatherObserved` entities
2. **Extract refDevice**: Get camera reference from `refDevice` property
3. **Lookup Camera**: Fetch camera entity to get location
4. **Merge Data**: Combine weather data with camera location
5. **Fallback**: If camera lookup fails, use weather entity's own location

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

// Format 4: refPointOfInterest (alternative)
{
  "refPointOfInterest": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:001"
  }
}
```

## NGSI-LD Transformation

### Input (NGSI-LD Entity from Stellio)

```json
{
  "id": "urn:ngsi-ld:WeatherObserved:001",
  "type": "WeatherObserved",
  "refDevice": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:001"
  },
  "temperature": {
    "type": "Property",
    "value": 32.5,
    "unitCode": "CEL"
  },
  "relativeHumidity": {
    "type": "Property",
    "value": 75.0,
    "unitCode": "P1"
  },
  "precipitation": {
    "type": "Property",
    "value": 0.0,
    "unitCode": "MMT"
  },
  "windSpeed": {
    "type": "Property",
    "value": 12.5,
    "unitCode": "KMH"
  },
  "windDirection": {
    "type": "Property",
    "value": "NE"
  },
  "weatherType": {
    "type": "Property",
    "value": "Clear"
  },
  "atmosphericPressure": {
    "type": "Property",
    "value": 1013.25,
    "unitCode": "A97"
  },
  "visibility": {
    "type": "Property",
    "value": 10000,
    "unitCode": "MTR"
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

### Output (Flat Structure)

```json
{
  "id": "urn:ngsi-ld:WeatherObserved:001",
  "cameraId": "urn:ngsi-ld:Camera:001",
  "location": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "temperature": 32.5,
  "humidity": 75.0,
  "precipitation": 0.0,
  "windSpeed": 12.5,
  "windDirection": "NE",
  "weatherType": "Clear",
  "pressure": 1013.25,
  "visibility": 10000,
  "dateObserved": "2025-11-10T10:00:00Z"
}
```

## Weather Type Values

Common weather type values:

- `Clear` - Clear sky
- `Cloudy` - Cloudy conditions
- `Overcast` - Overcast sky
- `Rainy` - Rain
- `Drizzle` - Light rain
- `Stormy` - Thunderstorm
- `Foggy` - Fog
- `Misty` - Mist
- `Sunny` - Sunny weather
- `PartlyCloudy` - Partially cloudy

## Wind Direction Values

Standard compass directions:

- `N` - North
- `NE` - Northeast
- `E` - East
- `SE` - Southeast
- `S` - South
- `SW` - Southwest
- `W` - West
- `NW` - Northwest

## Data Source

- **Source**: Stellio Context Broker
- **Entity Type**: `WeatherObserved`
- **Endpoint**: `http://localhost:8080/ngsi-ld/v1/entities`
- **Protocol**: NGSI-LD
- **Format**: JSON-LD

## Implementation Details

### Transformation Logic

1. **refDevice Extraction**: Handles multiple NGSI-LD relationship formats
2. **Camera Lookup**: Asynchronous camera entity fetch via getCameraById
3. **Location Fallback**: Uses weather entity's own location if camera lookup fails
4. **Property Extraction**: Supports both direct values and NGSI-LD Property format
5. **Type Handling**: Extracts values from `.value`, `.object`, or direct property
6. **Optional Fields**: Pressure and visibility are optional (may be undefined)

### Performance Characteristics

- **Response Time**: <200ms (typical, includes camera lookups)
- **Stellio Timeout**: 10 seconds
- **Default Limit**: 100 observations
- **Maximum Limit**: 1000 observations
- **Async Operations**: Parallel camera lookups for better performance
- **Caching**: None (real-time data)

## Error Handling

The endpoint implements comprehensive error handling:

1. **Parameter Validation**: Validates limit parameter range
2. **Stellio Connection**: Catches and logs connection failures
3. **Camera Lookup**: Gracefully handles missing cameras
4. **Data Transformation**: Handles missing/malformed NGSI-LD properties with defaults
5. **Logging**: All operations logged with full context

## Testing

### Manual Testing

```bash
# Start backend
cd backend
npm run dev

# Test basic endpoint
curl http://localhost:5000/api/weather

# Test with filters
curl "http://localhost:5000/api/weather?cameraId=urn:ngsi-ld:Camera:001"
curl "http://localhost:5000/api/weather?limit=10"
```

### Using JavaScript/TypeScript

```typescript
import axios from 'axios';

// Get all weather data
const response = await axios.get('http://localhost:5000/api/weather');
const { success, count, data } = response.data;

// Get weather for specific camera
const response = await axios.get('http://localhost:5000/api/weather', {
  params: {
    cameraId: 'urn:ngsi-ld:Camera:001'
  }
});

// Error handling
try {
  const response = await axios.get('http://localhost:5000/api/weather');
  console.log('Weather data:', response.data.data);
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data);
  }
}
```

## Related Endpoints

- `GET /api/cameras` - Get camera data
- `GET /api/air-quality` - Get air quality data
- `GET /api/weather/:id` - Get single weather observation by ID
- `GET /health` - System health check

## Integration Notes

### Frontend Integration

```typescript
// Fetch and display weather data
const fetchWeather = async (cameraId?: string) => {
  const params = new URLSearchParams();
  if (cameraId) params.append('cameraId', cameraId);
  
  const response = await fetch(`/api/weather?${params}`);
  const { data } = await response.json();
  
  // Display on map
  data.forEach(weather => {
    addWeatherMarker(weather.location, weather);
  });
};
```

### WebSocket Updates

Weather data is also pushed via WebSocket for real-time updates:

```typescript
ws://localhost:5001
Message format: { type: 'weather', data: Weather[] }
```

## Changelog

### Version 1.0.0 (2025-11-10)
- Initial implementation
- Camera join via refDevice
- Support for all weather properties
- Query parameter filtering
- Comprehensive error handling
- Full NGSI-LD transformation

## Support

For issues or questions:
- Check logs in `backend/logs/error.log`
- Verify Stellio is running: `http://localhost:8080/ngsi-ld/v1/entities?type=WeatherObserved`
- Run connection test: `npm run test:connections`
- Enable debug logging: Set `NODE_ENV=development` in `.env`
