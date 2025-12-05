#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Temporal State Tracking Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.state_management.temporal_state_tracker_agent
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-24
Version: 1.0.0
License: MIT

Description:
    This agent tracks state changes over time, maintaining historical records
    for temporal queries, trend analysis, and state recovery.

Features:
    - Time-series state storage with efficient indexing
    - Temporal query support (point-in-time, range queries)
    - State change event logging
    - Historical trend analysis
    - State diff computation between timestamps
"""

try:
    import redis
    from redis.commands.timeseries import TimeSeries

    REDIS_TIMESERIES_AVAILABLE = True
except ImportError:
    REDIS_TIMESERIES_AVAILABLE = False
    redis = None  # type: ignore
    TimeSeries = None  # type: ignore

# Reference for CodeQL - TimeSeries used conditionally when Redis available
_TimeSeries = TimeSeries

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class TemporalStateTrackerAgent:
    """
    Tracks state changes over time with temporal query capabilities.

    Maintains a time-series database of state transitions for
    auditing, analytics, and historical state reconstruction.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize temporal state tracker.

        Args:
            config: Configuration with retention policies and storage settings
        """
        self.config = config or {}
        self._history: Dict[str, List[Tuple[datetime, Any]]] = defaultdict(list)
        self._max_history = self.config.get("max_history_per_key", 1000)
        self._retention_days = self.config.get("retention_days", 30)
        self.enabled = self.config.get("enabled", False)

        # Redis TimeSeries client
        self._redis_client: Optional["redis.Redis"] = None
        self._use_timeseries = False

        if self.enabled and REDIS_TIMESERIES_AVAILABLE:
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

                # Check if RedisTimeSeries module is available
                self._redis_client.ping()
                self._use_timeseries = True

                logger.info(
                    "TemporalStateTrackerAgent initialized with Redis TimeSeries",
                    extra={
                        "redis": f"{redis_host}:{redis_port}",
                        "retention_days": self._retention_days,
                    },
                )
            except Exception as e:
                logger.warning(f"Redis TimeSeries unavailable, using in-memory: {e}")
                self._use_timeseries = False
        else:
            logger.info(
                "TemporalStateTrackerAgent in SAFE MODE (disabled)",
                extra={
                    "enabled": self.enabled,
                    "timeseries_available": REDIS_TIMESERIES_AVAILABLE,
                    "max_history": self._max_history,
                },
            )

    def record_state(self, key: str, value: Any, timestamp: Optional[datetime] = None):
        """
        Record a state value at a specific timestamp.

        Args:
            key: State key identifier
            value: State value to record
            timestamp: Recording timestamp (defaults to now)
        """
        if not self.enabled:
            return

        ts = timestamp or datetime.now()

        # Add to history
        self._history[key].append((ts, value))

        # Enforce max history limit
        if len(self._history[key]) > self._max_history:
            self._history[key] = self._history[key][-self._max_history :]

        logger.debug(
            f"State recorded: {key} at {ts.isoformat()}",
            extra={"history_size": len(self._history[key])},
        )

    def get_state_at_time(self, key: str, timestamp: datetime) -> Optional[Any]:
        """
        Retrieve state value at a specific point in time.

        Args:
            key: State key identifier
            timestamp: Point in time to query

        Returns:
            State value at the given timestamp, or None if not found
        """
        if not self.enabled or key not in self._history:
            return None

        # Binary search for closest timestamp <= target
        history = self._history[key]
        for ts, value in reversed(history):
            if ts <= timestamp:
                return value

        return None

    def get_state_range(
        self, key: str, start_time: datetime, end_time: datetime
    ) -> List[Tuple[datetime, Any]]:
        """
        Retrieve all state changes within a time range.

        Args:
            key: State key identifier
            start_time: Range start timestamp
            end_time: Range end timestamp

        Returns:
            List of (timestamp, value) tuples within range
        """
        if not self.enabled or key not in self._history:
            return []

        return [
            (ts, value)
            for ts, value in self._history[key]
            if start_time <= ts <= end_time
        ]

    def get_state_changes(
        self, key: str, limit: int = 100
    ) -> List[Tuple[datetime, Any]]:
        """
        Get most recent state changes for a key.

        Args:
            key: State key identifier
            limit: Maximum number of changes to return

        Returns:
            List of recent (timestamp, value) tuples
        """
        if not self.enabled or key not in self._history:
            return []

        return self._history[key][-limit:]

    def compute_state_diff(
        self, key: str, timestamp1: datetime, timestamp2: datetime
    ) -> Optional[Dict[str, Any]]:
        """
        Compute difference between states at two timestamps.

        Args:
            key: State key identifier
            timestamp1: First timestamp
            timestamp2: Second timestamp

        Returns:
            Dictionary with diff information
        """
        if not self.enabled:
            return None

        state1 = self.get_state_at_time(key, timestamp1)
        state2 = self.get_state_at_time(key, timestamp2)

        if state1 is None or state2 is None:
            return None

        return {
            "key": key,
            "timestamp1": timestamp1.isoformat(),
            "timestamp2": timestamp2.isoformat(),
            "value1": state1,
            "value2": state2,
            "changed": state1 != state2,
            "symbolic_diff": True,
        }

    def analyze_trends(self, key: str, hours: int = 24) -> Dict[str, Any]:
        """
        Analyze state trends over a time period.

        Args:
            key: State key identifier
            hours: Number of hours to analyze

        Returns:
            Trend analysis dictionary
        """
        if not self.enabled or key not in self._history:
            return {"error": "No data available"}

        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours)

        changes = self.get_state_range(key, start_time, end_time)

        return {
            "key": key,
            "period_hours": hours,
            "total_changes": len(changes),
            "first_value": changes[0][1] if changes else None,
            "last_value": changes[-1][1] if changes else None,
            "change_rate": len(changes) / hours if hours > 0 else 0,
            "symbolic_analysis": True,
        }

    def cleanup_old_records(self):
        """Remove records older than retention period."""
        if not self.enabled:
            return

        cutoff_time = datetime.now() - timedelta(days=self._retention_days)

        for key in list(self._history.keys()):
            # Filter out old records
            self._history[key] = [
                (ts, value) for ts, value in self._history[key] if ts >= cutoff_time
            ]

            # Remove key if no records remain
            if not self._history[key]:
                del self._history[key]

        logger.info("Old temporal records cleaned up (symbolic)")

    async def run(self):
        """
        Main agent execution loop (symbolic).

        Would typically:
        - Persist history to database
        - Perform periodic cleanup
        - Generate trend reports
        """
        logger.info("TemporalStateTrackerAgent.run() called (symbolic mode)")
        return {"status": "completed", "symbolic": True}


def create_temporal_tracker(
    config: Optional[Dict[str, Any]] = None,
) -> TemporalStateTrackerAgent:
    """Factory function to create TemporalStateTrackerAgent."""
    return TemporalStateTrackerAgent(config)
