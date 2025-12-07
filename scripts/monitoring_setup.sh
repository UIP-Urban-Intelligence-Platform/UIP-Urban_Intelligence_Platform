#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# Monitoring Setup Script - PRODUCTION READY
# Configures Prometheus and Grafana monitoring with real deployments.
# REQUIRES: helm, kubectl
#
# Module: scripts/monitoring_setup.sh
# Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
# Created: 2025-11-25
# Version: 1.0.0
# License: MIT
# Description: Monitoring setup script for the traffic monitoring system
set -e

NAMESPACE=${NAMESPACE:-traffic-system}

echo "📊 Setting up monitoring infrastructure..."
echo ""

echo "Step 1: Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
echo "  ✅ Repositories added"
echo ""

echo "Step 2: Deploying Prometheus..."
helm upgrade --install prometheus prometheus-community/prometheus \
    --namespace $NAMESPACE \
    --create-namespace \
    --set server.service.type=LoadBalancer \
    --set alertmanager.enabled=true \
    --wait
echo "  ✅ Prometheus deployed"
echo ""

echo "Step 3: Deploying Grafana..."
helm upgrade --install grafana grafana/grafana \
    --namespace $NAMESPACE \
    --set service.type=LoadBalancer \
    --set adminPassword=admin \
    --wait
echo "  ✅ Grafana deployed"
echo ""

echo "Step 4: Importing dashboards..."
if [ -f "config/grafana_dashboard.json" ]; then
    kubectl create configmap grafana-dashboards \
        --from-file=config/grafana_dashboard.json \
        -n $NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    echo "  ✅ Dashboards imported"
else
    echo "  ⚠️  Dashboard config not found"
fi
echo ""

echo "Step 5: Configuring alert rules..."
if [ -f "config/prometheus_alerts.yml" ]; then
    kubectl create configmap prometheus-alerts \
        --from-file=config/prometheus_alerts.yml \
        -n $NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    echo "  ✅ Alert rules configured"
else
    echo "  ⚠️  Alert rules not found"
fi
echo ""

echo "✅ Monitoring setup complete!"
echo ""
echo "Access monitoring:"
echo "  Prometheus: kubectl port-forward -n $NAMESPACE svc/prometheus-server 9090:80"
echo "  Grafana: kubectl port-forward -n $NAMESPACE svc/grafana 3000:80"
echo ""
echo "Get Grafana admin password:"
echo "  kubectl get secret -n $NAMESPACE grafana -o jsonpath='{.data.admin-password}' | base64 --decode"
