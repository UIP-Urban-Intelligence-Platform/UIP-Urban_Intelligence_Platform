<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: guides/DOCKER_SCRIPTS_GUIDE.md
Module: Docker Scripts Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Docker scripts quick reference guide.
============================================================================
-->

# Docker Scripts - Quick Reference Guide

Các scripts PowerShell để quản lý Docker integration tests nhanh chóng và dễ dàng.

---

## 📋 Danh Sách Scripts

### 1. `quick-build.ps1` ⚡
**Mục đích**: Build nhanh test-runner image với Dockerfile tối ưu

**Sử dụng**:
```powershell
.\quick-build.ps1
```

**Thực hiện**:
- Enable Docker BuildKit
- Build test-runner với Dockerfile.test.optimized
- Hiển thị kích thước image
- Thời gian build: ~3-5 phút (lần đầu)

---

### 2. `start-services.ps1` ▶️
**Mục đích**: Start tất cả Docker services

**Sử dụng**:
```powershell
.\start-services.ps1
```

**Thực hiện**:
- Start 8 services (neo4j, fuseki, redis, postgres, kafka, zookeeper, stellio)
- Wait 30s cho services khởi động
- Hiển thị status của tất cả services
- Hướng dẫn chạy tests

---

### 3. `stop-services.ps1` ⏹️
**Mục đích**: Stop và cleanup tất cả services

**Sử dụng**:
```powershell
.\stop-services.ps1
```

**Thực hiện**:
- Stop tất cả containers
- Remove volumes (data cleanup)
- Hiển thị Docker disk usage

---

### 4. `optimize-build.ps1` 🔧
**Mục đích**: Build với optimization và cleanup

**Sử dụng**:
```powershell
.\optimize-build.ps1
```

**Thực hiện**:
- Stop existing containers
- Clean up dangling images và build cache
- Build test-runner
- Pull service images
- Hiển thị disk usage before/after

---

### 5. `compare-images.ps1` 📊
**Mục đích**: So sánh kích thước Dockerfile.test vs Dockerfile.test.optimized

**Sử dụng**:
```powershell
.\compare-images.ps1
```

**Thực hiện**:
- Build cả 2 versions
- So sánh kích thước
- Tính toán % giảm
- Hiển thị layer details

---

## 🚀 Workflow Khuyến Nghị

### Lần Đầu Tiên
```powershell
# 1. Build test-runner image
.\quick-build.ps1

# 2. Start services
.\start-services.ps1

# 3. Run tests
docker-compose -f docker-compose.test.yml run --rm test-runner

# 4. Stop services
.\stop-services.ps1
```

### Phát Triển Hàng Ngày
```powershell
# Start services (nhanh hơn vì images đã có)
.\start-services.ps1

# Run tests nhiều lần
docker-compose -f docker-compose.test.yml run --rm test-runner

# Stop khi done
.\stop-services.ps1
```

### Khi Thay Đổi Code
```powershell
# Rebuild image
.\quick-build.ps1

# Restart services với image mới
.\stop-services.ps1
.\start-services.ps1

# Run tests
docker-compose -f docker-compose.test.yml run --rm test-runner
```

---

## 📦 Tối Ưu Đã Đạt Được

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Image Size | ~750MB | ~340MB | **-55%** |
| Memory Usage | ~5GB | ~1.5GB | **-70%** |
| Build Time | ~8min | ~5min | **-40%** |
| Disk Space | - | - | **~710MB saved** |

---

## 🔍 Troubleshooting

### Build Failed?
```powershell
# Clean up everything
docker system prune -a --volumes -f

# Try again
.\quick-build.ps1
```

### Services Not Starting?
```powershell
# Check logs
docker-compose -f docker-compose.test.yml logs

# Stop and restart
.\stop-services.ps1
.\start-services.ps1
```

### Out of Disk Space?
```powershell
# Check usage
docker system df

# Clean up
docker system prune -a --volumes -f

# Remove unused images
docker image prune -a -f
```

### Tests Failing?
```powershell
# Check service health
docker-compose -f docker-compose.test.yml ps

# View specific service logs
docker-compose -f docker-compose.test.yml logs neo4j
docker-compose -f docker-compose.test.yml logs stellio-api-gateway

# Restart unhealthy services
docker-compose -f docker-compose.test.yml restart neo4j
```

---

## 📝 Chi Tiết Technical

### Docker Compose Services
1. **neo4j** (port 7474, 7687) - Graph database
2. **fuseki** (port 3030) - RDF triplestore  
3. **redis** (port 6379) - Cache layer
4. **postgres** (port 5432) - Stellio backend
5. **kafka** (port 9092) - Event streaming
6. **zookeeper** (port 2181) - Kafka coordination
7. **stellio-api-gateway** (port 8080) - NGSI-LD API
8. **stellio-search-service** - Search service
9. **stellio-subscription-service** - Subscription service
10. **test-runner** - Pytest container

### Health Checks
Tất cả services có health checks:
- Neo4j: Cypher shell check
- Fuseki: HTTP ping endpoint
- Redis: Redis CLI ping
- Postgres: pg_isready
- Kafka: broker API versions
- Stellio: Actuator health endpoint

### Resource Limits (Optimized)
- Neo4j: 512MB heap, 256MB pagecache
- Fuseki: 512MB JVM heap
- Redis: 256MB memory
- Total: ~1.5GB (vs 5GB before)

---

## 📚 Xem Thêm

- **DOCKER_OPTIMIZATION.md** - Chi tiết về tối ưu
- **INTEGRATION_TEST_REPORT.md** - Báo cáo integration tests
- **.dockerignore** - Files bị loại bỏ khỏi build context
- **Dockerfile.test.optimized** - Multi-stage optimized Dockerfile

---

## ✅ Best Practices

1. **Always use BuildKit**: Đã enable trong scripts
2. **Clean up regularly**: Chạy `stop-services.ps1` sau khi test
3. **Monitor disk space**: Sử dụng `docker system df`
4. **Check health**: Đợi services healthy trước khi test
5. **Use .dockerignore**: Giảm build context size
6. **Multi-stage builds**: Dockerfile.test.optimized đã implement

---

**Lưu ý**: Tất cả scripts yêu cầu PowerShell và Docker Desktop đang chạy.
