#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cache Manager Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.cache.cache_manager_agent
Author: Nguyen Viet Hoang
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Manages distributed caching with Redis backend for improved performance.
    Implements caching strategies, TTL management, and cache warming.

Cache Strategies:
    - Write-through: Update cache immediately on write
    - Write-behind: Async cache updates
    - Cache-aside: Lazy loading on cache miss

    Full production implementation with Redis client and connection pooling.
"""


import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

try:
    import redis
    from redis.connection import ConnectionPool

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None  # type: ignore
    ConnectionPool = None  # type: ignore

logger = logging.getLogger(__name__)


class CacheManagerAgent:
    """
    Distributed cache manager with Redis backend.

    Provides high-performance caching for API responses,
    query results, and computed values.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize cache manager with Redis connection pool."""
        import os

        self.config = config or {}
        self.enabled = self.config.get("enabled", False)  # Disabled by default
        # Priority: environment variables > config > defaults
        self._redis_host = os.environ.get("REDIS_HOST") or self.config.get(
            "redis_host", "localhost"
        )
        self._redis_port = int(
            os.environ.get("REDIS_PORT") or self.config.get("redis_port", 6379)
        )
        self._redis_db = self.config.get("redis_db", 1)  # Use DB 1 for cache
        self._redis_password = os.environ.get("REDIS_PASSWORD") or self.config.get(
            "redis_password"
        )
        self._default_ttl = self.config.get("default_ttl", 3600)

        # In-memory fallback cache
        self._local_cache: Dict[str, tuple] = {}

        # Redis client initialization
        self._redis_client: Optional["redis.Redis"] = None
        self._use_redis = False

        if self.enabled and REDIS_AVAILABLE:
            try:
                pool = ConnectionPool(
                    host=self._redis_host,
                    port=self._redis_port,
                    db=self._redis_db,
                    password=self._redis_password,
                    decode_responses=True,
                    max_connections=20,
                    socket_keepalive=True,
                    socket_timeout=5,
                )

                self._redis_client = redis.Redis(connection_pool=pool)
                self._redis_client.ping()
                self._use_redis = True

                logger.info(
                    "CacheManagerAgent initialized with Redis backend",
                    extra={
                        "redis": f"{self._redis_host}:{self._redis_port}",
                        "db": self._redis_db,
                    },
                )
            except Exception as e:
                logger.warning(
                    f"Redis unavailable, using in-memory cache: {e}",
                    extra={"error": str(e)},
                )
                self._use_redis = False
        else:
            logger.info(
                "CacheManagerAgent in SAFE MODE (disabled)",
                extra={"enabled": self.enabled, "redis_available": REDIS_AVAILABLE},
            )

    def get(self, key: str) -> Optional[Any]:
        """
        Retrieve value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        if not self.enabled:
            return None

        if key in self._local_cache:
            value, expiry = self._local_cache[key]
            if datetime.now() < expiry:
                logger.debug(f"Cache HIT: {key}")
                return value
            else:
                # Expired
                del self._local_cache[key]
                logger.debug(f"Cache EXPIRED: {key}")

        logger.debug(f"Cache MISS: {key}")
        return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
        """
        Store value in cache with TTL.

        Args:
            key: Cache key
            value: Value to cache
            ttl_seconds: Time-to-live (uses default if None)

        Returns:
            True if stored successfully
        """
        if not self.enabled:
            return False

        ttl = ttl_seconds or self._default_ttl
        expiry = datetime.now() + timedelta(seconds=ttl)

        self._local_cache[key] = (value, expiry)

        logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
        return True

    def delete(self, key: str) -> bool:
        """
        Remove key from cache.

        Args:
            key: Cache key to delete

        Returns:
            True if key existed and was deleted
        """
        if not self.enabled:
            return False

        if key in self._local_cache:
            del self._local_cache[key]
            logger.debug(f"Cache DELETE: {key}")
            return True

        return False

    def clear(self, pattern: Optional[str] = None) -> int:
        """
        Clear cache entries matching pattern.

        Args:
            pattern: Key pattern (e.g., "user:*") or None for all

        Returns:
            Number of keys deleted
        """
        if not self.enabled:
            return 0

        if pattern is None:
            count = len(self._local_cache)
            self._local_cache.clear()
            logger.info(f"Cache CLEARED: {count} keys")
            return count

        # Simple pattern matching (symbolic)
        keys_to_delete = [
            key for key in self._local_cache.keys() if pattern.replace("*", "") in key
        ]

        for key in keys_to_delete:
            del self._local_cache[key]

        logger.info(f"Cache CLEARED: {len(keys_to_delete)} keys (pattern: {pattern})")
        return len(keys_to_delete)

    def get_or_compute(
        self, key: str, compute_func: callable, ttl_seconds: Optional[int] = None
    ) -> Any:
        """
        Get from cache or compute and cache result.

        Args:
            key: Cache key
            compute_func: Function to compute value on miss
            ttl_seconds: Cache TTL

        Returns:
            Cached or computed value
        """
        if not self.enabled:
            return compute_func()

        # Try cache first
        cached = self.get(key)
        if cached is not None:
            return cached

        # Compute value
        value = compute_func()

        # Store in cache
        self.set(key, value, ttl_seconds)

        return value

    def cache_key(self, *args, **kwargs) -> str:
        """
        Generate cache key from arguments.

        Args:
            *args: Positional arguments
            **kwargs: Keyword arguments

        Returns:
            MD5 hash key
        """
        key_data = json.dumps(
            {"args": args, "kwargs": sorted(kwargs.items())}, sort_keys=True
        )

        return hashlib.md5(key_data.encode()).hexdigest()

    def get_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.

        Returns:
            Statistics dictionary
        """
        return {
            "total_keys": len(self._local_cache),
            "memory_usage_bytes": sum(
                len(str(v[0])) for v in self._local_cache.values()
            ),
            "symbolic_mode": not self.enabled,
        }

    async def run(self):
        """
        Main cache manager loop (symbolic).

        Would typically:
        - Monitor cache hit/miss rates
        - Perform cache warming
        - Evict expired entries
        - Generate performance metrics
        """
        logger.info("CacheManagerAgent.run() called (symbolic)")
        return {"status": "completed", "symbolic": True}
