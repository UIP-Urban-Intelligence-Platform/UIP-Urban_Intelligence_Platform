<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Installation prerequisites documentation.

Module: apps/traffic-web-app/frontend/docs/docs/installation/prerequisites.md
Author: UIP Team
Version: 1.0.0
-->

# Prerequisites

Before installing the UIP - Urban Intelligence Platform, ensure your system meets these requirements.

## 💻 System Requirements

### Minimum Requirements

- **CPU**: 4 cores (2.0 GHz+)
- **RAM**: 8 GB
- **Storage**: 20 GB free space
- **OS**: Windows 10/11, macOS 11+, Ubuntu 20.04+

### Recommended Requirements

- **CPU**: 8 cores (3.0 GHz+)
- **RAM**: 16 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS or latest macOS
- **Network**: 100 Mbps+ internet connection

### Production Requirements

- **CPU**: 16+ cores
- **RAM**: 32 GB+
- **Storage**: 500 GB SSD (or distributed storage)
- **Network**: 1 Gbps+ dedicated connection
- **GPU** (Optional): NVIDIA GPU with CUDA 11.7+ for YOLOX acceleration
  - Recommended: NVIDIA Tesla T4, V100, or A100
  - VRAM: 8GB+ for real-time processing
  - Driver: NVIDIA Driver 515+

### Cloud Deployment Requirements

#### AWS

- **Compute**: EC2 c6i.4xlarge or better
- **GPU**: EC2 g4dn.xlarge (with T4 GPU)
- **Storage**: EBS gp3 (500 GB)
- **Database**: RDS PostgreSQL, DocumentDB (MongoDB-compatible), ElastiCache (Redis)
- **Network**: VPC with NAT Gateway

#### Azure

- **Compute**: Standard_D8s_v5 or better
- **GPU**: Standard_NC6s_v3 (with V100 GPU)
- **Storage**: Premium SSD (500 GB)
- **Database**: Azure Database for PostgreSQL, Cosmos DB, Azure Cache for Redis
- **Network**: Virtual Network with Application Gateway

#### Google Cloud

- **Compute**: n2-standard-8 or better
- **GPU**: n1-standard-4 with 1x T4 GPU
- **Storage**: Persistent SSD (500 GB)
- **Database**: Cloud SQL for PostgreSQL, Firestore, Memorystore for Redis
- **Network**: VPC with Cloud Load Balancing

## 🐳 Docker & Docker Compose

### Option 1: Docker Desktop (Recommended for Windows/macOS)

**Windows:**

1. Download [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
2. Run installer
3. Enable WSL 2 backend (recommended)
4. Restart system

**macOS:**

1. Download [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
2. Run installer
3. Drag Docker.app to Applications
4. Start Docker Desktop

**Verify Installation:**

```bash
docker --version
# Docker version 24.0.0 or higher

docker-compose --version
# Docker Compose version 2.20.0 or higher
```

### Option 2: Docker Engine (Linux)

**Ubuntu/Debian:**

```bash
# Update packages
sudo apt-get update

# Install prerequisites
sudo apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker
```

**Verify:**

```bash
docker --version
docker compose version
```

## 🐍 Python (for Local Development)

### Python 3.9+

**Windows:**

1. Download [Python 3.9+](https://www.python.org/downloads/)
2. Run installer
3. ✅ Check "Add Python to PATH"
4. Click "Install Now"

**macOS:**

```bash
# Using Homebrew
brew install python@3.9

# Verify
python3 --version
```

**Ubuntu/Debian:**

```bash
sudo apt-get update
sudo apt-get install -y python3.9 python3.9-venv python3-pip

# Verify
python3.9 --version
```

### pip & venv

```bash
# Install pip (if not included)
python3 -m ensurepip --upgrade

# Verify
pip3 --version

# Create virtual environment
python3 -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

## 📦 Node.js (for Frontend Development)

### Node.js 18+

**All Platforms:**
Download from [nodejs.org](https://nodejs.org/) (LTS version recommended)

**Using nvm (Recommended):**

**macOS/Linux:**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js 18
nvm install 18
nvm use 18

# Verify
node --version  # v18.x.x
npm --version   # 9.x.x
```

**Windows:**
Use [nvm-windows](https://github.com/coreybutler/nvm-windows)

### npm & Yarn

```bash
# npm is included with Node.js

# Install Yarn (optional)
npm install -g yarn

# Verify
yarn --version
```

## 🗄️ Database Tools (Optional)

### Neo4j Browser

Included in Docker setup, access at `http://localhost:7474`

### MongoDB Compass

Download from [mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)

### DBeaver (Universal Database Tool)

Download from [dbeaver.io](https://dbeaver.io/)

## 🛠️ Development Tools (Optional but Recommended)

### Git

**Windows:** [git-scm.com](https://git-scm.com/)
**macOS:** `brew install git`
**Linux:** `sudo apt-get install git`

### VS Code

Download from [code.visualstudio.com](https://code.visualstudio.com/)

**Recommended Extensions:**

- Python (ms-python.python)
- Docker (ms-azuretools.vscode-docker)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- GitLens (eamodio.gitlens)

### Postman (API Testing)

Download from [postman.com](https://www.postman.com/)

### Insomnia (Alternative to Postman)

Download from [insomnia.rest](https://insomnia.rest/)

## 🔍 Verification Checklist

Run these commands to verify all prerequisites:

```bash
# Docker
docker --version
docker compose version

# Python
python3 --version
pip3 --version

# Node.js
node --version
npm --version

# Git
git --version

# Check Docker is running
docker ps

# Check available disk space (should be 20GB+)
df -h  # macOS/Linux
# Windows: check in File Explorer
```

**Expected Output:**

```text
Docker version 24.0.0+
Docker Compose version 2.20.0+
Python 3.9.0+
pip 23.0.0+
Node.js v18.0.0+
npm 9.0.0+
git 2.40.0+
```

## ⚠️ Common Issues

### Docker Not Starting

**Windows:**

- Ensure Hyper-V or WSL 2 is enabled
- Check BIOS virtualization settings

**macOS:**

- Allow Docker in Security & Privacy settings
- Ensure sufficient disk space

**Linux:**

- Check Docker service: `sudo systemctl status docker`
- Check user permissions: `groups` should include `docker`

### Port Conflicts

If ports are already in use:

```bash
# Check what's using port 8001
# Windows:
netstat -ano | findstr :8001
# macOS/Linux:
lsof -i :8001

# Kill process
# Windows:
taskkill /PID <PID> /F
# macOS/Linux:
kill -9 <PID>
```

### Python Package Installation Fails

```bash
# Upgrade pip
pip install --upgrade pip

# Use virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -e .
```

## 📖 Next Steps

✅ All prerequisites installed? Continue to:

- **[Docker Setup](docker-setup)** - Deploy with Docker Compose
- **[Local Setup](local-setup)** - Development environment

---

Need help? Check the [Troubleshooting Guide](../guides/troubleshooting).
