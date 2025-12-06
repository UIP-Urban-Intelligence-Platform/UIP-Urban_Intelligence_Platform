<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Quick start guide.

Module: apps/traffic-web-app/frontend/docs/docs/quick-start.md
Author: UIP Team
Version: 1.0.0
-->

# Quick Start Guide

Get the UIP - Urban Intelligence Platform running in **5 minutes**! ⚡

## Prerequisites Check

Before starting, ensure you have:

- ✅ **Docker Desktop** (or Docker + Docker Compose)
- ✅ **8GB RAM** minimum (16GB recommended)
- ✅ **20GB disk space** for Docker images
- ✅ **Internet connection** for pulling images

:::tip Optional for Development

- Node.js 18+ (for frontend development)
- Python 3.9+ (for backend development)
- Git (for version control)

:::

## 1️⃣ Clone Repository

```bash
git clone https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform
```

## 2️⃣ Start with Docker Compose

```bash
# Start all services in detached mode
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

This starts **10+ services**:

- Neo4j (graph database)
- Apache Jena Fuseki (RDF triplestore)
- Stellio (NGSI-LD context broker)
- MongoDB (NGSI-LD storage)
- PostgreSQL + TimescaleDB (temporal data)
- Redis (caching)
- Kafka + Zookeeper (streaming)
- Python Backend API
- React Frontend

## 3️⃣ Wait for Initialization (~2-3 minutes)

```bash
# Check service status
docker-compose ps

# All services should show "Up" status
# Wait until you see:
# - neo4j: Up (healthy)
# - postgres: Up (healthy)
# - redis: Up (healthy)
# - backend: Up
# - frontend: Up
```

:::info Service Health

You can also check individual service health:

```bash
# Neo4j
curl http://localhost:7474

# Fuseki
curl http://localhost:3030/$/ping

# Backend API
curl http://localhost:8001/health
```

:::

## 4️⃣ Access Applications

### 🗺️ Frontend (Main Application)

**URL**: `http://localhost:5173`

Features:

- Interactive traffic map with 1,000+ cameras
- Real-time accident detection
- Analytics dashboard
- Citizen report system

### 🔧 Backend API

**URL**: `http://localhost:8001`

Endpoints:

- `/health` - Health check
- `/cameras` - Camera locations
- `/accidents` - Accident data
- `/docs` - Swagger UI (FastAPI auto-generated)

### 🕸️ Neo4j Browser

**URL**: `http://localhost:7474`

Credentials:

- Username: `neo4j`
- Password: `neo4j123`

Try this Cypher query:

```cypher
MATCH (c:Camera)-[:DETECTED]->(a:Accident)
RETURN c.name, a.severity, a.timestamp
LIMIT 10
```

### 📚 Apache Jena Fuseki

**URL**: `http://localhost:3030`

Datasets:

- `/traffic` - Traffic data
- `/sosa` - SOSA/SSN observations

Try this SPARQL query:

```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
SELECT ?sensor ?observation ?result
WHERE {
  ?sensor a sosa:Sensor .
  ?observation sosa:madeBySensor ?sensor ;
               sosa:hasResult ?result .
}
LIMIT 10
```

## 5️⃣ Test the System

### Test 1: View Traffic Map

1. Open `http://localhost:5173`
2. You should see a map of Ho Chi Minh City
3. Camera markers should appear (red/yellow/green)
4. Click any marker to see details

### Test 2: Submit Citizen Report

1. Click "Citizen Reports" in sidebar
2. Fill out the form:
   - Location: Click on map
   - Type: Accident/Congestion/Pothole
   - Description: Brief description
   - Upload photo (optional)
3. Click "Submit Report"
4. Report should appear on map with verification status

### Test 3: View Analytics Dashboard

1. Click "Analytics" in sidebar
2. See 7+ charts with traffic data:
   - Hourly traffic volume
   - Accident frequency by location
   - Weather correlation
   - Speed distribution
   - Pattern recognition
3. Use filters to customize view

### Test 4: Check Real-time Updates

1. Open browser console (F12)
2. Watch for WebSocket messages:

   ```text
   [WS] Connected to ws://localhost:8001/ws
   [WS] Received: {"type": "accident", "data": {...}}
   ```

3. Data should update automatically without page refresh

## 🎉 Success

If you see all the above working, **congratulations!** 🎊

Your UIP - Urban Intelligence Platform is fully operational.

## 🔧 Troubleshooting

### Services Not Starting

```bash
# Check Docker resources
docker info

# Restart specific service
docker-compose restart neo4j

# View service logs
docker-compose logs -f backend
```

### Port Conflicts

If ports are already in use, edit `docker-compose.yml`:

```yaml
# Example: Change Neo4j port
services:
  neo4j:
    ports:
      - "17474:7474"  # Change 7474 to 17474
```

### Database Not Initialized

```bash
# Stop all services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart
docker-compose up -d
```

### Frontend Not Loading

```bash
# Check frontend container
docker-compose logs frontend

# If using local dev server
cd apps/traffic-web-app/frontend
npm install
npm run dev
```

## 📖 Next Steps

Now that your system is running:

1. **Explore the Architecture**: [System Design](architecture/system-design)
2. **Learn About Agents**: [Agent System Overview](agents/overview)
3. **Customize Configuration**: [Environment Config](installation/environment-config)
4. **API Integration**: [REST API Documentation](../api/overview)
5. **Add Your Data**: [Custom Data Sources](guides/custom-data-source)

## 🆘 Need Help?

- 📋 [Troubleshooting Guide](guides/troubleshooting)
- 💬 [GitHub Issues](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/issues)
- 📧 Email: `nguyennhatquang522004@gmail.com`

---

**Happy monitoring!** 🚦 Ready to dive deeper? Check out the [Architecture Overview](architecture/overview).

---

### Built with ❤️ by the UIP Team

Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)
