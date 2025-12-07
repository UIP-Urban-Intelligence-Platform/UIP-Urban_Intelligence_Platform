#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Image Refresh Agent - Data Collection with URL Timestamp Updates.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.data_collection.image_refresh_agent
Author: Nguyen Viet Hoang
Created: 2025-11-21
Version: 2.0.0
License: MIT

Description:
    Refreshes time-sensitive URLs (camera images, sensor data) by updating
    timestamps and verifying accessibility before data collection.

Workflow:
    1. Load endpoints from YAML configuration
    2. Parse URLs to extract timestamp parameters
    3. Generate fresh timestamps
    4. Rebuild URLs with updated timestamps
    5. Verify URL accessibility via HTTP HEAD requests
    6. Output updated data in JSON format

Core Features:
    - Async URL verification with aiohttp
    - Configurable timestamp formats and parameters
    - HTTP HEAD pre-verification (avoid downloading)
    - Retry logic for failed requests
    - Graceful shutdown handling

Dependencies:
    - aiohttp>=3.8: Async HTTP client
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/data_sources.yaml:
        - endpoints: URL patterns with timestamp placeholders
        - timestamp_format: strftime format string
        - retry_config: Retry attempts and delays

Example:
    ```python
    from src.agents.data_collection.image_refresh_agent import ImageRefreshAgent

    agent = ImageRefreshAgent()
    updated_urls = await agent.refresh_urls()
    ```

Architecture:
    Config → URL Parser → Timestamp Generator → HTTP Verifier → JSON Output
"""

import asyncio
import json
import logging
import signal
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

# Fix Windows asyncio event loop issue (must be before aiohttp import)
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import aiohttp
import yaml


class ImageRefreshAgent:
    """
    Domain-agnostic agent for refreshing time-sensitive URLs.

    Supports any domain (healthcare, geography, commerce, etc.) through
    YAML configuration without code changes.
    """

    def __init__(
        self, config_path: str = "config/data_sources.yaml", domain: str = "cameras"
    ):
        """
        Initialize the Image Refresh Agent.

        Args:
            config_path: Path to YAML configuration file
            domain: Domain section to use from config (e.g., 'cameras', 'medical_devices')

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If domain not found in config or config is invalid
        """
        self.config_path = Path(config_path)
        self.domain = domain
        self.config = self._load_config()
        self.logger = self._setup_logging()
        self.shutdown_event = asyncio.Event()
        self._setup_signal_handlers()

        # Track statistics
        self.stats = {
            "total_processed": 0,
            "successful_updates": 0,
            "failed_updates": 0,
            "start_time": None,
            "end_time": None,
        }

    def _load_config(self) -> Dict[str, Any]:
        """
        Load and validate configuration from YAML file.

        Returns:
            Dictionary containing domain-specific configuration

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If domain not found or config is invalid
        """
        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")

        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                config_data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML configuration: {e}")

        if not config_data:
            raise ValueError("Configuration file is empty")

        if self.domain not in config_data:
            available_domains = list(config_data.keys())
            raise ValueError(
                f"Domain '{self.domain}' not found in configuration. "
                f"Available domains: {available_domains}"
            )

        domain_config = config_data[self.domain]

        # Validate required fields
        required_fields = ["source_file", "output_file", "url_template", "params"]
        missing_fields = [
            field for field in required_fields if field not in domain_config
        ]
        if missing_fields:
            raise ValueError(f"Missing required configuration fields: {missing_fields}")

        # Set defaults for optional fields
        domain_config.setdefault("refresh_interval", 30)
        domain_config.setdefault("batch_size", 50)
        domain_config.setdefault("request_timeout", 10)
        domain_config.setdefault("max_retries", 3)
        domain_config.setdefault("retry_backoff_base", 2)

        return domain_config

    def _setup_logging(self) -> logging.Logger:
        """
        Configure logging with appropriate format and level.

        Returns:
            Configured logger instance
        """
        logger = logging.getLogger(f"ImageRefreshAgent.{self.domain}")
        logger.setLevel(logging.INFO)

        # Avoid duplicate handlers
        if not logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setLevel(logging.INFO)
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

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
        Load source data from configured JSON file.

        Returns:
            List of data items (e.g., camera endpoints)

        Raises:
            FileNotFoundError: If source file doesn't exist
            ValueError: If source file contains invalid JSON
        """
        source_path = Path(self.config["source_file"])

        if not source_path.exists():
            raise FileNotFoundError(f"Source data file not found: {source_path}")

        try:
            with open(source_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in source file: {e}")

        if not isinstance(data, list):
            raise ValueError("Source data must be a JSON array")

        self.logger.info(f"Loaded {len(data)} items from {source_path}")
        return data

    def parse_url(self, url: str) -> Tuple[str, Dict[str, str]]:
        """
        Parse URL and extract parameters.

        Args:
            url: Full URL string to parse

        Returns:
            Tuple of (base_url, parameters_dict)

        Raises:
            ValueError: If URL is malformed
        """
        if not url or not isinstance(url, str):
            raise ValueError("URL must be a non-empty string")

        try:
            parsed = urlparse(url)

            # Reconstruct base URL without query parameters
            base_url = urlunparse(
                (
                    parsed.scheme,
                    parsed.netloc,
                    parsed.path,
                    "",  # params
                    "",  # query
                    "",  # fragment
                )
            )

            # Parse query parameters
            query_params = parse_qs(parsed.query, keep_blank_values=True)

            # Flatten lists to single values (taking first value if multiple)
            params_dict = {
                key: values[0] if values else "" for key, values in query_params.items()
            }

            return base_url, params_dict

        except Exception as e:
            raise ValueError(f"Failed to parse URL '{url}': {e}")

    def generate_timestamp(self) -> str:
        """
        Generate fresh timestamp in milliseconds.

        Returns:
            Timestamp as string (milliseconds since epoch)
        """
        return str(int(time.time() * 1000))

    def rebuild_url(
        self, base_url: str, params: Dict[str, str], timestamp_param: str = "t"
    ) -> str:
        """
        Rebuild URL with updated timestamp parameter.

        Args:
            base_url: Base URL without query parameters
            params: Dictionary of query parameters
            timestamp_param: Name of timestamp parameter to update

        Returns:
            Rebuilt URL with fresh timestamp
        """
        # Update timestamp parameter
        updated_params = params.copy()
        updated_params[timestamp_param] = self.generate_timestamp()

        # Encode parameters
        query_string = urlencode(updated_params, safe="")

        # Rebuild full URL
        if query_string:
            return f"{base_url}?{query_string}"
        return base_url

    def extract_url_field(
        self, item: Dict[str, Any], field_patterns: List[str] = None
    ) -> Optional[str]:
        """
        Extract URL field from data item using configurable patterns.

        Args:
            item: Data item dictionary
            field_patterns: List of field names to search for URL
                          (default: common patterns like 'image_url_x4', 'url', 'endpoint')

        Returns:
            URL string if found, None otherwise
        """
        if field_patterns is None:
            field_patterns = [
                "image_url_x4",
                "image_url",
                "url",
                "endpoint",
                "link",
                "href",
                "src",
                "data_url",
            ]

        for pattern in field_patterns:
            if pattern in item and item[pattern]:
                return item[pattern]

        return None

    async def verify_url_accessible(
        self, session: aiohttp.ClientSession, url: str
    ) -> bool:
        """
        Verify URL is accessible using HTTP HEAD request with retry logic.

        Args:
            session: aiohttp ClientSession for making requests
            url: URL to verify

        Returns:
            True if URL is accessible (status 200-399), False otherwise
        """
        max_retries = self.config["max_retries"]
        backoff_base = self.config["retry_backoff_base"]
        timeout = self.config["request_timeout"]

        # Add proper headers to avoid being blocked
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }

        for attempt in range(max_retries):
            try:
                # Use GET instead of HEAD as some servers don't support HEAD properly
                async with session.get(
                    url,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=timeout),
                    allow_redirects=True,
                ) as response:
                    if 200 <= response.status < 400:
                        return True
                    else:
                        self.logger.warning(
                            f"URL returned status {response.status}: {url}"
                        )
                        return False

            except asyncio.TimeoutError:
                wait_time = backoff_base**attempt
                if attempt < max_retries - 1:
                    self.logger.debug(
                        f"Timeout on attempt {attempt + 1}/{max_retries}, retrying in {wait_time}s: {url}"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.warning(f"Timeout after {max_retries} attempts: {url}")

            except aiohttp.ClientError as e:
                wait_time = backoff_base**attempt
                if attempt < max_retries - 1:
                    self.logger.debug(
                        f"Client error on attempt {attempt + 1}/{max_retries}, retrying in {wait_time}s: {e}"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    self.logger.warning(
                        f"Client error after {max_retries} attempts: {url} - {e}"
                    )

            except Exception as e:
                self.logger.error(f"Unexpected error verifying URL: {url} - {e}")
                return False

        # Return False after all retries exhausted
        return False

    async def process_item(
        self, session: aiohttp.ClientSession, item: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Process a single data item: parse URL, update timestamp, verify accessibility.

        Args:
            session: aiohttp ClientSession for making requests
            item: Data item to process

        Returns:
            Updated item with refreshed URL, or None if processing failed
        """
        try:
            # Skip items with error status (e.g., "Marker not found at coordinates")
            if item.get("status") == "error":
                self.logger.debug(
                    f"Skipping item {item.get('id', 'unknown')} with error status: {item.get('error', 'Unknown error')}"
                )
                return item  # Return original item unchanged

            # Extract URL from item
            url = self.extract_url_field(item)
            if not url:
                self.logger.warning(
                    f"No URL field found in item: {item.get('id', 'unknown')}"
                )
                return None

            # Parse URL
            base_url, params = self.parse_url(url)

            # Rebuild URL with fresh timestamp
            new_url = self.rebuild_url(base_url, params)

            # Verify accessibility (with improved error handling)
            is_accessible = await self.verify_url_accessible(session, new_url)

            # Always update item with new URL, even if verification failed
            # This allows the system to continue working even when URLs are temporarily unreachable
            updated_item = item.copy()

            # Update the URL field (preserve original field name)
            for field in ["image_url_x4", "image_url", "url", "endpoint"]:
                if field in updated_item:
                    updated_item[field] = new_url
                    break

            # Add metadata
            updated_item["last_refreshed"] = datetime.utcnow().isoformat() + "Z"

            if is_accessible:
                updated_item["refresh_status"] = "success"
                updated_item["verification_status"] = "accessible"
                self.stats["successful_updates"] += 1
            else:
                updated_item["refresh_status"] = "success_unverified"
                updated_item["verification_status"] = "timeout_or_unreachable"
                self.stats[
                    "successful_updates"
                ] += 1  # URL was refreshed, just not verified
                self.logger.info(
                    f"URL refreshed but not verified: {item.get('id', 'unknown')}"
                )

            return updated_item

        except Exception as e:
            self.logger.error(f"Error processing item {item.get('id', 'unknown')}: {e}")
            self.stats["failed_updates"] += 1
            return None

    async def process_batch(
        self, session: aiohttp.ClientSession, batch: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Process a batch of items concurrently.

        Args:
            session: aiohttp ClientSession for making requests
            batch: List of items to process

        Returns:
            List of successfully processed items
        """
        tasks = [self.process_item(session, item) for item in batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out None values and exceptions
        processed_items = []
        for result in results:
            if isinstance(result, Exception):
                self.logger.error(f"Batch processing exception: {result}")
            elif result is not None:
                processed_items.append(result)

        return processed_items

    async def refresh_all(self) -> List[Dict[str, Any]]:
        """
        Refresh all items from source data with batch processing.

        Returns:
            List of successfully refreshed items
        """
        self.stats["start_time"] = datetime.utcnow()

        # Load source data
        source_data = self.load_source_data()
        self.stats["total_processed"] = len(source_data)

        batch_size = self.config["batch_size"]
        all_refreshed = []

        # Create aiohttp session with connection pooling
        connector = aiohttp.TCPConnector(limit=100, limit_per_host=10)
        timeout = aiohttp.ClientTimeout(total=self.config["request_timeout"])

        async with aiohttp.ClientSession(
            connector=connector, timeout=timeout
        ) as session:
            # Process in batches
            for i in range(0, len(source_data), batch_size):
                if self.shutdown_event.is_set():
                    self.logger.info("Shutdown requested, stopping processing...")
                    break

                batch = source_data[i : i + batch_size]
                batch_num = (i // batch_size) + 1
                total_batches = (len(source_data) + batch_size - 1) // batch_size

                self.logger.info(
                    f"Processing batch {batch_num}/{total_batches} "
                    f"({len(batch)} items)..."
                )

                refreshed_batch = await self.process_batch(session, batch)
                all_refreshed.extend(refreshed_batch)

                self.logger.info(
                    f"Batch {batch_num} complete: {len(refreshed_batch)}/{len(batch)} successful"
                )

        self.stats["end_time"] = datetime.utcnow()
        return all_refreshed

    def save_output(self, data: List[Dict[str, Any]]) -> None:
        """
        Save refreshed data to output JSON file.

        Args:
            data: List of refreshed items to save

        Raises:
            IOError: If unable to write output file
        """
        output_path = Path(self.config["output_file"])

        # Create parent directories if they don't exist
        output_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            self.logger.info(f"Saved {len(data)} items to {output_path}")

        except IOError as e:
            raise IOError(f"Failed to write output file {output_path}: {e}")

    def log_statistics(self) -> None:
        """Log processing statistics."""
        if self.stats["start_time"] and self.stats["end_time"]:
            duration = (
                self.stats["end_time"] - self.stats["start_time"]
            ).total_seconds()
        else:
            duration = 0

        self.logger.info("=" * 60)
        self.logger.info("PROCESSING STATISTICS")
        self.logger.info("=" * 60)
        self.logger.info(f"Domain: {self.domain}")
        self.logger.info(f"Total items processed: {self.stats['total_processed']}")
        self.logger.info(f"Successful updates: {self.stats['successful_updates']}")
        self.logger.info(f"Failed updates: {self.stats['failed_updates']}")
        self.logger.info(f"Processing time: {duration:.2f} seconds")
        if self.stats["total_processed"] > 0:
            success_rate = (
                self.stats["successful_updates"] / self.stats["total_processed"]
            ) * 100
            self.logger.info(f"Success rate: {success_rate:.2f}%")
        self.logger.info("=" * 60)

    async def run_once(self) -> None:
        """Execute one refresh cycle."""
        self.logger.info(f"Starting refresh cycle for domain: {self.domain}")

        try:
            refreshed_data = await self.refresh_all()
            self.save_output(refreshed_data)
            self.log_statistics()

        except Exception as e:
            self.logger.error(f"Error during refresh cycle: {e}", exc_info=True)
            raise

    async def run_continuous(self) -> None:
        """Run continuous refresh cycles at configured interval."""
        interval = self.config["refresh_interval"]
        self.logger.info(
            f"Starting continuous refresh for domain: {self.domain} "
            f"(interval: {interval}s)"
        )

        while not self.shutdown_event.is_set():
            try:
                await self.run_once()

                # Wait for next cycle or shutdown
                self.logger.info(f"Waiting {interval} seconds until next refresh...")
                try:
                    await asyncio.wait_for(self.shutdown_event.wait(), timeout=interval)
                except asyncio.TimeoutError:
                    pass  # Normal timeout, continue to next cycle

            except Exception as e:
                self.logger.error(f"Error in continuous run: {e}", exc_info=True)
                # Wait before retrying
                await asyncio.sleep(min(interval, 60))

        self.logger.info("Continuous refresh stopped")


async def main(config: Dict = None):
    """Main entry point for the Image Refresh Agent."""
    import argparse

    # If called from orchestrator with config dict
    if config:
        try:
            # Note: input_file from config is currently unused but kept for future use
            output_file = config.get("output_file", "data/cameras_updated.json")
            config_path = config.get("config_path", "config/data_sources.yaml")
            domain = config.get("domain", "cameras")

            agent = ImageRefreshAgent(config_path=config_path, domain=domain)
            await agent.run_once()

            return {"status": "success", "output_file": output_file}
        except Exception as e:
            logging.error(f"Agent execution failed: {e}", exc_info=True)
            return {"status": "failed", "error": str(e)}

    # If called from command line
    parser = argparse.ArgumentParser(description="Domain-agnostic Image Refresh Agent")
    parser.add_argument(
        "--config",
        default="config/data_sources.yaml",
        help="Path to configuration file (default: config/data_sources.yaml)",
    )
    parser.add_argument(
        "--domain",
        default="cameras",
        help="Domain to process from config (default: cameras)",
    )
    parser.add_argument(
        "--mode",
        choices=["once", "continuous"],
        default="once",
        help="Run mode: 'once' for single cycle, 'continuous' for repeated cycles",
    )

    args = parser.parse_args()

    try:
        agent = ImageRefreshAgent(config_path=args.config, domain=args.domain)

        if args.mode == "once":
            await agent.run_once()
        else:
            await agent.run_continuous()

    except KeyboardInterrupt:
        logging.info("Interrupted by user")
    except Exception as e:
        logging.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)

    return None  # Explicit return for consistency


if __name__ == "__main__":
    import platform
    # Fix Windows asyncio event loop issue with aiohttp
    if platform.system() == 'Windows':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
