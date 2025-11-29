# GraphRAG Investigator Agent

## 🎯 Overview

**GraphRAG Investigator Agent** is a sophisticated multimodal incident analysis system that combines:

1. **Internal LOD Data** (Stellio NGSI-LD + Neo4j Graph) - Entity relationships & contextual data
2. **Computer Vision** (OpenAI GPT-4o Vision) - Visual hazard detection from camera streams
3. **External Intelligence** (Tavily Search API) - Real-world news & social media context

The agent synthesizes all three data sources to provide comprehensive incident reports with actionable recommendations.

## ✨ Key Features

### 🌐 100% Domain-Agnostic Architecture
- Works with ANY domain (traffic, healthcare, warehouse, etc.)
- NO code changes needed for new domains
- Everything controlled via YAML configuration

### ⚙️ 100% Config-Driven
- All endpoints, mappings, and prompts in YAML
- Vision detection priorities configurable
- Response teams and priority rules configurable
- Neo4j graph queries configurable

### 🔄 Graceful Degradation
- Works even if Vision API unavailable
- Works even if Search API unavailable
- Falls back to rule-based synthesis if LLM unavailable
- Always returns a report with best available data

### 🚀 Production-Ready
- Comprehensive error handling
- Retry logic for network failures
- Connection pooling for databases
- Structured logging with Winston
- TypeScript type safety throughout

## 📋 Requirements

### Required Services
- **Stellio Context Broker** (localhost:8080) - NGSI-LD entity storage
- **Neo4j Graph Database** (localhost:7687) - Graph relationships
- **Node.js** >= 18.x

### Optional APIs (Graceful Degradation)
- **OpenAI API** - For vision analysis (GPT-4o Vision)
- **Tavily API** - For external news/social media search
- **ffmpeg** - For RTSP stream snapshot capture

### Dependencies
All required packages already in `package.json`:
```json
{
  "openai": "^6.9.1",
  "neo4j-driver": "^5.14.0",
  "axios": "^1.6.0",
  "js-yaml": "^4.1.0"
}
```

## 🚀 Quick Start

### 1. Environment Setup

Create `.env` file:
```bash
# Required
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=test12345
STELLIO_URL=http://localhost:8080

# Optional (graceful degradation if missing)
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

### 2. Install ffmpeg (Optional - for real camera streams)

**Windows:**
```powershell
winget install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### 3. Basic Usage

```typescript
import { GraphInvestigatorAgent } from './agents/GraphInvestigatorAgent';

// Initialize agent (loads default config)
const agent = new GraphInvestigatorAgent();

// Investigate an accident
const report = await agent.investigateIncident('urn:ngsi-ld:RoadAccident:001');

console.log(report);
// {
//   accidentId: "urn:ngsi-ld:RoadAccident:001",
//   rootCause: "Vehicle collision with fire hazard detected...",
//   technicalSeverity: { internal: "severe", visual: 9, combined: "critical" },
//   detectedHazards: ["fire", "smoke", "collision"],
//   recommendation: {
//     responseTeams: ["Police", "Fire Department", "Medical/Ambulance"],
//     priority: "critical",
//     estimatedResponseTime: "3-5 minutes",
//     specialEquipment: ["Fire extinguisher", "Water hose"]
//   },
//   confidence: 0.92
// }

// Close connections
await agent.close();
```

## 📖 Configuration Guide

### Default Configuration

The agent uses `backend/config/agents/graph-investigator.yaml` by default.

### Custom Configuration

```typescript
// Load custom config for different domain
const agent = new GraphInvestigatorAgent('./config/agents/healthcare.yaml');
```

### Configuration Structure

```yaml
# Vision Analysis
vision:
  enabled: true
  model: "gpt-4o"
  detectionPriorities:
    - hazard: "fire"
      keywords: ["fire", "smoke", "flames"]
      severityRange: [9, 10]
  systemPrompt: "You are a traffic incident analyst..."

# External Search
search:
  enabled: true
  depth: "advanced"
  maxResults: 5
  includeDomains: ["news.google.com", "vnexpress.net"]
  queryTemplate: 'incident "{location}" {date}'

# Synthesis
synthesis:
  llmModel: "gpt-4o"
  responseTeams:
    - name: "Police"
      triggers: ["accident", "collision"]
  priorityRules:
    - condition: "visualSeverity >= 9"
      priority: "critical"

# Neo4j Queries
neo4j:
  nearbyEntityQuery: "MATCH (a:Accident {id: $accidentId})..."
  relationshipQuery: "MATCH (a)-[r]->(target)..."

# ffmpeg Settings
ffmpeg:
  enabled: true
  timeout: 30000
  args: ["-frames:v 1", "-f image2pipe", "-c:v mjpeg", "-"]
```

## 🌍 Domain-Agnostic Usage

### Example: Adding Healthcare Domain

**1. Create config file:** `config/agents/healthcare.yaml`

```yaml
vision:
  detectionPriorities:
    - hazard: "biohazard"
      keywords: ["blood", "contamination", "spill"]
      severityRange: [8, 10]
    - hazard: "fall"
      keywords: ["patient fall", "slip", "trip"]
      severityRange: [6, 8]

synthesis:
  responseTeams:
    - name: "Hazmat Team"
      triggers: ["biohazard", "contamination", "spill"]
    - name: "Medical Response"
      triggers: ["fall", "injury", "patient"]
    - name: "Safety Team"
      triggers: ["safety", "violation"]
```

**2. Use with NO code changes:**

```typescript
const agent = new GraphInvestigatorAgent('./config/agents/healthcare.yaml');
const report = await agent.investigateIncident('urn:ngsi-ld:HealthIncident:001');
```

### Example: Adding Warehouse Domain

**1. Create config:** `config/agents/warehouse.yaml`

```yaml
vision:
  detectionPriorities:
    - hazard: "spillage"
      keywords: ["spill", "leak", "chemical"]
      severityRange: [7, 9]
    - hazard: "obstruction"
      keywords: ["blocked", "aisle", "pallet"]
      severityRange: [4, 6]

synthesis:
  responseTeams:
    - name: "Safety Team"
      triggers: ["spill", "leak", "hazard"]
    - name: "Maintenance"
      triggers: ["equipment", "malfunction", "repair"]
```

**2. Use immediately:**

```typescript
const agent = new GraphInvestigatorAgent('./config/agents/warehouse.yaml');
const report = await agent.investigateIncident('urn:ngsi-ld:WarehouseIncident:001');
```

## 🔧 API Reference

### Constructor

```typescript
new GraphInvestigatorAgent(configPath?: string)
```

**Parameters:**
- `configPath` (optional) - Path to YAML config file. Defaults to `config/agents/graph-investigator.yaml`

**Example:**
```typescript
const agent = new GraphInvestigatorAgent();
const customAgent = new GraphInvestigatorAgent('./my-config.yaml');
```

### investigateIncident()

```typescript
async investigateIncident(accidentId: string): Promise<InvestigationReport>
```

**Parameters:**
- `accidentId` - URN of the incident entity (e.g., `urn:ngsi-ld:RoadAccident:001`)

**Returns:** `InvestigationReport` object

```typescript
interface InvestigationReport {
  accidentId: string;
  timestamp: string;
  rootCause: string;
  technicalSeverity: {
    internal: string;      // From Stellio entity
    visual: number;        // 0-10 from vision analysis
    combined: string;      // low|medium|high|critical
  };
  realWorldContext: string;
  detectedHazards: string[];
  recommendation: {
    responseTeams: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedResponseTime: string;
    specialEquipment: string[];
  };
  dataSources: {
    stellio: boolean;
    neo4j: boolean;
    vision: boolean;
    search: boolean;
  };
  confidence: number;     // 0-1 overall confidence
}
```

### close()

```typescript
async close(): Promise<void>
```

Closes all database connections. **Always call this when done.**

```typescript
const agent = new GraphInvestigatorAgent();
try {
  await agent.investigateIncident('...');
} finally {
  await agent.close();
}
```

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   investigateIncident()                      │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌────────────────┐      ┌────────────────┐
│  1. Internal   │      │  2. External   │
│  LOD Context   │      │  Intelligence  │
└────────┬───────┘      └────────┬───────┘
         │                       │
    ┌────┴────┐             ┌────┴────┐
    ▼         ▼             ▼         ▼
┌────────┐ ┌──────┐   ┌────────┐ ┌────────┐
│Stellio │ │Neo4j │   │Vision  │ │Search  │
│NGSI-LD │ │Graph │   │GPT-4o  │ │Tavily  │
└────────┘ └──────┘   └────────┘ └────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │  3. Synthesize  │
            │  (GPT-4 LLM)    │
            └────────┬────────┘
                     ▼
            ┌─────────────────┐
            │ Investigation   │
            │     Report      │
            └─────────────────┘
```

## 🧪 Testing

### Run Examples

```bash
# Run usage examples
npx ts-node backend/examples/graph-investigator-usage.ts

# Run specific example
# Edit file to uncomment desired example, then run
```

### Manual Testing

```bash
# Start all services first
docker-compose up -d  # Stellio + Neo4j

# Set environment variables
export OPENAI_API_KEY=sk-...
export TAVILY_API_KEY=tvly-...

# Run test
node -e "
  const { GraphInvestigatorAgent } = require('./dist/agents/GraphInvestigatorAgent');
  const agent = new GraphInvestigatorAgent();
  agent.investigateIncident('urn:ngsi-ld:RoadAccident:001')
    .then(r => console.log(JSON.stringify(r, null, 2)))
    .finally(() => agent.close());
"
```

## 🐛 Troubleshooting

### "Config file not found"
**Solution:** Ensure `backend/config/agents/graph-investigator.yaml` exists or provide correct path

### "OpenAI API error"
**Solution:** Check `OPENAI_API_KEY` in `.env`. Agent will still work without vision analysis.

### "Tavily API error"
**Solution:** Check `TAVILY_API_KEY` in `.env`. Agent will still work without external intelligence.

### "Neo4j connection failed"
**Solution:** 
```bash
docker-compose up -d neo4j
# Or check NEO4J_URL, NEO4J_USER, NEO4J_PASSWORD in .env
```

### "Stellio entity not found"
**Solution:** Verify accident ID exists in Stellio:
```bash
curl http://localhost:8080/ngsi-ld/v1/entities/urn:ngsi-ld:RoadAccident:001
```

### "ffmpeg command failed"
**Solution:** 
- Install ffmpeg: `winget install ffmpeg` (Windows)
- Or disable in config: `ffmpeg.enabled: false`
- Agent will fallback to HTTP snapshot endpoint

## 📝 Integration Examples

### WebSocket Real-time Integration

```typescript
import WebSocket from 'ws';
import { GraphInvestigatorAgent } from './agents/GraphInvestigatorAgent';

const agent = new GraphInvestigatorAgent();
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const { accidentId } = JSON.parse(message.toString());
    
    // Investigate in real-time
    const report = await agent.investigateIncident(accidentId);
    
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(report));
      }
    });
  });
});
```

### REST API Endpoint

```typescript
import express from 'express';
import { GraphInvestigatorAgent } from './agents/GraphInvestigatorAgent';

const app = express();
const agent = new GraphInvestigatorAgent();

app.post('/api/investigate', async (req, res) => {
  try {
    const { accidentId } = req.body;
    const report = await agent.investigateIncident(accidentId);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

## 📚 References

- [NGSI-LD Specification](https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.08.01_60/gs_CIM009v010801p.pdf)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Tavily Search API](https://docs.tavily.com/)
- [Neo4j Cypher](https://neo4j.com/docs/cypher-manual/current/)

## 📄 License

MIT

## 🤝 Contributing

This agent is designed to be extended. To add new domains:

1. Create new YAML config file
2. Define domain-specific hazards and response teams
3. No code changes needed!

Example contributions welcome:
- Healthcare incident analysis
- Warehouse safety monitoring
- Smart building emergency response
- Industrial facility monitoring

---

**Built with ❤️ for multimodal incident analysis**
