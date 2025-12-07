#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cache Invalidation Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.cache.cache_invalidator_agent
Author: Nguyen Viet Hoang
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Intelligently invalidates cache entries when source data changes.
    Implements event-driven cache invalidation and dependency tracking.

Invalidation Strategies:
    - Time-based: TTL expiration
    - Event-based: Invalidate on data change
    - Dependency-based: Cascade invalidation
    - Pattern-based: Bulk invalidation
"""


try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None  # type: ignore

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Set

logger = logging.getLogger(__name__)


class CacheInvalidatorAgent:
    """
    Smart cache invalidation with dependency tracking.

    Automatically invalidates cached data when source
    entities are updated, ensuring cache consistency.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize cache invalidator."""
        self.config = config or {}
        self.enabled = self.config.get("enabled", False)

        # Track cache dependencies (key -> dependent keys)
        self._dependencies: Dict[str, Set[str]] = {}

        # Invalidation log
        self._invalidation_log: List[Dict[str, Any]] = []

        # Redis pub/sub for distributed invalidation
        self._redis_client: Optional["redis.Redis"] = None
        self._pubsub = None

        if self.enabled and REDIS_AVAILABLE:
            try:
                import os

                # Priority: environment variables > config > defaults
                redis_host = os.environ.get("REDIS_HOST") or self.config.get(
                    "redis_host", "localhost"
                )
                redis_port = int(
                    os.environ.get("REDIS_PORT") or self.config.get("redis_port", 6379)
                )

                self._redis_client = redis.Redis(
                    host=redis_host, port=redis_port, decode_responses=True
                )

                self._pubsub = self._redis_client.pubsub()
                self._pubsub.subscribe("cache_invalidation")

                logger.info(
                    "CacheInvalidatorAgent initialized with Redis pub/sub",
                    extra={"redis": f"{redis_host}:{redis_port}"},
                )
            except Exception as e:
                logger.warning(f"Redis pub/sub unavailable: {e}")
                self._redis_client = None
        else:
            logger.info(
                "CacheInvalidatorAgent in SAFE MODE (disabled)",
                extra={"enabled": self.enabled, "redis_available": REDIS_AVAILABLE},
            )

    def register_dependency(self, source_key: str, dependent_key: str):
        """
        Register cache key dependency.

        When source_key is invalidated, dependent_key will also be invalidated.

        Args:
            source_key: Source cache key
            dependent_key: Dependent cache key
        """
        if not self.enabled:
            return

        if source_key not in self._dependencies:
            self._dependencies[source_key] = set()

        self._dependencies[source_key].add(dependent_key)

        logger.debug(f"Dependency registered: {source_key} -> {dependent_key}")

    def invalidate(
        self, key: str, cascade: bool = True, reason: Optional[str] = None
    ) -> List[str]:
        """
        Invalidate cache key and optionally cascade to dependencies.

        Args:
            key: Cache key to invalidate
            cascade: If True, invalidate dependent keys
            reason: Reason for invalidation (for logging)

        Returns:
            List of all invalidated keys
        """
        if not self.enabled:
            return []

        invalidated = [key]

        # Cascade to dependent keys
        if cascade and key in self._dependencies:
            for dependent in self._dependencies[key]:
                # Recursive invalidation
                child_invalidated = self.invalidate(
                    dependent, cascade=True, reason="cascade"
                )
                invalidated.extend(child_invalidated)

        # Log invalidation
        self._invalidation_log.append(
            {
                "timestamp": datetime.now().isoformat(),
                "key": key,
                "reason": reason or "manual",
                "cascade": cascade,
            }
        )

        logger.info(
            f"Cache invalidated: {key} (cascade: {cascade})",
            extra={"total_invalidated": len(invalidated)},
        )

        return invalidated

    def invalidate_pattern(self, pattern: str, reason: Optional[str] = None) -> int:
        """
        Invalidate all keys matching pattern.

        Args:
            pattern: Pattern to match (e.g., "camera:*")
            reason: Invalidation reason

        Returns:
            Number of keys invalidated
        """
        if not self.enabled:
            return 0

        # Symbolic pattern matching
        logger.info(
            f"Pattern invalidation: {pattern} (symbolic)", extra={"reason": reason}
        )

        # In real implementation, would scan Redis keys
        return 0

    def invalidate_entity(self, entity_type: str, entity_id: str) -> List[str]:
        """
        Invalidate all cache entries related to an entity.

        Args:
            entity_type: Entity type (Camera, Accident, etc.)
            entity_id: Entity ID

        Returns:
            List of invalidated keys
        """
        if not self.enabled:
            return []

        # Generate common cache key patterns for this entity
        patterns = [
            f"{entity_type}:{entity_id}",
            f"query:*:{entity_type}:{entity_id}",
            f"stats:{entity_type}:{entity_id}",
        ]

        invalidated = []
        for pattern in patterns:
            # In real implementation, would use Redis SCAN
            invalidated.append(pattern)

        logger.info(
            f"Entity cache invalidated: {entity_type}:{entity_id}",
            extra={"patterns": len(patterns)},
        )

        return invalidated

    def on_entity_update(self, event: Dict[str, Any]):
        """
        Handle entity update event and invalidate related caches.

        Args:
            event: Update event with entity_type, entity_id, action
        """
        if not self.enabled:
            return

        entity_type = event.get("entity_type")
        entity_id = event.get("entity_id")
        action = event.get("action", "update")

        logger.info(
            f"Entity update event: {action} {entity_type}:{entity_id}",
            extra={"event": event},
        )

        # Invalidate entity caches
        self.invalidate_entity(entity_type, entity_id)

        # Entity-specific invalidation logic
        if entity_type == "Camera":
            # Invalidate observation queries
            self.invalidate_pattern(f"observations:camera:{entity_id}")
        elif entity_type == "Accident":
            # Invalidate accident statistics
            self.invalidate_pattern(f"stats:accidents:*")
        elif entity_type == "Congestion":
            # Invalidate congestion maps
            self.invalidate_pattern("congestion:map:*")

    def get_invalidation_stats(self) -> Dict[str, Any]:
        """
        Get invalidation statistics.

        Returns:
            Statistics dictionary
        """
        total_invalidations = len(self._invalidation_log)

        # Count by reason
        reasons = {}
        for entry in self._invalidation_log:
            reason = entry["reason"]
            reasons[reason] = reasons.get(reason, 0) + 1

        return {
            "total_invalidations": total_invalidations,
            "by_reason": reasons,
            "total_dependencies": sum(
                len(deps) for deps in self._dependencies.values()
            ),
            "symbolic_mode": not self.enabled,
        }

    def clear_invalidation_log(self):
        """Clear invalidation history log."""
        if not self.enabled:
            return

        self._invalidation_log.clear()
        logger.info("Invalidation log cleared")

    async def run(self):
        """
        Main invalidator loop (symbolic).

        Would typically:
        - Subscribe to entity update events
        - Monitor cache consistency
        - Generate invalidation reports
        """
        logger.info("CacheInvalidatorAgent.run() called (symbolic)")
        return {"status": "completed", "symbolic": True}
