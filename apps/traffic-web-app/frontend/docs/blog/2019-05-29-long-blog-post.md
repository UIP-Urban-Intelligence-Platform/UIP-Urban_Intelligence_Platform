---
slug: docker-deployment-guide
title: 🐳 Hướng dẫn Deploy UIP với Docker
authors: nguyenviethoang
tags: [docker, deployment, devops, uip]
---

<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Blog post: Docker Deployment Guide.

Module: apps/traffic-web-app/frontend/docs/blog/2019-05-29-long-blog-post.md
Author: UIP Team
Version: 1.0.0
-->

Hướng dẫn chi tiết cách deploy toàn bộ UIP stack sử dụng Docker và Docker Compose. Bài viết này sẽ đi qua từng bước từ setup môi trường đến monitoring.

<!-- truncate -->

## 📋 Prerequisites

Trước khi bắt đầu, đảm bảo bạn có:

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Docker | 20.10+ | 24.0+ |
| Docker Compose | 2.0+ | 2.20+ |
| RAM | 8GB | 16GB |
| Storage | 50GB | 100GB SSD |
| CPU | 4 cores | 8 cores |

### Cài đặt Docker (nếu chưa có)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Docker Network                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Frontend│  │ Backend │  │ MongoDB │  │  Redis  │        │
│  │  :3000  │  │  :8000  │  │  :27017 │  │  :6379  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │           │            │            │               │
│       └───────────┴────────────┴────────────┘               │
│                        │                                     │
│  ┌─────────┐  ┌────────┴──────┐  ┌─────────┐               │
│  │ Stellio │  │    Fuseki     │  │ Grafana │               │
│  │  :8080  │  │     :3030     │  │  :3001  │               │
│  └─────────┘  └───────────────┘  └─────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform
```

### 2. Environment Setup

```bash
# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
```

**Các biến môi trường quan trọng:**

```env
# Application
APP_ENV=production
APP_DEBUG=false

# MongoDB
MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_DATABASE=uip

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Stellio (NGSI-LD Context Broker)
STELLIO_URL=http://stellio:8080

# Fuseki (RDF Triple Store)
FUSEKI_URL=http://fuseki:3030

# API Keys (optional)
CAMERA_API_KEY=your_camera_api_key
```

### 3. Build và Start

```bash
# Build all images
docker compose build

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### 4. Verify Services

```bash
# Check all containers are running
docker compose ps

# View logs
docker compose logs -f

# Test API endpoint
curl http://localhost:8000/health
```

## 📦 Docker Compose Services

### docker-compose.yml breakdown

```yaml
version: "3.8"

services:
  # Frontend - React Dashboard
  frontend:
    build:
      context: ./apps/traffic-web-app/frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend

  # Backend - FastAPI Server
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URL=mongodb://mongodb:27017
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs

  # MongoDB - Primary Database
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: mongosh --eval 'db.runCommand("ping").ok'
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis - Caching & Message Queue
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Stellio - NGSI-LD Context Broker
  stellio:
    image: stellio/stellio-context-broker:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
    depends_on:
      - postgres
      - kafka

  # Fuseki - RDF Triple Store
  fuseki:
    image: stain/jena-fuseki
    ports:
      - "3030:3030"
    volumes:
      - fuseki_data:/fuseki
    environment:
      - ADMIN_PASSWORD=admin

volumes:
  mongodb_data:
  redis_data:
  fuseki_data:
```

## 🔧 Advanced Configuration

### Production Settings

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
      restart_policy:
        condition: on-failure
        max_attempts: 3
```

### GPU Support for YOLOX

```yaml
# docker-compose.gpu.yml
services:
  cv-detector:
    build:
      context: .
      dockerfile: Dockerfile.gpu
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

## 📊 Monitoring

### Grafana Dashboard

1. Access Grafana: http://localhost:3001
2. Default credentials: admin/admin
3. Import dashboard: `config/grafana_dashboard.json`

### Health Checks

```bash
# Check all services
./scripts/health_check.sh

# Output:
# ✅ Frontend: healthy
# ✅ Backend: healthy  
# ✅ MongoDB: healthy
# ✅ Redis: healthy
# ✅ Stellio: healthy
# ✅ Fuseki: healthy
```

## 🔄 Common Operations

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
```

### View Logs

```bash
# All logs
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend
```

### Scale Services

```bash
# Scale backend to 3 instances
docker compose up -d --scale backend=3
```

### Backup Data

```bash
# Backup MongoDB
docker exec mongodb mongodump --out /backup

# Backup Fuseki
docker exec fuseki /fuseki/bin/s-copy default backup.nq
```

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | `docker compose down` then change ports in `.env` |
| Out of memory | Increase Docker memory limit |
| Permission denied | Run `sudo chmod -R 777 ./data ./logs` |
| Container won't start | Check logs with `docker compose logs <service>` |

### Reset Everything

```bash
# Stop and remove all containers, volumes, networks
docker compose down -v

# Rebuild from scratch
docker compose build --no-cache
docker compose up -d
```

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [UIP API Documentation](/docs/api)
- [Troubleshooting Guide](/docs/guides/troubleshooting)

---

**Câu hỏi?** Mở issue trên [GitHub](https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform/issues)

*Nguyễn Việt Hoàng - Full-Stack Developer @ UIP Team*
