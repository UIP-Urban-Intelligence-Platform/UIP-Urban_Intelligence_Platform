<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Complete DevOps and deployment guide.

Module: apps/traffic-web-app/frontend/docs/docs/devops/complete-devops-guide.md
Author: UIP Team
Version: 1.0.0
-->

# Complete DevOps & Deployment Guide

## Overview

Comprehensive guide for deploying, monitoring, and maintaining the HCMC Traffic Management System using Docker, Kubernetes, CI/CD pipelines, monitoring tools, and security best practices.

**Technologies:**
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes, Helm
- **CI/CD**: GitHub Actions, Jenkins
- **Monitoring**: Prometheus, Grafana, ELK Stack
- **Service Mesh**: Istio
- **Security**: HashiCorp Vault, SOPS, TLS/mTLS

---

## Table of Contents

### [Docker Setup](#docker-setup)
1. [Dockerfiles](#dockerfiles)
2. [Docker Compose](#docker-compose)
3. [Multi-Stage Builds](#multi-stage-builds)
4. [Image Optimization](#image-optimization)

### [Kubernetes Deployment](#kubernetes-deployment)
5. [Cluster Architecture](#cluster-architecture)
6. [Deployments](#k8s-deployments)
7. [Services](#k8s-services)
8. [ConfigMaps & Secrets](#configmaps-secrets)
9. [Ingress](#ingress)
10. [StatefulSets](#statefulsets)
11. [Persistent Volumes](#persistent-volumes)

### [Helm Charts](#helm-charts)
12. [Chart Structure](#chart-structure)
13. [Values Configuration](#values-configuration)
14. [Dependencies](#chart-dependencies)

### [CI/CD Pipelines](#cicd-pipelines)
15. [GitHub Actions](#github-actions)
16. [Jenkins Pipeline](#jenkins-pipeline)
17. [Build & Test](#build-test)
18. [Security Scanning](#security-scanning)
19. [Deployment Automation](#deployment-automation)

### [Monitoring & Observability](#monitoring-observability)
20. [Prometheus Setup](#prometheus-setup)
21. [Grafana Dashboards](#grafana-dashboards)
22. [Logging (ELK)](#elk-stack)
23. [Distributed Tracing](#distributed-tracing)
24. [Alert Manager](#alert-manager)

### [Security](#security)
25. [Secrets Management](#secrets-management)
26. [TLS/mTLS](#tls-mtls)
27. [Network Policies](#network-policies)
28. [RBAC](#rbac)
29. [Vulnerability Scanning](#vulnerability-scanning)

### [Scaling & Performance](#scaling-performance)
30. [Horizontal Pod Autoscaling](#hpa)
31. [Vertical Pod Autoscaling](#vpa)
32. [Load Balancing](#load-balancing)
33. [Caching Strategies](#caching-strategies)

### [Backup & Recovery](#backup-recovery)
34. [Database Backups](#database-backups)
35. [Disaster Recovery](#disaster-recovery)

---

# Docker Setup

## Dockerfiles

### Backend API Dockerfile

```dockerfile
# Multi-stage build for Python backend
FROM python:3.9-slim as builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements/production.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.9-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY src/ ./src/
COPY agents/ ./agents/
COPY config/ ./config/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/traffic-web-app/frontend/package*.json apps/traffic-web-app/frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/traffic-web-app/frontend/ apps/traffic-web-app/frontend/

# Build application
WORKDIR /app/apps/traffic-web-app/frontend
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY apps/traffic-web-app/frontend/nginx.conf /etc/nginx/nginx.conf

# Copy built assets
COPY --from=builder /app/apps/traffic-web-app/frontend/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1000 nginx && adduser -D -u 1000 -G nginx nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
```

### YOLOX Detection Service Dockerfile

```dockerfile
FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements/base.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Download YOLOX model and DETR from HuggingFace
RUN python -c "from transformers import AutoModelForObjectDetection; AutoModelForObjectDetection.from_pretrained('hilmantm/detr-traffic-accident-detection')"

# Copy application code
COPY agents/accident_detection.py .
COPY agents/cv_analysis.py .

EXPOSE 8001

CMD ["python", "accident_detection.py"]
```

---

## Docker Compose

### Complete Docker Compose Configuration

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: traffic-postgres
    environment:
      POSTGRES_DB: traffic_db
      POSTGRES_USER: traffic_user
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - traffic-network
    secrets:
      - postgres_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U traffic_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: traffic-redis
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - traffic-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # MongoDB
  mongodb:
    image: mongo:6.0
    container_name: traffic-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD_FILE: /run/secrets/mongo_password
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
    networks:
      - traffic-network
    secrets:
      - mongo_password
    restart: unless-stopped

  # Neo4j Graph Database
  neo4j:
    image: neo4j:5.11
    container_name: traffic-neo4j
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_PLUGINS: '["apoc", "graph-data-science"]'
    volumes:
      - neo4j-data:/data
      - neo4j-logs:/logs
    ports:
      - "7474:7474"
      - "7687:7687"
    networks:
      - traffic-network
    restart: unless-stopped

  # Apache Jena Fuseki (RDF Triplestore)
  fuseki:
    image: stain/jena-fuseki:4.9.0
    container_name: traffic-fuseki
    environment:
      ADMIN_PASSWORD_FILE: /run/secrets/fuseki_password
      JVM_ARGS: "-Xmx2g"
    volumes:
      - fuseki-data:/fuseki
    ports:
      - "3030:3030"
    networks:
      - traffic-network
    secrets:
      - fuseki_password
    restart: unless-stopped

  # Stellio Context Broker (NGSI-LD)
  stellio:
    image: stellio/stellio-context-broker:latest
    container_name: traffic-stellio
    environment:
      SPRING_PROFILES_ACTIVE: docker
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/stellio_db
      SPRING_DATASOURCE_USERNAME: stellio
      SPRING_DATASOURCE_PASSWORD_FILE: /run/secrets/stellio_db_password
    ports:
      - "8080:8080"
    networks:
      - traffic-network
    secrets:
      - stellio_db_password
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  # Kafka
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: traffic-kafka
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
    networks:
      - traffic-network
    depends_on:
      - zookeeper
    restart: unless-stopped

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: traffic-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - traffic-network
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: traffic-backend
    environment:
      DATABASE_URL: postgresql://traffic_user:${POSTGRES_PASSWORD}@postgres:5432/traffic_db
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      MONGODB_URL: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: ${NEO4J_PASSWORD}
      FUSEKI_URL: http://fuseki:3030
      STELLIO_URL: http://stellio:8080
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
    ports:
      - "8000:8000"
    networks:
      - traffic-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mongodb:
        condition: service_started
      neo4j:
        condition: service_started
      fuseki:
        condition: service_started
      stellio:
        condition: service_started
      kafka:
        condition: service_started
    volumes:
      - ./config:/app/config:ro
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  # YOLOX Detection Service
  yolox-detector:
    build:
      context: .
      dockerfile: Dockerfile.yolox
    container_name: traffic-yolox
    runtime: nvidia
    environment:
      CUDA_VISIBLE_DEVICES: 0
    ports:
      - "8001:8001"
    networks:
      - traffic-network
    volumes:
      - ./models:/app/models:ro
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: .
      dockerfile: apps/traffic-web-app/frontend/Dockerfile
    container_name: traffic-frontend
    ports:
      - "3000:80"
    networks:
      - traffic-network
    environment:
      REACT_APP_API_URL: http://backend:8000
      REACT_APP_WS_URL: ws://backend:8000/ws
    depends_on:
      - backend
    restart: unless-stopped

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: traffic-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - traffic-network
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: traffic-grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD_FILE: /run/secrets/grafana_password
      GF_INSTALL_PLUGINS: grafana-worldmap-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "3001:3000"
    networks:
      - traffic-network
    secrets:
      - grafana_password
    depends_on:
      - prometheus
    restart: unless-stopped

networks:
  traffic-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16

volumes:
  postgres-data:
  redis-data:
  mongo-data:
  neo4j-data:
  neo4j-logs:
  fuseki-data:
  prometheus-data:
  grafana-data:

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
  mongo_password:
    file: ./secrets/mongo_password.txt
  fuseki_password:
    file: ./secrets/fuseki_password.txt
  stellio_db_password:
    file: ./secrets/stellio_db_password.txt
  grafana_password:
    file: ./secrets/grafana_password.txt
```

---

# Kubernetes Deployment

## Cluster Architecture

### Architecture Diagram

```mermaid
graph TB
    subgraph Internet
        Users[Users]
    end
    
    subgraph Kubernetes Cluster
        subgraph Ingress Layer
            Ingress[NGINX Ingress]
            CertManager[Cert Manager]
        end
        
        subgraph Application Layer
            Frontend[Frontend Pods]
            Backend[Backend API Pods]
            YOLOService[YOLO Detection Pods]
        end
        
        subgraph Data Layer
            Postgres[PostgreSQL StatefulSet]
            Redis[Redis StatefulSet]
            MongoDB[MongoDB StatefulSet]
            Neo4j[Neo4j StatefulSet]
            Fuseki[Fuseki StatefulSet]
        end
        
        subgraph Monitoring
            Prometheus[Prometheus]
            Grafana[Grafana]
        end
    end
    
    Users -->|HTTPS| Ingress
    Ingress --> Frontend
    Ingress --> Backend
    Backend --> YOLOService
    Backend --> Postgres
    Backend --> Redis
    Backend --> MongoDB
    Backend --> Neo4j
    Backend --> Fuseki
    Prometheus --> Backend
    Prometheus --> Postgres
    Grafana --> Prometheus
```

---

## K8s Deployments

### Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traffic-backend
  namespace: traffic-system
  labels:
    app: traffic-backend
    tier: backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: traffic-backend
  template:
    metadata:
      labels:
        app: traffic-backend
        tier: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: traffic-backend-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
      - name: backend
        image: traffic.azurecr.io/traffic-backend:v1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 8000
          name: http
          protocol: TCP
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: traffic-config
              key: log_level
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
        - name: data
          mountPath: /app/data
      volumes:
      - name: config
        configMap:
          name: traffic-config
      - name: data
        persistentVolumeClaim:
          claimName: backend-data-pvc
      nodeSelector:
        workload: backend
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - traffic-backend
              topologyKey: kubernetes.io/hostname
```

### Frontend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traffic-frontend
  namespace: traffic-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: traffic-frontend
  template:
    metadata:
      labels:
        app: traffic-frontend
        tier: frontend
    spec:
      containers:
      - name: frontend
        image: traffic.azurecr.io/traffic-frontend:v1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## K8s Services

### Backend Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: traffic-backend-service
  namespace: traffic-system
  labels:
    app: traffic-backend
spec:
  type: ClusterIP
  selector:
    app: traffic-backend
  ports:
  - name: http
    port: 8000
    targetPort: 8000
    protocol: TCP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
```

### Frontend Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: traffic-frontend-service
  namespace: traffic-system
spec:
  type: LoadBalancer
  selector:
    app: traffic-frontend
  ports:
  - port: 80
    targetPort: 80
```

---

## ConfigMaps & Secrets

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: traffic-config
  namespace: traffic-system
data:
  log_level: "INFO"
  fuseki_url: "http://fuseki-service:3030"
  stellio_url: "http://stellio-service:8080"
  kafka_bootstrap_servers: "kafka-service:9092"
  app_config.yaml: |
    server:
      host: "0.0.0.0"
      port: 8000
    cache:
      ttl: 300
      max_size: 1000
```

### Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: traffic-system
type: Opaque
stringData:
  url: "postgresql://traffic_user:ENCRYPTED_PASSWORD@postgres-service:5432/traffic_db"
  username: "traffic_user"
  password: "ENCRYPTED_PASSWORD"
---
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
  namespace: traffic-system
type: Opaque
stringData:
  url: "redis://:ENCRYPTED_PASSWORD@redis-service:6379/0"
  password: "ENCRYPTED_PASSWORD"
```

---

## Ingress

### NGINX Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: traffic-ingress
  namespace: traffic-system
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/cors-allow-origin: "*"
    nginx.ingress.kubernetes.io/websocket-services: "traffic-backend-service"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.traffic.hcmc.gov.vn
    - traffic.hcmc.gov.vn
    secretName: traffic-tls-cert
  rules:
  - host: api.traffic.hcmc.gov.vn
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: traffic-backend-service
            port:
              number: 8000
  - host: traffic.hcmc.gov.vn
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: traffic-frontend-service
            port:
              number: 80
```

---

## StatefulSets

### PostgreSQL StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: traffic-system
spec:
  serviceName: postgres-service
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          value: "traffic_db"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          exec:
            command:
            - /bin/sh
            - -c
            - pg_isready -U traffic_user
          initialDelaySeconds: 30
          periodSeconds: 10
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "fast-ssd"
      resources:
        requests:
          storage: 100Gi
```

---

# CI/CD Pipelines

## GitHub Actions

### Complete CI/CD Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: traffic.azurecr.io
  IMAGE_NAME: traffic-backend

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
      
      - name: Install dependencies
        run: |
          pip install -r requirements/test.txt
      
      - name: Run unit tests
        run: |
          pytest tests/unit --cov=src --cov-report=xml
      
      - name: Run integration tests
        run: |
          docker-compose -f docker-compose.test.yml up -d
          pytest tests/integration
          docker-compose -f docker-compose.test.yml down
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  security-scan:
    name: Security Scanning
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run Bandit security linter
        run: |
          pip install bandit
          bandit -r src/ -f json -o bandit-report.json

  build:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Azure Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.AZURE_CLIENT_ID }}
          password: ${{ secrets.AZURE_CLIENT_SECRET }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy to Kubernetes
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Set up Helm
        uses: azure/setup-helm@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Get AKS credentials
        run: |
          az aks get-credentials --resource-group traffic-rg --name traffic-aks-cluster
      
      - name: Deploy with Helm
        run: |
          helm upgrade --install traffic-system ./helm/traffic-system \
            --namespace traffic-system \
            --create-namespace \
            --set image.tag=${{ github.sha }} \
            --set image.repository=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }} \
            --wait --timeout 10m
      
      - name: Verify deployment
        run: |
          kubectl rollout status deployment/traffic-backend -n traffic-system
          kubectl get pods -n traffic-system
```

---

## Monitoring & Observability

### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
  
  - job_name: 'traffic-backend'
    static_configs:
      - targets: ['traffic-backend-service:8000']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
  
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Traffic System Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends"
          }
        ]
      }
    ]
  }
}
```

---

## Security

### RBAC Configuration

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: traffic-backend-sa
  namespace: traffic-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: traffic-backend-role
  namespace: traffic-system
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: traffic-backend-rolebinding
  namespace: traffic-system
subjects:
- kind: ServiceAccount
  name: traffic-backend-sa
  namespace: traffic-system
roleRef:
  kind: Role
  name: traffic-backend-role
  apiGroup: rbac.authorization.k8s.io
```

### Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: traffic-backend-netpol
  namespace: traffic-system
spec:
  podSelector:
    matchLabels:
      app: traffic-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: traffic-frontend
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

---

## Scaling & Performance

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: traffic-backend-hpa
  namespace: traffic-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: traffic-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

---

## Backup & Recovery

### PostgreSQL Backup CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: traffic-system
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres-service -U traffic_user -d traffic_db -F c -f /backup/backup-$(date +%Y%m%d-%H%M%S).dump
              # Upload to Azure Blob Storage
              az storage blob upload --account-name trafficstorage --container-name backups --file /backup/backup-*.dump
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret
                  key: password
            volumeMounts:
            - name: backup
              mountPath: /backup
          volumes:
          - name: backup
            emptyDir: {}
          restartPolicy: OnFailure
```

---

## Related Documentation

- [Complete Agents Reference](../agents/complete-agents-reference.md)
- [Complete API Reference](../api/complete-api-reference.md)
- [Complete Testing Guide](../testing/complete-testing-guide.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)

See [LICENSE](../LICENSE) for details.
