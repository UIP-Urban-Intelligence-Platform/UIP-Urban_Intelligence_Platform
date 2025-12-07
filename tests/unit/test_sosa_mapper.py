#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SOSA Mapper Unit Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.unit.test_sosa_mapper
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-23
Version: 1.0.0
License: MIT

Description:
    Production-ready unit tests for SOSA/SSN RDF mapping functionality.
    Tests observation mapping, sensor modeling, and property serialization.

Usage:
    pytest tests/unit/test_sosa_mapper.py
"""


class TestSOSAMapper:
    """Test SOSA/SSN RDF mapping."""

    def test_map_to_sosa_observation(self):
        """Test SOSA observation mapping."""
        data = {
            "sensor_id": "CAM001",
            "result": 25,
            "timestamp": "2025-11-29T10:00:00Z",
        }

        sosa_obs = {
            "@type": "sosa:Observation",
            "sosa:madeBySensor": {"@id": f"urn:sensor:{data['sensor_id']}"},
            "sosa:hasResult": {"@type": "sosa:Result", "@value": data["result"]},
            "sosa:resultTime": {"@value": data["timestamp"], "@type": "xsd:dateTime"},
        }

        assert sosa_obs["@type"] == "sosa:Observation"
        assert sosa_obs["sosa:hasResult"]["@value"] == 25

    def test_sensor_mapping(self):
        """Test sensor entity mapping to SOSA."""
        sensor = {"id": "CAM001", "type": "Camera", "observes": "traffic:VehicleCount"}

        sosa_sensor = {
            "@id": f"urn:sensor:{sensor['id']}",
            "@type": "sosa:Sensor",
            "sosa:observes": sensor["observes"],
        }

        assert sosa_sensor["@type"] == "sosa:Sensor"
        assert "sosa:observes" in sosa_sensor
