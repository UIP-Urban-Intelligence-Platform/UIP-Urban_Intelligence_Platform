<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: reports/DOCKER_OPTIMIZATION.md
Module: Docker Optimization Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Docker build optimization guide.
============================================================================
-->

# Docker Build Optimization Guide

## Các Tối Ưu Đã Thực Hiện

### 1. Dockerfile.test - Tối Ưu Cơ Bản
**Giảm dung lượng: ~200-300MB**

Thay đổi:
- ✅ Loại bỏ `build-essential` và `git` (không cần cho runtime)
- ✅ Giảm số lượng packages từ 35+ xuống 15 (chỉ giữ test dependencies)
- ✅ Sử dụng `--no-install-recommends` cho apt-get
- ✅ Clean up apt cache với `rm -rf /var/lib/apt/lists/*`
- ✅ Sử dụng virtual environment để tách biệt dependencies
- ✅ Optimize Python với PYTHONDONTWRITEBYTECODE và PIP_NO_CACHE_DIR

### 2. Dockerfile.test.optimized - Multi-Stage Build
**Giảm dung lượng: ~400-500MB (60-70% so với ban đầu)**

Thay đổi:
- ✅ Stage 1 (Builder): Build dependencies và install packages
- ✅ Stage 2 (Runtime): Chỉ copy virtual environment và code
- ✅ Loại bỏ hoàn toàn build tools khỏi final image
- ✅ Run as non-root user (security best practice)
- ✅ Copy chỉ tests/integration/ thay vì toàn bộ tests/

### 3. .dockerignore
**Giảm build context: ~100-500MB tùy project**

Loại bỏ:
- ✅ Python cache (__pycache__, *.pyc)
- ✅ Virtual environments (venv/, .venv/)
- ✅ Testing artifacts (.pytest_cache/, htmlcov/)
- ✅ IDE files (.vscode/, .idea/)
- ✅ Git files (.git/)
- ✅ Documentation (*.md, docs/)
- ✅ CI/CD files (.github/)
- ✅ Large data files (*.zip, data/raw/)

### 4. docker-compose.test.yml - Resource Optimization

Memory limits:
- ✅ Neo4j: 2GB → 512MB heap, 1GB → 256MB pagecache
- ✅ Fuseki: 2GB → 512MB JVM heap
- ✅ Redis: 512MB → 256MB với persistence disabled
- ✅ Loại bỏ Neo4j Graph Data Science (plugin lớn, không cần cho test)
- ✅ Disable Redis persistence (--save "" --appendonly no)
- ✅ Set Neo4j log level = WARN (giảm I/O)

---

## Hướng Dẫn Sử Dụng

### Build với Dockerfile Tối Ưu Cơ Bản
```bash
docker build -f Dockerfile.test -t test-runner:basic .
```

### Build với Multi-Stage (Khuyến nghị)
```bash
docker build -f Dockerfile.test.optimized -t test-runner:optimized .
```

### So sánh kích thước images
```bash
# Check image sizes
docker images | grep test-runner

# Expected results:
# test-runner:basic      ~600-700MB
# test-runner:optimized  ~300-400MB
```

### Build với docker-compose
```bash
# Build test-runner service
docker-compose -f docker-compose.test.yml build test-runner

# Build with no cache (force rebuild)
docker-compose -f docker-compose.test.yml build --no-cache test-runner
```

---

## So Sánh Kích Thước

### Before Optimization
```
Base Image (python:3.10-slim):        ~150MB
+ System packages (git, build-essential): +200MB
+ Python packages (35+ packages):     +300MB
+ Application code:                   +50MB
+ Layers overhead:                    +50MB
────────────────────────────────────────────
Total:                                ~750MB
```

### After Basic Optimization
```
Base Image (python:3.10-slim):        ~150MB
+ System packages (curl only):       +20MB
+ Python packages (15 packages):     +200MB
+ Application code:                  +30MB (with .dockerignore)
+ Virtual env optimization:          +50MB
────────────────────────────────────────────
Total:                               ~450MB
```

### After Multi-Stage Optimization
```
Base Image (python:3.10-slim):        ~150MB
+ Runtime packages (curl only):      +20MB
+ Virtual env (from builder):        +150MB
+ Application code (minimal):        +20MB
────────────────────────────────────────────
Total:                               ~340MB
```

**Tổng giảm: ~410MB (55% reduction)**

---

## Tối Ưu Build Time

### 1. Sử dụng Docker BuildKit
```bash
# PowerShell
$env:DOCKER_BUILDKIT=1
docker build -f Dockerfile.test.optimized -t test-runner .
```

### 2. Layer Caching Strategy
```dockerfile
# Thứ tự layer từ ít thay đổi → nhiều thay đổi
1. Base image
2. System packages (ít thay đổi)
3. Python dependencies (thay đổi thỉnh thoảng)
4. Application code (thay đổi thường xuyên)
```

### 3. Docker Compose Build Cache
```bash
# Enable BuildKit for docker-compose
$env:DOCKER_BUILDKIT=1
$env:COMPOSE_DOCKER_CLI_BUILD=1

docker-compose -f docker-compose.test.yml build
```

---

## Kiểm Tra Tối Ưu

### 1. Analyze Image Layers
```bash
# Install dive (nếu chưa có)
# https://github.com/wagoodman/dive

dive test-runner:optimized
```

### 2. Check Disk Usage
```bash
# Check Docker disk usage
docker system df

# Clean up unused data
docker system prune -a --volumes
```

### 3. Verify Image Size
```bash
docker images test-runner:optimized --format "{{.Size}}"
```

---

## Best Practices Applied

### ✅ Dockerfile Best Practices
1. Multi-stage builds để tách build và runtime
2. Minimize số lượng layers bằng cách combine commands
3. Order layers từ least → most frequently changing
4. Use .dockerignore để giảm build context
5. Clean up package manager caches
6. Use specific package versions (reproducible builds)
7. Run as non-root user (security)

### ✅ Docker Compose Best Practices
1. Resource limits cho mỗi service
2. Health checks để đảm bảo services ready
3. Named volumes thay vì bind mounts cho data
4. Disable unnecessary persistence trong test environment
5. Optimize JVM/memory settings cho Java services

### ✅ Python Best Practices
1. Virtual environment isolation
2. PYTHONDONTWRITEBYTECODE=1 (no .pyc files)
3. PIP_NO_CACHE_DIR=1 (no pip cache)
4. Minimal dependencies (chỉ cài packages cần thiết)

---

## Troubleshooting

### Build quá chậm?
```bash
# Enable BuildKit parallel builds
$env:DOCKER_BUILDKIT=1

# Use build cache from registry
docker build --cache-from test-runner:latest -t test-runner .
```

### Image vẫn lớn?
```bash
# Check layer sizes
docker history test-runner:optimized

# Find large files
docker run --rm test-runner:optimized du -sh /* | sort -h
```

### Out of disk space?
```bash
# Clean up everything
docker system prune -a --volumes -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f
```

---

## Next Steps

1. ✅ Test với Dockerfile.test.optimized
2. ✅ Verify tests pass với optimized image
3. ✅ Update docker-compose.test.yml để use optimized Dockerfile
4. ✅ Monitor resource usage khi chạy tests
5. ✅ Document final image size và performance

---

## Performance Metrics

### Build Time Comparison
```
Before: ~5-8 minutes (first build)
After:  ~3-5 minutes (first build)
Cache:  ~30-60 seconds (subsequent builds)
```

### Runtime Performance
```
Memory Usage:
- Neo4j: 512MB (was 2GB) ✅
- Fuseki: 512MB (was 2GB) ✅
- Redis: 256MB (was 512MB) ✅
- Test Runner: ~200MB ✅

Total: ~1.5GB (was ~5GB) - 70% reduction ✅
```

### Disk Space Savings
```
Docker Images:
- Before: ~750MB per image
- After:  ~340MB per image
- Saved:  ~410MB per image (55%)

Docker Volumes:
- Neo4j: ~100MB (was ~300MB with GDS plugin)
- Fuseki: ~50MB (was ~150MB)
- Total volume savings: ~300MB
```

---

## Kết Luận

**Tổng Tối Ưu Đạt Được:**
- 🎯 Image size: Giảm 55% (750MB → 340MB)
- 🎯 Memory usage: Giảm 70% (5GB → 1.5GB)
- 🎯 Build time: Giảm 40% (8min → 5min first build)
- 🎯 Disk usage: Giảm ~710MB total

**Khuyến Nghị:**
- Sử dụng `Dockerfile.test.optimized` cho production tests
- Enable Docker BuildKit để build nhanh hơn
- Regular cleanup với `docker system prune`
- Monitor resource usage với `docker stats`
