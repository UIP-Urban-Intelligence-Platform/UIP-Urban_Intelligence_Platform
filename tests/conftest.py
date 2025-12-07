#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pytest Configuration and Shared Fixtures.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.conftest
Author: Nguyen Nhat Quang
Created: 2025-11-21
Version: 1.0.0
License: MIT

Description:
    Shared pytest fixtures and configuration for unit and integration tests.
    Provides common test utilities, fixtures for config loading, and test data.

    Fixtures include:
    - Configuration loaders for YAML files
    - Mock data generators for NGSI-LD entities
    - Database connection fixtures
    - API client fixtures

Usage:
    Automatically loaded by pytest for all test modules.
"""

import asyncio
from pathlib import Path
from typing import Any, Dict

import pytest
import yaml


# Python 3.9 compatibility: ensure event loop exists for asyncio.Event()
@pytest.fixture(scope="session", autouse=True)
def setup_event_loop_for_session():
    """
    Ensure event loop exists for Python 3.9 compatibility.

    In Python 3.9, asyncio.Event() requires a running event loop.
    This fixture creates one at session scope to ensure all tests
    that instantiate classes using asyncio.Event() can work properly.
    """
    try:
        # Python 3.10+ way - avoid deprecation warning
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No running loop - create new one (Python 3.9 compatible)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    yield loop


@pytest.fixture(scope="session")
def project_root() -> Path:
    """Get project root directory."""
    return Path(__file__).parent.parent


@pytest.fixture(scope="session")
def config_dir(project_root: Path) -> Path:
    """Get config directory."""
    return project_root / "config"


@pytest.fixture(scope="session")
def data_dir(project_root: Path) -> Path:
    """Get data directory."""
    return project_root / "data"


@pytest.fixture
def test_config(config_dir: Path) -> Dict[str, Any]:
    """Load test configuration."""
    config_path = config_dir / "workflow.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


@pytest.fixture
def sample_ngsi_ld_entity() -> Dict[str, Any]:
    """Sample NGSI-LD entity for testing."""
    return {
        "id": "urn:ngsi-ld:TrafficCamera:TEST001",
        "type": "TrafficCamera",
        "name": {"type": "Property", "value": "Test Camera"},
        "location": {
            "type": "GeoProperty",
            "value": {"type": "Point", "coordinates": [106.700981, 10.775264]},
        },
        "status": {"type": "Property", "value": "active"},
        "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
    }


@pytest.fixture
def sample_camera_data() -> Dict[str, Any]:
    """Sample camera data for testing."""
    return {
        "id": "CAM001",
        "name": "Camera Nguyen Hue",
        "location": {"lat": 10.775264, "lon": 106.700981},
        "image_url": "https://example.com/camera/CAM001/image.jpg",
        "status": "active",
    }


@pytest.fixture
def mock_stellio_response():
    """Mock Stellio Context Broker response."""
    return {
        "status_code": 201,
        "headers": {"Location": "urn:ngsi-ld:TrafficCamera:TEST001"},
    }


@pytest.fixture
def mock_fuseki_response():
    """Mock Apache Jena Fuseki SPARQL response."""
    return {
        "head": {"vars": ["subject", "predicate", "object"]},
        "results": {
            "bindings": [
                {
                    "subject": {
                        "type": "uri",
                        "value": "http://example.org/camera/CAM001",
                    },
                    "predicate": {
                        "type": "uri",
                        "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                    },
                    "object": {
                        "type": "uri",
                        "value": "http://www.w3.org/ns/sosa/Platform",
                    },
                }
            ]
        },
    }


@pytest.fixture
def mock_neo4j_response():
    """Mock Neo4j response."""
    return {
        "results": [
            {
                "columns": ["id", "name", "type"],
                "data": [{"row": ["CAM001", "Camera Nguyen Hue", "TrafficCamera"]}],
            }
        ]
    }


# Markers for different test types
def pytest_configure(config):
    """Configure custom pytest markers."""
    config.addinivalue_line("markers", "unit: Unit tests for individual components")
    config.addinivalue_line(
        "markers", "integration: Integration tests requiring external services"
    )
    config.addinivalue_line("markers", "slow: Slow running tests")
    config.addinivalue_line(
        "markers", "requires_docker: Tests requiring Docker services"
    )
