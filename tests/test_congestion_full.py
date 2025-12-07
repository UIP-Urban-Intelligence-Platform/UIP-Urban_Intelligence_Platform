#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Full Debug Congestion Detection Process.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.test_congestion_full
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    End-to-end test for congestion detection agent processing.
    Tests the complete flow from observation file to congestion state updates.
"""

import json

from src.agents.analytics.congestion_detection_agent import CongestionDetectionAgent

agent = CongestionDetectionAgent()

print("=== Testing process_observations_file ===\n")
results = agent.process_observations_file("data/observations.json")

print(f"\nTotal results: {len(results)}")
print(f"Updated cameras: {sum(1 for r in results if r.get('updated'))}")
print(
    f"Successful updates: {sum(1 for r in results if r.get('updated') and r.get('success'))}"
)

# Show first 10 results
print("\nFirst 10 results:")
for i, res in enumerate(results[:10]):
    print(f"{i}: {res}")

# Check congestion.json
import os

if os.path.exists("data/congestion.json"):
    with open("data/congestion.json") as f:
        congestion = json.load(f)
    print(f"\n=== Congestion Events (data/congestion.json) ===")
    print(f"Total events: {len(congestion)}")
    if congestion:
        print("Sample events:")
        for evt in congestion[:5]:
            print(f"  {evt}")
else:
    print("\ndata/congestion.json not found!")
