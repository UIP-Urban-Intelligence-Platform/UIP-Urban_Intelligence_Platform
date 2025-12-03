# 📥 Installation

This guide covers all installation methods for Builder Layer End.

---

## 📋 Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.9+ | Backend agents |
| Node.js | 18+ | Web application |
| Docker | 20+ | Container runtime |
| Docker Compose | 2.0+ | Service orchestration |
| Git | 2.30+ | Version control |

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 20 GB | 50 GB |
| OS | Windows 10 / Ubuntu 20.04 / macOS 11 | Latest stable |

---

## 🚀 Installation Methods

### Method 1: One-Command Setup (Recommended)

```powershell
# Windows PowerShell
git clone https://github.com/NguyenNhatquang522004/builder-layer-end.git
cd builder-layer-end
.\justrun.ps1 dev
```

```bash
# Linux / macOS
git clone https://github.com/NguyenNhatquang522004/builder-layer-end.git
cd builder-layer-end
chmod +x justrun.sh
./justrun.sh dev
```

This single command will:
1. ✅ Check prerequisites (Python, Node.js, Docker)
2. ✅ Create virtual environment
3. ✅ Install all dependencies
4. ✅ Copy `.env.example` to `.env`
5. ✅ Create required directories
6. ✅ Start Docker services
7. ✅ Launch all applications

---

### Method 2: GNU Make (Standard)

```bash
# Clone repository
git clone https://github.com/NguyenNhatquang522004/builder-layer-end.git
cd builder-layer-end

# View available targets
make help

# Setup dependencies
make setup

# Build the package
make

# Install
make install

# Run tests
make check

# Development mode
make dev

# Production mode
make prod
```

#### Available Make Targets

| Target | Description |
|--------|-------------|
| `make` / `make all` | Build the Python package |
| `make install` | Build and install package |
| `make uninstall` | Uninstall package |
| `make check` | Run all tests |
| `make clean` | Remove build artifacts |
| `make distclean` | Remove all generated files |
| `make setup` | Install dependencies |
| `make dev` | Start development mode |
| `make prod` | Start production mode |
| `make stop` | Stop all services |

---

### Method 3: Docker Compose Only

```bash
# Clone repository
git clone https://github.com/NguyenNhatquang522004/builder-layer-end.git
cd builder-layer-end

# Copy environment
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

### Method 4: Manual Installation

#### Step 1: Clone Repository

```bash
git clone https://github.com/NguyenNhatquang522004/builder-layer-end.git
cd builder-layer-end
```

#### Step 2: Python Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements/base.txt
pip install -r requirements/dev.txt
```

#### Step 3: Node.js Dependencies

```bash
# Backend
cd apps/traffic-web-app/backend
npm install

# Frontend
cd ../frontend
npm install
```

#### Step 4: Environment Configuration

```bash
# Copy example files
cp .env.example .env
cp apps/traffic-web-app/backend/.env.example apps/traffic-web-app/backend/.env
cp apps/traffic-web-app/frontend/.env.example apps/traffic-web-app/frontend/.env

# Edit .env with your settings
```

#### Step 5: Start Infrastructure

```bash
docker-compose up -d neo4j fuseki redis mongodb postgres
```

#### Step 6: Start Applications

```bash
# Terminal 1: Python Orchestrator
python main.py

# Terminal 2: Backend API
cd apps/traffic-web-app/backend
npm run dev

# Terminal 3: Frontend
cd apps/traffic-web-app/frontend
npm run dev
```

---

## ✅ Verify Installation

### Check Services Status

```bash
# Docker services
docker-compose ps

# Expected: All services should be "Up" and "healthy"
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend API | http://localhost:5000 | - |
| Citizen API | http://localhost:8001/docs | - |
| Neo4j Browser | http://localhost:7474 | neo4j / test12345 |
| Fuseki SPARQL | http://localhost:3030 | admin / test_admin |
| Stellio | http://localhost:8080 | - |

### Health Check

```bash
# Check all services
.\justrun.ps1 status

# Or manually
curl http://localhost:5000/health
curl http://localhost:8001/health
curl http://localhost:8080/health
```

---

## 🔧 Troubleshooting

### Common Issues

#### Docker Desktop not running

```
Error: Cannot connect to Docker daemon
```

**Solution**: Start Docker Desktop and wait for it to be ready.

#### Port already in use

```
Error: Port 5173 is already in use
```

**Solution**: Stop the conflicting service or change the port in `.env`.

#### Python module not found

```
Error: ModuleNotFoundError: No module named 'xxx'
```

**Solution**: 
```bash
pip install -r requirements/base.txt
```

#### Node.js dependency issues

```
Error: npm ERR! peer dep missing
```

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Next Steps

- [[Quick-Start]] - Get running in 5 minutes
- [[Configuration]] - Configure for your environment
- [[System-Architecture]] - Understand the architecture
