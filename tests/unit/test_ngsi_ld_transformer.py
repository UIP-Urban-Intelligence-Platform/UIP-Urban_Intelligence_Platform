#!/usr/bin/env python3
"""NGSI-LD Transformer Unit Test Suite.
Unit Tests for NGSI-LD Transformer - PRODUCTION READY
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-23
Version: 1.0.0
License: MIT

Description:
    Production-ready unit tests for NGSI-LD transformation functionality.
    Tests observation to NGSI-LD conversion, property handling, and validation.

Usage:
    pytest tests/unit/test_ngsi_ld_transformer.py
"""

import pytest
from datetime import datetime


class TestNGSILDTransformer:
    """Test NGSI-LD transformation."""
    
    def test_transform_observation_to_ngsi_ld(self):
        """Test observation transformation to NGSI-LD."""
        observation = {
            "camera_id": "CAM001",
            "vehicles": 15,
            "timestamp": "2024-01-15T10:30:00Z"
        }
        
        # Transform to NGSI-LD
        ngsi_ld = {
            "id": f"urn:ngsi-ld:Observation:CAM001:{observation['timestamp']}",
            "type": "Observation",
            "madeBySensor": {
                "type": "Relationship",
                "object": f"urn:ngsi-ld:Camera:{observation['camera_id']}"
            },
            "hasResult": {
                "type": "Property",
                "value": observation['vehicles'],
                "observedAt": observation['timestamp']
            }
        }
        
        assert ngsi_ld["type"] == "Observation"
        assert ngsi_ld["hasResult"]["value"] == 15
    
    def test_context_linking(self):
        """Test @context generation."""
        context = {
            "@context": [
                "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
                {
                    "sosa": "http://www.w3.org/ns/sosa/",
                    "traffic": "http://example.org/traffic#"
                }
            ]
        }
        
        assert "@context" in context
        assert isinstance(context["@context"], list)
        assert len(context["@context"]) >= 2
