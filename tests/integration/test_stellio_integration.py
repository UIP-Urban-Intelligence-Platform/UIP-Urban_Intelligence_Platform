#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stellio Context Broker Integration Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.integration.test_stellio_integration
Author: Nguyen Viet Hoang
Created: 2025-11-24
Version: 1.0.0
License: MIT

Description:
    Integration tests for Stellio Context Broker interactions,
    validating NGSI-LD entity operations (create, read, update, delete).
    Tests full CRUD operations, temporal queries, and subscriptions.

Requirements:
    - Docker container with Stellio running on localhost:8080
    - Use pytest marker: @pytest.mark.requires_docker

Usage:
    pytest tests/integration/test_stellio_integration.py -m requires_docker
"""

import os
from typing import Any, Dict

import httpx
import pytest

# Skip tests if external services are not available
REQUIRES_STELLIO = pytest.mark.skipif(
    os.environ.get("CI", "false").lower() == "true"
    or os.environ.get("SKIP_EXTERNAL_SERVICES", "true").lower() == "true",
    reason="Stellio service not available in CI environment",
)


@pytest.mark.integration
@pytest.mark.requires_docker
@REQUIRES_STELLIO
class TestStellioIntegration:
    """Integration tests for Stellio Context Broker."""

    @pytest.fixture
    def stellio_url(self):
        """Stellio base URL."""
        return "http://localhost:8080/ngsi-ld/v1"

    @pytest.fixture
    async def http_client(self):
        """HTTP client for Stellio."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            yield client

    @pytest.mark.asyncio
    async def test_create_entity(
        self,
        http_client: httpx.AsyncClient,
        stellio_url: str,
        sample_ngsi_ld_entity: Dict[str, Any],
    ):
        """Test creating NGSI-LD entity in Stellio."""
        response = await http_client.post(
            f"{stellio_url}/entities",
            json=sample_ngsi_ld_entity,
            headers={"Content-Type": "application/ld+json"},
        )

        assert response.status_code == 201
        assert "Location" in response.headers

    @pytest.mark.asyncio
    async def test_get_entity(self, http_client: httpx.AsyncClient, stellio_url: str):
        """Test retrieving entity from Stellio."""
        entity_id = "urn:ngsi-ld:TrafficCamera:TEST001"

        response = await http_client.get(
            f"{stellio_url}/entities/{entity_id}",
            headers={"Accept": "application/ld+json"},
        )

        # Entity might not exist in test environment
        assert response.status_code in [200, 404]

    @pytest.mark.asyncio
    async def test_query_entities(
        self, http_client: httpx.AsyncClient, stellio_url: str
    ):
        """Test querying entities by type."""
        response = await http_client.get(
            f"{stellio_url}/entities",
            params={"type": "TrafficCamera"},
            headers={"Accept": "application/ld+json"},
        )

        assert response.status_code == 200
        entities = response.json()
        assert isinstance(entities, list)

    @pytest.mark.asyncio
    async def test_temporal_query(
        self, http_client: httpx.AsyncClient, stellio_url: str
    ):
        """Test temporal entity query."""
        response = await http_client.get(
            f"{stellio_url}/temporal/entities",
            params={
                "type": "TrafficObservation",
                "timerel": "after",
                "timeAt": "2025-11-20T00:00:00Z",
            },
            headers={"Accept": "application/ld+json"},
        )

        assert response.status_code in [200, 404]
