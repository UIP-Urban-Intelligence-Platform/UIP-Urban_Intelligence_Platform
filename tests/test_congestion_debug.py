#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Debug Congestion Detection.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.test_congestion_debug
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

import json

from src.agents.analytics.congestion_detection_agent import CongestionDetectionAgent

agent = CongestionDetectionAgent()
with open("data/observations.json") as f:
    obs = json.load(f)

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
