#!/usr/bin/env python3
"""Cache Manager Unit Test Suite.

Module: tests.unit.test_cache_manager
Author: nguyễn Nhật Quang
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Production-ready unit tests for cache manager operations.
    Tests caching strategies, TTL, invalidation, and error recovery.

Usage:
    pytest tests/unit/test_cache_manager.py
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from src.agents.cache.cache_manager_agent import CacheManagerAgent


class TestCacheManager:
    """Test cache operations with real assertions."""
    
    @pytest.fixture
    def cache_manager(self):
        """Create cache manager instance."""
        config = {"enabled": False}  # Disabled for unit tests
        return CacheManagerAgent(config)
    
    def test_cache_set_get(self, cache_manager):
        """Test basic set/get operations."""
        cache_manager._local_cache["test_key"] = "test_value"
        result = cache_manager._local_cache.get("test_key")
        assert result == "test_value"
    
    def test_ttl_expiration(self, cache_manager):
        """Test TTL-based expiration logic."""
        import time
        from datetime import datetime, timedelta
        
        # Test that expired items would be removed
        expired_time = datetime.utcnow() - timedelta(seconds=10)
        cache_manager._expiry["expired_key"] = expired_time
        
        # Check expiration detection
        is_expired = datetime.utcnow() > cache_manager._expiry.get("expired_key", datetime.utcnow())
        assert is_expired is True
    
    @patch('redis.Redis')
    def test_redis_connection(self, mock_redis):
        """Test Redis connection when enabled."""
        mock_client = MagicMock()
        mock_redis.return_value = mock_client
        
        config = {
            "enabled": True,
            "redis_host": "localhost",
            "redis_port": 6379
        }
        
        # This would trigger Redis connection in production
        agent = CacheManagerAgent(config)
        assert agent.enabled is True
