#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""MongoDB Helper Utilities for NGSI-LD Entity Storage.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.utils.mongodb_helper
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-26
Version: 1.0.0
License: MIT

Description:
    Provides MongoDB connection management, CRUD operations, and indexing
    for NGSI-LD entities. Supports connection pooling, automatic retries,
    and error handling.

Features:
    - Connection pooling with configurable pool size
    - Automatic index creation and management
    - TTL (Time To Live) for automatic data expiration
    - Batch insert operations for performance
    - Geospatial query support
    - Comprehensive error handling and logging

Dependencies:
    - pymongo>=4.6: MongoDB driver
    - PyYAML>=6.0: Configuration parsing

Configuration:
    Requires config/mongodb_config.yaml containing:
    - connection: MongoDB connection settings
    - database: Database name
    - collections: Entity type to collection mapping
    - indexes: Index definitions per collection

Examples:
    >>> from src.utils.mongodb_helper import MongoDBHelper
    >>>
    >>> helper = MongoDBHelper()
    >>> helper.connect()
    >>>
    >>> # Insert single entity
    >>> entity = {"id": "urn:ngsi-ld:Camera:CAM001", "type": "Camera"}
    >>> helper.insert_entity(entity)
    >>>
    >>> # Batch insert
    >>> entities = [entity1, entity2, entity3]
    >>> helper.insert_entities_batch(entities)
    >>>
    >>> # Query by location (geospatial)
    >>> cameras = helper.find_near_location("Camera", 106.668, 10.762, 1000)
    >>>
    >>> helper.close()

References:
    - PyMongo Documentation: https://pymongo.readthedocs.io/
    - MongoDB Manual: https://www.mongodb.com/docs/manual/
"""

import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml

from src.core.config_loader import expand_env_var

try:
    from pymongo import ASCENDING, DESCENDING, GEOSPHERE, MongoClient
    from pymongo.errors import (
        BulkWriteError,
        ConnectionFailure,
        DuplicateKeyError,
        PyMongoError,
    )

    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False
    MongoClient = None
    ASCENDING = DESCENDING = GEOSPHERE = None
    ConnectionFailure = DuplicateKeyError = BulkWriteError = PyMongoError = Exception

# Reference for CodeQL - DESCENDING available for sorting when pymongo is installed
_DESCENDING = DESCENDING

logger = logging.getLogger(__name__)


class MongoDBHelper:
    """MongoDB connection and operations manager for NGSI-LD entities."""

    def __init__(self, config_path: str = "config/mongodb_config.yaml"):
        """
        Initialize MongoDB helper.

        Args:
            config_path: Path to MongoDB configuration YAML file
        """
        if not PYMONGO_AVAILABLE:
            logger.warning("PyMongo not installed - MongoDB functionality disabled")
            self.enabled = False
            return

        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.client: Optional[MongoClient] = None
        self.db = None
        self.enabled = (
            self.config.get("mongodb", {}).get("publishing", {}).get("enabled", True)
        )

        if not self.enabled:
            logger.info("MongoDB publishing is disabled in config")

    def _load_config(self) -> Dict[str, Any]:
        """Load MongoDB configuration from YAML file."""
        if not self.config_path.exists():
            logger.warning(
                f"MongoDB config not found: {self.config_path}, using defaults"
            )
            return self._get_default_config()

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)

            # Expand environment variables in config values
            config = expand_env_var(config)

            logger.info(f"Loaded MongoDB config from {self.config_path}")
            return config
        except Exception as e:
            logger.error(f"Failed to load MongoDB config: {e}, using defaults")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default MongoDB configuration."""
        return {
            "mongodb": {
                "connection": {
                    "host": os.getenv("MONGODB_HOST", "localhost"),
                    "port": int(os.getenv("MONGODB_PORT", 27017)),
                    "username": os.getenv("MONGODB_USER", "admin"),
                    "password": os.getenv("MONGODB_PASSWORD", "mongodb_test_pass"),
                    "auth_source": "admin",
                    "max_pool_size": 50,
                    "connect_timeout_ms": 5000,
                },
                "database": {"name": "ngsi_ld_entities"},
                "collections": {
                    "Camera": "cameras",
                    "ItemFlowObserved": "traffic_flow_observations",
                    "CitizenObservation": "citizen_observations",
                    "RoadAccident": "road_accidents",
                },
                "publishing": {"enabled": True},
            }
        }

    def connect(self) -> bool:
        """
        Establish connection to MongoDB.

        Returns:
            True if connection successful, False otherwise
        """
        if not self.enabled or not PYMONGO_AVAILABLE:
            return False

        try:
            conn_config = self.config["mongodb"]["connection"]

            # Build connection URI
            username = conn_config.get("username", "admin")
            password = conn_config.get("password", "mongodb_test_pass")
            host = conn_config.get("host", "localhost")
            port = conn_config.get("port", 27017)
            auth_source = conn_config.get("auth_source", "admin")

            # Auto-detect host: if 'mongodb' (Docker service name) fails, try localhost
            # This allows script to work both inside and outside Docker
            if host == "mongodb":
                # Try to detect if we're running outside Docker
                import socket

                try:
                    socket.gethostbyname(host)
                except socket.gaierror:
                    # 'mongodb' hostname not found, use localhost
                    logger.debug(
                        "MongoDB hostname 'mongodb' not found, using 'localhost' instead"
                    )
                    host = "localhost"

            uri = f"mongodb://{username}:{password}@{host}:{port}/?authSource={auth_source}"

            # Connection options with longer timeouts for initial connection
            self.client = MongoClient(
                uri,
                maxPoolSize=conn_config.get("max_pool_size", 50),
                minPoolSize=conn_config.get("min_pool_size", 10),
                connectTimeoutMS=conn_config.get(
                    "connect_timeout_ms", 10000
                ),  # 10s for initial connection
                serverSelectionTimeoutMS=conn_config.get(
                    "server_selection_timeout_ms", 10000
                ),  # 10s timeout
                socketTimeoutMS=conn_config.get("socket_timeout_ms", 10000),
                retryWrites=conn_config.get("retry_writes", True),
                retryReads=conn_config.get("retry_reads", True),
            )

            # Test connection with retry
            logger.info(f"Connecting to MongoDB at {host}:{port}...")
            self.client.admin.command("ping")

            # Get database
            db_name = self.config["mongodb"]["database"]["name"]
            self.db = self.client[db_name]

            logger.info(f"✅ Connected to MongoDB: {host}:{port}/{db_name}")

            # Create indexes
            self._create_indexes()

            return True

        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed: {e}")
            self.enabled = False
            return False
        except Exception as e:
            logger.error(f"MongoDB initialization error: {e}")
            self.enabled = False
            return False

    def _create_indexes(self) -> None:
        """Create indexes for all collections based on config."""
        if self.db is None:
            return

        try:
            index_config = self.config["mongodb"].get("indexes", {})
            collections_config = self.config["mongodb"].get("collections", {})

            # Common indexes for all collections
            common_indexes = index_config.get("common", [])
            geospatial_indexes = index_config.get("geospatial", [])

            for entity_type, collection_name in collections_config.items():
                collection = self.db[collection_name]

                # Create common indexes
                for idx in common_indexes:
                    try:
                        collection.create_index(
                            [(idx["field"], ASCENDING)],
                            unique=idx.get("unique", False),
                            name=idx.get("name"),
                        )
                    except Exception as e:
                        logger.debug(f"Index already exists or error: {e}")

                # Create geospatial indexes
                for idx in geospatial_indexes:
                    try:
                        collection.create_index(
                            [(idx["field"], GEOSPHERE)], name=idx.get("name")
                        )
                    except Exception as e:
                        logger.debug(f"Geospatial index error: {e}")

                # Create entity-specific indexes
                entity_indexes = index_config.get(collection_name, [])
                for idx in entity_indexes:
                    try:
                        collection.create_index(
                            [(idx["field"], ASCENDING)], name=idx.get("name")
                        )
                    except Exception as e:
                        logger.debug(f"Entity-specific index error: {e}")

            logger.info("✅ MongoDB indexes created successfully")

        except Exception as e:
            logger.warning(f"Failed to create indexes: {e}")

    def get_collection_name(self, entity_type: str) -> Optional[str]:
        """
        Get MongoDB collection name for NGSI-LD entity type.

        Args:
            entity_type: NGSI-LD entity type (e.g., "Camera")

        Returns:
            Collection name or None if not mapped
        """
        collections = self.config["mongodb"].get("collections", {})
        return collections.get(entity_type)

    def insert_entity(self, entity: Dict[str, Any]) -> bool:
        """
        Insert single NGSI-LD entity to MongoDB.

        Args:
            entity: NGSI-LD entity dictionary

        Returns:
            True if successful, False otherwise
        """
        if not self.enabled or self.db is None:
            return False

        try:
            entity_type = entity.get("type")
            if not entity_type:
                logger.warning("Entity missing 'type' field, skipping")
                return False

            collection_name = self.get_collection_name(entity_type)
            if not collection_name:
                logger.warning(f"No collection mapping for entity type: {entity_type}")
                return False

            collection = self.db[collection_name]

            # Add metadata (preserve 100% NGSI-LD data + metadata)
            entity_with_meta = entity.copy()
            entity_with_meta["_insertedAt"] = datetime.utcnow()
            entity_with_meta["_updatedAt"] = datetime.utcnow()

            # Upsert (update if exists, insert if not)
            # Use $set to preserve all NGSI-LD fields
            result = collection.update_one(
                {"id": entity["id"]}, {"$set": entity_with_meta}, upsert=True
            )

            if result.upserted_id or result.modified_count > 0:
                logger.debug(
                    f"✅ Inserted/Updated entity: {entity['id']} to {collection_name}"
                )
                return True

            return False

        except DuplicateKeyError:
            logger.debug(f"Entity already exists (duplicate key): {entity.get('id')}")
            return True  # Consider success since entity exists
        except PyMongoError as e:
            logger.error(f"MongoDB insert error: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error inserting entity: {e}")
            return False

    def insert_entities_batch(self, entities: List[Dict[str, Any]]) -> Tuple[int, int]:
        """
        Batch insert NGSI-LD entities to MongoDB.

        Args:
            entities: List of NGSI-LD entity dictionaries

        Returns:
            Tuple of (successful_count, failed_count)
        """
        if not self.enabled or self.db is None or not entities:
            return 0, 0

        # Group entities by type
        entities_by_type: Dict[str, List[Dict[str, Any]]] = {}
        for entity in entities:
            entity_type = entity.get("type")
            if not entity_type:
                continue

            if entity_type not in entities_by_type:
                entities_by_type[entity_type] = []
            entities_by_type[entity_type].append(entity)

        success_count = 0
        fail_count = 0

        # Insert per entity type
        for entity_type, type_entities in entities_by_type.items():
            collection_name = self.get_collection_name(entity_type)
            if not collection_name:
                fail_count += len(type_entities)
                continue

            collection = self.db[collection_name]

            # Add metadata (preserve 100% NGSI-LD data + metadata)
            entities_with_meta = []
            timestamp = datetime.utcnow()
            for entity in type_entities:
                entity_with_meta = entity.copy()
                entity_with_meta["_insertedAt"] = timestamp
                entity_with_meta["_updatedAt"] = timestamp
                entities_with_meta.append(entity_with_meta)

            try:
                # Bulk write with upsert - preserve all NGSI-LD fields
                from pymongo import UpdateOne

                operations = [
                    UpdateOne(
                        {"id": entity_with_meta["id"]},
                        {"$set": entity_with_meta},
                        upsert=True,
                    )
                    for entity_with_meta in entities_with_meta
                ]

                result = collection.bulk_write(operations, ordered=False)

                inserted = result.upserted_count + result.modified_count
                success_count += inserted

                logger.info(
                    f"✅ Batch inserted {inserted} {entity_type} entities to {collection_name}"
                )

            except BulkWriteError as bwe:
                # Partial success
                success_count += bwe.details.get("nInserted", 0) + bwe.details.get(
                    "nModified", 0
                )
                fail_count += len(bwe.details.get("writeErrors", []))
                logger.warning(f"Bulk write partial failure: {bwe.details}")
            except PyMongoError as e:
                fail_count += len(type_entities)
                logger.error(f"MongoDB batch insert error: {e}")
            except Exception as e:
                fail_count += len(type_entities)
                logger.error(f"Unexpected batch insert error: {e}")

        return success_count, fail_count

    def find_entity(
        self, entity_id: str, entity_type: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Find entity by ID.

        Args:
            entity_id: NGSI-LD entity ID
            entity_type: Optional entity type for faster lookup

        Returns:
            Entity dictionary or None if not found
        """
        if not self.enabled or self.db is None:
            return None

        try:
            # If entity type provided, search specific collection
            if entity_type:
                collection_name = self.get_collection_name(entity_type)
                if collection_name:
                    collection = self.db[collection_name]
                    return collection.find_one(
                        {"id": entity_id}, {"_id": 0, "_insertedAt": 0}
                    )

            # Otherwise search all collections
            collections_config = self.config["mongodb"].get("collections", {})
            for collection_name in collections_config.values():
                collection = self.db[collection_name]
                entity = collection.find_one(
                    {"id": entity_id}, {"_id": 0, "_insertedAt": 0}
                )
                if entity:
                    return entity

            return None

        except PyMongoError as e:
            logger.error(f"MongoDB find error: {e}")
            return None

    def find_near_location(
        self,
        entity_type: str,
        longitude: float,
        latitude: float,
        max_distance_meters: int = 1000,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Find entities near a geographic location.

        Args:
            entity_type: NGSI-LD entity type
            longitude: Longitude (WGS84)
            latitude: Latitude (WGS84)
            max_distance_meters: Maximum distance in meters
            limit: Maximum number of results

        Returns:
            List of entities sorted by distance
        """
        if not self.enabled or self.db is None:
            return []

        try:
            collection_name = self.get_collection_name(entity_type)
            if not collection_name:
                return []

            collection = self.db[collection_name]

            # GeoJSON Point
            query = {
                "location.value": {
                    "$near": {
                        "$geometry": {
                            "type": "Point",
                            "coordinates": [longitude, latitude],
                        },
                        "$maxDistance": max_distance_meters,
                    }
                }
            }

            results = list(
                collection.find(query, {"_id": 0, "_insertedAt": 0}).limit(limit)
            )
            return results

        except PyMongoError as e:
            logger.error(f"MongoDB geospatial query error: {e}")
            return []

    def count_entities(
        self, entity_type: str, filter_query: Optional[Dict] = None
    ) -> int:
        """
        Count entities in collection.

        Args:
            entity_type: NGSI-LD entity type
            filter_query: Optional MongoDB filter query

        Returns:
            Count of matching entities
        """
        if not self.enabled or not self.db:
            return 0

        try:
            collection_name = self.get_collection_name(entity_type)
            if not collection_name:
                return 0

            collection = self.db[collection_name]
            return collection.count_documents(filter_query or {})

        except PyMongoError as e:
            logger.error(f"MongoDB count error: {e}")
            return 0

    def close(self) -> None:
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")


# Singleton instance
_mongodb_helper: Optional[MongoDBHelper] = None


def get_mongodb_helper(
    config_path: str = "config/mongodb_config.yaml",
) -> MongoDBHelper:
    """
    Get or create singleton MongoDB helper instance.

    Args:
        config_path: Path to MongoDB configuration file

    Returns:
        MongoDBHelper instance
    """
    global _mongodb_helper

    if _mongodb_helper is None:
        _mongodb_helper = MongoDBHelper(config_path)
        if _mongodb_helper.enabled and PYMONGO_AVAILABLE:
            _mongodb_helper.connect()

    return _mongodb_helper
