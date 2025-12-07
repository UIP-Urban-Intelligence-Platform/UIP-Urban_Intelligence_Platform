---
sidebar_position: 2
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Docker deployment setup documentation.

File: docs/installation/docker-setup.md
Module: Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Docker setup guide for UIP system.
============================================================================
-->

# Docker Setup

Complete guide for deploying UIP - Urban Intelligence Platform using Docker and Docker Compose.

## 📦 Overview

Docker Compose provides a streamlined way to deploy the entire UIP stack with a single command. This includes:

- Backend API Server (FastAPI)
- Frontend Web Application (React + Vite)
- Neo4j Graph Database
- MongoDB Document Database
- Redis Cache
- NGSI-LD Context Broker (Stellio)
- Apache Jena Fuseki (RDF Triplestore)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform
```

### 2. Start All Services

```bash
docker-compose up -d
```

### 3. Verify Services

```bash
docker-compose ps
```

Expected output:

```text
NAME                STATUS       PORTS
uip-backend         Up           0.0.0.0:8001->8001/tcp
uip-frontend        Up           0.0.0.0:5173->5173/tcp
uip-neo4j           Up           0.0.0.0:7474->7474/tcp, 0.0.0.0:7687->7687/tcp
uip-mongo           Up           0.0.0.0:27017->27017/tcp
uip-redis           Up           0.0.0.0:6379->6379/tcp
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Application
APP_ENV=production
DEBUG=false

# API Configuration
API_HOST=0.0.0.0
API_PORT=8001

# Database URLs
MONGO_URI=mongodb://mongo:27017/hcmc_traffic
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_secure_password

# Redis
REDIS_URL=redis://redis:6379

# Context Broker
STELLIO_URL=http://stellio:8080
FUSEKI_URL=http://fuseki:3030
```

### Docker Compose Override

For development, create `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  backend:
    volumes:
      - ./src:/app/src:ro
    environment:
      - DEBUG=true
    command: ["uvicorn", "src.api.main:app", "--reload", "--host", "0.0.0.0", "--port", "8001"]
  
  frontend:
    volumes:
      - ./apps/traffic-web-app/frontend/src:/app/src:ro
    command: ["npm", "run", "dev", "--", "--host"]
```

## 📊 Service Details

### Backend API (Port 8001)

```bash
# Access API documentation
http://localhost:8001/docs

# Health check
curl http://localhost:8001/health
```

### Frontend (Port 5173)

```bash
# Access web application
http://localhost:5173
```

### Neo4j Browser (Port 7474)

```bash
# Access Neo4j browser
http://localhost:7474

# Default credentials
Username: neo4j
Password: (set in .env)
```

### MongoDB (Port 27017)

```bash
# Connect with mongosh
mongosh mongodb://localhost:27017/hcmc_traffic
```

### Redis (Port 6379)

```bash
# Connect with redis-cli
redis-cli -h localhost -p 6379
```

## 🔄 Common Operations

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop and Remove

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### Rebuild Images

```bash
# Rebuild all images
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

## 🐛 Troubleshooting

### Service Not Starting

```bash
# Check service status
docker-compose ps

# View error logs
docker-compose logs <service-name>

# Check resource usage
docker stats
```

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :8001

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (Linux/macOS)
lsof -i :8001
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check network
docker network ls
docker network inspect uip-network

# Verify container connectivity
docker-compose exec backend ping mongo
```

### Low Disk Space

```bash
# Clean unused images and volumes
docker system prune -a
docker volume prune
```

## 📈 Production Deployment

For production, consider:

1. **Use environment-specific compose files**:

   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

2. **Set secure passwords**
3. **Enable HTTPS with reverse proxy (nginx/traefik)**
4. **Configure resource limits**
5. **Set up monitoring (Prometheus + Grafana)**
6. **Implement backup strategies**

## 📖 Next Steps

- [Local Development Setup](local-setup) - For development without Docker
- [Environment Configuration](environment-config) - Detailed configuration options
- [Troubleshooting Guide](../guides/troubleshooting) - Common issues and solutions

---

Need help? Check our [GitHub Issues](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues).
