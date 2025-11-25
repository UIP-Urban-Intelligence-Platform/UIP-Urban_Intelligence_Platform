#!/bin/bash
#
# Deployment Script - PRODUCTION READY
#
# Deploys the traffic monitoring system to production.
# Use --dry-run flag for testing without actual deployment.
# 
#Author: nguyễn Nhật Quang
#Created: 2025-11-25
set -e

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
VERSION=${VERSION:-$(git rev-parse --short HEAD)}
REGISTRY=${REGISTRY:-registry.example.com}
DRY_RUN=${1:-""}

if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "🔍 DRY RUN MODE - No changes will be made"
    KUBECTL="kubectl --dry-run=client"
    DOCKER_PUSH="echo [DRY-RUN]"
else
    KUBECTL="kubectl"
    DOCKER_PUSH="docker push"
fi

echo "🚀 Starting deployment process..."
echo "  Environment: $ENVIRONMENT"
echo "  Version: $VERSION"
echo ""

echo "Step 1: Building Docker images..."
docker build -t $REGISTRY/stellio:$VERSION -f docker/stellio/Dockerfile .
docker build -t $REGISTRY/traffic-agents:$VERSION -f Dockerfile .
echo "  ✓ Images built successfully"
echo ""

echo "Step 2: Pushing images to registry..."
$DOCKER_PUSH $REGISTRY/stellio:$VERSION
$DOCKER_PUSH $REGISTRY/traffic-agents:$VERSION
echo "  ✓ Images pushed to registry"
echo ""

echo "Step 3: Deploying to Kubernetes..."
$KUBECTL apply -f k8s/namespace.yaml
$KUBECTL apply -f k8s/configmap.yaml
$KUBECTL apply -f k8s/secrets.yaml
$KUBECTL set image deployment/stellio stellio=$REGISTRY/stellio:$VERSION -n traffic-system
$KUBECTL set image deployment/traffic-agents agent=$REGISTRY/traffic-agents:$VERSION -n traffic-system
$KUBECTL rollout status deployment/stellio -n traffic-system --timeout=5m
$KUBECTL rollout status deployment/traffic-agents -n traffic-system --timeout=5m
echo "  ✓ Deployment complete"
echo ""

if [ "$DRY_RUN" = "" ]; then
    echo "Step 4: Running health checks..."
    sleep 5
    bash scripts/health_check.sh
fi

echo ""
echo "✅ Deployment complete!"
echo "  Version: $VERSION"
echo "  Registry: $REGISTRY"
