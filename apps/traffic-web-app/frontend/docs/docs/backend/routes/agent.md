---
id: agent-routes
title: Agent Routes
sidebar_label: Agent
sidebar_position: 11
description: REST API endpoints for interacting with AI agents - EcoTwin health advisor, GraphInvestigator incident analyzer, and TrafficMaestro predictive orchestrator.
keywords: [agent, ai, eco-twin, graph-investigator, traffic-maestro, gemini]
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team
-->

# Agent Routes

REST API endpoints for interacting with **AI agents**: EcoTwin health advisor, GraphInvestigator incident analyzer, and TrafficMaestro predictive orchestrator.

## Base Path

```
/api/agents
```

## Endpoints Summary

| Method | Endpoint | Description | Agent |
|--------|----------|-------------|-------|
| POST | `/eco-twin/advice` | Get personalized health advice | EcoTwin |
| POST | `/eco-twin/forecast` | Generate environmental forecasts | EcoTwin |
| POST | `/eco-twin/dispersion` | AQI dispersion analysis | EcoTwin |
| POST | `/eco-twin/clear-history` | Clear chat history | EcoTwin |

## EcoTwin Agent Endpoints

### POST /api/agents/eco-twin/advice

Get personalized environmental health advice based on location and user profile.

**Request Body:**

```json
{
  "message": "Is it safe to exercise outdoors today?",
  "location": {
    "lat": 10.7731,
    "lng": 106.7030
  },
  "userProfile": {
    "id": "user-001",
    "age": 35,
    "healthConditions": ["asthma"],
    "activityType": "running",
    "transportMode": "walking",
    "language": "vi",
    "sensitivityLevel": "high"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "advice": "⚠️ **Cảnh báo**: Chỉ số AQI hiện tại là 125 (Không tốt cho nhóm nhạy cảm)...",
    "environmental": {
      "aqi": 125,
      "category": "Unhealthy for Sensitive Groups",
      "pm25": 45.2,
      "pm10": 68.5,
      "temperature": 32,
      "humidity": 75
    },
    "recommendations": [
      "Hạn chế tập luyện ngoài trời",
      "Đeo khẩu trang N95",
      "Tập luyện trong nhà"
    ],
    "riskLevel": "moderate",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:5000/api/agents/eco-twin/advice \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Có an toàn để chạy bộ không?",
    "location": { "lat": 10.77, "lng": 106.70 },
    "userProfile": { "language": "vi" }
  }'
```

---

### POST /api/agents/eco-twin/forecast

Generate environmental forecasts for the next 6-24 hours.

**Request Body:**

```json
{
  "location": {
    "lat": 10.7731,
    "lng": 106.7030
  },
  "userProfile": {
    "id": "user-001",
    "healthConditions": ["asthma"],
    "language": "en"
  },
  "publish": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "forecast": {
      "hourly": [
        {
          "time": "2025-01-15T11:00:00.000Z",
          "aqi": 120,
          "pm25": 42,
          "temperature": 33,
          "recommendation": "Moderate outdoor activity OK"
        },
        {
          "time": "2025-01-15T12:00:00.000Z",
          "aqi": 135,
          "pm25": 48,
          "temperature": 34,
          "recommendation": "Limit strenuous outdoor activity"
        }
      ],
      "summary": "AQI expected to worsen in afternoon due to traffic peak",
      "bestTimeForOutdoor": "Before 10:00 AM",
      "worstTimeForOutdoor": "2:00 PM - 5:00 PM"
    },
    "published": true,
    "publishedTo": "urn:ngsi-ld:AQIForecast:d1-2025-01-15"
  }
}
```

---

### POST /api/agents/eco-twin/dispersion

Analyze AQI dispersion from a point source using Gaussian plume model.

**Request Body:**

```json
{
  "location": {
    "lat": 10.7731,
    "lng": 106.7030
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "dispersion": {
      "centerAqi": 150,
      "windDirection": 45,
      "windSpeed": 3.5,
      "plume": [
        { "distance": 500, "direction": 45, "aqi": 120 },
        { "distance": 1000, "direction": 45, "aqi": 95 },
        { "distance": 2000, "direction": 45, "aqi": 65 }
      ],
      "affectedAreas": [
        {
          "name": "District 1",
          "estimatedAqi": 110,
          "population": 200000
        }
      ]
    },
    "model": "Gaussian Plume",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

---

### POST /api/agents/eco-twin/clear-history

Clear conversation history for a user.

**Request Body:**

```json
{
  "userId": "user-001"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Chat history cleared for user-001"
}
```

## Request Interfaces

```typescript
interface ChatRequest {
  message: string;
  location: {
    lat: number;
    lng: number;
  };
  userProfile?: {
    id?: string;
    age?: number;
    healthConditions?: string[];
    activityType?: string;
    transportMode?: string;
    language?: string;
    sensitivityLevel?: string;
  };
}

interface ForecastRequest {
  location: {
    lat: number;
    lng: number;
  };
  userProfile?: UserProfile;
  publish?: boolean;  // Publish to Stellio
}

interface DispersionRequest {
  location: {
    lat: number;
    lng: number;
  };
}
```

## Agent Initialization

```typescript
// Singleton pattern for agent initialization
let ecoTwinAgent: EcoTwinAgent | null = null;

const getEcoTwinAgent = (): EcoTwinAgent => {
  if (!ecoTwinAgent) {
    try {
      ecoTwinAgent = new EcoTwinAgent();
      logger.info('EcoTwinAgent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize EcoTwinAgent:', error);
      throw error;
    }
  }
  return ecoTwinAgent;
};
```

## Error Handling

```json
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: location"
  }
}

// 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "AGENT_ERROR",
    "message": "EcoTwin agent failed to generate response"
  }
}

// 503 Service Unavailable
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Gemini AI service temporarily unavailable"
  }
}
```

## Rate Limiting

AI Agent APIs have stricter rate limits due to external API costs:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/eco-twin/advice` | 10 req/min | 1 minute |
| `/eco-twin/forecast` | 5 req/min | 1 minute |
| `/eco-twin/dispersion` | 5 req/min | 1 minute |

## Related Documentation

- [EcoTwinAgent](../agents/EcoTwinAgent.md) - Agent implementation
- [Multi-Agent Routes](./multiAgent.md) - Coordinated agents
- [GraphInvestigatorAgent](../agents/GraphInvestigatorAgent.md) - Incident analysis

## References

- [Google Gemini API](https://ai.google.dev/docs)
- [Gaussian Plume Model](https://en.wikipedia.org/wiki/Atmospheric_dispersion_modeling)
