#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pipeline Progress Monitor.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.cli.monitoring.progress_monitor
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Real-time monitoring script for orchestrator.py pipeline progress.
    Tracks observations, validation reports, and RDF generation.

Usage:
    python -m src.cli.monitoring.progress_monitor
"""
import json
import time
from pathlib import Path


def monitor_progress():
    """Monitor pipeline progress"""

    print("🔍 Monitoring pipeline progress...")
    print("=" * 80)

    last_observation_count = 0
    last_check_time = time.time()

    while True:
        try:
            # Check observations.json
            obs_file = Path("data/observations.json")
            if obs_file.exists():
                with open(obs_file, "r", encoding="utf-8") as f:
                    observations = json.load(f)
                    current_count = len(observations)

                    if current_count != last_observation_count:
                        print(
                            f"📊 {time.strftime('%H:%M:%S')} - Observations: {current_count}"
                        )
                        last_observation_count = current_count

            # Check validation report
            val_file = Path("data/validation_report.json")
            if val_file.exists():
                with open(val_file, "r", encoding="utf-8") as f:
                    report = json.load(f)
                    total = report.get("summary", {}).get("total_entities", 0)
                    stars_5 = report.get("lod_distribution", {}).get("5_stars", 0)

                    if total > 0:
                        print(
                            f"⭐ {time.strftime('%H:%M:%S')} - Validated: {total} entities, 5-stars: {stars_5}"
                        )

            # Check cache
            cache_dir = Path("data/cache/images")
            if cache_dir.exists():
                cache_files = list(cache_dir.glob("*.jpg"))
                if len(cache_files) > 0:
                    cache_size_mb = sum(f.stat().st_size for f in cache_files) / (
                        1024 * 1024
                    )
                    print(
                        f"💾 {time.strftime('%H:%M:%S')} - Cache: {len(cache_files)} files, {cache_size_mb:.2f} MB"
                    )

            elapsed = time.time() - last_check_time
            if elapsed > 60:
                print(
                    f"⏱️  {time.strftime('%H:%M:%S')} - Still running... ({elapsed/60:.1f} minutes)"
                )
                last_check_time = time.time()

            time.sleep(10)  # Check every 10 seconds

        except KeyboardInterrupt:
            print("\n👋 Monitoring stopped by user")
            break
        except Exception as e:
            print(f"⚠️  Error: {e}")
            time.sleep(10)


if __name__ == "__main__":
    monitor_progress()
