#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Neo4j Sync Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.integration.neo4j_sync_agent
Author: Nguyen Nhat Quang
Created: 2025-11-27
Version: 2.0.0
License: MIT

Description:
    Synchronizes NGSI-LD entities from Stellio PostgreSQL database to Neo4j
    graph database, creating nodes and relationships for graph-based querying.

Core Features:
    - PostgreSQL to Neo4j synchronization
    - NGSI-LD entity to graph node mapping
    - Relationship creation (IS_HOSTED_BY, OBSERVES, LOCATED_AT)
    - Batch operations for performance
    - Idempotent MERGE operations (no duplicates)
    - Geospatial data handling (WGS84)
    - Transaction management
    - Connection pooling

Node Types Created:
    - Entity nodes (Camera, Sensor, etc.)
    - Platform nodes (hosting systems)
    - ObservableProperty nodes
    - Location nodes

Dependencies:
    - neo4j>=5.0: Neo4j Python driver
    - asyncpg>=0.29: PostgreSQL async client (Apache-2.0 - MIT compatible)
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/neo4j_sync.yaml:
        - neo4j_uri: Neo4j connection string
        - neo4j_user: Authentication username
        - neo4j_password: Authentication password
        - postgres_config: Stellio database connection
        - batch_size: Nodes per transaction

Example:
    ```python
    from src.agents.integration.neo4j_sync_agent import Neo4jSyncAgent

    agent = Neo4jSyncAgent()
    agent.sync_entities_from_postgres()
    ```

Architecture:
    PostgreSQL (Stellio) → Entity Parser → Neo4j Graph
    - Read JSONB payloads from entity_payload table
    - Parse NGSI-LD structure
    - Create nodes and relationships
    - Maintain referential integrity
Usage:
    python agents/integration/neo4j_sync_agent.py
    python agents/integration/neo4j_sync_agent.py --config config/neo4j_sync.yaml
References:
    - Neo4j Cypher: https://neo4j.com/docs/cypher-manual/
    - NGSI-LD: https://www.etsi.org/deliver/etsi_gs/CIM/001_099/009/01.08.01_60/gs_cim009v010801p.pdf
"""


from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import asyncpg
import yaml

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from src.core.config_loader import expand_env_var

# Neo4j driver (required dependency)
try:
    from neo4j import Driver, GraphDatabase, Session, Transaction

    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    raise ImportError("neo4j driver required: pip install neo4j")

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


# ============================================================================
# Configuration Loader
# ============================================================================


class Neo4jSyncConfig:
    """Load and validate Neo4j sync configuration from YAML file."""

    def __init__(self, config_path: str = "config/neo4j_sync.yaml"):
        """
        Initialize configuration loader.

        Args:
            config_path: Path to YAML configuration file

        Raises:
            FileNotFoundError: If config file not found
            ValueError: If config validation fails
        """
        self.config_path = Path(config_path)
        if not self.config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        with open(self.config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

        # Expand environment variables in config values
        self.config = expand_env_var(self.config)

        self._validate()
        logger.info(f"Loaded Neo4j sync config from {config_path}")

    def _validate(self) -> None:
        """Validate configuration structure and required fields."""
        if "neo4j_sync" not in self.config:
            raise ValueError("Config must have 'neo4j_sync' section")

        root = self.config["neo4j_sync"]

        # Validate required sections
        required = ["postgres", "neo4j", "entity_mapping", "sync_config"]
        for key in required:
            if key not in root:
                raise ValueError(f"Missing required section: neo4j_sync.{key}")

        # Validate PostgreSQL config
        pg_config = root["postgres"]
        pg_required = ["host", "port", "database", "user", "password"]
        for key in pg_required:
            if key not in pg_config:
                raise ValueError(f"Missing postgres.{key}")

        # Validate Neo4j config
        neo4j_config = root["neo4j"]
        neo4j_required = ["uri", "user", "password"]
        for key in neo4j_required:
            if key not in neo4j_config:
                raise ValueError(f"Missing neo4j.{key}")

        logger.info("Configuration validation passed")

    def get_postgres_config(self) -> Dict[str, Any]:
        """Get PostgreSQL connection configuration."""
        return self.config["neo4j_sync"]["postgres"]

    def get_neo4j_config(self) -> Dict[str, Any]:
        """Get Neo4j connection configuration."""
        return self.config["neo4j_sync"]["neo4j"]

    def get_entity_mapping(self) -> Dict[str, Any]:
        """Get entity type to node label mapping."""
        return self.config["neo4j_sync"]["entity_mapping"]

    def get_sync_config(self) -> Dict[str, Any]:
        """Get synchronization configuration."""
        return self.config["neo4j_sync"]["sync_config"]


# ============================================================================
# PostgreSQL Connector (using asyncpg - Apache-2.0 License, MIT compatible)
# ============================================================================


class PostgresConnector:
    """Connect to Stellio PostgreSQL database and extract entities using asyncpg.

    Note: This class uses asyncpg (Apache-2.0) instead of psycopg2 (LGPL-3.0)
    to ensure 100% MIT license compatibility for the entire project.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize PostgreSQL connector.

        Args:
            config: PostgreSQL connection configuration
        """
        self.config = config
        self.connection: Optional[asyncpg.Connection] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        logger.info("PostgreSQL connector initialized (asyncpg)")

    def _get_event_loop(self) -> asyncio.AbstractEventLoop:
        """Get or create event loop for async operations."""
        try:
            return asyncio.get_running_loop()
        except RuntimeError:
            if self._loop is None or self._loop.is_closed():
                self._loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self._loop)
            return self._loop

    async def _async_connect(self) -> None:
        """Async connection to PostgreSQL database."""
        try:
            self.connection = await asyncpg.connect(
                host=self.config["host"],
                port=self.config["port"],
                database=self.config["database"],
                user=self.config["user"],
                password=self.config["password"],
            )
            logger.info(
                f"Connected to PostgreSQL: {self.config['host']}:{self.config['port']}/{self.config['database']}"
            )
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise

    def connect(self) -> None:
        """Establish connection to PostgreSQL database (sync wrapper)."""
        loop = self._get_event_loop()
        if loop.is_running():
            # If already in async context, schedule connection
            asyncio.ensure_future(self._async_connect())
        else:
            loop.run_until_complete(self._async_connect())

    async def _async_fetch_entities(
        self, table: str = "entity_payload"
    ) -> List[Dict[str, Any]]:
        """Async fetch all entities from entity_payload table."""
        if not self.connection:
            raise RuntimeError("Not connected to PostgreSQL")

        try:
            query = f"""
                SELECT 
                    entity_id,
                    payload,
                    types,
                    created_at,
                    modified_at
                FROM {table}
                WHERE deleted_at IS NULL
                ORDER BY created_at ASC
            """
            rows = await self.connection.fetch(query)

            entities = []
            for row in rows:
                entity = dict(row)
                # Parse JSONB payload (asyncpg returns dict directly for jsonb)
                if isinstance(entity["payload"], str):
                    entity["payload"] = json.loads(entity["payload"])
                # Extract entity type from types array (parse URI to get simple name)
                if entity["types"] and len(entity["types"]) > 0:
                    type_uri = entity["types"][0]
                    # Extract simple name from URI (e.g., "Camera" from ".../Camera")
                    # Handle both "/" and "#" as separators
                    entity["entity_type"] = type_uri.split("/")[-1].split("#")[-1]
                else:
                    entity["entity_type"] = "Entity"
                entities.append(entity)

            logger.info(f"Fetched {len(entities)} entities from PostgreSQL")
            return entities

        except Exception as e:
            logger.error(f"Failed to fetch entities: {e}")
            raise

    def fetch_entities(self, table: str = "entity_payload") -> List[Dict[str, Any]]:
        """
        Fetch all entities from entity_payload table (sync wrapper).

        Args:
            table: Table name (default: entity_payload)

        Returns:
            List of entity dictionaries with parsed JSONB payload
        """
        loop = self._get_event_loop()
        if loop.is_running():
            # Create a future and wait for it
            future = asyncio.ensure_future(self._async_fetch_entities(table))
            return future
        else:
            return loop.run_until_complete(self._async_fetch_entities(table))

    async def _async_execute_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute a custom query and return results as list of dicts."""
        if not self.connection:
            raise RuntimeError("Not connected to PostgreSQL")
        rows = await self.connection.fetch(query)
        return [dict(row) for row in rows]

    def execute_query(self, query: str) -> List[Dict[str, Any]]:
        """Execute a custom query (sync wrapper)."""
        loop = self._get_event_loop()
        if loop.is_running():
            future = asyncio.ensure_future(self._async_execute_query(query))
            return future
        else:
            return loop.run_until_complete(self._async_execute_query(query))

    async def _async_close(self) -> None:
        """Async close connection."""
        if self.connection:
            await self.connection.close()
            logger.info("PostgreSQL connection closed")

    def close(self) -> None:
        """Close PostgreSQL connection (sync wrapper)."""
        if self.connection:
            loop = self._get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(self._async_close())
            else:
                loop.run_until_complete(self._async_close())


# ============================================================================
# Neo4j Connector
# ============================================================================


class Neo4jConnector:
    """Connect to Neo4j and execute Cypher queries with transaction management."""

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Neo4j connector.

        Args:
            config: Neo4j connection configuration
        """
        self.config = config
        self.driver: Optional[Driver] = None
        logger.info("Neo4j connector initialized")

    def connect(self) -> None:
        """Establish connection to Neo4j database."""
        try:
            self.driver = GraphDatabase.driver(
                self.config["uri"],
                auth=(self.config["user"], self.config["password"]),
                max_connection_pool_size=self.config.get("pool_size", 50),
                connection_timeout=self.config.get("timeout", 30),
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            logger.info(f"Connected to Neo4j: {self.config['uri']}")

            # Initialize schema constraints and indexes
            self._initialize_schema()
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            raise

    def _initialize_schema(self) -> None:
        """Create schema constraints and indexes for entity types."""
        schema_queries = [
            # Constraints for unique IDs
            "CREATE CONSTRAINT camera_id_unique IF NOT EXISTS FOR (c:Camera) REQUIRE c.id IS UNIQUE",
            "CREATE CONSTRAINT platform_id_unique IF NOT EXISTS FOR (p:Platform) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT obs_prop_id_unique IF NOT EXISTS FOR (o:ObservableProperty) REQUIRE o.id IS UNIQUE",
            "CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE",
            # Indexes for common query patterns
            "CREATE INDEX camera_type_idx IF NOT EXISTS FOR (c:Camera) ON (c.type)",
            "CREATE INDEX platform_name_idx IF NOT EXISTS FOR (p:Platform) ON (p.name)",
            "CREATE INDEX entity_type_idx IF NOT EXISTS FOR (e:Entity) ON (e.type)",
        ]

        with self.driver.session() as session:
            for query in schema_queries:
                try:
                    session.run(query)
                    logger.debug(f"Schema query executed: {query[:50]}...")
                except Exception as e:
                    # Constraint may already exist, log warning but continue
                    logger.warning(f"Schema initialization warning: {e}")

        logger.info("Neo4j schema initialized (constraints + indexes)")

    def create_camera_node(self, tx: Transaction, entity: Dict[str, Any]) -> None:
        """
        Create Camera node in Neo4j.

        Args:
            tx: Neo4j transaction
            entity: Entity dictionary with payload
        """
        payload = entity["payload"]
        entity_id = payload.get("id", entity["entity_id"])
        entity_type = entity.get(
            "entity_type", "Camera"
        )  # Use entity_type from DB, not NGSI-LD type URI

        # Extract properties
        properties = {
            "id": entity_id,
            "type": entity_type,  # Store simple type, not full URI
            "ngsiLdType": payload.get(
                "type", entity_type
            ),  # Store full NGSI-LD type URI separately
            "createdAt": (
                entity.get("created_at").isoformat()
                if entity.get("created_at")
                else None
            ),
            "modifiedAt": (
                entity.get("modified_at").isoformat()
                if entity.get("modified_at")
                else None
            ),
        }

        # Extract NGSI-LD properties
        for key, value in payload.items():
            if key in ["id", "type", "@context"]:
                continue

            if isinstance(value, dict):
                if value.get("type") == "Property":
                    properties[key] = value.get("value")
                elif value.get("type") == "GeoProperty":
                    # Extract coordinates
                    coordinates = value.get("value", {}).get("coordinates", [])
                    if len(coordinates) >= 2:
                        properties[f"{key}_longitude"] = coordinates[0]
                        properties[f"{key}_latitude"] = coordinates[1]
                elif value.get("type") == "Relationship":
                    # Handle relationships separately
                    pass

        # Create node with MERGE (idempotent)
        # Use simple Camera label (not URI-expanded)
        cypher = """
            MERGE (c:Camera {id: $id})
            SET c += $properties
            SET c:Entity
            RETURN c.id as id
        """

        result = tx.run(cypher, id=entity_id, properties=properties)
        record = result.single()
        if record:
            logger.debug(f"Created/Updated Camera node: {record['id']}")

    def create_platform_node(
        self, tx: Transaction, platform_id: str, properties: Dict[str, Any]
    ) -> None:
        """
        Create Platform node in Neo4j.

        Args:
            tx: Neo4j transaction
            platform_id: Platform entity ID
            properties: Platform properties
        """
        cypher = """
            MERGE (p:Platform {id: $id})
            SET p += $properties
            RETURN p.id as id
        """

        result = tx.run(cypher, id=platform_id, properties=properties)
        record = result.single()
        if record:
            logger.debug(f"Created/Updated Platform node: {record['id']}")

    def create_relationship(
        self,
        tx: Transaction,
        from_id: str,
        to_id: str,
        rel_type: str,
        properties: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Create relationship between two nodes.

        Args:
            tx: Neo4j transaction
            from_id: Source node ID
            to_id: Target node ID
            rel_type: Relationship type
            properties: Optional relationship properties
        """
        if properties is None:
            properties = {}

        cypher = f"""
            MATCH (a {{id: $from_id}})
            MATCH (b {{id: $to_id}})
            MERGE (a)-[r:{rel_type}]->(b)
            SET r += $properties
            RETURN type(r) as relType
        """

        result = tx.run(cypher, from_id=from_id, to_id=to_id, properties=properties)
        record = result.single()
        if record:
            logger.debug(
                f"Created relationship: {from_id} -[{record['relType']}]-> {to_id}"
            )

    def execute_transaction(self, work_func, *args, **kwargs) -> Any:
        """
        Execute work function in Neo4j transaction.

        Args:
            work_func: Function to execute in transaction
            *args: Positional arguments for work_func
            **kwargs: Keyword arguments for work_func

        Returns:
            Result from work_func
        """
        if not self.driver:
            raise RuntimeError("Not connected to Neo4j")

        with self.driver.session() as session:
            return session.execute_write(work_func, *args, **kwargs)

    def count_nodes(self, label: Optional[str] = None) -> int:
        """
        Count nodes in Neo4j.

        Args:
            label: Optional node label to filter

        Returns:
            Node count
        """
        if not self.driver:
            raise RuntimeError("Not connected to Neo4j")

        with self.driver.session() as session:
            if label:
                query = f"MATCH (n:{label}) RETURN count(n) as count"
            else:
                query = "MATCH (n) RETURN count(n) as count"

            result = session.run(query)
            record = result.single()
            return record["count"] if record else 0

    def close(self) -> None:
        """Close Neo4j driver."""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")


# ============================================================================
# Neo4j Sync Agent
# ============================================================================


class Neo4jSyncAgent:
    """Main agent to synchronize entities from PostgreSQL to Neo4j."""

    def __init__(self, config_path: str = "config/neo4j_sync.yaml"):
        """
        Initialize Neo4j sync agent.

        Args:
            config_path: Path to YAML configuration file
        """
        self.config = Neo4jSyncConfig(config_path)
        self.pg_connector = PostgresConnector(self.config.get_postgres_config())
        self.neo4j_connector = Neo4jConnector(self.config.get_neo4j_config())
        self.entity_mapping = self.config.get_entity_mapping()
        self.sync_config = self.config.get_sync_config()

        logger.info("Neo4j Sync Agent initialized")

    @staticmethod
    def _extract_jsonld_value(data: Any) -> Any:
        """
        Extract value from JSON-LD expanded format or NGSI-LD simple format.

        Handles:
        - NGSI-LD simple: {"type": "Property", "value": 123}
        - JSON-LD array: [{"@type": [...], "https://.../hasValue": [{"@value": 123}]}]
        - JSON-LD object: {"@value": 123}
        - Direct value: 123

        Args:
            data: JSON-LD or NGSI-LD data structure

        Returns:
            Extracted value or None
        """
        if data is None:
            return None

        # Handle JSON-LD array format (unwrap outer array)
        if isinstance(data, list):
            if len(data) > 0:
                data = data[0]
            else:
                return None

        # Handle JSON-LD object with @value or hasValue
        if isinstance(data, dict):
            # Direct @value
            if "@value" in data:
                return data["@value"]

            # NGSI-LD simple format
            if "value" in data:
                return data["value"]

            # JSON-LD expanded format with hasValue
            for key in data.keys():
                if "hasValue" in key:
                    has_value_data = data[key]
                    # hasValue is usually an array
                    if isinstance(has_value_data, list) and len(has_value_data) > 0:
                        value_item = has_value_data[0]
                        if isinstance(value_item, dict) and "@value" in value_item:
                            return value_item["@value"]
                        return value_item
                    elif (
                        isinstance(has_value_data, dict) and "@value" in has_value_data
                    ):
                        return has_value_data["@value"]
                    return has_value_data

        # Direct value (fallback)
        return data

    @staticmethod
    def _extract_relationship_object(
        payload: Dict[str, Any], rel_name: str
    ) -> Optional[str]:
        """
        Extract relationship object ID from NGSI-LD or JSON-LD format.

        Handles:
        - NGSI-LD simple: {"refDevice": {"type": "Relationship", "object": "urn:..."}}
        - JSON-LD: {"https://.../refDevice": {"https://.../hasObject": [{"@id": "urn:..."}]}}

        Args:
            payload: Entity payload
            rel_name: Relationship property name (e.g., 'refDevice')

        Returns:
            Object ID or None
        """
        # Try NGSI-LD simple format first
        if rel_name in payload:
            rel_data = payload[rel_name]
            if isinstance(rel_data, dict) and "object" in rel_data:
                return rel_data["object"]

        # Try JSON-LD expanded format
        # Search for keys containing the relationship name
        for key in payload.keys():
            if rel_name.lower() in key.lower():
                rel_data = payload[key]

                # Handle array wrapper (JSON-LD format)
                if isinstance(rel_data, list) and len(rel_data) > 0:
                    rel_data = rel_data[0]

                if isinstance(rel_data, dict):
                    # Look for hasObject property
                    for obj_key in rel_data.keys():
                        if "hasObject" in obj_key or "object" in obj_key:
                            obj_value = rel_data[obj_key]
                            # Handle array format
                            if isinstance(obj_value, list) and len(obj_value) > 0:
                                obj_item = obj_value[0]
                                if isinstance(obj_item, dict) and "@id" in obj_item:
                                    return obj_item["@id"]
                            # Handle direct format
                            elif isinstance(obj_value, dict) and "@id" in obj_value:
                                return obj_value["@id"]
                            elif isinstance(obj_value, str):
                                return obj_value

        return None

    def connect(self) -> None:
        """Establish connections to PostgreSQL and Neo4j."""
        self.pg_connector.connect()
        self.neo4j_connector.connect()

    def _build_camera_index_mapping(self) -> Dict[int, str]:
        """
        Build mapping from camera indices (0,1,2,...) to real Camera entity IDs.

        cameras_raw.json has simple integer IDs (0,1,2,...,722) which are used by cv_analysis_agent.
        These get transformed to NGSI-LD Camera entities with IDs based on code field (e.g., urn:ngsi-ld:Camera:TTH%20406).
        This method queries PostgreSQL for Camera entities ordered by created_at (same order as cameras_raw.json)
        and creates a mapping: {0: "urn:ngsi-ld:Camera:TTH%20406", 1: "urn:ngsi-ld:Camera:TTH%2021.84", ...}

        Returns:
            Dict mapping camera index to real entity ID
        """
        logger.info("Building camera index-to-ID mapping...")

        query = """
            SELECT entity_id 
            FROM entity_payload 
            WHERE 'https://uri.etsi.org/ngsi-ld/default-context/Camera' = ANY(types)
            ORDER BY created_at ASC
        """

        try:
            # Use asyncpg's execute_query method (returns list of dicts via sync wrapper)
            rows = self.pg_connector.execute_query(query)

            # Handle both async future and direct result
            if hasattr(rows, "__await__") or hasattr(rows, "result"):
                # If we got a future, run it
                loop = self.pg_connector._get_event_loop()
                if not loop.is_running():
                    rows = (
                        loop.run_until_complete(rows)
                        if hasattr(rows, "__await__")
                        else rows
                    )

            # Create index mapping: {0: "urn:ngsi-ld:Camera:TTH%20406", ...}
            # Note: asyncpg returns Record objects that work like dicts
            camera_mapping = {idx: row["entity_id"] for idx, row in enumerate(rows)}
            logger.info(f"Built camera mapping with {len(camera_mapping)} entries")
            if len(camera_mapping) > 0:
                first_5 = dict(list(camera_mapping.items())[:5])
                logger.debug(f"First 5 mappings: {first_5}")

            return camera_mapping

        except Exception as e:
            logger.error(f"Failed to build camera mapping: {e}")
            return {}

    def sync_entities(self) -> Tuple[int, int, int]:
        """
        Synchronize all entities from PostgreSQL to Neo4j.

        Returns:
            Tuple of (total_entities, successful, failed)
        """
        logger.info("Starting entity synchronization...")

        # Build camera index mapping for ItemFlowObserved relationships
        camera_mapping = self._build_camera_index_mapping()

        # Fetch entities from PostgreSQL
        entities = self.pg_connector.fetch_entities()
        total = len(entities)
        successful = 0
        failed = 0

        # Process each entity
        for entity in entities:
            try:
                entity_type = entity.get("entity_type", "")

                # Route to appropriate handler based on entity type
                if entity_type == "Camera":
                    self._sync_camera(entity)
                elif entity_type == "Platform":
                    self._sync_platform(entity)
                elif entity_type == "ObservableProperty":
                    self._sync_observable_property(entity)
                elif entity_type == "ItemFlowObserved":
                    # Special handler for observations (adds both ItemFlowObserved and Observation labels)
                    # Pass camera_mapping to transform index-based refDevice to real Camera IDs
                    self._sync_item_flow_observed(entity, camera_mapping)
                elif entity_type == "Accident":
                    # Special handler for accidents with proper property extraction
                    self._sync_accident(entity)
                else:
                    # Generic entity handler
                    self._sync_generic_entity(entity)

                successful += 1

            except Exception as e:
                logger.error(f"Failed to sync entity {entity.get('entity_id')}: {e}")
                failed += 1

        logger.info(
            f"Synchronization complete: {successful}/{total} successful, {failed} failed"
        )
        return (total, successful, failed)

    def _sync_camera(self, entity: Dict[str, Any]) -> None:
        """Sync Camera entity to Neo4j."""

        def work(tx: Transaction, entity: Dict[str, Any]):
            # Create Camera node
            self.neo4j_connector.create_camera_node(tx, entity)

            # Create relationships from NGSI-LD relationships
            payload = entity["payload"]
            entity_id = payload.get("id", entity["entity_id"])

            # isHostedBy -> Platform
            is_hosted_by = payload.get("isHostedBy", {})
            if is_hosted_by.get("type") == "Relationship":
                platform_id = is_hosted_by.get("object", "")
                if platform_id:
                    self.neo4j_connector.create_relationship(
                        tx, entity_id, platform_id, "IS_HOSTED_BY"
                    )

            # observes -> ObservableProperty
            observes = payload.get("observes", {})
            if observes.get("type") == "Relationship":
                obs_prop_id = observes.get("object", "")
                if obs_prop_id:
                    self.neo4j_connector.create_relationship(
                        tx, entity_id, obs_prop_id, "OBSERVES"
                    )

        self.neo4j_connector.execute_transaction(work, entity)

    def _sync_platform(self, entity: Dict[str, Any]) -> None:
        """Sync Platform entity to Neo4j."""

        def work(tx: Transaction, entity: Dict[str, Any]):
            payload = entity["payload"]
            platform_id = payload.get("id", entity["entity_id"])

            properties = {
                "id": platform_id,
                "type": "Platform",
                "name": payload.get("name", {}).get("value", ""),
                "description": payload.get("description", {}).get("value", ""),
            }

            self.neo4j_connector.create_platform_node(tx, platform_id, properties)

        self.neo4j_connector.execute_transaction(work, entity)

    def _sync_observable_property(self, entity: Dict[str, Any]) -> None:
        """Sync ObservableProperty entity to Neo4j."""

        def work(tx: Transaction, entity: Dict[str, Any]):
            payload = entity["payload"]
            obs_prop_id = payload.get("id", entity["entity_id"])

            properties = {
                "id": obs_prop_id,
                "type": "ObservableProperty",
                "name": payload.get("name", {}).get("value", ""),
                "description": payload.get("description", {}).get("value", ""),
            }

            cypher = """
                MERGE (o:ObservableProperty {id: $id})
                SET o += $properties
                RETURN o.id as id
            """

            result = tx.run(cypher, id=obs_prop_id, properties=properties)
            record = result.single()
            if record:
                logger.debug(f"Created/Updated ObservableProperty node: {record['id']}")

        self.neo4j_connector.execute_transaction(work, entity)

    def _sync_item_flow_observed(
        self, entity: Dict[str, Any], camera_mapping: Dict[int, str]
    ) -> None:
        """
        Sync ItemFlowObserved entity to Neo4j.

        Creates nodes with BOTH labels:
        - :ItemFlowObserved (specific type)
        - :Observation (generic type for pattern recognition)

        This allows pattern recognition agent to query :Observation label
        while maintaining type-specific querying via :ItemFlowObserved.

        Args:
            entity: Entity data from PostgreSQL
            camera_mapping: Mapping from camera index (0,1,2,...) to real Camera entity IDs
        """

        def work(
            tx: Transaction, entity: Dict[str, Any], camera_mapping: Dict[int, str]
        ):
            payload = entity["payload"]
            entity_id = payload.get("id", entity["entity_id"])

            # Extract properties using helper to handle both NGSI-LD and JSON-LD formats
            properties = {"id": entity_id, "type": "ItemFlowObserved"}

            # Extract observation properties with format-agnostic helper
            for key in [
                "vehicleCount",
                "averageSpeed",
                "intensity",
                "occupancy",
                "congestionLevel",
                "observedAt",
            ]:
                # Find matching key in payload (handles both simple and full URI keys)
                value_data = None
                if key in payload:
                    # Direct match (NGSI-LD simple format)
                    value_data = payload[key]
                else:
                    # Search for full URI key containing the property name (JSON-LD format)
                    for payload_key in payload.keys():
                        if key in payload_key:
                            value_data = payload[payload_key]
                            break

                if value_data is not None:
                    value = self._extract_jsonld_value(value_data)
                    if value is not None:
                        properties[key] = value

            # Add metadata timestamps
            if entity.get("created_at"):
                properties["createdAt"] = entity["created_at"].isoformat()
            if entity.get("modified_at"):
                properties["modifiedAt"] = entity["modified_at"].isoformat()

            # Create node with DUAL labels: ItemFlowObserved AND Observation
            # This makes the node queryable by both :ItemFlowObserved and :Observation
            cypher = """
                MERGE (o:ItemFlowObserved:Observation {id: $id})
                SET o += $properties
                RETURN o.id as id
            """

            result = tx.run(cypher, id=entity_id, properties=properties)
            record = result.single()
            if record:
                logger.debug(
                    f"Created/Updated ItemFlowObserved (Observation) node: {record['id']}"
                )

            # Create HAS_OBSERVATION relationship from Camera to Observation
            # Use helper to extract refDevice from both NGSI-LD and JSON-LD formats
            ref_device = self._extract_relationship_object(payload, "refDevice")
            if ref_device:
                # Transform index-based Camera ID to real Camera entity ID
                # cv_analysis_agent creates refDevice like "urn:ngsi-ld:Camera:0", "urn:ngsi-ld:Camera:1", etc.
                # We need to map index 0 -> real Camera ID from PostgreSQL order
                if "Camera:" in ref_device:
                    camera_index_str = ref_device.split("Camera:")[-1]
                    if camera_index_str.isdigit():
                        camera_index = int(camera_index_str)
                        if camera_index in camera_mapping:
                            original_ref_device = ref_device
                            ref_device = camera_mapping[camera_index]
                            logger.debug(
                                f"Mapped camera index {camera_index} ({original_ref_device}) -> {ref_device}"
                            )
                        else:
                            # Silently skip observations for non-existent cameras (old/test data)
                            logger.debug(
                                f"Skipping observation {entity_id}: Camera index {camera_index} not in mapping (max: {len(camera_mapping)-1})"
                            )
                            return  # Exit early without creating relationship

                logger.debug(
                    f"Found refDevice relationship: {ref_device} for observation {entity_id}"
                )
                rel_cypher = """
                    MATCH (c:Camera {id: $camera_id})
                    MATCH (o:Observation {id: $obs_id})
                    MERGE (c)-[r:HAS_OBSERVATION]->(o)
                    RETURN type(r) as rel_type
                """
                try:
                    rel_result = tx.run(
                        rel_cypher, camera_id=ref_device, obs_id=entity_id
                    )
                    rel_record = rel_result.single()
                    if rel_record:
                        logger.debug(
                            f"Created HAS_OBSERVATION: {ref_device} -> {entity_id}"
                        )
                    else:
                        # Silently skip if camera doesn't exist in Neo4j (data consistency issue)
                        logger.debug(
                            f"Skipped relationship for {entity_id}: Camera {ref_device} not found in Neo4j"
                        )
                except Exception as e:
                    # Log at debug level to avoid cluttering logs with data consistency issues
                    logger.debug(
                        f"Could not create HAS_OBSERVATION for {entity_id}: {e}"
                    )
            else:
                # No refDevice means orphaned observation (possibly test data)
                logger.debug(
                    f"No refDevice found for observation {entity_id}, skipping relationship"
                )

        self.neo4j_connector.execute_transaction(work, entity, camera_mapping)

    def _sync_accident(self, entity: Dict[str, Any]) -> None:
        """Sync Accident entity to Neo4j with proper property extraction.

        Handles JSON-LD expanded format from Stellio PostgreSQL.
        Extracts location (GeoProperty), severity, confidence, accidentDate,
        and creates relationships to Camera via detectedBy.
        """

        def work(tx: Transaction, entity: Dict[str, Any]):
            payload = entity["payload"]
            entity_id = payload.get("@id", payload.get("id", entity["entity_id"]))

            # Extract properties from JSON-LD expanded format
            properties = {
                "id": entity_id,
                "type": "Accident",
            }

            # Helper to extract value from JSON-LD expanded property
            def extract_value(key_suffix: str, prop_type: str = "Property"):
                """Extract value from JSON-LD expanded format."""
                # Try different possible keys
                possible_keys = [
                    f"https://uri.etsi.org/ngsi-ld/default-context/{key_suffix}",
                    f"https://uri.etsi.org/ngsi-ld/{key_suffix}",
                    key_suffix,  # Simple key fallback
                ]

                for key in possible_keys:
                    if key in payload:
                        prop_data = payload[key]
                        if isinstance(prop_data, list) and len(prop_data) > 0:
                            prop_data = prop_data[0]
                        if isinstance(prop_data, dict):
                            # JSON-LD expanded format
                            has_value = prop_data.get(
                                "https://uri.etsi.org/ngsi-ld/hasValue", []
                            )
                            if has_value:
                                if isinstance(has_value, list) and len(has_value) > 0:
                                    val = has_value[0]
                                    if isinstance(val, dict):
                                        return val.get("@value", val.get("@id"))
                                    return val
                            # Simple format
                            return prop_data.get("value")
                return None

            # Extract simple properties
            for key in ["severity", "confidence", "status", "accidentType", "source"]:
                value = extract_value(key)
                if value is not None:
                    properties[key] = value

            # Extract accidentDate and map to timestamp for backend compatibility
            accident_date = extract_value("accidentDate")
            if accident_date:
                properties["accidentDate"] = accident_date
                properties["timestamp"] = accident_date  # Backend uses timestamp
                properties["dateDetected"] = accident_date  # Alternative field

            # Extract location (GeoProperty) - WKT format "POINT (lon lat)"
            location_keys = ["https://uri.etsi.org/ngsi-ld/location", "location"]
            for loc_key in location_keys:
                if loc_key in payload:
                    loc_data = payload[loc_key]
                    if isinstance(loc_data, list) and len(loc_data) > 0:
                        loc_data = loc_data[0]
                    if isinstance(loc_data, dict):
                        has_value = loc_data.get(
                            "https://uri.etsi.org/ngsi-ld/hasValue", []
                        )
                        if (
                            has_value
                            and isinstance(has_value, list)
                            and len(has_value) > 0
                        ):
                            wkt_val = has_value[0]
                            if isinstance(wkt_val, dict):
                                wkt_val = wkt_val.get("@value", "")
                            # Parse WKT: "POINT (106.78 10.76)"
                            if isinstance(wkt_val, str) and wkt_val.startswith("POINT"):
                                try:
                                    # Extract coordinates from POINT (lon lat)
                                    coords_str = (
                                        wkt_val.replace("POINT", "").strip().strip("()")
                                    )
                                    lon, lat = coords_str.split()
                                    properties["longitude"] = float(lon)
                                    properties["latitude"] = float(lat)
                                except (ValueError, IndexError):
                                    pass
                        # Also try simple format
                        elif "value" in loc_data:
                            loc_value = loc_data["value"]
                            if (
                                isinstance(loc_value, dict)
                                and loc_value.get("type") == "Point"
                            ):
                                coords = loc_value.get("coordinates", [])
                                if len(coords) >= 2:
                                    properties["longitude"] = coords[0]
                                    properties["latitude"] = coords[1]
                    break

            # Create Accident node
            cypher = """
                MERGE (a:Accident {id: $id})
                SET a += $properties
                RETURN a.id as id
            """
            result = tx.run(cypher, id=entity_id, properties=properties)
            record = result.single()
            if record:
                logger.debug(f"Created/Updated Accident node: {record['id']}")

            # Create relationship to Camera via detectedBy
            detected_by_keys = [
                "https://uri.etsi.org/ngsi-ld/default-context/detectedBy",
                "detectedBy",
            ]
            for db_key in detected_by_keys:
                if db_key in payload:
                    db_data = payload[db_key]
                    if isinstance(db_data, list) and len(db_data) > 0:
                        db_data = db_data[0]
                    if isinstance(db_data, dict):
                        # JSON-LD expanded format
                        has_object = db_data.get(
                            "https://uri.etsi.org/ngsi-ld/hasObject", []
                        )
                        if (
                            has_object
                            and isinstance(has_object, list)
                            and len(has_object) > 0
                        ):
                            camera_obj = has_object[0]
                            camera_id = (
                                camera_obj.get("@id")
                                if isinstance(camera_obj, dict)
                                else camera_obj
                            )
                        else:
                            # Simple format
                            camera_id = db_data.get("object")

                        if camera_id:
                            try:
                                rel_cypher = """
                                    MATCH (a:Accident {id: $accident_id})
                                    MATCH (c:Camera {id: $camera_id})
                                    MERGE (c)-[:HAS_ACCIDENT]->(a)
                                    RETURN c.id as camera
                                """
                                rel_result = tx.run(
                                    rel_cypher,
                                    accident_id=entity_id,
                                    camera_id=camera_id,
                                )
                                rel_record = rel_result.single()
                                if rel_record:
                                    logger.debug(
                                        f"Created HAS_ACCIDENT: {camera_id} -> {entity_id}"
                                    )
                            except Exception as e:
                                logger.debug(
                                    f"Could not create HAS_ACCIDENT for {entity_id}: {e}"
                                )
                    break

        self.neo4j_connector.execute_transaction(work, entity)

    def _sync_generic_entity(self, entity: Dict[str, Any]) -> None:
        """Sync generic entity to Neo4j."""

        def work(tx: Transaction, entity: Dict[str, Any]):
            payload = entity["payload"]
            entity_id = payload.get("id", entity["entity_id"])
            entity_type = entity.get("entity_type", "Entity")

            # Extract properties
            properties = {"id": entity_id, "type": entity_type}
            for key, value in payload.items():
                if key in ["id", "type", "@context"]:
                    continue
                if isinstance(value, dict) and value.get("type") == "Property":
                    properties[key] = value.get("value")

            # Create node with escaped label
            # Use backticks to escape label with spaces/special chars
            label = entity_type.replace(" ", "_").replace("-", "_")
            cypher = f"""
                MERGE (n:`{label}` {{id: $id}})
                SET n += $properties
                RETURN n.id as id
            """

            result = tx.run(cypher, id=entity_id, properties=properties)
            record = result.single()
            if record:
                logger.debug(f"Created/Updated {entity_type} node: {record['id']}")

        self.neo4j_connector.execute_transaction(work, entity)

    def verify_sync(self) -> Dict[str, int]:
        """
        Verify synchronization by counting nodes in Neo4j.

        Returns:
            Dictionary with node counts by label
        """
        logger.info("Verifying synchronization...")

        counts = {
            "Camera": self.neo4j_connector.count_nodes("Camera"),
            "Platform": self.neo4j_connector.count_nodes("Platform"),
            "ObservableProperty": self.neo4j_connector.count_nodes(
                "ObservableProperty"
            ),
            "Total": self.neo4j_connector.count_nodes(),
        }

        logger.info(f"Node counts: {counts}")
        return counts

    def close(self) -> None:
        """Close all connections."""
        self.pg_connector.close()
        self.neo4j_connector.close()

    def run(self) -> bool:
        """
        Execute full synchronization workflow.

        Returns:
            True if successful, False otherwise
        """
        try:
            # Connect to databases
            self.connect()

            # Sync entities
            total, successful, failed = self.sync_entities()

            # Verify sync
            counts = self.verify_sync()

            # Check if sync was successful
            if failed == 0 and counts["Total"] > 0:
                logger.info("✅ Synchronization completed successfully")
                return True
            else:
                logger.warning(
                    f"⚠️ Synchronization completed with issues: {failed} failures"
                )
                return False

        except Exception as e:
            logger.error(f"❌ Synchronization failed: {e}")
            return False

        finally:
            self.close()


# ============================================================================
# Main Entry Point
# ============================================================================


def main(config: Optional[Dict[str, Any]] = None):
    """Main entry point for Neo4j sync agent.

    Args:
        config: Optional workflow agent config (from orchestrator)
    """
    # Use config from orchestrator if provided
    if config:
        config_path = config.get("config_path", "config/neo4j_sync.yaml")
    else:
        parser = argparse.ArgumentParser(
            description="Sync entities from Stellio to Neo4j"
        )
        parser.add_argument(
            "--config",
            default="config/neo4j_sync.yaml",
            help="Path to configuration file",
        )
        args = parser.parse_args()
        config_path = args.config

    # Check Neo4j availability
    if not NEO4J_AVAILABLE:
        logger.error("Neo4j driver not available. Install with: pip install neo4j")
        sys.exit(1)

    # Run sync agent
    agent = Neo4jSyncAgent(config_path=config_path)
    success = agent.run()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
