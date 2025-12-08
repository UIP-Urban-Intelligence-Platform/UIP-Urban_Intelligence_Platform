<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Docker-Setup.md
Module: Docker Setup & Configuration Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-12-08
Version: 1.0.0
License: MIT

Description:
  Complete Docker setup and configuration guide for UIP development
  and production environments.
============================================================================
-->
# 🐳 Docker Setup

Complete Docker setup and configuration guide for UIP - Urban Intelligence Platform.

---

## 📋 Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **Docker** | 20.10+ | 24.0+ |
| **Docker Compose** | 2.0+ | 2.24+ |
| **RAM** | 8 GB | 16 GB |
| **Disk** | 20 GB | 50 GB |
| **CPU** | 4 cores | 8 cores |

### Installation

#### Windows (Docker Desktop)

```powershell
# Download Docker Desktop from https://docker.com/products/docker-desktop
# Or use winget:
winget install Docker.DockerDesktop

# Verify installation
docker --version
docker compose version
```

#### Linux (Ubuntu/Debian)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin

# Verify
docker --version
docker compose version
```

#### macOS

```bash
# Using Homebrew
brew install --cask docker

# Start Docker Desktop from Applications
# Verify
docker --version
docker compose version
```

---

## 🚀 Quick Start

### One-Command Setup (Windows)

```powershell
# Clone and setup
git clone https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform

# Run setup
.\justrun.ps1 setup
```

### Manual Setup

```bash
# 1. Clone repository
git clone https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose up -d

# 4. Check status
docker compose ps
```

---

## 📁 Docker Configuration Files

### File Structure

```
├── docker-compose.yml          # Main compose file
├── docker-compose.override.yml # Development overrides
├── docker-compose.prod.yml     # Production configuration
├── Dockerfile                  # Python backend image
├── .env.example               # Environment template
├── .env                       # Local environment (git ignored)
└── docker/
    ├── fuseki/
    │   └── config.ttl         # Fuseki configuration
    ├── prometheus/
    │   └── prometheus.yml     # Prometheus config
    ├── grafana/
    │   └── provisioning/      # Grafana dashboards
    └── nginx/
        └── nginx.conf         # Reverse proxy config
```

### docker-compose.yml Overview

```yaml
# Main services configuration
version: '3.8'

services:
  # Context Broker
  stellio:
    image: stellio/stellio-context-broker:latest
    ports:
      - "8080:8080"
    
  # Triple Store
  fuseki:
    image: stain/jena-fuseki:latest
    ports:
      - "3030:3030"
    
  # Graph Database
  neo4j:
    image: neo4j:5.12-community
    ports:
      - "7474:7474"
      - "7687:7687"
    
  # ... more services
```

---

## 🔧 Environment Configuration

### Essential Variables

```bash
# .env file

# =============================================================================
# Database Configuration
# =============================================================================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=uip_traffic
POSTGRES_USER=uip_admin
POSTGRES_PASSWORD=your_secure_password

MONGODB_HOST=mongodb
MONGODB_PORT=27017
MONGODB_DATABASE=uip_traffic

REDIS_HOST=redis
REDIS_PORT=6379

# =============================================================================
# Service Endpoints
# =============================================================================
STELLIO_URL=http://stellio:8080
FUSEKI_URL=http://fuseki:3030
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# =============================================================================
# Kafka Configuration
# =============================================================================
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
KAFKA_TOPIC_PREFIX=uip

# =============================================================================
# Monitoring
# =============================================================================
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
GRAFANA_ADMIN_PASSWORD=admin
```

### Environment-Specific Configuration

#### Development

```bash
# Development settings
DEBUG=true
LOG_LEVEL=DEBUG
RELOAD=true
WORKERS=1
```

#### Production

```bash
# Production settings
DEBUG=false
LOG_LEVEL=INFO
RELOAD=false
WORKERS=4
```

---

## 🏃 Running Services

### Start All Services

```bash
# Development mode (with logs)
docker compose up

# Background mode
docker compose up -d

# With specific profile
docker compose --profile monitoring up -d
```

### Start Specific Services

```bash
# Core services only
docker compose up -d postgres mongodb redis stellio

# With monitoring
docker compose up -d prometheus grafana

# Backend only
docker compose up -d backend
```

### Stop Services

```bash
# Stop all
docker compose down

# Stop and remove volumes (CAUTION: deletes data)
docker compose down -v

# Stop specific service
docker compose stop stellio
```

---

## 🔍 Service Health Checks

### Check All Services

```bash
# View running containers
docker compose ps

# Check logs
docker compose logs -f

# Check specific service
docker compose logs -f stellio
```

### Health Endpoints

| Service | Health Check URL |
|---------|------------------|
| Backend | http://localhost:5000/health |
| Stellio | http://localhost:8080/actuator/health |
| Fuseki | http://localhost:3030/$/ping |
| Neo4j | http://localhost:7474 |
| Prometheus | http://localhost:9090/-/healthy |
| Grafana | http://localhost:3000/api/health |

### Automated Health Check

```bash
# Run health check script
./scripts/health_check.sh

# Or with PowerShell
.\justrun.ps1 health
```

---

## 💾 Data Persistence

### Volumes Configuration

```yaml
volumes:
  postgres_data:
    driver: local
  mongodb_data:
    driver: local
  neo4j_data:
    driver: local
  redis_data:
    driver: local
  fuseki_data:
    driver: local
  grafana_data:
    driver: local
```

### Backup Data

```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U uip_admin uip_traffic > backup.sql

# Backup MongoDB
docker compose exec mongodb mongodump --out /backup

# Copy backup to host
docker cp $(docker compose ps -q mongodb):/backup ./mongodb_backup
```

### Restore Data

```bash
# Restore PostgreSQL
cat backup.sql | docker compose exec -T postgres psql -U uip_admin uip_traffic

# Restore MongoDB
docker compose exec mongodb mongorestore /backup
```

---

## 🌐 Network Configuration

### Default Network

```yaml
networks:
  uip-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### Service Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                      uip-network (bridge)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │ frontend │───▶│ backend  │───▶│ stellio  │───▶│ postgres │ │
│  │  :3001   │    │  :5000   │    │  :8080   │    │  :5432   │ │
│  └──────────┘    └────┬─────┘    └──────────┘    └──────────┘ │
│                       │                                        │
│                       ▼                                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  kafka   │◀───│ mongodb  │    │  neo4j   │    │  redis   │ │
│  │  :9092   │    │  :27017  │    │  :7687   │    │  :6379   │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts

```bash
# Check if port is in use
netstat -tulpn | grep :8080

# Or on Windows
netstat -ano | findstr :8080

# Change port in docker-compose.yml
ports:
  - "8081:8080"  # Map to different host port
```

#### Container Won't Start

```bash
# Check logs
docker compose logs stellio

# Rebuild image
docker compose build --no-cache stellio

# Remove and recreate
docker compose rm -f stellio
docker compose up -d stellio
```

#### Out of Memory

```bash
# Check memory usage
docker stats

# Increase Docker memory in Docker Desktop settings
# Or limit container memory:
services:
  stellio:
    mem_limit: 2g
```

#### Permission Denied (Linux)

```bash
# Fix docker socket permissions
sudo chmod 666 /var/run/docker.sock

# Or add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Reset Everything

```bash
# Nuclear option - remove all containers, volumes, networks
docker compose down -v --remove-orphans
docker system prune -a --volumes

# Start fresh
docker compose up -d
```

---

## 📚 Related Documentation

- **Docker Services**: [Docker-Services](Docker-Services) - Detailed service configuration
- **Deployment Guide**: [Deployment-Guide](Deployment-Guide) - Production deployment
- **Monitoring Guide**: [Monitoring-Guide](Monitoring-Guide) - Prometheus & Grafana setup
- **Troubleshooting**: [Troubleshooting](Troubleshooting) - Common issues and solutions
