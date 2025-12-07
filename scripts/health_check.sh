#!/bin/bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2025 UIP Team. All rights reserved.
#
# UIP - Urban Intelligence Platform
# https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
#
# Health Check Script - PRODUCTION READY
# Checks health of all services using real HTTP requests.
#
# Module: scripts/health_check.sh
# Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
# Created: 2025-11-25
# Version: 1.0.0
# License: MIT
# Description: Health check script for the traffic monitoring system
set +e  # Don't exit on error, collect all results

STELLIO_URL=${STELLIO_URL:-http://localhost:8080}
POSTGRES_HOST=${POSTGRES_HOST:-localhost}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
NEO4J_URL=${NEO4J_URL:-bolt://localhost:7687}

FAILED=0

echo "🏥 Running health checks..."
echo ""

echo "Checking Stellio Context Broker..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $STELLIO_URL/ngsi-ld/v1/entities 2>/dev/null)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "400" ]; then
    echo "  ✅ Stellio responding (HTTP $STATUS)"
else
    echo "  ❌ Stellio unreachable (HTTP $STATUS)"
    FAILED=$((FAILED + 1))
fi
echo ""

echo "Checking PostgreSQL..."
if command -v pg_isready &> /dev/null; then
    if pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT > /dev/null 2>&1; then
        echo "  ✅ PostgreSQL accepting connections"
    else
        echo "  ❌ PostgreSQL not responding"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  ⚠️  pg_isready not installed, skipping"
fi
echo ""

echo "Checking Redis..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping > /dev/null 2>&1; then
        echo "  ✅ Redis responding to PING"
    else
        echo "  ❌ Redis not responding"
        FAILED=$((FAILED + 1))
    fi
else
    echo "  ⚠️  redis-cli not installed, skipping"
fi
echo ""

echo "Checking Neo4j..."
NEO4J_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7474 2>/dev/null)
if [ "$NEO4J_STATUS" = "200" ]; then
    echo "  ✅ Neo4j browser accessible"
else
    echo "  ❌ Neo4j not responding"
    FAILED=$((FAILED + 1))
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All health checks passed!"
    exit 0
else
    echo "❌ $FAILED service(s) failed health check"
    exit 1
fi
