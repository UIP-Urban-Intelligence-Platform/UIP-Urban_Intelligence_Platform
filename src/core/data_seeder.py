#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Data Seeder for Workflow Testing.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.core.data_seeder
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
    Generates mock NGSI-LD entities for testing workflow phases without requiring
    real data sources. Supports configurable entity generation for cameras, accidents,
    patterns, and observations.

Core Features:
    - Configurable mock data generation via workflow.yaml
    - NGSI-LD compliant entity structure
    - Realistic property values with randomization
    - Support for temporal and geospatial properties
    - Batch generation for performance testing

Configuration:
    Enable via workflow.yaml:
    seed_data:
      enabled: true
      entity_types:
        - Camera
        - Accident
        - Pattern
      count: 100

Examples:
    >>> from src.core.data_seeder import DataSeeder
    >>>
    >>> config = {'entity_types': ['Camera'], 'count': 10}
    >>> seeder = DataSeeder(config)
    >>> cameras = seeder.generate_cameras(10)
    >>> print(len(cameras))  # 10

Use Cases:
    - Testing workflow phases without external data sources
    - Performance benchmarking with large entity volumes
    - Development environment setup
    - CI/CD pipeline integration testing
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class DataSeeder:
    """Generate mock NGSI-LD entities for testing"""

    def __init__(self, seed_config: Dict):
        """
        Initialize data seeder

        Args:
            seed_config: Seed data configuration from workflow.yaml
        """
        self.enabled = seed_config.get("enabled", False)
        self.files = seed_config.get("files", [])

    def seed_all(self) -> None:
        """Seed all configured files with mock data"""
        if not self.enabled:
            logger.info("Seed data disabled - using real data")
            return

        logger.info("=" * 80)
        logger.info("SEEDING MOCK DATA FOR TESTING")
        logger.info("=" * 80)

        for file_config in self.files:
            path = file_config.get("path")
            count = file_config.get("count", 0)

            if count > 0:
                self._seed_file(path, count)

        logger.info("Mock data seeding completed")
        logger.info("=" * 80)

    def _seed_file(self, file_path: str, count: int) -> None:
        """
        Seed a specific file with mock entities

        Args:
            file_path: Path to file to seed
            count: Number of mock entities to generate
        """
        # Ensure directory exists
        Path(file_path).parent.mkdir(parents=True, exist_ok=True)

        # Determine entity type from file name
        filename_lower = file_path.lower()
        if "accident" in filename_lower:
            entities = self._generate_mock_accidents(count)
        elif "pattern" in filename_lower or "traffic" in filename_lower:
            entities = self._generate_mock_patterns(count)
        elif "camera" in filename_lower or "update" in filename_lower:
            entities = self._generate_mock_camera_updates(count)
        else:
            logger.warning(f"Unknown entity type for {file_path}, skipping")
            return

        # Save to file
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(entities, f, indent=2, ensure_ascii=False)

        logger.info(f"  ✓ Seeded {count} mock entities to {file_path}")

    def _generate_mock_accidents(self, count: int) -> List[Dict[str, Any]]:
        """Generate mock accident entities"""
        timestamp = datetime.utcnow().isoformat() + "Z"
        entities = []

        for i in range(count):
            entity = {
                "id": f"urn:ngsi-ld:Accident:mock-{i}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "type": "Accident",
                "accidentDate": {"type": "Property", "value": timestamp},
                "location": {
                    "type": "GeoProperty",
                    "value": {
                        "type": "Point",
                        "coordinates": [106.6296 + i * 0.01, 10.7629 + i * 0.01],
                    },
                },
                "accidentType": {
                    "type": "Property",
                    "value": ["collision", "rear-end", "side-swipe"][i % 3],
                },
                "severity": {
                    "type": "Property",
                    "value": ["minor", "moderate", "severe"][i % 3],
                },
                "vehiclesInvolved": {"type": "Property", "value": 2 + (i % 3)},
                "description": {
                    "type": "Property",
                    "value": f"Mock accident #{i} for testing purposes",
                },
                "weatherCondition": {"type": "Property", "value": "clear"},
                "status": {"type": "Property", "value": "detected"},
                "detectedBy": {
                    "type": "Relationship",
                    "object": f"urn:ngsi-ld:Camera:{i}",
                },
                "@context": [
                    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
                ],
            }
            entities.append(entity)

        return entities

    def _generate_mock_patterns(self, count: int) -> List[Dict[str, Any]]:
        """Generate mock traffic pattern entities"""
        timestamp = datetime.utcnow().isoformat() + "Z"
        entities = []

        for i in range(count):
            entity = {
                "id": f"urn:ngsi-ld:TrafficPattern:mock-{i}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "type": "TrafficPattern",
                "name": {
                    "type": "Property",
                    "value": f"Mock Pattern {i}: {'Rush Hour' if i % 2 == 0 else 'Off-Peak'}",
                },
                "patternType": {
                    "type": "Property",
                    "value": ["temporal", "spatial", "congestion"][i % 3],
                },
                "detectedAt": {"type": "Property", "value": timestamp},
                "confidence": {"type": "Property", "value": 0.7 + (i * 0.05)},
                "averageSpeed": {
                    "type": "Property",
                    "value": 45.0 + (i * 5),
                    "unitCode": "KMH",
                },
                "averageIntensity": {"type": "Property", "value": 0.3 + (i * 0.1)},
                "peakTime": {"type": "Property", "value": f"{7 + i}:00-{9 + i}:00"},
                "affectedRoads": {
                    "type": "Property",
                    "value": [f"Road-{i}", f"Road-{i+1}"],
                },
                "description": {
                    "type": "Property",
                    "value": f"Mock traffic pattern #{i} for testing purposes",
                },
                "observationCount": {"type": "Property", "value": 100 + (i * 50)},
                "@context": [
                    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
                ],
            }
            entities.append(entity)

        return entities

    def _generate_mock_camera_updates(self, count: int) -> List[Dict[str, Any]]:
        """Generate mock camera update entities"""
        timestamp = datetime.utcnow().isoformat() + "Z"
        entities = []

        for i in range(count):
            entity = {
                "id": f"urn:ngsi-ld:Camera:{i}",
                "type": "Camera",
                "name": {"type": "Property", "value": f"Mock Camera Update {i}"},
                "location": {
                    "type": "GeoProperty",
                    "value": {
                        "type": "Point",
                        "coordinates": [106.6296 + i * 0.01, 10.7629 + i * 0.01],
                    },
                },
                "status": {"type": "Property", "value": "updated"},
                "lastUpdate": {"type": "Property", "value": timestamp},
                "imageUrl": {
                    "type": "Property",
                    "value": f"https://example.com/camera-{i}/latest.jpg",
                },
                "description": {
                    "type": "Property",
                    "value": f"Mock camera update #{i} for testing purposes",
                },
                "@context": [
                    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
                ],
            }
            entities.append(entity)

        return entities


def seed_data_if_enabled(seed_config: Dict) -> None:
    """
    Convenience function to seed data if enabled

    Args:
        seed_config: Seed data configuration
    """
    seeder = DataSeeder(seed_config)
    seeder.seed_all()


if __name__ == "__main__":
    # Test seeding
    import yaml

    logging.basicConfig(level=logging.INFO)

    with open("config/workflow.yaml", "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    seed_config = config.get("seed_data", {})
    seed_data_if_enabled(seed_config)
