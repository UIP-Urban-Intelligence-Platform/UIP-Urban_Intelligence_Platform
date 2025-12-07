#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MongoDB NGSI-LD Data Integrity Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.test_mongodb_deep_integrity
Author: Nguyen Nhat Quang
Created: 2025-11-30
Version: 1.0.0
License: MIT

Description:
    Deep verification test for MongoDB NGSI-LD data integrity.
    Validates complete field preservation and data structure compliance.

Test Coverage:
    1. All NGSI-LD fields preserved (id, type, @context)
    2. All Property attributes preserved with type and value
    3. All GeoProperty attributes preserved with GeoJSON
    4. All Relationship attributes preserved with object
    5. Nested objects and arrays preserved
    6. Metadata fields added correctly
"""

import json
import sys
from copy import deepcopy

try:
    from src.utils.mongodb_helper import get_mongodb_helper

    MONGODB_AVAILABLE = True
except ImportError:
    print("❌ MongoDB helper not available")
    MONGODB_AVAILABLE = False
    sys.exit(1)


def create_complex_entity():
    """Create a complex NGSI-LD entity with all attribute types"""
    return {
        # Core NGSI-LD fields
        "id": "urn:ngsi-ld:Camera:INTEGRITY_TEST_001",
        "type": "Camera",
        "@context": [
            "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
            "https://smartdatamodels.org/context.jsonld",
        ],
        # Simple Property
        "simpleProp": {"type": "Property", "value": "test value"},
        # Property with observedAt
        "propWithTime": {
            "type": "Property",
            "value": 42,
            "observedAt": "2025-11-26T10:30:00Z",
        },
        # Property with unitCode
        "propWithUnit": {
            "type": "Property",
            "value": 25.5,
            "unitCode": "CEL",
            "observedAt": "2025-11-26T10:30:00Z",
        },
        # Property with nested object
        "propNested": {
            "type": "Property",
            "value": {
                "subfield1": "value1",
                "subfield2": {"deepfield": "deepvalue"},
                "subfield3": [1, 2, 3],
            },
        },
        # Property with array value
        "propArray": {"type": "Property", "value": ["item1", "item2", "item3"]},
        # GeoProperty - Point
        "locationPoint": {
            "type": "GeoProperty",
            "value": {"type": "Point", "coordinates": [106.6297, 10.8231]},
        },
        # GeoProperty - Polygon
        "locationPolygon": {
            "type": "GeoProperty",
            "value": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [106.6297, 10.8231],
                        [106.6300, 10.8231],
                        [106.6300, 10.8235],
                        [106.6297, 10.8235],
                        [106.6297, 10.8231],
                    ]
                ],
            },
            "observedAt": "2025-11-26T10:30:00Z",
        },
        # Relationship - simple
        "refSimple": {"type": "Relationship", "object": "urn:ngsi-ld:Related:REL001"},
        # Relationship with metadata
        "refWithMeta": {
            "type": "Relationship",
            "object": "urn:ngsi-ld:Related:REL002",
            "observedAt": "2025-11-26T10:30:00Z",
        },
        # Property with sub-properties (metadata of metadata)
        "propWithSubProp": {
            "type": "Property",
            "value": 100,
            "unitCode": "KMH",
            "observedAt": "2025-11-26T10:30:00Z",
            "accuracy": {"type": "Property", "value": 0.95},
        },
    }


def compare_entities(original, retrieved, path=""):
    """Recursively compare two entities"""
    issues = []

    # Check if types match
    if type(original) != type(retrieved):
        issues.append(
            f"{path}: Type mismatch - original={type(original).__name__}, retrieved={type(retrieved).__name__}"
        )
        return issues

    if isinstance(original, dict):
        # Check all keys exist
        original_keys = set(original.keys())
        retrieved_keys = set(retrieved.keys()) - {
            "_id",
            "_insertedAt",
            "_updatedAt",
        }  # Exclude metadata

        missing_keys = original_keys - retrieved_keys
        if missing_keys:
            issues.append(f"{path}: Missing keys in retrieved: {missing_keys}")

        extra_keys = retrieved_keys - original_keys
        if extra_keys:
            issues.append(f"{path}: Extra keys in retrieved (unexpected): {extra_keys}")

        # Recursively check values
        for key in original_keys:
            if key in retrieved:
                new_path = f"{path}.{key}" if path else key
                issues.extend(compare_entities(original[key], retrieved[key], new_path))

    elif isinstance(original, list):
        if len(original) != len(retrieved):
            issues.append(
                f"{path}: Array length mismatch - original={len(original)}, retrieved={len(retrieved)}"
            )
        else:
            for i, (orig_item, retr_item) in enumerate(zip(original, retrieved)):
                issues.extend(compare_entities(orig_item, retr_item, f"{path}[{i}]"))

    else:
        # Primitive values
        if original != retrieved:
            issues.append(
                f"{path}: Value mismatch - original={original}, retrieved={retrieved}"
            )

    return issues


def test_deep_preservation():
    """Test that all fields are preserved exactly"""
    print("\n" + "=" * 80)
    print("DEEP NGSI-LD DATA PRESERVATION TEST")
    print("=" * 80 + "\n")

    helper = get_mongodb_helper()
    if not helper or not helper.enabled:
        print("❌ MongoDB not available")
        return False

    # Create complex entity
    original_entity = create_complex_entity()

    print("📋 Original entity structure:")
    print(f"  - Core fields: id, type, @context")
    print(
        f"  - Properties: {len([k for k, v in original_entity.items() if isinstance(v, dict) and v.get('type') == 'Property'])}"
    )
    print(
        f"  - GeoProperties: {len([k for k, v in original_entity.items() if isinstance(v, dict) and v.get('type') == 'GeoProperty'])}"
    )
    print(
        f"  - Relationships: {len([k for k, v in original_entity.items() if isinstance(v, dict) and v.get('type') == 'Relationship'])}"
    )
    print(
        f"  - Total attributes: {len([k for k in original_entity.keys() if k not in ['id', 'type', '@context']])}"
    )

    # Save original for comparison (deep copy to prevent mutation)
    original_copy = deepcopy(original_entity)

    # Insert to MongoDB
    print("\n📤 Inserting to MongoDB...")
    success = helper.insert_entity(original_entity)

    if not success:
        print("❌ Insert failed")
        return False

    print("✅ Insert successful")

    # Retrieve from MongoDB
    print("\n📥 Retrieving from MongoDB...")
    retrieved = helper.find_entity(
        original_copy["id"], entity_type=original_copy["type"]
    )

    if not retrieved:
        print("❌ Retrieval failed - entity not found")
        return False

    print("✅ Retrieval successful")

    # Compare
    print("\n🔍 Comparing original vs retrieved...")
    issues = compare_entities(original_copy, retrieved)

    if issues:
        print(f"\n❌ Found {len(issues)} integrity issues:")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
        return False

    # Check metadata was added
    print("\n✅ All NGSI-LD fields preserved 100%!")
    print("\n📊 Additional metadata:")
    if "_insertedAt" in retrieved:
        print(f"  ✅ _insertedAt: {retrieved['_insertedAt']}")
    else:
        print(f"  ❌ _insertedAt: MISSING")

    if "_updatedAt" in retrieved:
        print(f"  ✅ _updatedAt: {retrieved['_updatedAt']}")
    else:
        print(f"  ❌ _updatedAt: MISSING")

    # Detailed field check
    print("\n📋 Detailed field verification:")

    # Core fields
    print("\n  Core NGSI-LD fields:")
    print(f"    ✅ id: {retrieved.get('id') == original_copy['id']}")
    print(f"    ✅ type: {retrieved.get('type') == original_copy['type']}")
    print(f"    ✅ @context: {retrieved.get('@context') == original_copy['@context']}")

    # Properties
    print("\n  Properties:")
    for key, value in original_copy.items():
        if isinstance(value, dict) and value.get("type") == "Property":
            match = retrieved.get(key) == value
            status = "✅" if match else "❌"
            print(
                f"    {status} {key}: type={value.get('type')}, value preserved={match}"
            )

    # GeoProperties
    print("\n  GeoProperties:")
    for key, value in original_copy.items():
        if isinstance(value, dict) and value.get("type") == "GeoProperty":
            match = retrieved.get(key) == value
            status = "✅" if match else "❌"
            geo_type = value.get("value", {}).get("type")
            print(
                f"    {status} {key}: type={value.get('type')}, GeoJSON={geo_type}, preserved={match}"
            )

    # Relationships
    print("\n  Relationships:")
    for key, value in original_copy.items():
        if isinstance(value, dict) and value.get("type") == "Relationship":
            match = retrieved.get(key) == value
            status = "✅" if match else "❌"
            print(
                f"    {status} {key}: type={value.get('type')}, object={value.get('object')}, preserved={match}"
            )

    # Pretty print sample
    print("\n📄 Sample attribute (propNested):")
    print(json.dumps(retrieved.get("propNested"), indent=2))

    print("\n" + "=" * 80)
    print("🎉 TEST PASSED - 100% NGSI-LD DATA INTEGRITY VERIFIED!")
    print("=" * 80)

    return True


def test_batch_preservation():
    """Test batch insert preserves all data"""
    print("\n" + "=" * 80)
    print("BATCH INSERT PRESERVATION TEST")
    print("=" * 80 + "\n")

    helper = get_mongodb_helper()
    if not helper or not helper.enabled:
        print("❌ MongoDB not available")
        return False

    # Create multiple entities
    entities = []
    for i in range(3):
        entity = create_complex_entity()
        entity["id"] = f"urn:ngsi-ld:Camera:BATCH_TEST_{i:03d}"
        entities.append(entity)

    print(f"📋 Created {len(entities)} complex entities")

    # Save originals
    originals = [deepcopy(e) for e in entities]

    # Batch insert
    print("\n📤 Batch inserting to MongoDB...")
    success, failed = helper.insert_entities_batch(entities)

    print(f"✅ Success: {success}")
    print(f"❌ Failed: {failed}")

    if success != len(entities):
        print(f"⚠️  Warning: Expected {len(entities)} success, got {success}")
        return False

    # Retrieve and compare each
    print("\n🔍 Verifying each entity...")
    all_ok = True
    for i, original in enumerate(originals):
        retrieved = helper.find_entity(original["id"], entity_type=original["type"])

        if not retrieved:
            print(f"  ❌ Entity {i+1}: Not found")
            all_ok = False
            continue

        issues = compare_entities(original, retrieved)
        if issues:
            print(f"  ❌ Entity {i+1}: {len(issues)} issues")
            all_ok = False
        else:
            print(f"  ✅ Entity {i+1}: Perfect match")

    if all_ok:
        print("\n🎉 BATCH TEST PASSED - All entities preserved 100%!")
    else:
        print("\n❌ BATCH TEST FAILED - Some entities have issues")

    return all_ok


def main():
    """Main test routine"""
    if not MONGODB_AVAILABLE:
        return

    try:
        # Test 1: Deep preservation
        test1 = test_deep_preservation()

        # Test 2: Batch preservation
        test2 = test_batch_preservation()

        # Summary
        print("\n" + "#" * 80)
        print("FINAL SUMMARY")
        print("#" * 80)
        print(f"Deep Preservation Test: {'✅ PASSED' if test1 else '❌ FAILED'}")
        print(f"Batch Preservation Test: {'✅ PASSED' if test2 else '❌ FAILED'}")

        if test1 and test2:
            print("\n🎉🎉🎉 ALL TESTS PASSED - 100% NGSI-LD DATA INTEGRITY! 🎉🎉🎉")
            sys.exit(0)
        else:
            print("\n❌ SOME TESTS FAILED")
            sys.exit(1)

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
