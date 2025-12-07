<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: JUSTRUN.md
Module: One Command Setup Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
  Quick start guide for running the entire project with one command.
============================================================================
-->

# 🚀 Just Run - One Command Setup

Hệ thống "Just Run" cho phép bạn chạy toàn bộ project chỉ với **MỘT CÂU LỆNH**.

## ⚡ Quick Start

### Windows (PowerShell)

```powershell
# Chỉ cần chạy một lần đầu tiên (cài đặt dependencies)
.\justrun.ps1 setup

# Sau đó chỉ cần:
.\justrun.ps1 dev
```

**Hoặc nhanh hơn - tự động setup nếu cần:**
```powershell
.\justrun.ps1 dev
```

### Linux/Mac (Make)

```bash
# Lần đầu tiên
make setup

# Chạy development
make dev

# Hoặc chỉ một lệnh (tự động setup)
make run
```

## 📋 Các Lệnh Có Sẵn

### PowerShell (Windows)

| Lệnh | Mô tả |
|------|-------|
| `.\justrun.ps1 setup` | Cài đặt tất cả dependencies (Python + Node.js) |
| `.\justrun.ps1 dev` | Chạy môi trường development (tự động setup nếu cần) |
| `.\justrun.ps1 prod` | Chạy môi trường production với Docker Compose |
| `.\justrun.ps1 stop` | Dừng tất cả services |
| `.\justrun.ps1 clean` | Xóa tất cả build artifacts và containers |
| `.\justrun.ps1 test` | Chạy tất cả tests |
| `.\justrun.ps1 help` | Hiển thị trợ giúp |

### Makefile (Linux/Mac/Windows với Make)

| Lệnh | Mô tả |
|------|-------|
| `make setup` | Cài đặt tất cả dependencies |
| `make dev` | Chạy development mode |
| `make prod` | Chạy production mode (Docker) |
| `make run` | Quick run - tự động setup và chạy |
| `make stop` | Dừng tất cả services |
| `make clean` | Cleanup toàn bộ |
| `make test` | Run tests |
| `make logs` | Xem Docker logs |
| `make health` | Health check các services |

## 🎯 Chế Độ Hoạt Động

### Development Mode (`dev`)

Chạy tất cả services locally (không dùng Docker cho app):

- ✅ **Infrastructure** (Docker): Stellio, Neo4j, MongoDB, Kafka, Redis, Fuseki
- ✅ **Python Orchestrator**: Chạy trực tiếp với `.venv`
- ✅ **Backend API**: Chạy với `npm run dev` (hot reload)
- ✅ **Frontend**: Chạy với Vite dev server (hot reload)

**Access Points:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Stellio: http://localhost:8080
- Neo4j: http://localhost:7474 (neo4j/test12345)
- Fuseki: http://localhost:3030

### Production Mode (`prod`)

Chạy tất cả với Docker Compose:

- ✅ **Tất cả services trong containers**
- ✅ **Optimized builds**
- ✅ **Production-ready configuration**
- ✅ **Health checks**
- ✅ **Auto-restart**

**Access Points:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Stellio: http://localhost:8080
- Neo4j: http://localhost:7474
- Fuseki: http://localhost:3030

## 🔧 Yêu Cầu Hệ Thống

### Development Mode
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (cho infrastructure)
- PowerShell 5+ (Windows) hoặc Bash (Linux/Mac)

### Production Mode
- Docker & Docker Compose only

## 📦 Cấu Trúc Project

```
UIP-Urban_Intelligence_Platform/
├── justrun.ps1              # PowerShell "just run" script
├── Makefile                 # Make-based "just run" system
├── docker-compose.yml       # Full stack orchestration
├── Dockerfile               # Python orchestrator image
│
├── apps/
│   └── traffic-web-app/
│       ├── backend/
│       │   ├── Dockerfile   # Backend production image
│       │   └── src/         # TypeScript backend code
│       └── frontend/
│           ├── Dockerfile   # Frontend production image
│           ├── nginx.conf   # Nginx configuration
│           └── src/         # React frontend code
│
├── src/                     # Python orchestrator & agents
├── requirements/            # Python dependencies
└── config/                  # Configuration files
```

## 🐳 Docker Compose Services

Khi chạy `justrun.ps1 dev` hoặc `make dev`, các services sau sẽ được khởi động:

| Service | Port | Description |
|---------|------|-------------|
| neo4j | 7474, 7687 | Graph database |
| fuseki | 3030 | Triplestore (RDF) |
| redis | 6379 | Cache & message broker |
| mongodb | 27017 | NGSI-LD entity storage |
| postgres | 5432 | Stellio backend (TimescaleDB) |
| kafka | 9092 | Event streaming |
| stellio-api-gateway | 8080 | NGSI-LD context broker |
| search-service | 8083 | Stellio search service |
| subscription-service | - | Stellio subscription service |
| backend | 3001 | TypeScript API server |
| frontend | 3000/5173 | React web app |

## 🔍 Troubleshooting

### Port đã được sử dụng

```powershell
# Dừng tất cả services
.\justrun.ps1 stop

# Hoặc check port cụ thể
netstat -ano | findstr :3001
```

### Dependencies bị lỗi

```powershell
# Clean và install lại
.\justrun.ps1 clean
.\justrun.ps1 setup
```

### Docker containers không start

```powershell
# Xem logs
docker-compose logs -f

# Restart specific service
docker-compose restart stellio-api-gateway
```

### Health check failed

```powershell
# Check status
docker-compose ps

# Check specific service logs
docker-compose logs stellio-api-gateway
```

## 🎓 Ví Dụ Sử Dụng

### Lần đầu tiên clone project

```powershell
# 1. Clone
git clone <repo-url>
cd UIP-Urban_Intelligence_Platform

# 2. Chạy development (tự động setup)
.\justrun.ps1 dev

# 3. Truy cập frontend
Start http://localhost:5173
```

### Hàng ngày khi develop

```powershell
# Chỉ cần một lệnh
.\justrun.ps1 dev
```

### Deploy production

```powershell
# Build và run tất cả với Docker
.\justrun.ps1 prod

# Xem logs
docker-compose logs -f

# Stop khi cần
.\justrun.ps1 stop
```

### Chạy tests

```powershell
# Run tất cả tests
.\justrun.ps1 test

# Hoặc specific tests
cd apps/traffic-web-app/backend
npm test
```

## 🚨 Lưu Ý Quan Trọng

1. **Lần đầu chạy `dev`** sẽ mất 5-10 phút để Docker pull images
2. **Production mode** yêu cầu Docker có đủ RAM (ít nhất 8GB)
3. **Development mode** sẽ mở 3 PowerShell windows riêng biệt
4. **Ports 3000, 3001, 5173, 7474, 8080, 9092** phải available
5. **Dừng services** bằng `.\justrun.ps1 stop` hoặc đóng PowerShell windows

## 📝 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                 │
│              http://localhost:5173                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Backend API (Express)                  │
│              http://localhost:3001                  │
└─────┬──────────┬──────────┬──────────┬─────────────┘
      │          │          │          │
      ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐
│ Stellio │ │  Neo4j  │ │ MongoDB │ │ Python Agents│
│  :8080  │ │  :7474  │ │ :27017  │ │ (Background) │
└─────────┘ └─────────┘ └─────────┘ └──────────────┘
```

## 🎉 Success Indicators

Khi tất cả services đã ready, bạn sẽ thấy:

✅ Frontend accessible tại http://localhost:5173  
✅ Backend API responding tại http://localhost:3001/health  
✅ Stellio API Gateway healthy tại http://localhost:8080/actuator/health  
✅ Neo4j browser available tại http://localhost:7474  

## 📚 More Information

- [EXECUTION_ORDER.md](./EXECUTION_ORDER.md) - Chi tiết implementation timeline
- [README.md](./README.md) - Project overview
- [Backend README](./apps/traffic-web-app/backend/README.md) - Backend documentation
- [Frontend README](./apps/traffic-web-app/frontend/README.md) - Frontend documentation

---

**🎯 Goal: One command to run everything!**

```powershell
.\justrun.ps1 dev
```

That's it! 🚀
