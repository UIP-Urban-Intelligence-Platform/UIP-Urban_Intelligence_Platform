#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cache Integration Test Suite.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: tests.integration.test_cache_integration
Author: Nguyen Nhat Quang
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Production-ready integration tests for Redis cache functionality.
    Validates cache operations, data persistence, and error handling.
    Requires Docker container for Redis.

Usage:
    pytest tests/integration/test_cache_integration.py -m requires_docker
"""

import os

import pytest

# Skip if redis is not available (CI environment without Docker)
try:
    import redis

    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

# Check if running in CI environment
IN_CI = os.environ.get("CI", "false").lower() == "true"


@pytest.mark.integration
@pytest.mark.requires_docker
@pytest.mark.skipif(not REDIS_AVAILABLE, reason="redis package not available")
@pytest.mark.skipif(IN_CI, reason="Redis not available in CI environment")
class TestCacheIntegration:
    """Test Redis cache integration."""

    @pytest.fixture
    def redis_client(self):
        """Create Redis client."""
        client = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
        yield client
        client.close()

    def test_redis_connection(self, redis_client):
        """Test Redis connection and basic operations."""
        # Test PING
        assert redis_client.ping() is True

        # Test SET/GET
        redis_client.set("test_key", "test_value")
        value = redis_client.get("test_key")
        assert value == "test_value"

        # Clean up
        redis_client.delete("test_key")

    def test_cache_invalidation_cascade(self, redis_client):
        """Test cache invalidation with dependent keys."""
        # Set up dependent cache entries
        redis_client.set("camera:CAM001", '{"id": "CAM001"}')
        redis_client.set("camera:CAM001:observations", "[1,2,3]")
        redis_client.set("camera:CAM001:stats", '{"count": 3}')

        # Invalidate using pattern
        pattern = "camera:CAM001*"
        keys = list(redis_client.scan_iter(match=pattern))

        assert len(keys) >= 3

        # Delete all matching keys
        if keys:
            redis_client.delete(*keys)

        # Verify deletion
        assert redis_client.get("camera:CAM001") is None
        assert redis_client.get("camera:CAM001:observations") is None
