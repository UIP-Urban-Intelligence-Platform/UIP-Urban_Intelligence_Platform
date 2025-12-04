#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Neo4j Integration Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.integration.test_neo4j_integration
Author: Nguyen Nhat Quang
Created: 2025-11-22
Version: 1.0.0
License: MIT

Description:
    Production-ready integration tests for Neo4j graph database.
    Tests graph operations, Cypher queries, and relationship management.
    Requires Docker container for Neo4j.

Usage:
    pytest tests/integration/test_neo4j_integration.py -m requires_docker
"""

import os

import pytest
from neo4j import GraphDatabase

# Skip tests if external services are not available
REQUIRES_NEO4J = pytest.mark.skipif(
    os.environ.get("CI", "false").lower() == "true"
    or os.environ.get("SKIP_EXTERNAL_SERVICES", "true").lower() == "true",
    reason="Neo4j service not available in CI environment",
)


@pytest.mark.integration
@pytest.mark.requires_docker
@REQUIRES_NEO4J
class TestNeo4jIntegration:
    """Test Neo4j graph database integration."""

    @pytest.fixture
    def neo4j_driver(self):
        """Create Neo4j driver instance."""
        driver = GraphDatabase.driver(
            "bolt://localhost:7687", auth=("neo4j", "password")
        )
        yield driver
        driver.close()

    def test_cypher_query_execution(self, neo4j_driver):
        """Test Cypher query execution."""
        with neo4j_driver.session() as session:
            # Create a test node
            result = session.run(
                "CREATE (c:Camera {id: $id, name: $name}) RETURN c",
                id="TEST001",
                name="Test Camera",
            )
            record = result.single()
            assert record is not None

            # Clean up
            session.run("MATCH (c:Camera {id: 'TEST001'}) DELETE c")

    def test_entity_sync(self, neo4j_driver):
        """Test entity synchronization from NGSI-LD to Neo4j."""
        with neo4j_driver.session() as session:
            # Simulate sync operation
            entities = [
                {"id": "CAM001", "name": "Camera 1"},
                {"id": "CAM002", "name": "Camera 2"},
            ]

            for entity in entities:
                session.run(
                    "MERGE (c:Camera {id: $id}) SET c.name = $name",
                    id=entity["id"],
                    name=entity["name"],
                )

            # Verify
            result = session.run(
                "MATCH (c:Camera) WHERE c.id STARTS WITH 'CAM' RETURN count(c) as count"
            )
            count = result.single()["count"]
            assert count >= 2

            # Clean up
            session.run("MATCH (c:Camera) WHERE c.id STARTS WITH 'CAM' DELETE c")
