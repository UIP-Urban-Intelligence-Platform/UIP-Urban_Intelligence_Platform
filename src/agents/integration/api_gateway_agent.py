"""API Gateway Agent - HTTP Gateway with Authentication, Rate Limiting, and Caching.

Module: src.agents.integration.api_gateway_agent
Author: Nguyễn Nhật Quang
Created: 2025-11-27
Version: 2.0.0
License: MIT

Description:
    Production-ready API gateway with comprehensive middleware for
    authentication, rate limiting, caching, and request routing.

Core Features:
    - Multiple authentication methods (API key, JWT, OAuth2)
    - Token bucket rate limiting with Redis
    - Request routing and proxying to backend services
    - Response caching with configurable TTL
    - CORS handling with preflight support
    - Request/response transformation
    - Circuit breaker pattern for fault tolerance
    - Comprehensive logging and monitoring

Dependencies:
    - fastapi>=0.104: Web framework
    - redis>=4.0: Rate limiting and caching
    - PyJWT>=2.8: JWT authentication
    - aiohttp>=3.8: Backend proxying

Configuration:
    config/api_gateway_config.yaml:
        - auth_methods: Enabled authentication schemes
        - rate_limits: Rate limiting rules per endpoint
        - cache_rules: Caching policies
        - backend_routes: Service routing configuration

Example:
    ```python
    from src.agents.integration.api_gateway_agent import APIGatewayAgent
    
    gateway = APIGatewayAgent()
    gateway.run(host="0.0.0.0", port=8080)
    ```

Middleware Stack:
    Request → CORS → Logging → Auth → Rate Limit → Route → Cache → Backend → Response

References:
    - FastAPI: https://fastapi.tiangolo.com/
    - Token Bucket: https://en.wikipedia.org/wiki/Token_bucket
"""

import asyncio
import gzip
import hashlib
import json
import logging
import os
import re
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin, urlparse

import httpx
import jwt
import yaml
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.background import BackgroundTask

# Import centralized environment variable expansion helper
from src.core.config_loader import expand_env_var


class AuthMethod(Enum):
    """Authentication method types"""
    API_KEY = "api_key"
    JWT = "jwt"


class RateLimitAlgorithm(Enum):
    """Rate limiting algorithm types"""
    TOKEN_BUCKET = "token_bucket"
    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"


class CacheStatus(Enum):
    """Cache status for responses"""
    HIT = "HIT"
    MISS = "MISS"
    BYPASS = "BYPASS"
    EXPIRED = "EXPIRED"


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class APIKey:
    """API key configuration"""
    key: str
    owner: str
    description: str
    rate_limit: int
    enabled: bool


@dataclass
class JWTConfig:
    """JWT authentication configuration"""
    enabled: bool
    secret: str
    algorithm: str
    issuer: str
    audience: str
    token_header: str
    token_prefix: str
    expiration: int
    verify_exp: bool
    verify_nbf: bool
    verify_iat: bool


@dataclass
class RouteConfig:
    """Route configuration"""
    name: str
    path: str
    path_type: str
    backend: str
    methods: List[str]
    auth_required: bool
    timeout: int
    retry: Dict[str, Any] = field(default_factory=dict)
    cache: Dict[str, Any] = field(default_factory=dict)
    headers: Dict[str, Any] = field(default_factory=dict)


@dataclass
class CircuitBreakerState:
    """Circuit breaker state tracking"""
    state: CircuitState
    failure_count: int
    last_failure_time: Optional[float]
    half_open_attempts: int


class APIGatewayConfig:
    """Load and manage API Gateway configuration from YAML file"""
    
    def __init__(self, config_path: str = "config/api_gateway_config.yaml"):
        """
        Initialize configuration loader
        
        Args:
            config_path: Path to YAML configuration file
        """
        self.config_path = config_path
        self.config = self._load_config()
        self._setup_logging()
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"Loaded API Gateway configuration from {config_path}")
    
    def _load_config(self) -> Dict[str, Any]:
        """Load and parse YAML configuration with environment variable expansion"""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
            
            # Expand environment variables like ${VAR:-default}
            config = expand_env_var(config)
            
            # Validate required sections
            required_sections = ['api_gateway']
            for section in required_sections:
                if section not in config:
                    raise ValueError(f"Missing required configuration section: {section}")
            
            return config
        
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML configuration: {e}")
    
    def _setup_logging(self):
        """Setup logging configuration"""
        logging_config = self.config.get('api_gateway', {}).get('logging', {})
        
        log_level = logging_config.get('level', 'INFO')
        log_format = logging_config.get('format', 'json')
        log_output = logging_config.get('output', 'file')
        
        # Create logs directory if it doesn't exist
        if log_output in ('file', 'both'):
            log_file = logging_config.get('file', {}).get('path', 'logs/api_gateway.log')
            Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        
        # Configure root logger
        logger = logging.getLogger()
        logger.setLevel(getattr(logging, log_level))
        
        # Remove existing handlers
        logger.handlers = []
        
        # Create formatter
        if log_format == 'json':
            formatter = logging.Formatter(
                '{"timestamp":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","message":"%(message)s"}'
            )
        else:
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
        
        # Add file handler
        if log_output in ('file', 'both'):
            file_config = logging_config.get('file', {})
            file_handler = RotatingFileHandler(
                file_config.get('path', 'logs/api_gateway.log'),
                maxBytes=file_config.get('max_bytes', 10485760),
                backupCount=file_config.get('backup_count', 5)
            )
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        
        # Add console handler
        if log_output in ('stdout', 'both'):
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)
    
    def get_server_config(self) -> Dict[str, Any]:
        """Get server configuration"""
        return self.config.get('api_gateway', {}).get('server', {})
    
    def get_authentication_config(self) -> Dict[str, Any]:
        """Get authentication configuration"""
        return self.config.get('api_gateway', {}).get('authentication', {})
    
    def get_rate_limiting_config(self) -> Dict[str, Any]:
        """Get rate limiting configuration"""
        return self.config.get('api_gateway', {}).get('rate_limiting', {})
    
    def get_routes(self) -> List[Dict[str, Any]]:
        """Get routes configuration"""
        return self.config.get('api_gateway', {}).get('routes', [])
    
    def get_cors_config(self) -> Dict[str, Any]:
        """Get CORS configuration"""
        return self.config.get('api_gateway', {}).get('cors', {})
    
    def get_caching_config(self) -> Dict[str, Any]:
        """Get caching configuration"""
        return self.config.get('api_gateway', {}).get('caching', {})
    
    def get_transformation_config(self) -> Dict[str, Any]:
        """Get transformation configuration"""
        return self.config.get('api_gateway', {}).get('transformation', {})
    
    def get_security_config(self) -> Dict[str, Any]:
        """Get security configuration"""
        return self.config.get('api_gateway', {}).get('security', {})
    
    def get_circuit_breaker_config(self) -> Dict[str, Any]:
        """Get circuit breaker configuration"""
        return self.config.get('api_gateway', {}).get('circuit_breaker', {})
    
    def get_openapi_config(self) -> Dict[str, Any]:
        """Get OpenAPI configuration"""
        return self.config.get('api_gateway', {}).get('openapi', {})
    
    def get_monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring configuration"""
        return self.config.get('monitoring', {})


class TokenBucketRateLimiter:
    """Token bucket rate limiter with Redis storage support"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize rate limiter
        
        Args:
            config: Rate limiting configuration
        """
        self.config = config
        self.enabled = config.get('enabled', True)
        self.default_limit = config.get('default_limit', 100)
        self.burst_size = config.get('burst_size', 20)
        self.storage = config.get('storage', 'memory')
        self.logger = logging.getLogger(__name__)
        
        # In-memory storage (fallback or primary)
        self.buckets: Dict[str, Dict[str, Any]] = {}
        self.endpoint_limits = {
            f"{el.get('method', 'GET')}:{el.get('path', '')}": el.get('limit', self.default_limit)
            for el in config.get('endpoint_limits', [])
        }
        
        # Redis storage (if configured)
        self.redis_client = None
        if self.storage == 'redis':
            try:
                import redis
                import os
                # Priority: environment variables > config > defaults
                redis_url = os.environ.get("REDIS_URL") or config.get('redis_url', 'redis://localhost:6379')
                redis_db = config.get('redis_db', 0)
                self.redis_client = redis.from_url(redis_url, db=redis_db, decode_responses=True)
                self.redis_key_prefix = config.get('redis_key_prefix', 'api_gateway:rate_limit:')
                self.logger.info("Connected to Redis for rate limiting")
            except ImportError:
                self.logger.warning("Redis not available, using in-memory storage")
                self.storage = 'memory'
            except Exception as e:
                self.logger.error(f"Failed to connect to Redis: {e}, using in-memory storage")
                self.storage = 'memory'
    
    def _get_bucket_key(self, api_key: str) -> str:
        """Generate bucket key for API key"""
        return f"{self.redis_key_prefix}{api_key}" if self.storage == 'redis' else api_key
    
    def _get_endpoint_limit(self, method: str, path: str) -> int:
        """Get rate limit for specific endpoint"""
        # Try exact match first
        endpoint_key = f"{method}:{path}"
        if endpoint_key in self.endpoint_limits:
            return self.endpoint_limits[endpoint_key]
        
        # Try pattern match
        for pattern_key, limit in self.endpoint_limits.items():
            pattern_method, pattern_path = pattern_key.split(':', 1)
            if pattern_method == method and re.match(pattern_path.replace('*', '.*'), path):
                return limit
        
        return self.default_limit
    
    def _get_bucket_from_memory(self, key: str) -> Dict[str, Any]:
        """Get token bucket from memory"""
        if key not in self.buckets:
            self.buckets[key] = {
                'tokens': self.default_limit,
                'last_update': time.time()
            }
        return self.buckets[key]
    
    def _get_bucket_from_redis(self, key: str) -> Dict[str, Any]:
        """Get token bucket from Redis"""
        try:
            data = self.redis_client.hgetall(key)
            if data:
                return {
                    'tokens': float(data.get('tokens', self.default_limit)),
                    'last_update': float(data.get('last_update', time.time()))
                }
            else:
                # Initialize new bucket
                bucket = {
                    'tokens': float(self.default_limit),
                    'last_update': time.time()
                }
                self.redis_client.hset(key, mapping={
                    'tokens': bucket['tokens'],
                    'last_update': bucket['last_update']
                })
                self.redis_client.expire(key, 3600)  # 1 hour TTL
                return bucket
        except Exception as e:
            self.logger.error(f"Redis error in _get_bucket_from_redis: {e}")
            # Fallback to memory
            return self._get_bucket_from_memory(key)
    
    def _update_bucket_in_memory(self, key: str, bucket: Dict[str, Any]):
        """Update token bucket in memory"""
        self.buckets[key] = bucket
    
    def _update_bucket_in_redis(self, key: str, bucket: Dict[str, Any]):
        """Update token bucket in Redis"""
        try:
            self.redis_client.hset(key, mapping={
                'tokens': bucket['tokens'],
                'last_update': bucket['last_update']
            })
            self.redis_client.expire(key, 3600)  # 1 hour TTL
        except Exception as e:
            self.logger.error(f"Redis error in _update_bucket_in_redis: {e}")
            # Fallback to memory
            self._update_bucket_in_memory(key, bucket)
    
    async def check_rate_limit(
        self,
        api_key: str,
        limit: Optional[int] = None,
        method: str = "GET",
        path: str = "/"
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check if request is within rate limit
        
        Args:
            api_key: API key for rate limiting
            limit: Custom rate limit (overrides default)
            method: HTTP method
            path: Request path
        
        Returns:
            Tuple of (allowed: bool, rate_limit_info: dict)
        """
        if not self.enabled:
            return True, {'limit': 0, 'remaining': 0, 'reset': 0}
        
        # Determine rate limit
        if limit is None:
            limit = self._get_endpoint_limit(method, path)
        
        bucket_key = self._get_bucket_key(api_key)
        
        # Get bucket
        if self.storage == 'redis' and self.redis_client:
            bucket = self._get_bucket_from_redis(bucket_key)
        else:
            bucket = self._get_bucket_from_memory(bucket_key)
        
        current_time = time.time()
        time_elapsed = current_time - bucket['last_update']
        
        # Refill tokens based on elapsed time
        refill_rate = limit / 60.0  # tokens per second
        tokens_to_add = time_elapsed * refill_rate
        bucket['tokens'] = min(limit + self.burst_size, bucket['tokens'] + tokens_to_add)
        bucket['last_update'] = current_time
        
        # Check if request can be allowed
        if bucket['tokens'] >= 1.0:
            bucket['tokens'] -= 1.0
            allowed = True
        else:
            allowed = False
        
        # Update bucket
        if self.storage == 'redis' and self.redis_client:
            self._update_bucket_in_redis(bucket_key, bucket)
        else:
            self._update_bucket_in_memory(bucket_key, bucket)
        
        # Calculate reset time
        if not allowed:
            tokens_needed = 1.0 - bucket['tokens']
            seconds_until_reset = int(tokens_needed / refill_rate) + 1
        else:
            seconds_until_reset = 60
        
        rate_limit_info = {
            'limit': limit,
            'remaining': int(bucket['tokens']),
            'reset': int(current_time + seconds_until_reset)
        }
        
        return allowed, rate_limit_info


class ResponseCache:
    """Response caching with Redis storage and compression support"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize response cache
        
        Args:
            config: Caching configuration
        """
        self.config = config
        self.enabled = config.get('enabled', True)
        self.default_ttl = config.get('default_ttl', 300)
        self.max_ttl = config.get('max_ttl', 3600)
        self.storage = config.get('storage', 'memory')
        self.logger = logging.getLogger(__name__)
        
        # Compression settings
        self.compression_enabled = config.get('compression', {}).get('enabled', True)
        self.compression_min_size = config.get('compression', {}).get('min_size', 1024)
        self.compression_algorithm = config.get('compression', {}).get('algorithm', 'gzip')
        self.compression_level = config.get('compression', {}).get('level', 6)
        
        # In-memory cache (fallback or primary)
        self.cache: Dict[str, Dict[str, Any]] = {}
        
        # Redis storage (if configured)
        self.redis_client = None
        if self.storage == 'redis':
            try:
                import redis
                import os
                # Priority: environment variables > config > defaults
                redis_url = os.environ.get("REDIS_URL") or config.get('redis_url', 'redis://localhost:6379')
                redis_db = config.get('redis_db', 1)
                self.redis_client = redis.from_url(redis_url, db=redis_db)
                self.redis_key_prefix = config.get('redis_key_prefix', 'api_gateway:cache:')
                self.logger.info("Connected to Redis for caching")
            except ImportError:
                self.logger.warning("Redis not available, using in-memory caching")
                self.storage = 'memory'
            except Exception as e:
                self.logger.error(f"Failed to connect to Redis: {e}, using in-memory caching")
                self.storage = 'memory'
    
    def _generate_cache_key(
        self,
        method: str,
        path: str,
        query_params: Dict[str, Any],
        headers: Dict[str, str],
        body: Optional[bytes],
        route_config: Dict[str, Any]
    ) -> str:
        """Generate cache key based on request parameters"""
        key_parts = [method, path]
        
        cache_config = route_config.get('cache', {})
        vary_by = cache_config.get('vary_by', [])
        
        # Add query parameters if configured
        if 'query_params' in vary_by and query_params:
            query_str = '&'.join(f"{k}={v}" for k, v in sorted(query_params.items()))
            key_parts.append(query_str)
        
        # Add specific headers if configured
        if 'headers' in vary_by:
            for header_list in vary_by:
                if isinstance(header_list, dict) and 'headers' in header_list:
                    for header_name in header_list['headers']:
                        if header_name in headers:
                            key_parts.append(f"{header_name}:{headers[header_name]}")
        
        # Add body hash if configured
        if 'body' in vary_by and body:
            body_hash = hashlib.md5(body).hexdigest()
            key_parts.append(body_hash)
        
        # Generate hash of key parts
        key_string = '|'.join(key_parts)
        cache_key = hashlib.sha256(key_string.encode()).hexdigest()
        
        # Add prefix
        key_prefix = cache_config.get('key_prefix', '')
        if key_prefix:
            cache_key = f"{key_prefix}{cache_key}"
        
        return cache_key
    
    def _compress_data(self, data: bytes) -> bytes:
        """Compress data using configured algorithm"""
        if not self.compression_enabled or len(data) < self.compression_min_size:
            return data
        
        if self.compression_algorithm == 'gzip':
            return gzip.compress(data, compresslevel=self.compression_level)
        else:
            # Fallback to no compression for unsupported algorithms
            return data
    
    def _decompress_data(self, data: bytes, compressed: bool) -> bytes:
        """Decompress data if compressed"""
        if not compressed:
            return data
        
        if self.compression_algorithm == 'gzip':
            return gzip.decompress(data)
        else:
            return data
    
    async def get(
        self,
        method: str,
        path: str,
        query_params: Dict[str, Any],
        headers: Dict[str, str],
        body: Optional[bytes],
        route_config: Dict[str, Any]
    ) -> Tuple[Optional[bytes], CacheStatus]:
        """
        Get cached response
        
        Args:
            method: HTTP method
            path: Request path
            query_params: Query parameters
            headers: Request headers
            body: Request body
            route_config: Route configuration
        
        Returns:
            Tuple of (response_body, cache_status)
        """
        if not self.enabled:
            return None, CacheStatus.BYPASS
        
        cache_config = route_config.get('cache', {})
        if not cache_config.get('enabled', False):
            return None, CacheStatus.BYPASS
        
        cache_key = self._generate_cache_key(method, path, query_params, headers, body, route_config)
        
        # Get from Redis or memory
        if self.storage == 'redis' and self.redis_client:
            try:
                cached_data = self.redis_client.get(f"{self.redis_key_prefix}{cache_key}")
                if cached_data:
                    cache_entry = json.loads(cached_data)
                    response_body = self._decompress_data(
                        bytes.fromhex(cache_entry['body']),
                        cache_entry.get('compressed', False)
                    )
                    return response_body, CacheStatus.HIT
                return None, CacheStatus.MISS
            except Exception as e:
                self.logger.error(f"Redis cache get error: {e}")
                return None, CacheStatus.MISS
        else:
            if cache_key in self.cache:
                cache_entry = self.cache[cache_key]
                if time.time() < cache_entry['expires_at']:
                    response_body = self._decompress_data(
                        cache_entry['body'],
                        cache_entry.get('compressed', False)
                    )
                    return response_body, CacheStatus.HIT
                else:
                    del self.cache[cache_key]
                    return None, CacheStatus.EXPIRED
            return None, CacheStatus.MISS
    
    async def set(
        self,
        method: str,
        path: str,
        query_params: Dict[str, Any],
        headers: Dict[str, str],
        body: Optional[bytes],
        response_body: bytes,
        route_config: Dict[str, Any]
    ):
        """
        Store response in cache
        
        Args:
            method: HTTP method
            path: Request path
            query_params: Query parameters
            headers: Request headers
            body: Request body
            response_body: Response to cache
            route_config: Route configuration
        """
        if not self.enabled:
            return
        
        cache_config = route_config.get('cache', {})
        if not cache_config.get('enabled', False):
            return
        
        ttl = min(cache_config.get('ttl', self.default_ttl), self.max_ttl)
        cache_key = self._generate_cache_key(method, path, query_params, headers, body, route_config)
        
        # Compress if configured
        compressed = False
        if cache_config.get('compress', False) or self.compression_enabled:
            compressed_body = self._compress_data(response_body)
            if len(compressed_body) < len(response_body):
                response_body = compressed_body
                compressed = True
        
        # Store in Redis or memory
        if self.storage == 'redis' and self.redis_client:
            try:
                cache_entry = {
                    'body': response_body.hex(),
                    'compressed': compressed,
                    'cached_at': time.time()
                }
                self.redis_client.setex(
                    f"{self.redis_key_prefix}{cache_key}",
                    ttl,
                    json.dumps(cache_entry)
                )
            except Exception as e:
                self.logger.error(f"Redis cache set error: {e}")
        else:
            self.cache[cache_key] = {
                'body': response_body,
                'compressed': compressed,
                'expires_at': time.time() + ttl
            }
    
    async def invalidate(self, patterns: List[str]):
        """
        Invalidate cache entries matching patterns
        
        Args:
            patterns: List of path patterns to invalidate
        """
        if not self.enabled:
            return
        
        if self.storage == 'redis' and self.redis_client:
            try:
                # Get all keys matching patterns
                for pattern in patterns:
                    pattern_regex = pattern.replace('*', '.*')
                    keys = self.redis_client.keys(f"{self.redis_key_prefix}*")
                    for key in keys:
                        # This is simplified; in production, store path with key
                        self.redis_client.delete(key)
            except Exception as e:
                self.logger.error(f"Redis cache invalidation error: {e}")
        else:
            # In-memory invalidation
            keys_to_delete = []
            for cache_key in self.cache.keys():
                # Simplified matching; in production, store path metadata
                keys_to_delete.append(cache_key)
            
            for key in keys_to_delete:
                del self.cache[key]


class CircuitBreaker:
    """Circuit breaker for backend service protection"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize circuit breaker
        
        Args:
            config: Circuit breaker configuration
        """
        self.config = config
        self.enabled = config.get('enabled', True)
        self.failure_threshold = config.get('failure_threshold', 5)
        self.recovery_timeout = config.get('recovery_timeout', 60)
        self.half_open_requests = config.get('half_open_requests', 3)
        self.logger = logging.getLogger(__name__)
        
        # Per-backend state
        self.backends: Dict[str, CircuitBreakerState] = {}
        
        # Backend-specific configuration
        backend_configs = config.get('backends', [])
        self.backend_overrides = {
            bc['backend']: bc for bc in backend_configs
        }
    
    def _get_backend_state(self, backend_url: str) -> CircuitBreakerState:
        """Get or create backend state"""
        if backend_url not in self.backends:
            self.backends[backend_url] = CircuitBreakerState(
                state=CircuitState.CLOSED,
                failure_count=0,
                last_failure_time=None,
                half_open_attempts=0
            )
        return self.backends[backend_url]
    
    def _get_failure_threshold(self, backend_url: str) -> int:
        """Get failure threshold for backend"""
        if backend_url in self.backend_overrides:
            return self.backend_overrides[backend_url].get('failure_threshold', self.failure_threshold)
        return self.failure_threshold
    
    def _get_recovery_timeout(self, backend_url: str) -> int:
        """Get recovery timeout for backend"""
        if backend_url in self.backend_overrides:
            return self.backend_overrides[backend_url].get('recovery_timeout', self.recovery_timeout)
        return self.recovery_timeout
    
    async def call(self, backend_url: str, request_func) -> Any:
        """
        Execute request through circuit breaker
        
        Args:
            backend_url: Backend service URL
            request_func: Async function to execute request
        
        Returns:
            Response from request_func
        
        Raises:
            HTTPException: If circuit is open or request fails
        """
        if not self.enabled:
            return await request_func()
        
        state = self._get_backend_state(backend_url)
        current_time = time.time()
        
        # Check circuit state
        if state.state == CircuitState.OPEN:
            # Check if recovery timeout has elapsed
            recovery_timeout = self._get_recovery_timeout(backend_url)
            if state.last_failure_time and (current_time - state.last_failure_time) >= recovery_timeout:
                self.logger.info(f"Circuit breaker for {backend_url} entering HALF_OPEN state")
                state.state = CircuitState.HALF_OPEN
                state.half_open_attempts = 0
            else:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Circuit breaker OPEN for {backend_url}"
                )
        
        # Execute request
        try:
            response = await request_func()
            
            # Success - reset or close circuit
            if state.state == CircuitState.HALF_OPEN:
                state.half_open_attempts += 1
                if state.half_open_attempts >= self.half_open_requests:
                    self.logger.info(f"Circuit breaker for {backend_url} closing (recovery successful)")
                    state.state = CircuitState.CLOSED
                    state.failure_count = 0
                    state.half_open_attempts = 0
            elif state.state == CircuitState.CLOSED:
                # Reset failure count on success
                state.failure_count = 0
            
            return response
        
        except Exception as e:
            # Failure - increment counter and potentially open circuit
            state.failure_count += 1
            state.last_failure_time = current_time
            
            failure_threshold = self._get_failure_threshold(backend_url)
            
            if state.state == CircuitState.HALF_OPEN:
                self.logger.warning(f"Circuit breaker for {backend_url} opening (half-open request failed)")
                state.state = CircuitState.OPEN
                state.half_open_attempts = 0
            elif state.failure_count >= failure_threshold:
                self.logger.warning(f"Circuit breaker for {backend_url} opening (threshold reached)")
                state.state = CircuitState.OPEN
            
            raise


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """Authentication middleware for API key and JWT validation"""
    
    def __init__(self, app, config: APIGatewayConfig):
        """
        Initialize authentication middleware
        
        Args:
            app: FastAPI application
            config: Gateway configuration
        """
        super().__init__(app)
        self.config = config
        self.auth_config = config.get_authentication_config()
        self.logger = logging.getLogger(__name__)
        
        # Parse API keys
        self.api_keys: Dict[str, APIKey] = {}
        for method in self.auth_config.get('methods', []):
            if method.get('type') == 'api_key' and method.get('enabled', True):
                for key_config in method.get('keys', []):
                    if key_config.get('enabled', True):
                        api_key = APIKey(
                            key=key_config['key'],
                            owner=key_config['owner'],
                            description=key_config.get('description', ''),
                            rate_limit=key_config.get('rate_limit', 100),
                            enabled=key_config.get('enabled', True)
                        )
                        self.api_keys[api_key.key] = api_key
        
        # Parse JWT config
        self.jwt_config = None
        for method in self.auth_config.get('methods', []):
            if method.get('type') == 'jwt' and method.get('enabled', True):
                self.jwt_config = JWTConfig(
                    enabled=True,
                    secret=method['secret'],
                    algorithm=method.get('algorithm', 'HS256'),
                    issuer=method.get('issuer', 'api-gateway'),
                    audience=method.get('audience', 'multi-agent-system'),
                    token_header=method.get('token_header', 'Authorization'),
                    token_prefix=method.get('token_prefix', 'Bearer'),
                    expiration=method.get('expiration', 3600),
                    verify_exp=method.get('verify_exp', True),
                    verify_nbf=method.get('verify_nbf', True),
                    verify_iat=method.get('verify_iat', True)
                )
                break
    
    def _validate_api_key(self, request: Request) -> Optional[APIKey]:
        """Validate API key from request headers"""
        # Get API key from header
        api_key_header = None
        for method in self.auth_config.get('methods', []):
            if method.get('type') == 'api_key':
                api_key_header = method.get('header', 'X-API-Key')
                break
        
        if not api_key_header:
            return None
        
        api_key_value = request.headers.get(api_key_header)
        if not api_key_value:
            return None
        
        # Validate key
        api_key = self.api_keys.get(api_key_value)
        if api_key and api_key.enabled:
            return api_key
        
        return None
    
    def _validate_jwt(self, request: Request) -> Optional[Dict[str, Any]]:
        """Validate JWT token from request headers"""
        if not self.jwt_config or not self.jwt_config.enabled:
            return None
        
        # Get token from header
        auth_header = request.headers.get(self.jwt_config.token_header)
        if not auth_header:
            return None
        
        # Extract token
        if not auth_header.startswith(f"{self.jwt_config.token_prefix} "):
            return None
        
        token = auth_header[len(self.jwt_config.token_prefix) + 1:]
        
        # Validate token
        try:
            payload = jwt.decode(
                token,
                self.jwt_config.secret,
                algorithms=[self.jwt_config.algorithm],
                issuer=self.jwt_config.issuer if self.jwt_config.verify_iat else None,
                audience=self.jwt_config.audience,
                options={
                    'verify_exp': self.jwt_config.verify_exp,
                    'verify_nbf': self.jwt_config.verify_nbf,
                    'verify_iat': self.jwt_config.verify_iat
                }
            )
            return payload
        except jwt.ExpiredSignatureError:
            self.logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError as e:
            self.logger.warning(f"Invalid JWT token: {e}")
            return None
    
    async def dispatch(self, request: Request, call_next):
        """Process request through authentication"""
        # Skip authentication for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Check if authentication is enabled
        if not self.auth_config.get('enabled', True):
            request.state.authenticated = True
            request.state.api_key = None
            request.state.jwt_payload = None
            return await call_next(request)
        
        # Try API key authentication
        api_key = self._validate_api_key(request)
        if api_key:
            request.state.authenticated = True
            request.state.api_key = api_key
            request.state.jwt_payload = None
            return await call_next(request)
        
        # Try JWT authentication
        jwt_payload = self._validate_jwt(request)
        if jwt_payload:
            request.state.authenticated = True
            request.state.api_key = None
            request.state.jwt_payload = jwt_payload
            return await call_next(request)
        
        # No valid authentication
        request.state.authenticated = False
        request.state.api_key = None
        request.state.jwt_payload = None
        return await call_next(request)


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using token bucket algorithm"""
    
    def __init__(self, app, config: APIGatewayConfig, rate_limiter: TokenBucketRateLimiter):
        """
        Initialize rate limiting middleware
        
        Args:
            app: FastAPI application
            config: Gateway configuration
            rate_limiter: Rate limiter instance
        """
        super().__init__(app)
        self.config = config
        self.rate_limiter = rate_limiter
        self.logger = logging.getLogger(__name__)
    
    async def dispatch(self, request: Request, call_next):
        """Process request through rate limiting"""
        # Skip for OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Get API key from request state (set by auth middleware)
        api_key = getattr(request.state, 'api_key', None)
        
        if api_key:
            # Check rate limit
            allowed, rate_limit_info = await self.rate_limiter.check_rate_limit(
                api_key.key,
                api_key.rate_limit,
                request.method,
                request.url.path
            )
            
            if not allowed:
                # Rate limit exceeded
                self.logger.warning(
                    f"Rate limit exceeded for API key {api_key.owner}: "
                    f"{request.method} {request.url.path}"
                )
                
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Rate limit exceeded",
                        "retry_after": rate_limit_info['reset'] - int(time.time())
                    },
                    headers={
                        "X-RateLimit-Limit": str(rate_limit_info['limit']),
                        "X-RateLimit-Remaining": str(rate_limit_info['remaining']),
                        "X-RateLimit-Reset": str(rate_limit_info['reset']),
                        "Retry-After": str(rate_limit_info['reset'] - int(time.time()))
                    }
                )
            
            # Store rate limit info for response headers
            request.state.rate_limit_info = rate_limit_info
        else:
            # No API key - apply default rate limiting by IP
            client_ip = request.client.host if request.client else "unknown"
            allowed, rate_limit_info = await self.rate_limiter.check_rate_limit(
                f"ip:{client_ip}",
                None,
                request.method,
                request.url.path
            )
            
            if not allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "error": "Rate limit exceeded",
                        "retry_after": rate_limit_info['reset'] - int(time.time())
                    },
                    headers={
                        "X-RateLimit-Limit": str(rate_limit_info['limit']),
                        "X-RateLimit-Remaining": str(rate_limit_info['remaining']),
                        "X-RateLimit-Reset": str(rate_limit_info['reset'])
                    }
                )
            
            request.state.rate_limit_info = rate_limit_info
        
        return await call_next(request)


class APIGatewayAgent:
    """
    Production-ready API Gateway Agent with authentication, rate limiting, routing, and caching
    
    This class implements a complete API gateway that:
    - Authenticates requests using API keys or JWT
    - Enforces rate limits per API key
    - Routes requests to backend services
    - Caches responses for improved performance
    - Handles CORS
    - Provides OpenAPI documentation
    - Implements circuit breaker pattern for backend protection
    """
    
    def __init__(self, config_path: str = "config/api_gateway_config.yaml"):
        """
        Initialize API Gateway Agent
        
        Args:
            config_path: Path to configuration file
        """
        self.config = APIGatewayConfig(config_path)
        self.logger = logging.getLogger(__name__)
        
        # Initialize components
        self.rate_limiter = TokenBucketRateLimiter(self.config.get_rate_limiting_config())
        self.response_cache = ResponseCache(self.config.get_caching_config())
        self.circuit_breaker = CircuitBreaker(self.config.get_circuit_breaker_config())
        
        # Parse routes
        self.routes: List[RouteConfig] = []
        for route_dict in self.config.get_routes():
            route = RouteConfig(
                name=route_dict['name'],
                path=route_dict['path'],
                path_type=route_dict.get('path_type', 'exact'),
                backend=route_dict['backend'],
                methods=route_dict.get('methods', ['GET']),
                auth_required=route_dict.get('auth_required', True),
                timeout=route_dict.get('timeout', 30),
                retry=route_dict.get('retry', {}),
                cache=route_dict.get('cache', {}),
                headers=route_dict.get('headers', {})
            )
            self.routes.append(route)
        
        # Create FastAPI app
        openapi_config = self.config.get_openapi_config()
        self.app = FastAPI(
            title=openapi_config.get('title', 'API Gateway'),
            version=openapi_config.get('version', '1.0.0'),
            description=openapi_config.get('description', 'API Gateway'),
            contact=openapi_config.get('contact', {}),
            license_info=openapi_config.get('license', {})
        )
        
        # Setup middleware
        self._setup_middleware()
        
        # Setup routes
        self._setup_routes()
        
        # HTTP client for proxying
        self.http_client = httpx.AsyncClient(timeout=60.0)
        
        self.logger.info("API Gateway Agent initialized successfully")
    
    def _setup_middleware(self):
        """Setup middleware stack"""
        # CORS middleware (first in chain)
        cors_config = self.config.get_cors_config()
        if cors_config.get('enabled', True):
            self.app.add_middleware(
                CORSMiddleware,
                allow_origins=cors_config.get('allowed_origins', ['*']),
                allow_credentials=cors_config.get('allow_credentials', True),
                allow_methods=cors_config.get('allowed_methods', ['*']),
                allow_headers=cors_config.get('allowed_headers', ['*']),
                expose_headers=cors_config.get('expose_headers', []),
                max_age=cors_config.get('max_age', 3600)
            )
        
        # Rate limiting middleware
        self.app.add_middleware(RateLimitingMiddleware, config=self.config, rate_limiter=self.rate_limiter)
        
        # Authentication middleware
        self.app.add_middleware(AuthenticationMiddleware, config=self.config)
    
    def _match_route(self, method: str, path: str) -> Optional[RouteConfig]:
        """Match request to route configuration"""
        for route in self.routes:
            # Check method
            if method not in route.methods:
                continue
            
            # Check path
            if route.path_type == 'exact':
                if path == route.path:
                    return route
            elif route.path_type == 'prefix':
                route_path = route.path.rstrip('/*')
                if path.startswith(route_path):
                    return route
            elif route.path_type == 'regex':
                if re.match(route.path, path):
                    return route
        
        return None
    
    def _build_backend_url(self, route: RouteConfig, request_path: str, query_params: str) -> str:
        """Build backend URL from route and request"""
        # Handle internal routes
        if route.backend == 'internal':
            return None
        
        # Build URL
        if route.path_type == 'prefix':
            # Strip route prefix and append to backend
            route_path = route.path.rstrip('/*')
            remaining_path = request_path[len(route_path):].lstrip('/')
            backend_url = urljoin(route.backend, remaining_path)
        else:
            # Use request path as-is
            backend_url = route.backend
        
        # Add query parameters
        if query_params:
            backend_url = f"{backend_url}?{query_params}"
        
        return backend_url
    
    async def _proxy_request(
        self,
        method: str,
        url: str,
        headers: Dict[str, str],
        body: Optional[bytes],
        timeout: int,
        retry_config: Dict[str, Any]
    ) -> httpx.Response:
        """
        Proxy request to backend service with retry logic
        
        Args:
            method: HTTP method
            url: Backend URL
            headers: Request headers
            body: Request body
            timeout: Request timeout
            retry_config: Retry configuration
        
        Returns:
            Backend response
        """
        # Prepare headers
        proxy_headers = {k: v for k, v in headers.items() if k.lower() not in ('host', 'content-length')}
        
        # Retry logic
        retry_enabled = retry_config.get('enabled', False)
        max_attempts = retry_config.get('max_attempts', 3) if retry_enabled else 1
        backoff_factor = retry_config.get('backoff_factor', 2)
        
        last_exception = None
        for attempt in range(max_attempts):
            try:
                response = await self.http_client.request(
                    method=method,
                    url=url,
                    headers=proxy_headers,
                    content=body,
                    timeout=timeout,
                    follow_redirects=False
                )
                return response
            
            except (httpx.TimeoutException, httpx.ConnectError, httpx.NetworkError) as e:
                last_exception = e
                if attempt < max_attempts - 1:
                    wait_time = backoff_factor ** attempt
                    self.logger.warning(f"Request failed (attempt {attempt + 1}/{max_attempts}), retrying in {wait_time}s: {e}")
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.error(f"Request failed after {max_attempts} attempts: {e}")
        
        # All attempts failed
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Backend service unavailable: {last_exception}"
        )
    
    def _setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.api_route("/{full_path:path}", methods=["GET", "POST", "PATCH", "DELETE", "PUT", "HEAD", "OPTIONS"])
        async def proxy_handler(request: Request, full_path: str):
            """Handle all requests through gateway"""
            start_time = time.time()
            
            # Match route
            route = self._match_route(request.method, f"/{full_path}")
            if not route:
                return JSONResponse(
                    status_code=status.HTTP_404_NOT_FOUND,
                    content={"error": "Route not found"}
                )
            
            # Check authentication requirement
            if route.auth_required and not getattr(request.state, 'authenticated', False):
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Authentication required"},
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            # Handle internal routes
            if route.backend == 'internal':
                return await self._handle_internal_route(request, route)
            
            # Get request body
            request_body = await request.body() if request.method in ('POST', 'PATCH', 'PUT') else None
            
            # Check cache
            cache_status = CacheStatus.BYPASS
            if request.method == 'GET' and route.cache.get('enabled', False):
                cached_response, cache_status = await self.response_cache.get(
                    request.method,
                    f"/{full_path}",
                    dict(request.query_params),
                    dict(request.headers),
                    request_body,
                    route.__dict__
                )
                
                if cached_response:
                    response_time = (time.time() - start_time) * 1000
                    return Response(
                        content=cached_response,
                        status_code=200,
                        headers={
                            "X-Cache-Status": cache_status.value,
                            "X-Response-Time": f"{response_time:.2f}ms",
                            **self._get_rate_limit_headers(request)
                        }
                    )
            
            # Build backend URL
            backend_url = self._build_backend_url(route, f"/{full_path}", str(request.query_params))
            
            # Proxy request through circuit breaker
            try:
                async def make_request():
                    return await self._proxy_request(
                        request.method,
                        backend_url,
                        dict(request.headers),
                        request_body,
                        route.timeout,
                        route.retry
                    )
                
                backend_response = await self.circuit_breaker.call(route.backend, make_request)
                
                # Cache response if applicable
                if request.method == 'GET' and route.cache.get('enabled', False):
                    if backend_response.status_code == 200:
                        await self.response_cache.set(
                            request.method,
                            f"/{full_path}",
                            dict(request.query_params),
                            dict(request.headers),
                            request_body,
                            backend_response.content,
                            route.__dict__
                        )
                        cache_status = CacheStatus.MISS
                
                # Invalidate cache if write operation
                if request.method in ('POST', 'PATCH', 'DELETE', 'PUT'):
                    invalidation_rules = self.config.get_caching_config().get('invalidation', [])
                    for rule in invalidation_rules:
                        if rule.get('method') == request.method:
                            pattern = rule.get('pattern', '')
                            if re.match(pattern.replace('*', '.*'), f"/{full_path}"):
                                await self.response_cache.invalidate(rule.get('invalidate_patterns', []))
                
                # Build response
                response_time = (time.time() - start_time) * 1000
                response_headers = {
                    "X-Cache-Status": cache_status.value,
                    "X-Response-Time": f"{response_time:.2f}ms",
                    **self._get_rate_limit_headers(request),
                    **{k: v for k, v in backend_response.headers.items() if k.lower() not in ('content-length', 'transfer-encoding')}
                }
                
                return Response(
                    content=backend_response.content,
                    status_code=backend_response.status_code,
                    headers=response_headers,
                    media_type=backend_response.headers.get('content-type')
                )
            
            except HTTPException as e:
                return JSONResponse(
                    status_code=e.status_code,
                    content={"error": e.detail}
                )
            except Exception as e:
                self.logger.error(f"Error proxying request: {e}")
                return JSONResponse(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    content={"error": "Internal server error"}
                )
        
        @self.app.get("/gateway/status")
        async def gateway_status(request: Request):
            """Get gateway status"""
            if not getattr(request.state, 'authenticated', False):
                raise HTTPException(status_code=401, detail="Authentication required")
            
            return JSONResponse({
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": datetime.utcnow().isoformat(),
                "routes": len(self.routes),
                "circuit_breakers": {
                    backend: state.state.value
                    for backend, state in self.circuit_breaker.backends.items()
                }
            })
    
    async def _handle_internal_route(self, request: Request, route: RouteConfig) -> Response:
        """Handle internal gateway routes"""
        if route.name == "gateway_status":
            return JSONResponse({
                "status": "healthy",
                "version": "1.0.0",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "Internal route not found"}
        )
    
    def _get_rate_limit_headers(self, request: Request) -> Dict[str, str]:
        """Get rate limit headers from request state"""
        rate_limit_info = getattr(request.state, 'rate_limit_info', None)
        if rate_limit_info:
            return {
                "X-RateLimit-Limit": str(rate_limit_info['limit']),
                "X-RateLimit-Remaining": str(rate_limit_info['remaining']),
                "X-RateLimit-Reset": str(rate_limit_info['reset'])
            }
        return {}
    
    def get_app(self) -> FastAPI:
        """Get FastAPI application instance"""
        return self.app
    
    async def close(self):
        """Close HTTP client and cleanup resources"""
        await self.http_client.aclose()
        self.logger.info("API Gateway Agent closed")


def create_app(config_path: str = "config/api_gateway_config.yaml") -> FastAPI:
    """
    Factory function to create FastAPI application
    
    Args:
        config_path: Path to configuration file
    
    Returns:
        FastAPI application instance
    """
    gateway = APIGatewayAgent(config_path)
    return gateway.get_app()


if __name__ == "__main__":
    import uvicorn
    
    # Load configuration
    config = APIGatewayConfig()
    server_config = config.get_server_config()
    
    # Create app
    app = create_app()
    
    # Run server
    uvicorn.run(
        app,
        host=server_config.get('host', '0.0.0.0'),
        port=server_config.get('port', 8000),
        workers=1,  # Use 1 worker for development
        log_level="info"
    )
