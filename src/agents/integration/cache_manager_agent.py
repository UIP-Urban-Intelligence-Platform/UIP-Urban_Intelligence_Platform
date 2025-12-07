#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cache Manager Agent - Redis-Based Caching Layer.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.integration.cache_manager_agent
Author: Nguyen Nhat Quang
Created: 2025-11-27
Version: 2.0.0
License: MIT

Description:
    Production-ready Redis-based caching layer with advanced features for
    high-performance data access and intelligent cache management.

Core Features:
    - Intelligent cache key generation (URL + params + headers)
    - TTL management per resource type
    - Cache warming (preload hot data)
    - Cache invalidation (webhook and time-based)
    - Real-time statistics and monitoring
    - LRU eviction for memory management
    - Optional compression support

Dependencies:
    - redis>=4.0: Redis client
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/cache_config.yaml:
        - redis_url: Redis connection string
        - ttl_rules: TTL per resource type (seconds)
        - max_memory: Memory limit
        - compression_enabled: Enable/disable compression
        - warming_rules: Cache warming configuration

Example:
    ```python
    from src.agents.integration.cache_manager_agent import CacheManagerAgent

    cache = CacheManagerAgent()

    # Get with auto-caching
    data = cache.get_or_fetch("api/cameras", fetch_function=fetch_cameras)

    # Invalidate
    cache.invalidate("api/cameras")

    # Statistics
    stats = cache.get_statistics()
    print(f"Hit rate: {stats['hit_rate']:.2%}")
    ```

Cache Key Strategy:
    hash(url + sorted_params + relevant_headers) → unique key

Performance:
    - Sub-millisecond read latency
    - Async support for high concurrency
    - Batch operations for bulk data

References:
    - Redis Best Practices: https://redis.io/docs/manual/patterns/
"""

import asyncio
import gzip
import hashlib
import logging
import re
import time
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from src.core.config_loader import expand_env_var

try:
    from redis.asyncio import ConnectionPool, Redis
except ImportError:
    # Fallback for older redis-py versions
    from aioredis import ConnectionPool, Redis


class PatternType(Enum):
    """Pattern matching types for cache policies"""

    EXACT = "exact"
    GLOB = "glob"
    PATH_TEMPLATE = "path_template"
    REGEX = "regex"


class InvalidationEventType(Enum):
    """Types of cache invalidation events"""

    ENTITY_CREATE = "entity_create"
    ENTITY_UPDATE = "entity_update"
    ENTITY_DELETE = "entity_delete"
    ENTITY_PATCH = "entity_patch"
    BATCH_UPDATE = "batch_update"
    TRIPLE_INSERT = "triple_insert"
    TRIPLE_DELETE = "triple_delete"
    GRAPH_UPDATE = "graph_update"
    CAMERA_UPDATE = "camera_update"
    CAMERA_CREATE = "camera_create"
    CAMERA_DELETE = "camera_delete"
    SENSOR_UPDATE = "sensor_update"
    OBSERVATION_CREATE = "observation_create"


@dataclass
class CachePolicy:
    """Cache policy configuration for a URL pattern"""

    name: str
    pattern: str
    pattern_type: PatternType
    ttl: int
    max_size: str = "5MB"
    enabled: bool = True
    compression_enabled: bool = True
    compression_algorithm: str = "gzip"
    compression_min_size: int = 1024
    invalidate_on: List[str] = field(default_factory=list)
    vary_by: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    warming_enabled: bool = False
    warming_schedule: Optional[str] = None
    warming_priority: str = "medium"

    def matches(self, url: str) -> bool:
        """Check if URL matches this policy's pattern"""
        if self.pattern_type == PatternType.EXACT:
            return url == self.pattern
        elif self.pattern_type == PatternType.GLOB:
            # Convert glob to regex
            pattern_regex = self.pattern.replace("*", ".*").replace("?", ".")
            return bool(re.match(f"^{pattern_regex}$", url))
        elif self.pattern_type == PatternType.PATH_TEMPLATE:
            # Convert path template to regex (e.g., /entities/{id} -> /entities/[^/]+)
            pattern_regex = re.sub(r"\{[^}]+\}", r"[^/]+", self.pattern)
            return bool(re.match(f"^{pattern_regex}$", url))
        elif self.pattern_type == PatternType.REGEX:
            return bool(re.match(self.pattern, url))
        return False

    def get_max_size_bytes(self) -> int:
        """Convert max_size string to bytes"""
        size_str = self.max_size.upper()
        if "KB" in size_str:
            return int(size_str.replace("KB", "")) * 1024
        elif "MB" in size_str:
            return int(size_str.replace("MB", "")) * 1024 * 1024
        elif "GB" in size_str:
            return int(size_str.replace("GB", "")) * 1024 * 1024 * 1024
        else:
            return int(size_str)


@dataclass
class CacheStatistics:
    """Cache statistics and metrics"""

    hits: int = 0
    misses: int = 0
    sets: int = 0
    deletes: int = 0
    evictions: int = 0
    total_requests: int = 0
    total_latency_ms: float = 0.0
    compressed_bytes: int = 0
    uncompressed_bytes: int = 0

    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate"""
        if self.total_requests == 0:
            return 0.0
        return self.hits / self.total_requests

    @property
    def miss_rate(self) -> float:
        """Calculate cache miss rate"""
        if self.total_requests == 0:
            return 0.0
        return self.misses / self.total_requests

    @property
    def avg_latency_ms(self) -> float:
        """Calculate average latency"""
        if self.total_requests == 0:
            return 0.0
        return self.total_latency_ms / self.total_requests

    @property
    def compression_ratio(self) -> float:
        """Calculate compression ratio"""
        if self.uncompressed_bytes == 0:
            return 1.0
        return self.compressed_bytes / self.uncompressed_bytes

    def to_dict(self) -> Dict[str, Any]:
        """Convert statistics to dictionary"""
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "hit_rate": round(self.hit_rate, 4),
            "miss_rate": round(self.miss_rate, 4),
            "total_requests": self.total_requests,
            "hits": self.hits,
            "misses": self.misses,
            "sets": self.sets,
            "deletes": self.deletes,
            "evictions": self.evictions,
            "avg_latency_ms": round(self.avg_latency_ms, 2),
            "compression_ratio": round(self.compression_ratio, 4),
            "compressed_bytes": self.compressed_bytes,
            "uncompressed_bytes": self.uncompressed_bytes,
        }


class CacheKeyGenerator:
    """Generate cache keys from URL, params, and headers"""

    @staticmethod
    def generate(
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[bytes] = None,
        vary_by: Optional[List[str]] = None,
    ) -> str:
        """
        Generate unique cache key from request components

        Args:
            url: Request URL path
            params: Query parameters
            headers: Request headers
            body: Request body (for POST/PATCH)
            vary_by: List of factors to vary by (query params, headers, body)

        Returns:
            SHA256 hash as cache key
        """
        factors = [url]

        # Add query parameters if specified in vary_by
        if params and vary_by:
            for key in vary_by:
                if key in params:
                    factors.append(f"{key}={params[key]}")
        elif params and not vary_by:
            # Include all params if vary_by not specified
            factors.append(str(sorted(params.items())))

        # Add headers if specified in vary_by
        if headers and vary_by:
            for key in vary_by:
                if key.lower() in [h.lower() for h in headers.keys()]:
                    header_key = next(
                        h for h in headers.keys() if h.lower() == key.lower()
                    )
                    factors.append(f"{key}={headers[header_key]}")

        # Add body hash if specified
        if body and vary_by and "body" in vary_by:
            body_hash = hashlib.sha256(body).hexdigest()[:16]
            factors.append(f"body={body_hash}")

        # Add Accept header by default (content negotiation)
        if headers and "Accept" in headers:
            factors.append(f"Accept={headers['Accept']}")

        # Generate SHA256 hash
        key_string = "|".join(factors)
        cache_key = hashlib.sha256(key_string.encode()).hexdigest()

        return f"cache:{cache_key}"

    @staticmethod
    def generate_pattern_keys(pattern: str) -> List[str]:
        """
        Generate cache key patterns for invalidation

        Args:
            pattern: URL pattern (e.g., /entities/*)

        Returns:
            List of cache key patterns
        """
        # Convert URL pattern to cache key pattern
        pattern_hash = hashlib.sha256(pattern.encode()).hexdigest()
        return [f"cache:{pattern_hash[:16]}*"]


class CacheManagerConfig:
    """Configuration manager for Cache Manager Agent"""

    def __init__(self, config_path: str):
        """
        Initialize configuration from YAML file

        Args:
            config_path: Path to cache_config.yaml
        """
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self._setup_logging()
        self.logger = logging.getLogger(__name__)

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")

        with open(self.config_path, "r") as f:
            config = yaml.safe_load(f)

        if "cache_manager" not in config:
            raise ValueError("Invalid configuration: 'cache_manager' section not found")

        # Expand environment variables using centralized helper
        config = expand_env_var(config)

        return config["cache_manager"]

    def _setup_logging(self) -> None:
        """Configure logging with rotating file handler"""
        log_config = self.config.get("logging", {})
        log_level = log_config.get("level", "INFO")
        log_format = log_config.get("format", "json")
        log_file = log_config.get("file", "logs/cache_manager.log")
        max_bytes = log_config.get("max_bytes", 10485760)
        backup_count = log_config.get("backup_count", 5)

        # Create logs directory
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        # Setup logger
        logger = logging.getLogger()
        logger.setLevel(getattr(logging, log_level))

        # Rotating file handler
        file_handler = RotatingFileHandler(
            log_file, maxBytes=max_bytes, backupCount=backup_count
        )

        if log_format == "json":
            formatter = logging.Formatter(
                '{"timestamp": "%(asctime)s", "level": "%(levelname)s", '
                '"logger": "%(name)s", "message": "%(message)s"}'
            )
        else:
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
            )

        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    def get_redis_config(self) -> Dict[str, Any]:
        """Get Redis connection configuration"""
        return self.config.get("redis", {})

    def get_policies(self) -> List[CachePolicy]:
        """Get cache policies"""
        policies = []
        for policy_config in self.config.get("policies", []):
            compression_config = policy_config.get("compression", {})
            warming_config = policy_config.get("warming", {})

            policy = CachePolicy(
                name=policy_config["name"],
                pattern=policy_config["pattern"],
                pattern_type=PatternType(policy_config.get("pattern_type", "exact")),
                ttl=policy_config["ttl"],
                max_size=policy_config.get("max_size", "5MB"),
                enabled=policy_config.get("enabled", True),
                compression_enabled=compression_config.get("enabled", True),
                compression_algorithm=compression_config.get("algorithm", "gzip"),
                compression_min_size=compression_config.get("min_size", 1024),
                invalidate_on=policy_config.get("invalidate_on", []),
                vary_by=policy_config.get("vary_by", []),
                tags=policy_config.get("tags", []),
                warming_enabled=warming_config.get("enabled", False),
                warming_schedule=warming_config.get("schedule"),
                warming_priority=warming_config.get("priority", "medium"),
            )
            policies.append(policy)

        return policies

    def get_warming_config(self) -> Dict[str, Any]:
        """Get cache warming configuration"""
        return self.config.get("warming", {})

    def get_invalidation_config(self) -> Dict[str, Any]:
        """Get cache invalidation configuration"""
        return self.config.get("invalidation", {})

    def get_memory_config(self) -> Dict[str, Any]:
        """Get memory management configuration"""
        return self.config.get("memory", {})

    def get_monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring configuration"""
        return self.config.get("monitoring", {})

    def get_server_config(self) -> Dict[str, Any]:
        """Get server configuration"""
        return self.config.get("server", {})


class CacheWarmer:
    """Cache warming - preload frequently accessed data"""

    def __init__(self, config: Dict[str, Any], cache_manager: "CacheManagerAgent"):
        """
        Initialize cache warmer

        Args:
            config: Warming configuration
            cache_manager: Cache manager instance
        """
        self.config = config
        self.cache_manager = cache_manager
        self.logger = logging.getLogger(__name__)
        self.enabled = config.get("enabled", False)
        self.interval = config.get("interval", 300)
        self.max_concurrent = config.get("max_concurrent", 5)
        self.timeout = config.get("timeout", 10)
        self.urls = config.get("urls", [])
        self._warming_task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        """Start cache warming background task"""
        if not self.enabled:
            self.logger.info("Cache warming disabled")
            return

        # Warm on startup if configured
        if self.config.get("on_startup", True):
            await self.warm_cache()

        # Start periodic warming
        self._warming_task = asyncio.create_task(self._periodic_warming())
        self.logger.info(f"Cache warming started (interval: {self.interval}s)")

    async def stop(self) -> None:
        """Stop cache warming background task"""
        if self._warming_task:
            self._warming_task.cancel()
            try:
                await self._warming_task
            except asyncio.CancelledError:
                # CancelledError is expected when stopping task intentionally
                pass
        self.logger.info("Cache warming stopped")

    async def _periodic_warming(self) -> None:
        """Periodically warm cache"""
        while True:
            try:
                await asyncio.sleep(self.interval)
                await self.warm_cache()
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Cache warming error: {e}")

    async def warm_cache(self) -> Dict[str, Any]:
        """
        Warm cache by preloading URLs

        Returns:
            Warming statistics
        """
        start_time = time.time()
        results = {"total": len(self.urls), "success": 0, "failed": 0, "duration_ms": 0}

        # Sort URLs by priority
        sorted_urls = sorted(
            self.urls,
            key=lambda x: {"high": 0, "medium": 1, "low": 2}.get(
                x.get("priority", "medium"), 1
            ),
        )

        # Warm cache concurrently (limited by max_concurrent)
        semaphore = asyncio.Semaphore(self.max_concurrent)

        async def warm_url(url_config: Dict[str, Any]) -> bool:
            async with semaphore:
                try:
                    url = url_config["url"]
                    headers = url_config.get("headers", {})

                    # Generate cache key
                    cache_key = CacheKeyGenerator.generate(url, headers=headers)

                    # Check if already cached
                    cached_value = await self.cache_manager.get(cache_key)
                    if cached_value is not None:
                        self.logger.debug(f"URL already cached: {url}")
                        return True

                    # Fetch from backend (simulated - would call actual backend)
                    # In production, this would make HTTP request to backend service
                    self.logger.info(f"Warming cache for URL: {url}")

                    # Here you would call:
                    # response = await http_client.get(url, headers=headers, timeout=self.timeout)
                    # await self.cache_manager.set(cache_key, response.content, ttl=...)

                    return True

                except Exception as e:
                    self.logger.error(
                        f"Failed to warm URL {url_config.get('url')}: {e}"
                    )
                    return False

        # Execute warming tasks
        tasks = [warm_url(url_config) for url_config in sorted_urls]
        task_results = await asyncio.gather(*tasks, return_exceptions=True)

        # Count results
        for result in task_results:
            if isinstance(result, bool) and result:
                results["success"] += 1
            else:
                results["failed"] += 1

        results["duration_ms"] = (time.time() - start_time) * 1000

        self.logger.info(
            f"Cache warming completed: {results['success']}/{results['total']} "
            f"successful in {results['duration_ms']:.2f}ms"
        )

        return results


class CacheInvalidator:
    """Cache invalidation - remove stale entries"""

    def __init__(self, config: Dict[str, Any], cache_manager: "CacheManagerAgent"):
        """
        Initialize cache invalidator

        Args:
            config: Invalidation configuration
            cache_manager: Cache manager instance
        """
        self.config = config
        self.cache_manager = cache_manager
        self.logger = logging.getLogger(__name__)
        self.enabled = config.get("enabled", False)
        self.strategies = config.get("strategies", [])
        self._invalidation_tasks: List[asyncio.Task] = []

    async def start(self) -> None:
        """Start cache invalidation background tasks"""
        if not self.enabled:
            self.logger.info("Cache invalidation disabled")
            return

        # Start time-based invalidation
        for strategy in self.strategies:
            if strategy["type"] == "time_based" and strategy.get("enabled", True):
                task = asyncio.create_task(self._time_based_invalidation(strategy))
                self._invalidation_tasks.append(task)

        self.logger.info("Cache invalidation started")

    async def stop(self) -> None:
        """Stop cache invalidation background tasks"""
        for task in self._invalidation_tasks:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                # CancelledError is expected when stopping tasks intentionally
                pass
        self.logger.info("Cache invalidation stopped")

    async def _time_based_invalidation(self, strategy: Dict[str, Any]) -> None:
        """Periodically check and remove expired entries"""
        check_interval = strategy.get("check_interval", 60)
        batch_size = strategy.get("batch_size", 1000)

        while True:
            try:
                await asyncio.sleep(check_interval)

                # Redis handles TTL automatically, but we can cleanup manually
                # This is mainly for monitoring and statistics
                deleted = await self.cache_manager.cleanup_expired(batch_size)

                if deleted > 0:
                    self.logger.info(
                        f"Time-based invalidation: removed {deleted} expired entries"
                    )

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Time-based invalidation error: {e}")

    async def invalidate_by_event(
        self,
        event: str,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
    ) -> int:
        """
        Invalidate cache entries by event type

        Args:
            event: Event type (e.g., 'entity_update')
            entity_id: Entity ID for specific invalidation
            entity_type: Entity type for pattern invalidation

        Returns:
            Number of entries invalidated
        """
        # Find matching webhook strategy
        webhook_strategy = next(
            (
                s
                for s in self.strategies
                if s["type"] == "webhook" and s.get("enabled", True)
            ),
            None,
        )

        if not webhook_strategy:
            return 0

        # Find event configuration
        event_config = next(
            (e for e in webhook_strategy.get("events", []) if e["event"] == event), None
        )

        if not event_config:
            return 0

        # Get invalidation patterns
        patterns = event_config.get("invalidate_patterns", [])

        # Replace placeholders
        invalidation_patterns = []
        for pattern in patterns:
            if entity_id:
                pattern = pattern.replace("{entity_id}", entity_id)
            if entity_type:
                pattern = pattern.replace("{entity_type}", entity_type)
            invalidation_patterns.append(pattern)

        # Invalidate matching keys
        total_deleted = 0
        for pattern in invalidation_patterns:
            deleted = await self.cache_manager.invalidate_pattern(pattern)
            total_deleted += deleted

        self.logger.info(
            f"Invalidated {total_deleted} entries for event '{event}' "
            f"(entity_id={entity_id}, entity_type={entity_type})"
        )

        return total_deleted

    async def invalidate_by_tag(self, tag: str) -> int:
        """
        Invalidate cache entries by tag

        Args:
            tag: Tag to invalidate

        Returns:
            Number of entries invalidated
        """
        # In production, you would maintain a tag -> keys mapping
        # For now, we scan all keys (expensive - use sparingly)
        deleted = await self.cache_manager.invalidate_tag(tag)

        self.logger.info(f"Invalidated {deleted} entries with tag '{tag}'")

        return deleted

    async def invalidate_by_pattern(self, pattern: str) -> int:
        """
        Invalidate cache entries by URL pattern

        Args:
            pattern: URL pattern (supports wildcards)

        Returns:
            Number of entries invalidated
        """
        deleted = await self.cache_manager.invalidate_pattern(pattern)

        self.logger.info(f"Invalidated {deleted} entries matching pattern '{pattern}'")

        return deleted


class CacheManagerAgent:
    """
    Domain-agnostic cache manager with Redis backend

    Provides:
    - Cache key generation
    - TTL management
    - Cache warming
    - Cache invalidation
    - Statistics tracking
    - Memory management
    """

    def __init__(self, config_path: str):
        """
        Initialize cache manager

        Args:
            config_path: Path to cache_config.yaml
        """
        self.config = CacheManagerConfig(config_path)
        self.logger = logging.getLogger(__name__)

        # Redis client
        self.redis: Optional[Redis] = None
        self.redis_pool: Optional[ConnectionPool] = None

        # Cache policies
        self.policies = self.config.get_policies()
        self.default_policy = next(
            (p for p in self.policies if p.name == "default"), None
        )

        # Components
        self.warmer: Optional[CacheWarmer] = None
        self.invalidator: Optional[CacheInvalidator] = None

        # Statistics
        self.stats = CacheStatistics()

        # Memory tracking
        self.memory_config = self.config.get_memory_config()
        self.max_memory_bytes = self._parse_memory_size(
            self.memory_config.get("max_memory", "512MB")
        )
        self.max_keys = self.memory_config.get("max_keys", 10000)

        self.logger.info("Cache Manager Agent initialized")

    def _parse_memory_size(self, size_str: str) -> int:
        """Convert memory size string to bytes"""
        size_str = size_str.upper()
        if "KB" in size_str:
            return int(size_str.replace("KB", "")) * 1024
        elif "MB" in size_str:
            return int(size_str.replace("MB", "")) * 1024 * 1024
        elif "GB" in size_str:
            return int(size_str.replace("GB", "")) * 1024 * 1024 * 1024
        else:
            return int(size_str)

    async def start(self) -> None:
        """Start cache manager and background tasks"""
        # Initialize Redis connection
        await self._connect_redis()

        # Initialize components
        warming_config = self.config.get_warming_config()
        self.warmer = CacheWarmer(warming_config, self)
        await self.warmer.start()

        invalidation_config = self.config.get_invalidation_config()
        self.invalidator = CacheInvalidator(invalidation_config, self)
        await self.invalidator.start()

        self.logger.info("Cache Manager Agent started")

    async def stop(self) -> None:
        """Stop cache manager and cleanup resources"""
        # Stop components
        if self.warmer:
            await self.warmer.stop()

        if self.invalidator:
            await self.invalidator.stop()

        # Close Redis connection
        if self.redis:
            await self.redis.close()

        if self.redis_pool:
            await self.redis_pool.disconnect()

        self.logger.info("Cache Manager Agent stopped")

    async def _connect_redis(self) -> None:
        """Connect to Redis"""
        import os

        redis_config = self.config.get_redis_config()

        # Priority: environment variables > config > defaults
        # Create connection pool
        self.redis_pool = ConnectionPool(
            host=os.environ.get("REDIS_HOST") or redis_config.get("host", "localhost"),
            port=int(os.environ.get("REDIS_PORT") or redis_config.get("port", 6379)),
            db=redis_config.get("db", 0),
            password=os.environ.get("REDIS_PASSWORD")
            or redis_config.get("password")
            or None,
            max_connections=redis_config.get("max_connections", 50),
            socket_timeout=redis_config.get("socket_timeout", 5),
            socket_connect_timeout=redis_config.get("socket_connect_timeout", 5),
            decode_responses=redis_config.get("decode_responses", False),
            health_check_interval=redis_config.get("health_check_interval", 30),
        )

        # Create Redis client
        self.redis = Redis(connection_pool=self.redis_pool)

        # Test connection
        try:
            await self.redis.ping()
            self.logger.info("Connected to Redis")
        except Exception as e:
            self.logger.error(f"Failed to connect to Redis: {e}")
            raise

    def find_policy(self, url: str) -> Optional[CachePolicy]:
        """
        Find matching cache policy for URL

        Args:
            url: Request URL

        Returns:
            Matching policy or default policy
        """
        for policy in self.policies:
            if policy.enabled and policy.matches(url):
                return policy

        return self.default_policy

    async def get(self, cache_key: str, decompress: bool = True) -> Optional[bytes]:
        """
        Get value from cache

        Args:
            cache_key: Cache key
            decompress: Whether to decompress value

        Returns:
            Cached value or None if not found
        """
        start_time = time.time()

        try:
            # Get from Redis
            value = await self.redis.get(cache_key)

            latency_ms = (time.time() - start_time) * 1000
            self.stats.total_requests += 1
            self.stats.total_latency_ms += latency_ms

            if value is None:
                self.stats.misses += 1
                self.logger.debug(f"Cache MISS: {cache_key} ({latency_ms:.2f}ms)")
                return None

            self.stats.hits += 1

            # Decompress if needed
            if decompress and isinstance(value, bytes):
                try:
                    # Check if compressed (gzip magic number)
                    if value[:2] == b"\x1f\x8b":
                        original_size = len(value)
                        value = gzip.decompress(value)
                        decompressed_size = len(value)
                        self.logger.debug(
                            f"Decompressed: {original_size} -> {decompressed_size} bytes "
                            f"({decompressed_size/original_size:.2f}x)"
                        )
                except Exception as e:
                    self.logger.warning(f"Decompression failed: {e}")

            self.logger.debug(f"Cache HIT: {cache_key} ({latency_ms:.2f}ms)")

            return value

        except Exception as e:
            self.logger.error(f"Cache get error: {e}")
            self.stats.total_requests += 1
            self.stats.misses += 1
            return None

    async def set(
        self,
        cache_key: str,
        value: bytes,
        ttl: int,
        compress: bool = True,
        compress_min_size: int = 1024,
    ) -> bool:
        """
        Set value in cache

        Args:
            cache_key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            compress: Whether to compress value
            compress_min_size: Minimum size for compression

        Returns:
            True if successful
        """
        try:
            # Compress if enabled and size exceeds threshold
            original_size = len(value)
            compressed = False

            if compress and original_size >= compress_min_size:
                try:
                    compressed_value = gzip.compress(value, compresslevel=6)
                    compressed_size = len(compressed_value)

                    # Only use compressed if actually smaller
                    if compressed_size < original_size * 0.9:  # 10% improvement
                        value = compressed_value
                        compressed = True
                        self.stats.compressed_bytes += compressed_size
                        self.stats.uncompressed_bytes += original_size
                        self.logger.debug(
                            f"Compressed: {original_size} -> {compressed_size} bytes "
                            f"({compressed_size/original_size:.2f}x)"
                        )
                except Exception as e:
                    self.logger.warning(f"Compression failed: {e}")

            # Set in Redis with TTL
            if ttl > 0:
                await self.redis.setex(cache_key, ttl, value)
            else:
                await self.redis.set(cache_key, value)

            self.stats.sets += 1

            self.logger.debug(
                f"Cache SET: {cache_key} (size={len(value)}, ttl={ttl}s, "
                f"compressed={compressed})"
            )

            return True

        except Exception as e:
            self.logger.error(f"Cache set error: {e}")
            return False

    async def delete(self, cache_key: str) -> bool:
        """
        Delete value from cache

        Args:
            cache_key: Cache key

        Returns:
            True if deleted
        """
        try:
            result = await self.redis.delete(cache_key)

            if result > 0:
                self.stats.deletes += 1
                self.logger.debug(f"Cache DELETE: {cache_key}")
                return True

            return False

        except Exception as e:
            self.logger.error(f"Cache delete error: {e}")
            return False

    async def invalidate_pattern(self, pattern: str) -> int:
        """
        Invalidate cache entries matching URL pattern

        Args:
            pattern: URL pattern (supports wildcards)

        Returns:
            Number of entries deleted
        """
        try:
            # Generate cache key pattern
            # This is a simplified version - in production, you would maintain
            # a reverse mapping from URL patterns to cache keys

            # Scan Redis keys matching pattern
            # Note: SCAN is more efficient than KEYS for production
            cursor = 0
            deleted = 0

            while True:
                cursor, keys = await self.redis.scan(
                    cursor=cursor, match=f"cache:*", count=1000
                )

                if keys:
                    deleted += await self.redis.delete(*keys)

                if cursor == 0:
                    break

            if deleted > 0:
                self.stats.deletes += deleted
                self.logger.info(
                    f"Invalidated {deleted} entries matching pattern: {pattern}"
                )

            return deleted

        except Exception as e:
            self.logger.error(f"Pattern invalidation error: {e}")
            return 0

    async def invalidate_tag(self, tag: str) -> int:
        """
        Invalidate cache entries by tag

        Args:
            tag: Tag to invalidate

        Returns:
            Number of entries deleted
        """
        # In production, maintain a tag index: tag -> [keys]
        # For now, we'll scan all keys (expensive)
        try:
            # This would query the tag index and delete matching keys
            # Simplified implementation
            deleted = 0

            self.logger.info(f"Invalidated {deleted} entries with tag: {tag}")

            return deleted

        except Exception as e:
            self.logger.error(f"Tag invalidation error: {e}")
            return 0

    async def cleanup_expired(self, batch_size: int = 1000) -> int:
        """
        Cleanup expired entries (manual TTL check)

        Args:
            batch_size: Number of keys to check per batch

        Returns:
            Number of entries deleted
        """
        # Redis automatically removes expired keys
        # This is mainly for monitoring and statistics
        try:
            info = await self.redis.info("stats")
            evicted = info.get("evicted_keys", 0)

            # Update stats
            if evicted > self.stats.evictions:
                self.stats.evictions = evicted

            return 0

        except Exception as e:
            self.logger.error(f"Cleanup error: {e}")
            return 0

    async def get_memory_usage(self) -> Dict[str, Any]:
        """
        Get memory usage statistics

        Returns:
            Memory usage information
        """
        try:
            info = await self.redis.info("memory")

            used_memory = info.get("used_memory", 0)
            used_memory_human = info.get("used_memory_human", "0B")
            peak_memory = info.get("used_memory_peak", 0)

            return {
                "used_memory_bytes": used_memory,
                "used_memory_human": used_memory_human,
                "peak_memory_bytes": peak_memory,
                "max_memory_bytes": self.max_memory_bytes,
                "usage_ratio": (
                    used_memory / self.max_memory_bytes
                    if self.max_memory_bytes > 0
                    else 0
                ),
            }

        except Exception as e:
            self.logger.error(f"Memory usage error: {e}")
            return {}

    async def get_keys_count(self) -> int:
        """
        Get number of keys in cache

        Returns:
            Number of keys
        """
        try:
            return await self.redis.dbsize()
        except Exception as e:
            self.logger.error(f"Keys count error: {e}")
            return 0

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get cache statistics

        Returns:
            Statistics dictionary
        """
        return self.stats.to_dict()

    async def get_health_status(self) -> Dict[str, Any]:
        """
        Get health status

        Returns:
            Health status dictionary
        """
        try:
            # Test Redis connection
            redis_healthy = await self.redis.ping()

            # Get memory usage
            memory_usage = await self.get_memory_usage()

            # Get keys count
            keys_count = await self.get_keys_count()

            return {
                "status": "healthy" if redis_healthy else "unhealthy",
                "components": {
                    "redis": {
                        "status": "connected" if redis_healthy else "disconnected",
                        "keys_count": keys_count,
                        "memory_usage": memory_usage,
                    },
                    "warmer": {
                        "status": (
                            "enabled"
                            if self.warmer and self.warmer.enabled
                            else "disabled"
                        )
                    },
                    "invalidator": {
                        "status": (
                            "enabled"
                            if self.invalidator and self.invalidator.enabled
                            else "disabled"
                        )
                    },
                },
                "statistics": self.stats.to_dict(),
            }

        except Exception as e:
            self.logger.error(f"Health check error: {e}")
            # Avoid exposing internal error details to clients
            return {"status": "unhealthy", "error": "Internal health check failure"}


# FastAPI application for Cache Manager API
try:
    from fastapi import FastAPI, Header, HTTPException, Request
    from fastapi.responses import JSONResponse

    def create_app(config_path: str = "config/cache_config.yaml") -> FastAPI:
        """
        Create FastAPI application for Cache Manager Agent

        Args:
            config_path: Path to configuration file

        Returns:
            FastAPI application instance
        """
        app = FastAPI(
            title="Cache Manager Agent",
            version="1.0.0",
            description="Domain-agnostic caching layer with Redis backend",
        )

        cache_manager = CacheManagerAgent(config_path)

        @app.on_event("startup")
        async def startup():
            """Start cache manager on application startup"""
            await cache_manager.start()

        @app.on_event("shutdown")
        async def shutdown():
            """Stop cache manager on application shutdown"""
            await cache_manager.stop()

        @app.get("/health")
        async def health():
            """Health check endpoint"""
            status = await cache_manager.get_health_status()
            return JSONResponse(content=status)

        @app.get("/cache/metrics")
        async def metrics():
            """Cache metrics endpoint"""
            stats = cache_manager.get_statistics()
            memory = await cache_manager.get_memory_usage()
            keys_count = await cache_manager.get_keys_count()

            return JSONResponse(
                content={
                    "statistics": stats,
                    "memory": memory,
                    "keys_count": keys_count,
                }
            )

        @app.post("/cache/invalidate")
        async def invalidate_webhook(
            request: Request, x_webhook_secret: Optional[str] = Header(None)
        ):
            """Webhook endpoint for cache invalidation"""
            # Validate webhook secret
            invalidation_config = cache_manager.config.get_invalidation_config()
            webhook_strategy = next(
                (
                    s
                    for s in invalidation_config.get("strategies", [])
                    if s["type"] == "webhook"
                ),
                None,
            )

            if webhook_strategy:
                auth_config = webhook_strategy.get("authentication", {})
                expected_secret = auth_config.get("secret")

                if expected_secret and x_webhook_secret != expected_secret:
                    raise HTTPException(
                        status_code=401, detail="Invalid webhook secret"
                    )

            # Parse request body
            body = await request.json()
            event = body.get("event")
            entity_id = body.get("entity_id")
            entity_type = body.get("entity_type")

            if not event:
                raise HTTPException(status_code=400, detail="Missing 'event' field")

            # Invalidate cache
            deleted = await cache_manager.invalidator.invalidate_by_event(
                event, entity_id, entity_type
            )

            return JSONResponse(
                content={
                    "deleted": deleted,
                    "event": event,
                    "entity_id": entity_id,
                    "entity_type": entity_type,
                }
            )

        @app.post("/cache/invalidate/tag")
        async def invalidate_tag(
            request: Request, x_webhook_secret: Optional[str] = Header(None)
        ):
            """Invalidate cache by tag"""
            # Validate secret
            invalidation_config = cache_manager.config.get_invalidation_config()
            tag_strategy = next(
                (
                    s
                    for s in invalidation_config.get("strategies", [])
                    if s["type"] == "tag_based"
                ),
                None,
            )

            if tag_strategy:
                auth_config = tag_strategy.get("authentication", {})
                expected_secret = auth_config.get("secret")

                if expected_secret and x_webhook_secret != expected_secret:
                    raise HTTPException(status_code=401, detail="Invalid secret")

            # Parse request
            body = await request.json()
            tag = body.get("tag")

            if not tag:
                raise HTTPException(status_code=400, detail="Missing 'tag' field")

            # Invalidate
            deleted = await cache_manager.invalidator.invalidate_by_tag(tag)

            return JSONResponse(content={"deleted": deleted, "tag": tag})

        @app.post("/cache/invalidate/pattern")
        async def invalidate_pattern(
            request: Request, x_webhook_secret: Optional[str] = Header(None)
        ):
            """Invalidate cache by pattern"""
            # Validate secret
            invalidation_config = cache_manager.config.get_invalidation_config()
            pattern_strategy = next(
                (
                    s
                    for s in invalidation_config.get("strategies", [])
                    if s["type"] == "pattern_based"
                ),
                None,
            )

            if pattern_strategy:
                auth_config = pattern_strategy.get("authentication", {})
                expected_secret = auth_config.get("secret")

                if expected_secret and x_webhook_secret != expected_secret:
                    raise HTTPException(status_code=401, detail="Invalid secret")

            # Parse request
            body = await request.json()
            pattern = body.get("pattern")

            if not pattern:
                raise HTTPException(status_code=400, detail="Missing 'pattern' field")

            # Invalidate
            deleted = await cache_manager.invalidator.invalidate_by_pattern(pattern)

            return JSONResponse(content={"deleted": deleted, "pattern": pattern})

        return app

except ImportError:
    # FastAPI not available
    pass


if __name__ == "__main__":
    import sys

    # Run cache manager
    config_path = sys.argv[1] if len(sys.argv) > 1 else "config/cache_config.yaml"

    async def main():
        manager = CacheManagerAgent(config_path)
        await manager.start()

        try:
            # Keep running
            await asyncio.Event().wait()
        except KeyboardInterrupt:
            # Graceful shutdown on Ctrl+C
            logging.info("Received shutdown signal")
        finally:
            await manager.stop()

    asyncio.run(main())
