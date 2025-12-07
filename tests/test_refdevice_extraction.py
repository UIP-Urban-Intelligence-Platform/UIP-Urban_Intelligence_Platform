#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Test refDevice Extraction Logic.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.test_refdevice_extraction
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Tests extraction of refDevice relationships from NGSI-LD JSON-LD payloads.
    Validates proper handling of Relationship type and hasObject properties.

Usage:
    python tests/test_refdevice_extraction.py
"""

payload = {
    "https://uri.etsi.org/ngsi-ld/default-context/refDevice": [
        {
            "@type": ["https://uri.etsi.org/ngsi-ld/Relationship"],
            "https://uri.etsi.org/ngsi-ld/hasObject": [{"@id": "urn:ngsi-ld:Camera:0"}],
        }
    ]
}

rel_name = "refDevice"

# Test helper logic
for key in payload.keys():
    print(f"Key: {key}")
    print(f"Contains refDevice: {rel_name.lower() in key.lower()}")

    if rel_name.lower() in key.lower():
        rel_data = payload[key]
        print(f"rel_data type: {type(rel_data)}")
        print(f"rel_data: {rel_data}")

        # Handle array format
        if isinstance(rel_data, list) and len(rel_data) > 0:
            rel_item = rel_data[0]
            print(f"rel_item: {rel_item}")

            if isinstance(rel_item, dict):
                for obj_key in rel_item.keys():
                    print(f"  obj_key: {obj_key}")
                    if "hasObject" in obj_key:
                        print(f"    ✅ Found hasObject!")
                        obj_value = rel_item[obj_key]
                        print(f"    obj_value: {obj_value}")
                        if isinstance(obj_value, list) and len(obj_value) > 0:
                            obj_item = obj_value[0]
                            if "@id" in obj_item:
                                camera_id = obj_item["@id"]
                                print(f"    ✅✅ Extracted Camera ID: {camera_id}")
