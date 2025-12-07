<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: apps/traffic-web-app/backend/docs/guides/TRAFFIC_MAESTRO_README.md
Module: Traffic Maestro Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Traffic Maestro Agent Complete Documentation.
============================================================================
-->

# Traffic Maestro Agent - Complete Documentation

## Overview

**Traffic Maestro Agent** is a predictive traffic orchestrator that proactively optimizes traffic flow by correlating:
- **Internal Data**: TrafficPattern entities from Stellio Context Broker
- **External Events**: Real-world events (concerts, sports, conferences) from Ticketmaster/Google Events
- **External Routing**: Mapbox Traffic API for benchmarking

### Key Capabilities

1. **Event Monitoring**: Automatically detects large gatherings (1000+ attendees) within configurable radius
2. **Congestion Prediction**: Calculates surge risk scores (0-100) based on event characteristics and current traffic
3. **Route Benchmarking**: Compares internal routing algorithms with industry-leading APIs
4. **Action Planning**: Generates preemptive traffic control plans (green wave, detours, alerts)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Traffic Maestro Agent                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Monitor    │  │   Predict    │  │  Benchmark   │      │
│  │   Events     │→ │  Congestion  │→ │   Routes     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Generate Action Plans                       │  │
│  │  • Green Wave   • Detours   • Alerts   • Deployment  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Stellio    │      │ Ticketmaster│      │   Mapbox    │
│  (Internal) │      │  (External) │      │  (Routing)  │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## Requirements

### Dependencies

```json
{
  "axios": "^1.6.0",
  "js-yaml": "^4.1.0"
}
```

### Environment Variables

Create a `.env` file with the following:

```bash
# Required APIs
TICKETMASTER_API_KEY=your_ticketmaster_api_key
MAPBOX_API_KEY=your_mapbox_access_token

# Optional APIs
GOOGLE_EVENTS_API_KEY=your_google_api_key

# Internal Services (defaults shown)
STELLIO_URL=http://localhost:8080
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

### External API Setup

#### 1. Ticketmaster Discovery API
- Sign up: https://developer.ticketmaster.com/
- Get API key from dashboard
- Free tier: 5,000 API calls/day

#### 2. Mapbox Directions API
- Sign up: https://account.mapbox.com/
- Get access token from dashboard
- Free tier: 100,000 requests/month

---

## Quick Start

### 1. Installation

```bash
cd backend
npm install axios js-yaml
```

### 2. Configuration

Create `config/agents/traffic-maestro.yaml` (or use default):

```yaml
events:
  enabled: true
  filterCriteria:
    minAttendees: 1000        # Minimum attendees to consider
    maxDistanceKm: 1.0        # Search radius (km)
    lookAheadHours: 3         # How far ahead to search

prediction:
  surgeRiskThresholds:
    critical: 80              # Score ≥80: Critical
    high: 60                  # Score ≥60: High priority
    moderate: 40              # Score ≥40: Monitor

actions:
  greenWave:
    enabled: true
    minRiskScore: 80
    phasingAdjustmentPercent: 15
```

### 3. Basic Usage

```typescript
import { TrafficMaestroAgent } from './src/agents/TrafficMaestroAgent';

const agent = new TrafficMaestroAgent();

// Monitor upcoming events
const eventMappings = await agent.monitorExternalEvents();

// Predict congestion for each event
for (const mapping of eventMappings) {
    const riskScore = await agent.predictCongestion(mapping.event);
    
    if (riskScore.score >= 60) {
        const plan = await agent.generateActionPlan(riskScore.score, mapping);
        console.log('Action:', plan.action);
        console.log('Impact:', plan.predictedImpact);
    }
}
```

---

## API Reference

### Class: `TrafficMaestroAgent`

#### Constructor

```typescript
constructor(configPath?: string)
```

**Parameters:**
- `configPath` (optional): Path to YAML configuration file

**Example:**
```typescript
const agent = new TrafficMaestroAgent();
// or with custom config
const agent = new TrafficMaestroAgent('./my-config.yaml');
```

---

#### Method: `monitorExternalEvents()`

Fetches upcoming events and maps them to nearby cameras.

**Returns:** `Promise<EventCameraMapping[]>`

**Example:**
```typescript
const events = await agent.monitorExternalEvents();

events.forEach(mapping => {
    console.log('Event:', mapping.event.name);
    console.log('Venue:', mapping.event.venue.name);
    console.log('Affected cameras:', mapping.affectedCameras.length);
});
```

**Output:**
```typescript
{
    event: {
        id: "evt_123",
        name: "Vietnam vs Thailand - World Cup",
        venue: {
            name: "My Dinh Stadium",
            location: { lat: 10.7860, lng: 106.6960 },
            address: "District 10, HCMC"
        },
        startTime: "2025-11-20T19:00:00Z",
        endTime: "2025-11-20T22:00:00Z",
        expectedAttendees: 15000,
        category: "Sports",
        source: "ticketmaster"
    },
    affectedCameras: [
        {
            camera: {
                id: "urn:ngsi-ld:Camera:cam_001",
                cameraName: "Tran Huy Lieu - Nguyen Thai Hoc",
                location: { lat: 10.7865, lng: 106.6955 },
                status: "active"
            },
            distance: 245,  // meters
            currentPattern: {
                congestionLevel: "medium",
                averageSpeed: 25,
                vehicleCount: 150
            }
        }
    ]
}
```

---

#### Method: `predictCongestion(event: ExternalEvent)`

Calculates surge risk score based on event characteristics.

**Parameters:**
- `event`: ExternalEvent object

**Returns:** `Promise<SurgeRiskScore>`

**Example:**
```typescript
const riskScore = await agent.predictCongestion(event);

console.log('Risk Score:', riskScore.score); // 0-100
console.log('Risk Level:', riskScore.riskLevel); // low | moderate | high | critical
```

**Output:**
```typescript
{
    eventId: "evt_123",
    score: 87.5,
    riskLevel: "critical",
    factors: {
        attendeeCount: 15000,
        timeToEnd: 25,  // minutes until event ends
        currentCongestion: "medium, high",
        historicalImpact: 10  // 0-10 based on event category
    },
    affectedCameras: ["cam_001", "cam_002", "cam_003"]
}
```

**Scoring Algorithm:**
```
Total Score = Attendee Score + Time Score + Congestion Score + Historical Score

1. Attendee Score (0-40 points):
   - Linear scale: (attendees / 10,000) * 40
   - Max: 40 points at 10,000+ attendees

2. Time Score (0-30 points):
   - Peak when event ends within 30 mins
   - Formula: 30 * (1 - timeToEnd/30)

3. Congestion Score (0-20 points):
   - Based on current traffic patterns
   - Multipliers: low=0.25, medium=0.5, high=0.75, severe=1.0

4. Historical Score (0-10 points):
   - Event category impact: Sports=10, Music=8, Theatre=5, etc.
```

---

#### Method: `benchmarkRoutes(origin: LatLng, destination: LatLng)`

Compares internal routing with Mapbox Traffic API.

**Parameters:**
- `origin`: { lat: number, lng: number }
- `destination`: { lat: number, lng: number }

**Returns:** `Promise<RouteComparison>`

**Example:**
```typescript
const comparison = await agent.benchmarkRoutes(
    { lat: 10.7720, lng: 106.6980 },  // Ben Thanh Market
    { lat: 10.8180, lng: 106.6560 }   // Airport
);

console.log('Mapbox duration:', comparison.mapboxDuration / 60, 'minutes');
console.log('Internal duration:', comparison.internalDuration / 60, 'minutes');
console.log('Optimization gap:', comparison.optimizationGap, '%');
```

**Output:**
```typescript
{
    origin: { lat: 10.7720, lng: 106.6980 },
    destination: { lat: 10.8180, lng: 106.6560 },
    mapboxDuration: 1200,      // seconds
    mapboxDistance: 8500,      // meters
    internalDuration: 1450,    // seconds
    optimizationGap: 20.8,     // percentage
    recommendation: "Internal routing is 20.8% slower. Update speed profiles."
}
```

---

#### Method: `generateActionPlan(riskScore: number, eventMapping: EventCameraMapping)`

Creates actionable recommendations based on risk.

**Parameters:**
- `riskScore`: Risk score (0-100)
- `eventMapping`: EventCameraMapping object

**Returns:** `Promise<ActionPlan>`

**Example:**
```typescript
const plan = await agent.generateActionPlan(riskScore.score, eventMapping);

console.log('Action:', plan.action);
console.log('Priority:', plan.priority);
console.log('Execute at:', plan.executionTime);
```

**Output:**
```typescript
{
    action: "Adjust Traffic Light Phasing - Pre-emptive Green Wave",
    targetCameras: ["cam_001", "cam_002", "cam_003", "cam_004", "cam_005"],
    reason: "Vietnam vs Thailand - World Cup at My Dinh Stadium ending soon. Expected 15000 attendees dispersing.",
    predictedImpact: "Reduce clearing time by 15%. Prevent gridlock in 5 intersections.",
    priority: "critical",
    executionTime: "2025-11-20T21:45:00Z",  // 15 mins before event ends
    estimatedCost: 85  // 0-100 scale
}
```

**Action Decision Tree:**
```
Score ≥ 80 (Critical):
→ Pre-emptive Green Wave
  - Adjust traffic light phasing
  - Coordinate 5+ intersections
  - Duration: 20 minutes

Score ≥ 60 (High):
→ Alternative Routes
  - Activate detour routes
  - Update digital signage
  - Push notifications to apps

Score ≥ 40 (Moderate):
→ Public Alerts
  - Send traffic alerts
  - Update mobile apps
  - 30 mins advance notice

Score < 40 (Low):
→ Monitor Only
  - Continue surveillance
  - No active intervention
```

---

## Configuration Guide

### Complete YAML Structure

```yaml
events:
  enabled: true
  sources:
    - name: ticketmaster
      apiUrl: https://app.ticketmaster.com/discovery/v2
      apiKeyEnv: TICKETMASTER_API_KEY
      enabled: true
    
    - name: google
      apiUrl: https://www.googleapis.com/calendar/v3
      apiKeyEnv: GOOGLE_EVENTS_API_KEY
      enabled: false
  
  filterCriteria:
    minAttendees: 1000
    maxDistanceKm: 1.0
    lookAheadHours: 3
  
  categories:
    - Sports
    - Music
    - Arts & Theatre
    - Conferences

routing:
  enabled: true
  provider: mapbox
  apiUrl: https://api.mapbox.com/directions/v5
  apiKeyEnv: MAPBOX_API_KEY
  profile: driving-traffic

prediction:
  surgeRiskThresholds:
    critical: 80
    high: 60
    moderate: 40
  
  timeWindowMinutes: 30
  
  congestionMultipliers:
    low: 0.25
    medium: 0.50
    high: 0.75
    severe: 1.00

actions:
  greenWave:
    enabled: true
    minRiskScore: 80
    phasingAdjustmentPercent: 15
  
  detour:
    enabled: true
    minRiskScore: 60
  
  alert:
    enabled: true
    minRiskScore: 40
```

### Domain-Specific Extensions

Add custom venue configurations:

```yaml
domains:
  sports:
    enabled: true
    venues:
      - name: "Thống Nhất Stadium"
        location: { lat: 10.7860, lng: 106.6960 }
        capacity: 15000
        peakExitTime: 20  # minutes
        historicalData:
          avgCongestionDuration: 45
  
  concerts:
    enabled: true
    venues:
      - name: "Hoa Binh Theatre"
        location: { lat: 10.7720, lng: 106.7000 }
        capacity: 3000
        publicTransportNearby: true
```

---

## Integration Examples

### 1. Real-Time WebSocket Integration

```typescript
import { TrafficMaestroAgent } from './src/agents/TrafficMaestroAgent';
import { WebSocketService } from './src/services/websocketService';

const agent = new TrafficMaestroAgent();
const ws = new WebSocketService();

setInterval(async () => {
    const events = await agent.monitorExternalEvents();
    
    for (const mapping of events) {
        const risk = await agent.predictCongestion(mapping.event);
        
        if (risk.score >= 60) {
            const plan = await agent.generateActionPlan(risk.score, mapping);
            
            // Broadcast to connected clients
            ws.broadcast({
                type: 'TRAFFIC_ALERT',
                event: mapping.event.name,
                risk: risk.score,
                action: plan.action,
                timestamp: new Date().toISOString()
            });
        }
    }
}, 5 * 60 * 1000); // Every 5 minutes
```

### 2. REST API Endpoint

```typescript
import express from 'express';

const app = express();
const agent = new TrafficMaestroAgent();

app.get('/api/traffic/events', async (req, res) => {
    try {
        const events = await agent.monitorExternalEvents();
        const predictions = [];
        
        for (const mapping of events) {
            const risk = await agent.predictCongestion(mapping.event);
            predictions.push({
                event: mapping.event.name,
                risk: risk.score,
                level: risk.riskLevel
            });
        }
        
        res.json({ success: true, predictions });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/traffic/benchmark', async (req, res) => {
    const { origin, destination } = req.body;
    
    try {
        const comparison = await agent.benchmarkRoutes(origin, destination);
        res.json({ success: true, comparison });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
```

### 3. Scheduled Task (Node-Cron)

```typescript
import cron from 'node-cron';

const agent = new TrafficMaestroAgent();

// Run every 10 minutes
cron.schedule('*/10 * * * *', async () => {
    console.log('Running Traffic Maestro monitoring...');
    
    const events = await agent.monitorExternalEvents();
    
    for (const mapping of events) {
        const risk = await agent.predictCongestion(mapping.event);
        
        if (risk.score >= 80) {
            const plan = await agent.generateActionPlan(risk.score, mapping);
            console.log(`🚨 CRITICAL ACTION REQUIRED: ${plan.action}`);
            
            // Execute traffic control logic here
            // await executeGreenWave(plan.targetCameras);
        }
    }
});
```

---

## Troubleshooting

### Issue: No events found

**Symptoms:**
```typescript
const events = await agent.monitorExternalEvents();
console.log(events.length); // 0
```

**Solutions:**
1. Check API keys are set correctly in `.env`
2. Verify `lookAheadHours` is not too restrictive (increase to 24)
3. Verify city name in API call (`city: 'Ho Chi Minh'`)
4. Check Ticketmaster API quota (free tier: 5000 calls/day)

---

### Issue: TypeScript errors

**Symptoms:**
```
error TS2345: Argument of type 'any' is not assignable to parameter
```

**Solution:**
Ensure `tsconfig.json` has correct settings:
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

### Issue: Mapbox API errors

**Symptoms:**
```
Error: Failed to get Mapbox route
```

**Solutions:**
1. Verify `MAPBOX_API_KEY` is set in `.env`
2. Check API quota (free tier: 100k requests/month)
3. Ensure coordinates are valid (lat: -90 to 90, lng: -180 to 180)
4. Check rate limits (60 requests/minute for free tier)

---

### Issue: Stellio connection failed

**Symptoms:**
```
Failed to fetch cameras: connect ECONNREFUSED localhost:8080
```

**Solutions:**
1. Ensure Stellio is running: `docker ps | grep stellio`
2. Verify `STELLIO_URL` in `.env`
3. Check firewall settings
4. Test connection: `curl http://localhost:8080/ngsi-ld/v1/entities`

---

## Performance Optimization

### Caching Event Data

```typescript
class CachedTrafficMaestroAgent extends TrafficMaestroAgent {
    private eventCache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheExpiryMs = 5 * 60 * 1000; // 5 minutes

    async monitorExternalEvents() {
        const now = Date.now();
        const cached = this.eventCache.get('events');
        
        if (cached && now - cached.timestamp < this.cacheExpiryMs) {
            return cached.data;
        }
        
        const events = await super.monitorExternalEvents();
        this.eventCache.set('events', { data: events, timestamp: now });
        
        return events;
    }
}
```

### Parallel API Calls

```typescript
// Process multiple events in parallel
const predictions = await Promise.all(
    eventMappings.map(mapping => agent.predictCongestion(mapping.event))
);
```

---

## Testing

### Unit Test Example (Jest)

```typescript
import { TrafficMaestroAgent } from './TrafficMaestroAgent';

describe('TrafficMaestroAgent', () => {
    let agent: TrafficMaestroAgent;
    
    beforeEach(() => {
        agent = new TrafficMaestroAgent();
    });
    
    test('should calculate correct Haversine distance', () => {
        const distance = agent['calculateDistance'](
            { lat: 10.7720, lng: 106.6980 },
            { lat: 10.7860, lng: 106.6960 }
        );
        
        // ~1.5 km
        expect(distance).toBeGreaterThan(1400);
        expect(distance).toBeLessThan(1600);
    });
    
    test('should predict high risk for large events', async () => {
        const event = {
            id: 'test_001',
            name: 'Test Event',
            venue: {
                name: 'Test Venue',
                location: { lat: 10.7720, lng: 106.6980 },
                address: 'Test Address'
            },
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            expectedAttendees: 20000,
            category: 'Sports',
            source: 'ticketmaster' as const
        };
        
        const risk = await agent.predictCongestion(event);
        
        expect(risk.score).toBeGreaterThan(60);
        expect(risk.riskLevel).toMatch(/high|critical/);
    });
});
```

---

## License

MIT License - Use freely in your traffic management projects.

---

## Support

For issues or questions:
- GitHub Issues: [Your Repository]
- Email: traffic-support@example.com
- Documentation: [Your Docs URL]
