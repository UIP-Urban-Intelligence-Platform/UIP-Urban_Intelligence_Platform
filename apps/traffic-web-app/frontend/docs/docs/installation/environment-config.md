---
sidebar_position: 4
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Environment configuration documentation.

File: apps/traffic-web-app/frontend/docs/docs/installation/environment-config.md
Module: Installation Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for environment configuration and variables.
============================================================================
-->

# Environment Configuration

Complete guide for configuring UIP - Urban Intelligence Platform environment variables and settings.

## 📋 Overview

UIP uses environment variables for configuration, following the [12-factor app](https://12factor.net/) methodology. This allows for:

- Environment-specific configurations (dev, staging, production)
- Secure handling of sensitive credentials
- Easy containerization and deployment

## 🔧 Configuration Files

### Backend (.env)

Create `.env` in the project root:

```bash
# =============================================================================
# UIP - Urban Intelligence Platform Configuration
# =============================================================================

# -----------------------------------------------------------------------------
# Application Settings
# -----------------------------------------------------------------------------
APP_ENV=development
DEBUG=true
LOG_LEVEL=DEBUG

# API Server
API_HOST=0.0.0.0
API_PORT=8001

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

# MongoDB
MONGO_URI=mongodb://localhost:27017/hcmc_traffic
MONGO_DB_NAME=hcmc_traffic

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# -----------------------------------------------------------------------------
# Context Brokers
# -----------------------------------------------------------------------------

# Stellio (NGSI-LD Context Broker)
STELLIO_URL=http://localhost:8080
STELLIO_TENANT=urn:ngsi-ld:tenant:default

# Apache Jena Fuseki
FUSEKI_URL=http://localhost:3030
FUSEKI_DATASET=traffic

# -----------------------------------------------------------------------------
# External APIs
# -----------------------------------------------------------------------------

# Weather API (OpenWeatherMap)
WEATHER_API_KEY=your_api_key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Air Quality API
AIR_QUALITY_API_KEY=your_api_key
AIR_QUALITY_API_URL=https://api.iqair.com/v2

# Traffic Camera API
CAMERA_API_URL=https://api.hcmgov.vn/cameras
CAMERA_API_KEY=your_api_key

# -----------------------------------------------------------------------------
# Feature Flags
# -----------------------------------------------------------------------------
ENABLE_WEBSOCKET=true
ENABLE_CACHING=true
ENABLE_METRICS=true
ENABLE_TRACING=false

# -----------------------------------------------------------------------------
# Cache Settings
# -----------------------------------------------------------------------------
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000

# -----------------------------------------------------------------------------
# Rate Limiting
# -----------------------------------------------------------------------------
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_BURST=20
```

### Frontend (.env)

Create `.env` in `apps/traffic-web-app/frontend/`:

```bash
# =============================================================================
# UIP Frontend Configuration
# =============================================================================

# API Configuration
VITE_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001/ws

# Map Configuration
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
VITE_MAP_DEFAULT_CENTER=10.762622,106.660172
VITE_MAP_DEFAULT_ZOOM=12

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_ANALYTICS=false

# Refresh Intervals (ms)
VITE_CAMERA_REFRESH_INTERVAL=30000
VITE_TRAFFIC_REFRESH_INTERVAL=60000
VITE_ACCIDENT_REFRESH_INTERVAL=10000
```

## 🔐 Sensitive Configuration

### Production Secrets

Never commit secrets to version control. Use:

1. **Environment variables** in deployment platform
2. **Docker secrets** for container deployments
3. **AWS Secrets Manager / Azure Key Vault** for cloud deployments

### Example: Docker Secrets

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  backend:
    secrets:
      - neo4j_password
      - mongo_uri
    environment:
      - NEO4J_PASSWORD_FILE=/run/secrets/neo4j_password

secrets:
  neo4j_password:
    external: true
  mongo_uri:
    external: true
```

## 📊 Configuration Reference

### Application Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `APP_ENV` | string | development | Environment: development, staging, production |
| `DEBUG` | boolean | false | Enable debug mode |
| `LOG_LEVEL` | string | INFO | Logging level: DEBUG, INFO, WARNING, ERROR |
| `API_HOST` | string | 0.0.0.0 | API server host |
| `API_PORT` | integer | 8001 | API server port |

### Database Settings

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `MONGO_URI` | string | Yes | MongoDB connection string |
| `NEO4J_URI` | string | Yes | Neo4j bolt URI |
| `NEO4J_USER` | string | Yes | Neo4j username |
| `NEO4J_PASSWORD` | string | Yes | Neo4j password |
| `REDIS_URL` | string | Yes | Redis connection URL |

### Context Broker Settings

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `STELLIO_URL` | string | Yes | Stellio context broker URL |
| `STELLIO_TENANT` | string | No | Stellio tenant identifier |
| `FUSEKI_URL` | string | Yes | Apache Jena Fuseki URL |
| `FUSEKI_DATASET` | string | Yes | Fuseki dataset name |

### Feature Flags

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ENABLE_WEBSOCKET` | boolean | true | Enable WebSocket connections |
| `ENABLE_CACHING` | boolean | true | Enable Redis caching |
| `ENABLE_METRICS` | boolean | true | Enable Prometheus metrics |
| `ENABLE_TRACING` | boolean | false | Enable distributed tracing |

## 🌍 Environment-Specific Configs

### Development

```bash
APP_ENV=development
DEBUG=true
LOG_LEVEL=DEBUG
ENABLE_TRACING=false
```

### Staging

```bash
APP_ENV=staging
DEBUG=false
LOG_LEVEL=INFO
ENABLE_TRACING=true
```

### Production

```bash
APP_ENV=production
DEBUG=false
LOG_LEVEL=WARNING
ENABLE_TRACING=true
ENABLE_METRICS=true
```

## ✅ Validation

### Check Configuration

```bash
# Backend configuration check
python -c "from src.config import settings; print(settings)"

# Frontend configuration check (build time)
npm run build
```

### Required Variables

The application will fail to start if these are not set:

- `MONGO_URI`
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`
- `REDIS_URL`
- `STELLIO_URL`
- `FUSEKI_URL`

## 📖 Next Steps

- [Docker Setup](docker-setup) - Container deployment
- [Local Setup](local-setup) - Development environment
- [Deployment Guide](../guides/deployment) - Production deployment

---

For security best practices, see our [Security Documentation](../architecture/security).
