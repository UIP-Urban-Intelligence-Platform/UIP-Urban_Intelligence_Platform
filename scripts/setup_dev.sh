#!/bin/bash
#
# Development Environment Setup - PRODUCTION READY
#
# Sets up local development environment with real operations.
#
#Author: nguyễn Nhật Quang
#Created: 2025-11-25
#Version: 1.0.0
#License: MIT
#Description:
#Development environment setup script for the traffic monitoring system.

set -e

echo "🔧 Setting up development environment..."
echo ""

echo "Step 1: Creating Python virtual environment..."
if [ -d "venv" ]; then
    echo "  ⚠️  venv already exists, skipping creation"
else
    python3 -m venv venv
    echo "  ✅ Created venv at ./venv"
fi
echo ""

echo "Step 2: Installing dependencies..."
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate
pip install --upgrade pip
pip install -r requirements.txt
if [ -f "requirements/dev.txt" ]; then
    pip install -r requirements/dev.txt
fi
echo "  ✅ Installed all dependencies"
echo ""

echo "Step 3: Setting up Git hooks..."
if command -v pre-commit &> /dev/null; then
    pre-commit install
    echo "  ✅ Installed pre-commit hooks"
else
    echo "  ⚠️  pre-commit not found, skipping"
fi
echo ""

echo "Step 4: Starting Docker services..."
if [ -f "docker-compose.yml" ]; then
    docker compose up -d
    echo "  ✅ Started Docker services"
    echo ""
    echo "Waiting for services to be ready..."
    sleep 10
else
    echo "  ⚠️  docker-compose.yml not found"
fi
echo ""

echo "✅ Development environment ready!"
echo ""
echo "Next steps:"
echo "  1. Activate venv: source venv/bin/activate"
echo "  2. Run tests: pytest"
echo "  3. Start agents: python -m src.agents.orchestrator"
echo "  4. Check health: bash scripts/health_check.sh"
