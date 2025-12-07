<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/backend/docs/reports/WEBSOCKET_REALTIME_UPDATES.md
Module: WebSocket Real-time Updates Report
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  WebSocket real-time updates documentation.
============================================================================
-->

# WebSocket Real-Time Updates Documentation

## Overview

The WebSocket server provides real-time data updates with intelligent change detection, heartbeat monitoring, and priority alerts. It listens on port **8081** and automatically pushes updates when data changes in Stellio.

---

## Connection Details

### WebSocket Endpoint
```
ws://localhost:8081
```

### Connection Flow
1. **Client connects** to WebSocket server
2. **Initial snapshot** sent immediately with all current data
3. **Polling starts** - Server checks Stellio every 30 seconds for changes
4. **Change detection** - Compares `dateModified` timestamps
5. **Updates pushed** - Only changed entities broadcast to clients
6. **Heartbeat** - Server sends ping every 10 seconds
7. **Disconnect handling** - Stale clients (no pong in 30s) removed

---

## Message Types

### 1. Initial Data Snapshot
Sent immediately when client connects.

```json
{
  "type": "initial",
  "data": {
    "cameras": [...],
    "weather": [...],
    "airQuality": [...],
    "accidents": [...],
    "patterns": [...]
  },
  "timestamp": "2025-11-29T10:30:00.000Z"
}
```

### 2. Update Events
Sent when specific entities change in Stellio.

#### Camera Update
```json
{
  "type": "camera_update",
  "data": [
    {
      "id": "urn:ngsi-ld:Camera:001",
      "name": "Nguyen Hue Boulevard",
      "status": "active",
      "location": {"lat": 10.7771, "lng": 106.7010}
    }
  ],
  "timestamp": "2025-11-29T10:31:00.000Z"
}
```

#### Weather Update
```json
{
  "type": "weather_update",
  "data": [
    {
      "id": "urn:ngsi-ld:Weather:001",
      "location": {"latitude": 10.7771, "longitude": 106.7010, "district": "District 1"},
      "temperature": 32,
      "humidity": 75,
      "rainfall": 0,
      "windSpeed": 12,
      "windDirection": "NE",
      "condition": "Partly Cloudy",
      "timestamp": "2025-11-29T10:31:00.000Z"
    }
  ],
  "timestamp": "2025-11-29T10:31:00.000Z"
}
```

#### AQI Update
```json
{
  "type": "aqi_update",
  "data": [
    {
      "id": "urn:ngsi-ld:AirQuality:001",
      "location": {"latitude": 10.7771, "longitude": 106.7010, "station": "District 1 Station"},
      "aqi": 85,
      "pm25": 35,
      "pm10": 60,
      "co": 0.5,
      "no2": 25,
      "so2": 12,
      "o3": 40,
      "level": "moderate",
      "timestamp": "2025-11-29T10:31:00.000Z"
    }
  ],
  "timestamp": "2025-11-29T10:31:00.000Z"
}
```

#### New Accident
```json
{
  "type": "new_accident",
  "data": [
    {
      "id": "urn:ngsi-ld:RoadAccident:123",
      "location": {"lat": 10.7771, "lng": 106.7010},
      "type": "Collision",
      "severity": "moderate",
      "vehicles": 2,
      "dateDetected": "2025-11-29T10:31:00.000Z"
    }
  ],
  "timestamp": "2025-11-29T10:31:00.000Z"
}
```

#### Pattern Change
```json
{
  "type": "pattern_change",
  "data": [
    {
      "id": "urn:ngsi-ld:TrafficPattern:001",
      "patternType": "rush_hour",
      "congestionLevel": "high",
      "timeRange": "17:00-19:00",
      "daysOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "affectedCameras": ["urn:ngsi-ld:Camera:001", "urn:ngsi-ld:Camera:002"],
      "avgVehicleCount": 120
    }
  ],
  "timestamp": "2025-11-29T10:31:00.000Z"
}
```

### 3. Priority Alerts
Special high-priority messages for critical events.

#### Severe Accident Alert
```json
{
  "type": "accident_alert",
  "priority": "high",
  "data": {
    "id": "urn:ngsi-ld:RoadAccident:456",
    "severity": "severe",
    "location": {"lat": 10.7771, "lng": 106.7010},
    "camera": "urn:ngsi-ld:Camera:001",
    "message": "Severe accident detected: Multi-Vehicle at camera urn:ngsi-ld:Camera:001"
  },
  "timestamp": "2025-11-29T10:32:00.000Z"
}
```

#### High AQI Warning
```json
{
  "type": "aqi_warning",
  "priority": "medium",
  "data": {
    "id": "urn:ngsi-ld:AirQuality:002",
    "aqi": 165,
    "level": "unhealthy",
    "location": {"latitude": 10.7771, "longitude": 106.7010},
    "station": "District 3 Station",
    "message": "High AQI detected at District 3 Station: 165"
  },
  "timestamp": "2025-11-29T10:33:00.000Z"
}
```

### 4. Heartbeat
Server sends ping every 10 seconds to check client connection.

```json
{
  "type": "ping",
  "timestamp": "2025-11-29T10:34:00.000Z"
}
```

**Client must respond with pong:**
```json
{
  "type": "pong"
}
```

> **Note:** If client doesn't respond to ping within 30 seconds, connection is terminated.

---

## Configuration

All settings are defined in `config/entities.yaml`:

```yaml
websocket:
  port: 8081
  updateInterval: 30000  # Poll Stellio every 30 seconds
  heartbeatInterval: 10000  # Send ping every 10 seconds
  changeDetection:
    enabled: true
    compareField: dateModified  # Timestamp field to compare
    cacheSize: 1000  # Max entities cached per type
  alerts:
    severeAccident:
      enabled: true
      priority: high
      eventType: accident_alert
    highAqi:
      enabled: true
      threshold: 150
      priority: medium
      eventType: aqi_warning
  eventTypes:
    cameras: camera_update
    weather: weather_update
    airQuality: aqi_update
    accidents: new_accident
    patterns: pattern_change
```

---

## Change Detection Mechanism

### How It Works
1. **Initial Fetch:** All entities fetched on startup and cached
2. **Timestamp Comparison:** For each entity, `dateModified` timestamp stored in cache
3. **Polling:** Every 30 seconds, fetch all entities again
4. **Change Detection:** Compare new `dateModified` with cached value
5. **Broadcast:** Only entities with changed timestamps broadcast to clients
6. **Cache Update:** Update cache with new entity data and timestamp

### Entity Cache Structure
```typescript
interface EntityCache {
  data: any;           // Full entity data
  dateModified: string;  // Last modified timestamp
}

// Separate caches for each entity type
camerasCache: Map<string, EntityCache>
weatherCache: Map<string, EntityCache>
airQualityCache: Map<string, EntityCache>
accidentsCache: Map<string, EntityCache>
patternsCache: Map<string, EntityCache>
```

### Example Flow
```
1. Initial: Camera:001 with dateModified="2025-11-29T10:00:00Z" cached
2. Poll 1 (10:00:30): Camera:001 still has dateModified="2025-11-29T10:00:00Z" → No broadcast
3. Poll 2 (10:01:00): Camera:001 still has dateModified="2025-11-29T10:00:00Z" → No broadcast
4. Camera status changes in Stellio at 10:01:15
5. Poll 3 (10:01:30): Camera:001 now has dateModified="2025-11-29T10:01:15Z" → BROADCAST!
6. Cache updated with new timestamp
```

---

## Alert System

### Severe Accident Detection
- **Trigger:** Any accident with `severity: "severe"`
- **Priority:** High
- **Event Type:** `accident_alert`
- **Data Included:** Full accident details + camera ID + custom message

### High AQI Detection
- **Trigger:** Any air quality reading with `aqi > 150`
- **Priority:** Medium
- **Event Type:** `aqi_warning`
- **Data Included:** Full AQI details + station name + custom message

### Alert Priority Levels
- **High:** Critical events requiring immediate attention (severe accidents)
- **Medium:** Important events requiring monitoring (high AQI)
- **Low:** Informational alerts

---

## Client Implementation Examples

### JavaScript/TypeScript Client
```typescript
const ws = new WebSocket('ws://localhost:8081');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'initial':
      console.log('Received initial data snapshot:', message.data);
      // Initialize UI with all data
      break;
    
    case 'camera_update':
      console.log('Camera update:', message.data);
      // Update camera markers on map
      break;
    
    case 'weather_update':
      console.log('Weather update:', message.data);
      // Update weather display
      break;
    
    case 'aqi_update':
      console.log('AQI update:', message.data);
      // Update air quality indicators
      break;
    
    case 'new_accident':
      console.log('New accident detected:', message.data);
      // Show accident notification
      break;
    
    case 'pattern_change':
      console.log('Traffic pattern changed:', message.data);
      // Update traffic flow visualization
      break;
    
    case 'accident_alert':
      console.log('SEVERE ACCIDENT ALERT:', message.data);
      // Show high-priority alert notification
      break;
    
    case 'aqi_warning':
      console.log('HIGH AQI WARNING:', message.data);
      // Show air quality warning
      break;
    
    case 'ping':
      // Respond to heartbeat
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket server');
  // Implement reconnection logic
};
```

### Python Client
```python
import asyncio
import websockets
import json

async def connect():
    uri = "ws://localhost:8081"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket server")
        
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            
            if data['type'] == 'initial':
                print(f"Received initial snapshot: {len(data['data'])} entity types")
            
            elif data['type'] == 'camera_update':
                print(f"Camera update: {len(data['data'])} cameras changed")
            
            elif data['type'] == 'accident_alert':
                print(f"SEVERE ACCIDENT ALERT: {data['data']['message']}")
            
            elif data['type'] == 'aqi_warning':
                print(f"HIGH AQI WARNING: {data['data']['message']}")
            
            elif data['type'] == 'ping':
                # Respond to heartbeat
                await websocket.send(json.dumps({'type': 'pong'}))

asyncio.run(connect())
```

---

## Performance Considerations

### Polling Interval
- **Default:** 30 seconds
- **Rationale:** Balance between real-time updates and server load
- **Configurable:** Can be adjusted in `config/entities.yaml`

### Change Detection Benefits
- **Reduces bandwidth:** Only changed entities sent
- **Reduces processing:** Client only updates what changed
- **Reduces noise:** No duplicate updates for unchanged data

### Cache Management
- **Cache size:** Max 1000 entities per type (configurable)
- **Memory usage:** ~100KB per 1000 entities
- **Cleanup:** Old entries automatically removed when cache full

### Connection Limits
- **Max clients:** Unlimited (limited by server resources)
- **Stale timeout:** 30 seconds without pong
- **Reconnection:** Client responsible for reconnect logic

---

## Troubleshooting

### Client Not Receiving Updates
1. Check WebSocket connection status
2. Verify heartbeat pong responses being sent
3. Check server logs for data fetch errors
4. Verify Stellio connectivity

### Missing Initial Snapshot
- Initial snapshot sent immediately on connection
- If not received, check server logs for data fetch errors

### High Memory Usage
- Reduce cache size in config
- Check for client connection leaks
- Monitor entity count in Stellio

### Delayed Updates
- Check polling interval configuration
- Verify Stellio response times
- Check network latency

---

## Advanced Features

### Topic-Based Subscriptions
Future enhancement to allow clients to subscribe to specific event types:

```typescript
// Subscribe only to accidents and weather
ws.send(JSON.stringify({
  type: 'subscribe',
  topics: ['new_accident', 'weather_update', 'accident_alert']
}));
```

### Historical Playback
Future enhancement to replay historical updates:

```typescript
// Request updates from last hour
ws.send(JSON.stringify({
  type: 'playback',
  from: '2025-11-29T09:00:00Z',
  to: '2025-11-29T10:00:00Z'
}));
```

---

## Summary

✅ **Real-time updates** with 30-second polling  
✅ **Change detection** via `dateModified` timestamps  
✅ **Heartbeat monitoring** with 10-second ping/pong  
✅ **Priority alerts** for severe accidents and high AQI  
✅ **Graceful disconnects** with stale client removal  
✅ **Initial snapshots** for seamless client connection  
✅ **Production-ready** with comprehensive error handling  

For implementation details, see:
- `src/services/websocketService.ts` - WebSocket server logic
- `src/services/dataAggregator.ts` - Data polling and change detection
- `config/entities.yaml` - Configuration settings
