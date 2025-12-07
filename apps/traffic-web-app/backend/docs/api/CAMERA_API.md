<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/backend/docs/api/CAMERA_API.md
Module: Camera API Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Camera Data Endpoint Documentation.
============================================================================
-->

# Camera Data Endpoint Documentation

## Overview

The Camera Data endpoint provides access to traffic camera information from the Stellio Context Broker using the NGSI-LD API. It supports filtering cameras by status, type, and geographic location.

## Endpoint

```
GET /api/cameras
```

## Description

Fetches all traffic cameras from Stellio Context Broker and transforms the NGSI-LD response into a flat, easy-to-consume structure. The endpoint queries Stellio at `/entities?type=Camera&limit=100` and applies client-side filtering based on query parameters.

## Query Parameters

All query parameters are optional. Multiple filters can be combined.

| Parameter | Type | Values | Description | Example |
|-----------|------|--------|-------------|---------|
| `status` | string | `online`, `offline` | Filter cameras by operational status | `?status=online` |
| `type` | string | `PTZ`, `Static`, `Dome` | Filter cameras by type | `?type=PTZ` |
| `bbox` | string | `minLat,minLng,maxLat,maxLng` | Filter cameras within geographic bounding box | `?bbox=10.73,106.68,10.79,106.72` |
| `limit` | integer | 1-1000 | Maximum number of cameras to return (default: 100) | `?limit=50` |

### Query Parameter Details

#### status
- **Type**: `string`
- **Valid Values**: `online` | `offline`
- **Case Sensitive**: No (converted to lowercase)
- **Example**: `GET /api/cameras?status=online`
- **Description**: Returns only cameras with the specified operational status

#### type
- **Type**: `string`
- **Valid Values**: `PTZ` | `Static` | `Dome`
- **Case Sensitive**: Yes
- **Example**: `GET /api/cameras?type=PTZ`
- **Description**: Returns only cameras of the specified type
  - `PTZ`: Pan-Tilt-Zoom cameras
  - `Static`: Fixed-position cameras
  - `Dome`: Dome-style cameras

#### bbox
- **Type**: `string` (comma-separated coordinates)
- **Format**: `minLatitude,minLongitude,maxLatitude,maxLongitude`
- **Validation**: 
  - Must contain exactly 4 numeric values
  - minLatitude < maxLatitude
  - minLongitude < maxLongitude
- **Example**: `GET /api/cameras?bbox=10.73,106.68,10.79,106.72`
- **Description**: Returns cameras within the specified geographic bounding box
- **Coordinate System**: WGS84 (standard GPS coordinates)

#### limit
- **Type**: `integer`
- **Range**: 1-1000
- **Default**: 100
- **Example**: `GET /api/cameras?limit=50`
- **Description**: Limits the maximum number of cameras returned

## Request Examples

### Basic Request
```bash
curl http://localhost:5000/api/cameras
```

### Filter by Status
```bash
# Get only online cameras
curl http://localhost:5000/api/cameras?status=online

# Get only offline cameras
curl http://localhost:5000/api/cameras?status=offline
```

### Filter by Type
```bash
# Get PTZ cameras
curl http://localhost:5000/api/cameras?type=PTZ

# Get Static cameras
curl http://localhost:5000/api/cameras?type=Static

# Get Dome cameras
curl http://localhost:5000/api/cameras?type=Dome
```

### Filter by Geographic Area
```bash
# Get cameras in District 1 area (example coordinates)
curl "http://localhost:5000/api/cameras?bbox=10.73,106.68,10.79,106.72"
```

### Combined Filters
```bash
# Get online PTZ cameras in a specific area
curl "http://localhost:5000/api/cameras?status=online&type=PTZ&bbox=10.73,106.68,10.79,106.72"

# Get first 20 online cameras
curl "http://localhost:5000/api/cameras?status=online&limit=20"
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "urn:ngsi-ld:Camera:001",
      "cameraName": "District 1 Traffic Camera",
      "location": {
        "lat": 10.7769,
        "lng": 106.7009
      },
      "cameraType": "PTZ",
      "status": "online",
      "dateModified": "2025-11-10T10:00:00Z"
    },
    {
      "id": "urn:ngsi-ld:Camera:002",
      "cameraName": "District 3 Traffic Camera",
      "location": {
        "lat": 10.7850,
        "lng": 106.6869
      },
      "cameraType": "Static",
      "status": "offline",
      "dateModified": "2025-11-10T09:00:00Z"
    },
    {
      "id": "urn:ngsi-ld:Camera:003",
      "cameraName": "District 7 Traffic Camera",
      "location": {
        "lat": 10.7350,
        "lng": 106.7190
      },
      "cameraType": "Dome",
      "status": "online",
      "dateModified": "2025-11-10T11:00:00Z"
    }
  ]
}
```

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `count` | integer | Number of cameras returned |
| `data` | Array<Camera> | Array of camera objects |

### Camera Object Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique camera identifier (NGSI-LD format) |
| `cameraName` | string | Yes | Human-readable camera name |
| `location.lat` | number | Yes | Camera latitude (WGS84) |
| `location.lng` | number | Yes | Camera longitude (WGS84) |
| `cameraType` | string | Yes | Camera type: "PTZ", "Static", "Dome", or "Unknown" |
| `status` | string | Yes | Operational status: "online" or "offline" |
| `dateModified` | string | Yes | ISO 8601 timestamp of last modification |

## Error Responses

### 400 Bad Request - Invalid Status Parameter

```json
{
  "success": false,
  "message": "Invalid status parameter. Must be \"online\" or \"offline\".",
  "error": "Invalid value: active"
}
```

**Cause**: Status parameter is not "online" or "offline"

### 400 Bad Request - Invalid Type Parameter

```json
{
  "success": false,
  "message": "Invalid type parameter. Must be \"PTZ\", \"Static\", or \"Dome\".",
  "error": "Invalid value: InvalidType"
}
```

**Cause**: Type parameter is not one of the valid camera types

### 400 Bad Request - Invalid Bbox Format

```json
{
  "success": false,
  "message": "Invalid bbox parameter. Format must be: minLat,minLng,maxLat,maxLng",
  "error": "Invalid value: 10.73,106.68,10.79"
}
```

**Cause**: Bounding box doesn't have exactly 4 coordinates

### 400 Bad Request - Invalid Bbox Coordinates

```json
{
  "success": false,
  "message": "Invalid bbox parameter. All coordinates must be valid numbers.",
  "error": "Invalid value: 10.73,abc,10.79,106.72"
}
```

**Cause**: One or more bbox coordinates are not numeric

### 400 Bad Request - Invalid Bbox Range

```json
{
  "success": false,
  "message": "Invalid bbox parameter. Min values must be less than max values.",
  "error": "minLat=10.79 >= maxLat=10.73 or minLng=106.72 >= maxLng=106.68"
}
```

**Cause**: Min coordinates are greater than or equal to max coordinates

### 400 Bad Request - Invalid Limit

```json
{
  "success": false,
  "message": "Invalid limit parameter. Must be a number between 1 and 1000.",
  "error": "Invalid value: 1500"
}
```

**Cause**: Limit is not a number or is outside the valid range (1-1000)

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to fetch cameras",
  "error": "Connection to Stellio Context Broker failed"
}
```

**Cause**: Server-side error (database connection, Stellio unavailable, etc.)

## NGSI-LD Transformation

The endpoint transforms NGSI-LD entities from Stellio into a simplified flat structure:

### Input (NGSI-LD Entity from Stellio)

```json
{
  "id": "urn:ngsi-ld:Camera:001",
  "type": "Camera",
  "cameraName": {
    "type": "Property",
    "value": "District 1 Traffic Camera"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.7009, 10.7769]
    }
  },
  "cameraType": {
    "type": "Property",
    "value": "PTZ"
  },
  "status": {
    "type": "Property",
    "value": "online"
  },
  "dateModified": {
    "type": "Property",
    "value": "2025-11-10T10:00:00Z"
  }
}
```

### Output (Flat Structure)

```json
{
  "id": "urn:ngsi-ld:Camera:001",
  "cameraName": "District 1 Traffic Camera",
  "location": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "cameraType": "PTZ",
  "status": "online",
  "dateModified": "2025-11-10T10:00:00Z"
}
```

## Data Source

- **Source**: Stellio Context Broker
- **Endpoint**: `http://localhost:8080/ngsi-ld/v1/entities`
- **Query**: `?type=Camera&limit=100`
- **Protocol**: NGSI-LD
- **Format**: JSON-LD

## Implementation Details

### Stellio Query

```typescript
GET http://localhost:8080/ngsi-ld/v1/entities?type=Camera&limit=100
Headers:
  Content-Type: application/ld+json
  Accept: application/ld+json
```

### Transformation Logic

1. **Location Extraction**: Handles multiple NGSI-LD location formats:
   - GeoJSON Point: `{coordinates: [lng, lat]}`
   - Direct properties: `{latitude: x, longitude: y}`
   - NGSI-LD Property: `{value: {coordinates: [lng, lat]}}`

2. **Camera Type Normalization**: Maps various type values to enum:
   - Contains "PTZ" → `PTZ`
   - Contains "STATIC" or "FIXED" → `Static`
   - Contains "DOME" → `Dome`
   - Otherwise → `Unknown`

3. **Status Normalization**: Maps status values to binary state:
   - "online", "active", "operational" → `online`
   - All others → `offline`

4. **Filtering**: Applied client-side after fetching from Stellio
   - Status filter: Exact match
   - Type filter: Exact match
   - Bbox filter: Geographic containment check

## Performance Considerations

- **Default Limit**: 100 cameras per request
- **Maximum Limit**: 1000 cameras per request
- **Timeout**: 10 seconds for Stellio connection
- **Filtering**: Client-side (done after fetching from Stellio)
- **Caching**: None (real-time data)

## Error Handling

The endpoint implements comprehensive error handling:

1. **Parameter Validation**: All query parameters are validated before processing
2. **Stellio Connection**: Catches and logs connection failures
3. **Data Transformation**: Handles missing/malformed NGSI-LD properties with defaults
4. **Logging**: All errors logged with full context for debugging

## Testing

Run the test suite:

```bash
cd backend
npm test -- cameraRoutes.test.ts
```

Test coverage includes:
- Basic functionality (200 OK responses)
- All query parameter filters
- Parameter validation (400 errors)
- Error handling (500 errors)
- Combined filters
- Edge cases (empty results, invalid data)

## Examples with JavaScript/TypeScript

### Using Fetch API

```typescript
// Get all cameras
const response = await fetch('http://localhost:5000/api/cameras');
const { success, count, data } = await response.json();

// Get online PTZ cameras
const response = await fetch(
  'http://localhost:5000/api/cameras?status=online&type=PTZ'
);
const { data: ptzCameras } = await response.json();

// Get cameras in bounding box
const bbox = '10.73,106.68,10.79,106.72';
const response = await fetch(
  `http://localhost:5000/api/cameras?bbox=${bbox}`
);
const { data: areaCameras } = await response.json();
```

### Using Axios

```typescript
import axios from 'axios';

// Get all cameras
const response = await axios.get('http://localhost:5000/api/cameras');
const { success, count, data } = response.data;

// With query parameters
const response = await axios.get('http://localhost:5000/api/cameras', {
  params: {
    status: 'online',
    type: 'PTZ',
    limit: 50
  }
});

// Error handling
try {
  const response = await axios.get('http://localhost:5000/api/cameras');
  console.log('Cameras:', response.data.data);
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error('API Error:', error.response?.data);
  }
}
```

## Integration Notes

### Frontend Integration

The endpoint is designed to work seamlessly with the React frontend:

```typescript
// Store in Zustand state
const fetchCameras = async (filters?: CameraQueryParams) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.bbox) params.append('bbox', filters.bbox);
  
  const response = await fetch(`/api/cameras?${params}`);
  const { data } = await response.json();
  setCameras(data);
};
```

### WebSocket Updates

Camera data is also pushed via WebSocket for real-time updates:

```typescript
ws://localhost:5001
Message format: { type: 'cameras', data: Camera[] }
```

## Related Endpoints

- `GET /api/cameras/:id` - Get single camera by ID
- `GET /api/weather` - Get weather data
- `GET /api/air-quality` - Get air quality data
- `GET /api/accidents` - Get accident data
- `GET /health` - System health check

## Changelog

### Version 1.0.0 (2025-11-10)
- Initial implementation
- Support for status, type, bbox, and limit filters
- NGSI-LD transformation
- Comprehensive error handling
- Full test coverage

## Support

For issues or questions:
- Check logs in `backend/logs/error.log`
- Verify Stellio is running: `http://localhost:8080/ngsi-ld/v1/entities`
- Run connection test: `npm run test:connections`
- Enable debug logging: Set `NODE_ENV=development` in `.env`
