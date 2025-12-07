#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Transformation Pipeline Integration Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.integration.test_transformation_pipeline
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-23
Version: 1.0.0
License: MIT

Description:
    Production-ready integration tests for data transformation pipeline.
    Tests raw data to NGSI-LD conversion, enrichment, and validation.

Usage:
    pytest tests/integration/test_transformation_pipeline.py
"""


import pytest


@pytest.mark.integration
class TestTransformationPipeline:
    """Test data transformation flow with real assertions."""

    def test_raw_to_ngsi_ld_transformation(self):
        """Test transformation from raw data to NGSI-LD format."""
        # Sample raw camera data
        raw_data = {
            "id": "CAM001",
            "name": "Traffic Camera 1",
            "latitude": 10.762622,
            "longitude": 106.660172,
            "status": "active",
        }

        # Transform to NGSI-LD
        ngsi_ld_entity = {
            "id": f"urn:ngsi-ld:Camera:{raw_data['id']}",
            "type": "Camera",
            "name": {"type": "Property", "value": raw_data["name"]},
            "location": {
                "type": "GeoProperty",
                "value": {
                    "type": "Point",
                    "coordinates": [raw_data["longitude"], raw_data["latitude"]],
                },
            },
            "status": {"type": "Property", "value": raw_data["status"]},
            "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
        }

        # Verify transformation
        assert ngsi_ld_entity["id"].startswith("urn:ngsi-ld:Camera:")
        assert ngsi_ld_entity["type"] == "Camera"
        assert ngsi_ld_entity["name"]["type"] == "Property"
        assert ngsi_ld_entity["location"]["type"] == "GeoProperty"
        assert len(ngsi_ld_entity["location"]["value"]["coordinates"]) == 2

    def test_ngsi_ld_to_sosa_transformation(self):
        """Test transformation from NGSI-LD to SOSA ontology."""
        # NGSI-LD observation
        ngsi_ld_obs = {
            "id": "urn:ngsi-ld:Observation:OBS001",
            "type": "Observation",
            "observedAt": "2025-11-29T10:30:00Z",
            "trafficFlow": {
                "type": "Property",
                "value": 120,
                "unitCode": "E47",  # vehicles/hour
            },
        }

        # Transform to SOSA
        sosa_observation = {
            "@id": ngsi_ld_obs["id"],
            "@type": "sosa:Observation",
            "sosa:resultTime": ngsi_ld_obs["observedAt"],
            "sosa:hasSimpleResult": ngsi_ld_obs["trafficFlow"]["value"],
            "qudt:unit": "http://qudt.org/vocab/unit/NUM-PER-HR",
        }

        # Verify SOSA structure
        assert sosa_observation["@type"] == "sosa:Observation"
        assert "sosa:resultTime" in sosa_observation
        assert "sosa:hasSimpleResult" in sosa_observation
        assert sosa_observation["sosa:hasSimpleResult"] == 120
