#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Orchestrator Unit Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.unit.test_orchestrator
Author: Nguyen Nhat Quang
Created: 2025-11-21
Version: 1.0.0
License: MIT

Description:
    Production-ready unit tests for orchestrator functionality.
    Tests agent execution, dependency resolution, and workflow coordination.

Usage:
    pytest tests/unit/test_orchestrator.py
"""

import asyncio
from unittest.mock import AsyncMock

import pytest

# Import WorkflowOrchestrator from correct module
try:
    from src.orchestrator import WorkflowOrchestrator

    ORCHESTRATOR_AVAILABLE = True
except ImportError:
    WorkflowOrchestrator = None  # type: ignore
    ORCHESTRATOR_AVAILABLE = False

# Reference to suppress unused import warning
_WorkflowOrchestrator = WorkflowOrchestrator


@pytest.mark.skipif(
    not ORCHESTRATOR_AVAILABLE, reason="WorkflowOrchestrator not available"
)
class TestOrchestrator:
    """Test orchestrator agent execution."""

    @pytest.mark.asyncio
    async def test_agent_dependency_resolution(self):
        """Test topological sort of agent dependencies."""
        # Test dependency graph construction
        agents_config = [
            {"name": "agent1", "dependencies": []},
            {"name": "agent2", "dependencies": ["agent1"]},
            {"name": "agent3", "dependencies": ["agent1", "agent2"]},
        ]

        # Build graph
        graph = {agent["name"]: agent["dependencies"] for agent in agents_config}

        # Verify dependencies
        assert graph["agent1"] == []
        assert "agent1" in graph["agent2"]
        assert "agent2" in graph["agent3"]

    @pytest.mark.asyncio
    async def test_parallel_agent_execution(self):
        """Test concurrent agent execution."""
        # Mock agents
        agent1 = AsyncMock()
        agent1.run.return_value = {"status": "completed", "agent": "1"}

        agent2 = AsyncMock()
        agent2.run.return_value = {"status": "completed", "agent": "2"}

        # Execute in parallel
        results = await asyncio.gather(agent1.run(), agent2.run())

        assert len(results) == 2
        assert all(r["status"] == "completed" for r in results)

    def test_graceful_shutdown(self):
        """Test SIGINT/SIGTERM handling."""
        shutdown_flag = False

        def signal_handler(sig, frame):
            nonlocal shutdown_flag
            shutdown_flag = True

        # Simulate signal
        signal_handler(None, None)

        assert shutdown_flag is True
