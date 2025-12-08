---
sidebar_label: 'Troubleshooting Guide'
title: 'Troubleshooting Guide'
sidebar_position: 1
---

<!--
============================================================================
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.
============================================================================

UIP - Urban Intelligence Platform
Troubleshooting guide documentation.

File: apps/traffic-web-app/frontend/docs/docs/guides/troubleshooting.md
Module: Guides Documentation
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT
Description: Documentation for troubleshooting common issues.
============================================================================
-->

# Troubleshooting Guide

Common issues and solutions for UIP - Urban Intelligence Platform.

## 🚨 Quick Diagnostics

Before diving into specific issues, run these diagnostic commands:

```bash
# Check Docker services
docker-compose ps

# Check logs
docker-compose logs --tail=50

# Check system resources
docker stats

# Check network connectivity
docker network ls
```

## 🐳 Docker Issues

### Services Not Starting

**Symptoms:**

- Container exits immediately
- Status shows "Exited" or "Restarting"

**Solutions:**

```bash
# View detailed logs
docker-compose logs <service-name>

# Check container health
docker inspect <container-id> --format='{{.State.Health}}'

# Restart specific service
docker-compose restart <service-name>

# Rebuild and restart
docker-compose up -d --build <service-name>
```

### Port Conflicts

**Symptoms:**

- Error: "port is already allocated"
- Service fails to bind to port

**Solutions:**

```bash
# Find process using port (Windows)
netstat -ano | findstr :8001

# Find process using port (Linux/macOS)
lsof -i :8001
sudo ss -tulpn | grep :8001

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Out of Disk Space

**Symptoms:**

- Build fails with "no space left"
- Containers crash unexpectedly

**Solutions:**

```bash
# Check disk usage
docker system df

# Clean unused resources
docker system prune -a

# Clean volumes (WARNING: deletes data)
docker volume prune

# Clean build cache
docker builder prune
```

### Container Network Issues

**Symptoms:**

- Services can't communicate
- "Connection refused" between containers

**Solutions:**

```bash
# Verify network exists
docker network ls

# Inspect network
docker network inspect uip-network

# Recreate network
docker-compose down
docker-compose up -d
```

## 🗄️ Database Issues

### MongoDB Connection Failed

**Symptoms:**

- "Connection refused" to port 27017
- "Authentication failed"

**Solutions:**

```bash
# Check MongoDB is running
docker-compose ps mongo

# View MongoDB logs
docker-compose logs mongo

# Test connection
docker-compose exec mongo mongosh --eval "db.adminCommand('ping')"

# Reset MongoDB (WARNING: deletes data)
docker-compose down -v
docker-compose up -d mongo
```

### Neo4j Connection Failed

**Symptoms:**

- "Connection refused" to port 7687
- "Authentication failure"

**Solutions:**

```bash
# Check Neo4j is running
docker-compose ps neo4j

# View Neo4j logs
docker-compose logs neo4j

# Check credentials in .env
# NEO4J_AUTH=neo4j/your_password

# Access Neo4j browser
open http://localhost:7474
```

### Redis Connection Failed

**Symptoms:**

- "Could not connect to Redis"
- Cache operations failing

**Solutions:**

```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL
```

## 🌐 API Issues

### Backend Not Responding

**Symptoms:**

- API returns 502/503 errors
- Health check fails

**Solutions:**

```bash
# Check backend status
docker-compose ps backend

# View backend logs
docker-compose logs -f backend

# Health check
curl http://localhost:8001/health

# Restart backend
docker-compose restart backend
```

### CORS Errors

**Symptoms:**

- "Access-Control-Allow-Origin" errors in browser
- API requests blocked from frontend

**Solutions:**

1. Check CORS configuration in backend
2. Verify frontend URL is whitelisted
3. Ensure proper headers are set

```python
# src/api/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### WebSocket Connection Failed

**Symptoms:**

- "WebSocket connection to ... failed"
- Real-time updates not working

**Solutions:**

```bash
# Check WebSocket endpoint
wscat -c ws://localhost:8001/ws

# Verify backend WebSocket support
grep -r "WebSocket" src/api/

# Check browser console for errors
```

## 🎨 Frontend Issues

### Frontend Not Loading

**Symptoms:**

- Blank page
- 404 errors

**Solutions:**

```bash
# Check frontend container
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend

# For local development
cd apps/traffic-web-app/frontend
npm install
npm run dev
```

### Build Errors

**Symptoms:**

- npm/yarn build fails
- TypeScript errors

**Solutions:**

```bash
# Clear node_modules
rm -rf node_modules
npm install

# Clear npm cache
npm cache clean --force

# Check TypeScript errors
npm run type-check

# Build with verbose output
npm run build -- --debug
```

### Map Not Displaying

**Symptoms:**

- Map shows gray tiles
- "Error loading tiles"

**Solutions:**

1. Check internet connection
2. Verify map tile URL in environment
3. Check browser console for CORS issues

```bash
# Verify map tile server
curl "https://tile.openstreetmap.org/10/823/496.png"
```

## 🔧 Agent Issues

### Agent Execution Failed

**Symptoms:**

- Agent errors in logs
- Data not being processed

**Solutions:**

```bash
# Check agent logs
docker-compose logs backend | grep -i "agent"

# Run specific agent manually
docker-compose exec backend python -c "
from src.agents import CameraFetchAgent
agent = CameraFetchAgent()
agent.execute()
"

# Verify agent configuration
cat config/agents.yaml
```

### Data Not Updating

**Symptoms:**

- Stale data in frontend
- No new observations

**Solutions:**

```bash
# Check orchestrator
docker-compose logs backend | grep -i "orchestrator"

# Verify workflow
cat config/workflow.yaml

# Check external API connectivity
curl https://api.example.com/health

# Clear cache
docker-compose exec redis redis-cli FLUSHALL
```

## 📊 Performance Issues

### Slow Response Times

**Symptoms:**

- API latency > 1s
- Frontend feels sluggish

**Solutions:**

```bash
# Check resource usage
docker stats

# Increase container resources in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G

# Check database indexes
docker-compose exec mongo mongosh --eval "db.cameras.getIndexes()"
```

### Memory Issues

**Symptoms:**

- Container OOM killed
- Swap usage high

**Solutions:**

```bash
# Increase Docker memory limit
# Docker Desktop: Settings > Resources > Memory

# Check for memory leaks
docker stats --no-stream

# Limit container memory
docker-compose up -d --scale backend=1
```

## 📋 Logs and Debugging

### Enable Debug Mode

```bash
# Backend
DEBUG=true docker-compose up -d backend

# Frontend (development)
VITE_DEBUG=true npm run dev
```

### View Structured Logs

```bash
# JSON format logs
docker-compose logs backend | jq

# Filter by level
docker-compose logs backend | grep ERROR

# Follow logs
docker-compose logs -f --tail=100
```

### Export Logs

```bash
# Export to file
docker-compose logs > logs/debug-$(date +%Y%m%d).log

# Export specific service
docker-compose logs backend > logs/backend-$(date +%Y%m%d).log
```

## 🆘 Getting Help

If you can't resolve your issue:

1. **Search existing issues**: [GitHub Issues](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues)
2. **Create a new issue** with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Logs and error messages
   - Environment details (OS, Docker version, etc.)
3. **Contact the team**: `nguyennhatquang522004@gmail.com`

---

See also:

- [Installation Guide](../installation/prerequisites)
- [Development Guide](development)
- [Deployment Guide](deployment)
