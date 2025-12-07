#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Stellio State Query Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.context_management.stellio_state_query_agent
Author: Nguyen Viet Hoang
Created: 2025-11-23
Version: 1.0.0
License: MIT

Description:
    Queries Stellio Context Broker to retrieve entity states with filtering
    capabilities. Supports synchronization of entity state updates to RDF stores.

Core Features:
    - Entity retrieval with attribute filtering
    - Support for complex query parameters
    - State change detection
    - Pagination handling for large result sets

Dependencies:
    - requests>=2.28: HTTP client
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/stellio.yaml:
        - broker_url: Stellio endpoint
        - query_filters: Entity type and attribute filters
        - pagination_limit: Results per page

Example:
    ```python
    from src.agents.context_management.stellio_state_query_agent import StellioStateQueryAgent

    agent = StellioStateQueryAgent()
    congested_cameras = agent.query_entities(entity_type="Camera", filter={"congested": True})
    ```

Use Cases:
    - State synchronization to RDF/Fuseki
    - Real-time entity monitoring
    - Filtered entity retrieval
"""

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
import yaml

from src.core.config_loader import expand_env_var

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class StellioStateQueryAgent:
    """
    Query Stellio for entities with specific state filters
    """

    def __init__(self, config_path: str = "config/stellio.yaml"):
        """
        Initialize Stellio State Query Agent

        Args:
            config_path: Path to stellio.yaml configuration file
        """
        self.config_path = config_path
        self.config = self._load_config()

        # Get Stellio configuration - Priority: environment variables > config > defaults
        stellio_config = self.config.get("stellio", {})
        self.base_url = os.environ.get("STELLIO_URL") or stellio_config.get(
            "base_url", "http://localhost:8080"
        )
        self.query_endpoint = stellio_config.get(
            "query_endpoint", "/ngsi-ld/v1/entities"
        )
        self.timeout = stellio_config.get("timeout", 30)

        # Session for HTTP requests
        self.session = requests.Session()

        logger.info(f"Initialized Stellio State Query Agent")
        logger.info(f"Stellio URL: {self.base_url}")

    def _load_config(self) -> Dict:
        """Load configuration from YAML file"""
        try:
            if not os.path.exists(self.config_path):
                logger.warning(
                    f"Config file not found: {self.config_path}, using defaults"
                )
                return {}

            with open(self.config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)

            # Expand environment variables in config
            config = expand_env_var(config)

            logger.info(f"Loaded configuration from: {self.config_path}")
            return config

        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {}

    def query_entities(
        self,
        entity_type: Optional[str] = None,
        query_filter: Optional[str] = None,
        limit: int = 100,  # Stellio default max limit
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Query Stellio for entities with optional filters

        Args:
            entity_type: Entity type (e.g., "Camera", "ItemFlowObserved")
            query_filter: NGSI-LD query string (e.g., "congested==true")
            limit: Maximum number of entities to retrieve (max 100 per Stellio)
            offset: Pagination offset

        Returns:
            List of NGSI-LD entities

        Example:
            # Get all Camera entities with congested=true
            entities = agent.query_entities(
                entity_type="Camera",
                query_filter="congested==true"
            )
        """
        try:
            # Build query URL
            url = f"{self.base_url}{self.query_endpoint}"

            # Build query parameters
            params = {"limit": limit, "offset": offset}

            if entity_type:
                params["type"] = entity_type

            if query_filter:
                params["q"] = query_filter

            # Add @context for NGSI-LD
            headers = {
                "Accept": "application/ld+json",
                "Link": '<https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"',
            }

            logger.info(f"Querying Stellio: {url}")
            logger.info(f"Parameters: {params}")

            # Execute query
            response = self.session.get(
                url, params=params, headers=headers, timeout=self.timeout
            )

            response.raise_for_status()

            # Parse response
            entities = response.json()

            if isinstance(entities, dict):
                # If response is a single entity, wrap in list
                entities = [entities]

            logger.info(f"Retrieved {len(entities)} entities from Stellio")

            return entities

        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP error querying Stellio: {e}")
            if hasattr(e, "response") and e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
            return []
        except Exception as e:
            logger.error(f"Failed to query Stellio: {e}")
            return []

    def query_updated_cameras(self) -> List[Dict[str, Any]]:
        """
        Query Stellio for Camera entities with congested=true

        Returns:
            List of Camera entities with congestion state
        """
        return self.query_entities(entity_type="Camera", query_filter="congested==true")

    def save_entities(self, entities: List[Dict[str, Any]], output_file: str) -> str:
        """
        Save entities to JSON file

        Args:
            entities: List of NGSI-LD entities
            output_file: Output file path

        Returns:
            Path to saved file
        """
        try:
            # Ensure output directory exists
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            # Save entities
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(entities, f, indent=2, ensure_ascii=False)

            logger.info(f"Saved {len(entities)} entities to: {output_file}")
            return output_file

        except Exception as e:
            logger.error(f"Failed to save entities to {output_file}: {e}")
            raise


def main(config: Dict = None):
    """
    Main entry point for Stellio State Query Agent

    Args:
        config: Configuration dict from orchestrator (optional)
    """
    logger.info("=" * 80)
    logger.info("STELLIO STATE QUERY AGENT")
    logger.info("=" * 80)

    try:
        # If called from orchestrator with config dict
        if config:
            config_path = config.get("config_path", "config/stellio.yaml")
            entity_type = config.get("entity_type", "Camera")
            query_filter = config.get("query_filter")
            output_file = config.get("output_file", "data/updated_cameras.json")
            limit = config.get("limit", 100)  # Stellio max limit

            agent = StellioStateQueryAgent(config_path)

            # Query entities
            entities = agent.query_entities(
                entity_type=entity_type, query_filter=query_filter, limit=limit
            )

            if not entities:
                logger.warning("No entities found matching query")
                # Still create empty output file for downstream agents
                output_path = agent.save_entities([], output_file)
                return {
                    "status": "success",
                    "entities_found": 0,
                    "output_file": output_path,
                }

            # Save entities
            output_path = agent.save_entities(entities, output_file)

            return {
                "status": "success",
                "entities_found": len(entities),
                "output_file": output_path,
            }

        # Command line execution
        import argparse

        parser = argparse.ArgumentParser(
            description="Query Stellio for entities with state filters"
        )
        parser.add_argument(
            "--type",
            default="Camera",
            help="Entity type (e.g., Camera, ItemFlowObserved)",
        )
        parser.add_argument(
            "--filter", help='NGSI-LD query filter (e.g., "congested==true")'
        )
        parser.add_argument(
            "--output", default="data/updated_cameras.json", help="Output file path"
        )
        parser.add_argument(
            "--limit", type=int, default=1000, help="Maximum entities to retrieve"
        )
        parser.add_argument(
            "--config",
            default="config/stellio.yaml",
            help="Path to stellio.yaml configuration",
        )

        args = parser.parse_args()

        # Initialize agent
        agent = StellioStateQueryAgent(args.config)

        # Query entities
        entities = agent.query_entities(
            entity_type=args.type, query_filter=args.filter, limit=args.limit
        )

        if not entities:
            logger.warning("No entities found matching query")
            print("\n" + "=" * 80)
            print("QUERY SUMMARY")
            print("=" * 80)
            print("Entities found: 0")
            print("=" * 80)
            return {"status": "success", "entities_found": 0, "output_file": None}

        # Save entities
        output_path = agent.save_entities(entities, args.output)

        # Print summary
        print("\n" + "=" * 80)
        print("QUERY SUMMARY")
        print("=" * 80)
        print(f"Entity type:     {args.type}")
        print(f"Query filter:    {args.filter or 'None'}")
        print(f"Entities found:  {len(entities)}")
        print(f"Output file:     {output_path}")
        print("=" * 80)

        return {
            "status": "success",
            "entities_found": len(entities),
            "output_file": output_path,
        }

    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        if config:
            return {"status": "failed", "error": str(e)}
        sys.exit(1)

    return None  # Explicit return for non-config CLI mode


if __name__ == "__main__":
    main()
