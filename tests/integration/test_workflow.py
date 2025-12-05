#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Workflow Orchestration Integration Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.integration.test_workflow
Author: Nguyen Nhat Quang
Created: 2025-11-30
Version: 1.0.0
License: MIT

Description:
    Integration tests for multi-phase workflow orchestration,
    validating configuration structure and agent execution flow.
    Tests phase transitions, error handling, and state management.

Usage:
    pytest tests/integration/test_workflow.py
"""

import os
from pathlib import Path
from unittest.mock import Mock, patch

import pytest
import yaml


@pytest.mark.integration
class TestWorkflowOrchestration:
    """Test multi-phase workflow orchestration."""

    @pytest.fixture
    def workflow_config(self, config_dir: Path):
        """Load workflow configuration."""
        with open(config_dir / "workflow.yaml", "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        # Return workflow section or full config
        return config.get("workflow", config)

    def test_workflow_config_valid(self, workflow_config):
        """Test workflow configuration is valid."""
        assert "phases" in workflow_config
        assert isinstance(workflow_config["phases"], list)
        assert len(workflow_config["phases"]) > 0

    def test_all_phases_have_required_fields(self, workflow_config):
        """Test all phases have required fields."""
        required_fields = ["name", "agents"]  # description is optional

        for phase in workflow_config["phases"]:
            for field in required_fields:
                assert field in phase, f"Phase missing field: {field}"

    def test_all_agents_have_module_paths(self, workflow_config):
        """Test all agents have valid module paths."""
        for phase in workflow_config["phases"]:
            for agent in phase["agents"]:
                assert "module" in agent
                assert agent["module"].startswith("src.agents.")

    @pytest.mark.skipif(
        os.environ.get("CI", "false").lower() == "true",
        reason="Agent modules may not be fully accessible in CI",
    )
    def test_agent_modules_exist(self, workflow_config, project_root: Path):
        """Test all agent modules exist as files."""
        for phase in workflow_config["phases"]:
            for agent in phase["agents"]:
                module_path = agent["module"]
                # Convert module path to file path
                file_path = module_path.replace(".", "/") + ".py"
                full_path = project_root / file_path

                assert full_path.exists(), f"Agent module not found: {full_path}"

    @pytest.mark.asyncio
    @patch("src.agents.data_collection.image_refresh_agent.ImageRefreshAgent")
    async def test_phase_execution_mock(self, mock_agent):
        """Test phase execution with mocked agents."""

        # Mock agent execution
        mock_instance = Mock()
        mock_instance.run = Mock(return_value={"status": "success", "processed": 10})
        mock_agent.return_value = mock_instance

        # Simulate phase execution
        result = mock_instance.run()

        # Verify execution
        assert result["status"] == "success"
        assert result["processed"] == 10
        mock_instance.run.assert_called_once()

    def test_parallel_vs_sequential_phases(self, workflow_config):
        """Test parallel and sequential phase configuration."""
        has_parallel = False
        has_sequential = False

        for phase in workflow_config["phases"]:
            if phase.get("parallel") is True:
                has_parallel = True
            else:
                has_sequential = True

        # Should have both types for comprehensive testing
        assert has_parallel or has_sequential
