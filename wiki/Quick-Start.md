<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Quick-Start.md
Module: Quick Start Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Get UIP - Urban Intelligence Platform running in 5 minutes.
============================================================================
-->
# 🚀 Quick Start

Get UIP - Urban Intelligence Platform running in 5 minutes.

---

## ⚡ One-Command Setup

The fastest way to start:

```powershell
# Windows PowerShell
.\justrun.ps1 dev
```

```bash
# Linux/macOS
./justrun.sh dev
```

This single command will:
1. ✅ Check Docker is running
2. ✅ Start all 12 Docker services
3. ✅ Wait for services to be healthy
4. ✅ Initialize databases
5. ✅ Start the backend server
6. ✅ Start the frontend dev server
7. ✅ Open the dashboard in your browser

---

## 🐳 Docker Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform
```

### Step 2: Start Docker Services

```bash
docker-compose up -d
```

### Step 3: Verify Services

```bash
docker-compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
traffic-postgres        running (healthy)   0.0.0.0:5432->5432/tcp
traffic-neo4j           running (healthy)   0.0.0.0:7474->7474/tcp, 0.0.0.0:7687->7687/tcp
traffic-redis           running (healthy)   0.0.0.0:6379->6379/tcp
traffic-mongodb         running (healthy)   0.0.0.0:27017->27017/tcp
traffic-fuseki          running (healthy)   0.0.0.0:3030->3030/tcp
stellio-api-gateway     running (healthy)   0.0.0.0:8080->8080/tcp
traffic-kafka           running (healthy)   0.0.0.0:9092->9092/tcp
traffic-grafana         running (healthy)   0.0.0.0:3000->3000/tcp
```

---

## 🎯 Access Points

After starting, access the following services:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend Dashboard** | http://localhost:3001 | - |
| **Backend API** | http://localhost:5000/api | - |
| **Stellio Context Broker** | http://localhost:8080 | - |
| **Apache Fuseki** | http://localhost:3030 | admin/admin |
| **Neo4j Browser** | http://localhost:7474 | neo4j/password |
| **Grafana** | http://localhost:3000 | admin/admin |
| **Prometheus** | http://localhost:9090 | - |

---

## 🔄 Run the Pipeline

### Start the Orchestrator

```bash
# Run full pipeline
python orchestrator.py

# Run specific phases
python orchestrator.py --phases 1,2,3,4

# Dry run (no execution)
python orchestrator.py --dry-run
```

### Monitor Progress

1. **Check Grafana Dashboard**: http://localhost:3000
2. **View logs**: `docker-compose logs -f`
3. **Check API health**: http://localhost:5000/health

---

## 🧪 Quick Test

### Test API Endpoints

```bash
# Health check
curl http://localhost:5000/health

# Get cameras
curl http://localhost:5000/api/cameras

# Get weather
curl http://localhost:5000/api/weather?lat=10.8231&lng=106.6297
```

### Test NGSI-LD

```bash
# Get entities from Stellio
curl http://localhost:8080/ngsi-ld/v1/entities?type=Device
```

### Test SPARQL

```bash
# Query Fuseki
curl http://localhost:3030/traffic/query \
  -H "Content-Type: application/sparql-query" \
  -d "SELECT * WHERE { ?s ?p ?o } LIMIT 10"
```

---

## 🛠️ Development Mode

### Start Frontend (Hot Reload)

```bash
cd apps/traffic-web-app/frontend
npm install
npm run dev
```

### Start Backend (Hot Reload)

```bash
cd apps/traffic-web-app/backend
npm install
npm run dev
```

### Start Python Agents

```bash
# Install dependencies
pip install -r requirements/dev.txt

# Run specific agent
python -m src.agents.data_collection.image_refresh_agent
```

---

## ⏭️ Next Steps

1. **[[Configuration]]** - Customize settings
2. **[[System-Architecture]]** - Understand the design
3. **[[Multi-Agent-System]]** - Explore agents
4. **[[API-Reference]]** - API documentation

---

## 🆘 Troubleshooting

### Services won't start?

```bash
# Check Docker resources
docker system df

# Check logs
docker-compose logs -f

# Restart services
docker-compose down
docker-compose up -d
```

### Port conflicts?

Edit `docker-compose.yml` to change ports:
```yaml
ports:
  - "9080:8080"  # Change external port
```

### Need help?

- Check [[FAQ]]
- Open a [GitHub Issue](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues)

---

## 🔗 Related Pages

- [[Installation]] - Detailed installation guide
- [[Docker-Services]] - Docker service details
- [[Configuration]] - Configuration options
