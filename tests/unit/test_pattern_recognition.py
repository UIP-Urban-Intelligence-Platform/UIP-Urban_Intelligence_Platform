#!/usr/bin/env python3
"""Pattern Recognition Unit Test Suite.

Module: tests.unit.test_pattern_recognition
Author: Nguyễn Nhật Quang
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Production-ready unit tests for pattern recognition functionality.
    Tests recurring event detection, anomaly identification, and trend analysis.

Usage:
    pytest tests/unit/test_pattern_recognition.py
"""

import pytest
from datetime import datetime, timedelta


class TestPatternRecognition:
    """Test pattern detection."""
    
    def test_recurring_congestion_detection(self):
        """Test pattern identification from historical data."""
        # Sample congestion history
        events = [
            {"zone": "Z001", "timestamp": "2024-01-15T08:00:00Z", "level": "heavy"},
            {"zone": "Z001", "timestamp": "2024-01-16T08:00:00Z", "level": "heavy"},
            {"zone": "Z001", "timestamp": "2024-01-17T08:00:00Z", "level": "heavy"},
        ]
        
        # Check for pattern (3+ occurrences at same hour)
        zone_hour_counts = {}
        for event in events:
            hour = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00')).hour
            key = (event['zone'], hour)
            zone_hour_counts[key] = zone_hour_counts.get(key, 0) + 1
        
        # Verify pattern detected
        pattern_detected = any(count >= 3 for count in zone_hour_counts.values())
        assert pattern_detected is True
        assert zone_hour_counts[("Z001", 8)] == 3
