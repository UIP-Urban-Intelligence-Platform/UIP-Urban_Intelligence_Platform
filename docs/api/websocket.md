<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
WebSocket API reference documentation.

Module: apps/traffic-web-app/frontend/docs/docs/api/websocket.md
Author: UIP Team
Version: 1.0.0
-->

# WebSocket API Reference

## Overview

Real-time WebSocket API for streaming traffic updates, accidents, weather changes, and system alerts with **low latency (\<500ms)** and high throughput.

**Key Features:**
- 🔄 Real-time streaming updates
- 🔐 JWT-based authentication
- 📡 Multi-channel subscriptions
- 💓 Automatic heartbeat & reconnection
- ⚡ Latency: \<500ms
- 📊 Up to 10 concurrent channels

## Connection

### Endpoint

```
wss://api.traffic.example.com/ws
```

**WebSocket Protocol**: RFC 6455  
**TLS**: Required (WSS only)  
**Supported Clients**: Browser WebSocket API, Socket.IO, websockets (Python)

### Authentication

```javascript
const ws = new WebSocket('wss://api.traffic.example.com/ws');

// Send auth after connection
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your_jwt_token'
  }));
};

// Handle auth response
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'auth.success') {
    console.log('✅ Authenticated successfully');
    // Now you can subscribe to channels
  } else if (msg.type === 'auth.failed') {
    console.error('❌ Authentication failed:', msg.error);
  }
};
```

## Message Format

All messages follow this structure:

```json
{
  "type": "message_type",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {}
}
```

## Subscriptions

### Subscribe to Channels

```javascript
// Subscribe to traffic updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'traffic.flow',
  filters: {
    cameras: ['CAM_001', 'CAM_002'],
    zones: ['ZONE_001']
  }
}));

// Subscribe to accidents
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'accidents',
  filters: {
    severity: ['moderate', 'severe', 'critical']
  }
}));

// Subscribe to weather
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'weather',
  filters: {
    alerts_only: true
  }
}));
```

### Unsubscribe

```javascript
ws.send(JSON.stringify({
  type: 'unsubscribe',
  channel: 'traffic.flow'
}));
```

## Channels

### Traffic Flow

**Channel**: `traffic.flow`

**Message**:

```json
{
  "type": "traffic.flow",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "camera_id": "CAM_001",
    "location": {"lat": 10.7769, "lon": 106.7009},
    "intensity": 45,
    "average_speed": 35.5,
    "vehicle_types": {
      "car": 28,
      "motorcycle": 12,
      "truck": 3,
      "bus": 2
    },
    "occupancy": 0.65,
    "congestion_level": "moderate"
  }
}
```

### Accidents

**Channel**: `accidents`

**Message Types**:

```json
// New accident detected
{
  "type": "accidents.new",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "ACC_20240115_001",
    "location": {"lat": 10.7769, "lon": 106.7009},
    "severity": "moderate",
    "confidence": 0.92,
    "camera_id": "CAM_001",
    "vehicles_involved": 2
  }
}

// Accident updated
{
  "type": "accidents.update",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "id": "ACC_20240115_001",
    "status": "investigating",
    "emergency_services": "en_route"
  }
}

// Accident resolved
{
  "type": "accidents.resolved",
  "timestamp": "2024-01-15T11:30:00Z",
  "data": {
    "id": "ACC_20240115_001",
    "resolution": "cleared",
    "duration": 60
  }
}
```

### Congestion

**Channel**: `congestion`

**Message**:

```json
{
  "type": "congestion.update",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "zone_id": "ZONE_001",
    "level": "high",
    "severity": 0.78,
    "affected_roads": [
      "Nguyen Hue St",
      "Le Loi St"
    ],
    "estimated_delay": 15,
    "alternative_routes": [
      {
        "route": "via Dong Khoi St",
        "delay": 5
      }
    ]
  }
}
```

### Weather

**Channel**: `weather`

**Message Types**:

```json
// Weather update
{
  "type": "weather.update",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "location": {"lat": 10.7769, "lon": 106.7009},
    "temperature": 32.5,
    "conditions": "Partly Cloudy",
    "precipitation": 0
  }
}

// Weather alert
{
  "type": "weather.alert",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "alert_type": "heavy_rain",
    "severity": "warning",
    "description": "Heavy rainfall expected in next 2 hours",
    "affected_zones": ["ZONE_001", "ZONE_002"],
    "start_time": "2024-01-15T11:00:00Z",
    "end_time": "2024-01-15T13:00:00Z"
  }
}
```

### Air Quality

**Channel**: `air-quality`

**Message**:

```json
{
  "type": "air-quality.update",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "location": {"lat": 10.7769, "lon": 106.7009},
    "aqi": 85,
    "category": "Moderate",
    "dominant_pollutant": "PM2.5",
    "pollutants": {
      "pm25": 35.2,
      "pm10": 58.3,
      "no2": 42.1
    }
  }
}
```

### Camera Status

**Channel**: `cameras.status`

**Message**:

```json
{
  "type": "cameras.status",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "camera_id": "CAM_001",
    "status": "active",
    "last_frame": "2024-01-15T10:29:58Z",
    "health": {
      "connectivity": "good",
      "image_quality": "excellent",
      "fps": 30
    }
  }
}
```

### Alerts

**Channel**: `alerts`

**Message**:

```json
{
  "type": "alert",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "ALERT_001",
    "priority": "high",
    "category": "accident",
    "title": "Serious Accident on Nguyen Hue St",
    "message": "Multi-vehicle accident reported. Emergency services dispatched.",
    "location": {"lat": 10.7769, "lon": 106.7009},
    "action_required": false
  }
}
```

## Client Implementation

### JavaScript/TypeScript

```typescript
class TrafficWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(token: string) {
    this.ws = new WebSocket('wss://api.traffic.example.com/ws');
    
    this.ws.onopen = () => {
      console.log('Connected');
      this.authenticate(token);
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected');
      this.reconnect(token);
    };
  }
  
  authenticate(token: string) {
    this.send({ type: 'auth', token });
  }
  
  subscribe(channel: string, filters?: any) {
    this.send({ type: 'subscribe', channel, filters });
  }
  
  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  handleMessage(message: any) {
    switch (message.type) {
      case 'traffic.flow':
        this.onTrafficUpdate(message.data);
        break;
      case 'accidents.new':
        this.onNewAccident(message.data);
        break;
      // Handle other message types
    }
  }
  
  reconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnecting (${this.reconnectAttempts})...`);
        this.connect(token);
      }, 1000 * this.reconnectAttempts);
    }
  }
  
  disconnect() {
    this.ws?.close();
  }
  
  onTrafficUpdate(data: any) {
    // Handle traffic update
  }
  
  onNewAccident(data: any) {
    // Handle new accident
  }
}

// Usage
const trafficWS = new TrafficWebSocket();
trafficWS.connect('your_jwt_token');
trafficWS.subscribe('traffic.flow', { cameras: ['CAM_001'] });
trafficWS.subscribe('accidents');
```

### React Hook

```typescript
import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  timestamp: string;
  data: any;
}

export function useWebSocket(token: string) {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    ws.current = new WebSocket('wss://api.traffic.example.com/ws');
    
    ws.current.onopen = () => {
      setConnected(true);
      ws.current?.send(JSON.stringify({ type: 'auth', token }));
    };
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };
    
    ws.current.onclose = () => {
      setConnected(false);
    };
    
    return () => {
      ws.current?.close();
    };
  }, [token]);
  
  const subscribe = (channel: string, filters?: any) => {
    ws.current?.send(JSON.stringify({ type: 'subscribe', channel, filters }));
  };
  
  return { messages, connected, subscribe };
}

// Usage in component
function TrafficMonitor() {
  const { messages, connected, subscribe } = useWebSocket('token');
  
  useEffect(() => {
    if (connected) {
      subscribe('traffic.flow');
      subscribe('accidents');
    }
  }, [connected]);
  
  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.type}: {JSON.stringify(msg.data)}</div>
      ))}
    </div>
  );
}
```

### Python

```python
import asyncio
import websockets
import json

async def traffic_websocket(token: str):
    uri = "wss://api.traffic.example.com/ws"
    
    async with websockets.connect(uri) as websocket:
        # Authenticate
        await websocket.send(json.dumps({
            "type": "auth",
            "token": token
        }))
        
        # Subscribe
        await websocket.send(json.dumps({
            "type": "subscribe",
            "channel": "traffic.flow"
        }))
        
        # Listen for messages
        async for message in websocket:
            data = json.loads(message)
            print(f"Received: {data['type']}")
            handle_message(data)

def handle_message(data: dict):
    if data['type'] == 'traffic.flow':
        print(f"Traffic update: {data['data']}")
    elif data['type'] == 'accidents.new':
        print(f"New accident: {data['data']}")

# Run
asyncio.run(traffic_websocket('your_token'))
```

## Connection Management

### Heartbeat

Client should send ping every 30 seconds:

```javascript
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping' }));
}, 30000);

// Server responds with pong
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'pong') {
    console.log('Connection alive');
  }
};
```

### Reconnection Strategy

```javascript
const reconnect = (attempt = 1) => {
  const delay = Math.min(1000 * attempt, 30000); // Max 30s
  setTimeout(() => {
    console.log(`Reconnecting (attempt ${attempt})...`);
    connect();
  }, delay);
};
```

## Error Messages

### Error Format

All errors follow this structure:

```json
{
  "type": "error",
  "timestamp": "2024-01-15T10:30:00Z",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Message | Action Required |
|------|---------|----------------|
| `AUTH_FAILED` | Authentication failed | Check JWT token validity |
| `AUTH_EXPIRED` | Token has expired | Refresh token and reconnect |
| `SUBSCRIPTION_FAILED` | Invalid channel | Verify channel name |
| `RATE_LIMIT_EXCEEDED` | Too many messages | Slow down request rate |
| `INVALID_MESSAGE` | Message format invalid | Check JSON structure |
| `CHANNEL_NOT_FOUND` | Channel does not exist | Use valid channel name |
| `MAX_SUBSCRIPTIONS` | Maximum 10 subscriptions | Unsubscribe from unused channels |

### Error Handling Example

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Attempt reconnection
  reconnect();
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  if (msg.type === 'error') {
    switch (msg.error.code) {
      case 'AUTH_FAILED':
        // Refresh token and reconnect
        refreshToken().then(newToken => {
          connect(newToken);
        });
        break;
      
      case 'RATE_LIMIT_EXCEEDED':
        // Implement backoff strategy
        setTimeout(() => resumeConnection(), 5000);
        break;
      
      case 'SUBSCRIPTION_FAILED':
        // Log and notify user
        console.error(`Invalid channel: ${msg.error.details.channel}`);
        break;
      
      default:
        console.error('Unknown error:', msg.error);
    }
  }
};
```

## Rate Limiting

- **Message Rate**: Maximum 1000 messages per minute per connection
- **Subscriptions**: Maximum 10 concurrent subscriptions per connection
- **Burst**: 50 messages per 5 seconds
- **Penalty**: Exceeding limits results in connection termination

**Rate Limit Headers** (sent on connection):
```json
{
  "type": "rate_limit_info",
  "data": {
    "max_messages_per_minute": 1000,
    "max_subscriptions": 10,
    "burst_limit": 50,
    "burst_window": 5
  }
}
```

## Related Documentation

- [REST API](./rest-api.md)
- [NGSI-LD API](./ngsi-ld.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)
