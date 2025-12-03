"""Debug congestion detection
Module: tests.test_congestion_debug.py
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Debug script for congestion detection agent.
    Tests individual components and data flow to troubleshoot issues.

Usage:
    python tests/test_congestion_debug.py
"""

from src.agents.analytics.congestion_detection_agent import CongestionDetectionAgent
import json

agent = CongestionDetectionAgent()
obs = json.load(open('data/observations.json'))

print(f"Total observations: {len(obs)}\n")

# Test first 5 observations
for i, sample in enumerate(obs[:5]):
    print(f"=== Observation {i} ===")
    print(f"ID: {sample.get('id')}")
    
    try:
        should_update, new_state, reason, observed_at = agent.detector.evaluate(sample)
        print(f"  should_update: {should_update}")
        print(f"  new_state: {new_state}")
        print(f"  reason: {reason}")
        print(f"  observed_at: {observed_at}")
    except Exception as e:
        print(f"  ERROR: {e}")
        import traceback
        traceback.print_exc()
    print()
