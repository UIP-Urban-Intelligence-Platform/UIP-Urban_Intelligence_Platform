#!/usr/bin/env python3
"""Test script for Citizen Ingestion Agent API.
Module:  tests.test_citizen_api.py
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT
Description:

This script tests the citizen report submission endpoint with real API keys
from data_sources.yaml configuration.

Usage:
    python tests/test_citizen_api.py
    

"""

import requests
import json
from datetime import datetime

def test_citizen_report_submission():
    """Submit a test citizen report to the FastAPI server."""
    
    # API endpoint
    url = "http://localhost:8001/api/v1/citizen-reports"
    
    # Test report data
    test_report = {
        "userId": "user_test_001",
        "reportType": "traffic_jam",
        "description": "Heavy congestion at Tran Quang Khai intersection",
        "latitude": 10.791890,
        "longitude": 106.691054,
        "imageUrl": "https://example.com/test_report.jpg",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    print("=" * 70)
    print("TESTING CITIZEN INGESTION AGENT API")
    print("=" * 70)
    print(f"\nEndpoint: {url}")
    print(f"\nTest Report Data:")
    print(json.dumps(test_report, indent=2))
    print("\n" + "=" * 70)
    
    try:
        # Submit report
        print("\n[1] Submitting citizen report...")
        response = requests.post(url, json=test_report, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 202:
            print("\n✅ SUCCESS: Report accepted for processing")
            report_id = response.json().get('reportId')
            
            # Check report status
            print(f"\n[2] Checking report status...")
            status_url = f"http://localhost:8001/api/v1/reports/{report_id}"
            status_response = requests.get(status_url, timeout=10)
            
            print(f"Status Code: {status_response.status_code}")
            print(f"Report Status:")
            print(json.dumps(status_response.json(), indent=2))
            
            return True
        else:
            print("\n❌ FAILED: Report submission failed")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to FastAPI server")
        print("Make sure the server is running:")
        print("  .venv\\Scripts\\python -m uvicorn src.agents.ingestion.citizen_ingestion_agent:app --reload --port 8001")
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False

def check_server_health():
    """Check if the FastAPI server is running."""
    try:
        response = requests.get("http://localhost:8001/health", timeout=5)
        if response.status_code == 200:
            print("✅ Server is healthy")
            print(f"Response: {response.json()}")
            return True
    except:
        print("❌ Server is not running")
        return False

if __name__ == "__main__":
    print("\n[0] Checking server health...")
    if check_server_health():
        print("\n")
        test_citizen_report_submission()
    else:
        print("\nPlease start the server first:")
        print("  .venv\\Scripts\\python -m uvicorn src.agents.ingestion.citizen_ingestion_agent:app --reload --port 8001")
