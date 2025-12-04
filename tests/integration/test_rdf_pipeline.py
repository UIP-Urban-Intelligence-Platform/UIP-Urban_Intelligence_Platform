#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""RDF Pipeline Integration Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.integration.test_rdf_pipeline
Author: Nguyen Viet Hoang
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Production-ready integration tests for RDF generation pipeline.
    Tests NGSI-LD to RDF conversion, triple generation, and graph serialization.

Usage:
    pytest tests/integration/test_rdf_pipeline.py
"""

import pytest
from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import RDF, RDFS


@pytest.mark.integration
class TestRDFPipeline:
    """Test RDF generation pipeline."""

    def test_ngsi_ld_to_rdf_conversion(self):
        """Test converting NGSI-LD to RDF triples."""
        # Sample NGSI-LD entity
        ngsi_ld_entity = {
            "id": "urn:ngsi-ld:Camera:CAM001",
            "type": "Camera",
            "name": {"type": "Property", "value": "Traffic Camera 1"},
            "location": {
                "type": "GeoProperty",
                "value": {"type": "Point", "coordinates": [106.660172, 10.762622]},
            },
        }

        # Convert to RDF
        g = Graph()
        TRAFFIC = Namespace("http://example.org/traffic#")
        NGSI = Namespace("https://uri.etsi.org/ngsi-ld/")

        camera_uri = URIRef(ngsi_ld_entity["id"])
        g.add((camera_uri, RDF.type, TRAFFIC.Camera))
        g.add((camera_uri, RDFS.label, Literal(ngsi_ld_entity["name"]["value"])))

        # Verify RDF graph
        assert len(g) >= 2
        assert (camera_uri, RDF.type, TRAFFIC.Camera) in g

        # Serialize to Turtle
        turtle_output = g.serialize(format="turtle")
        assert "Camera" in turtle_output
        assert "Traffic Camera 1" in turtle_output
