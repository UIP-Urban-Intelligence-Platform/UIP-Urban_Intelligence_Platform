#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Real-time Traffic Data Generator Pipeline.

This module provides a streamlined pipeline for generating real traffic observations
from live camera streams, processing them through computer vision analysis, and
synchronizing the results across the LOD (Linked Open Data) infrastructure.

Module: run_cv_and_sync
Project: Builder-Layer-End - Traffic LOD Pipeline
Author: Nguyễn Nhật Quang 
Created: 2025-12-01
Version: 2.0.0
License: MIT

SPDX-License-Identifier: MIT

Description:
    This script orchestrates a subset of the full LOD pipeline, focusing on
    rapid data collection and analytics. It runs the following agents in sequence:
    
    1. Image Refresh Agent - Downloads fresh images from 700+ live camera streams
    2. CV Analysis Agent - Processes images using YOLOX for vehicle detection
    3. Entity Publisher Agent - Publishes ItemFlowObserved entities to Stellio
    4. Neo4j Sync Agent - Synchronizes data from Stellio to Neo4j graph database
    5. Congestion Detection Agent - Analyzes traffic congestion levels
    6. Accident Detection Agent - Detects potential traffic accidents (DETR)
    7. Pattern Recognition Agent - Identifies temporal traffic patterns

License Notice:
    This file is part of Builder-Layer-End Traffic LOD Pipeline.
    
    Copyright (c) 2024-2025 Traffic LOD Pipeline Project Contributors
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

Dependencies:
    - Python >= 3.8
    - neo4j >= 5.0.0
    - requests >= 2.28.0
    - PyYAML >= 6.0
    - yolox (Apache-2.0) - Vehicle detection
    - transformers >= 4.35.0 (Apache-2.0) - DETR accident detection
    - aiohttp >= 3.8.0

Environment Variables:
    NEO4J_PASSWORD: Password for Neo4j authentication (default: test12345)
    STELLIO_URL: Stellio Context Broker URL (default: http://localhost:8080)

Usage:
    # Run full pipeline 5 times with 60s delay between runs
    $ python run_cv_and_sync.py --runs 5 --delay 60
    
    # Run without refreshing images (use cached)
    $ python run_cv_and_sync.py --runs 10 --delay 30 --skip-refresh
    
    # Skip analytics agents (only collect and sync data)
    $ python run_cv_and_sync.py --runs 20 --delay 30 --skip-analytics
    
    # Run analytics only (no image refresh or CV)
    $ python run_cv_and_sync.py --runs 1 --skip-refresh --skip-cv

Example:
    >>> from run_cv_and_sync import run_cv_analysis, run_neo4j_sync
    >>> entities_count = run_cv_analysis()
    >>> run_neo4j_sync()

Notes:
    - Camera streams refresh every 30-60 seconds; set delay accordingly
    - Running during peak hours (7-9AM, 5-7PM) yields more traffic data
    - Each run generates ~700 new ItemFlowObserved entities (one per camera)

See Also:
    - src/orchestrator.py: Full workflow orchestrator
    - config/workflow.yaml: Complete workflow configuration
    - docs/architecture/agents.md: Agent documentation

Copyright (c) 2024-2025 Traffic LOD Pipeline Project Contributors.
This file is licensed under MIT. See LICENSE in the project root.
"""

from __future__ import annotations

import os
import sys
import time
import asyncio
import argparse
from datetime import datetime
from typing import Optional

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def run_image_refresh() -> bool:
    """Download fresh camera images from live streams.
    
    Executes the Image Refresh Agent to fetch the latest snapshots from
    700+ traffic camera streams across Vietnam. Images are saved locally
    for subsequent CV analysis.
    
    Returns:
        bool: True if refresh completed successfully, False otherwise.
    
    Raises:
        ImportError: If image_refresh_agent module is not available.
    
    Example:
        >>> success = run_image_refresh()
        >>> if success:
        ...     print("Fresh images downloaded")
    """
    from src.agents.data_collection.image_refresh_agent import main as refresh_main
    
    print("🔄 Refreshing camera images from live streams...")
    try:
        asyncio.run(refresh_main({
            'config_path': 'config/data_sources.yaml',
            'domain': 'cameras',
            'input_file': 'data/cameras_raw.json',
            'output_file': 'data/cameras_updated.json'
        }))
        print("   ✅ Downloaded fresh camera images")
        return True
    except Exception as e:
        print(f"   ⚠️ Image refresh error: {e}")
        return False


def run_cv_analysis() -> int:
    """Process camera images using YOLOX for vehicle detection.
    
    Executes the CV Analysis Agent to analyze camera images and generate
    ItemFlowObserved NGSI-LD entities containing traffic metrics such as
    vehicle count, average speed, congestion level, and occupancy.
    
    Returns:
        int: Number of ItemFlowObserved entities generated.
    
    Raises:
        ImportError: If cv_analysis_agent module is not available.
        FileNotFoundError: If input camera file does not exist.
    
    Example:
        >>> count = run_cv_analysis()
        >>> print(f"Generated {count} observations")
    """
    from src.agents.analytics.cv_analysis_agent import CVAnalysisAgent
    
    print("📷 Running CV Analysis Agent (YOLOX)...")
    agent = CVAnalysisAgent()
    entities = asyncio.run(agent.run(
        input_file="data/cameras_updated.json",
        output_file="data/observations.json"
    ))
    print(f"   ✅ Generated {len(entities)} ItemFlowObserved entities")
    return len(entities)


def run_entity_publisher() -> bool:
    """Publish ItemFlowObserved entities to Stellio Context Broker.
    
    Executes the Entity Publisher Agent to POST NGSI-LD entities to
    Stellio, making them available for querying and subscription.
    
    Returns:
        bool: True if publishing completed successfully, False otherwise.
    
    Raises:
        ImportError: If entity_publisher_agent module is not available.
        ConnectionError: If Stellio is not reachable.
    
    Example:
        >>> success = run_entity_publisher()
        >>> if success:
        ...     print("Entities published to Stellio")
    """
    from src.agents.context_management.entity_publisher_agent import main as publisher_main
    
    print("📤 Publishing to Stellio...")
    try:
        publisher_main({
            'input_file': 'data/observations.json'
        })
        print("   ✅ Published to Stellio")
        return True
    except Exception as e:
        print(f"   ⚠️ Publisher error: {e}")
        return False


def run_neo4j_sync() -> bool:
    """Synchronize entities from Stellio PostgreSQL to Neo4j.
    
    Executes the Neo4j Sync Agent to transfer NGSI-LD entities from
    Stellio's PostgreSQL backend to Neo4j graph database for pattern
    analysis and graph queries.
    
    Returns:
        bool: True if sync completed successfully, False otherwise.
    
    Raises:
        ImportError: If neo4j_sync_agent module is not available.
        ConnectionError: If Neo4j or PostgreSQL is not reachable.
    
    Example:
        >>> success = run_neo4j_sync()
        >>> if success:
        ...     print("Data synced to Neo4j")
    """
    from src.agents.integration.neo4j_sync_agent import main as sync_main
    
    print("🔄 Syncing to Neo4j...")
    try:
        sync_main({
            'config_file': 'config/neo4j_sync.yaml',
            'sync_mode': 'full',
            'clear_before_sync': False,
            'create_indexes': True
        })
        print("   ✅ Synced to Neo4j")
        return True
    except Exception as e:
        print(f"   ⚠️ Sync error: {e}")
        return False


def run_congestion_detection() -> bool:
    """Detect traffic congestion from observations.
    
    Executes the Congestion Detection Agent to analyze ItemFlowObserved
    entities and determine congestion levels. Updates Camera entities
    in Stellio with congestion state.
    
    Returns:
        bool: True if detection completed successfully, False otherwise.
    
    Raises:
        ImportError: If congestion_detection_agent module is not available.
    
    Example:
        >>> success = run_congestion_detection()
        >>> if success:
        ...     print("Congestion analysis complete")
    """
    from src.agents.analytics.congestion_detection_agent import main as congestion_main
    
    print("🚗 Running Congestion Detection Agent...")
    try:
        congestion_main({
            'input_file': 'data/observations.json',
            'config_file': 'config/congestion_config.yaml'
        })
        print("   ✅ Congestion detection completed")
        return True
    except Exception as e:
        print(f"   ⚠️ Congestion detection error: {e}")
        return False


def run_accident_detection() -> bool:
    """Detect potential traffic accidents from observations.
    
    Executes the Accident Detection Agent to analyze traffic patterns
    and identify potential accident scenarios based on sudden speed
    changes, unusual congestion, and other indicators.
    
    Returns:
        bool: True if detection completed successfully, False otherwise.
    
    Raises:
        ImportError: If accident_detection_agent module is not available.
    
    Example:
        >>> success = run_accident_detection()
        >>> if success:
        ...     print("Accident detection complete")
    """
    from src.agents.analytics.accident_detection_agent import main as accident_main
    
    print("🚨 Running Accident Detection Agent...")
    try:
        accident_main({
            'input_file': 'data/observations.json',
            'config_file': 'config/accident_config.yaml',
            'output_file': 'data/accidents.json'
        })
        print("   ✅ Accident detection completed")
        return True
    except Exception as e:
        print(f"   ⚠️ Accident detection error: {e}")
        return False


def run_pattern_recognition() -> bool:
    """Analyze temporal traffic patterns from historical data.
    
    Executes the Pattern Recognition Agent to identify traffic patterns
    such as rush hours, daily/weekly trends, and anomalies. Creates
    TrafficFlowPattern entities in Stellio.
    
    Returns:
        bool: True if analysis completed successfully, False otherwise.
    
    Raises:
        ImportError: If pattern_recognition_agent module is not available.
    
    Example:
        >>> success = run_pattern_recognition()
        >>> if success:
        ...     print("Pattern analysis complete")
    """
    from src.agents.analytics.pattern_recognition_agent import main as pattern_main
    
    print("📊 Running Pattern Recognition Agent...")
    try:
        pattern_main({
            'config_file': 'config/pattern_recognition.yaml',
            'input_file': 'data/observations.json',
            'output_file': 'data/patterns.json',
            'time_window': '7_days'
        })
        print("   ✅ Pattern recognition completed")
        return True
    except Exception as e:
        print(f"   ⚠️ Pattern recognition error: {e}")
        return False


def get_neo4j_observation_count() -> int:
    """Get the current count of Observation nodes in Neo4j.
    
    Queries Neo4j to retrieve the total number of Observation nodes,
    which is useful for tracking data accumulation progress.
    
    Returns:
        int: Number of Observation nodes, or -1 if query fails.
    
    Example:
        >>> count = get_neo4j_observation_count()
        >>> print(f"Neo4j has {count} observations")
    """
    try:
        from neo4j import GraphDatabase
        driver = GraphDatabase.driver(
            "bolt://localhost:7687",
            auth=("neo4j", os.getenv("NEO4J_PASSWORD", "test12345"))
        )
        with driver.session(database="neo4j") as session:
            result = session.run("MATCH (o:Observation) RETURN count(o) AS count")
            count = result.single()['count']
        driver.close()
        return count
    except Exception as e:
        print(f"⚠️ Cannot check Neo4j: {e}")
        return -1


def main() -> None:
    """Main entry point for the Real-time Traffic Data Generator Pipeline.
    
    Parses command-line arguments and orchestrates the execution of
    multiple data collection and analytics agents in sequence. Supports
    configurable number of runs, delay between runs, and selective
    agent execution.
    
    Command-line Arguments:
        --runs: Number of pipeline iterations (default: 5)
        --delay: Seconds to wait between runs (default: 60)
        --skip-refresh: Skip image download, use cached images
        --skip-cv: Skip CV analysis, only run sync and analytics
        --skip-analytics: Skip congestion/accident/pattern agents
    
    Returns:
        None
    
    Example:
        $ python run_cv_and_sync.py --runs 10 --delay 30
    """
    parser = argparse.ArgumentParser(
        description='Real-time Traffic Data Generator Pipeline',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_cv_and_sync.py --runs 5 --delay 60
      Run full pipeline 5 times with 60s delay
  
  python run_cv_and_sync.py --runs 10 --skip-refresh
      Run 10 times using cached images
  
  python run_cv_and_sync.py --runs 1 --skip-refresh --skip-cv
      Run analytics only (no data collection)
        """
    )
    parser.add_argument(
        '--runs', 
        type=int, 
        default=5, 
        help='Number of pipeline runs (default: 5)'
    )
    parser.add_argument(
        '--delay', 
        type=int, 
        default=60, 
        help='Delay between runs in seconds (default: 60)'
    )
    parser.add_argument(
        '--skip-refresh', 
        action='store_true', 
        help='Skip image refresh (use existing images)'
    )
    parser.add_argument(
        '--skip-cv', 
        action='store_true', 
        help='Skip CV analysis, only sync'
    )
    parser.add_argument(
        '--skip-analytics', 
        action='store_true', 
        help='Skip congestion/accident/pattern agents'
    )
    args = parser.parse_args()
    
    print("=" * 70)
    print("REAL DATA GENERATOR - Live Camera → YOLOX → Neo4j → Analytics")
    print("=" * 70)
    print(f"Runs: {args.runs}, Delay: {args.delay}s")
    print(f"Skip Refresh: {args.skip_refresh}, Skip CV: {args.skip_cv}")
    print(f"Skip Analytics: {args.skip_analytics}")
    
    initial_count = get_neo4j_observation_count()
    print(f"\n📊 Initial Neo4j Observations: {initial_count}")
    
    for i in range(args.runs):
        run_num = i + 1
        print(f"\n{'=' * 50}")
        print(f"RUN {run_num}/{args.runs} - {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'=' * 50}")
        
        # Step 0: Refresh camera images (download NEW from live streams)
        if not args.skip_refresh:
            try:
                run_image_refresh()
            except Exception as e:
                print(f"   ❌ Image Refresh failed: {e}")
                # Continue anyway - use existing images
        
        # Step 1: CV Analysis (process real camera images)
        if not args.skip_cv:
            try:
                run_cv_analysis()
            except Exception as e:
                print(f"   ❌ CV Analysis failed: {e}")
                continue
        
        # Step 2: Publish to Stellio
        try:
            run_entity_publisher()
        except Exception as e:
            print(f"   ❌ Publisher failed: {e}")
        
        # Step 3: Sync to Neo4j
        try:
            run_neo4j_sync()
        except Exception as e:
            print(f"   ❌ Neo4j Sync failed: {e}")
        
        # Step 4-6: Analytics Agents
        if not args.skip_analytics:
            # Congestion Detection
            try:
                run_congestion_detection()
            except Exception as e:
                print(f"   ❌ Congestion Detection failed: {e}")
            
            # Accident Detection
            try:
                run_accident_detection()
            except Exception as e:
                print(f"   ❌ Accident Detection failed: {e}")
            
            # Pattern Recognition
            try:
                run_pattern_recognition()
            except Exception as e:
                print(f"   ❌ Pattern Recognition failed: {e}")
        
        # Check progress
        current_count = get_neo4j_observation_count()
        new_observations = current_count - initial_count
        print(f"\n📊 Neo4j Observations: {current_count} (+{new_observations} new)")
        
        # Wait before next run (except last)
        if run_num < args.runs:
            print(f"\n⏳ Waiting {args.delay}s for new camera frames...")
            time.sleep(args.delay)
    
    # Final summary
    final_count = get_neo4j_observation_count()
    total_new = final_count - initial_count
    
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Runs completed:        {args.runs}")
    print(f"Initial observations:  {initial_count}")
    print(f"Final observations:    {final_count}")
    print(f"New observations:      +{total_new}")
    print(f"Avg per run:           {total_new / args.runs:.1f}")
    print("=" * 70)


if __name__ == "__main__":
    main()
