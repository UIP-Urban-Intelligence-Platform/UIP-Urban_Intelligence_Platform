<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: wiki/Deployment-Guide.md
Module: Deployment Guide
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 2.0.0
License: MIT

Description:
  Production deployment documentation for UIP-Urban Intelligence Platform.
============================================================================
-->
# 🚀 Deployment Guide

Production deployment documentation for UIP-Urban Intelligence Platform.

---

## 📊 Deployment Options

| Method | Use Case | Complexity |
|--------|----------|------------|
| Docker Compose | Development, Small deployments | Low |
| Kubernetes | Production, Scalable | Medium |
| Cloud (Azure/AWS/GCP) | Enterprise | High |

---

## 🐳 Docker Compose Deployment

### Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- 16GB RAM minimum
- 50GB disk space

### Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  neo4j:
    image: neo4j:5-enterprise
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
      NEO4J_ACCEPT_LICENSE_AGREEMENT: 'yes'
      NEO4J_PLUGINS: '["apoc"]'
    volumes:
      - neo4j_data:/data
    deploy:
      resources:
        limits:
          memory: 4G
    restart: always

  fuseki:
    image: secoresearch/fuseki:latest
    environment:
      ADMIN_PASSWORD: ${FUSEKI_PASSWORD}
    volumes:
      - fuseki_data:/fuseki
    deploy:
      resources:
        limits:
          memory: 2G
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 2G
    restart: always

  api:
    build:
      context: ./apps/traffic-web-app/backend
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    build:
      context: ./apps/traffic-web-app/frontend
      dockerfile: Dockerfile.prod
    depends_on:
      - api
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - frontend
    restart: always

volumes:
  neo4j_data:
  fuseki_data:
  redis_data:
  postgres_data:
```

### Production Environment File

```env
# .env.production
NODE_ENV=production

# Database credentials
POSTGRES_USER=traffic_user
POSTGRES_PASSWORD=strong_password_here
POSTGRES_DB=traffic_prod

# Redis
REDIS_PASSWORD=redis_strong_password

# Neo4j
NEO4J_PASSWORD=neo4j_strong_password

# Fuseki
FUSEKI_PASSWORD=fuseki_strong_password

# Application
JWT_SECRET=your_256_bit_secret_here
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Deploy Commands

```bash
# Copy environment file
cp .env.example .env.production

# Edit with production values
nano .env.production

# Deploy
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.28+)
- kubectl configured
- Helm 3.x
- Container registry access

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: traffic-system
  labels:
    name: traffic-system
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: traffic-config
  namespace: traffic-system
data:
  NEO4J_URI: bolt://neo4j-service:7687
  FUSEKI_URL: http://fuseki-service:3030
  REDIS_HOST: redis-service
  REDIS_PORT: "6379"
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: traffic-secrets
  namespace: traffic-system
type: Opaque
stringData:
  POSTGRES_PASSWORD: your_password
  NEO4J_PASSWORD: your_password
  REDIS_PASSWORD: your_password
  JWT_SECRET: your_secret
```

### Deployment Example

```yaml
# k8s/deployments/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: traffic-api
  namespace: traffic-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: traffic-api
  template:
    metadata:
      labels:
        app: traffic-api
    spec:
      containers:
        - name: api
          image: your-registry/traffic-api:v2.0.0
          ports:
            - containerPort: 5000
          envFrom:
            - configMapRef:
                name: traffic-config
            - secretRef:
                name: traffic-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 5000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Service

```yaml
# k8s/services/api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: traffic-api-service
  namespace: traffic-system
spec:
  selector:
    app: traffic-api
  ports:
    - protocol: TCP
      port: 5000
      targetPort: 5000
  type: ClusterIP
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: traffic-ingress
  namespace: traffic-system
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - api.yourdomain.com
        - app.yourdomain.com
      secretName: traffic-tls
  rules:
    - host: api.yourdomain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: traffic-api-service
                port:
                  number: 5000
    - host: app.yourdomain.com
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

### Deploy to Kubernetes

```bash
# Apply all configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n traffic-system
kubectl get services -n traffic-system
kubectl get ingress -n traffic-system
```

---

## ☁️ Cloud Deployment

### Azure Container Apps

```bash
# Create resource group
az group create --name traffic-rg --location eastus

# Create Container Apps environment
az containerapp env create \
  --name traffic-env \
  --resource-group traffic-rg \
  --location eastus

# Deploy API
az containerapp create \
  --name traffic-api \
  --resource-group traffic-rg \
  --environment traffic-env \
  --image your-registry/traffic-api:v2.0.0 \
  --target-port 5000 \
  --ingress external \
  --min-replicas 1 \
  --max-replicas 10
```

### AWS ECS

```bash
# Create cluster
aws ecs create-cluster --cluster-name traffic-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster traffic-cluster \
  --service-name traffic-api \
  --task-definition traffic-api:1 \
  --desired-count 3 \
  --launch-type FARGATE
```

---

## 🔒 Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables (not in code)
- [ ] Strong passwords generated
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] CORS configured properly

### Post-Deployment

- [ ] Security headers verified
- [ ] Vulnerability scan completed
- [ ] Penetration testing done
- [ ] Logging configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy tested

### Security Headers (Nginx)

```nginx
# docker/nginx/security.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 📊 Monitoring

### Prometheus Metrics

```yaml
# docker-compose.monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    volumes:
      - ./config/grafana_dashboard.json:/var/lib/grafana/dashboards/traffic.json
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
```

### Health Endpoints

| Service | Health Endpoint | Expected |
|---------|-----------------|----------|
| API | `/health` | `{"status":"healthy"}` |
| Neo4j | `:7474/browser` | Web UI |
| Fuseki | `:3030/$/ping` | 200 OK |
| Redis | `redis-cli PING` | PONG |

---

## 🔄 CI/CD Integration

### GitHub Actions Production Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push images
        run: |
          docker build -t ${{ secrets.REGISTRY }}/api:${{ github.ref_name }} ./apps/traffic-web-app/backend
          docker push ${{ secrets.REGISTRY }}/api:${{ github.ref_name }}
      
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          namespace: traffic-system
          manifests: k8s/
          images: ${{ secrets.REGISTRY }}/api:${{ github.ref_name }}
```

---

## 📦 Backup & Recovery

### Database Backup

```bash
# PostgreSQL
pg_dump -h localhost -U user -d traffic > backup_$(date +%Y%m%d).sql

# Neo4j
neo4j-admin database dump --database=neo4j --to-path=/backups/

# MongoDB
mongodump --uri="mongodb://localhost:27017/traffic" --out=/backups/mongo/
```

### Automated Backup

```yaml
# k8s/cronjob-backup.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: traffic-system
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: backup
              image: backup-tools:latest
              command: ["/scripts/backup.sh"]
          restartPolicy: OnFailure
```

---

## 🔗 Related Pages

- [[Docker-Services]] - Container configuration
- [[CI-CD-Pipeline]] - CI/CD workflows
- [[Configuration]] - Configuration reference
- [[Troubleshooting]] - Common issues
