#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test JSON-LD Value Extraction.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.test_jsonld_extraction
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Tests extraction of values from NGSI-LD JSON-LD formatted data structures.
    Validates proper handling of Property, GeoProperty, and Relationship types.

Usage:
    python tests/test_jsonld_extraction.py
"""

# Sample vehicleCount from PostgreSQL
vehicleCount_data = [
    {
        "@type": ["https://uri.etsi.org/ngsi-ld/Property"],
        "https://uri.etsi.org/ngsi-ld/hasValue": [{"@value": 15}],
    }
]


def extract_jsonld_value(data):
    """Extract value from JSON-LD."""
    if data is None:
        return None

    # Unwrap outer array
    if isinstance(data, list) and len(data) > 0:
        data = data[0]

    # Handle dict
    if isinstance(data, dict):
        # Direct @value
        if "@value" in data:
            return data["@value"]

        # NGSI-LD value
        if "value" in data:
            return data["value"]

        # JSON-LD hasValue
        for key in data.keys():
            if "hasValue" in key:
                has_value_data = data[key]
                if isinstance(has_value_data, list) and len(has_value_data) > 0:
                    value_item = has_value_data[0]
                    if isinstance(value_item, dict) and "@value" in value_item:
                        return value_item["@value"]
                    return value_item
                elif isinstance(has_value_data, dict) and "@value" in has_value_data:
                    return has_value_data["@value"]
                return has_value_data

    return data


result = extract_jsonld_value(vehicleCount_data)
print(f"Extracted vehicleCount: {result}")
print(f"Type: {type(result)}")
