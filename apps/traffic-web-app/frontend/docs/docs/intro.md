---
slug: /
title: HCMC Traffic Monitoring System
sidebar_position: 1
---

# HCMC Traffic Monitoring System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)
![Docker](https://img.shields.io/badge/docker-24.0+-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

**Real-time Traffic Management System powered by AI, Computer Vision & Linked Open Data**

[Quick Start](./quick-start) · [Documentation](./intro) · [API Reference](./api/complete-api-reference) · [Contributing](./guides/contributing)

</div>

---

## 🎯 What is this project?

The HCMC Traffic Monitoring System is a **production-ready, multi-agent orchestration platform** that:

- 🚦 **Monitors real-time traffic** from 1,000+ camera locations
- 🤖 **Detects accidents** using YOLOv8 computer vision
- 📊 **Analyzes patterns** with advanced analytics agents
- 🌐 **Publishes Linked Open Data** following NGSI-LD and SOSA/SSN standards
- 🗺️ **Visualizes data** on an interactive React + Leaflet map
- 📱 **Collects citizen reports** via mobile-friendly forms

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  TrafficMap • Analytics Dashboard • Citizen Reports     │
└───────────────────┬─────────────────────────────────────┘
                    │ REST API + WebSocket
┌───────────────────┴─────────────────────────────────────┐
│              Python Orchestrator (main.py)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  30+ Specialized Agents                          │   │
│  │  • Data Collection  • Transformation             │   │
│  │  • Analytics        • Context Management         │   │
│  │  • RDF Processing   • Graph Database             │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │ Data Layer
┌───────────────────┴─────────────────────────────────────┐
│  Neo4j • Fuseki • Stellio • MongoDB • TimescaleDB       │
│  Redis • Kafka                                           │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

Get started in **3 steps** (5 minutes):

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/your-org/builder-layer-end.git
cd builder-layer-end

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker-compose up -d

# Wait for services to initialize (2-3 minutes)
docker-compose ps

# Access applications
# Frontend: http://localhost:5173
# Backend API: http://localhost:8001
# Neo4j Browser: http://localhost:7474
# Fuseki: http://localhost:3030
```

### Option 2: Local Development

```bash
# Python backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .

# Start orchestrator
python main.py

# Frontend (separate terminal)
cd apps/traffic-web-app/frontend
npm install
npm run dev
```

## 📦 Key Features

### 🎥 Real-time Camera Monitoring
- Fetch images from 1,000+ camera locations
- Process with YOLOv8 for vehicle detection
- Detect accidents and congestion automatically

### 🧠 Intelligent Agent System
- **30+ specialized agents** working in parallel
- Data collection, transformation, analytics
- RDF/Linked Data publishing
- State management and caching

### 🗺️ Interactive Map Interface
- **Leaflet-based** traffic visualization
- Multiple overlay layers (weather, AQI, speed zones)
- Real-time updates via WebSocket
- Advanced filtering and search

### 📊 Analytics Dashboard
- 7 chart types (line, bar, pie, area, radar)
- Historical data analysis
- Pattern recognition
- Predictive insights

### 📱 Citizen Report System
- Submit traffic reports with photos
- Verify reports using YOLOv8
- Track report status
- Integration with main system

### 🌐 Semantic Web Standards
- **NGSI-LD** entities for interoperability
- **SOSA/SSN** ontology for sensor observations
- **RDF triplestores** (Apache Jena Fuseki)
- **SPARQL** query support

## 📖 Documentation Structure

- **[Installation](installation/prerequisites)** - Setup guides
- **[Architecture](architecture/overview)** - System design
- **[Backend](backend/overview)** - Python orchestrator
- **[Agents](agents/overview)** - 30+ agent documentation
- **[Frontend](frontend/overview)** - React application
- **[API Reference](../api/overview)** - REST & WebSocket APIs
- **[Data Models](data-models/ngsi-ld)** - NGSI-LD, SOSA/SSN
- **[DevOps](devops/docker-compose)** - Deployment guides

## 🛠️ Technology Stack

### Backend
- **Python 3.9+** - Main orchestrator
- **FastAPI** - REST API server
- **AsyncIO** - Asynchronous processing
- **YOLOv8** - Computer vision

### Frontend
- **React 18.2** - UI framework
- **TypeScript 5.2** - Type safety
- **Leaflet** - Map visualization
- **Zustand** - State management
- **Recharts** - Data visualization

### Data Stores
- **Neo4j 5.12** - Graph database
- **Apache Jena Fuseki** - RDF triplestore
- **MongoDB 7** - NGSI-LD entities
- **TimescaleDB** - Time-series data
- **Redis 7** - Caching
- **Kafka** - Streaming

## 🎓 Learning Path

1. **Beginners**: Start with [Quick Start](#quick-start) and [Architecture Overview](architecture/overview)
2. **Developers**: Read [Backend Guide](backend/overview) and [Agent System](agents/overview)
3. **Frontend Engineers**: See [Frontend Documentation](frontend/overview)
4. **Data Scientists**: Explore [Data Models](data-models/ngsi-ld) and [SPARQL Queries](../api/sparql/examples)
5. **DevOps**: Check [Docker Compose](devops/docker-compose) and [CI/CD](devops/ci-cd)

## 💡 Next Steps

- 📋 [Prerequisites](installation/prerequisites) - Check system requirements
- 🐳 [Docker Setup](installation/docker-setup) - Deploy with Docker
- 🔧 [Local Setup](installation/local-setup) - Development environment
- 📚 [Architecture Deep Dive](architecture/system-design) - Understand the system

## 🤝 Contributing

Contributions are welcome! See our [contribution guide](guides/adding-new-agent) for details.

## 📄 License

This project is licensed under the MIT License.

---

Ready to explore? Start with the [Prerequisites](installation/prerequisites) page! 🚀
