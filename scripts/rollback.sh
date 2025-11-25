#!/bin/bash
#
# Rollback Script - PRODUCTION READY
#
# Rolls back to previous deployment version.
# Usage: ./rollback.sh [revision-number]
#
#Author: nguyễn Nhật Quang
#Created: 2025-11-25
set -e

REVISION=${1:-0}
NAMESPACE=${NAMESPACE:-traffic-system}

echo "⏮️  Rolling back deployment..."
echo "  Namespace: $NAMESPACE"
echo "  Revision: $REVISION (0 = previous)"
echo ""

echo "Step 1: Rolling back stellio deployment..."
if [ "$REVISION" = "0" ]; then
    kubectl rollout undo deployment/stellio -n $NAMESPACE
else
    kubectl rollout undo deployment/stellio -n $NAMESPACE --to-revision=$REVISION
fi
kubectl rollout status deployment/stellio -n $NAMESPACE --timeout=5m
echo "  ✓ Stellio rollback complete"
echo ""

echo "Step 2: Rolling back traffic-agents deployment..."
if [ "$REVISION" = "0" ]; then
    kubectl rollout undo deployment/traffic-agents -n $NAMESPACE
else
    kubectl rollout undo deployment/traffic-agents -n $NAMESPACE --to-revision=$REVISION
fi
kubectl rollout status deployment/traffic-agents -n $NAMESPACE --timeout=5m
echo "  ✓ Traffic agents rollback complete"
echo ""

echo "Step 3: Verifying health..."
sleep 5
bash scripts/health_check.sh
echo ""

echo "✅ Rollback complete!"
echo "  Current revision:"
kubectl rollout history deployment/stellio -n $NAMESPACE | tail -1
kubectl rollout history deployment/traffic-agents -n $NAMESPACE | tail -1
