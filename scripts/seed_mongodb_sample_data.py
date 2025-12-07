#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MongoDB Sample Data Seeder.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: scripts.seed_mongodb_sample_data
Author: Nguyen Nhat Quang
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Seeds sample NGSI-LD entities to MongoDB for testing and verification.

    Sample Entity Types:
    - Camera (traffic monitoring devices)
    - ItemFlowObserved (traffic flow observations)
    - CitizenObservation (citizen reports)
    - RoadAccident (accident incidents)
"""

import sys
from datetime import datetime, timezone

try:
    from src.utils.mongodb_helper import get_mongodb_helper

    MONGODB_AVAILABLE = True
except ImportError:
    print("❌ MongoDB helper not available")
    MONGODB_AVAILABLE = False
    sys.exit(1)


def create_sample_camera() -> dict:
    """Create sample Camera entity"""
    return {
        "id": "urn:ngsi-ld:Camera:CAM001",
        "type": "Camera",
        "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
        "cameraName": {"type": "Property", "value": "Test Camera 001"},
        "location": {
            "type": "GeoProperty",
            "value": {"type": "Point", "coordinates": [105.8342, 21.0278]},  # Hanoi
        },
        "status": {"type": "Property", "value": "active"},
        "cameraType": {"type": "Property", "value": "traffic_monitoring"},
        "dateObserved": {
            "type": "Property",
            "value": datetime.now(timezone.utc).isoformat(),
        },
    }


def create_sample_traffic_flow() -> dict:
    """Create sample ItemFlowObserved entity"""
    timestamp = datetime.now(timezone.utc).isoformat()
    return {
        "id": f"urn:ngsi-ld:ItemFlowObserved:CAM001-{timestamp.replace(':', '').replace('-', '').replace('.', '')}",
        "type": "ItemFlowObserved",
        "@context": [
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
            "https://smartdatamodels.org/context.jsonld",
        ],
        "refDevice": {"type": "Relationship", "object": "urn:ngsi-ld:Camera:CAM001"},
        "location": {
            "type": "GeoProperty",
            "value": {"type": "Point", "coordinates": [105.8342, 21.0278]},
        },
        "intensity": {"type": "Property", "value": 25, "observedAt": timestamp},
        "occupancy": {"type": "Property", "value": 0.65, "observedAt": timestamp},
        "averageSpeed": {
            "type": "Property",
            "value": 35.5,
            "unitCode": "KMH",
            "observedAt": timestamp,
        },
        "vehicleCount": {"type": "Property", "value": 25, "observedAt": timestamp},
        "congestionLevel": {
            "type": "Property",
            "value": "moderate",
            "observedAt": timestamp,
        },
    }


def create_sample_citizen_observation() -> dict:
    """Create sample CitizenObservation entity"""
    timestamp = datetime.now(timezone.utc).isoformat()
    return {
        "id": f"urn:ngsi-ld:CitizenObservation:USER001-{timestamp.replace(':', '').replace('-', '').replace('.', '')}",
        "type": "CitizenObservation",
        "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
        "category": {"type": "Property", "value": "pothole"},
        "description": {"type": "Property", "value": "Large pothole on main road"},
        "location": {
            "type": "GeoProperty",
            "value": {"type": "Point", "coordinates": [105.8400, 21.0300]},
        },
        "imageSnapshot": {
            "type": "Property",
            "value": "https://example.com/images/pothole001.jpg",
        },
        "reportedBy": {"type": "Relationship", "object": "urn:ngsi-ld:User:USER001"},
        "dateObserved": {"type": "Property", "value": timestamp},
        "status": {"type": "Property", "value": "pending_verification"},
        "aiVerified": {"type": "Property", "value": False},
        "aiConfidence": {"type": "Property", "value": 0.0},
    }


def create_sample_road_accident() -> dict:
    """Create sample RoadAccident entity"""
    timestamp = datetime.now(timezone.utc).isoformat()
    return {
        "id": f"urn:ngsi-ld:RoadAccident:CAM001-{timestamp.replace(':', '').replace('-', '').replace('.', '')}",
        "type": "RoadAccident",
        "@context": "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
        "accidentDate": {
            "type": "Property",
            "value": {"@type": "DateTime", "@value": timestamp},
        },
        "severity": {"type": "Property", "value": "moderate"},
        "confidence": {"type": "Property", "value": 0.75},
        "detectionMethod": {
            "type": "Property",
            "value": "speed_variance, occupancy_spike",
        },
        "location": {
            "type": "GeoProperty",
            "value": {"type": "Point", "coordinates": [105.8350, 21.0280]},
        },
        "refCamera": {"type": "Relationship", "object": "urn:ngsi-ld:Camera:CAM001"},
    }


def seed_data():
    """Seed sample data to MongoDB"""
    print("\n" + "=" * 80)
    print("SEEDING SAMPLE NGSI-LD DATA TO MONGODB")
    print("=" * 80 + "\n")

    helper = get_mongodb_helper()
    if not helper or not helper.enabled:
        print("❌ MongoDB not available")
        return False

    # Create sample entities
    entities = [
        create_sample_camera(),
        create_sample_traffic_flow(),
        create_sample_citizen_observation(),
        create_sample_road_accident(),
    ]

    print(f"Created {len(entities)} sample entities:")
    for entity in entities:
        print(f"  - {entity['type']}: {entity['id']}")

    # Insert to MongoDB
    print("\nInserting to MongoDB...")
    success, failed = helper.insert_entities_batch(entities)

    print(f"\n{'='*80}")
    print(f"SEEDING RESULTS")
    print(f"{'='*80}")
    print(f"✅ Successfully inserted: {success}")
    print(f"❌ Failed: {failed}")

    if success > 0:
        print(f"\n🎉 Sample data seeded successfully!")
        print(f"\nRun verification: python verify_mongodb_ngsild_data.py")
        return True
    else:
        print(f"\n❌ Failed to seed data")
        return False


if __name__ == "__main__":
    if not MONGODB_AVAILABLE:
        sys.exit(1)

    try:
        success = seed_data()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
