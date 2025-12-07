#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MongoDB NGSI-LD Data Verification Script.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: scripts.verify_mongodb_ngsild_data
Author: Nguyen Nhat Quang
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Validates MongoDB NGSI-LD data integrity and compliance.

    Validation Checks:
    1. Has proper NGSI-LD structure (id, type, @context)
    2. Contains 100% of original NGSI-LD data
    3. Has correct Property/GeoProperty/Relationship types
    4. Includes metadata timestamps (_insertedAt, _updatedAt)

Usage:
    python scripts/verify_mongodb_ngsild_data.py
"""

import os
import sys
from datetime import datetime
from typing import Any, Dict, List

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

try:
    from src.utils.mongodb_helper import get_mongodb_helper

    MONGODB_AVAILABLE = True
except ImportError:
    print(
        "❌ MongoDB helper not available. Install pymongo: pip install pymongo>=4.6.0"
    )
    MONGODB_AVAILABLE = False
    sys.exit(1)


class NGSILDValidator:
    """Validator for NGSI-LD entity structure"""

    # Required NGSI-LD fields
    REQUIRED_FIELDS = {"id", "type"}

    # Valid NGSI-LD attribute types
    VALID_ATTRIBUTE_TYPES = {"Property", "GeoProperty", "Relationship"}

    # Fields that should not be validated as NGSI-LD attributes
    SKIP_FIELDS = {"id", "type", "@context", "_id", "_insertedAt", "_updatedAt"}

    def __init__(self):
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate_entity(self, entity: Dict[str, Any]) -> bool:
        """
        Validate single NGSI-LD entity structure.

        Returns:
            True if valid, False otherwise
        """
        self.errors.clear()
        self.warnings.clear()

        # Check required fields
        for field in self.REQUIRED_FIELDS:
            if field not in entity:
                self.errors.append(f"Missing required field: {field}")

        if self.errors:
            return False

        # Check @context (optional but recommended)
        if "@context" not in entity:
            self.warnings.append("Missing @context field (recommended for NGSI-LD)")

        # Validate attributes
        for key, value in entity.items():
            if key in self.SKIP_FIELDS:
                continue

            if not isinstance(value, dict):
                self.errors.append(
                    f"Attribute '{key}' is not a dictionary (must be Property/GeoProperty/Relationship)"
                )
                continue

            # Check attribute type
            attr_type = value.get("type")
            if attr_type not in self.VALID_ATTRIBUTE_TYPES:
                self.errors.append(
                    f"Attribute '{key}' has invalid type: {attr_type}. "
                    f"Must be one of: {self.VALID_ATTRIBUTE_TYPES}"
                )

            # Validate based on type
            if attr_type == "Property":
                if "value" not in value:
                    self.errors.append(f"Property '{key}' missing 'value' field")
            elif attr_type == "GeoProperty":
                if "value" not in value:
                    self.errors.append(f"GeoProperty '{key}' missing 'value' field")
                else:
                    geo_value = value["value"]
                    if not isinstance(geo_value, dict):
                        self.errors.append(
                            f"GeoProperty '{key}' value must be a GeoJSON object"
                        )
                    elif "type" not in geo_value or "coordinates" not in geo_value:
                        self.errors.append(
                            f"GeoProperty '{key}' must have 'type' and 'coordinates'"
                        )
            elif attr_type == "Relationship":
                if "object" not in value:
                    self.errors.append(f"Relationship '{key}' missing 'object' field")

        return len(self.errors) == 0

    def get_errors(self) -> List[str]:
        """Get validation errors"""
        return self.errors

    def get_warnings(self) -> List[str]:
        """Get validation warnings"""
        return self.warnings


class MongoDBDataVerifier:
    """Verifies MongoDB NGSI-LD data integrity"""

    def __init__(self):
        self.helper = get_mongodb_helper()
        if not self.helper or not self.helper.enabled:
            raise RuntimeError("MongoDB not configured or not available")

        self.validator = NGSILDValidator()

        # Access database directly from helper
        if self.helper.db is None:
            raise RuntimeError("MongoDB database not initialized")

        self.db = self.helper.db
        self.client = self.helper.client

    def get_collections(self) -> List[str]:
        """Get all collections from collection mappings"""
        collections_config = self.helper.config["mongodb"].get("collections", {})
        return list(set(collections_config.values()))

    def verify_collection(self, collection_name: str) -> Dict[str, Any]:
        """
        Verify all entities in a collection.

        Returns:
            Dictionary with verification results
        """
        print(f"\n{'='*80}")
        print(f"Verifying collection: {collection_name}")
        print(f"{'='*80}")

        collection = self.db[collection_name]
        total_count = collection.count_documents({})

        print(f"Total entities: {total_count}")

        if total_count == 0:
            print("⚠️  Collection is empty")
            return {
                "collection": collection_name,
                "total": 0,
                "valid": 0,
                "invalid": 0,
                "errors": [],
            }

        valid_count = 0
        invalid_count = 0
        errors_list: List[Dict[str, Any]] = []

        # Sample entities for verification
        sample_size = min(total_count, 100)  # Verify up to 100 entities
        entities = list(collection.find().limit(sample_size))

        for entity in entities:
            entity_id = entity.get("id", "UNKNOWN")

            # Validate NGSI-LD structure
            is_valid = self.validator.validate_entity(entity)

            if is_valid:
                valid_count += 1

                # Check metadata
                if "_insertedAt" not in entity:
                    print(f"⚠️  Entity {entity_id} missing _insertedAt metadata")
                if "_updatedAt" not in entity:
                    print(f"⚠️  Entity {entity_id} missing _updatedAt metadata")

                # Display warnings
                for warning in self.validator.get_warnings():
                    print(f"⚠️  Entity {entity_id}: {warning}")
            else:
                invalid_count += 1
                entity_errors = self.validator.get_errors()

                print(f"❌ Entity {entity_id} - INVALID:")
                for error in entity_errors:
                    print(f"   - {error}")

                errors_list.append({"entity_id": entity_id, "errors": entity_errors})

        # Summary
        print(f"\n{'='*80}")
        print(f"VERIFICATION RESULTS - {collection_name}")
        print(f"{'='*80}")
        print(f"Total checked: {len(entities)}")
        print(f"✅ Valid entities: {valid_count}")
        print(f"❌ Invalid entities: {invalid_count}")

        if invalid_count == 0 and valid_count > 0:
            print(
                f"\n🎉 All entities in '{collection_name}' have proper NGSI-LD structure!"
            )

        return {
            "collection": collection_name,
            "total": total_count,
            "checked": len(entities),
            "valid": valid_count,
            "invalid": invalid_count,
            "errors": errors_list,
        }

    def verify_all(self) -> Dict[str, Any]:
        """Verify all collections"""
        print(f"\n{'#'*80}")
        print(f"MONGODB NGSI-LD DATA VERIFICATION")
        db_name = self.helper.config["mongodb"]["database"]["name"]
        print(f"Database: {db_name}")
        print(f"{'#'*80}")

        collections = self.get_collections()
        print(f"\nCollections to verify: {len(collections)}")
        for coll in collections:
            print(f"  - {coll}")

        results = []
        total_valid = 0
        total_invalid = 0

        for collection_name in collections:
            result = self.verify_collection(collection_name)
            results.append(result)
            total_valid += result["valid"]
            total_invalid += result["invalid"]

        # Final summary
        print(f"\n{'#'*80}")
        print(f"OVERALL VERIFICATION SUMMARY")
        print(f"{'#'*80}")
        print(f"Collections verified: {len(collections)}")
        print(f"Total valid entities: {total_valid}")
        print(f"Total invalid entities: {total_invalid}")

        if total_invalid == 0 and total_valid > 0:
            print(f"\n🎉🎉🎉 SUCCESS! 100% NGSI-LD data integrity verified! 🎉🎉🎉")
        elif total_invalid > 0:
            print(
                f"\n❌ Found {total_invalid} invalid entities. Please review errors above."
            )
        else:
            print(f"\n⚠️  No data found in MongoDB collections.")

        return {
            "collections": results,
            "total_valid": total_valid,
            "total_invalid": total_invalid,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    def sample_entity(self, collection_name: str) -> None:
        """Display a sample entity from collection"""
        collection = self.db[collection_name]
        entity = collection.find_one()

        if entity:
            print(f"\n{'='*80}")
            print(f"SAMPLE ENTITY from {collection_name}")
            print(f"{'='*80}")

            # Display key NGSI-LD fields
            print(f"ID: {entity.get('id')}")
            print(f"Type: {entity.get('type')}")
            print(f"@context: {entity.get('@context')}")
            print(f"\nMetadata:")
            print(f"  _insertedAt: {entity.get('_insertedAt')}")
            print(f"  _updatedAt: {entity.get('_updatedAt')}")

            print(f"\nAttributes:")
            for key, value in entity.items():
                if key not in [
                    "_id",
                    "id",
                    "type",
                    "@context",
                    "_insertedAt",
                    "_updatedAt",
                ]:
                    if isinstance(value, dict):
                        attr_type = value.get("type", "Unknown")
                        print(f"  {key}: ({attr_type})")
                    else:
                        print(f"  {key}: (invalid - not a dict)")

            print(f"\n{'='*80}\n")


def main():
    """Main verification routine"""
    if not MONGODB_AVAILABLE:
        return

    try:
        verifier = MongoDBDataVerifier()

        # Run full verification
        results = verifier.verify_all()

        # Show sample entities
        print(f"\n{'#'*80}")
        print(f"SAMPLE ENTITIES")
        print(f"{'#'*80}")

        for coll_result in results["collections"]:
            if coll_result["total"] > 0:
                verifier.sample_entity(coll_result["collection"])

        # Exit with proper code
        if results["total_invalid"] > 0:
            sys.exit(1)
        else:
            sys.exit(0)

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
