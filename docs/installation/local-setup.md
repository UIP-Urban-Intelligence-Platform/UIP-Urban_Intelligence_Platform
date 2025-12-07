---
sidebar_position: 3
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: local-setup.md
Module: docs.installation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Local development setup documentation.
============================================================================
-->

# Local Development Setup

This guide covers setting up UIP - Urban Intelligence Platform for local development without Docker.

## 🎯 Overview

Local development allows for:

- Faster iteration with hot-reload
- Direct debugging in your IDE
- Easier access to logs and breakpoints
- Customizable development environment

## 📋 Prerequisites

Ensure you have installed:

- Python 3.9+
- Node.js 18+
- Git
- MongoDB (local or Docker)
- Neo4j (local or Docker)
- Redis (local or Docker)

See [Prerequisites](prerequisites) for detailed installation instructions.

## 🚀 Backend Setup

### 1. Clone Repository

```bash
git clone https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (macOS/Linux)
source venv/bin/activate
```

### 3. Install Dependencies

```bash
# Install in development mode
pip install -e .

# Or install from requirements
pip install -r requirements/dev.txt
```

### 4. Configure Environment

Create `.env` file in project root:

```bash
# Application
APP_ENV=development
DEBUG=true

# API Configuration
API_HOST=127.0.0.1
API_PORT=8001

# Database URLs
MONGO_URI=mongodb://localhost:27017/hcmc_traffic_dev
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Redis
REDIS_URL=redis://localhost:6379

# Context Broker
STELLIO_URL=http://localhost:8080
FUSEKI_URL=http://localhost:3030
```

### 5. Start Backend Server

```bash
# Using uvicorn (recommended for development)
uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8001

# Or using the main script
python main.py
```

The API will be available at `http://localhost:8001`.

### 6. Verify Backend

```bash
# Health check
curl http://localhost:8001/health

# API documentation
open http://localhost:8001/docs
```

## 🌐 Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd apps/traffic-web-app/frontend
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Configure Environment

Create `.env` file in frontend directory:

```bash
VITE_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001/ws
```

### 4. Start Development Server

```bash
# Using npm
npm run dev

# Or using yarn
yarn dev
```

The frontend will be available at `http://localhost:5173`.

## 🗄️ Database Setup

### Start Infrastructure with Docker

The easiest way to run databases locally:

```bash
# Start only databases
docker-compose up -d mongo neo4j redis

# Verify
docker-compose ps
```

### Manual Database Setup

#### MongoDB

```bash
# Install MongoDB (Ubuntu)
sudo apt-get install -y mongodb

# Start service
sudo systemctl start mongodb

# Verify
mongosh --eval "db.version()"
```

#### Neo4j

```bash
# Download and extract Neo4j
# From: https://neo4j.com/download/

# Start Neo4j
./bin/neo4j start

# Access browser: http://localhost:7474
```

#### Redis

```bash
# Install Redis (Ubuntu)
sudo apt-get install redis-server

# Start service
sudo systemctl start redis

# Verify
redis-cli ping
# Should return: PONG
```

## 🔄 Development Workflow

### Typical Development Session

```bash
# 1. Start databases (if using Docker)
docker-compose up -d mongo neo4j redis fuseki stellio

# 2. Activate Python environment
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate  # Windows

# 3. Start backend (terminal 1)
uvicorn src.api.main:app --reload --host 127.0.0.1 --port 8001

# 4. Start frontend (terminal 2)
cd apps/traffic-web-app/frontend
npm run dev
```

### Running Tests

```bash
# Backend tests
pytest

# Frontend tests
cd apps/traffic-web-app/frontend
npm test
```

### Code Formatting

```bash
# Python (backend)
black src/
ruff check --fix src/

# TypeScript (frontend)
cd apps/traffic-web-app/frontend
npm run lint
npm run format
```

## 🐛 Debugging

### Backend Debugging (VS Code)

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["src.api.main:app", "--reload", "--port", "8001"],
      "jinja": true,
      "justMyCode": false
    }
  ]
}
```

### Frontend Debugging (VS Code)

Add to `.vscode/launch.json`:

```json
{
  "name": "Chrome: Frontend",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/apps/traffic-web-app/frontend/src"
}
```

## ⚠️ Common Issues

### Port Already in Use

```bash
# Find process
lsof -i :8001  # Linux/macOS
netstat -ano | findstr :8001  # Windows

# Kill process
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

### Python Module Not Found

```bash
# Ensure virtual environment is activated
which python  # Should show venv path

# Reinstall dependencies
pip install -e .
```

### Database Connection Refused

```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart mongo
```

## 📖 Next Steps

- [Docker Setup](docker-setup) - Production deployment with Docker
- [Environment Configuration](environment-config) - Advanced configuration
- [Development Guide](../guides/development) - Coding standards and workflow

---

Need help? Check the [Troubleshooting Guide](../guides/troubleshooting) or open an [issue](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues).
