<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Troubleshooting.md
Module: Troubleshooting Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Common issues and their solutions for UIP.
============================================================================
-->
# 🔧 Troubleshooting

Common issues and their solutions.

---

## 📋 Quick Diagnostics

### Health Check

```bash
# Check all services
make health-check

# Or run directly
python scripts/health_check.py
```

### System Status

```bash
# Docker containers
docker-compose ps

# Container logs
docker-compose logs -f [service]

# Resource usage
docker stats
```

---

## 🐳 Docker Issues

### Containers Won't Start

**Symptom**: `docker-compose up` fails

**Solutions**:

```bash
# 1. Check disk space
docker system df

# Clean up if needed
docker system prune -a

# 2. Check port conflicts
netstat -tulpn | grep -E '(7474|7687|3030|8080)'

# 3. Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

### Out of Memory

**Symptom**: Containers keep restarting

**Solutions**:

```bash
# 1. Increase Docker memory (Docker Desktop settings)
# Recommended: 8GB+ RAM

# 2. Check container limits
docker stats

# 3. Reduce resource-heavy services
docker-compose stop neo4j fuseki
```

### Neo4j Won't Connect

**Symptom**: `Connection refused on port 7687`

**Solutions**:

```bash
# 1. Wait for startup (can take 60-90 seconds)
docker-compose logs neo4j | tail -20

# 2. Check if bolt port is exposed
docker-compose ps | grep neo4j

# 3. Verify credentials
# Default: neo4j/neo4j123

# 4. Force restart
docker-compose restart neo4j
```

### Fuseki/SPARQL Errors

**Symptom**: `SPARQL endpoint not available`

**Solutions**:

```bash
# 1. Check Fuseki status
curl http://localhost:3030/$/ping

# 2. Verify dataset exists
curl http://localhost:3030/$/datasets

# 3. Recreate dataset
curl -X POST http://localhost:3030/$/datasets \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "dbName=traffic&dbType=tdb2"
```

---

## 🐍 Python Issues

### Import Errors

**Symptom**: `ModuleNotFoundError`

**Solutions**:

```bash
# 1. Install dependencies
pip install -r requirements/base.txt

# 2. Install in editable mode
pip install -e .

# 3. Check Python path
echo $PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"
```

### Agent Won't Start

**Symptom**: Agent crashes on startup

**Solutions**:

```bash
# 1. Check configuration
cat config/agents.yaml

# 2. Verify environment variables
env | grep -E '(NEO4J|REDIS|MONGODB)'

# 3. Run with debug
python -m agents.traffic_analyzer_agent --debug

# 4. Check dependencies
python -c "import src; print(src.__version__)"
```

### YOLO Model Issues

**Symptom**: `Model not found` or slow inference

**Solutions**:

```bash
# 1. Download model
python -c "from yolox.exp import get_exp; exp = get_exp(None, 'yolox_x')"

# 2. Check CUDA (for GPU)
python -c "import torch; print(torch.cuda.is_available())"

# 3. Force CPU if GPU issues
export YOLOX_DEVICE=cpu
```

---

## 🌐 API Issues

### 500 Internal Server Error

**Symptom**: API returns 500 error

**Solutions**:

```bash
# 1. Check API logs
docker-compose logs api-gateway

# 2. Verify backend services
curl http://localhost:5000/health

# 3. Check database connections
docker-compose logs postgres
docker-compose logs redis
```

### CORS Errors

**Symptom**: `Access-Control-Allow-Origin` errors

**Solutions**:

```javascript
// Check API configuration
// config/api_gateway_config.yaml
cors:
  allowed_origins:
    - http://localhost:3001
    - http://localhost:3000

// Or set environment variable
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
```

### Rate Limiting

**Symptom**: `429 Too Many Requests`

**Solutions**:

```bash
# 1. Wait and retry with exponential backoff

# 2. Check rate limit settings
cat config/api_gateway_config.yaml | grep rate_limit

# 3. Increase limits for development
# config/api_gateway_config.yaml
rate_limit:
  requests_per_minute: 1000
```

---

## 💾 Database Issues

### PostgreSQL Connection Failed

**Symptom**: `Connection refused` or `FATAL: password authentication failed`

**Solutions**:

```bash
# 1. Check PostgreSQL status
docker-compose logs postgres

# 2. Verify connection string
echo $DATABASE_URL

# 3. Reset password
docker-compose exec postgres psql -U postgres -c "ALTER USER user PASSWORD 'new_password';"

# 4. Wait for ready state
until docker-compose exec postgres pg_isready; do sleep 1; done
```

### Redis Connection Issues

**Symptom**: `Connection refused on port 6379`

**Solutions**:

```bash
# 1. Check Redis status
docker-compose logs redis

# 2. Test connection
docker-compose exec redis redis-cli ping

# 3. Clear cache if corrupted
docker-compose exec redis redis-cli FLUSHALL
```

### MongoDB Errors

**Symptom**: `MongoNetworkError`

**Solutions**:

```bash
# 1. Check MongoDB status
docker-compose logs mongodb

# 2. Verify replica set (if used)
docker-compose exec mongodb mongosh --eval "rs.status()"

# 3. Check authentication
docker-compose exec mongodb mongosh -u admin -p password --authenticationDatabase admin
```

---

## 🔗 Semantic Web Issues

### NGSI-LD Validation Errors

**Symptom**: `Invalid NGSI-LD entity`

**Solutions**:

```python
# 1. Validate JSON-LD
import jsonld
jsonld.expand(entity)

# 2. Check required fields
required = ['id', 'type', '@context']
for field in required:
    assert field in entity

# 3. Verify URN format
assert entity['id'].startswith('urn:ngsi-ld:')
```

### Stellio Errors

**Symptom**: `Entity not found` or subscription issues

**Solutions**:

```bash
# 1. Check Stellio health
curl http://localhost:8080/actuator/health

# 2. Query entity
curl http://localhost:8080/ngsi-ld/v1/entities/urn:ngsi-ld:Entity:123

# 3. Check subscriptions
curl http://localhost:8080/ngsi-ld/v1/subscriptions

# 4. Recreate subscription
curl -X POST http://localhost:8080/ngsi-ld/v1/subscriptions \
  -H "Content-Type: application/ld+json" \
  -d @subscription.json
```

---

## 🧪 Testing Issues

### Tests Failing

**Symptom**: `pytest` failures

**Solutions**:

```bash
# 1. Run with verbose output
pytest -v --tb=long

# 2. Run single test
pytest tests/test_specific.py::test_function -v

# 3. Clear pytest cache
rm -rf .pytest_cache __pycache__

# 4. Check test database
docker-compose exec postgres psql -U test -d test_db
```

### Integration Tests Timeout

**Symptom**: Tests hang or timeout

**Solutions**:

```bash
# 1. Increase timeout
pytest --timeout=300

# 2. Run services before tests
docker-compose up -d
sleep 60  # Wait for services

# 3. Check service dependencies
python scripts/check_dependencies.py
```

---

## 🔒 Permission Issues

### File Permission Denied

**Symptom**: `Permission denied` errors

**Solutions**:

```bash
# 1. Fix ownership
sudo chown -R $USER:$USER .

# 2. Fix script permissions
chmod +x scripts/*.py
chmod +x start_*.bat

# 3. Docker volume permissions
docker-compose down -v
docker-compose up -d
```

### Docker Socket Access

**Symptom**: `Got permission denied while trying to connect to Docker`

**Solutions**:

```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or use sudo
sudo docker-compose up -d
```

---

## 📊 Performance Issues

### Slow Processing

**Symptom**: High latency, slow responses

**Solutions**:

```bash
# 1. Enable GPU for YOLO
export YOLO_DEVICE=0  # GPU index

# 2. Increase worker processes
# config/agents.yaml
workers: 8

# 3. Enable Redis caching
# config/cache_config.yaml
enabled: true
ttl: 300

# 4. Optimize database queries
# Add indexes in PostgreSQL
```

### Memory Leaks

**Symptom**: Memory usage grows over time

**Solutions**:

```python
# 1. Profile memory
import tracemalloc
tracemalloc.start()
# ... run code ...
snapshot = tracemalloc.take_snapshot()

# 2. Force garbage collection
import gc
gc.collect()

# 3. Check for circular references
import objgraph
objgraph.show_most_common_types()
```

---

## 📞 Getting Help

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python orchestrator.py

# Or in config
# config/agents.yaml
logging:
  level: DEBUG
```

### Collect Diagnostics

```bash
# Generate diagnostic report
python scripts/diagnostics.py > diagnostics.txt

# Include:
# - Docker status
# - Service logs
# - Configuration
# - System info
```

### Report Issues

1. Check existing issues: [GitHub Issues](https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform/issues)
2. Search FAQ: [[FAQ]]
3. Create new issue with:
   - Environment (OS, Docker version, Python version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Logs and error messages
   - Diagnostic report

---

## 🔗 Related Pages

- [[FAQ]] - Frequently asked questions
- [[Installation]] - Setup instructions
- [[Configuration]] - Configuration reference
