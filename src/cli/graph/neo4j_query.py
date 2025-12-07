#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Neo4j Query CLI.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.cli.graph.neo4j_query
Author: Nguyen Nhat Quang
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Command-line Neo4j graph queries.

    This CLI provides commands to query the Neo4j graph database for:
    - Nearby traffic cameras within a specified radius of given coordinates.
    - Locations with frequent accident patterns based on historical data.
"""

import argparse
import logging

try:
    from neo4j import GraphDatabase

    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    print("Warning: neo4j driver not installed. Install with: pip install neo4j")

logger = logging.getLogger(__name__)


def get_neo4j_driver(
    uri: str = "bolt://localhost:7687", user: str = "neo4j", password: str = "password"
):
    """Get Neo4j driver instance."""
    if not NEO4J_AVAILABLE:
        print("ERROR: Neo4j driver not available")
        return None

    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        return driver
    except Exception as e:
        print(f"ERROR: Failed to connect to Neo4j at {uri} - {e}")
        return None


def query_nearby_cameras(
    lat: float,
    lon: float,
    radius: float = 1000.0,
    uri: str = "bolt://localhost:7687",
    user: str = "neo4j",
    password: str = "password",
):
    """Query cameras near location."""
    driver = get_neo4j_driver(uri, user, password)
    if not driver:
        return

    try:
        with driver.session() as session:
            # Cypher query for nearby cameras using point distance
            query = """
            MATCH (c:Camera)
            WHERE point.distance(c.location, point({latitude: $lat, longitude: $lon})) <= $radius
            RETURN c.id AS id, c.name AS name, c.location AS location,
                   point.distance(c.location, point({latitude: $lat, longitude: $lon})) AS distance
            ORDER BY distance ASC
            LIMIT 20
            """

            result = session.run(query, lat=lat, lon=lon, radius=radius)
            cameras = list(result)

            if cameras:
                print(
                    f"\n✓ Found {len(cameras)} cameras within {radius}m of ({lat}, {lon})\n"
                )
                print(f"{'ID':<15} {'Name':<30} {'Distance (m)':<15}")
                print("=" * 60)
                for record in cameras:
                    print(
                        f"{record['id']:<15} {record['name']:<30} {record['distance']:<15.2f}"
                    )
            else:
                print(f"No cameras found within {radius}m of ({lat}, {lon})")
    except Exception as e:
        print(f"ERROR: Query failed - {e}")
    finally:
        driver.close()


def query_accident_patterns(
    min_count: int = 3,
    uri: str = "bolt://localhost:7687",
    user: str = "neo4j",
    password: str = "password",
):
    """Find accident pattern locations."""
    driver = get_neo4j_driver(uri, user, password)
    if not driver:
        return

    try:
        with driver.session() as session:
            # Find locations with frequent accidents
            query = """
            MATCH (c:Camera)-[:DETECTS]->(a:Accident)
            WITH c, count(a) AS accident_count
            WHERE accident_count >= $min_count
            RETURN c.id AS camera_id, c.name AS camera_name,
                   c.location AS location, accident_count
            ORDER BY accident_count DESC
            LIMIT 20
            """

            result = session.run(query, min_count=min_count)
            patterns = list(result)

            if patterns:
                print(
                    f"\n✓ Found {len(patterns)} locations with >= {min_count} accidents\n"
                )
                print(f"{'Camera ID':<15} {'Name':<30} {'Accidents':<15}")
                print("=" * 60)
                for record in patterns:
                    print(
                        f"{record['camera_id']:<15} {record['camera_name']:<30} {record['accident_count']:<15}"
                    )
            else:
                print(f"No locations found with >= {min_count} accidents")
    except Exception as e:
        print(f"ERROR: Query failed - {e}")
    finally:
        driver.close()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="Neo4j query CLI - Production Ready")
    parser.add_argument("command", choices=["nearby", "patterns"], help="Query type")
    parser.add_argument("--lat", type=float, help="Latitude")
    parser.add_argument("--lon", type=float, help="Longitude")
    parser.add_argument(
        "--radius", type=float, default=1000.0, help="Search radius in meters"
    )
    parser.add_argument(
        "--min-count", type=int, default=3, help="Minimum accident count"
    )
    parser.add_argument("--uri", default="bolt://localhost:7687", help="Neo4j URI")
    parser.add_argument("--user", default="neo4j", help="Neo4j username")
    parser.add_argument("--password", default="password", help="Neo4j password")

    args = parser.parse_args()

    if args.command == "nearby":
        if args.lat is None or args.lon is None:
            print("ERROR: --lat and --lon required for 'nearby' command")
            return
        query_nearby_cameras(
            args.lat, args.lon, args.radius, args.uri, args.user, args.password
        )
    elif args.command == "patterns":
        query_accident_patterns(args.min_count, args.uri, args.user, args.password)


if __name__ == "__main__":
    main()
