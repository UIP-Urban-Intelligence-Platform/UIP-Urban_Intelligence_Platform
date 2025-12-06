<!--
SPDX-License-Identifier: MIT
Copyright (c) 2025 UIP Team. All rights reserved.

UIP - Urban Intelligence Platform
Deployment guide documentation.

Module: apps/traffic-web-app/frontend/docs/docs/guides/deployment.md
Author: UIP Team
Version: 1.0.0
-->

# Deployment Guide

## Overview

Complete guide for deploying the HCMC Traffic Management System to production environments including Docker, Kubernetes, and cloud platforms.

## Prerequisites

- Docker 24.0+
- Kubernetes 1.28+ (for K8s deployment)
- MongoDB 6.0+
- Redis 7.0+
- Stellio Context Broker 2.0+
- Apache Jena Fuseki 4.0+

## Environment Configuration

### 1. Environment Variables

Create `.env` file:

```bash
# Application
APP_ENV=production
APP_PORT=8000
DEBUG=false

# Database
MONGO_URI=mongodb://mongo:27017/hcmc_traffic
REDIS_URL=redis://redis:6379

# Context Broker
STELLIO_URL=http://stellio:8080
STELLIO_CONTEXT=https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld

# Triplestore
FUSEKI_URL=http://fuseki:3030
FUSEKI_DATASET=hcmc-traffic

# API Keys
WEATHER_API_KEY=your_openweather_key
AIR_QUALITY_API_KEY=your_aqicn_key

# Security
JWT_SECRET=your_secret_key_here
CORS_ORIGINS=https://traffic.example.com

# Monitoring
GRAFANA_URL=http://grafana:3000
PROMETHEUS_URL=http://prometheus:9090
```

---

## ☁️ Cloud Deployment Guides

### AWS Deployment

#### 1. Infrastructure Setup (Terraform)

```hcl
# main.tf
provider "aws" {
  region = "ap-southeast-1"  # Singapore
}

# ECS Cluster
resource "aws_ecs_cluster" "traffic_cluster" {
  name = "hcmc-traffic-cluster"
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.large"
  allocated_storage = 100
  
  db_name  = "traffic_db"
  username = var.db_username
  password = var.db_password
  
  multi_az = true
  backup_retention_period = 7
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id      = "traffic-redis"
  engine          = "redis"
  engine_version  = "7.0"
  node_type       = "cache.t3.medium"
  num_cache_nodes = 2
}

# Application Load Balancer
resource "aws_lb" "traffic_alb" {
  name               = "traffic-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public[*].id
}
```

#### 2. Deploy with ECS

```bash
# Build and push Docker image
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com

docker build -t traffic-backend .
docker tag traffic-backend:latest <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/traffic-backend:latest
docker push <account-id>.dkr.ecr.ap-southeast-1.amazonaws.com/traffic-backend:latest

# Deploy ECS service
aws ecs update-service \
  --cluster hcmc-traffic-cluster \
  --service traffic-backend-service \
  --force-new-deployment
```

### Azure Deployment

#### 1. Create Resources

```bash
# Create resource group
az group create --name traffic-rg --location southeastasia

# Create AKS cluster
az aks create \
  --resource-group traffic-rg \
  --name traffic-aks \
  --node-count 3 \
  --node-vm-size Standard_D8s_v5 \
  --enable-managed-identity \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group traffic-rg --name traffic-aks

# Create Azure Container Registry
az acr create \
  --resource-group traffic-rg \
  --name trafficacr \
  --sku Standard

# Attach ACR to AKS
az aks update \
  --resource-group traffic-rg \
  --name traffic-aks \
  --attach-acr trafficacr
```

#### 2. Deploy Application

```bash
# Build and push image
az acr build \
  --registry trafficacr \
  --image traffic-backend:v1.0.0 \
  --file Dockerfile .

# Deploy with Helm
helm install traffic-system ./helm/traffic-system \
  --namespace traffic-system \
  --create-namespace \
  --set image.repository=trafficacr.azurecr.io/traffic-backend \
  --set image.tag=v1.0.0
```

### Google Cloud Deployment

#### 1. Setup GKE Cluster

```bash
# Create GKE cluster
gcloud container clusters create traffic-cluster \
  --zone asia-southeast1-a \
  --num-nodes 3 \
  --machine-type n2-standard-8 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials traffic-cluster --zone asia-southeast1-a

# Create Cloud SQL instance
gcloud sql instances create traffic-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-custom-4-16384 \
  --region=asia-southeast1
```

#### 2. Deploy with Cloud Run (Serverless Option)

```bash
# Build image
gcloud builds submit --tag gcr.io/<project-id>/traffic-backend

# Deploy to Cloud Run
gcloud run deploy traffic-backend \
  --image gcr.io/<project-id>/traffic-backend \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10
```

---

## 🔒 Security Hardening

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.traffic.example.com;
    
    ssl_certificate /etc/ssl/certs/traffic.crt;
    ssl_certificate_key /etc/ssl/private/traffic.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    
    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Secrets Management

```bash
# Using HashiCorp Vault
vault kv put secret/traffic/db \
  username=traffic_user \
  password=secure_password

# Using Kubernetes Secrets
kubectl create secret generic db-credentials \
  --from-literal=username=traffic_user \
  --from-literal=password=secure_password \
  --namespace traffic-system

# Using AWS Secrets Manager
aws secretsmanager create-secret \
  --name traffic/db/credentials \
  --secret-string '{"username":"traffic_user","password":"secure_password"}'
```

---

## 📊 Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'traffic-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "title": "Traffic System Overview",
    "panels": [
      {
        "title": "Active Cameras",
        "targets": [{
          "expr": "sum(camera_status{status='active'})"
        }]
      },
      {
        "title": "Accidents Detected (24h)",
        "targets": [{
          "expr": "sum(increase(accidents_detected_total[24h]))"
        }]
      },
      {
        "title": "API Response Time (P95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
        }]
      }
    ]
  }
}
```

## Docker Deployment

### 1. Build Images

```bash
# Build backend
docker build -t hcmc-traffic-backend:latest .

# Build frontend
docker build -t hcmc-traffic-frontend:latest ./apps/traffic-web-app/frontend
```

### 2. Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  backend:
    image: hcmc-traffic-backend:latest
    ports:
      - "8000:8000"
    environment:
      - APP_ENV=production
    depends_on:
      - mongo
      - redis
      - stellio
    restart: always
    
  frontend:
    image: hcmc-traffic-frontend:latest
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: always
    
  mongo:
    image: mongo:6.0
    volumes:
      - mongo_data:/data/db
    restart: always
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always
    
  stellio:
    image: stellio/stellio-context-broker:latest
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
    restart: always
    
  fuseki:
    image: stain/jena-fuseki:latest
    ports:
      - "3030:3030"
    volumes:
      - fuseki_data:/fuseki
    restart: always

volumes:
  mongo_data:
  redis_data:
  fuseki_data:
```

### 3. Deploy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Kubernetes Deployment

### 1. Create Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: hcmc-traffic
```

### 2. ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: hcmc-traffic
data:
  MONGO_URI: "mongodb://mongo:27017/hcmc_traffic"
  STELLIO_URL: "http://stellio:8080"
  FUSEKI_URL: "http://fuseki:3030"
```

### 3. Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: hcmc-traffic
type: Opaque
stringData:
  WEATHER_API_KEY: "your_key"
  JWT_SECRET: "your_secret"
```

### 4. Backend Deployment

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: hcmc-traffic
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: hcmc-traffic-backend:latest
        ports:
        - containerPort: 8000
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: hcmc-traffic
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

### 5. Frontend Deployment

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: hcmc-traffic
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: hcmc-traffic-frontend:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: hcmc-traffic
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 6. Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: hcmc-traffic
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - traffic.example.com
    secretName: tls-secret
  rules:
  - host: traffic.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

### 7. Deploy to Kubernetes

```bash
# Apply all resources
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml
kubectl apply -f ingress.yaml

# Verify deployment
kubectl get pods -n hcmc-traffic
kubectl get services -n hcmc-traffic
```

## Cloud Deployments

### Azure

```bash
# Create resource group
az group create --name hcmc-traffic-rg --location southeastasia

# Create AKS cluster
az aks create \
  --resource-group hcmc-traffic-rg \
  --name hcmc-traffic-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group hcmc-traffic-rg --name hcmc-traffic-cluster

# Deploy
kubectl apply -f k8s/
```

### AWS EKS

```bash
# Create cluster
eksctl create cluster \
  --name hcmc-traffic-cluster \
  --region ap-southeast-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3

# Deploy
kubectl apply -f k8s/
```

### Google Cloud GKE

```bash
# Create cluster
gcloud container clusters create hcmc-traffic-cluster \
  --zone asia-southeast1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2

# Get credentials
gcloud container clusters get-credentials hcmc-traffic-cluster

# Deploy
kubectl apply -f k8s/
```

## Database Setup

### MongoDB

```bash
# Initialize replica set
mongosh --eval "rs.initiate()"

# Create indexes
mongosh hcmc_traffic --eval "
  db.cameras.createIndex({location: '2dsphere'});
  db.accidents.createIndex({timestamp: -1});
  db.traffic_flow.createIndex({camera_id: 1, timestamp: -1});
"
```

### Fuseki

```bash
# Create dataset
curl -X POST http://fuseki:3030/$/datasets \
  -d "dbName=hcmc-traffic" \
  -d "dbType=tdb2"
```

## Monitoring Setup

### Prometheus

```yaml
# prometheus-config.yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
```

### Grafana

```bash
# Import dashboard
curl -X POST http://grafana:3000/api/dashboards/db \\
  -H \"Content-Type: application/json\" \\
  -d @config/grafana_dashboard.json
```

## SSL/TLS Configuration for Kubernetes

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Backup Strategy

```bash
# MongoDB backup
mongodump --uri="mongodb://mongo:27017/hcmc_traffic" --out=/backup

# Fuseki backup
curl -X POST http://fuseki:3030/$/backup/hcmc-traffic
```

## Scaling

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: hcmc-traffic
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Health Checks

```python
# Backend health endpoint
@app.route('/health')
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "mongo": check_mongo_connection(),
            "redis": check_redis_connection(),
            "stellio": check_stellio_connection()
        }
    }
```

## Troubleshooting

### Check Logs

```bash
# Pod logs
kubectl logs -f deployment/backend -n hcmc-traffic

# Docker logs
docker-compose logs -f backend
```

### Debug Connection Issues

```bash
# Test MongoDB
mongosh mongodb://mongo:27017/hcmc_traffic

# Test Redis
redis-cli -h redis ping

# Test Stellio
curl http://stellio:8080/ngsi-ld/v1/entities
```

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Monitoring Guide](./monitoring.md)
- [Security Best Practices](./security.md)

## License

MIT License - Copyright (c) 2025 UIP Contributors (Nguyễn Nhật Quang, Nguyễn Việt Hoàng, Nguyễn Đình Anh Tuấn)
