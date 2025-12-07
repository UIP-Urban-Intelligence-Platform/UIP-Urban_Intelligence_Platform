<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: guides/DATA_ACCESS_GUIDE.md
Module: Data Access Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Data access guide for LOD Cloud and storage systems.
============================================================================
-->

# 📊 Data Access Guide - LOD Cloud & Storage Systems

> **Hướng dẫn chi tiết để khai thác 100% data từ LOD Cloud và các hệ thống lưu trữ**
> 
> Document này cung cấp tất cả endpoints, queries, và methods để truy cập đầy đủ data trong project UIP LOD System.

---

## 📋 Mục Lục

1. [Hướng Dẫn Cài Đặt Môi Trường](#0-hướng-dẫn-cài-đặt-môi-trường)
2. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
3. [Từ Điển Dữ Liệu & Ngữ Nghĩa](#2-từ-điển-dữ-liệu--ngữ-nghĩa)
4. [Mối Quan Hệ Giữa Các Hệ Thống](#3-mối-quan-hệ-giữa-các-hệ-thống)
5. [Stellio Context Broker (NGSI-LD)](#4-stellio-context-broker-ngsi-ld)
6. [Apache Jena Fuseki (RDF Triplestore)](#5-apache-jena-fuseki-rdf-triplestore)
7. [Neo4j Graph Database](#6-neo4j-graph-database)
8. [PostgreSQL Database](#7-postgresql-database)
9. [Local File Storage](#8-local-file-storage)
10. [🆕 Analytics Data: Accidents & Patterns](#9-analytics-data-accidents--patterns)
11. [Python Code Examples](#10-python-code-examples)
12. [cURL Examples](#11-curl-examples)
13. [SPARQL Query Examples](#12-sparql-query-examples)
14. [Troubleshooting](#13-troubleshooting)

---

## 0. Hướng Dẫn Cài Đặt Môi Trường

### 🚀 Yêu Cầu Hệ Thống

#### Phần Mềm Cần Thiết

```yaml
Required Software:
  - Docker: version 20.10+ (Docker Desktop for Windows/Mac)
  - Docker Compose: version 2.0+
  - Python: version 3.9+ (for running extraction scripts)
  - Git: version 2.x+ (optional, for cloning repository)

Recommended Hardware:
  - RAM: 8GB minimum, 16GB recommended
  - Disk Space: 10GB free space
  - CPU: 4 cores minimum
```

#### Cài Đặt Docker (Windows)

```powershell
# 1. Download Docker Desktop
# Visit: https://www.docker.com/products/docker-desktop

# 2. Install Docker Desktop
# - Run installer
# - Enable WSL 2 backend
# - Restart computer

# 3. Verify installation
docker --version
# Output: Docker version 24.x.x

docker-compose --version
# Output: Docker Compose version v2.x.x
```

#### Cài Đặt Python & Dependencies

```powershell
# 1. Download Python 3.9+
# Visit: https://www.python.org/downloads/

# 2. Verify Python installation
python --version
# Output: Python 3.9.x or higher

# 3. Install Python packages
pip install requests neo4j asyncpg rdflib pandas

# Or use requirements.txt (provided in project)
pip install -r requirements.txt
```

#### File requirements.txt

```text
# Save as: requirements.txt
# Install with: pip install -r requirements.txt

# HTTP requests
requests==2.31.0

# Database drivers
neo4j==5.14.0
asyncpg==0.29.0  # PostgreSQL async driver (Apache-2.0, MIT-compatible)

# RDF processing
rdflib==7.0.0

# Data processing
pandas==2.1.3

# Optional: For better performance
numpy==1.26.2

# Optional: For data visualization
matplotlib==3.8.2
```

---

### 📦 Khởi Động Hệ Thống

#### 1. File docker-compose.test.yml

**⚠️ QUAN TRỌNG:** File này là **trái tim** của hệ thống, khởi động tất cả 6 services.

```yaml
# Save as: docker-compose.test.yml
# Location: D:\olp\UIP-Urban_Intelligence_Platform\docker-compose.test.yml

version: '3.8'

services:
  # 1. Stellio Context Broker (NGSI-LD)
  stellio-api-gateway:
    image: stellio/stellio-api-gateway:latest
    container_name: test-stellio-api-gateway
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=docker
      - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/stellio_search
      - SPRING_R2DBC_USERNAME=stellio_user
      - SPRING_R2DBC_PASSWORD=stellio_test
      - SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
      - SPRING_DATA_REDIS_HOST=redis
    depends_on:
      - postgres
      - kafka
      - redis
    networks:
      - lod-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/ngsi-ld/v1/entities?limit=1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # 2. PostgreSQL (Stellio Backend)
  postgres:
    image: postgres:14-alpine
    container_name: test-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=stellio_user
      - POSTGRES_PASSWORD=stellio_test
      - POSTGRES_DB=stellio_search
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - lod-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stellio_user -d stellio_search"]
      interval: 10s
      timeout: 5s
      retries: 5

  # 3. Apache Jena Fuseki (RDF Triplestore)
  fuseki:
    image: stain/jena-fuseki:latest
    container_name: test-fuseki
    ports:
      - "3030:3030"
    environment:
      - ADMIN_PASSWORD=test_admin
      - JVM_ARGS=-Xmx2g
    volumes:
      - fuseki-data:/fuseki
    networks:
      - lod-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3030/$/ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    command: /jena-fuseki/fuseki-server --loc=/fuseki/databases/lod-dataset /lod-dataset

  # 4. Neo4j (Graph Database)
  neo4j:
    image: neo4j:5.13-community
    container_name: test-neo4j
    ports:
      - "7474:7474"  # HTTP
      - "7687:7687"  # Bolt
    environment:
      - NEO4J_AUTH=neo4j/test12345
      - NEO4J_dbms_memory_heap_max__size=2G
      - NEO4J_dbms_memory_pagecache_size=1G
    volumes:
      - neo4j-data:/data
      - neo4j-logs:/logs
    networks:
      - lod-network
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "neo4j", "-p", "test12345", "RETURN 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 5. Redis (Stellio Cache)
  redis:
    image: redis:7-alpine
    container_name: test-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - lod-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # 6. Kafka (Stellio Message Bus)
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: test-kafka
    ports:
      - "9092:9092"
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
    depends_on:
      - zookeeper
    networks:
      - lod-network

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: test-zookeeper
    ports:
      - "2181:2181"
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181
      - ZOOKEEPER_TICK_TIME=2000
    volumes:
      - zookeeper-data:/var/lib/zookeeper/data
    networks:
      - lod-network

networks:
  lod-network:
    driver: bridge

volumes:
  postgres-data:
  fuseki-data:
  neo4j-data:
  neo4j-logs:
  redis-data:
  zookeeper-data:
```

#### 2. Khởi Chạy Hệ Thống

```powershell
# Navigate to project directory
cd D:\olp\UIP-Urban_Intelligence_Platform

# Start all services
docker-compose -f docker-compose.test.yml up -d

# Output:
# Creating network "uip-platform_lod-network" with driver "bridge"
# Creating test-zookeeper ... done
# Creating test-postgres  ... done
# Creating test-redis     ... done
# Creating test-kafka     ... done
# Creating test-fuseki    ... done
# Creating test-neo4j     ... done
# Creating test-stellio-api-gateway ... done

# Wait 30-60 seconds for all services to initialize

# Verify all services are running
docker ps

# Expected output:
# CONTAINER ID   IMAGE                           STATUS
# abc123...      stellio/stellio-api-gateway    Up (healthy)
# def456...      postgres:14-alpine             Up (healthy)
# ghi789...      stain/jena-fuseki              Up (healthy)
# jkl012...      neo4j:5.13-community           Up (healthy)
# mno345...      redis:7-alpine                 Up (healthy)
# pqr678...      confluentinc/cp-kafka          Up
```

#### 3. Verify Services

```powershell
# Test Stellio
curl http://localhost:8080/ngsi-ld/v1/entities?limit=1
# Should return: [] or list of entities

# Test Fuseki
curl http://localhost:3030/$/ping
# Should return: JSON with "version" field

# Test Neo4j (open browser)
# Visit: http://localhost:7474/browser
# Login: neo4j / test12345

# Test PostgreSQL
docker exec -it test-postgres psql -U stellio_user -d stellio_search -c "SELECT 1;"
# Should return: 1
```

#### 4. Stop Services

```powershell
# Stop all services (preserve data)
docker-compose -f docker-compose.test.yml stop

# Stop and remove containers (preserve data)
docker-compose -f docker-compose.test.yml down

# Stop and remove containers + volumes (DELETE ALL DATA)
docker-compose -f docker-compose.test.yml down -v
```

---

### 🔐 Bảo Mật & Credentials

#### ⚠️ CẢNH BÁO QUAN TRỌNG

```
╔═══════════════════════════════════════════════════════════╗
║  🚨 SECURITY WARNING - PRODUCTION DEPLOYMENT 🚨          ║
╠═══════════════════════════════════════════════════════════╣
║                                                             ║
║  Credentials trong document này CHỈ dùng cho:             ║
║    ✅ Development trên localhost                          ║
║    ✅ Testing và học tập                                  ║
║                                                             ║
║  TUYỆT ĐỐI KHÔNG sử dụng cho:                            ║
║    ❌ Production environments                             ║
║    ❌ Servers có thể truy cập từ internet                ║
║    ❌ Shared development servers                          ║
║                                                             ║
║  Cho production, BẮT BUỘC thay đổi:                       ║
║    🔒 Tất cả passwords                                    ║
║    🔒 Database credentials                                 ║
║    🔒 API keys                                            ║
║    🔒 Enable authentication/authorization                  ║
║                                                             ║
╚═══════════════════════════════════════════════════════════╝
```

#### Default Credentials (Development Only)

| Service | Username | Password | Port | Purpose |
|---------|----------|----------|------|---------|
| **Stellio** | - | - | 8080 | No auth (dev mode) |
| **Fuseki** | admin | test_admin | 3030 | SPARQL endpoint |
| **Neo4j** | neo4j | test12345 | 7474/7687 | Graph database |
| **PostgreSQL** | stellio_user | stellio_test | 5432 | Stellio backend |
| **Redis** | - | - | 6379 | No auth (dev mode) |
| **Kafka** | - | - | 9092 | No auth (dev mode) |

#### Thay Đổi Credentials cho Production

```powershell
# 1. Create .env file
# Save as: .env (in project root)

# Stellio
STELLIO_DB_USER=your_secure_user
STELLIO_DB_PASSWORD=your_secure_password_here

# Fuseki
FUSEKI_ADMIN_USER=your_fuseki_admin
FUSEKI_ADMIN_PASSWORD=your_strong_fuseki_password

# Neo4j
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_very_strong_neo4j_password

# PostgreSQL
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_secure_postgres_password
POSTGRES_DB=stellio_production

# Redis (enable authentication)
REDIS_PASSWORD=your_redis_password
```

```yaml
# 2. Update docker-compose.yml to use environment variables
environment:
  - POSTGRES_USER=${POSTGRES_USER}
  - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
  - NEO4J_AUTH=neo4j/${NEO4J_PASSWORD}
  - ADMIN_PASSWORD=${FUSEKI_ADMIN_PASSWORD}
```

```powershell
# 3. Start with environment file
docker-compose -f docker-compose.test.yml --env-file .env up -d
```

#### 🔐 Hướng Dẫn Thay Đổi Credentials (Step-by-Step)

**⚠️ QUAN TRỌNG:** Luôn thay đổi credentials trước khi deploy production!

**STEP 1: Tạo Strong Passwords**

```powershell
# PowerShell - Generate random secure passwords
function New-RandomPassword {
    param([int]$Length = 20)
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    -join ($chars.ToCharArray() | Get-Random -Count $Length)
}

# Generate passwords
$postgresPassword = New-RandomPassword -Length 20
$neo4jPassword = New-RandomPassword -Length 20
$fusekiPassword = New-RandomPassword -Length 20

Write-Host "PostgreSQL Password: $postgresPassword"
Write-Host "Neo4j Password: $neo4jPassword"
Write-Host "Fuseki Password: $fusekiPassword"

# Output example:
# PostgreSQL Password: k8Hn2@vTx9#qLmW4pR7s
# Neo4j Password: 3J$hG6nY@dF8wK2pL5tQ
# Fuseki Password: 7M!vB4xC@zR9fN3kT6yH
```

**STEP 2: Tạo .env File**

```powershell
# Create .env file in project root
@"
# Production Credentials - NEVER COMMIT TO GIT!
# Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# PostgreSQL
POSTGRES_USER=stellio_prod_user
POSTGRES_PASSWORD=$postgresPassword
POSTGRES_DB=stellio_production

# Neo4j
NEO4J_USER=neo4j
NEO4J_PASSWORD=$neo4jPassword

# Fuseki
FUSEKI_ADMIN_USER=admin_prod
FUSEKI_ADMIN_PASSWORD=$fusekiPassword

# Redis
REDIS_PASSWORD=your_redis_password_here
REDIS_REQUIREPASS=yes

# Stellio
STELLIO_SEARCH_DB_USER=stellio_prod_user
STELLIO_SEARCH_DB_PASSWORD=$postgresPassword
"@ | Out-File -FilePath .env -Encoding utf8

Write-Host "✅ .env file created!"
```

**STEP 3: Update docker-compose.yml với Environment Variables**

```yaml
# docker-compose.production.yml (tạo file mới cho production)
version: '3.8'

services:
  stellio-api-gateway:
    image: stellio/stellio-api-gateway:latest
    environment:
      - SPRING_PROFILES_ACTIVE=production
      - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/${POSTGRES_DB}
      - SPRING_R2DBC_USERNAME=${POSTGRES_USER}
      - SPRING_R2DBC_PASSWORD=${POSTGRES_PASSWORD}
      - APPLICATION_AUTHENTICATION_ENABLED=true
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - lod-network

  postgres:
    image: postgis/postgis:16-3.4-alpine
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    # ⚠️ REMOVE ports section for production (don't expose to host)
    # ports:
    #   - "5432:5432"  # ← Comment out this line
    networks:
      - lod-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  fuseki:
    image: stain/jena-fuseki:latest
    environment:
      - ADMIN_PASSWORD=${FUSEKI_ADMIN_PASSWORD}
      - JVM_ARGS=-Xmx2g
    volumes:
      - fuseki_data_prod:/fuseki
    # ⚠️ REMOVE ports for production
    # ports:
    #   - "3030:3030"
    networks:
      - lod-network
    command: --update --loc /fuseki/databases/lod-dataset /lod-dataset

  neo4j:
    image: neo4j:5.13-community
    environment:
      - NEO4J_AUTH=${NEO4J_USER}/${NEO4J_PASSWORD}
      - NEO4J_server_memory_heap_max__size=2G
      - NEO4J_server_memory_pagecache_size=1G
      - NEO4J_dbms_security_procedures_unrestricted=apoc.*
      # Production settings
      - NEO4J_dbms_connector_bolt_enabled=true
      - NEO4J_dbms_connector_http_enabled=false  # Disable HTTP
    volumes:
      - neo4j_data_prod:/data
      - neo4j_logs_prod:/logs
    # ⚠️ REMOVE ports for production
    # ports:
    #   - "7474:7474"
    #   - "7687:7687"
    networks:
      - lod-network
    healthcheck:
      test: ["CMD", "cypher-shell", "-u", "${NEO4J_USER}", "-p", "${NEO4J_PASSWORD}", "RETURN 1"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data_prod:/data
    # ⚠️ REMOVE ports for production
    # ports:
    #   - "6379:6379"
    networks:
      - lod-network

volumes:
  postgres_data_prod:
  fuseki_data_prod:
  neo4j_data_prod:
  neo4j_logs_prod:
  redis_data_prod:

networks:
  lod-network:
    driver: bridge
```

**STEP 4: Start Production Services**

```powershell
# Load .env file and start services
docker-compose -f docker-compose.production.yml --env-file .env up -d

# Verify environment variables are loaded
docker-compose -f docker-compose.production.yml config

# Check services started correctly
docker-compose -f docker-compose.production.yml ps
```

**STEP 5: Verify Credentials Work**

```powershell
# Test PostgreSQL connection
docker exec test-postgres psql -U $env:POSTGRES_USER -d $env:POSTGRES_DB -c "SELECT 1;"

# Test Neo4j connection
docker exec test-neo4j cypher-shell -u $env:NEO4J_USER -p $env:NEO4J_PASSWORD "RETURN 1;"

# Test Fuseki authentication
$fusekiAuth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${env:FUSEKI_ADMIN_USER}:${env:FUSEKI_ADMIN_PASSWORD}"))
Invoke-RestMethod -Uri "http://localhost:3030/$/server" -Headers @{Authorization="Basic $fusekiAuth"}

# All commands should succeed ✅
```

**STEP 6: Secure .env File**

```powershell
# Add .env to .gitignore
Add-Content -Path .gitignore -Value "`n# Environment variables`n.env`n.env.*`n"

# Verify .env is ignored
git status | Select-String ".env"
# Should NOT appear in untracked files

# Store .env backup securely (encrypted)
# Option 1: Use password manager (1Password, LastPass, KeePass)
# Option 2: Encrypt with GPG
gpg --symmetric --cipher-algo AES256 .env
# Creates .env.gpg (encrypted backup)

# Option 3: Azure Key Vault / AWS Secrets Manager (production)
```

**STEP 7: Production Deployment Checklist**

```markdown
✅ Pre-Deployment Checklist:

[ ] Generate strong passwords (min 20 characters)
[ ] Create .env file with production credentials
[ ] Update docker-compose.production.yml with ${ENV_VARS}
[ ] Remove or comment out all ports: sections (except Stellio if needed)
[ ] Test services start with docker-compose --env-file .env up
[ ] Verify credentials work (psql, cypher-shell, curl)
[ ] Add .env to .gitignore
[ ] Backup .env securely (password manager or encrypted)
[ ] Configure firewall rules (block external access)
[ ] Enable SSL/TLS for Stellio API
[ ] Set up monitoring and alerting
[ ] Document emergency credential reset procedure
```

#### Security Best Practices

**1. Firewall Rules**
```powershell
# Windows Firewall - Block external access to database ports
New-NetFirewallRule -DisplayName "Block PostgreSQL External" `
    -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Block

New-NetFirewallRule -DisplayName "Block Neo4j External" `
    -Direction Inbound -LocalPort 7474,7687 -Protocol TCP -Action Block

New-NetFirewallRule -DisplayName "Block Fuseki External" `
    -Direction Inbound -LocalPort 3030 -Protocol TCP -Action Block

# Allow only localhost
New-NetFirewallRule -DisplayName "Allow Stellio Localhost" `
    -Direction Inbound -LocalPort 8080 -Protocol TCP `
    -RemoteAddress 127.0.0.1 -Action Allow
```

**2. Network Isolation**
```yaml
# Use Docker internal network only
# Database services don't need exposed ports
services:
  postgres:
    # ports:  # ← REMOVE this entire section
    #   - "5432:5432"
    networks:
      - lod-network  # Only accessible within Docker network

  # Application connects internally
  stellio-api-gateway:
    environment:
      - SPRING_R2DBC_URL=r2dbc:postgresql://postgres:5432/db
      # ↑ Uses Docker DNS name 'postgres', not localhost:5432
```

**3. SSL/TLS**
```yaml
# Enable HTTPS for Stellio API
stellio-api-gateway:
  environment:
    - SERVER_SSL_ENABLED=true
    - SERVER_SSL_KEY-STORE=/certs/keystore.p12
    - SERVER_SSL_KEY-STORE-PASSWORD=${SSL_PASSWORD}
  volumes:
    - ./certs:/certs:ro

# Enable SSL for PostgreSQL
postgres:
  environment:
    - POSTGRES_SSL_MODE=require
  volumes:
    - ./certs/server.crt:/var/lib/postgresql/server.crt
    - ./certs/server.key:/var/lib/postgresql/server.key

# Enable TLS for Neo4j Bolt
neo4j:
  environment:
    - NEO4J_dbms_connector_bolt_tls_level=REQUIRED
```

**4. Backup Credentials**
```powershell
# Option 1: Password Manager (Recommended)
# Store in 1Password, LastPass, or KeePass
# Tag as "LOD Production Credentials"

# Option 2: Encrypted File
# Encrypt .env with GPG
gpg --symmetric --cipher-algo AES256 .env
# Backup .env.gpg to secure location
Copy-Item .env.gpg -Destination "\\secure-backup-server\credentials\"

# Option 3: Cloud Secrets Manager
# AWS Secrets Manager
aws secretsmanager create-secret --name "lod-prod-postgres" --secret-string "$postgresPassword"

# Azure Key Vault
az keyvault secret set --vault-name "lod-vault" --name "postgres-password" --value "$postgresPassword"
```

**5. Credential Rotation**
```powershell
# Rotate passwords every 90 days
# 1. Generate new password
$newPassword = New-RandomPassword -Length 20

# 2. Update database
docker exec test-postgres psql -U postgres -c "ALTER USER stellio_user PASSWORD '$newPassword';"

# 3. Update .env
(Get-Content .env) -replace 'POSTGRES_PASSWORD=.*', "POSTGRES_PASSWORD=$newPassword" | Set-Content .env

# 4. Restart services
docker-compose -f docker-compose.production.yml --env-file .env restart

# 5. Verify connection
docker exec test-postgres psql -U stellio_user -d stellio_production -c "SELECT 1;"
```

---

### 📊 Health Check & Monitoring

```powershell
# Check all services status
docker-compose -f docker-compose.test.yml ps

# View logs for specific service
docker logs test-stellio-api-gateway
docker logs test-fuseki
docker logs test-neo4j
docker logs test-postgres

# Follow logs in real-time
docker logs -f test-stellio-api-gateway

# Check resource usage
docker stats

# Expected output:
# CONTAINER                    CPU %   MEM USAGE / LIMIT
# test-stellio-api-gateway    5%      800MB / 2GB
# test-fuseki                 3%      1.2GB / 2GB
# test-neo4j                  4%      1.5GB / 2GB
# test-postgres               2%      200MB / 1GB
```

---

### 🔧 Troubleshooting Setup

#### Problem: Docker not starting

```powershell
# Solution 1: Restart Docker Desktop
# - Right-click Docker Desktop tray icon
# - Select "Restart Docker Desktop"

# Solution 2: Check WSL 2 (Windows)
wsl --status
# If error, update WSL:
wsl --update

# Solution 3: Check Docker service
docker info
# Should show server info without errors
```

#### Problem: Port already in use

```powershell
# Check what's using port 8080
netstat -ano | findstr :8080

# Kill process using port (replace PID)
taskkill /PID <process_id> /F

# Or change port in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 instead
```

#### Problem: Services not healthy

```powershell
# Check service logs
docker logs test-stellio-api-gateway

# Common issues:
# - Kafka not ready: Wait 60 seconds for Kafka initialization
# - PostgreSQL connection: Check credentials match
# - Out of memory: Increase Docker memory limit (Settings > Resources)
```

#### Problem: Cannot connect to services

```powershell
# Verify network connectivity
docker network inspect uip-platform_lod-network

# Test from inside container
docker exec -it test-stellio-api-gateway curl http://postgres:5432
```

---

---

## 1. Tổng Quan Hệ Thống

### 📊 Kiến Trúc Data Storage

```
┌─────────────────────────────────────────────────────────────┐
│                    LOD CLOUD ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   STELLIO    │  │    FUSEKI    │  │    NEO4J     │      │
│  │  (NGSI-LD)   │  │     (RDF)    │  │   (Graph)    │      │
│  │              │  │              │  │              │      │
│  │ 200 entities │  │ 22,733       │  │ 202 nodes    │      │
│  │              │  │ triples      │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ▲                 ▲                 ▲               │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                  │
│                  ┌────────▼────────┐                        │
│                  │   PostgreSQL    │                        │
│                  │  (via Stellio)  │                        │
│                  └─────────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 📈 Data Statistics

| Storage System | Type | Count | Port |
|---------------|------|-------|------|
| **Stellio** | NGSI-LD Entities | 200 | 8080 |
| **Fuseki** | RDF Triples | 22,733 | 3030 |
| **Neo4j** | Graph Nodes | 202 | 7474/7687 |
| **PostgreSQL** | Relational Records | 202+ | 5432 |
| **Local Files** | RDF Files (.ttl) | 48 | - |

### 🏷️ Entity Types

- **Camera**: 40 entities (traffic cameras với location data)
- **WeatherObserved**: 80 entities (weather data cho mỗi camera)
- **AirQualityObserved**: 80 entities (air quality data)
- **Platform**: 1 entity (IoT platform metadata)
- **ObservableProperty**: 1 entity (sensor property definitions)

---

## 2. Từ Điển Dữ Liệu & Ngữ Nghĩa

### 📖 Giải Thích Entity Types

#### 1. Camera (40 entities)

**Ý nghĩa:** Các camera giám sát giao thông được triển khai tại các nút giao thông quan trọng ở Thành phố Hồ Chí Minh.

**Mục đích:** 
- Thu thập hình ảnh/video về tình hình giao thông real-time
- Phát hiện tắc đường, tai nạn, vi phạm
- Cung cấp dữ liệu cho phân tích thống kê giao thông

**Thuộc tính quan trọng:**

| Attribute | Type | Description | Example | Unit |
|-----------|------|-------------|---------|------|
| `id` | String | URN định danh duy nhất | `urn:ngsi-ld:Camera:0` | - |
| `cameraName` | String | Tên/địa điểm camera | `"Nguyễn Văn Linh - Nguyễn Hữu Thọ"` | - |
| `cameraType` | String | Loại camera | `"PTZ"`, `"Static"`, `"Dome"` | - |
| `location` | GeoProperty | Tọa độ GPS | `{"type": "Point", "coordinates": [106.70752, 10.73291]}` | WGS84 |
| `streamUrl` | String | URL stream video | `"rtsp://camera-server/stream1"` | - |
| `status` | String | Trạng thái hoạt động | `"online"`, `"offline"`, `"maintenance"` | - |
| `resolution` | String | Độ phân giải video | `"1920x1080"`, `"1280x720"` | pixels |
| `installedAt` | DateTime | Ngày lắp đặt | `"2025-11-20T00:00:00Z"` | ISO 8601 |
| `dateModified` | DateTime | Lần cập nhật cuối | `"2025-11-10T12:30:00Z"` | ISO 8601 |

**Camera Types:**
- **PTZ (Pan-Tilt-Zoom)**: Camera có thể xoay, nghiêng, zoom - dùng cho giám sát diện rộng
- **Static**: Camera cố định - dùng cho giám sát một khu vực cụ thể
- **Dome**: Camera dạng bán cầu - chống phá hoại, thường dùng trong nhà

---

#### 2. WeatherObserved (80 entities)

**Ý nghĩa:** Dữ liệu thời tiết được quan sát tại vị trí của mỗi camera giao thông. **Lưu ý:** 80 entities = 40 cameras × 2 (mỗi camera có 2 observation points hoặc historical records).

**Mục đích:**
- Phân tích ảnh hưởng của thời tiết đến giao thông
- Dự đoán tình trạng đường (ướt, trơn trượt)
- Cảnh báo điều kiện thời tiết nguy hiểm

**Thuộc tính quan trọng:**

| Attribute | Type | Description | Example | Unit |
|-----------|------|-------------|---------|------|
| `id` | String | URN định danh | `urn:ngsi-ld:WeatherObserved:0` | - |
| `refDevice` | Relationship | Liên kết đến Camera | `"urn:ngsi-ld:Camera:0"` | - |
| `location` | GeoProperty | Tọa độ (giống Camera) | `{"type": "Point", "coordinates": [...]}` | WGS84 |
| `temperature` | Number | Nhiệt độ không khí | `28.5`, `32.1` | °C (Celsius) |
| `relativeHumidity` | Number | Độ ẩm tương đối | `75`, `82` | % (percent) |
| `atmosphericPressure` | Number | Áp suất khí quyển | `1013.25` | hPa (hectopascal) |
| `windSpeed` | Number | Tốc độ gió | `5.2`, `12.8` | m/s (meters/second) |
| `windDirection` | Number | Hướng gió | `180`, `270` | degrees (0=North) |
| `precipitation` | Number | Lượng mưa | `0`, `5.3`, `25.8` | mm/hour |
| `weatherType` | String | Tình trạng thời tiết | `"clear"`, `"cloudy"`, `"rain"`, `"storm"` | - |
| `visibility` | Number | Tầm nhìn xa | `10000`, `5000`, `1000` | meters |
| `dateObserved` | DateTime | Thời điểm quan sát | `"2025-11-10T12:00:00Z"` | ISO 8601 |

**Weather Types:**
- `clear`: Trời quang đãng
- `cloudy`: Nhiều mây
- `rain`: Mưa
- `storm`: Bão/giông
- `fog`: Sương mù

**Impact on Traffic:**
- Temperature > 35°C: Nguy cơ nắng nóng, ảnh hưởng tài xế
- Humidity > 90%: Khả năng mưa cao
- Precipitation > 10mm/h: Mưa to, giảm tốc độ di chuyển
- Visibility < 1000m: Sương mù, nguy hiểm cao

---

#### 3. AirQualityObserved (80 entities)

**Ý nghĩa:** Dữ liệu chất lượng không khí tại vị trí camera. **Lưu ý:** 80 entities = 40 cameras × 2 (mỗi camera có 2 observation points).

**Mục đích:**
- Giám sát ô nhiễm không khí do giao thông
- Cảnh báo AQI (Air Quality Index) nguy hại sức khỏe
- Phân tích mối quan hệ giữa mật độ giao thông và chất lượng không khí

**Thuộc tính quan trọng:**

| Attribute | Type | Description | Example | Unit | Health Impact |
|-----------|------|-------------|---------|------|---------------|
| `id` | String | URN định danh | `urn:ngsi-ld:AirQualityObserved:0` | - | - |
| `refDevice` | Relationship | Liên kết đến Camera | `"urn:ngsi-ld:Camera:0"` | - | - |
| `location` | GeoProperty | Tọa độ | `{"type": "Point", ...}` | WGS84 | - |
| `airQualityIndex` | Number | **AQI tổng hợp** | `45`, `105`, `178` | AQI | See table |
| `pm25` | Number | **Bụi mịn PM2.5** | `12.3`, `55.8`, `150.2` | μg/m³ | Critical |
| `pm10` | Number | Bụi thô PM10 | `25.6`, `89.3` | μg/m³ | Important |
| `no2` | Number | Nitrogen dioxide | `40.2`, `120.5` | μg/m³ | Moderate |
| `o3` | Number | Ozone | `60.8`, `140.2` | μg/m³ | Important |
| `co` | Number | Carbon monoxide | `0.8`, `2.5` | mg/m³ | Low priority |
| `so2` | Number | Sulfur dioxide | `15.3`, `50.2` | μg/m³ | Moderate |
| `dateObserved` | DateTime | Thời điểm đo | `"2025-11-10T12:00:00Z"` | ISO 8601 | - |

**AQI (Air Quality Index) Scale:**

| AQI Range | Level | Color | Health Implications | Recommendation |
|-----------|-------|-------|---------------------|----------------|
| 0-50 | Good (Tốt) | 🟢 Green | Không ảnh hưởng sức khỏe | Hoạt động bình thường |
| 51-100 | Moderate (Trung bình) | 🟡 Yellow | Nhạy cảm với người bệnh | Người bệnh nên hạn chế ngoài trời |
| 101-150 | Unhealthy for Sensitive Groups | 🟠 Orange | Ảnh hưởng người nhạy cảm | Người già, trẻ em hạn chế |
| 151-200 | Unhealthy (Xấu) | 🔴 Red | Ảnh hưởng mọi người | Hạn chế hoạt động ngoài trời |
| 201-300 | Very Unhealthy (Rất xấu) | 🟣 Purple | Ảnh hưởng nghiêm trọng | Không ra ngoài trừ cần thiết |
| 301+ | Hazardous (Nguy hại) | 🟤 Maroon | Khẩn cấp sức khỏe | Ở trong nhà, đeo khẩu trang |

**PM2.5 (Particulate Matter 2.5) - Critical Pollutant:**
- Bụi mịn có đường kính < 2.5 micrometers
- Nguy hiểm nhất vì xâm nhập sâu vào phổi và máu
- Nguồn gốc: Khói xe, nhà máy, đốt rác
- WHO Guideline: < 15 μg/m³ (annual average)
- Vietnam Standard: < 25 μg/m³ (24-hour average)

---

#### 4. Platform (1 entity)

**Ý nghĩa:** Metadata về hệ thống IoT platform quản lý tất cả cameras và sensors.

**Thuộc tính:**

| Attribute | Description | Example |
|-----------|-------------|---------|
| `id` | URN platform | `"urn:ngsi-ld:Platform:IoTTrafficSystem"` |
| `name` | Tên platform | `"Traffic IoT Platform"` |
| `description` | Mô tả | `"Smart city traffic monitoring system"` |
| `location` | Địa điểm triển khai | `"Ho Chi Minh City, Vietnam"` |
| `provider` | Đơn vị cung cấp | `"HCMC Transportation Department"` |
| `version` | Phiên bản hệ thống | `"2.1.0"` |

---

#### 5. ObservableProperty (1 entity)

**Ý nghĩa:** Định nghĩa các loại đại lượng có thể quan sát được (temperature, humidity, PM2.5...).

**Thuộc tính:**

| Attribute | Description | Example |
|-----------|-------------|---------|
| `id` | URN property | `"urn:ngsi-ld:ObservableProperty:temperature"` |
| `name` | Tên property | `"Air Temperature"` |
| `description` | Mô tả | `"Ambient air temperature in Celsius"` |
| `unitCode` | Đơn vị đo | `"CEL"` (Celsius), `"P1"` (percent) |
| `observationType` | Loại observation | `"continuous"`, `"discrete"` |

---

### 🔤 Ontology & Semantic Web Standards

Hệ thống sử dụng các **ontology chuẩn quốc tế** để mô tả dữ liệu, đảm bảo khả năng tương tác (interoperability) với các hệ thống khác.

#### Các Namespace (Prefix) Được Sử Dụng

```turtle
# RDF & RDFS - Core semantic web
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .

# SOSA/SSN - Sensor, Observation, Sample, Actuator
@prefix sosa: <http://www.w3.org/ns/sosa/> .
@prefix ssn: <http://www.w3.org/ns/ssn/> .

# Schema.org - General purpose vocabulary
@prefix schema: <http://schema.org/> .

# WGS84 Geo - Geographic coordinates
@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#> .

# Dublin Core - Metadata
@prefix dcterms: <http://purl.org/dc/terms/> .

# NGSI-LD - ETSI standard for context information
@prefix ngsi-ld: <https://uri.etsi.org/ngsi-ld/> .
```

#### SOSA Ontology (Sensor, Observation, Sample, Actuator)

**W3C Standard:** https://www.w3.org/TR/vocab-ssn/

**Core Concepts:**
```turtle
# Sensor: Thiết bị quan sát (Camera)
?camera a sosa:Sensor ;
        sosa:observes ?property ;
        sosa:isHostedBy ?platform .

# Observation: Phép đo cụ thể
?obs a sosa:Observation ;
     sosa:madeBySensor ?camera ;
     sosa:observedProperty sosa:Temperature ;
     sosa:hasResult ?result ;
     sosa:resultTime "2025-11-10T12:00:00Z"^^xsd:dateTime .

# Result: Kết quả đo
?result a sosa:Result ;
        schema:value "28.5"^^xsd:decimal ;
        schema:unitCode "CEL" .
```

**Tại sao dùng SOSA?**
- ✅ Chuẩn W3C được công nhận toàn cầu
- ✅ Tích hợp với hệ thống IoT khác
- ✅ Hỗ trợ reasoning và inference
- ✅ Mô tả đầy đủ sensor networks

#### Schema.org Vocabulary

**Website:** https://schema.org/

**Core Properties:**
```turtle
# General properties
schema:name "Camera Name"
schema:description "Camera description"
schema:location { "type": "Point", "coordinates": [...] }

# Sensor properties
schema:temperature "28.5"^^xsd:decimal
schema:humidity "75"^^xsd:integer

# Time properties
schema:dateObserved "2025-11-10T12:00:00Z"^^xsd:dateTime
schema:dateModified "2025-11-10T12:30:00Z"^^xsd:dateTime
```

**Tại sao dùng Schema.org?**
- ✅ Vocabulary phổ biến nhất thế giới
- ✅ Google, Microsoft, Yahoo công nhận
- ✅ SEO-friendly (search engines hiểu)
- ✅ Human-readable và machine-readable

#### WGS84 Geo Vocabulary

**Namespace:** http://www.w3.org/2003/01/geo/wgs84_pos#

**Geo Properties:**
```turtle
# Latitude & Longitude (WGS84 coordinate system)
geo:lat "10.73291"^^xsd:decimal
geo:long "106.70752"^^xsd:decimal

# Optional: Altitude
geo:alt "5.2"^^xsd:decimal  # meters above sea level
```

**WGS84 = World Geodetic System 1984**
- Hệ tọa độ GPS tiêu chuẩn toàn cầu
- Latitude: -90° (South Pole) đến +90° (North Pole)
- Longitude: -180° (West) đến +180° (East)

---

### 📊 Bảng Tóm Tắt: Entity Type và Số Lượng

| Entity Type | Count | Source | Why This Number? |
|-------------|-------|--------|------------------|
| **Camera** | 40 | Original dataset | 40 traffic cameras triển khai thực tế |
| **WeatherObserved** | 80 | Enrichment | 40 cameras × 2 observations (current + forecast) |
| **AirQualityObserved** | 80 | Enrichment | 40 cameras × 2 observations (current + historical) |
| **Platform** | 1 | System metadata | 1 IoT platform quản lý toàn bộ system |
| **ObservableProperty** | 1 | Ontology | 1 definition cho observable properties |
| **TOTAL Stellio** | **200** | Sum | 40 + 80 + 80 = 200 entities |
| **TOTAL Neo4j** | **202** | Sum + metadata | 200 entities + 2 metadata nodes |
| **PostgreSQL** | **202+** | Backend | Same as Neo4j + audit logs |

**Tại sao Neo4j có 202 nodes (nhiều hơn Stellio 2 nodes)?**
- 200 nodes từ Stellio entities (Camera, Weather, AirQuality)
- +1 Platform node (metadata)
- +1 ObservableProperty node (ontology definition)
- **Total = 202 nodes**

---

## 3. Mối Quan Hệ Giữa Các Hệ Thống

### 🔄 Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                  COMPLETE DATA FLOW DIAGRAM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📡 EXTERNAL APIS                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Traffic API │  │ Weather API │  │  AQ API     │                │
│  │ (HCMC DOT)  │  │(OpenWeather)│  │  (IQAir)    │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                 │                 │                        │
│         └─────────────────┴─────────────────┘                        │
│                           │                                          │
│                           ▼ HTTP GET (Python Pipeline)               │
│  ════════════════════════════════════════════════════════            │
│  📂 STAGE 1: LOCAL FILES (Data Collection)                          │
│  ════════════════════════════════════════════════════════            │
│         ┌─────────────────────────────┐                             │
│         │  data/cameras_updated.json  │ ← 40 cameras + basic info  │
│         └─────────────┬───────────────┘                             │
│                       ▼ Enrich with Weather + AQ APIs               │
│         ┌─────────────────────────────┐                             │
│         │  data/cameras_enriched.json │ ← 40 cameras + weather + AQ│
│         └─────────────┬───────────────┘                             │
│                       ▼ Transform to NGSI-LD format                 │
│         ┌─────────────────────────────┐                             │
│         │ data/ngsi_ld_entities.json  │ ← 120 NGSI-LD entities     │
│         │                             │   (40 Cam + 40 Wx + 40 AQ)  │
│         └─────────────┬───────────────┘                             │
│                       ▼ Transform to RDF Turtle                     │
│         ┌─────────────────────────────┐                             │
│         │   data/rdf/Camera_*.ttl     │ ← 48 RDF files              │
│         │   data/rdf/ObsProp_*.ttl    │   (timestamped snapshots)   │
│         └─────────────────────────────┘                             │
│                                                                       │
│  ════════════════════════════════════════════════════════            │
│  ⚡ STAGE 2: STELLIO (Real-time State)                               │
│  ════════════════════════════════════════════════════════            │
│                       │                                              │
│                       ▼ HTTP POST /ngsi-ld/v1/entities              │
│         ┌─────────────────────────────┐                             │
│         │      STELLIO BROKER         │                             │
│         │   📊 200 entities           │                             │
│         │   ⚡ Real-time (< 1 second) │                             │
│         │   🌍 Geo-spatial queries    │                             │
│         │   🔔 Subscriptions          │                             │
│         └─────────────┬───────────────┘                             │
│                       │                                              │
│         ┌─────────────┼────────────────────────┐                    │
│         │             │                        │                    │
│         ▼             ▼                        ▼                    │
│  ┌────────────┐ ┌────────────┐         ┌────────────┐             │
│  │ PostgreSQL │ │   Fuseki   │         │   Neo4j    │             │
│  │  (Backend) │ │   (RDF)    │         │  (Graph)   │             │
│  └────────────┘ └────────────┘         └────────────┘             │
│       ▲              ▲                        ▲                     │
│       │              │                        │                     │
│       │              └────────────────────────┘                     │
│       │               SYNC AGENTS                                   │
│       │                                                              │
│  ════════════════════════════════════════════════════════            │
│  💾 STAGE 3: PERSISTENCE LAYERS                                     │
│  ════════════════════════════════════════════════════════            │
│                                                                       │
│  1️⃣ PostgreSQL (Stellio Backend) - REAL-TIME                        │
│     ├─ Stellio writes directly (< 1 second latency)                 │
│     ├─ entity_payload table: JSONB storage                          │
│     ├─ 200 records (mirroring Stellio)                              │
│     └─ ⚠️ Don't access directly! Use Stellio API                   │
│                                                                       │
│  2️⃣ Fuseki (RDF Triplestore) - HISTORICAL                           │
│     ├─ RDF Loader Agent: Batch sync every ~5 minutes                │
│     ├─ Reads: data/rdf/*.ttl files                                  │
│     ├─ Loads: 48 Named Graphs (one per file)                        │
│     ├─ 22,733 triples total                                         │
│     └─ Forever retention (no deletion)                              │
│                                                                       │
│  3️⃣ Neo4j (Property Graph) - CURRENT + RELATIONSHIPS                │
│     ├─ Neo4j Sync Agent: Periodic sync every ~10 minutes            │
│     ├─ Queries: Stellio API                                         │
│     ├─ Transforms: NGSI-LD → Neo4j nodes/relationships              │
│     ├─ 202 nodes (200 entities + 2 metadata)                        │
│     └─ Current state only (no history)                              │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 🔗 ID Consistency & Cross-System Mapping

#### URN (Uniform Resource Name) Strategy

**Tất cả entities sử dụng cùng một URN scheme:**

```
Format: urn:ngsi-ld:{EntityType}:{ID}

Examples:
  Camera:       urn:ngsi-ld:Camera:0
  Weather:      urn:ngsi-ld:WeatherObserved:0
  AirQuality:   urn:ngsi-ld:AirQualityObserved:0
```

**✅ ID Mapping Across Systems:**

| Entity | Stellio ID | Neo4j node.id | Fuseki Subject | PostgreSQL entity_id |
|--------|-----------|---------------|----------------|---------------------|
| Camera 0 | `urn:ngsi-ld:Camera:0` | `"urn:ngsi-ld:Camera:0"` | `<urn:ngsi-ld:Camera:0>` | `'urn:ngsi-ld:Camera:0'` |
| Weather 0 | `urn:ngsi-ld:WeatherObserved:0` | `"urn:ngsi-ld:WeatherObserved:0"` | `<urn:ngsi-ld:WeatherObserved:0>` | `'urn:ngsi-ld:WeatherObserved:0'` |

**✅ Guaranteed Consistency:**
- ✅ **Same ID** across all storage systems
- ✅ Easy to query related data cross-system
- ✅ No need for ID translation

---

### 🔗 Relationship Mapping

#### Example: Camera 0 với Weather và AirQuality

**Stellio (NGSI-LD Relationships):**
```json
{
  "id": "urn:ngsi-ld:Camera:0",
  "type": "Camera",
  "refWeatherObserved": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:WeatherObserved:0"
  },
  "refAirQualityObserved": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:AirQualityObserved:0"
  }
}
```

**Neo4j (Graph Relationships):**
```cypher
// Nodes
(c:Camera {id: "urn:ngsi-ld:Camera:0", cameraName: "..."})
(w:WeatherObserved {id: "urn:ngsi-ld:WeatherObserved:0", temperature: 28.5})
(aq:AirQualityObserved {id: "urn:ngsi-ld:AirQualityObserved:0", pm25: 45.2})

// Relationships (using URN)
(c)-[:refWeatherObserved {refDevice: "urn:ngsi-ld:Camera:0"}]->(w)
(c)-[:refAirQualityObserved {refDevice: "urn:ngsi-ld:Camera:0"}]->(aq)
```

**Fuseki (RDF Triples):**
```turtle
<urn:ngsi-ld:Camera:0>
    schema:refWeatherObserved <urn:ngsi-ld:WeatherObserved:0> ;
    schema:refAirQualityObserved <urn:ngsi-ld:AirQualityObserved:0> .

<urn:ngsi-ld:WeatherObserved:0>
    schema:refDevice <urn:ngsi-ld:Camera:0> .
```

**✅ Relationship Consistency:**
- ✅ **Same URNs** dùng để link entities
- ✅ Query từ Camera có thể traverse sang Weather/AirQuality
- ✅ Bidirectional relationships (refDevice ↔ refWeatherObserved)

---

### 📊 Data Count Explanation

#### Why Different Numbers?

```
┌──────────────┬──────────┬────────────────────────────────────┐
│ Storage      │ Count    │ Explanation                        │
├──────────────┼──────────┼────────────────────────────────────┤
│ Stellio      │ 200      │ 40 Camera + 80 Weather + 80 AQ    │
│ Neo4j        │ 202      │ 200 + 1 Platform + 1 ObsProp      │
│ PostgreSQL   │ 202+     │ 202 entities + audit logs         │
│ Fuseki       │ 22,733   │ Triples (not entities)            │
│ Local Files  │ 48       │ RDF files (timestamped snapshots) │
└──────────────┴──────────┴────────────────────────────────────┘
```

**Detailed Breakdown:**

**1. Stellio: 200 entities**
```
40 Camera entities
80 WeatherObserved entities (40 cameras × 2 observations)
80 AirQualityObserved entities (40 cameras × 2 observations)
─────────────────────
200 total entities
```

**2. Neo4j: 202 nodes**
```
200 entities from Stellio
  1 Platform metadata node
  1 ObservableProperty definition node
─────────────────────
202 total nodes
```

**3. PostgreSQL: 202+ records**
```
202 records in entity_payload table (same as Neo4j)
  + Audit log records (entity_audit_log table)
  + Temporal history records (if enabled)
─────────────────────
202+ total records
```

**4. Fuseki: 22,733 triples**
```
NOT counting entities, counting RDF statements!

Example Camera:
  <urn:ngsi-ld:Camera:0> rdf:type sosa:Sensor .          (1 triple)
  <urn:ngsi-ld:Camera:0> schema:name "..." .             (1 triple)
  <urn:ngsi-ld:Camera:0> geo:lat "10.73291" .            (1 triple)
  <urn:ngsi-ld:Camera:0> geo:long "106.70752" .          (1 triple)
  ... ~10-15 triples per entity

200 entities × ~10-15 triples each ≈ 2,000-3,000 triples (base)
+ Named graph metadata ≈ 500 triples
+ Ontology definitions ≈ 1,000 triples
+ Historical snapshots ≈ 19,000 triples (from multiple pipeline runs)
─────────────────────
≈ 22,733 total triples
```

**5. Local Files: 48 RDF files**
```
Why 48 files for 40 cameras?

41 Camera_*.ttl files:
  - 40 cameras from latest pipeline run
  - +1 camera file from previous run (accumulation)

7 ObservableProperty_*.ttl files:
  - Property definitions (temperature, humidity, etc.)

Total: 41 + 7 = 48 files

⚠️ Files accumulate across multiple pipeline runs
⚠️ Each run creates timestamped files (not overwritten)
Example: Camera_20251110_001029.ttl, Camera_20251109_235420.ttl
```

---

## 📚 Ý Nghĩa & Mục Đích Của Từng Storage System

### 🎯 Tổng Quan Kiến Trúc

LOD (Linked Open Data) Cloud architecture được thiết kế theo nguyên tắc **"đa dạng hóa lưu trữ"** (Polyglot Persistence) - mỗi storage system tối ưu cho một loại query và use case khác nhau:

```
┌─────────────────────────────────────────────────────────────────┐
│              WHY MULTIPLE STORAGE SYSTEMS?                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Stellio     →  Real-time IoT data access & spatial queries     │
│  (NGSI-LD)       Geographic search, temporal data               │
│                                                                   │
│  Fuseki      →  Semantic web queries & ontology reasoning       │
│  (RDF)           Linked data navigation, SPARQL federation      │
│                                                                   │
│  Neo4j       →  Graph relationships & pattern matching          │
│  (Graph)         Network analysis, recommendation systems        │
│                                                                   │
│  PostgreSQL  →  ACID transactions & complex joins               │
│  (Relational)    Business logic, data integrity                 │
│                                                                   │
│  Local Files →  Backup, archival & offline processing           │
│  (RDF/JSON)      Data portability, ETL pipelines               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 1️⃣ Stellio Context Broker (NGSI-LD)

#### 🎯 Ý Nghĩa

**Stellio** là **Context Broker** chuẩn NGSI-LD (Next Generation Service Interfaces - Linked Data), đóng vai trò là **"trung tâm dữ liệu IoT real-time"** của hệ thống.

#### 📊 Data Trong Stellio Có Ý Nghĩa Gì?

**Data Structure:**
- **Entities**: Đối tượng IoT (cameras, sensors, actuators)
- **Properties**: Thuộc tính đo lường (temperature, humidity, status)
- **Relationships**: Liên kết giữa các entities (refDevice, refWeatherObserved)
- **GeoProperties**: Vị trí địa lý (Point, Polygon với coordinates)
- **Temporal Properties**: Dữ liệu theo thời gian (timestamps, histories)

**Đặc Điểm:**
- ✅ **Linked Data**: Mọi entity có URI duy nhất, có thể link với nhau
- ✅ **JSON-LD Format**: Machine-readable và human-readable
- ✅ **Context Aware**: Dữ liệu có ngữ cảnh rõ ràng qua @context
- ✅ **Geo-spatial**: Hỗ trợ geographic queries (near, within, intersects)
- ✅ **Temporal**: Query theo time range và lịch sử thay đổi

#### 🚀 Phục Vụ Vấn Đề Gì?

**1. Real-time IoT Applications**
```python
# Use case: Hiển thị camera gần vị trí hiện tại
GET /entities?type=Camera&georel=near;maxDistance==1000&coordinates=[lat,lng]
→ Tìm cameras trong bán kính 1km
```

**2. Smart City Dashboards**
```python
# Use case: Dashboard giám sát traffic real-time
GET /entities?type=Camera&q=status==active
→ Lấy tất cả cameras đang hoạt động
```

**3. Context-Aware Services**
```python
# Use case: Dự báo thời tiết cho từng camera location
GET /entities/urn:ngsi-ld:Camera:0
GET /entities/urn:ngsi-ld:WeatherObserved:0
→ Kết hợp data camera + weather cho context đầy đủ
```

**4. Temporal Queries**
```python
# Use case: Phân tích xu hướng nhiệt độ theo thời gian
GET /temporal/entities?timerel=between&timeAt=2025-11-01T00:00:00Z&endTimeAt=2025-11-10T23:59:59Z
→ Lấy lịch sử đo lường trong khoảng thời gian
```

**5. Federation & Interoperability**
- Data format chuẩn ETSI NGSI-LD → dễ tích hợp với hệ thống khác
- Context Broker có thể federate với các broker khác (multi-tenant)

#### 🏆 Khi Nào Dùng Stellio?

✅ **SỬ DỤNG** khi cần:
- Query theo vị trí địa lý (geo-spatial)
- Truy cập real-time IoT data
- Subscribe notifications khi data thay đổi
- Chuẩn hóa theo NGSI-LD specification
- Tích hợp với FIWARE ecosystem

❌ **KHÔNG DÙNG** khi cần:
- Phân tích graph relationships phức tạp → dùng Neo4j
- Reasoning semantic với ontologies → dùng Fuseki
- Complex SQL joins và transactions → dùng PostgreSQL

---

### 2️⃣ Apache Jena Fuseki (RDF Triplestore)

#### 🎯 Ý Nghĩa

**Fuseki** là **RDF Triplestore** - database chuyên lưu trữ **semantic triples** (chủ ngữ - vị ngữ - tân ngữ), đóng vai trò là **"LOD Cloud endpoint"** cho Linked Open Data.

#### 📊 Data Trong Fuseki Có Ý Nghĩa Gì?

**Data Structure:**
```turtle
# Triple: <subject> <predicate> <object>
<urn:ngsi-ld:Camera:0> 
    <http://schema.org/name> "Nguyễn Văn Linh - Nguyễn Hữu Thọ" ;
    <http://www.w3.org/2003/01/geo/wgs84_pos#lat> "10.73291"^^xsd:decimal ;
    <http://www.w3.org/2003/01/geo/wgs84_pos#long> "106.70752"^^xsd:decimal ;
    <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/ns/sosa/Sensor> .
```

**Đặc Điểm:**
- ✅ **Triples**: Mọi thông tin được phân tách thành atomic statements
- ✅ **URIs**: Mọi concept có URI toàn cầu duy nhất
- ✅ **Ontologies**: Data linked với vocabularies chuẩn (Schema.org, SOSA, GeoSPARQL)
- ✅ **Named Graphs**: Triples được nhóm theo graph contexts
- ✅ **Inference**: Có thể reasoning để suy luận tri thức mới

#### 🚀 Phục Vụ Vấn Đề Gì?

**1. Semantic Web & Linked Data**
```sparql
# Use case: Tìm tất cả sensors và properties của chúng
SELECT ?sensor ?property ?value
WHERE {
  ?sensor a sosa:Sensor ;
          ?property ?value .
}
→ Traverse semantic graph để khám phá data
```

**2. Ontology-based Reasoning**
```sparql
# Use case: Suy luận: Nếu sensor có temperature > 35°C thì là "high_temp"
SELECT ?sensor ?temp
WHERE {
  ?sensor sosa:observes ?property .
  ?obs sosa:madeBySensor ?sensor ;
       sosa:hasResult ?result .
  ?result schema:value ?temp .
  FILTER(?temp > 35)
}
→ Reasoning dựa trên ontology rules
```

**3. Cross-domain Data Integration**
```sparql
# Use case: Link camera data với external datasets (DBpedia, Wikidata)
SELECT ?camera ?city ?population
WHERE {
  ?camera geo:lat ?lat ; geo:long ?lng .
  
  # Federated query to DBpedia
  SERVICE <https://dbpedia.org/sparql> {
    ?city dbo:populationTotal ?population ;
          geo:lat ?cityLat ; geo:long ?cityLng .
    FILTER(abs(?lat - ?cityLat) < 0.1 && abs(?lng - ?cityLng) < 0.1)
  }
}
→ Kết nối với LOD cloud toàn cầu
```

**4. Data Provenance & Versioning**
```sparql
# Use case: Track data lineage - data này từ đâu, ai tạo, khi nào?
SELECT ?graph ?creator ?timestamp
WHERE {
  GRAPH ?graph {
    ?entity a sosa:Sensor .
  }
  ?graph dcterms:creator ?creator ;
         dcterms:created ?timestamp .
}
→ Audit trail và data governance
```

**5. Complex Graph Pattern Matching**
```sparql
# Use case: Tìm cameras quan sát cùng một location
SELECT ?camera1 ?camera2
WHERE {
  ?camera1 a sosa:Sensor ; geo:lat ?lat ; geo:long ?lng .
  ?camera2 a sosa:Sensor ; geo:lat ?lat ; geo:long ?lng .
  FILTER(?camera1 != ?camera2)
}
→ Pattern matching phức tạp trên semantic graph
```

#### 🏆 Khi Nào Dùng Fuseki?

✅ **SỬ DỤNG** khi cần:
- Semantic web queries với SPARQL
- Link data với external LOD datasets
- Ontology reasoning và inference
- Data integration từ nhiều nguồn khác nhau
- Publish data ra LOD cloud toàn cầu

❌ **KHÔNG DÙNG** khi cần:
- High-performance graph traversal → dùng Neo4j
- Simple CRUD operations → dùng Stellio
- Real-time updates với low latency → dùng Stellio

---

### 3️⃣ Neo4j Graph Database

#### 🎯 Ý Nghĩa

**Neo4j** là **Property Graph Database** - database chuyên xử lý **graph relationships**, đóng vai trò là **"network analysis engine"** cho phân tích mối quan hệ phức tạp.

#### 📊 Data Trong Neo4j Có Ý Nghĩa Gì?

**Data Structure:**
```cypher
// Nodes: Entities với properties
(:Camera {id: "urn:ngsi-ld:Camera:0", name: "NVL-NHT"})
(:WeatherObserved {temperature: 28.5, humidity: 75})
(:AirQualityObserved {aqi: 45, pm25: 12.3})

// Relationships: Connections với properties
(:Camera)-[:HAS_WEATHER]->(:WeatherObserved)
(:Camera)-[:HAS_AIR_QUALITY]->(:AirQualityObserved)
(:Camera)-[:NEAR_BY {distance: 500}]->(:Camera)
```

**Đặc Điểm:**
- ✅ **Labeled Property Graph**: Nodes và edges đều có labels + properties
- ✅ **Index-free Adjacency**: Traverse nhanh không cần index lookups
- ✅ **Native Graph Storage**: Optimized cho graph traversal
- ✅ **Cypher Query Language**: SQL-like nhưng cho graphs
- ✅ **ACID Transactions**: Đảm bảo consistency

#### 🚀 Phục Vụ Vấn Đề Gì?

**1. Network Analysis**
```cypher
// Use case: Tìm clusters của cameras gần nhau
MATCH (c1:Camera)-[:NEAR_BY*1..3]-(c2:Camera)
RETURN c1, c2
→ Phân tích network topology
```

**2. Recommendation Systems**
```cypher
// Use case: Recommend cameras dựa trên similarity
MATCH (c1:Camera)-[:HAS_WEATHER]->(w1:WeatherObserved)
MATCH (c2:Camera)-[:HAS_WEATHER]->(w2:WeatherObserved)
WHERE c1 <> c2 
  AND abs(w1.temperature - w2.temperature) < 2
RETURN c1, c2, w1.temperature, w2.temperature
→ Content-based recommendation
```

**3. Path Finding**
```cypher
// Use case: Tìm shortest path giữa 2 cameras
MATCH path = shortestPath(
  (c1:Camera {id: "urn:ngsi-ld:Camera:0"})-[*]-(c2:Camera {id: "urn:ngsi-ld:Camera:39"})
)
RETURN path, length(path)
→ Route planning, logistics optimization
```

**4. Community Detection**
```cypher
// Use case: Phát hiện communities trong camera network
CALL gds.louvain.stream('camera-graph')
YIELD nodeId, communityId
RETURN communityId, count(*) as size
ORDER BY size DESC
→ Clustering và segmentation
```

**5. Centrality Analysis**
```cypher
// Use case: Tìm cameras "quan trọng nhất" trong network
CALL gds.pageRank.stream('camera-graph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name as camera, score
ORDER BY score DESC LIMIT 10
→ Identify influential nodes
```

**6. Real-time Fraud Detection**
```cypher
// Use case: Phát hiện anomalies trong sensor network
MATCH (c:Camera)-[:HAS_AIR_QUALITY]->(aq:AirQualityObserved)
WHERE aq.aqi > 150
WITH c, aq
MATCH (c)-[:NEAR_BY]-(neighbor:Camera)-[:HAS_AIR_QUALITY]->(naq)
WHERE naq.aqi < 50
RETURN c, aq.aqi, collect(naq.aqi) as neighbor_aqi
→ Detect outliers dựa trên neighbor context
```

#### 🏆 Khi Nào Dùng Neo4j?

✅ **SỬ DỤNG** khi cần:
- Graph traversal và pathfinding
- Network analysis (centrality, clustering)
- Recommendation engines
- Fraud detection và anomaly detection
- Social network analysis
- Knowledge graphs với complex relationships

❌ **KHÔNG DÙNG** khi cần:
- Simple key-value lookups → dùng Stellio
- Semantic reasoning với ontologies → dùng Fuseki
- Complex aggregations trên tabular data → dùng PostgreSQL

---

### 4️⃣ PostgreSQL Database

#### 🎯 Ý Nghĩa

**PostgreSQL** là **Relational Database** - database quan hệ truyền thống, đóng vai trò là **"ACID-compliant storage"** cho Stellio backend, đảm bảo **data integrity** và **transactional consistency**.

#### 📊 Data Trong PostgreSQL Có Ý Nghĩa Gì?

**Data Structure:**
```sql
-- Table: entity_payload
CREATE TABLE entity_payload (
    entity_id VARCHAR(256) PRIMARY KEY,
    entity_type VARCHAR(256) NOT NULL,
    entity_payload JSONB NOT NULL,  -- Full NGSI-LD entity
    created_at TIMESTAMP DEFAULT NOW(),
    modified_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_entity_type ON entity_payload(entity_type);
CREATE INDEX idx_entity_payload_gin ON entity_payload USING GIN(entity_payload);
```

**Đặc Điểm:**
- ✅ **ACID Transactions**: Atomicity, Consistency, Isolation, Durability
- ✅ **JSONB Support**: Native JSON storage với indexing
- ✅ **Complex Joins**: Multi-table joins với SQL
- ✅ **Constraints**: Foreign keys, unique constraints, check constraints
- ✅ **Triggers**: Automatic actions on data changes

#### 🚀 Phục Vụ Vấn Đề Gì?

**1. Stellio Backend Storage**
```sql
-- Use case: Stellio lưu entities vào PostgreSQL
INSERT INTO entity_payload (entity_id, entity_type, entity_payload)
VALUES ('urn:ngsi-ld:Camera:0', 'Camera', '{"id": "...", "type": "Camera", ...}');
→ Persistent storage cho Stellio Context Broker
```

**2. Complex Business Logic**
```sql
-- Use case: Báo cáo số cameras theo type và status
SELECT 
    entity_payload->>'cameraType' as camera_type,
    entity_payload->'status'->>'value' as status,
    COUNT(*) as count
FROM entity_payload
WHERE entity_type = 'Camera'
GROUP BY camera_type, status;
→ Business intelligence queries
```

**3. Data Integrity & Validation**
```sql
-- Use case: Ensure data consistency với constraints
ALTER TABLE entity_payload
ADD CONSTRAINT check_entity_id_format 
CHECK (entity_id ~ '^urn:ngsi-ld:[A-Za-z]+:[0-9]+$');
→ Enforce data quality rules
```

**4. Audit Logging**
```sql
-- Use case: Track mọi thay đổi entity
CREATE TABLE entity_audit_log (
    log_id SERIAL PRIMARY KEY,
    entity_id VARCHAR(256),
    action VARCHAR(50),
    old_payload JSONB,
    new_payload JSONB,
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TRIGGER entity_change_trigger
AFTER UPDATE ON entity_payload
FOR EACH ROW EXECUTE FUNCTION log_entity_change();
→ Complete audit trail
```

**5. Transactional Updates**
```sql
-- Use case: Atomic updates cho multiple entities
BEGIN;
  UPDATE entity_payload SET entity_payload = ... WHERE entity_id = 'Camera:0';
  UPDATE entity_payload SET entity_payload = ... WHERE entity_id = 'Weather:0';
COMMIT;
→ All-or-nothing updates
```

#### 🏆 Khi Nào Dùng PostgreSQL?

✅ **SỬ DỤNG** khi cần:
- ACID transactions
- Complex SQL queries với joins
- Data integrity constraints
- Relational data model
- Backend storage cho applications

❌ **KHÔNG DÙNG** khi cần:
- Direct access (use Stellio API instead)
- Graph traversal → dùng Neo4j
- Semantic queries → dùng Fuseki
- Real-time IoT queries → dùng Stellio

**⚠️ LƯU Ý:** PostgreSQL trong hệ thống này là **backend storage của Stellio**, không nên truy cập trực tiếp. Luôn dùng **Stellio API** để đảm bảo consistency.

---

### 5️⃣ Local File Storage (RDF/JSON)

#### 🎯 Ý Nghĩa

**Local Files** đóng vai trò là **"data lake"** và **"backup repository"**, lưu trữ **raw data** và **intermediate processing results** dưới dạng files trên disk.

#### 📊 Data Trong Local Files Có Ý Nghĩa Gì?

**Data Structure:**
```
data/
├── rdf/                              # Semantic data in RDF Turtle
│   ├── Camera_20251110_001029.ttl    # Camera RDF exports (41 files)
│   ├── ObservableProperty_*.ttl      # Sensor properties (7 files)
│   └── [Total: 48 files]             # Accumulates across pipeline runs
│   
├── cameras_updated.json              # Pipeline stage 1: Basic cameras
├── cameras_enriched.json             # Pipeline stage 2: + weather + AQ
├── ngsi_ld_entities.json             # Pipeline stage 3: NGSI-LD format
├── observations.json                 # Pipeline stage 4: CV analysis
│
└── reports/
    ├── triplestore_load_*.json       # Load statistics
    └── workflow_report_*.json        # Pipeline execution logs
```

**🔍 Chi Tiết 48 RDF Files - Tại Sao Có 48 Files?**

```
┌─────────────────────────────────────────────────────────────────┐
│          WHY 48 RDF FILES FOR 40 CAMERAS?                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📂 Camera_*.ttl files: 41 files                                │
│  ├─ 40 files từ pipeline run mới nhất                           │
│  ├─ +1 file từ pipeline run trước đó                            │
│  └─ Files KHÔNG bị overwrite, có timestamp                      │
│                                                                   │
│  Example filenames:                                              │
│  ├─ Camera_20251110_001029.ttl  (Run on Nov 10, 2025)          │
│  ├─ Camera_20251109_235420.ttl  (Run on Nov 09, 2025)          │
│  └─ Camera_20251108_120130.ttl  (Run on Nov 08, 2025)          │
│                                                                   │
│  📂 ObservableProperty_*.ttl files: 7 files                     │
│  ├─ Property definitions (temperature, humidity, pm25, etc.)    │
│  └─ Also timestamped, accumulates over time                     │
│                                                                   │
│  🧮 Total: 41 + 7 = 48 files                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**📌 cameras_enriched.json - Tại Sao Là File Quan Trọng Nhất?**

`cameras_enriched.json` là **TRUNG TÂM của data pipeline**, chứa **100% data đầy đủ** trước khi đưa vào các storage systems:

```json
{
  "cameras": [
    {
      // ===== ORIGINAL CAMERA DATA =====
      "id": "urn:ngsi-ld:Camera:0",
      "type": "Camera",
      "cameraName": "Nguyễn Văn Linh - Nguyễn Hữu Thọ",
      "location": {
        "type": "Point",
        "coordinates": [106.70752, 10.73291]
      },
      
      // ===== ENRICHED WEATHER DATA (từ OpenWeather API) =====
      "weather": {
        "temperature": 28.5,        // °C
        "humidity": 75,              // %
        "pressure": 1013.25,         // hPa
        "windSpeed": 5.2,            // m/s
        "weatherType": "clear"
      },
      
      // ===== ENRICHED AIR QUALITY DATA (từ IQAir API) =====
      "airQuality": {
        "pm25": 45.2,                // μg/m³
        "pm10": 78.3,
        "airQualityIndex": 105,      // AQI
        "no2": 42.1,
        "o3": 68.5
      },
      
      // ===== COMPUTED OBSERVATIONS (từ CV analysis) =====
      "observations": {
        "trafficDensity": "medium",
        "vehicleCount": 42,
        "congestionLevel": 0.6
      }
    }
  ]
}
```

**🔄 Data Flow Qua cameras_enriched.json:**

```
┌─────────────────────────────────────────────────────────────────┐
│      cameras_enriched.json TRONG PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  STAGE 0: External APIs                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Traffic API  │  │ Weather API  │  │  AQ API      │         │
│  │ (HCMC DOT)   │  │(OpenWeather) │  │  (IQAir)     │         │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘         │
│          │                  │                  │                 │
│          ▼                  ▼                  ▼                 │
│  ════════════════════════════════════════════════════            │
│  STAGE 1: cameras_updated.json                                  │
│  ════════════════════════════════════════════════════            │
│  ├─ 40 cameras with basic info                                  │
│  ├─ Source: Traffic API                                         │
│  └─ Fields: id, name, location, cameraType                      │
│                          │                                       │
│                          ▼ Enrichment Process                    │
│  ════════════════════════════════════════════════════            │
│  STAGE 2: cameras_enriched.json ⭐ KEY FILE ⭐                   │
│  ════════════════════════════════════════════════════            │
│  ├─ 40 cameras + weather data (from OpenWeather)                │
│  ├─ 40 cameras + air quality (from IQAir)                       │
│  ├─ 40 cameras + CV observations (from video analysis)          │
│  └─ **100% complete data** - ready for all storages             │
│                          │                                       │
│          ┌───────────────┼───────────────┐                      │
│          │               │               │                      │
│          ▼               ▼               ▼                      │
│    ┌──────────┐   ┌──────────┐   ┌──────────┐                 │
│    │ Stellio  │   │  Fuseki  │   │  Neo4j   │                 │
│    │(NGSI-LD) │   │   (RDF)  │   │ (Graph)  │                 │
│    └──────────┘   └──────────┘   └──────────┘                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**✅ cameras_enriched.json = "100% Data" - Giải Thích:**

| Question | Answer |
|----------|--------|
| **100% data có nghĩa là gì?** | Tất cả data fields đã được điền đầy đủ (camera info + weather + air quality + observations) |
| **Tại sao gọi là "enriched"?** | Ban đầu chỉ có camera info, sau đó "enriched" (làm giàu) thêm weather và AQ data |
| **Có phải là source of truth không?** | ❌ NO - Source of truth là External APIs. File này là snapshot tại thời điểm pipeline chạy |
| **Khi nào file này được tạo ra?** | Mỗi lần chạy pipeline (thủ công hoặc scheduled) |
| **File này có được backup không?** | ✅ YES - Nên commit vào Git hoặc backup định kỳ |
| **Có thể restore data từ file này?** | ✅ YES - Re-run pipeline với file này làm input để populate lại Stellio/Fuseki/Neo4j |

**🎯 Use Cases Cho cameras_enriched.json:**

**Use Case 1: Reproduce Pipeline Results**
```bash
# Scenario: Stellio/Fuseki/Neo4j bị mất data
# Solution: Re-run pipeline với cameras_enriched.json

python pipeline.py --input data/cameras_enriched.json --skip-api-calls
# Pipeline sẽ populate lại Stellio/Fuseki/Neo4j với exact same data
```

**Use Case 2: Offline Analysis**
```python
# Scenario: Phân tích data mà không cần services running
import json
import pandas as pd

# Load enriched data
with open('data/cameras_enriched.json') as f:
    data = json.load(f)

# Convert to pandas DataFrame
df = pd.DataFrame(data['cameras'])

# Analyze correlations
correlation = df[['temperature', 'pm25', 'trafficDensity']].corr()
# → Phát hiện: Temperature cao ↔ PM2.5 cao ↔ Traffic congestion
```

**Use Case 3: Data Validation**
```python
# Scenario: Kiểm tra data quality trước khi load vào databases
import json

with open('data/cameras_enriched.json') as f:
    data = json.load(f)

# Validate all cameras have enriched data
for camera in data['cameras']:
    assert 'weather' in camera, f"Camera {camera['id']} missing weather"
    assert 'airQuality' in camera, f"Camera {camera['id']} missing AQ"
    assert camera['airQuality']['pm25'] > 0, f"Invalid PM2.5"

print("✅ All cameras have complete enriched data")
```

**Use Case 4: Backup & Version Control**
```bash
# Scenario: Backup data snapshot mỗi ngày
DATE=$(date +%Y%m%d)
cp data/cameras_enriched.json backups/cameras_enriched_$DATE.json

# Commit to Git for version control
git add data/cameras_enriched.json
git commit -m "Data snapshot $(date)"
git push
# → Data versioning với Git history
```

**Đặc Điểm:**
- ✅ **Persistence**: Data tồn tại sau khi services restart
- ✅ **Portability**: Dễ copy, backup, transfer
- ✅ **Version Control**: Có thể commit vào Git
- ✅ **Human Readable**: JSON và Turtle formats
- ✅ **Offline Processing**: Không cần database running

#### 🚀 Phục Vụ Vấn Đề Gì?

**1. Pipeline Intermediate Results**
```python
# Use case: Debug pipeline - xem data ở từng stage
stage1 = json.load(open('cameras_updated.json'))      # 40 cameras
stage2 = json.load(open('cameras_enriched.json'))     # + weather + AQ
stage3 = json.load(open('ngsi_ld_entities.json'))     # NGSI-LD format
→ Tracing data transformation qua pipeline
```

**2. Backup & Disaster Recovery**
```bash
# Use case: Backup toàn bộ data
tar -czf backup_$(date +%Y%m%d).tar.gz data/
→ Full data backup for recovery
```

**3. Offline Analysis**
```python
# Use case: Phân tích data mà không cần services running
from rdflib import Graph
g = Graph()
g.parse('data/rdf/Camera_20251110_001029.ttl', format='turtle')
# Run queries without Fuseki
→ Local RDF processing với rdflib
```

**4. ETL Pipelines**
```python
# Use case: Export data sang format khác
import pandas as pd
cameras = json.load(open('cameras_enriched.json'))
df = pd.DataFrame(cameras)
df.to_csv('cameras_export.csv')
df.to_parquet('cameras_export.parquet')
→ Data lake for analytics
```

**5. Version Control & Reproducibility**
```bash
# Use case: Track data changes qua Git
git add data/cameras_enriched.json
git commit -m "Updated camera data with new weather readings"
→ Data versioning và reproducible research
```

**6. Data Portability**
```bash
# Use case: Share data với external partners
zip -r lod_data_export.zip data/rdf/ data/*.json
→ Portable data package
```

#### 🏆 Khi Nào Dùng Local Files?

✅ **SỬ DỤNG** khi cần:
- Backup và archival
- Pipeline intermediate results
- Offline processing
- Data portability
- Version control
- ETL source/target

❌ **KHÔNG DÙNG** khi cần:
- Real-time queries → dùng Stellio
- Concurrent access → dùng databases
- ACID transactions → dùng PostgreSQL
- Graph traversal → dùng Neo4j

---

## 🔄 Data Flow & Synchronization

### Pipeline Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOD PIPELINE DATA FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  External APIs                                                   │
│  (Traffic, Weather, AQ)                                          │
│         │                                                         │
│         ▼                                                         │
│  ┌──────────────┐                                               │
│  │ Local Files  │  cameras_updated.json                         │
│  │   (Stage 1)  │  → cameras_enriched.json                      │
│  └──────┬───────┘  → ngsi_ld_entities.json                      │
│         │          → observations.json                           │
│         ▼                                                         │
│  ┌──────────────┐                                               │
│  │   Stellio    │  Publish NGSI-LD entities                     │
│  │  (NGSI-LD)   │  ← Real-time access                           │
│  └──────┬───────┘                                               │
│         │                                                         │
│         ├────────────────┬─────────────────┐                    │
│         ▼                ▼                 ▼                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │  PostgreSQL  │ │    Fuseki    │ │    Neo4j     │           │
│  │   (Backend)  │ │     (RDF)    │ │   (Graph)    │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│         ▲                ▲                 ▲                    │
│         │                │                 │                    │
│         └────────────────┴─────────────────┘                    │
│              Sync Agents (periodic)                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Sync Strategy

1. **Stellio → PostgreSQL**: Real-time (Stellio writes directly)
2. **Stellio → Fuseki**: Batch sync (RDF Loader Agent)
3. **Stellio → Neo4j**: Periodic sync (Neo4j Sync Agent)
4. **Local Files → All**: Pipeline execution (manual trigger)

---

## 🎯 Use Case Mapping

| Use Case | Primary Storage | Secondary Storage | Reason |
|----------|----------------|-------------------|--------|
| **Real-time dashboard** | Stellio | - | Low latency, geo-queries |
| **Semantic search** | Fuseki | Stellio | SPARQL reasoning |
| **Network analysis** | Neo4j | - | Graph algorithms |
| **Business reports** | PostgreSQL | Stellio | SQL aggregations |
| **Data export** | Local Files | All | Portability |
| **ML training** | Local Files | Stellio | Offline processing |
| **API integration** | Stellio | - | RESTful interface |
| **Linked data publishing** | Fuseki | - | LOD cloud endpoint |

---

## ⚡ Real-time vs Historical Data: Hiểu Rõ Đặc Tính Data

### 📊 Tổng Quan Data Characteristics

```
┌────────────────────────────────────────────────────────────────────┐
│              DATA CHARACTERISTICS BY STORAGE                        │
├────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Storage    │ Data Type    │ Freshness   │ History  │ Performance │
│  ───────────┼──────────────┼─────────────┼──────────┼─────────────│
│             │              │             │          │             │
│  Stellio    │ CURRENT      │ Real-time   │ Limited  │ Fast        │
│  (NGSI-LD)  │ State        │ < 1 second  │ (7 days) │ < 100ms     │
│             │              │             │          │             │
│  Fuseki     │ HISTORICAL   │ Batch sync  │ Forever  │ Medium      │
│  (RDF)      │ Snapshots    │ ~ 5 minutes │ (Full)   │ 1-5 seconds │
│             │              │             │          │             │
│  Neo4j      │ CURRENT      │ Periodic    │ Current  │ Fast        │
│  (Graph)    │ + Relations  │ ~ 10 mins   │ only     │ < 500ms     │
│             │              │             │          │             │
│  PostgreSQL │ CURRENT      │ Real-time   │ Full     │ Fast        │
│  (Backend)  │ (Stellio)    │ < 1 second  │ (logs)   │ < 50ms      │
│             │              │             │          │             │
│  Local      │ HISTORICAL   │ On demand   │ Forever  │ N/A         │
│  Files      │ Archival     │ (manual)    │ (files)  │ (offline)   │
│             │              │             │          │             │
└────────────────────────────────────────────────────────────────────┘
```

---

### 1️⃣ Real-time Data (Current State) 🔴

#### 🎯 Đặc Điểm

**Real-time data** = **Trạng thái hiện tại** của entities, được cập nhật liên tục với độ trễ tối thiểu.

#### 📍 Nơi Lưu Trữ

**PRIMARY: Stellio (NGSI-LD)**
```yaml
Freshness: < 1 second
Update Frequency: Real-time (on every change)
Data Retention: Latest state + 7 days temporal data
Latency: 50-100ms
```

**SECONDARY: Neo4j (Graph)**
```yaml
Freshness: ~10 minutes (synced from Stellio)
Update Frequency: Periodic batch sync
Data Retention: Current state only (no history)
Latency: 200-500ms
```

**BACKEND: PostgreSQL**
```yaml
Freshness: < 1 second (Stellio backend)
Update Frequency: Real-time (same as Stellio)
Data Retention: Full history with audit logs
Latency: 20-50ms (but don't access directly!)
```

#### ✅ Khi Nào Lấy Real-time Data?

**Scenario 1: Monitoring Dashboard**
```python
# ✅ ĐÚNG: Lấy từ Stellio
import requests

# Get current camera status (real-time)
response = requests.get(
    "http://localhost:8080/ngsi-ld/v1/entities/urn:ngsi-ld:Camera:0"
)
camera = response.json()
current_status = camera['status']['value']  # Real-time status
current_temp = camera['temperature']['value']  # Real-time temperature

print(f"Camera status RIGHT NOW: {current_status}")
```

**Scenario 2: IoT Control System**
```python
# ✅ ĐÚNG: Lấy từ Stellio để điều khiển real-time
# Check if camera is online before sending command
camera = requests.get(f"{stellio_url}/entities/urn:ngsi-ld:Camera:0").json()
if camera['status']['value'] == 'online':
    # Send control command
    send_camera_command(camera['id'], 'rotate_left')
```

**Scenario 3: Alert System**
```python
# ✅ ĐÚNG: Subscribe Stellio notifications cho real-time alerts
subscription = {
    "type": "Subscription",
    "entities": [{"type": "AirQualityObserved"}],
    "watchedAttributes": ["pm25"],
    "q": "pm25>100",  # Alert when PM2.5 > 100
    "notification": {
        "endpoint": {"uri": "http://my-alert-service/notify"}
    }
}
requests.post(f"{stellio_url}/subscriptions", json=subscription)
# → Receive real-time notifications when AQI spikes
```

#### ❌ Khi Nào KHÔNG Lấy Real-time Data?

```python
# ❌ SAI: Lấy từ Fuseki cho real-time monitoring
# Fuseki có độ trễ 5-10 phút, không phù hợp real-time!
sparql = "SELECT ?temp WHERE { ?camera schema:temperature ?temp }"
# → Data cũ 5-10 phút, không phản ánh current state!

# ❌ SAI: Lấy từ Local Files
with open('cameras_enriched.json') as f:
    cameras = json.load(f)
    # → Data static từ lần chạy pipeline cuối, có thể cũ hàng giờ!
```

---

### 2️⃣ Historical Data (Time-series Archive) 📚

#### 🎯 Đặc Điểm

**Historical data** = **Dữ liệu lịch sử** theo thời gian, dùng cho phân tích xu hướng, reporting, và machine learning.

#### 📍 Nơi Lưu Trữ

**PRIMARY: Fuseki (RDF Triplestore)**
```yaml
Freshness: Batch updates every ~5 minutes
Update Frequency: Periodic sync from Stellio
Data Retention: Forever (unlimited history)
Storage Format: Named graphs with timestamps
Query Language: SPARQL (temporal queries)
Use Case: Historical analysis, trend detection
```

**SECONDARY: Local Files (RDF/JSON)**
```yaml
Freshness: Manual pipeline execution
Update Frequency: On-demand (user triggered)
Data Retention: Forever (file-based archival)
Storage Format: Timestamped TTL/JSON files
Use Case: Backup, offline analysis, ML training
```

**OPTIONAL: PostgreSQL (with TimescaleDB)**
```yaml
Note: Current setup doesn't have temporal tables
Potential: Can add TimescaleDB extension for time-series
Data Retention: Configurable (with partitioning)
Use Case: Time-series analytics with SQL
```

#### ✅ Khi Nào Lấy Historical Data?

**Scenario 1: Trend Analysis**
```sparql
-- ✅ ĐÚNG: Lấy từ Fuseki với temporal SPARQL
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX schema: <http://schema.org/>

SELECT ?timestamp ?temperature
WHERE {
  GRAPH ?g {
    ?obs sosa:madeBySensor <urn:ngsi-ld:Camera:0> ;
         sosa:resultTime ?timestamp ;
         sosa:hasResult ?result .
    ?result schema:temperature ?temperature .
  }
  FILTER(?timestamp >= "2025-11-01T00:00:00Z"^^xsd:dateTime &&
         ?timestamp <= "2025-11-10T23:59:59Z"^^xsd:dateTime)
}
ORDER BY ?timestamp
-- → Lấy lịch sử nhiệt độ 10 ngày để phân tích xu hướng
```

**Scenario 2: Business Intelligence**
```python
# ✅ ĐÚNG: Lấy historical data từ Fuseki cho BI reports
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth('admin', 'test_admin')

# Query: Average AQI by hour for last 30 days
sparql = """
PREFIX schema: <http://schema.org/>

SELECT ?hour (AVG(?aqi) as ?avg_aqi)
WHERE {
  GRAPH ?g {
    ?aq schema:airQualityIndex ?aqi ;
        schema:dateObserved ?timestamp .
  }
  BIND(HOURS(?timestamp) as ?hour)
  FILTER(?timestamp > NOW() - "P30D"^^xsd:duration)
}
GROUP BY ?hour
ORDER BY ?hour
"""

response = requests.post(
    "http://localhost:3030/lod-dataset/sparql",
    data={'query': sparql},
    headers={'Accept': 'application/sparql-results+json'},
    auth=auth
)

results = response.json()
# → Hourly AQI patterns for last 30 days
```

**Scenario 3: Machine Learning Training**
```python
# ✅ ĐÚNG: Lấy từ Local Files cho ML training
import json
import pandas as pd
from sklearn.model_selection import train_test_split

# Load historical data từ local files
with open('data/cameras_enriched.json') as f:
    historical_data = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(historical_data)

# Feature engineering
features = df[['latitude', 'longitude', 'weather_temperature', 
               'weather_humidity', 'air_quality_aqi']]
target = df['traffic_congestion_level']

# Train model trên historical data
X_train, X_test, y_train, y_test = train_test_split(features, target)
# → ML model học từ historical patterns
```

**Scenario 4: Data Auditing**
```sparql
-- ✅ ĐÚNG: Lấy từ Fuseki để audit data changes
PREFIX prov: <http://www.w3.org/ns/prov#>

SELECT ?entity ?property ?oldValue ?newValue ?timestamp
WHERE {
  GRAPH ?oldGraph {
    ?entity ?property ?oldValue .
    ?oldGraph prov:generatedAtTime ?timestamp1 .
  }
  GRAPH ?newGraph {
    ?entity ?property ?newValue .
    ?newGraph prov:generatedAtTime ?timestamp2 .
  }
  FILTER(?timestamp2 > ?timestamp1 && ?oldValue != ?newValue)
  BIND(?timestamp2 as ?timestamp)
}
ORDER BY DESC(?timestamp)
-- → Track mọi thay đổi data qua thời gian
```

#### ❌ Khi Nào KHÔNG Lấy Historical Data?

```python
# ❌ SAI: Lấy từ Stellio cho historical analysis
# Stellio chỉ giữ 7 ngày temporal data!
response = requests.get(
    "http://localhost:8080/ngsi-ld/v1/temporal/entities",
    params={
        "timerel": "between",
        "timeAt": "2025-10-01T00:00:00Z",  # 40 days ago
        "endTimeAt": "2025-11-10T00:00:00Z"
    }
)
# → Chỉ được 7 ngày gần nhất, mất data cũ hơn!

# ❌ SAI: Lấy từ Neo4j cho time-series analysis
# Neo4j không lưu historical states!
result = session.run("""
    MATCH (c:Camera)
    RETURN c.temperature, c.timestamp
    ORDER BY c.timestamp
""")
# → Chỉ có current state, không có lịch sử!
```

---

### 3️⃣ Data Freshness & Update Frequency 🕐

#### Bảng So Sánh Chi Tiết

| Storage | Update Mechanism | Freshness | When Data Updates | Delay |
|---------|------------------|-----------|-------------------|-------|
| **Stellio** | Push (real-time write) | Real-time | Mỗi khi entity thay đổi | < 1s |
| **PostgreSQL** | Push (Stellio backend) | Real-time | Đồng thời với Stellio | < 1s |
| **Neo4j** | Pull (periodic sync) | Near real-time | Mỗi 10 phút (Neo4j Sync Agent) | ~10min |
| **Fuseki** | Pull (batch sync) | Batch | Mỗi 5 phút (RDF Loader Agent) | ~5min |
| **Local Files** | Manual (on-demand) | Static | Khi chạy pipeline | Hours-Days |

#### 🔄 Update Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    DATA UPDATE FLOW                         │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  External APIs (Weather, Traffic, AQ)                       │
│         │                                                    │
│         ▼ (Pipeline execution - manual)                     │
│  ┌──────────────┐                                          │
│  │ Local Files  │ ← Static snapshots                       │
│  └──────────────┘                                          │
│         │                                                    │
│         ▼ (Publish via API)                                 │
│  ┌──────────────┐                                          │
│  │   Stellio    │ ← ⚡ REAL-TIME (< 1 second)             │
│  └──────┬───────┘                                          │
│         │                                                    │
│         ├─────────────────┬─────────────────┐              │
│         ▼ (immediate)     ▼ (5 min batch)   ▼ (10 min)    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ PostgreSQL   │  │    Fuseki    │  │    Neo4j     │    │
│  │  (backend)   │  │  (sync agent)│  │ (sync agent) │    │
│  │ ⚡ Real-time  │  │ 📚 Historical│  │ ⚡ Near RT   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

#### 📝 Decision Tree: Which Storage to Query?

```
START: Tôi cần data...
│
├─ ❓ Cần CURRENT STATE (trạng thái hiện tại)?
│  │
│  ├─ YES → ❓ Cần độ trễ < 1 giây?
│  │  │
│  │  ├─ YES → ✅ Stellio (NGSI-LD API)
│  │  │         - Real-time dashboard
│  │  │         - IoT control
│  │  │         - Alert systems
│  │  │
│  │  └─ NO (10 phút OK) → ❓ Cần graph relationships?
│  │     │
│  │     ├─ YES → ✅ Neo4j
│  │     │         - Network analysis
│  │     │         - Recommendation
│  │     │         - Pathfinding
│  │     │
│  │     └─ NO → ✅ Stellio (still best choice)
│  │
│  └─ NO → ❓ Cần HISTORICAL DATA?
│     │
│     ├─ YES → ❓ Time range?
│     │  │
│     │  ├─ < 7 days → ✅ Stellio Temporal API
│     │  │              - Recent trends
│     │  │              - Short-term analysis
│     │  │
│     │  ├─ > 7 days → ✅ Fuseki (RDF)
│     │  │              - Long-term trends
│     │  │              - Business intelligence
│     │  │              - Data auditing
│     │  │
│     │  └─ Need offline → ✅ Local Files
│     │                    - ML training
│     │                    - Backup/restore
│     │                    - ETL pipelines
│     │
│     └─ ❓ Cần SEMANTIC SEARCH?
│        │
│        └─ YES → ✅ Fuseki (SPARQL)
│                  - Ontology reasoning
│                  - Linked data navigation
│                  - Complex queries
│
END
```

---

## 🎯 Decision Matrix: Chọn Storage Theo Yêu Cầu

### Bảng Quyết Định Chi Tiết

| Yêu Cầu | Stellio | Fuseki | Neo4j | PostgreSQL | Local Files |
|---------|---------|---------|--------|-----------|-------------|
| **Real-time access (< 1s)** | ✅ Perfect | ❌ No | ⚠️ Delayed | ✅ Yes* | ❌ No |
| **Historical data (> 7 days)** | ❌ Limited | ✅ Perfect | ❌ No | ⚠️ Possible | ✅ Yes |
| **Geo-spatial queries** | ✅ Native | ⚠️ GeoSPARQL | ❌ Manual | ⚠️ PostGIS | ❌ No |
| **Graph traversal** | ❌ No | ⚠️ SPARQL | ✅ Perfect | ❌ No | ❌ No |
| **Semantic reasoning** | ❌ No | ✅ Perfect | ❌ No | ❌ No | ⚠️ rdflib |
| **Complex joins** | ❌ No | ⚠️ SPARQL | ❌ No | ✅ SQL | ❌ No |
| **Subscriptions/Webhooks** | ✅ Native | ❌ No | ❌ No | ⚠️ Triggers | ❌ No |
| **Offline processing** | ❌ No | ❌ No | ❌ No | ❌ No | ✅ Perfect |
| **Data portability** | ⚠️ Export | ✅ RDF | ⚠️ Export | ⚠️ Dump | ✅ Native |
| **Query performance** | ⚡ Fast | ⚠️ Medium | ⚡ Fast | ⚡ Fast | ⚠️ N/A |
| **Scalability** | ✅ High | ⚠️ Medium | ✅ High | ✅ High | ✅ Unlimited |
| **ACID transactions** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes | ❌ N/A |
| **Time-series analysis** | ⚠️ 7 days | ✅ Forever | ❌ No | ⚠️ Possible | ✅ Yes |

**Legend:**
- ✅ Perfect: Best choice for this requirement
- ⚠️ Possible: Can do but not optimal
- ❌ No: Not supported or very poor
- `*` PostgreSQL: Có thể access nhưng **KHÔNG NÊN** (dùng Stellio API)

---

## 📋 Quick Reference Guide

### "Tôi Cần..." → "Lấy Từ Đâu?"

#### 1. Real-time Monitoring
```
❓ Question: "Hiện tại camera X có online không?"
✅ Answer: Query Stellio
📌 Code:
   GET http://localhost:8080/ngsi-ld/v1/entities/urn:ngsi-ld:Camera:X
   → Check status.value field
```

#### 2. Current Weather
```
❓ Question: "Nhiệt độ hiện tại ở vị trí Y là bao nhiêu?"
✅ Answer: Query Stellio
📌 Code:
   GET http://localhost:8080/ngsi-ld/v1/entities?type=WeatherObserved&georel=near;maxDistance==100&coordinates=[lat,lng]
   → Check temperature.value field
```

#### 3. Historical Trends
```
❓ Question: "AQI trung bình của 30 ngày qua?"
✅ Answer: Query Fuseki
📌 Code:
   SPARQL: SELECT (AVG(?aqi) as ?avg) WHERE {
     GRAPH ?g {
       ?entity schema:airQualityIndex ?aqi ;
               schema:dateObserved ?date .
       FILTER(?date > NOW() - "P30D"^^xsd:duration)
     }
   }
```

#### 4. Network Analysis
```
❓ Question: "Cameras nào gần camera X nhất?"
✅ Answer: Query Neo4j
📌 Code:
   CYPHER: MATCH (c1:Camera {id: "urn:ngsi-ld:Camera:X"})-[:NEAR_BY]-(c2:Camera)
           RETURN c2 ORDER BY distance LIMIT 5
```

#### 5. Related Data
```
❓ Question: "Weather data cho camera X?"
✅ Answer: Query Stellio (with relationships)
📌 Code:
   GET http://localhost:8080/ngsi-ld/v1/entities/urn:ngsi-ld:Camera:X
   → Get refWeatherObserved.object
   GET http://localhost:8080/ngsi-ld/v1/entities/{weatherId}
```

#### 6. Semantic Search
```
❓ Question: "Tất cả sensors quan sát temperature?"
✅ Answer: Query Fuseki
📌 Code:
   SPARQL: SELECT ?sensor ?temp WHERE {
     ?sensor a sosa:Sensor ;
             sosa:observes ?property .
     ?property a sosa:ObservableProperty ;
               rdfs:label "temperature" .
   }
```

#### 7. Machine Learning
```
❓ Question: "Cần dataset để train ML model?"
✅ Answer: Load Local Files
📌 Code:
   Python: df = pd.read_json('data/cameras_enriched.json')
   Or: g = Graph(); g.parse('data/rdf/Camera_*.ttl')
```

#### 8. Data Backup
```
❓ Question: "Backup toàn bộ data?"
✅ Answer: 
   - Stellio: Export via API
   - Fuseki: Download RDF dump
   - Neo4j: neo4j-admin backup
   - Files: Copy data/ directory
📌 Code:
   curl http://localhost:3030/lod-dataset/data -u admin:test_admin > backup.ttl
```

#### 9. Data Integration
```
❓ Question: "Publish data ra LOD cloud?"
✅ Answer: Use Fuseki SPARQL endpoint
📌 Code:
   Public endpoint: http://your-domain:3030/lod-dataset/sparql
   → Other systems can query via federated SPARQL
```

#### 10. Alert System
```
❓ Question: "Thông báo khi PM2.5 > 100?"
✅ Answer: Stellio Subscriptions
📌 Code:
   POST http://localhost:8080/ngsi-ld/v1/subscriptions
   Body: {
     "type": "Subscription",
     "entities": [{"type": "AirQualityObserved"}],
     "q": "pm25>100",
     "notification": {"endpoint": {"uri": "http://alert-service/notify"}}
   }
```

---

## ⚠️ Common Mistakes & Best Practices

### ❌ ĐỪNG LÀM

#### Mistake 1: Query Fuseki cho Real-time Data
```python
# ❌ SAI
sparql = "SELECT ?status WHERE { ?camera schema:status ?status }"
response = fuseki_query(sparql)
status = response['results']['bindings'][0]['status']['value']

# ❌ Vấn đề: Data cũ 5-10 phút, không real-time!
```

**✅ ĐÚNG:**
```python
# ✅ ĐÚNG: Query Stellio
response = requests.get(
    "http://localhost:8080/ngsi-ld/v1/entities/urn:ngsi-ld:Camera:0"
)
status = response.json()['status']['value']  # Real-time!
```

---

#### Mistake 2: Query Stellio cho Long-term Trends
```python
# ❌ SAI
response = requests.get(
    "http://localhost:8080/ngsi-ld/v1/temporal/entities",
    params={
        "timerel": "between",
        "timeAt": "2025-09-01T00:00:00Z",  # 70 days ago
        "endTimeAt": "2025-11-10T00:00:00Z"
    }
)

# ❌ Vấn đề: Stellio chỉ giữ 7 ngày, mất data!
```

**✅ ĐÚNG:**
```python
# ✅ ĐÚNG: Query Fuseki cho historical data
sparql = """
SELECT ?timestamp ?temperature
WHERE {
  GRAPH ?g {
    ?obs sosa:madeBySensor <urn:ngsi-ld:Camera:0> ;
         sosa:resultTime ?timestamp ;
         sosa:hasResult ?result .
    ?result schema:temperature ?temperature .
  }
  FILTER(?timestamp >= "2025-09-01T00:00:00Z"^^xsd:dateTime)
}
ORDER BY ?timestamp
"""
# ✅ Có full history!
```

---

#### Mistake 3: Access PostgreSQL Directly
```python
# ❌ SAI: Bypass Stellio và query PostgreSQL trực tiếp
import asyncpg
import asyncio

async def bad_query():
    conn = await asyncpg.connect(
        host="localhost", database="stellio_search",
        user="stellio_user", password="stellio_test"
    )
    row = await conn.fetchrow("SELECT entity_payload FROM entity_payload WHERE entity_id = 'Camera:0'")
    await conn.close()
    return row

# ❌ Vấn đề: 
#    - Bypass Stellio logic (permissions, validation)
#    - Tight coupling với internal schema
#    - Schema có thể thay đổi trong future versions
```

**✅ ĐÚNG:**
```python
# ✅ ĐÚNG: Dùng Stellio API
response = requests.get(
    "http://localhost:8080/ngsi-ld/v1/entities/urn:ngsi-ld:Camera:0"
)
# ✅ Proper abstraction, stable API contract
```

---

#### Mistake 4: Use Neo4j cho Time-series
```cypher
-- ❌ SAI: Query Neo4j cho historical trends
MATCH (c:Camera)
RETURN c.temperature, c.timestamp
ORDER BY c.timestamp

-- ❌ Vấn đề: Neo4j chỉ lưu current state, không có history!
```

**✅ ĐÚNG:**
```sparql
-- ✅ ĐÚNG: Query Fuseki
SELECT ?timestamp ?temperature
WHERE {
  GRAPH ?g {
    ?obs sosa:madeBySensor ?camera ;
         sosa:resultTime ?timestamp ;
         sosa:hasResult ?result .
    ?result schema:temperature ?temperature .
  }
}
ORDER BY ?timestamp
```

---

### ✅ BEST PRACTICES

#### 1. Caching Strategy
```python
# ✅ Cache real-time data với TTL ngắn
import redis
r = redis.Redis()

def get_camera_status(camera_id):
    # Check cache first (TTL 30 seconds)
    cached = r.get(f"camera:{camera_id}:status")
    if cached:
        return json.loads(cached)
    
    # Cache miss: Query Stellio
    response = requests.get(f"{stellio_url}/entities/{camera_id}")
    data = response.json()
    
    # Cache for 30 seconds
    r.setex(f"camera:{camera_id}:status", 30, json.dumps(data))
    return data
```

#### 2. Hybrid Queries
```python
# ✅ Kết hợp multiple sources cho complete picture
def get_camera_analysis(camera_id):
    # Real-time state từ Stellio
    current = stellio_get(camera_id)
    
    # Historical trends từ Fuseki
    history = fuseki_query(f"""
        SELECT ?timestamp ?aqi
        WHERE {{
            GRAPH ?g {{
                ?obs sosa:madeBySensor <{camera_id}> ;
                     sosa:resultTime ?timestamp ;
                     sosa:hasResult ?result .
                ?result schema:airQualityIndex ?aqi .
            }}
            FILTER(?timestamp > NOW() - "P7D"^^xsd:duration)
        }}
        ORDER BY ?timestamp
    """)
    
    # Network context từ Neo4j
    neighbors = neo4j_query(f"""
        MATCH (c:Camera {{id: "{camera_id}"}})-[:NEAR_BY]-(neighbor)
        RETURN neighbor.id, neighbor.name
    """)
    
    return {
        'current': current,
        'history': history,
        'neighbors': neighbors
    }
```

#### 3. Graceful Degradation
```python
# ✅ Fallback strategy khi storage unavailable
def get_data_with_fallback(entity_id):
    try:
        # Try real-time first
        return stellio_get(entity_id)
    except ConnectionError:
        # Fallback to Neo4j (stale but available)
        try:
            return neo4j_get(entity_id)
        except:
            # Last resort: Local cache
            return load_from_local_cache(entity_id)
```

---

## 📊 Performance Benchmarks

### Query Latency (Average)

| Operation | Stellio | Fuseki | Neo4j | PostgreSQL |
|-----------|---------|---------|--------|-----------|
| **Get single entity** | 50ms | N/A | 200ms | 20ms* |
| **Get 100 entities** | 150ms | N/A | 500ms | 100ms* |
| **Geo-spatial query** | 100ms | 2s | N/A | 150ms* |
| **Time-series query** | 200ms | 3s | N/A | 500ms* |
| **Graph traversal** | N/A | 5s | 300ms | N/A |
| **Complex aggregation** | N/A | 4s | N/A | 200ms* |
| **Pattern matching** | N/A | 6s | 400ms | N/A |

**`*`** PostgreSQL: Measurements qua Stellio API, không direct access

### Throughput (Queries/second)

- **Stellio**: ~100 queries/second
- **Fuseki**: ~20 queries/second (SPARQL complexity-dependent)
- **Neo4j**: ~50 queries/second (graph size-dependent)
- **PostgreSQL**: ~500 queries/second (simple queries)

---

## 🔍 Debugging: "Data Không Đúng?" Checklist

### Khi Data Không Khớp Giữa Các Storage

```
┌──────────────────────────────────────────────────────────┐
│  TROUBLESHOOTING: Data Inconsistency                     │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ❓ Data ở Stellio khác với Neo4j?                       │
│     → BÌNH THƯỜNG! Neo4j sync mỗi 10 phút               │
│     → Check sync logs: docker logs test-neo4j-sync       │
│                                                            │
│  ❓ Data ở Fuseki cũ hơn Stellio?                        │
│     → BÌNH THƯỜNG! Fuseki batch sync 5 phút              │
│     → Check RDF Loader logs                              │
│                                                            │
│  ❓ Local files không có entity mới?                     │
│     → BÌNH THƯỜNG! Files chỉ update khi chạy pipeline    │
│     → Run: python main.py để refresh                     │
│                                                            │
│  ❓ Stellio và PostgreSQL khác nhau?                     │
│     → BẤT THƯỜNG! Phải giống nhau                        │
│     → Check Stellio logs: docker logs test-stellio       │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Verification Script
```python
# Check data consistency across storages
import requests
from requests.auth import HTTPBasicAuth

camera_id = "urn:ngsi-ld:Camera:0"

# 1. Stellio (source of truth)
stellio_data = requests.get(
    f"http://localhost:8080/ngsi-ld/v1/entities/{camera_id}"
).json()
stellio_temp = stellio_data['temperature']['value']
stellio_time = stellio_data['temperature']['observedAt']

print(f"Stellio: {stellio_temp}°C at {stellio_time}")

# 2. Neo4j (should be within 10 minutes)
neo4j_auth = HTTPBasicAuth('neo4j', 'test12345')
neo4j_response = requests.post(
    "http://localhost:7474/db/neo4j/tx/commit",
    json={"statements": [{
        "statement": f"MATCH (c:Camera {{id: '{camera_id}'}}) RETURN c.temperature, c.dateModified"
    }]},
    auth=neo4j_auth
).json()
neo4j_temp = neo4j_response['results'][0]['data'][0]['row'][0]
neo4j_time = neo4j_response['results'][0]['data'][0]['row'][1]

print(f"Neo4j: {neo4j_temp}°C at {neo4j_time}")
print(f"Difference: {abs(stellio_temp - neo4j_temp)}°C")

# 3. Fuseki (historical, might be older)
fuseki_auth = HTTPBasicAuth('admin', 'test_admin')
sparql = f"""
SELECT ?temp ?time WHERE {{
  GRAPH ?g {{
    <{camera_id}> schema:temperature ?temp ;
                  schema:dateModified ?time .
  }}
}}
ORDER BY DESC(?time)
LIMIT 1
"""
fuseki_response = requests.post(
    "http://localhost:3030/lod-dataset/sparql",
    data={'query': sparql},
    headers={'Accept': 'application/sparql-results+json'},
    auth=fuseki_auth
).json()

if fuseki_response['results']['bindings']:
    binding = fuseki_response['results']['bindings'][0]
    fuseki_temp = float(binding['temp']['value'])
    fuseki_time = binding['time']['value']
    print(f"Fuseki: {fuseki_temp}°C at {fuseki_time}")
else:
    print("Fuseki: No data yet (sync pending)")

# Verdict
print("\n✅ All systems should show similar values (±10 min staleness OK)")
```

---

## 2. Stellio Context Broker (NGSI-LD)

### 🔌 Connection Info

```yaml
Base URL: http://localhost:8080
API Path: /ngsi-ld/v1
Protocol: HTTP REST API
Format: JSON-LD
Authentication: None required
```

### 📥 Get All Entities

#### Request
```http
GET http://localhost:8080/ngsi-ld/v1/entities?type=Camera&limit=100
Accept: application/ld+json
```

#### Python Example
```python
import requests

# Get all cameras
cameras = requests.get(
    "http://localhost:8080/ngsi-ld/v1/entities?type=Camera&limit=100"
).json()

print(f"Total cameras: {len(cameras)}")
for camera in cameras:
    print(f"- {camera['id']}: {camera.get('cameraName', {}).get('value', 'N/A')}")
```

### 🌡️ Get Weather Data

```python
weather = requests.get(
    "http://localhost:8080/ngsi-ld/v1/entities?type=WeatherObserved&limit=100"
).json()

for w in weather:
    print(f"Weather at {w['id']}:")
    print(f"  Temperature: {w.get('temperature', {}).get('value')} °C")
    print(f"  Humidity: {w.get('relativeHumidity', {}).get('value')} %")
```

### 🌫️ Get Air Quality Data

```python
airquality = requests.get(
    "http://localhost:8080/ngsi-ld/v1/entities?type=AirQualityObserved&limit=100"
).json()

for aq in airquality:
    print(f"Air Quality at {aq['id']}:")
    print(f"  AQI: {aq.get('airQualityIndex', {}).get('value')}")
    print(f"  PM2.5: {aq.get('pm25', {}).get('value')} μg/m³")
```

### 🔍 Query by Location (GeoJSON)

```python
# Get entities within radius
response = requests.get(
    "http://localhost:8080/ngsi-ld/v1/entities",
    params={
        "type": "Camera",
        "georel": "near;maxDistance==5000",  # 5km radius
        "geometry": "Point",
        "coordinates": "[10.8231, 106.6297]"  # Ho Chi Minh City
    }
)
```

### 📊 Get Specific Entity by ID

```python
# Get camera by URN
entity_id = "urn:ngsi-ld:Camera:0"
camera = requests.get(
    f"http://localhost:8080/ngsi-ld/v1/entities/{entity_id}"
).json()

print(f"Camera Name: {camera['cameraName']['value']}")
print(f"Location: {camera['location']['value']['coordinates']}")
print(f"Status: {camera.get('status', {}).get('value', 'unknown')}")
```

### 🔗 Get Related Entities

```python
# Get weather data for specific camera
camera_id = "urn:ngsi-ld:Camera:0"
weather_id = f"urn:ngsi-ld:WeatherObserved:{camera_id.split(':')[-1]}"

weather = requests.get(
    f"http://localhost:8080/ngsi-ld/v1/entities/{weather_id}"
).json()
```

### 📝 Entity Structure Example

```json
{
  "id": "urn:ngsi-ld:Camera:0",
  "type": "Camera",
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "cameraName": {
    "type": "Property",
    "value": "Nguyễn Văn Linh - Nguyễn Hữu Thọ"
  },
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.70752, 10.73291]
    }
  },
  "cameraType": {
    "type": "Property",
    "value": "PTZ"
  },
  "streamUrl": {
    "type": "Property",
    "value": "rtsp://..."
  },
  "dateModified": {
    "type": "Property",
    "value": "2025-11-10T00:00:00Z"
  }
}
```

---

## 3. Apache Jena Fuseki (RDF Triplestore)

### 🔌 Connection Info

```yaml
Base URL: http://localhost:3030
Dataset: lod-dataset
SPARQL Endpoint: /lod-dataset/sparql
Update Endpoint: /lod-dataset/update
Data Endpoint: /lod-dataset/data
Authentication: Basic (admin / test_admin)
```

### 📥 Query All Triples

#### SPARQL Query
```sparql
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o
}
LIMIT 1000
```

#### Python Example
```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth('admin', 'test_admin')
sparql_endpoint = "http://localhost:3030/lod-dataset/sparql"

query = """
SELECT ?s ?p ?o
WHERE {
  ?s ?p ?o
}
LIMIT 1000
"""

response = requests.post(
    sparql_endpoint,
    data={'query': query},
    headers={'Accept': 'application/sparql-results+json'},
    auth=auth
)

results = response.json()
print(f"Total bindings: {len(results['results']['bindings'])}")
```

### 🎯 Query Cameras from Named Graphs

```sparql
SELECT ?camera ?name ?lat ?lng
WHERE {
  GRAPH ?g {
    ?camera a <http://www.w3.org/ns/sosa/Sensor> .
    ?camera <http://schema.org/name> ?name .
    ?camera <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat .
    ?camera <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?lng .
  }
}
```

### 📊 Count Triples

```sparql
SELECT (COUNT(*) as ?count)
WHERE {
  { ?s ?p ?o }
  UNION
  { GRAPH ?g { ?s ?p ?o } }
}
```

### 🗂️ List All Named Graphs

```sparql
SELECT DISTINCT ?g (COUNT(?s) as ?triples)
WHERE {
  GRAPH ?g {
    ?s ?p ?o
  }
}
GROUP BY ?g
ORDER BY DESC(?triples)
```

### 📥 Download RDF Data

#### Get Graph in Turtle Format
```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth('admin', 'test_admin')

# Download specific named graph
graph_uri = "http://example.org/graphs/Camera_20251110_001029"
response = requests.get(
    "http://localhost:3030/lod-dataset/data",
    params={'graph': graph_uri},
    headers={'Accept': 'text/turtle'},
    auth=auth
)

with open('camera_data.ttl', 'w', encoding='utf-8') as f:
    f.write(response.text)
```

#### Get All Data in Different Formats
```python
# Available formats
formats = {
    'turtle': 'text/turtle',
    'rdfxml': 'application/rdf+xml',
    'jsonld': 'application/ld+json',
    'ntriples': 'application/n-triples'
}

for format_name, mime_type in formats.items():
    response = requests.get(
        "http://localhost:3030/lod-dataset/data",
        headers={'Accept': mime_type},
        auth=auth
    )
    
    with open(f'all_data.{format_name}', 'w', encoding='utf-8') as f:
        f.write(response.text)
```

### 🔍 Advanced SPARQL Queries

#### Get Cameras with Weather Data
```sparql
PREFIX schema: <http://schema.org/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX sosa: <http://www.w3.org/ns/sosa/>

SELECT ?camera ?name ?temp ?humidity
WHERE {
  GRAPH ?cameraGraph {
    ?camera a sosa:Sensor ;
            schema:name ?name .
  }
  
  OPTIONAL {
    GRAPH ?weatherGraph {
      ?weather schema:temperature ?temp ;
               schema:humidity ?humidity .
    }
  }
}
```

#### Get All Properties of a Resource
```sparql
PREFIX schema: <http://schema.org/>

SELECT ?property ?value
WHERE {
  GRAPH ?g {
    <urn:ngsi-ld:Camera:0> ?property ?value .
  }
}
```

---

## 4. Neo4j Graph Database

### 🔌 Connection Info

```yaml
Bolt URL: bolt://localhost:7687
HTTP URL: http://localhost:7474
Browser UI: http://localhost:7474/browser
Username: neo4j
Password: test12345
Database: neo4j
```

### 📥 Access via Browser UI

1. Mở browser: `http://localhost:7474/browser`
2. Login với credentials trên
3. Chạy Cypher queries trong console

### 🔍 Cypher Query Examples

#### Get All Cameras
```cypher
MATCH (c:Camera)
RETURN c.id, c.cameraName, c.location
LIMIT 100
```

#### Get Camera with Weather
```cypher
MATCH (c:Camera)
OPTIONAL MATCH (w:WeatherObserved {refDevice: c.id})
RETURN c.cameraName, w.temperature, w.humidity
```

#### Get Camera with Air Quality
```cypher
MATCH (c:Camera)
OPTIONAL MATCH (aq:AirQualityObserved {refDevice: c.id})
RETURN c.cameraName, aq.pm25, aq.airQualityIndex
```

#### Graph Visualization
```cypher
MATCH (c:Camera)-[r]->(related)
RETURN c, r, related
LIMIT 50
```

### 🐍 Python Example (using neo4j driver)

```python
from neo4j import GraphDatabase

# Connect to Neo4j
driver = GraphDatabase.driver(
    "bolt://localhost:7687",
    auth=("neo4j", "test12345")
)

# Query cameras
with driver.session(database="neo4j") as session:
    result = session.run("""
        MATCH (c:Camera)
        RETURN c.id as id, c.cameraName as name, c.location as location
        LIMIT 100
    """)
    
    cameras = list(result)
    print(f"Total cameras: {len(cameras)}")
    
    for record in cameras:
        print(f"Camera: {record['name']}")
        print(f"  ID: {record['id']}")
        print(f"  Location: {record['location']}")

driver.close()
```

### 📊 Export Neo4j Data

#### Export to JSON
```cypher
CALL apoc.export.json.all("all_data.json", {
    useTypes: true,
    storeNodeIds: false
})
```

#### Export to CSV
```cypher
MATCH (c:Camera)
RETURN c.id, c.cameraName, c.location, c.cameraType
```

### 🔗 REST API Examples

```python
import requests
from requests.auth import HTTPBasicAuth

auth = HTTPBasicAuth('neo4j', 'test12345')
headers = {'Content-Type': 'application/json'}

# Count all nodes
query = {
    "statements": [
        {"statement": "MATCH (n) RETURN count(n) as total"}
    ]
}

response = requests.post(
    "http://localhost:7474/db/neo4j/tx/commit",
    json=query,
    headers=headers,
    auth=auth
)

result = response.json()
total_nodes = result['results'][0]['data'][0]['row'][0]
print(f"Total nodes in Neo4j: {total_nodes}")
```

---

## 5. PostgreSQL Database

### 🔌 Connection Info

```yaml
Host: localhost
Port: 5432
Database: stellio_search
Username: stellio_user
Password: stellio_test
```

### 📥 Connect and Query

#### Using psql
```bash
psql -h localhost -p 5432 -U stellio_user -d stellio_search
# Password: stellio_test
```

#### Python Example
```python
import asyncpg
import asyncio
import json

async def query_entities():
    # Connect to PostgreSQL using asyncpg (Apache-2.0, MIT-compatible)
    conn = await asyncpg.connect(
        host="localhost",
        port=5432,
        database="stellio_search",
        user="stellio_user",
        password="stellio_test"
    )

    # Query entity_payload table (where NGSI-LD entities are stored)
    rows = await conn.fetch("""
        SELECT entity_id, entity_type, entity_payload 
        FROM entity_payload 
        LIMIT 100
    """)

    print(f"Total entities: {len(rows)}")

    for row in rows:
        entity_id = row['entity_id']
        entity_type = row['entity_type']
        payload = row['entity_payload']
        
        print(f"\nEntity: {entity_id}")
        print(f"Type: {entity_type}")
        
        # Parse JSON payload (asyncpg returns dict for jsonb columns)
        if isinstance(payload, str):
            data = json.loads(payload)
        else:
            data = payload
        print(f"Data: {json.dumps(data, indent=2)[:200]}...")

    await conn.close()

# Run the async function
asyncio.run(query_entities())
```

### 📊 Useful SQL Queries

#### Count Entities by Type
```sql
SELECT entity_type, COUNT(*) as count
FROM entity_payload
GROUP BY entity_type
ORDER BY count DESC;
```

#### Get All Camera Entities
```sql
SELECT entity_id, entity_payload
FROM entity_payload
WHERE entity_type = 'Camera';
```

#### Search by Attribute
```sql
SELECT entity_id, entity_payload
FROM entity_payload
WHERE entity_payload::jsonb @> '{"cameraType": {"value": "PTZ"}}';
```

#### Get Entities Modified After Date
```sql
SELECT entity_id, modified_at
FROM entity_payload
WHERE modified_at > '2025-11-10'
ORDER BY modified_at DESC;
```

---

## 6. Local File Storage

### 📂 File Structure

```
data/
├── rdf/                          # RDF Turtle files
│   ├── Camera_20251110_001029.ttl
│   ├── Camera_20251109_235420.ttl
│   ├── ObservableProperty_*.ttl
│   └── ... (48 files total)
│
├── cameras_updated.json          # 40 cameras with basic info
├── cameras_enriched.json         # 40 cameras + weather + air quality
├── ngsi_ld_entities.json         # 120 NGSI-LD entities
├── observations.json             # 40 CV analysis observations
│
└── reports/
    ├── triplestore_load_*.json   # Fuseki load statistics
    └── workflow_report_*.json    # Pipeline execution reports
```

### 📥 Read Local RDF Files

```python
from pathlib import Path
from rdflib import Graph

# Load single RDF file
g = Graph()
g.parse("data/rdf/Camera_20251110_001029.ttl", format="turtle")

print(f"Triples in file: {len(g)}")

# Query triples
for subject, predicate, obj in g:
    print(f"{subject} -- {predicate} --> {obj}")

# Load all RDF files
rdf_dir = Path("data/rdf")
combined_graph = Graph()

for ttl_file in rdf_dir.glob("*.ttl"):
    combined_graph.parse(ttl_file, format="turtle")
    print(f"Loaded {ttl_file.name}: {len(combined_graph)} triples total")

print(f"\nTotal triples from all files: {len(combined_graph)}")
```

### 📥 Read JSON Files

```python
import json
from pathlib import Path

# Read cameras with enrichment
with open('data/cameras_enriched.json', 'r', encoding='utf-8') as f:
    cameras = json.load(f)

print(f"Total cameras: {len(cameras)}")

for camera in cameras[:3]:  # Show first 3
    print(f"\nCamera: {camera['name']}")
    print(f"  Code: {camera['code']}")
    print(f"  Location: ({camera['latitude']}, {camera['longitude']})")
    
    # Weather data
    if 'weather' in camera:
        print(f"  Temperature: {camera['weather']['temperature']} °C")
        print(f"  Humidity: {camera['weather']['humidity']} %")
    
    # Air quality data
    if 'air_quality' in camera:
        print(f"  AQI: {camera['air_quality']['aqi']}")
        print(f"  PM2.5: {camera['air_quality']['pm25']} μg/m³")
```

### 📥 Read NGSI-LD Entities

```python
with open('data/ngsi_ld_entities.json', 'r', encoding='utf-8') as f:
    entities = json.load(f)

# Group by type
by_type = {}
for entity in entities:
    entity_type = entity['type']
    by_type[entity_type] = by_type.get(entity_type, 0) + 1

print("Entities by type:")
for entity_type, count in by_type.items():
    print(f"  {entity_type}: {count}")
```

### 📥 Read Reports

```python
import glob

# Find latest workflow report
reports = glob.glob("data/reports/workflow_report_*.json")
latest_report = max(reports)

with open(latest_report, 'r') as f:
    report = json.load(f)

print(f"Workflow Report: {report['timestamp']}")
print(f"Total Duration: {report['total_duration_seconds']}s")
print(f"Phases Completed: {report['phases_completed']}/{report['total_phases']}")

for phase in report['phases']:
    print(f"\nPhase: {phase['name']}")
    print(f"  Status: {phase['status']}")
    print(f"  Duration: {phase['duration_seconds']}s")
    print(f"  Agents: {len(phase['agents'])}")
```

---

## 9. 🆕 Analytics Data: Accidents & Patterns

> **Phần này hướng dẫn chi tiết về cách truy cập và khai thác dữ liệu analytics từ 2 agents mới được kích hoạt:**
> - **Accident Detection Agent**: Phát hiện tai nạn giao thông và các sự cố
> - **Pattern Recognition Agent**: Nhận diện các mẫu giao thông và dự đoán

### 📊 Tổng Quan

Kể từ PHASE 7.5 mới được thêm vào pipeline, **accidents** và **patterns** data giờ đây được lưu trữ đầy đủ trong tất cả các storage systems:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYTICS DATA FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 5: ANALYTICS                                             │
│  ├─ accident_detection_agent ✅ ENABLED                         │
│  │  └─ Output: accidents.json (RoadAccident entities)          │
│  │             accident_alerts.json (Alert notifications)      │
│  │                                                              │
│  └─ pattern_recognition_agent ✅ ENABLED                        │
│     └─ Output: patterns.json (TrafficPattern entities)         │
│                predictions.json (Traffic predictions)          │
│                anomalies.json (Traffic anomalies)              │
│                                                                 │
│  PHASE 7.5: ACCIDENTS & PATTERNS DATA LOOP (NEW!)              │
│  ├─ Validate → Stellio → RDF → Fuseki                          │
│  └─ Result: Queryable via NGSI-LD API + SPARQL                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🗄️ Storage Locations

| Data Type | Local Files | Stellio | Fuseki | Neo4j |
|-----------|-------------|---------|--------|-------|
| **RoadAccident** | ✅ `data/accidents.json`<br>✅ `data/validated_accidents.json`<br>✅ `data/rdf_accidents/*.ttl` | ✅ NGSI-LD entities | ✅ RDF triples<br>(named graphs) | ❌ Not synced |
| **TrafficPattern** | ✅ `data/patterns.json`<br>✅ `data/validated_patterns.json`<br>✅ `data/rdf_patterns/*.ttl` | ✅ NGSI-LD entities | ✅ RDF triples<br>(named graphs) | ❌ Not synced |
| **Predictions** | ✅ `data/predictions.json` | ❌ Report file only | ❌ Report file only | ❌ Not synced |
| **Anomalies** | ✅ `data/anomalies.json` | ❌ Report file only | ❌ Report file only | ❌ Not synced |
| **Accident Alerts** | ✅ `data/accident_alerts.json` | ❌ Notification only | ❌ Notification only | ❌ Not synced |

---

### 🚨 9.1. Accident Data (RoadAccident)

#### 📋 Entity Schema

```json
{
  "id": "urn:ngsi-ld:RoadAccident:ACC_20251110_101500_TTH406",
  "type": "RoadAccident",
  "@context": [
    "https://raw.githubusercontent.com/smart-data-models/dataModel.Transportation/master/context.jsonld",
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "location": {
    "type": "GeoProperty",
    "value": {
      "type": "Point",
      "coordinates": [106.6297, 10.8231]
    }
  },
  "dateDetected": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2025-11-10T10:15:00Z"
    }
  },
  "accidentType": {
    "type": "Property",
    "value": "sudden_stop"
  },
  "severity": {
    "type": "Property",
    "value": "moderate"
  },
  "affectedCamera": {
    "type": "Relationship",
    "object": "urn:ngsi-ld:Camera:TTH406"
  },
  "vehicleCount": {
    "type": "Property",
    "value": 45
  },
  "speedVariance": {
    "type": "Property",
    "value": 0.82,
    "unitCode": "P1"
  },
  "confidence": {
    "type": "Property",
    "value": 0.87
  },
  "description": {
    "type": "Property",
    "value": "Sudden stop detected - possible accident or breakdown"
  }
}
```

#### 🔍 Truy Cập Accidents từ Stellio

**1. Lấy tất cả accidents:**

```bash
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=RoadAccident" \
  -H "Accept: application/ld+json"
```

**2. Lọc accidents theo severity:**

```bash
# Get only severe accidents
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=RoadAccident&q=severity==%22severe%22" \
  -H "Accept: application/ld+json"
```

**3. Lọc theo thời gian:**

```bash
# Accidents detected in last 24 hours
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=RoadAccident&q=dateDetected>2025-11-09T00:00:00Z" \
  -H "Accept: application/ld+json"
```

**4. Lấy accidents tại camera cụ thể:**

```bash
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=RoadAccident&q=affectedCamera==%22urn:ngsi-ld:Camera:TTH406%22" \
  -H "Accept: application/ld+json"
```

#### 📊 SPARQL Queries cho Accidents (Fuseki)

**Query 1: Thống kê accidents theo severity**

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?severity (COUNT(?accident) AS ?count)
WHERE {
  ?accident rdf:type <https://smartdatamodels.org/dataModel.Transportation/RoadAccident> .
  ?accident ngsi-ld:severity ?severityNode .
  ?severityNode ngsi-ld:hasValue ?severity .
}
GROUP BY ?severity
ORDER BY DESC(?count)
```

**Query 2: Accidents gần camera cụ thể (geospatial)**

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

SELECT ?accident ?dateDetected ?severity ?distance
WHERE {
  ?accident rdf:type <https://smartdatamodels.org/dataModel.Transportation/RoadAccident> .
  ?accident ngsi-ld:location ?locationNode .
  ?locationNode geo:lat ?lat .
  ?locationNode geo:long ?long .
  ?accident ngsi-ld:dateDetected ?dateNode .
  ?dateNode ngsi-ld:hasValue ?dateDetected .
  ?accident ngsi-ld:severity ?sevNode .
  ?sevNode ngsi-ld:hasValue ?severity .
  
  # Calculate distance from reference point (106.6297, 10.8231)
  BIND(SQRT(POW(?lat - 10.8231, 2) + POW(?long - 106.6297, 2)) AS ?distance)
  
  FILTER(?distance < 0.01)  # Within ~1km radius
}
ORDER BY ?distance
LIMIT 10
```

**Query 3: Accidents timeline (24 giờ qua)**

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?accident ?dateDetected ?accidentType ?severity ?camera
WHERE {
  ?accident rdf:type <https://smartdatamodels.org/dataModel.Transportation/RoadAccident> .
  ?accident ngsi-ld:dateDetected ?dateNode .
  ?dateNode ngsi-ld:hasValue ?dateDetected .
  ?accident ngsi-ld:accidentType ?typeNode .
  ?typeNode ngsi-ld:hasValue ?accidentType .
  ?accident ngsi-ld:severity ?sevNode .
  ?sevNode ngsi-ld:hasValue ?severity .
  ?accident ngsi-ld:affectedCamera ?cameraNode .
  ?cameraNode ngsi-ld:hasObject ?camera .
  
  FILTER(?dateDetected > "2025-11-09T00:00:00Z"^^xsd:dateTime)
}
ORDER BY DESC(?dateDetected)
```

#### 🐍 Python Code: Extract Accidents

```python
import requests
import json
from datetime import datetime, timedelta

class AccidentDataExtractor:
    """Extract accident data from Stellio and Fuseki"""
    
    def __init__(self):
        self.stellio_url = "http://localhost:8080/ngsi-ld/v1"
        self.fuseki_url = "http://localhost:3030/lod/sparql"
    
    def get_all_accidents(self):
        """Get all accidents from Stellio"""
        url = f"{self.stellio_url}/entities"
        params = {
            "type": "RoadAccident"
        }
        headers = {
            "Accept": "application/ld+json"
        }
        
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error: {response.status_code} - {response.text}")
    
    def get_severe_accidents(self):
        """Get only severe accidents"""
        url = f"{self.stellio_url}/entities"
        params = {
            "type": "RoadAccident",
            "q": 'severity=="severe"'
        }
        headers = {
            "Accept": "application/ld+json"
        }
        
        response = requests.get(url, params=params, headers=headers)
        return response.json() if response.status_code == 200 else []
    
    def get_recent_accidents(self, hours=24):
        """Get accidents in last N hours"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        cutoff_str = cutoff_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        url = f"{self.stellio_url}/entities"
        params = {
            "type": "RoadAccident",
            "q": f"dateDetected>{cutoff_str}"
        }
        headers = {
            "Accept": "application/ld+json"
        }
        
        response = requests.get(url, params=params, headers=headers)
        return response.json() if response.status_code == 200 else []
    
    def get_accident_statistics(self):
        """Get accident statistics via SPARQL"""
        query = """
        PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        
        SELECT ?severity (COUNT(?accident) AS ?count)
        WHERE {
          ?accident rdf:type <https://smartdatamodels.org/dataModel.Transportation/RoadAccident> .
          ?accident ngsi-ld:severity ?severityNode .
          ?severityNode ngsi-ld:hasValue ?severity .
        }
        GROUP BY ?severity
        ORDER BY DESC(?count)
        """
        
        headers = {
            "Accept": "application/sparql-results+json"
        }
        data = {
            "query": query
        }
        
        response = requests.post(self.fuseki_url, data=data, headers=headers)
        
        if response.status_code == 200:
            results = response.json()
            return results['results']['bindings']
        else:
            raise Exception(f"SPARQL Error: {response.status_code}")
    
    def export_accidents_to_csv(self, output_file="accidents_export.csv"):
        """Export accidents to CSV"""
        import pandas as pd
        
        accidents = self.get_all_accidents()
        
        # Transform NGSI-LD to flat structure
        records = []
        for accident in accidents:
            record = {
                "id": accident.get("id", ""),
                "dateDetected": accident.get("dateDetected", {}).get("value", {}).get("@value", ""),
                "accidentType": accident.get("accidentType", {}).get("value", ""),
                "severity": accident.get("severity", {}).get("value", ""),
                "affectedCamera": accident.get("affectedCamera", {}).get("object", ""),
                "vehicleCount": accident.get("vehicleCount", {}).get("value", ""),
                "confidence": accident.get("confidence", {}).get("value", ""),
                "description": accident.get("description", {}).get("value", "")
            }
            
            # Extract location
            location = accident.get("location", {}).get("value", {})
            if location:
                coords = location.get("coordinates", [])
                record["longitude"] = coords[0] if len(coords) > 0 else None
                record["latitude"] = coords[1] if len(coords) > 1 else None
            
            records.append(record)
        
        df = pd.DataFrame(records)
        df.to_csv(output_file, index=False)
        print(f"✅ Exported {len(records)} accidents to {output_file}")
        return df

# Usage
extractor = AccidentDataExtractor()

# Get all accidents
all_accidents = extractor.get_all_accidents()
print(f"Total accidents: {len(all_accidents)}")

# Get severe accidents only
severe = extractor.get_severe_accidents()
print(f"Severe accidents: {len(severe)}")

# Get recent accidents (last 24h)
recent = extractor.get_recent_accidents(hours=24)
print(f"Recent accidents (24h): {len(recent)}")

# Get statistics
stats = extractor.get_accident_statistics()
print("\nAccident Statistics by Severity:")
for stat in stats:
    print(f"  {stat['severity']['value']}: {stat['count']['value']} accidents")

# Export to CSV
df = extractor.export_accidents_to_csv("accidents_export.csv")
```

---

### 📈 9.2. Pattern Data (TrafficPattern)

#### 📋 Entity Schema

```json
{
  "id": "urn:ngsi-ld:TrafficPattern:PATTERN_20251110_MORNING_RUSH",
  "type": "TrafficPattern",
  "@context": [
    "https://raw.githubusercontent.com/smart-data-models/dataModel.Transportation/master/context.jsonld",
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
  ],
  "name": {
    "type": "Property",
    "value": "Morning Rush Hour Pattern - District 1"
  },
  "patternType": {
    "type": "Property",
    "value": "rush_hour"
  },
  "timeRange": {
    "type": "Property",
    "value": {
      "start": "07:00:00",
      "end": "09:00:00"
    }
  },
  "daysOfWeek": {
    "type": "Property",
    "value": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  },
  "averageVehicleCount": {
    "type": "Property",
    "value": 78,
    "unitCode": "C62"
  },
  "peakVehicleCount": {
    "type": "Property",
    "value": 95,
    "unitCode": "C62"
  },
  "averageSpeed": {
    "type": "Property",
    "value": 15.5,
    "unitCode": "KMH"
  },
  "congestionLevel": {
    "type": "Property",
    "value": "high"
  },
  "confidence": {
    "type": "Property",
    "value": 0.92
  },
  "affectedCameras": {
    "type": "Relationship",
    "object": [
      "urn:ngsi-ld:Camera:TTH406",
      "urn:ngsi-ld:Camera:TTH407",
      "urn:ngsi-ld:Camera:TTH408"
    ]
  },
  "dateObserved": {
    "type": "Property",
    "value": {
      "@type": "DateTime",
      "@value": "2025-11-10T08:00:00Z"
    }
  }
}
```

#### 🔍 Truy Cập Patterns từ Stellio

**1. Lấy tất cả patterns:**

```bash
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=TrafficPattern" \
  -H "Accept: application/ld+json"
```

**2. Lọc patterns theo loại:**

```bash
# Get rush hour patterns only
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=TrafficPattern&q=patternType==%22rush_hour%22" \
  -H "Accept: application/ld+json"
```

**3. Lọc theo congestion level:**

```bash
# Get high congestion patterns
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=TrafficPattern&q=congestionLevel==%22high%22" \
  -H "Accept: application/ld+json"
```

**4. Tìm patterns ảnh hưởng camera cụ thể:**

```bash
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=TrafficPattern&q=affectedCameras==%22urn:ngsi-ld:Camera:TTH406%22" \
  -H "Accept: application/ld+json"
```

#### 📊 SPARQL Queries cho Patterns (Fuseki)

**Query 1: Top congestion patterns**

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?pattern ?name ?congestionLevel ?avgVehicleCount ?confidence
WHERE {
  ?pattern rdf:type <https://smartdatamodels.org/dataModel.Transportation/TrafficPattern> .
  ?pattern ngsi-ld:name ?nameNode .
  ?nameNode ngsi-ld:hasValue ?name .
  ?pattern ngsi-ld:congestionLevel ?congNode .
  ?congNode ngsi-ld:hasValue ?congestionLevel .
  ?pattern ngsi-ld:averageVehicleCount ?avgNode .
  ?avgNode ngsi-ld:hasValue ?avgVehicleCount .
  ?pattern ngsi-ld:confidence ?confNode .
  ?confNode ngsi-ld:hasValue ?confidence .
  
  FILTER(?confidence > 0.8)
}
ORDER BY DESC(?avgVehicleCount)
LIMIT 10
```

**Query 2: Rush hour patterns by time range**

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>

SELECT ?pattern ?name ?patternType ?timeRange ?avgSpeed
WHERE {
  ?pattern rdf:type <https://smartdatamodels.org/dataModel.Transportation/TrafficPattern> .
  ?pattern ngsi-ld:name ?nameNode .
  ?nameNode ngsi-ld:hasValue ?name .
  ?pattern ngsi-ld:patternType ?typeNode .
  ?typeNode ngsi-ld:hasValue ?patternType .
  ?pattern ngsi-ld:timeRange ?timeNode .
  ?timeNode ngsi-ld:hasValue ?timeRange .
  ?pattern ngsi-ld:averageSpeed ?speedNode .
  ?speedNode ngsi-ld:hasValue ?avgSpeed .
  
  FILTER(?patternType = "rush_hour")
}
ORDER BY ?timeRange
```

**Query 3: Patterns correlation với cameras**

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>

SELECT ?pattern ?camera ?congestionLevel ?avgVehicleCount
WHERE {
  ?pattern rdf:type <https://smartdatamodels.org/dataModel.Transportation/TrafficPattern> .
  ?pattern ngsi-ld:affectedCameras ?cameraNode .
  ?cameraNode ngsi-ld:hasObject ?camera .
  ?pattern ngsi-ld:congestionLevel ?congNode .
  ?congNode ngsi-ld:hasValue ?congestionLevel .
  ?pattern ngsi-ld:averageVehicleCount ?avgNode .
  ?avgNode ngsi-ld:hasValue ?avgVehicleCount .
}
ORDER BY ?camera DESC(?avgVehicleCount)
```

#### 🐍 Python Code: Extract Patterns

```python
import requests
import json
from datetime import datetime

class PatternDataExtractor:
    """Extract traffic pattern data from Stellio and Fuseki"""
    
    def __init__(self):
        self.stellio_url = "http://localhost:8080/ngsi-ld/v1"
        self.fuseki_url = "http://localhost:3030/lod/sparql"
    
    def get_all_patterns(self):
        """Get all traffic patterns from Stellio"""
        url = f"{self.stellio_url}/entities"
        params = {
            "type": "TrafficPattern"
        }
        headers = {
            "Accept": "application/ld+json"
        }
        
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Error: {response.status_code} - {response.text}")
    
    def get_rush_hour_patterns(self):
        """Get rush hour patterns only"""
        url = f"{self.stellio_url}/entities"
        params = {
            "type": "TrafficPattern",
            "q": 'patternType=="rush_hour"'
        }
        headers = {
            "Accept": "application/ld+json"
        }
        
        response = requests.get(url, params=params, headers=headers)
        return response.json() if response.status_code == 200 else []
    
    def get_high_congestion_patterns(self):
        """Get patterns with high congestion level"""
        url = f"{self.stellio_url}/entities"
        params = {
            "type": "TrafficPattern",
            "q": 'congestionLevel=="high"'
        }
        headers = {
            "Accept": "application/ld+json"
        }
        
        response = requests.get(url, params=params, headers=headers)
        return response.json() if response.status_code == 200 else []
    
    def get_patterns_by_camera(self, camera_id):
        """Get patterns affecting specific camera"""
        url = f"{self.stellio_url}/entities"
        params = {
            "type": "TrafficPattern",
            "q": f'affectedCameras=="{camera_id}"'
        }
        headers = {
            "Accept": "application/ld+json"
        }
        
        response = requests.get(url, params=params, headers=headers)
        return response.json() if response.status_code == 200 else []
    
    def get_pattern_statistics(self):
        """Get pattern statistics via SPARQL"""
        query = """
        PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        
        SELECT ?congestionLevel (COUNT(?pattern) AS ?count) (AVG(?avgVehicles) AS ?avgVehicleCount)
        WHERE {
          ?pattern rdf:type <https://smartdatamodels.org/dataModel.Transportation/TrafficPattern> .
          ?pattern ngsi-ld:congestionLevel ?congNode .
          ?congNode ngsi-ld:hasValue ?congestionLevel .
          ?pattern ngsi-ld:averageVehicleCount ?avgNode .
          ?avgNode ngsi-ld:hasValue ?avgVehicles .
        }
        GROUP BY ?congestionLevel
        ORDER BY DESC(?count)
        """
        
        headers = {
            "Accept": "application/sparql-results+json"
        }
        data = {
            "query": query
        }
        
        response = requests.post(self.fuseki_url, data=data, headers=headers)
        
        if response.status_code == 200:
            results = response.json()
            return results['results']['bindings']
        else:
            raise Exception(f"SPARQL Error: {response.status_code}")
    
    def analyze_rush_hours(self):
        """Analyze rush hour patterns"""
        patterns = self.get_rush_hour_patterns()
        
        analysis = {
            "morning_rush": [],
            "evening_rush": [],
            "all_day": []
        }
        
        for pattern in patterns:
            time_range = pattern.get("timeRange", {}).get("value", {})
            start = time_range.get("start", "")
            
            if start:
                hour = int(start.split(":")[0])
                
                if 6 <= hour < 10:
                    analysis["morning_rush"].append(pattern)
                elif 16 <= hour < 20:
                    analysis["evening_rush"].append(pattern)
                else:
                    analysis["all_day"].append(pattern)
        
        return analysis
    
    def export_patterns_to_csv(self, output_file="patterns_export.csv"):
        """Export patterns to CSV"""
        import pandas as pd
        
        patterns = self.get_all_patterns()
        
        # Transform NGSI-LD to flat structure
        records = []
        for pattern in patterns:
            time_range = pattern.get("timeRange", {}).get("value", {})
            
            record = {
                "id": pattern.get("id", ""),
                "name": pattern.get("name", {}).get("value", ""),
                "patternType": pattern.get("patternType", {}).get("value", ""),
                "timeRange_start": time_range.get("start", ""),
                "timeRange_end": time_range.get("end", ""),
                "daysOfWeek": ",".join(pattern.get("daysOfWeek", {}).get("value", [])),
                "averageVehicleCount": pattern.get("averageVehicleCount", {}).get("value", ""),
                "peakVehicleCount": pattern.get("peakVehicleCount", {}).get("value", ""),
                "averageSpeed": pattern.get("averageSpeed", {}).get("value", ""),
                "congestionLevel": pattern.get("congestionLevel", {}).get("value", ""),
                "confidence": pattern.get("confidence", {}).get("value", ""),
                "dateObserved": pattern.get("dateObserved", {}).get("value", {}).get("@value", "")
            }
            
            records.append(record)
        
        df = pd.DataFrame(records)
        df.to_csv(output_file, index=False)
        print(f"✅ Exported {len(records)} patterns to {output_file}")
        return df

# Usage
extractor = PatternDataExtractor()

# Get all patterns
all_patterns = extractor.get_all_patterns()
print(f"Total patterns: {len(all_patterns)}")

# Get rush hour patterns
rush_hour = extractor.get_rush_hour_patterns()
print(f"Rush hour patterns: {len(rush_hour)}")

# Get high congestion patterns
high_congestion = extractor.get_high_congestion_patterns()
print(f"High congestion patterns: {len(high_congestion)}")

# Analyze rush hours
rush_analysis = extractor.analyze_rush_hours()
print(f"\nRush Hour Analysis:")
print(f"  Morning rush patterns: {len(rush_analysis['morning_rush'])}")
print(f"  Evening rush patterns: {len(rush_analysis['evening_rush'])}")
print(f"  All-day patterns: {len(rush_analysis['all_day'])}")

# Get statistics
stats = extractor.get_pattern_statistics()
print("\nPattern Statistics by Congestion Level:")
for stat in stats:
    print(f"  {stat['congestionLevel']['value']}: {stat['count']['value']} patterns (avg vehicles: {float(stat['avgVehicleCount']['value']):.1f})")

# Export to CSV
df = extractor.export_patterns_to_csv("patterns_export.csv")
```

---

### 🔗 9.3. Combined Analytics Queries

#### Query: Accidents + Patterns Correlation

```python
def analyze_accidents_with_patterns(self):
    """Correlate accidents with traffic patterns"""
    
    # Get all accidents
    accidents = self.get_all_accidents()
    
    # Get all patterns
    patterns = self.get_all_patterns()
    
    correlations = []
    
    for accident in accidents:
        accident_camera = accident.get("affectedCamera", {}).get("object", "")
        accident_time_str = accident.get("dateDetected", {}).get("value", {}).get("@value", "")
        
        if not accident_time_str or not accident_camera:
            continue
        
        # Parse accident time
        accident_time = datetime.fromisoformat(accident_time_str.replace("Z", "+00:00"))
        accident_hour = accident_time.strftime("%H:00:00")
        accident_day = accident_time.strftime("%A")
        
        # Find matching patterns
        matching_patterns = []
        for pattern in patterns:
            pattern_cameras = pattern.get("affectedCameras", {}).get("object", [])
            if not isinstance(pattern_cameras, list):
                pattern_cameras = [pattern_cameras]
            
            # Check if camera matches
            if accident_camera in pattern_cameras:
                # Check if time matches
                time_range = pattern.get("timeRange", {}).get("value", {})
                start = time_range.get("start", "")
                end = time_range.get("end", "")
                
                # Check if day matches
                days = pattern.get("daysOfWeek", {}).get("value", [])
                
                if start <= accident_hour <= end and accident_day in days:
                    matching_patterns.append({
                        "pattern_id": pattern.get("id", ""),
                        "pattern_name": pattern.get("name", {}).get("value", ""),
                        "congestion_level": pattern.get("congestionLevel", {}).get("value", ""),
                        "avg_vehicles": pattern.get("averageVehicleCount", {}).get("value", 0)
                    })
        
        if matching_patterns:
            correlations.append({
                "accident_id": accident.get("id", ""),
                "accident_severity": accident.get("severity", {}).get("value", ""),
                "accident_type": accident.get("accidentType", {}).get("value", ""),
                "camera": accident_camera,
                "time": accident_time_str,
                "matching_patterns": matching_patterns
            })
    
    return correlations

# Usage
correlations = analyze_accidents_with_patterns()
print(f"\nAccidents with Pattern Correlations: {len(correlations)}")

for corr in correlations[:5]:  # Show first 5
    print(f"\nAccident: {corr['accident_id']}")
    print(f"  Severity: {corr['accident_severity']}")
    print(f"  Type: {corr['accident_type']}")
    print(f"  Matching Patterns:")
    for pattern in corr['matching_patterns']:
        print(f"    - {pattern['pattern_name']} (congestion: {pattern['congestion_level']})")
```

#### SPARQL: Cross-Query Accidents & Patterns

```sparql
PREFIX ngsi-ld: <https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?accident ?pattern ?camera ?accidentSeverity ?patternCongestion
WHERE {
  # Get accidents
  ?accident rdf:type <https://smartdatamodels.org/dataModel.Transportation/RoadAccident> .
  ?accident ngsi-ld:affectedCamera ?accCameraNode .
  ?accCameraNode ngsi-ld:hasObject ?camera .
  ?accident ngsi-ld:severity ?accSevNode .
  ?accSevNode ngsi-ld:hasValue ?accidentSeverity .
  
  # Get patterns affecting same camera
  ?pattern rdf:type <https://smartdatamodels.org/dataModel.Transportation/TrafficPattern> .
  ?pattern ngsi-ld:affectedCameras ?patCameraNode .
  ?patCameraNode ngsi-ld:hasObject ?camera .
  ?pattern ngsi-ld:congestionLevel ?patCongNode .
  ?patCongNode ngsi-ld:hasValue ?patternCongestion .
  
  # Filter: only severe accidents + high congestion patterns
  FILTER(?accidentSeverity = "severe" && ?patternCongestion = "high")
}
ORDER BY ?camera
```

---

### 📝 9.4. Use Cases & Best Practices

#### Use Case 1: Real-time Accident Monitoring Dashboard

```python
import time
from datetime import datetime

def monitor_accidents_realtime(interval_seconds=60):
    """Monitor accidents in real-time"""
    
    extractor = AccidentDataExtractor()
    last_check = datetime.utcnow()
    
    print("🚨 Starting Real-time Accident Monitor...")
    print(f"Check interval: {interval_seconds}s\n")
    
    while True:
        try:
            # Get recent accidents
            recent = extractor.get_recent_accidents(hours=1)
            
            # Filter new accidents since last check
            new_accidents = [
                acc for acc in recent 
                if datetime.fromisoformat(
                    acc.get("dateDetected", {}).get("value", {}).get("@value", "").replace("Z", "+00:00")
                ) > last_check
            ]
            
            if new_accidents:
                print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] 🚨 {len(new_accidents)} NEW ACCIDENTS DETECTED!")
                
                for acc in new_accidents:
                    severity = acc.get("severity", {}).get("value", "")
                    acc_type = acc.get("accidentType", {}).get("value", "")
                    camera = acc.get("affectedCamera", {}).get("object", "").split(":")[-1]
                    
                    severity_emoji = {
                        "severe": "🔴",
                        "moderate": "🟡",
                        "minor": "🟢"
                    }.get(severity, "⚪")
                    
                    print(f"  {severity_emoji} {severity.upper()} - {acc_type} at Camera {camera}")
            else:
                print(f"[{datetime.utcnow().strftime('%H:%M:%S')}] ✅ No new accidents")
            
            last_check = datetime.utcnow()
            time.sleep(interval_seconds)
            
        except KeyboardInterrupt:
            print("\n🛑 Monitoring stopped")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(interval_seconds)

# Run monitor
monitor_accidents_realtime(interval_seconds=60)
```

#### Use Case 2: Traffic Pattern Analysis Report

```python
def generate_pattern_report(output_file="pattern_report.html"):
    """Generate comprehensive pattern analysis report"""
    
    extractor = PatternDataExtractor()
    
    # Get data
    patterns = extractor.get_all_patterns()
    rush_analysis = extractor.analyze_rush_hours()
    stats = extractor.get_pattern_statistics()
    
    # Generate HTML report
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Traffic Pattern Analysis Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            h1 {{ color: #333; }}
            table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
            th, td {{ border: 1px solid #ddd; padding: 12px; text-align: left; }}
            th {{ background-color: #4CAF50; color: white; }}
            tr:hover {{ background-color: #f5f5f5; }}
            .metric {{ display: inline-block; margin: 10px 20px; padding: 15px; background: #e3f2fd; border-radius: 5px; }}
            .metric-value {{ font-size: 24px; font-weight: bold; color: #1976d2; }}
        </style>
    </head>
    <body>
        <h1>📈 Traffic Pattern Analysis Report</h1>
        <p>Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
        
        <h2>Summary Statistics</h2>
        <div class="metric">
            <div>Total Patterns</div>
            <div class="metric-value">{len(patterns)}</div>
        </div>
        <div class="metric">
            <div>Morning Rush Patterns</div>
            <div class="metric-value">{len(rush_analysis['morning_rush'])}</div>
        </div>
        <div class="metric">
            <div>Evening Rush Patterns</div>
            <div class="metric-value">{len(rush_analysis['evening_rush'])}</div>
        </div>
        
        <h2>Patterns by Congestion Level</h2>
        <table>
            <tr>
                <th>Congestion Level</th>
                <th>Pattern Count</th>
                <th>Avg Vehicle Count</th>
            </tr>
    """
    
    for stat in stats:
        html += f"""
            <tr>
                <td>{stat['congestionLevel']['value']}</td>
                <td>{stat['count']['value']}</td>
                <td>{float(stat['avgVehicleCount']['value']):.1f}</td>
            </tr>
        """
    
    html += """
        </table>
        
        <h2>Top 10 High-Traffic Patterns</h2>
        <table>
            <tr>
                <th>Pattern Name</th>
                <th>Type</th>
                <th>Time Range</th>
                <th>Avg Vehicles</th>
                <th>Congestion</th>
            </tr>
    """
    
    # Sort patterns by vehicle count
    sorted_patterns = sorted(
        patterns,
        key=lambda p: p.get("averageVehicleCount", {}).get("value", 0),
        reverse=True
    )[:10]
    
    for pattern in sorted_patterns:
        time_range = pattern.get("timeRange", {}).get("value", {})
        html += f"""
            <tr>
                <td>{pattern.get("name", {}).get("value", "N/A")}</td>
                <td>{pattern.get("patternType", {}).get("value", "N/A")}</td>
                <td>{time_range.get("start", "")} - {time_range.get("end", "")}</td>
                <td>{pattern.get("averageVehicleCount", {}).get("value", "N/A")}</td>
                <td>{pattern.get("congestionLevel", {}).get("value", "N/A")}</td>
            </tr>
        """
    
    html += """
        </table>
    </body>
    </html>
    """
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✅ Pattern report generated: {output_file}")

# Generate report
generate_pattern_report("pattern_report.html")
```

#### Use Case 3: Accident Hotspot Detection

```python
def detect_accident_hotspots(min_accidents=3):
    """Detect cameras with frequent accidents"""
    
    extractor = AccidentDataExtractor()
    accidents = extractor.get_all_accidents()
    
    # Count accidents per camera
    camera_accidents = {}
    
    for accident in accidents:
        camera = accident.get("affectedCamera", {}).get("object", "")
        if camera:
            if camera not in camera_accidents:
                camera_accidents[camera] = []
            camera_accidents[camera].append(accident)
    
    # Find hotspots (cameras with >= min_accidents)
    hotspots = {
        camera: accs 
        for camera, accs in camera_accidents.items() 
        if len(accs) >= min_accidents
    }
    
    # Sort by accident count
    sorted_hotspots = sorted(
        hotspots.items(),
        key=lambda x: len(x[1]),
        reverse=True
    )
    
    print(f"🔥 Accident Hotspots (>= {min_accidents} accidents):\n")
    
    for camera, accs in sorted_hotspots:
        camera_name = camera.split(":")[-1]
        print(f"\n📍 Camera: {camera_name}")
        print(f"   Total Accidents: {len(accs)}")
        
        # Severity breakdown
        severity_count = {}
        for acc in accs:
            sev = acc.get("severity", {}).get("value", "unknown")
            severity_count[sev] = severity_count.get(sev, 0) + 1
        
        print(f"   Severity Breakdown:")
        for sev, count in sorted(severity_count.items(), key=lambda x: x[1], reverse=True):
            print(f"     - {sev}: {count}")
        
        # Most common accident type
        type_count = {}
        for acc in accs:
            acc_type = acc.get("accidentType", {}).get("value", "unknown")
            type_count[acc_type] = type_count.get(acc_type, 0) + 1
        
        most_common = max(type_count.items(), key=lambda x: x[1])
        print(f"   Most Common Type: {most_common[0]} ({most_common[1]} times)")
    
    return sorted_hotspots

# Detect hotspots
hotspots = detect_accident_hotspots(min_accidents=3)
```

---

### ⚠️ 9.5. Important Notes

#### Data Freshness

- **Stellio**: Real-time data (< 1 second latency)
- **Fuseki**: Near real-time (< 5 seconds after Stellio)
- **Local Files**: Updated on each pipeline run

#### Data Retention

```yaml
Storage Policies:
  Stellio:
    - Latest state only (UPSERT pattern)
    - No automatic cleanup
    - Manual deletion required
  
  Fuseki:
    - Historical versions preserved (named graphs)
    - Each run creates new timestamped graphs
    - Requires periodic cleanup for disk space
  
  Local Files:
    - Accumulates across pipeline runs
    - Timestamped filenames
    - Manual cleanup recommended (weekly/monthly)
```

#### Performance Tips

```python
# ✅ GOOD: Filter at API level
curl "http://localhost:8080/ngsi-ld/v1/entities?type=RoadAccident&q=severity==%22severe%22"

# ❌ BAD: Get all then filter in code
all_accidents = get_all()  # Returns 1000s
severe = [a for a in all_accidents if a['severity'] == 'severe']

# ✅ GOOD: Use pagination for large datasets
curl "http://localhost:8080/ngsi-ld/v1/entities?type=TrafficPattern&limit=100&offset=0"

# ✅ GOOD: Use SPARQL for complex analytics
# SPARQL can join accidents + patterns + cameras in one query

# ❌ BAD: Multiple API calls + manual joins in Python
```

#### Troubleshooting

**Problem: No accidents/patterns found**

```bash
# Check if agents are enabled
cat config/workflow.yaml | grep -A 5 "accident_detection_agent"
# Should show: enabled: true, required: true

# Check if pipeline has run
ls -la data/accidents.json data/patterns.json

# Check Stellio
curl "http://localhost:8080/ngsi-ld/v1/entities?type=RoadAccident&limit=1"
```

**Problem: SPARQL query returns empty**

```bash
# Check if RDF files exist
ls -la data/rdf_accidents/ data/rdf_patterns/

# Check Fuseki dataset
curl "http://localhost:3030/lod/sparql" \
  -d "query=SELECT (COUNT(*) AS ?count) WHERE { ?s ?p ?o }"

# Re-run pipeline to load data
python main.py
```

---

## 10. Python Code Examples

### 🔧 Complete Data Extraction Script

```python
"""
Complete Data Extraction Script
Extract ALL data from LOD Cloud storage systems
"""

import requests
from requests.auth import HTTPBasicAuth
import json
from pathlib import Path
import asyncpg
import asyncio
from neo4j import GraphDatabase

class LODDataExtractor:
    """Extract data from all LOD storage systems"""
    
    def __init__(self):
        self.stellio_base = "http://localhost:8080/ngsi-ld/v1"
        self.fuseki_base = "http://localhost:3030/lod-dataset"
        self.fuseki_auth = HTTPBasicAuth('admin', 'test_admin')
        self.neo4j_uri = "bolt://localhost:7687"
        self.neo4j_auth = ("neo4j", "test12345")
        self.pg_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'stellio_search',
            'user': 'stellio_user',
            'password': 'stellio_test'
        }
    
    def extract_stellio_data(self):
        """Extract all NGSI-LD entities from Stellio"""
        print("\n=== Extracting from Stellio ===")
        
        entity_types = ['Camera', 'WeatherObserved', 'AirQualityObserved']
        all_entities = []
        
        for entity_type in entity_types:
            response = requests.get(
                f"{self.stellio_base}/entities",
                params={'type': entity_type, 'limit': 100}
            )
            entities = response.json()
            all_entities.extend(entities)
            print(f"Extracted {len(entities)} {entity_type} entities")
        
        # Save to file
        with open('extracted_stellio_data.json', 'w', encoding='utf-8') as f:
            json.dump(all_entities, f, indent=2, ensure_ascii=False)
        
        print(f"Total: {len(all_entities)} entities saved to extracted_stellio_data.json")
        return all_entities
    
    def extract_fuseki_data(self):
        """Extract all RDF triples from Fuseki"""
        print("\n=== Extracting from Fuseki ===")
        
        # Query all triples
        sparql_query = """
        SELECT ?s ?p ?o
        WHERE {
            { ?s ?p ?o }
            UNION
            { GRAPH ?g { ?s ?p ?o } }
        }
        """
        
        response = requests.post(
            f"{self.fuseki_base}/sparql",
            data={'query': sparql_query},
            headers={'Accept': 'application/sparql-results+json'},
            auth=self.fuseki_auth
        )
        
        results = response.json()
        triples = results['results']['bindings']
        
        print(f"Extracted {len(triples)} triples")
        
        # Also download in Turtle format
        response_ttl = requests.get(
            f"{self.fuseki_base}/data",
            headers={'Accept': 'text/turtle'},
            auth=self.fuseki_auth
        )
        
        with open('extracted_fuseki_data.ttl', 'w', encoding='utf-8') as f:
            f.write(response_ttl.text)
        
        print(f"RDF data saved to extracted_fuseki_data.ttl")
        return triples
    
    def extract_neo4j_data(self):
        """Extract all nodes from Neo4j"""
        print("\n=== Extracting from Neo4j ===")
        
        driver = GraphDatabase.driver(self.neo4j_uri, auth=self.neo4j_auth)
        
        all_nodes = []
        
        with driver.session(database="neo4j") as session:
            # Get all nodes with properties
            result = session.run("""
                MATCH (n)
                RETURN n, labels(n) as labels
            """)
            
            for record in result:
                node = dict(record['n'])
                node['labels'] = record['labels']
                all_nodes.append(node)
        
        driver.close()
        
        # Save to file
        with open('extracted_neo4j_data.json', 'w', encoding='utf-8') as f:
            json.dump(all_nodes, f, indent=2, ensure_ascii=False)
        
        print(f"Extracted {len(all_nodes)} nodes saved to extracted_neo4j_data.json")
        return all_nodes
    
    def extract_postgresql_data(self):
        """Extract all entities from PostgreSQL (async)"""
        print("\n=== Extracting from PostgreSQL ===")
        
        async def _extract():
            conn = await asyncpg.connect(**self.pg_config)
            
            # Get all entities
            rows = await conn.fetch("""
                SELECT entity_id, entity_type, entity_payload, created_at, modified_at
                FROM entity_payload
            """)
            
            entities = []
            for row in rows:
                # asyncpg returns Record objects that behave like dicts
                payload = row['entity_payload']
                if isinstance(payload, str):
                    payload = json.loads(payload)
                entities.append({
                    'id': row['entity_id'],
                    'type': row['entity_type'],
                    'payload': payload,
                    'created_at': str(row['created_at']),
                    'modified_at': str(row['modified_at'])
                })
            
            await conn.close()
            return entities
        
        entities = asyncio.run(_extract())
        
        # Save to file
        with open('extracted_postgresql_data.json', 'w', encoding='utf-8') as f:
            json.dump(entities, f, indent=2, ensure_ascii=False)
        
        print(f"Extracted {len(entities)} entities saved to extracted_postgresql_data.json")
        return entities
    
    def extract_local_files(self):
        """Copy all local RDF and JSON files"""
        print("\n=== Extracting Local Files ===")
        
        import shutil
        
        # Create extraction directory
        extract_dir = Path('extracted_data')
        extract_dir.mkdir(exist_ok=True)
        
        # Copy RDF files
        rdf_dir = Path('data/rdf')
        if rdf_dir.exists():
            rdf_extract = extract_dir / 'rdf'
            rdf_extract.mkdir(exist_ok=True)
            
            for ttl_file in rdf_dir.glob('*.ttl'):
                shutil.copy2(ttl_file, rdf_extract / ttl_file.name)
            
            print(f"Copied {len(list(rdf_extract.glob('*.ttl')))} RDF files")
        
        # Copy JSON files
        json_files = [
            'cameras_updated.json',
            'cameras_enriched.json',
            'ngsi_ld_entities.json',
            'observations.json'
        ]
        
        for json_file in json_files:
            src = Path('data') / json_file
            if src.exists():
                shutil.copy2(src, extract_dir / json_file)
                print(f"Copied {json_file}")
    
    def extract_all(self):
        """Extract data from all storage systems"""
        print("="*60)
        print("LOD CLOUD DATA EXTRACTION")
        print("="*60)
        
        self.extract_stellio_data()
        self.extract_fuseki_data()
        self.extract_neo4j_data()
        self.extract_postgresql_data()
        self.extract_local_files()
        
        print("\n" + "="*60)
        print("EXTRACTION COMPLETE!")
        print("="*60)
        print("\nExtracted files:")
        print("  - extracted_stellio_data.json (NGSI-LD entities)")
        print("  - extracted_fuseki_data.ttl (RDF triples)")
        print("  - extracted_neo4j_data.json (Graph nodes)")
        print("  - extracted_postgresql_data.json (DB records)")
        print("  - extracted_data/ (Local files)")

if __name__ == "__main__":
    extractor = LODDataExtractor()
    extractor.extract_all()
```

### 💾 Save Script
Save the above as `extract_all_data.py` and run:
```bash
python extract_all_data.py
```

---

## 11. cURL Examples

### 📥 Stellio (NGSI-LD)

```bash
# Get all cameras
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=Camera&limit=100" \
  -H "Accept: application/ld+json"

# Get specific entity
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities/urn:ngsi-ld:Camera:0" \
  -H "Accept: application/ld+json"

# Get weather data
curl -X GET "http://localhost:8080/ngsi-ld/v1/entities?type=WeatherObserved&limit=100" \
  -H "Accept: application/ld+json"
```

### 📥 Fuseki (SPARQL)

```bash
# Query via GET
curl -G "http://localhost:3030/lod-dataset/sparql" \
  --data-urlencode "query=SELECT * WHERE { ?s ?p ?o } LIMIT 10" \
  -H "Accept: application/sparql-results+json" \
  -u admin:test_admin

# Download as Turtle
curl "http://localhost:3030/lod-dataset/data" \
  -H "Accept: text/turtle" \
  -u admin:test_admin \
  -o all_data.ttl

# Download as JSON-LD
curl "http://localhost:3030/lod-dataset/data" \
  -H "Accept: application/ld+json" \
  -u admin:test_admin \
  -o all_data.jsonld
```

### 📥 Neo4j (REST API)

```bash
# Count all nodes
curl -X POST "http://localhost:7474/db/neo4j/tx/commit" \
  -H "Content-Type: application/json" \
  -u neo4j:test12345 \
  -d '{
    "statements": [
      {"statement": "MATCH (n) RETURN count(n) as total"}
    ]
  }'

# Get all cameras
curl -X POST "http://localhost:7474/db/neo4j/tx/commit" \
  -H "Content-Type: application/json" \
  -u neo4j:test12345 \
  -d '{
    "statements": [
      {"statement": "MATCH (c:Camera) RETURN c LIMIT 100"}
    ]
  }'
```

---

## 12. SPARQL Query Examples

### 🔍 Basic Queries

#### List All Subjects
```sparql
SELECT DISTINCT ?subject
WHERE {
  ?subject ?p ?o
}
LIMIT 1000
```

#### List All Predicates
```sparql
SELECT DISTINCT ?predicate
WHERE {
  ?s ?predicate ?o
}
```

#### List All Classes
```sparql
SELECT DISTINCT ?class
WHERE {
  ?s a ?class
}
```

### 🔍 Advanced Queries

#### Get Camera Details
```sparql
PREFIX schema: <http://schema.org/>
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
PREFIX sosa: <http://www.w3.org/ns/sosa/>

SELECT ?camera ?name ?lat ?lng ?type
WHERE {
  ?camera a sosa:Sensor ;
          schema:name ?name ;
          geo:lat ?lat ;
          geo:long ?lng ;
          schema:additionalType ?type .
}
```

#### Get All Properties of a Camera
```sparql
SELECT ?property ?value
WHERE {
  GRAPH ?g {
    <urn:ngsi-ld:Camera:0> ?property ?value .
  }
}
```

#### Search by Location
```sparql
PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>

SELECT ?camera ?lat ?lng
WHERE {
  ?camera geo:lat ?lat ;
          geo:long ?lng .
  
  FILTER(?lat > 10.7 && ?lat < 10.8)
  FILTER(?lng > 106.6 && ?lng < 106.7)
}
```

#### Get Camera with Observations
```sparql
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX schema: <http://schema.org/>

SELECT ?camera ?observation ?value ?timestamp
WHERE {
  ?camera a sosa:Sensor .
  ?observation sosa:madeBySensor ?camera ;
               sosa:hasResult ?result ;
               sosa:resultTime ?timestamp .
  ?result schema:value ?value .
}
```

### 🔍 Aggregate Queries

#### Count Triples by Graph
```sparql
SELECT ?graph (COUNT(*) as ?tripleCount)
WHERE {
  GRAPH ?graph {
    ?s ?p ?o
  }
}
GROUP BY ?graph
ORDER BY DESC(?tripleCount)
```

#### Count Entities by Type
```sparql
SELECT ?type (COUNT(DISTINCT ?entity) as ?count)
WHERE {
  ?entity a ?type
}
GROUP BY ?type
ORDER BY DESC(?count)
```

---

## 13. Troubleshooting

### ❌ Common Issues

#### Issue: Connection Refused
```
Error: Failed to connect to localhost:8080
```

**Solution:**
```bash
# Check if services are running
docker ps

# Restart services if needed
docker-compose -f docker-compose.test.yml restart
```

#### Issue: Authentication Failed (Fuseki)
```
Error: 401 Unauthorized
```

**Solution:**
- Username: `admin`
- Password: `test_admin`
- Use Basic Authentication in all requests

#### Issue: Authentication Failed (Neo4j)
```
Error: Invalid username or password
```

**Solution:**
- Username: `neo4j`
- Password: `test12345` (not `testneo4j`)

#### Issue: Empty Results from Stellio
```
Error: 400 Bad Request - One of 'type', 'attrs', 'q', 'geoQ' must be provided
```

**Solution:**
Always include `type` parameter:
```
http://localhost:8080/ngsi-ld/v1/entities?type=Camera
```

#### Issue: SPARQL Query Timeout
```
Error: Query execution timeout
```

**Solution:**
Add LIMIT to queries or use pagination:
```sparql
SELECT ?s ?p ?o
WHERE { ?s ?p ?o }
LIMIT 1000
OFFSET 0
```

### 📊 Verify Data Completeness

Run this Python script to verify all data:

```python
import requests
from requests.auth import HTTPBasicAuth

print("Checking data completeness...")

# Stellio
stellio = requests.get("http://localhost:8080/ngsi-ld/v1/entities?type=Camera&limit=100")
print(f"✓ Stellio: {len(stellio.json())} cameras")

# Fuseki
auth = HTTPBasicAuth('admin', 'test_admin')
fuseki = requests.post(
    "http://localhost:3030/lod-dataset/sparql",
    data={'query': 'SELECT (COUNT(*) as ?c) WHERE { ?s ?p ?o }'},
    headers={'Accept': 'application/sparql-results+json'},
    auth=auth
)
triples = fuseki.json()['results']['bindings'][0]['c']['value']
print(f"✓ Fuseki: {triples} triples")

# Neo4j
neo4j_auth = HTTPBasicAuth('neo4j', 'test12345')
neo4j = requests.post(
    "http://localhost:7474/db/neo4j/tx/commit",
    json={"statements": [{"statement": "MATCH (n) RETURN count(n) as c"}]},
    headers={'Content-Type': 'application/json'},
    auth=neo4j_auth
)
nodes = neo4j.json()['results'][0]['data'][0]['row'][0]
print(f"✓ Neo4j: {nodes} nodes")

print("\n✅ All systems accessible!")
```

---

## 📞 Support & Resources

### 🔗 API Documentation
- **NGSI-LD Spec**: https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.04.01_60/gs_cim009v010401p.pdf
- **SPARQL 1.1**: https://www.w3.org/TR/sparql11-query/
- **Neo4j Cypher**: https://neo4j.com/docs/cypher-manual/current/

### 🛠️ Tools
- **Stellio UI**: N/A (use REST API)
- **Fuseki Web UI**: http://localhost:3030
- **Neo4j Browser**: http://localhost:7474/browser
- **pgAdmin**: Connect to localhost:5432

### 📧 Contact
For issues or questions about this data access guide, please refer to project documentation.

---

## 🎯 Quick Start Checklist

- [ ] All Docker services running (`docker ps`)
- [ ] Can access Stellio API (http://localhost:8080)
- [ ] Can access Fuseki UI (http://localhost:3030)
- [ ] Can access Neo4j Browser (http://localhost:7474)
- [ ] PostgreSQL credentials verified
- [ ] Python extraction script tested
- [ ] Sample queries executed successfully

---

**Document Version**: 1.0  
**Last Updated**: November 25, 2025  
**Data Snapshot**: 200 NGSI-LD entities, 22,733 RDF triples, 202 graph nodes


---

## 14. Hướng Dẫn Khai Thác Data Từ Các Nơi Lưu Trữ

###  Chiến Lược Khai Thác Data

Hệ thống lưu trữ data ở **5 nơi khác nhau**, mỗi nơi phục vụ **mục đích riêng**. Hiểu rõ **khi nào dùng storage nào** là chìa khóa để khai thác hiệu quả.

