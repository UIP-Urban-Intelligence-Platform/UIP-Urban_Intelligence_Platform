#!/usr/bin/env python3
"""Seed Citizen Reports - Upload test data to Citizen Ingestion API.

Author: Nguyen Dinh Anh Tuan
Created: 2025-11-28
Modified: 2025-11-28
Version: 1.0.0
License: MIT

This script sends citizen reports with images from data/cache/images folder
to the running Citizen Ingestion Agent API at http://localhost:8001
"""

import os
import json
import random
import requests
from pathlib import Path
from datetime import datetime, timedelta

# Configuration
API_URL = "http://localhost:8001/api/v1/citizen-reports"
IMAGES_DIR = Path("data/cache/images")
NUM_REPORTS = 100

# Sample data for generating realistic reports
REPORT_TYPES = ["traffic_jam", "accident", "flood", "road_damage", "other"]

DESCRIPTIONS = {
    "traffic_jam": [
        "Heavy traffic congestion on main road",
        "Severe traffic jam, cars not moving",
        "Traffic backed up for several blocks",
        "Multiple lanes blocked, heavy congestion",
        "Rush hour traffic jam"
    ],
    "accident": [
        "2 cars collision at intersection",
        "Minor accident blocking right lane",
        "Multi-vehicle accident on highway",
        "Motorcycle accident, need assistance",
        "Car hit street sign, debris on road"
    ],
    "flood": [
        "Street flooding after heavy rain",
        "Water level rising on road",
        "Flooded underpass, road closed",
        "Heavy flooding blocking traffic",
        "Water covering entire street"
    ],
    "road_damage": [
        "Large pothole damaging vehicles",
        "Road surface damaged, needs repair",
        "Broken pavement blocking lane",
        "Road crack causing hazard",
        "Damaged road surface"
    ],
    "other": [
        "Fallen tree blocking road",
        "Street light not working",
        "Traffic signal malfunction",
        "Road debris needs clearing",
        "Construction blocking traffic"
    ]
}

# Ho Chi Minh City coordinates (approximate area)
HCMC_LAT_MIN, HCMC_LAT_MAX = 10.7, 10.9
HCMC_LON_MIN, HCMC_LON_MAX = 106.6, 106.8

# User IDs for variety
USER_IDS = [f"user_{i:05d}" for i in range(1, 51)]


def get_random_coordinates():
    """Generate random coordinates in HCMC area."""
    lat = random.uniform(HCMC_LAT_MIN, HCMC_LAT_MAX)
    lon = random.uniform(HCMC_LON_MIN, HCMC_LON_MAX)
    return round(lat, 6), round(lon, 6)


def get_random_timestamp():
    """Generate random timestamp within last 7 days."""
    now = datetime.utcnow()
    days_ago = random.randint(0, 7)
    hours_ago = random.randint(0, 23)
    minutes_ago = random.randint(0, 59)
    
    timestamp = now - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)
    return timestamp.isoformat() + 'Z'


def send_citizen_report(image_filename: str, report_num: int):
    """Send a single citizen report to the API."""
    # Choose random report type
    report_type = random.choice(REPORT_TYPES)
    
    # Get random description for this type
    description = random.choice(DESCRIPTIONS[report_type])
    
    # Generate random coordinates
    latitude, longitude = get_random_coordinates()
    
    # Choose random user
    user_id = random.choice(USER_IDS)
    
    # Create image URL (using local path for now, in production would be cloud storage)
    image_url = f"file://{IMAGES_DIR.absolute()}/{image_filename}"
    
    # Generate timestamp
    timestamp = get_random_timestamp()
    
    # Create report payload
    payload = {
        "userId": user_id,
        "reportType": report_type,
        "description": description,
        "latitude": latitude,
        "longitude": longitude,
        "imageUrl": image_url,
        "timestamp": timestamp
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=30)
        
        if response.status_code == 202:
            result = response.json()
            print(f"✅ [{report_num:3d}/100] Report accepted: {result['reportId'][:8]}... | "
                  f"{report_type:12s} | {user_id} | {image_filename[:30]}")
            return True
        else:
            print(f"❌ [{report_num:3d}/100] Failed: HTTP {response.status_code} | {image_filename}")
            print(f"   Response: {response.text[:100]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ [{report_num:3d}/100] Connection Error: API not running at {API_URL}")
        print("   Please start the Citizen Ingestion Agent first:")
        print("   python -m uvicorn src.agents.ingestion.citizen_ingestion_agent:app --port 8001")
        return False
    except Exception as e:
        print(f"❌ [{report_num:3d}/100] Error: {e} | {image_filename}")
        return False


def main():
    """Main execution function."""
    print("=" * 80)
    print("🚀 Citizen Report Seeding Script")
    print("=" * 80)
    print(f"API Endpoint: {API_URL}")
    print(f"Images Directory: {IMAGES_DIR}")
    print(f"Number of Reports: {NUM_REPORTS}")
    print("=" * 80)
    
    # Check if images directory exists
    if not IMAGES_DIR.exists():
        print(f"❌ Error: Images directory not found: {IMAGES_DIR}")
        return
    
    # Get list of image files
    image_files = sorted([f.name for f in IMAGES_DIR.glob("*.jpg")])
    
    if not image_files:
        print(f"❌ Error: No .jpg images found in {IMAGES_DIR}")
        return
    
    print(f"📁 Found {len(image_files)} images in directory")
    print()
    
    # Select 100 random images (or all if less than 100)
    selected_images = random.sample(image_files, min(NUM_REPORTS, len(image_files)))
    
    # Send reports
    success_count = 0
    fail_count = 0
    
    for i, image_file in enumerate(selected_images, 1):
        if send_citizen_report(image_file, i):
            success_count += 1
        else:
            fail_count += 1
            # Stop on first connection error
            if fail_count == 1 and "Connection Error" in str(i):
                break
    
    # Summary
    print()
    print("=" * 80)
    print("📊 Seeding Summary")
    print("=" * 80)
    print(f"✅ Successfully sent: {success_count} reports")
    print(f"❌ Failed: {fail_count} reports")
    print(f"📈 Success rate: {success_count/len(selected_images)*100:.1f}%")
    print("=" * 80)
    
    if success_count > 0:
        print()
        print("🔍 Next Steps:")
        print("1. Check Stellio Context Broker: http://localhost:8080/ngsi-ld/v1/entities")
        print("2. Query citizen reports: http://localhost:8080/ngsi-ld/v1/entities?type=CitizenObservation")
        print("3. View API docs: http://localhost:8001/docs")


if __name__ == "__main__":
    main()
