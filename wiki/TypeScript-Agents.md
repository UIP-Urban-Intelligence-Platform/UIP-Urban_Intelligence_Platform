<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/TypeScript-Agents.md
Module: TypeScript AI Agents Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Documentation for the 3 TypeScript AI agents.
============================================================================
-->

# 🤖 TypeScript AI Agents

Documentation for the 3 TypeScript AI agents powered by advanced language models.

---

## 📊 Overview

UIP - Urban Intelligence Platform includes **3 TypeScript AI agents** that leverage large language models for intelligent traffic analysis and decision-making:

| Agent | Model | Purpose |
|-------|-------|---------|
| TrafficMaestro Agent | GPT-4 / Claude | Real-time traffic orchestration |
| GraphInvestigator Agent | GPT-4 / Claude | Knowledge graph analysis |
| EcoTwin Agent | GPT-4 / Claude | Sustainability optimization |

---

## 📁 Project Structure

```
apps/traffic-web-app/backend/src/agents/
├── TrafficMaestroAgent.ts
├── GraphInvestigatorAgent.ts
├── EcoTwinAgent.ts
├── base/
│   ├── BaseAgent.ts
│   └── AgentConfig.ts
├── tools/
│   ├── TrafficTools.ts
│   ├── GraphTools.ts
│   └── SustainabilityTools.ts
└── types/
    └── AgentTypes.ts
```

---

## 🎭 TrafficMaestro Agent

### Overview

The **TrafficMaestro Agent** is an AI-powered traffic orchestration system that:
- Analyzes real-time traffic conditions
- Recommends optimal signal timing
- Predicts congestion patterns
- Suggests alternative routes

### File Location

```
apps/traffic-web-app/backend/src/agents/TrafficMaestroAgent.ts
```

### Architecture

```typescript
import { BaseAgent } from './base/BaseAgent';
import { TrafficTools } from './tools/TrafficTools';

export class TrafficMaestroAgent extends BaseAgent {
  private tools: TrafficTools;
  
  constructor() {
    super({
      name: 'TrafficMaestro',
      model: 'gpt-4-turbo-preview',
      systemPrompt: `You are TrafficMaestro, an AI traffic management expert.
        Your role is to analyze traffic data and provide actionable recommendations
        for traffic flow optimization in Ho Chi Minh City.`
    });
    this.tools = new TrafficTools();
  }

  async analyzeTrafficFlow(cameraIds: string[]): Promise<TrafficAnalysis> {
    // Fetch current traffic data
    const trafficData = await this.tools.getTrafficData(cameraIds);
    
    // Use LLM to analyze patterns
    const analysis = await this.chat([
      { role: 'user', content: `Analyze this traffic data: ${JSON.stringify(trafficData)}` }
    ]);
    
    return this.parseAnalysis(analysis);
  }

  async recommendSignalTiming(intersectionId: string): Promise<SignalRecommendation> {
    // Get current signal state
    const signalState = await this.tools.getSignalState(intersectionId);
    
    // Get traffic volume
    const volume = await this.tools.getTrafficVolume(intersectionId);
    
    // AI recommendation
    const recommendation = await this.chat([
      { role: 'user', content: `
        Current signal timing: ${JSON.stringify(signalState)}
        Traffic volume: ${JSON.stringify(volume)}
        Recommend optimal signal timing.
      `}
    ]);
    
    return this.parseRecommendation(recommendation);
  }
}
```

### Capabilities

| Capability | Description |
|------------|-------------|
| Traffic Analysis | Analyzes multi-camera traffic data |
| Signal Optimization | Recommends traffic light timing |
| Route Suggestion | Suggests alternative routes |
| Congestion Prediction | Predicts future congestion |
| Incident Response | Responds to traffic incidents |

### API Endpoints

```typescript
// POST /api/agents/traffic-maestro/analyze
router.post('/analyze', async (req, res) => {
  const { cameraIds } = req.body;
  const agent = new TrafficMaestroAgent();
  const analysis = await agent.analyzeTrafficFlow(cameraIds);
  res.json(analysis);
});

// POST /api/agents/traffic-maestro/recommend-signals
router.post('/recommend-signals', async (req, res) => {
  const { intersectionId } = req.body;
  const agent = new TrafficMaestroAgent();
  const recommendation = await agent.recommendSignalTiming(intersectionId);
  res.json(recommendation);
});
```

---

## 🔍 GraphInvestigator Agent

### Overview

The **GraphInvestigator Agent** explores the Neo4j knowledge graph to:
- Discover entity relationships
- Trace traffic flow paths
- Identify bottlenecks
- Answer complex graph queries

### File Location

```
apps/traffic-web-app/backend/src/agents/GraphInvestigatorAgent.ts
```

### Architecture

```typescript
import { BaseAgent } from './base/BaseAgent';
import { GraphTools } from './tools/GraphTools';
import { Neo4jDriver } from 'neo4j-driver';

export class GraphInvestigatorAgent extends BaseAgent {
  private graphTools: GraphTools;
  private neo4j: Neo4jDriver;
  
  constructor() {
    super({
      name: 'GraphInvestigator',
      model: 'gpt-4-turbo-preview',
      systemPrompt: `You are GraphInvestigator, an AI expert in knowledge graphs.
        You analyze Neo4j graph data to discover relationships, patterns, and insights
        about the traffic network in Ho Chi Minh City.`
    });
    this.graphTools = new GraphTools();
  }

  async investigateRelationships(entityId: string): Promise<RelationshipMap> {
    // Query graph for relationships
    const relationships = await this.graphTools.getRelationships(entityId);
    
    // Use AI to interpret
    const interpretation = await this.chat([
      { role: 'user', content: `
        Analyze these graph relationships for entity ${entityId}:
        ${JSON.stringify(relationships)}
        Explain the significance of each relationship.
      `}
    ]);
    
    return { relationships, interpretation };
  }

  async findShortestPath(from: string, to: string): Promise<PathResult> {
    // Use Dijkstra algorithm via Neo4j
    const path = await this.graphTools.findPath(from, to);
    
    // AI explanation
    const explanation = await this.chat([
      { role: 'user', content: `
        Explain this route from ${from} to ${to}:
        Path: ${JSON.stringify(path)}
        Include traffic conditions and recommendations.
      `}
    ]);
    
    return { path, explanation };
  }

  async identifyBottlenecks(): Promise<Bottleneck[]> {
    // Graph centrality analysis
    const centrality = await this.graphTools.calculateCentrality();
    
    // AI analysis
    const analysis = await this.chat([
      { role: 'user', content: `
        Based on this centrality analysis, identify traffic bottlenecks:
        ${JSON.stringify(centrality)}
      `}
    ]);
    
    return this.parseBottlenecks(analysis);
  }
}
```

### Cypher Query Generation

```typescript
async generateCypherQuery(naturalLanguage: string): Promise<CypherQuery> {
  const cypherQuery = await this.chat([
    { role: 'user', content: `
      Convert this natural language query to Cypher:
      "${naturalLanguage}"
      
      Available node types: Camera, Road, District, TrafficState
      Available relationships: MONITORS, LOCATED_IN, CONNECTS_TO, HAS_STATE
    `}
  ]);
  
  return {
    query: this.extractCypher(cypherQuery),
    explanation: cypherQuery
  };
}
```

---

## 🌿 EcoTwin Agent

### Overview

The **EcoTwin Agent** focuses on sustainability and environmental impact:
- Calculates carbon emissions from traffic
- Recommends eco-friendly routes
- Optimizes for reduced emissions
- Tracks environmental metrics

### File Location

```
apps/traffic-web-app/backend/src/agents/EcoTwinAgent.ts
```

### Architecture

```typescript
import { BaseAgent } from './base/BaseAgent';
import { SustainabilityTools } from './tools/SustainabilityTools';

export class EcoTwinAgent extends BaseAgent {
  private sustainabilityTools: SustainabilityTools;
  
  constructor() {
    super({
      name: 'EcoTwin',
      model: 'gpt-4-turbo-preview',
      systemPrompt: `You are EcoTwin, an AI sustainability expert.
        You analyze traffic patterns to minimize environmental impact,
        reduce carbon emissions, and promote sustainable transportation
        in Ho Chi Minh City.`
    });
    this.sustainabilityTools = new SustainabilityTools();
  }

  async calculateEmissions(trafficData: TrafficData): Promise<EmissionReport> {
    // Calculate emissions based on vehicle types and distances
    const emissions = await this.sustainabilityTools.calculateEmissions(trafficData);
    
    // AI analysis and recommendations
    const analysis = await this.chat([
      { role: 'user', content: `
        Analyze these traffic emissions data:
        ${JSON.stringify(emissions)}
        Provide recommendations for reducing environmental impact.
      `}
    ]);
    
    return {
      emissions,
      analysis,
      recommendations: this.parseRecommendations(analysis)
    };
  }

  async recommendEcoRoute(from: string, to: string): Promise<EcoRoute> {
    // Get multiple routes
    const routes = await this.sustainabilityTools.getRoutes(from, to);
    
    // Calculate emissions for each route
    const routeEmissions = await Promise.all(
      routes.map(route => this.sustainabilityTools.calculateRouteEmissions(route))
    );
    
    // AI recommendation
    const recommendation = await this.chat([
      { role: 'user', content: `
        Compare these routes and recommend the most eco-friendly:
        ${JSON.stringify(routeEmissions)}
        Consider time, distance, and emissions.
      `}
    ]);
    
    return this.parseEcoRoute(recommendation);
  }
}
```

### Environmental Metrics

| Metric | Unit | Description |
|--------|------|-------------|
| CO2 Emissions | kg | Carbon dioxide emissions |
| NOx Emissions | g | Nitrogen oxide emissions |
| PM2.5 | µg/m³ | Particulate matter |
| Fuel Consumption | L | Estimated fuel usage |
| Eco Score | 0-100 | Overall sustainability score |

---

## ⚙️ Base Agent Configuration

### BaseAgent.ts

```typescript
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface AgentConfig {
  name: string;
  model: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected client: OpenAI | Anthropic;
  
  constructor(config: AgentConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 4096,
      ...config
    };
    
    // Initialize appropriate client
    if (config.model.startsWith('gpt')) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }
  
  protected async chat(messages: Message[]): Promise<string> {
    // Implement chat with the model
  }
}
```

---

## 🔧 Configuration

### Environment Variables

```bash
# .env
# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Anthropic Configuration  
ANTHROPIC_API_KEY=sk-ant-...

# Agent Settings
AGENT_DEFAULT_MODEL=gpt-4-turbo-preview
AGENT_TEMPERATURE=0.7
AGENT_MAX_TOKENS=4096
```

---

## 🔗 Related Pages

- [[Python-Agents]] - Python agents documentation
- [[Agent-Categories]] - Agent organization
- [[Multi-Agent-System]] - System overview
- [[API-Reference]] - API documentation
