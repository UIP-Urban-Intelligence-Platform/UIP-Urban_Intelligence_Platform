#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# Production Environment Setup - PRODUCTION READY
# Initializes production infrastructure.
# REQUIRES: kubectl, helm, terraform (optional)
#
# Module: scripts/setup_prod.sh
# Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
# Created: 2025-11-25
# Version: 1.0.0
# License: MIT
# Description: Production environment setup script for the traffic monitoring system
set -e

NAMESPACE=${NAMESPACE:-traffic-system}
DRY_RUN=${1:-""}

if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "🔍 DRY RUN MODE"
    KUBECTL="kubectl --dry-run=client"
    HELM="helm --dry-run"
else
    KUBECTL="kubectl"
    HELM="helm"
fi

echo "🏗️  Setting up production environment..."
echo "  Namespace: $NAMESPACE"
echo ""

echo "Step 1: Creating Kubernetes namespace and resources..."
$KUBECTL create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
$KUBECTL apply -f k8s/namespace.yaml
$KUBECTL apply -f k8s/rbac.yaml
echo "  ✅ Namespace and RBAC configured"
echo ""

echo "Step 2: Configuring secrets..."
if [ -f ".env.prod" ]; then
    $KUBECTL create secret generic traffic-system-secrets \
        --from-env-file=.env.prod \
        -n $NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    echo "  ✅ Secrets created from .env.prod"
else
    echo "  ⚠️  .env.prod not found, skipping secret creation"
fi
echo ""

echo "Step 3: Deploying infrastructure services..."
if command -v helm &> /dev/null; then
    # PostgreSQL
    $HELM repo add bitnami https://charts.bitnami.com/bitnami
    $HELM repo update
    $HELM upgrade --install postgresql bitnami/postgresql \
        --set auth.database=stellio \
        -n $NAMESPACE
    
    # Redis
    $HELM upgrade --install redis bitnami/redis \
        --set auth.enabled=false \
        -n $NAMESPACE
    
    echo "  ✅ Database services deployed"
else
    echo "  ⚠️  Helm not installed, skipping infrastructure deployment"
fi
echo ""

echo "Step 4: Deploying monitoring stack..."
if command -v helm &> /dev/null; then
    $HELM repo add prometheus-community https://prometheus-community.github.io/helm-charts
    $HELM upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        -n $NAMESPACE
    echo "  ✅ Prometheus and Grafana deployed"
fi
echo ""

echo "✅ Production environment ready!"
echo ""
echo "Access services:"
$KUBECTL get svc -n $NAMESPACE
