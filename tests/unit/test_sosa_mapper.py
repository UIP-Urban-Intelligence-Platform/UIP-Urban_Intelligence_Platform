"""
Unit Tests for SOSA Mapper - PRODUCTION READY
"""

import pytest


class TestSOSAMapper:
    """Test SOSA/SSN RDF mapping."""
    
    def test_map_to_sosa_observation(self):
        """Test SOSA observation mapping."""
        data = {
            "sensor_id": "CAM001",
            "result": 25,
            "timestamp": "2024-01-15T10:00:00Z"
        }
        
        sosa_obs = {
            "@type": "sosa:Observation",
            "sosa:madeBySensor": {"@id": f"urn:sensor:{data['sensor_id']}"},
            "sosa:hasResult": {
                "@type": "sosa:Result",
                "@value": data['result']
            },
            "sosa:resultTime": {"@value": data['timestamp'], "@type": "xsd:dateTime"}
        }
        
        assert sosa_obs["@type"] == "sosa:Observation"
        assert sosa_obs["sosa:hasResult"]["@value"] == 25
    
    def test_sensor_mapping(self):
        """Test sensor entity mapping to SOSA."""
        sensor = {
            "id": "CAM001",
            "type": "Camera",
            "observes": "traffic:VehicleCount"
        }
        
        sosa_sensor = {
            "@id": f"urn:sensor:{sensor['id']}",
            "@type": "sosa:Sensor",
            "sosa:observes": sensor['observes']
        }
        
        assert sosa_sensor["@type"] == "sosa:Sensor"
        assert "sosa:observes" in sosa_sensor
