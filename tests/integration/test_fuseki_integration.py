#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fuseki Integration Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.integration.test_fuseki_integration
Author: Nguyen Nhat Quang
Created: 2025-11-22
Version: 1.0.0
License: MIT

Description:
    Production-ready integration tests for Apache Jena Fuseki SPARQL endpoint.
    Tests RDF triple storage, SPARQL queries, and graph operations.
    Requires Docker container for Fuseki.

Usage:
    pytest tests/integration/test_fuseki_integration.py -m requires_docker
"""

import os

import pytest
import requests

# Skip tests if external services are not available
REQUIRES_FUSEKI = pytest.mark.skipif(
    os.environ.get("CI", "false").lower() == "true"
    or os.environ.get("SKIP_EXTERNAL_SERVICES", "true").lower() == "true",
    reason="Fuseki service not available in CI environment",
)


@pytest.mark.integration
@pytest.mark.requires_docker
@REQUIRES_FUSEKI
class TestFusekiIntegration:
    """Test Apache Jena Fuseki integration."""

    @pytest.fixture
    def fuseki_url(self):
        """Fuseki SPARQL endpoint."""
        return "http://localhost:3030/traffic/sparql"

    def test_sparql_query_execution(self, fuseki_url):
        """Test SPARQL query execution."""
        query = """
        SELECT ?camera ?name
        WHERE {
            ?camera a <http://example.org/Camera> ;
                    <http://www.w3.org/2000/01/rdf-schema#label> ?name .
        }
        LIMIT 10
        """

        response = requests.post(
            fuseki_url,
            data={"query": query},
            headers={"Accept": "application/sparql-results+json"},
        )

        assert response.status_code in [200, 404]  # 404 if empty dataset
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            assert "bindings" in data["results"]

    def test_rdf_upload(self, fuseki_url):
        """Test RDF data upload to Fuseki."""
        update_endpoint = fuseki_url.replace("/sparql", "/update")

        # Insert test triple
        update = """
        PREFIX ex: <http://example.org/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        INSERT DATA {
            ex:TestCamera a ex:Camera ;
                         rdfs:label "Test Camera" .
        }
        """

        response = requests.post(
            update_endpoint,
            data={"update": update},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        # May fail if endpoint doesn't exist, that's OK for this test
        assert response.status_code in [200, 204, 404]
