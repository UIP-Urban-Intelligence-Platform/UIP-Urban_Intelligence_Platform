#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Camera Entity Publisher Script.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: scripts.pipeline.publish_cameras_to_stellio
Author: Nguyen Nhat Quang
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Publishes camera entities from cameras_updated.json to Stellio Context Broker
    using NGSI-LD REST API with verified application/ld+json content type.

Usage:
    python scripts/pipeline/publish_cameras_to_stellio.py

Notes:
    - Requires cameras_updated.json with fresh timestamps from image_refresh_agent
    - Uses application/ld+json with @context in request body
"""

import json
import time
from pathlib import Path

import requests

# Configuration
STELLIO_URL = "http://localhost:8080"
CAMERAS_FILE = "data/cameras_updated.json"  # ✅ Use updated file with fresh timestamps
CONTEXT = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"


def load_cameras():
    """Load camera data from JSON file."""
    filepath = Path(CAMERAS_FILE)
    if not filepath.exists():
        raise FileNotFoundError(f"Camera file not found: {CAMERAS_FILE}")

    with open(filepath, "r", encoding="utf-8") as f:
        cameras = json.load(f)

    # cameras_updated.json is a direct array, not wrapped in object
    if not isinstance(cameras, list):
        cameras = cameras.get("cameras", [])

    print(f"✓ Loaded {len(cameras)} cameras from {CAMERAS_FILE}")
    return cameras


def transform_to_ngsi_ld(camera):
    """Transform camera data to NGSI-LD format."""
    camera_id = camera.get("id", camera.get("name", "unknown")).replace(" ", "-")

    entity = {
        "@context": CONTEXT,
        "id": f"urn:ngsi-ld:Camera:{camera_id}",
        "type": "Camera",
    }

    # Add name as Property
    if "name" in camera:
        entity["name"] = {"type": "Property", "value": camera["name"]}

    # Add description
    if "description" in camera:
        entity["description"] = {"type": "Property", "value": camera["description"]}

    # Add location as GeoProperty
    if "latitude" in camera and "longitude" in camera:
        entity["location"] = {
            "type": "GeoProperty",
            "value": {
                "type": "Point",
                "coordinates": [float(camera["longitude"]), float(camera["latitude"])],
            },
        }

    # Add road information
    if "road" in camera:
        entity["road"] = {"type": "Property", "value": camera["road"]}

    # Add additional properties
    for key in ["status", "ip_address", "rtsp_url", "region", "district"]:
        if key in camera:
            entity[key] = {"type": "Property", "value": camera[key]}

    return entity


def publish_entity(entity):
    """Publish entity to Stellio via REST API."""
    headers = {"Content-Type": "application/ld+json"}

    url = f"{STELLIO_URL}/ngsi-ld/v1/entities"

    try:
        response = requests.post(url, json=entity, headers=headers, timeout=10)

        if response.status_code == 201:
            location = response.headers.get("Location", "")
            return True, location
        elif response.status_code == 409:
            # Entity already exists
            return False, "Already exists"
        else:
            return False, f"HTTP {response.status_code}: {response.text}"

    except Exception as e:
        return False, str(e)


def main():
    print("\n" + "=" * 70)
    print("  PUBLISHING 42 CAMERA ENTITIES TO STELLIO CONTEXT BROKER")
    print("=" * 70)

    # Load cameras
    cameras = load_cameras()

    # Statistics
    success_count = 0
    failed_count = 0
    already_exist_count = 0

    print(f"\n📡 Publishing to {STELLIO_URL}/ngsi-ld/v1/entities")
    print(f"📝 Total cameras to publish: {len(cameras)}\n")

    # Publish each camera
    for i, camera in enumerate(cameras, 1):
        camera_name = camera.get("name", f"Camera {i}")

        try:
            # Transform to NGSI-LD
            entity = transform_to_ngsi_ld(camera)
            entity["id"]

            # Publish
            success, message = publish_entity(entity)

            if success:
                print(f"✓ [{i:2d}/42] {camera_name:30s} | HTTP 201 Created")
                success_count += 1
            elif "Already exists" in message:
                print(f"⊙ [{i:2d}/42] {camera_name:30s} | Already exists (skipped)")
                already_exist_count += 1
            else:
                print(f"✗ [{i:2d}/42] {camera_name:30s} | {message}")
                failed_count += 1

        except Exception as e:
            print(f"✗ [{i:2d}/42] {camera_name:30s} | Error: {e}")
            failed_count += 1

        # Small delay to avoid overwhelming the server
        time.sleep(0.1)

    # Summary
    print("\n" + "=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    print(f"✓ Successfully created: {success_count}")
    print(f"⊙ Already existed:     {already_exist_count}")
    print(f"✗ Failed:              {failed_count}")
    print(f"📊 Total:               {len(cameras)}")
    print("=" * 70)

    if success_count + already_exist_count == len(cameras):
        print("\n🎉 ALL CAMERAS SUCCESSFULLY PUBLISHED TO STELLIO! 🎉\n")
        return 0
    else:
        print(f"\n⚠️  Warning: {failed_count} cameras failed to publish\n")
        return 1


if __name__ == "__main__":
    exit(main())
