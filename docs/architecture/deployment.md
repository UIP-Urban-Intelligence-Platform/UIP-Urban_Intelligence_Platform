<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: docs/architecture/deployment.md
Module: Deployment Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Production deployment guide documentation.
============================================================================
-->

# Deployment Guide - PRODUCTION READY

## Deployment Options

### 1. Local Development (Docker Compose)

```bash
# Setup development environment
./scripts/setup_dev.sh
# Creates: Python venv, installs deps, starts Docker services

# Start services
docker-compose -f docker/docker-compose.dev.yml up -d

# Check health
./scripts/health_check.sh
# Tests: Stellio, PostgreSQL, Redis, Neo4j

# View logs
docker-compose logs -f orchestrator
```

### 2. Production (Kubernetes)

```bash
# Setup production cluster
./scripts/setup_prod.sh
# Creates: namespace, Helm installs (PostgreSQL, Redis, Prometheus)

# Deploy application
./scripts/deploy.sh
# Builds: Docker image, pushes to registry
# Deploys: kubectl apply -f k8s/

# Verify deployment
kubectl get pods -n smart-city
kubectl rollout status deployment/stellio

# Rollback if needed
./scripts/rollback.sh --revision=2
```

## Infrastructure Setup

### Prerequisites
- Docker 20.10+
- Kubernetes 1.25+
- Helm 3.10+
- kubectl configured

### Development Environment

**setup_dev.sh:**
```bash
#!/bin/bash
# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start Docker services
docker compose up -d

# Install pre-commit hooks
pre-commit install
```

**Services Started:**
- Stellio (port 8080)
- PostgreSQL (port 5432)
- Neo4j (ports 7687, 7474)
- Redis (port 6379)
- Fuseki (port 3030)

### Production Environment

**setup_prod.sh:**
```bash
#!/bin/bash
# Create namespace
kubectl create namespace smart-city

# Install PostgreSQL
helm upgrade --install postgresql bitnami/postgresql \
  --namespace smart-city \
  --set auth.database=stellio

# Install Redis
helm upgrade --install redis bitnami/redis \
  --namespace smart-city

# Install Prometheus/Grafana
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring

# Load secrets
kubectl create secret generic app-secrets \
  --from-env-file=.env.prod \
  --namespace=smart-city
```

## Deployment Process

### Build & Push

```bash
# Build Docker image
docker build -t registry.example.com/stellio:v1.0.0 .

# Push to registry
docker push registry.example.com/stellio:v1.0.0
```

### Kubernetes Deployment

```bash
# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Wait for rollout
kubectl rollout status deployment/stellio --timeout=5m
```

### Verify Health

```bash
# Check pods
kubectl get pods -n smart-city

# Check logs
kubectl logs -f deployment/stellio -n smart-city

# Run health check
kubectl exec -it deployment/stellio -- ./scripts/health_check.sh
```

## Monitoring Setup

**monitoring_setup.sh:**
```bash
#!/bin/bash
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm upgrade --install prometheus prometheus-community/prometheus

# Install Grafana
helm upgrade --install grafana grafana/grafana

# Apply dashboards
kubectl create configmap grafana-dashboards \
  --from-file=config/grafana_dashboard.json

# Port-forward for access
kubectl port-forward svc/grafana 3000:3000
```

**Metrics Collected:**
- Agent execution time
- Cache hit rate
- API response time
- Error rate

## Configuration Management

### Environment Variables
```bash
# .env.prod
STELLIO_URL=http://stellio:8080
POSTGRES_HOST=postgresql
POSTGRES_DB=stellio
NEO4J_URI=bolt://neo4j:7687
REDIS_HOST=redis
FUSEKI_URL=http://fuseki:3030
```

### ConfigMaps
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  workflow.yaml: |
    phases:
      - name: data_collection
        parallel: true
        agents: [...]
```

## Rollback Strategy

**rollback.sh:**
```bash
#!/bin/bash
REVISION=${1:-0}  # Default: previous revision

kubectl rollout undo deployment/stellio \
  --to-revision=$REVISION \
  --namespace=smart-city

# Verify rollback
kubectl rollout status deployment/stellio
```

## Troubleshooting

### Common Issues

**Pods not starting:**
```bash
kubectl describe pod <pod-name> -n smart-city
kubectl logs <pod-name> -n smart-city
```

**Database connection:**
```bash
# Test PostgreSQL
kubectl exec -it postgresql-0 -- pg_isready -U postgres

# Test Redis
kubectl exec -it redis-master-0 -- redis-cli ping
```

**Network issues:**
```bash
# Check services
kubectl get svc -n smart-city

# Test connectivity
kubectl exec -it deployment/stellio -- curl http://postgresql:5432
```

## Security Best Practices

1. **Secrets**: Use Kubernetes Secrets, not env files in git
2. **RBAC**: Limit service account permissions
3. **Network Policies**: Restrict pod-to-pod communication
4. **Image Scanning**: Scan images for vulnerabilities

## Performance Tuning

### Resource Limits
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

### Horizontal Pod Autoscaling
```bash
kubectl autoscale deployment stellio \
  --cpu-percent=70 \
  --min=2 \
  --max=10 \
  --namespace=smart-city
```
# - Start Docker services
# - Seed initial data
```

### Production Environment

```bash
# Setup production infrastructure
./scripts/setup_prod.sh

# This provisions:
# - Kubernetes cluster (EKS/AKS/GKE)
# - RDS PostgreSQL
# - ElastiCache Redis
# - Load balancers
```

## Service Configuration

### Environment Variables

```bash
# .env.production
STELLIO_URL=https://stellio.example.com
NEO4J_URI=bolt://neo4j.example.com:7687
KAFKA_BOOTSTRAP_SERVERS=kafka.example.com:9092
REDIS_URL=redis://redis.example.com:6379
```

### Kubernetes Secrets

```bash
# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=neo4j-password=xxx \
  --from-literal=smtp-password=xxx \
  -n smart-city
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Load Balancer (ALB/NLB)         │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────┐              ┌─────▼───┐
│Ingress │              │ Service │
│ (API)  │              │ (gRPC)  │
└───┬────┘              └─────┬───┘
    │                         │
┌───▼─────────────────────────▼───┐
│      Kubernetes Pods            │
│  ┌──────────┐  ┌──────────┐    │
│  │Orchestr. │  │  Agents  │    │
│  └──────────┘  └──────────┘    │
└──────────┬──────────────────────┘
           │
    ┌──────┴────────┐
    │               │
┌───▼────┐    ┌────▼─────┐
│Stellio │    │  Neo4j   │
│(StatefulSet) │(StatefulSet)│
└────────┘    └──────────┘
```

## Scaling Configuration

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: orchestrator-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: orchestrator
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Resource Limits

```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## Monitoring Setup

```bash
# Deploy Prometheus & Grafana
./scripts/monitoring_setup.sh

# Access dashboards
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
```

### Health Checks

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Backup & Recovery

### Database Backups

```bash
# Neo4j backup
kubectl exec neo4j-0 -- neo4j-admin backup \
  --backup-dir=/backup --name=graph.backup

# PostgreSQL backup
kubectl exec postgres-0 -- pg_dump \
  -U postgres smart_city > backup.sql
```

### Disaster Recovery

```bash
# Restore from backup
kubectl apply -f k8s/restore-job.yaml

# Verify data integrity
./scripts/health_check.sh
```

## CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t app:${{ github.sha }} .
      - name: Deploy to K8s
        run: ./scripts/deploy.sh
```

## Rollback Procedure

```bash
# Rollback to previous version
./scripts/rollback.sh

# Or manual rollback
kubectl rollout undo deployment/orchestrator -n smart-city

# Verify rollback
kubectl rollout status deployment/orchestrator
```
