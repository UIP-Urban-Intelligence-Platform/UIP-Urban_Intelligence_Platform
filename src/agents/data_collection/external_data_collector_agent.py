#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""External Data Collector Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.data_collection.external_data_collector_agent
Author: Nguyen Viet Hoang
Created: 2025-11-21
Version: 2.0.0
License: MIT

Description:
    Enriches entities with external contextual data (weather, air quality, etc.)
    by integrating with third-party APIs. Configuration-driven approach allows
    flexibility in data sources and entity types.

Core Features:
    - Async parallel API calls with aiohttp
    - Retry logic with exponential backoff (3 attempts)
    - Response caching with async-lru (configurable TTL)
    - Rate limiting per API (token bucket algorithm)
    - Support for multiple external data sources
    - Enriches original entity objects with additional fields

Dependencies:
    - aiohttp>=3.8: Async HTTP client
    - async-lru>=1.0: Async LRU caching
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/data_sources.yaml:
        - API endpoints and authentication
        - Rate limiting parameters
        - Cache TTL settings
        - Retry configuration

Example:
    ```python
    from src.agents.data_collection.external_data_collector_agent import ExternalDataCollectorAgent

    agent = ExternalDataCollectorAgent()
    enriched_entities = await agent.enrich_entities(entities)
    ```

Architecture:
    Input → API Integration → Caching → Rate Limiting → Output
    - Input: Entity data with coordinates (lat/lng)
    - APIs: OpenWeatherMap, OpenAQ, custom sources
    - Output: Enriched entities with external data fields
"""

import asyncio
import json
import logging
import signal
import sys
import time
from collections import defaultdict
from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any, Dict, List, Optional

import aiohttp
import yaml
from async_lru import alru_cache

# Import centralized environment variable expansion helper
from src.core.config_loader import expand_env_var


class RateLimitExceeded(Exception):
    """Custom exception for API rate limit (429) errors requiring extended delay."""


class RetryHandler:
    """
    Retry handler with exponential backoff for failed API calls.

    Implements configurable retry logic:
    - Max attempts (default 3)
    - Exponential backoff: base_delay * (2 ** attempt)
    - Maximum delay cap to prevent excessive waits
    """

    def __init__(
        self, max_attempts: int = 3, base_delay: float = 1.0, max_delay: float = 60.0
    ):
        """
        Initialize retry handler.

        Args:
            max_attempts: Maximum retry attempts (default 3)
            base_delay: Base delay for exponential backoff in seconds (default 1.0)
            max_delay: Maximum delay between retries in seconds (default 60.0)
        """
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.logger = logging.getLogger(f"{__name__}.RetryHandler")

    async def execute(self, coro_func, *args, **kwargs) -> Optional[Any]:
        """
        Execute async function with retry logic.

        Args:
            coro_func: Async function to execute
            *args: Positional arguments for function
            **kwargs: Keyword arguments for function

        Returns:
            Function result or None if all retries failed
        """
        for attempt in range(self.max_attempts):
            try:
                result = await coro_func(*args, **kwargs)
                if result is not None:
                    return result

                # If result is None but no exception, still retry
                if attempt < self.max_attempts - 1:
                    delay = min(self.base_delay * (2**attempt), self.max_delay)
                    self.logger.debug(
                        f"Attempt {attempt + 1}/{self.max_attempts} returned None, "
                        f"retrying in {delay:.2f}s..."
                    )
                    await asyncio.sleep(delay)

            except RateLimitExceeded:
                # ✅ CRITICAL FIX: Tăng delay từ 120s → 180s (3 phút) cho 429
                if attempt < self.max_attempts - 1:
                    delay = 180.0  # ✅ 3 minutes để API recovery hoàn toàn
                    self.logger.warning(
                        f"Rate limit (429) hit on attempt {attempt + 1}/{self.max_attempts}, "
                        f"waiting {delay:.0f}s (3 minutes) before retry..."
                    )
                    await asyncio.sleep(delay)
                else:
                    self.logger.error(
                        f"All {self.max_attempts} attempts failed due to rate limiting (429)"
                    )

            except asyncio.TimeoutError:
                if attempt < self.max_attempts - 1:
                    delay = min(self.base_delay * (2**attempt), self.max_delay)
                    self.logger.warning(
                        f"Timeout on attempt {attempt + 1}/{self.max_attempts}, "
                        f"retrying in {delay:.2f}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    self.logger.error(
                        f"All {self.max_attempts} attempts failed due to timeout"
                    )

            except aiohttp.ClientError as e:
                if attempt < self.max_attempts - 1:
                    delay = min(self.base_delay * (2**attempt), self.max_delay)
                    self.logger.warning(
                        f"Client error on attempt {attempt + 1}/{self.max_attempts}: {e}, "
                        f"retrying in {delay:.2f}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    self.logger.error(
                        f"All {self.max_attempts} attempts failed due to client error: {e}"
                    )

            except Exception as e:
                self.logger.error(f"Unexpected error on attempt {attempt + 1}: {e}")
                if attempt < self.max_attempts - 1:
                    delay = min(self.base_delay * (2**attempt), self.max_delay)
                    await asyncio.sleep(delay)

        return None


class RateLimiter:
    """
    Token bucket rate limiter for API requests.

    Ensures API rate limits are respected across async operations.
    """

    def __init__(self, max_requests: int, time_window: float = 60.0):
        """
        Initialize rate limiter.

        Args:
            max_requests: Maximum requests allowed in time window
            time_window: Time window in seconds (default 60s = 1 minute)
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.tokens = max_requests
        self.last_update = time.time()
        self.lock = asyncio.Lock()

    async def acquire(self) -> None:
        """
        Acquire permission to make a request.

        Blocks until a token is available.
        """
        async with self.lock:
            now = time.time()
            time_passed = now - self.last_update

            # Refill tokens based on time passed
            self.tokens = min(
                self.max_requests,
                self.tokens + (time_passed / self.time_window) * self.max_requests,
            )
            self.last_update = now

            # Wait if no tokens available
            while self.tokens < 1:
                wait_time = (1 - self.tokens) * self.time_window / self.max_requests
                await asyncio.sleep(wait_time)

                now = time.time()
                time_passed = now - self.last_update
                self.tokens = min(
                    self.max_requests,
                    self.tokens + (time_passed / self.time_window) * self.max_requests,
                )
                self.last_update = now

            # Consume one token
            self.tokens -= 1


class ExternalDataCollectorAgent:
    """
    External Data Collector Agent - Enriches entities with external contextual data.

    Configuration-driven external data enrichment.
    All configurations defined in YAML file.

    Features:
    - Fetches weather data from OpenWeatherMap API
    - Fetches air quality data from OpenAQ API
    - Geo-matching within configurable radius
    - Rate limiting and caching
    - Async HTTP with retry logic
    - Comprehensive error handling
    """

    def __init__(self, config_path: str = "config/data_sources.yaml"):
        """
        Initialize External Data Collector Agent.

        Args:
            config_path: Path to YAML configuration file

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If configuration is invalid
        """
        self.config_path = Path(config_path)
        self.config = self._load_config()
        self.logger = self._setup_logging()

        # Initialize rate limiters for each API
        self.rate_limiters: Dict[str, RateLimiter] = {}
        for api_name, api_config in self.config.items():
            if isinstance(api_config, dict) and "rate_limit" in api_config:
                self.rate_limiters[api_name] = RateLimiter(
                    max_requests=api_config["rate_limit"], time_window=60.0
                )

        # Initialize retry handler (exponential backoff with 3 attempts)
        retry_config = self.config.get("retry", {})
        self.retry_handler = RetryHandler(
            max_attempts=retry_config.get("max_attempts", 3),
            base_delay=retry_config.get("base_delay", 1.0),
            max_delay=retry_config.get("max_delay", 60.0),
        )

        # ✅ CRITICAL FIX: Thêm semaphore để giới hạn concurrent requests
        max_concurrent = self.config.get("external_apis", {}).get(
            "max_concurrent_requests", 2
        )
        self.semaphore = asyncio.Semaphore(max_concurrent)

        # ✅ CRITICAL FIX: Delays để tránh overwhelm API
        self.request_delay = self.config.get("external_apis", {}).get(
            "request_delay", 3.0
        )
        self.batch_delay = self.config.get("external_apis", {}).get("batch_delay", 10.0)

        # Statistics
        self.stats = {
            "total_entities": 0,
            "enriched_entities": 0,
            "api_calls": defaultdict(int),
            "cache_hits": defaultdict(int),
            "cache_misses": defaultdict(int),
            "errors": defaultdict(int),
        }

        # Shutdown event for graceful termination
        self.shutdown_event = asyncio.Event()
        self._setup_signal_handlers()

    def _load_config(self) -> Dict[str, Any]:
        """
        Load and validate configuration from YAML file.

        API keys are loaded from environment variables with fallback to config file.
        Environment variables take precedence for security (avoid hardcoded secrets).

        Environment Variables:
            - OPENWEATHERMAP_API_KEY: OpenWeatherMap API key
            - OPENAQ_API_KEY: OpenAQ API key

        Returns:
            Configuration dictionary

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If configuration is invalid
        """
        if not self.config_path.exists():
            raise FileNotFoundError(f"Config file not found: {self.config_path}")

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                full_config = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in config file: {e}")

        # Expand environment variables like ${API_KEY}
        full_config = expand_env_var(full_config)

        if "external_apis" not in full_config:
            raise ValueError("Missing 'external_apis' section in config")

        config = full_config["external_apis"]

        # Validate required fields
        required_fields = ["source_file", "output_file", "geo_match_radius"]
        for field in required_fields:
            if field not in config:
                raise ValueError(f"Missing required field in config: {field}")

        # Load API keys from environment variables (priority over config file)
        self._resolve_api_keys(config)

        return config

    def _resolve_api_keys(self, config: Dict[str, Any]) -> None:
        """
        Resolve API keys from environment variables.

        Priority: Environment Variable > Config File
        This ensures secrets are not hardcoded in configuration files.

        Args:
            config: Configuration dictionary to update with resolved API keys
        """
        import os

        # OpenWeatherMap API key (used for weather and air_quality)
        owm_env_key = os.getenv("OPENWEATHERMAP_API_KEY")
        if owm_env_key:
            if "openweathermap" in config:
                config["openweathermap"]["api_key"] = owm_env_key
            if "air_quality" in config:
                config["air_quality"]["api_key"] = owm_env_key
            logging.getLogger(__name__).info(
                "API keys loaded from environment variable OPENWEATHERMAP_API_KEY"
            )
        else:
            # Check if config has placeholder value
            if "openweathermap" in config:
                key = config["openweathermap"].get("api_key", "")
                if key.startswith("${") and key.endswith("}"):
                    logging.getLogger(__name__).warning(
                        "OPENWEATHERMAP_API_KEY not set in environment. "
                        "Weather/AirQuality API may not work."
                    )

        # OpenAQ API key
        openaq_env_key = os.getenv("OPENAQ_API_KEY")
        if openaq_env_key:
            if "openaq" in config:
                config["openaq"]["api_key"] = openaq_env_key
            logging.getLogger(__name__).info(
                "API key loaded from environment variable OPENAQ_API_KEY"
            )
        else:
            # Check if config has placeholder value
            if "openaq" in config:
                key = config["openaq"].get("api_key", "")
                if key.startswith("${") and key.endswith("}"):
                    logging.getLogger(__name__).debug(
                        "OPENAQ_API_KEY not set (OpenAQ is disabled by default)"
                    )

    def _setup_logging(self) -> logging.Logger:
        """
        Setup structured logging for the agent.

        Returns:
            Configured logger instance
        """
        logger = logging.getLogger(f"ExternalDataCollector")
        logger.setLevel(logging.INFO)

        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

        return logger

    def _setup_signal_handlers(self) -> None:
        """Setup graceful shutdown handlers for SIGTERM and SIGINT."""

        def signal_handler(signum, frame):
            self.logger.info(
                f"Received signal {signum}, initiating graceful shutdown..."
            )
            self.shutdown_event.set()

        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)

    def load_source_data(self) -> List[Dict[str, Any]]:
        """
        Load source data with geo-coordinates.

        Returns:
            List of entities with latitude/longitude

        Raises:
            FileNotFoundError: If source file doesn't exist
            ValueError: If source file is invalid
        """
        source_path = Path(self.config["source_file"])

        if not source_path.exists():
            raise FileNotFoundError(f"Source file not found: {source_path}")

        try:
            with open(source_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in source file: {e}")

        if not isinstance(data, list):
            raise ValueError("Source data must be a JSON array")

        # Filter entities with valid coordinates and success status
        entities_with_coords = []
        skipped_errors = 0
        for entity in data:
            # Skip entities with error status
            if entity.get("status") == "error":
                skipped_errors += 1
                continue

            if self._has_valid_coordinates(entity):
                entities_with_coords.append(entity)

        self.logger.info(
            f"Loaded {len(entities_with_coords)} entities with coordinates "
            f"(out of {len(data)} total, skipped {skipped_errors} errors)"
        )

        return entities_with_coords

    def _has_valid_coordinates(self, entity: Dict[str, Any]) -> bool:
        """
        Check if entity has valid latitude/longitude.

        Args:
            entity: Entity data

        Returns:
            True if valid coordinates exist
        """
        try:
            lat = float(entity.get("latitude", 0))
            lng = float(entity.get("longitude", 0))
            return -90 <= lat <= 90 and -180 <= lng <= 180 and (lat != 0 or lng != 0)
        except (ValueError, TypeError):
            return False

    def calculate_distance(
        self, lat1: float, lng1: float, lat2: float, lng2: float
    ) -> float:
        """
        Calculate distance between two geo-coordinates using Haversine formula.

        Args:
            lat1: Latitude of point 1
            lng1: Longitude of point 1
            lat2: Latitude of point 2
            lng2: Longitude of point 2

        Returns:
            Distance in meters
        """
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])

        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
        c = 2 * asin(sqrt(a))

        # Earth radius in meters
        r = 6371000

        return c * r

    @alru_cache(maxsize=128, ttl=600)  # Cache for 10 minutes (MANDATORY requirement)
    async def _fetch_weather_data_cached(
        self, latitude: float, longitude: float, session_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Internal cached method to fetch weather data from OpenWeatherMap API.

        Uses @alru_cache decorator for 10-minute TTL caching (MANDATORY requirement).
        session_id is used to ensure cache is tied to session lifecycle.

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            session_id: Session ID for cache binding

        Returns:
            Weather data dictionary or None if failed
        """
        api_config = self.config["openweathermap"]

        if not api_config.get("enabled", True):
            return None

        # Acquire rate limit token
        await self.rate_limiters["openweathermap"].acquire()

        url = api_config["base_url"]
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": api_config["api_key"],
            "units": "metric",
        }

        # Get session from instance variable (set in fetch_weather_data)
        session = getattr(self, "_current_session", None)
        if not session:
            return None

        async with session.get(
            url,
            params=params,
            timeout=aiohttp.ClientTimeout(total=api_config["timeout"]),
        ) as response:
            self.stats["api_calls"]["openweathermap"] += 1

            if response.status == 200:
                data = await response.json()

                # Extract relevant fields
                weather_data = {
                    "temperature": data["main"]["temp"],
                    "humidity": data["main"]["humidity"],
                    "pressure": data["main"]["pressure"],
                    "description": data["weather"][0]["description"],
                    "wind_speed": data["wind"]["speed"],
                    "clouds": data["clouds"]["all"],
                }

                return weather_data
            elif response.status == 429:
                # Rate limit exceeded - raise exception for 2-minute retry delay
                error_text = await response.text()
                self.logger.warning(
                    f"Weather API rate limit (429) for ({latitude}, {longitude}). "
                    f"Response: {error_text[:200]}"
                )
                self.stats["errors"]["openweathermap"] += 1
                raise RateLimitExceeded(
                    f"OpenWeatherMap API rate limit exceeded (429) for ({latitude}, {longitude})"
                )
            else:
                self.logger.warning(
                    f"Weather API returned status {response.status} for "
                    f"({latitude}, {longitude})"
                )
                self.stats["errors"]["openweathermap"] += 1
                return None

    async def fetch_weather_data(
        self, session: aiohttp.ClientSession, latitude: float, longitude: float
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch weather data from OpenWeatherMap API with retry logic.

        Uses @alru_cache (10-minute TTL) and retry handler with exponential backoff
        (3 attempts) - both MANDATORY requirements.

        Args:
            session: aiohttp ClientSession
            latitude: Latitude coordinate
            longitude: Longitude coordinate

        Returns:
            Weather data dictionary or None if failed after all retries
        """
        # Store session for cached method access
        self._current_session = session
        session_id = id(session)

        # Use retry handler with exponential backoff (MANDATORY: 3 attempts)
        result = await self.retry_handler.execute(
            self._fetch_weather_data_cached, latitude, longitude, session_id
        )

        if result:
            self.stats["cache_hits"]["openweathermap"] += 1
        else:
            self.stats["cache_misses"]["openweathermap"] += 1

        return result

    @alru_cache(maxsize=128, ttl=600)  # Cache for 10 minutes (MANDATORY requirement)
    async def _fetch_air_quality_data_cached(
        self, latitude: float, longitude: float, session_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Internal cached method to fetch air quality data from OpenWeatherMap Air Pollution API.

        OpenWeatherMap Air Pollution API Integration:
        - Endpoint: /data/2.5/air_pollution (single call for all pollutants)
        - Pollutants: PM2.5, PM10, NO2, O3, CO, SO2 + NH3 (all 6 required + bonus)
        - Global coverage including Vietnam
        - Free tier: 1,000 calls/day
        - Simple coordinate-based API

        Uses @alru_cache decorator for 10-minute TTL caching (MANDATORY requirement).
        session_id is used to ensure cache is tied to session lifecycle.

        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            session_id: Session ID for cache binding

        Returns:
            Air quality data dictionary with all 6 pollutants or None if failed
        """
        # Get API config - check if air_quality config exists, fallback to openweathermap
        if "air_quality" in self.config:
            api_config = self.config["air_quality"]
            api_name = "air_quality"
        else:
            api_config = self.config.get("openweathermap")
            api_name = "openweathermap"

        if not api_config or not api_config.get("enabled", True):
            return None

        # Acquire rate limit token
        if api_name in self.rate_limiters:
            await self.rate_limiters[api_name].acquire()

        # OpenWeatherMap Air Pollution API endpoint
        url = api_config["base_url"]

        # API parameters: lat, lon, appid (API key)
        params = {"lat": latitude, "lon": longitude, "appid": api_config["api_key"]}

        # No special headers needed
        headers = {}

        # Get session from instance variable
        session = getattr(self, "_current_session", None)
        if not session:
            return None

        try:
            async with session.get(
                url,
                params=params,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=api_config["timeout"]),
            ) as response:
                self.stats["api_calls"][api_name] += 1

                if response.status == 200:
                    data = await response.json()

                    # OpenWeatherMap response format: {"list": [{"components": {...}}]}
                    if data.get("list") and len(data["list"]) > 0:
                        result = data["list"][0]
                        components = result.get("components", {})

                        if not components:
                            self.logger.debug(
                                f"No air quality components for ({latitude}, {longitude})"
                            )
                            return None

                        # Extract all pollutants from components
                        # OpenWeatherMap provides: co, no, no2, o3, so2, pm2_5, pm10, nh3
                        # Unit: µg/m³ for all except CO (which is in µg/m³ but often displayed differently)
                        aq_data = {}

                        # Map OpenWeatherMap field names to our standard names
                        pollutant_mapping = {
                            "pm2_5": "pm25",
                            "pm10": "pm10",
                            "no2": "no2",
                            "o3": "o3",
                            "co": "co",
                            "so2": "so2",
                            "nh3": "nh3",  # Bonus pollutant
                        }

                        for owm_name, our_name in pollutant_mapping.items():
                            if owm_name in components:
                                value = components[owm_name]
                                aq_data[our_name] = {"value": value, "unit": "µg/m³"}

                        # Add AQI from OpenWeatherMap (1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor)
                        if "main" in result and "aqi" in result["main"]:
                            owm_aqi = result["main"]["aqi"]
                            aqi_categories = {
                                1: "Good",
                                2: "Fair",
                                3: "Moderate",
                                4: "Poor",
                                5: "Very Poor",
                            }
                            aq_data["aqi_category"] = aqi_categories.get(
                                owm_aqi, "Unknown"
                            )
                            aq_data["aqi_index"] = owm_aqi

                        # Add source info
                        aq_data["source"] = "OpenWeatherMap"

                        # Log pollutants found for debugging
                        required_pollutants = ["pm25", "pm10", "no2", "o3", "co", "so2"]
                        pollutants_found = [
                            p for p in required_pollutants if p in aq_data
                        ]
                        self.logger.debug(
                            f"OpenWeatherMap for ({latitude}, {longitude}): "
                            f"Found {len(pollutants_found)}/6 pollutants: {', '.join(pollutants_found)}"
                        )

                        return aq_data
                    else:
                        # No data available for this location
                        self.logger.debug(
                            f"No air quality data available for ({latitude}, {longitude})"
                        )
                        return None

                elif response.status == 429:
                    # Rate limit exceeded - raise exception for retry delay
                    error_text = await response.text()
                    self.logger.warning(
                        f"OpenWeatherMap rate limit (429) for ({latitude}, {longitude}). "
                        f"Response: {error_text[:200]}"
                    )
                    self.stats["errors"][api_name] += 1
                    raise RateLimitExceeded(
                        f"OpenWeatherMap API rate limit exceeded (429) for ({latitude}, {longitude})"
                    )
                else:
                    # Log error details for debugging
                    error_text = await response.text()
                    self.logger.warning(
                        f"OpenWeatherMap returned status {response.status} for "
                        f"({latitude}, {longitude}). Response: {error_text[:200]}"
                    )
                    self.stats["errors"][api_name] += 1
                    return None

        except RateLimitExceeded:
            # Re-raise rate limit exceptions to trigger retry delay
            raise
        except Exception as e:
            self.logger.error(f"Error fetching air quality data: {e}")
            self.stats["errors"][api_name] += 1
            return None

    async def fetch_air_quality_data(
        self, session: aiohttp.ClientSession, latitude: float, longitude: float
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch air quality data from OpenAQ API with retry logic.

        Uses @alru_cache (10-minute TTL) and retry handler with exponential backoff
        (3 attempts) - both MANDATORY requirements.

        Args:
            session: aiohttp ClientSession
            latitude: Latitude coordinate
            longitude: Longitude coordinate

        Returns:
            Air quality data dictionary or None if failed after all retries
        """
        # Store session for cached method access
        self._current_session = session
        session_id = id(session)

        # Use retry handler with exponential backoff (MANDATORY: 3 attempts)
        result = await self.retry_handler.execute(
            self._fetch_air_quality_data_cached, latitude, longitude, session_id
        )

        if result:
            self.stats["cache_hits"]["openaq"] += 1
        else:
            self.stats["cache_misses"]["openaq"] += 1

        return result

    def _calculate_aqi_category(self, pm25: float) -> str:
        """
        Calculate AQI category from PM2.5 value (US EPA standard).

        Args:
            pm25: PM2.5 concentration in µg/m³

        Returns:
            AQI category string
        """
        if pm25 <= 12.0:
            return "Good"
        elif pm25 <= 35.4:
            return "Moderate"
        elif pm25 <= 55.4:
            return "Unhealthy for Sensitive Groups"
        elif pm25 <= 150.4:
            return "Unhealthy"
        elif pm25 <= 250.4:
            return "Very Unhealthy"
        else:
            return "Hazardous"

    async def enrich_entity(
        self, session: aiohttp.ClientSession, entity: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enrich ORIGINAL entity with external data (weather, air quality).

        MANDATORY: Adds weather{} and air_quality{} fields to ORIGINAL camera object.
        Does NOT create a new object - modifies the original in-place.

        Args:
            session: aiohttp ClientSession
            entity: ORIGINAL entity data with coordinates

        Returns:
            The SAME entity object with added weather{} and air_quality{} fields
        """
        # ✅ CRITICAL FIX: Sử dụng semaphore để giới hạn concurrent requests
        async with self.semaphore:
            latitude = float(entity.get("latitude", 0))
            longitude = float(entity.get("longitude", 0))

            # ✅ CRITICAL FIX: Thêm delay trước mỗi request để tránh overwhelm
            await asyncio.sleep(self.request_delay)

            # Fetch weather and air quality concurrently
            weather_task = self.fetch_weather_data(session, latitude, longitude)
            aq_task = self.fetch_air_quality_data(session, latitude, longitude)

            weather_data, aq_data = await asyncio.gather(weather_task, aq_task)

            # Add enrichment timestamp to ORIGINAL entity
            entity["enrichment_timestamp"] = datetime.utcnow().isoformat() + "Z"

            # Add weather data to ORIGINAL entity (MANDATORY requirement)
            if weather_data:
                entity["weather"] = weather_data

            # Add air quality data to ORIGINAL entity (MANDATORY requirement)
            if aq_data:
                entity["air_quality"] = aq_data

            # Track if entity was successfully enriched
            if weather_data or aq_data:
                self.stats["enriched_entities"] += 1

            # Return the SAME entity object (now enriched)
            return entity

    async def process_batch(
        self, session: aiohttp.ClientSession, entities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Process a batch of entities concurrently.

        Args:
            session: aiohttp ClientSession
            entities: List of entities to process

        Returns:
            List of enriched entities
        """
        tasks = [self.enrich_entity(session, entity) for entity in entities]
        return await asyncio.gather(*tasks)

    async def collect_external_data(self) -> List[Dict[str, Any]]:
        """
        Main collection workflow: load entities, fetch external data, enrich.

        Returns:
            List of enriched entities
        """
        self.logger.info("Starting external data collection...")
        start_time = time.time()

        # Load source entities
        entities = self.load_source_data()
        self.stats["total_entities"] = len(entities)

        if not entities:
            self.logger.warning("No entities with valid coordinates found")
            return []

        # ✅ CRITICAL FIX: Lấy batch_size từ external_apis config
        batch_size = self.config.get("external_apis", {}).get("batch_size", 10)
        all_enriched = []

        # ✅ CRITICAL FIX: Giảm concurrent connections
        max_concurrent = self.config.get("external_apis", {}).get(
            "max_concurrent_requests", 2
        )
        connector = aiohttp.TCPConnector(
            limit=max_concurrent, limit_per_host=2
        )  # ✅ Giảm từ 5 → 2

        async with aiohttp.ClientSession(connector=connector) as session:
            total_batches = (len(entities) - 1) // batch_size + 1
            for i in range(0, len(entities), batch_size):
                batch = entities[i : i + batch_size]
                batch_num = i // batch_size + 1

                self.logger.info(
                    f"Processing batch {batch_num}/{total_batches} "
                    f"({len(batch)} entities)..."
                )

                enriched_batch = await self.process_batch(session, batch)
                all_enriched.extend(enriched_batch)

                # ✅ CRITICAL FIX: Thêm delay giữa các batches
                if batch_num < total_batches:
                    self.logger.info(
                        f"Waiting {self.batch_delay:.0f}s before next batch..."
                    )
                    await asyncio.sleep(self.batch_delay)

        elapsed = time.time() - start_time
        self.logger.info(
            f"Collection complete: {len(all_enriched)} entities processed in {elapsed:.2f}s"
        )

        return all_enriched

    def save_output(self, data: List[Dict[str, Any]]) -> None:
        """
        Save enriched data to output file.

        Args:
            data: List of enriched entities
        """
        output_path = Path(self.config["output_file"])
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        self.logger.info(f"Saved {len(data)} enriched entities to {output_path}")

    def log_statistics(self) -> None:
        """Log collection statistics."""
        self.logger.info("=" * 60)
        self.logger.info("COLLECTION STATISTICS")
        self.logger.info("=" * 60)
        self.logger.info(f"Total entities: {self.stats['total_entities']}")
        self.logger.info(f"Enriched entities: {self.stats['enriched_entities']}")

        self.logger.info("\nAPI Calls:")
        for api, count in self.stats["api_calls"].items():
            self.logger.info(f"  {api}: {count}")

        self.logger.info("\nCache Statistics (async-lru):")
        for api in ["openweathermap", "openaq"]:
            hits = self.stats["cache_hits"][api]
            misses = self.stats["cache_misses"][api]
            total = hits + misses
            hit_rate = (hits / total * 100) if total > 0 else 0
            self.logger.info(
                f"  {api}: {hits} hits, {misses} misses ({hit_rate:.1f}% hit rate)"
            )

        if any(self.stats["errors"].values()):
            self.logger.info("\nErrors:")
            for api, count in self.stats["errors"].items():
                if count > 0:
                    self.logger.info(f"  {api}: {count}")

        self.logger.info("=" * 60)

    async def run_once(self) -> None:
        """Run collection once and exit."""
        enriched_data = await self.collect_external_data()
        self.save_output(enriched_data)
        self.log_statistics()

    async def run_continuous(self) -> None:
        """Run collection continuously on schedule."""
        interval = self.config.get("collection_interval", 600)
        self.logger.info(f"Starting continuous collection (interval: {interval}s)")

        while not self.shutdown_event.is_set():
            try:
                await self.run_once()
            except Exception as e:
                self.logger.error(f"Error in collection cycle: {e}")

            # Wait for next cycle or shutdown
            try:
                await asyncio.wait_for(self.shutdown_event.wait(), timeout=interval)
                break  # Shutdown requested
            except asyncio.TimeoutError:
                continue  # Continue to next cycle

        self.logger.info("Continuous collection stopped")


async def main(config: Optional[Dict[str, Any]] = None):
    """
    Main entry point for the agent.

    Args:
        config: Optional configuration dict from orchestrator
    """
    agent = None
    try:
        # If called from orchestrator with config dict, use it
        if config:
            config_path = config.get("config_path", "config/data_sources.yaml")
            mode = config.get("mode", "once")
        else:
            # If called from command line, parse args
            import argparse

            parser = argparse.ArgumentParser(
                description="External Data Collector Agent"
            )
            parser.add_argument(
                "--config",
                default="config/data_sources.yaml",
                help="Path to configuration file",
            )
            parser.add_argument(
                "--mode",
                choices=["once", "continuous"],
                default="once",
                help="Run mode: once or continuous",
            )
            args = parser.parse_args()
            config_path = args.config
            mode = args.mode

        agent = ExternalDataCollectorAgent(config_path=config_path)

        if mode == "once":
            await agent.run_once()
        else:
            await agent.run_continuous()

    except KeyboardInterrupt:
        print("\nShutdown requested...")
    except Exception as e:
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        # Proper cleanup to avoid asyncio warnings
        if agent:
            # Give time for pending tasks to complete
            await asyncio.sleep(0.1)


if __name__ == "__main__":
    # Use ProactorEventLoop policy on Windows to avoid warnings
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    asyncio.run(main())
