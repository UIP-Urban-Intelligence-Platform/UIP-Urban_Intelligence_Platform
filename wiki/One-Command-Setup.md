<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/One-Command-Setup.md
Module: One-Command Setup Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Get the entire UIP running with a single command.
============================================================================
-->

# ⚡ One-Command Setup

Get the entire UIP - Urban Intelligence Platform running with a single command.

---

## 📋 Overview

The one-command setup (`justrun.ps1` / `justrun.sh`) is designed to:
- Verify all prerequisites
- Start Docker infrastructure
- Initialize databases
- Launch web applications
- Open the dashboard automatically

---

## 🚀 Quick Start

### Windows (PowerShell)

```powershell
# Clone and enter directory
git clone https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform

# Run the one-command setup
.\justrun.ps1 dev
```

### Linux / macOS (Bash)

```bash
# Clone and enter directory
git clone https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform.git
cd UIP-Urban_Intelligence_Platform

# Make executable and run
chmod +x justrun.sh
./justrun.sh dev
```

---

## ⚙️ Command Options

### Development Mode

```powershell
# Full development environment with hot-reload
.\justrun.ps1 dev

# Or on Linux/macOS
./justrun.sh dev
```

**Features:**
- Hot-reload for frontend and backend
- Debug logging enabled
- Development database seeding
- Source maps for debugging

### Production Mode

```powershell
# Production-optimized build
.\justrun.ps1 prod

# Or on Linux/macOS
./justrun.sh prod
```

**Features:**
- Minified assets
- Optimized Docker images
- Production logging
- Performance tuning

### Other Commands

```powershell
# Check system status
.\justrun.ps1 status

# Stop all services
.\justrun.ps1 stop

# Clean up everything
.\justrun.ps1 clean

# View logs
.\justrun.ps1 logs

# Restart services
.\justrun.ps1 restart
```

---

## 📋 What Happens

When you run `.\justrun.ps1 dev`, the script performs:

### Step 1: Prerequisites Check
```
✓ Checking Docker...
✓ Checking Docker Compose...
✓ Checking Python 3.9+...
✓ Checking Node.js 18+...
✓ Checking Git...
```

### Step 2: Environment Setup
```
✓ Creating .env from .env.example...
✓ Creating required directories...
✓ Setting up virtual environment...
✓ Installing Python dependencies...
```

### Step 3: Docker Services
```
✓ Starting PostgreSQL...
✓ Starting Neo4j...
✓ Starting Redis...
✓ Starting MongoDB...
✓ Starting Kafka...
✓ Starting Stellio Context Broker...
✓ Starting Apache Fuseki...
✓ Waiting for health checks...
```

### Step 4: Database Initialization
```
✓ Running database migrations...
✓ Seeding initial data...
✓ Creating indexes...
```

### Step 5: Application Launch
```
✓ Starting backend server (port 5000)...
✓ Starting frontend dev server (port 3001)...
✓ Opening browser to http://localhost:3001...
```

---

## 🔧 Configuration

### Environment Variables

The script uses `.env` file for configuration. Key variables:

```bash
# Application
NODE_ENV=development
DEBUG=true

# Docker Services
POSTGRES_PORT=5432
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687
REDIS_PORT=6379
MONGODB_PORT=27017
KAFKA_PORT=9092
STELLIO_PORT=8080
FUSEKI_PORT=3030

# Web Application
BACKEND_PORT=5000
FRONTEND_PORT=3001

# API Keys (optional)
OPENWEATHERMAP_API_KEY=your-key-here
```

### Custom Configuration

Create a `justrun.config.json` for advanced settings:

```json
{
  "skipDocker": false,
  "skipDatabase": false,
  "skipFrontend": false,
  "openBrowser": true,
  "logLevel": "info",
  "timeout": 300
}
```

---

## 🛠️ Troubleshooting

### Docker Not Running

```
Error: Docker daemon is not running
```

**Solution:**
```powershell
# Windows: Start Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Linux: Start Docker service
sudo systemctl start docker
```

### Port Already in Use

```
Error: Port 5432 is already in use
```

**Solution:**
```powershell
# Find process using port
netstat -ano | findstr :5432

# Kill process
taskkill /PID <PID> /F

# Or change port in .env
POSTGRES_PORT=5433
```

### Permission Denied

```
Error: Permission denied
```

**Solution:**
```powershell
# Windows: Run as Administrator
Start-Process powershell -Verb runAs

# Linux: Add user to docker group
sudo usermod -aG docker $USER
```

### Out of Memory

```
Error: Container killed due to OOM
```

**Solution:**
- Increase Docker Desktop memory limit to 8GB+
- Or use minimal mode: `.\justrun.ps1 dev --minimal`

---

## 📊 Service Endpoints

After successful setup, access:

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3001 | React web application |
| **API** | http://localhost:5000/api | Express.js REST API |
| **Stellio** | http://localhost:8080 | NGSI-LD Context Broker |
| **Fuseki** | http://localhost:3030 | SPARQL Triplestore |
| **Neo4j** | http://localhost:7474 | Graph Database Browser |
| **Grafana** | http://localhost:3000 | Monitoring Dashboard |

---

## 🔗 Related Pages

- [[Quick-Start]] - Basic quick start guide
- [[Installation]] - Detailed installation instructions
- [[Docker-Services]] - Docker infrastructure details
- [[Configuration]] - Full configuration reference
- [[Troubleshooting]] - Common issues and solutions

---

## 📝 Script Source

The one-command setup scripts are located at:
- `justrun.ps1` - PowerShell script for Windows
- `justrun.sh` - Bash script for Linux/macOS

Both scripts provide identical functionality with platform-specific implementations.
