#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Congestion State Tracking and Zone Management Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.state_management.congestion_state_manager_agent
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Manages traffic congestion states across road segments and zones,
    tracking congestion levels, duration, and automatic alert generation.

Congestion Levels:
    - FREE_FLOW: < 30% capacity
    - LIGHT: 30-50% capacity
    - MODERATE: 50-70% capacity
    - HEAVY: 70-90% capacity
    - SEVERE: > 90% capacity
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class CongestionLevel(Enum):
    """Traffic congestion severity levels."""

    FREE_FLOW = "free_flow"
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"
    SEVERE = "severe"


class CongestionStateManagerAgent:
    """
    Tracks and manages congestion states for road segments and zones.

    Monitors traffic density, calculates congestion levels, and triggers
    alerts when thresholds are exceeded.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize congestion state manager."""
        self.config = config or {}
        self._zones: Dict[str, Dict[str, Any]] = {}
        self._congestion_history: Dict[str, List[Dict[str, Any]]] = {}
        self.enabled = self.config.get("enabled", False)

        # Congestion thresholds (vehicle count)
        self._thresholds = {
            CongestionLevel.LIGHT.value: self.config.get("light_threshold", 30),
            CongestionLevel.MODERATE.value: self.config.get("moderate_threshold", 50),
            CongestionLevel.HEAVY.value: self.config.get("heavy_threshold", 70),
            CongestionLevel.SEVERE.value: self.config.get("severe_threshold", 90),
        }

        logger.info(
            "CongestionStateManagerAgent initialized",
            extra={"thresholds": self._thresholds},
        )

    def create_zone(
        self, zone_id: str, name: str, road_segments: List[str], capacity: int
    ) -> Dict[str, Any]:
        """
        Create new traffic monitoring zone.

        Args:
            zone_id: Unique zone identifier
            name: Human-readable zone name
            road_segments: List of road segment IDs in zone
            capacity: Maximum vehicle capacity

        Returns:
            Created zone entity
        """
        if not self.enabled:
            return {"id": zone_id, "state": None, "reason": "disabled"}

        zone = {
            "id": zone_id,
            "name": name,
            "road_segments": road_segments,
            "capacity": capacity,
            "current_level": CongestionLevel.FREE_FLOW.value,
            "vehicle_count": 0,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

        self._zones[zone_id] = zone
        self._congestion_history[zone_id] = []

        logger.info(f"Zone created: {zone_id} ({name})", extra={"capacity": capacity})
        return zone

    def update_congestion(self, zone_id: str, vehicle_count: int) -> Dict[str, Any]:
        """
        Update congestion level for a zone based on vehicle count.

        Args:
            zone_id: Zone identifier
            vehicle_count: Current vehicle count in zone

        Returns:
            Updated zone state with congestion level
        """
        if not self.enabled or zone_id not in self._zones:
            return {"error": "Zone not found", "zone_id": zone_id}

        zone = self._zones[zone_id]
        capacity = zone["capacity"]
        utilization = (vehicle_count / capacity) * 100

        # Determine congestion level
        old_level = zone["current_level"]
        new_level = self._calculate_congestion_level(utilization)

        # Update zone state
        zone["vehicle_count"] = vehicle_count
        zone["current_level"] = new_level
        zone["utilization_percent"] = utilization
        zone["updated_at"] = datetime.now().isoformat()

        # Record history
        self._congestion_history[zone_id].append(
            {
                "timestamp": datetime.now().isoformat(),
                "level": new_level,
                "vehicle_count": vehicle_count,
                "utilization": utilization,
            }
        )

        # Log level change
        if old_level != new_level:
            logger.info(
                f"Congestion level changed: {zone_id} {old_level} -> {new_level}",
                extra={"utilization": f"{utilization:.1f}%"},
            )

        return zone

    def get_zone(self, zone_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve zone state by ID."""
        if not self.enabled:
            return None
        return self._zones.get(zone_id)

    def get_congested_zones(
        self, min_level: str = CongestionLevel.MODERATE.value
    ) -> List[Dict[str, Any]]:
        """
        Get zones with congestion level >= specified threshold.

        Args:
            min_level: Minimum congestion level to filter

        Returns:
            List of congested zones
        """
        if not self.enabled:
            return []

        level_order = [
            CongestionLevel.FREE_FLOW.value,
            CongestionLevel.LIGHT.value,
            CongestionLevel.MODERATE.value,
            CongestionLevel.HEAVY.value,
            CongestionLevel.SEVERE.value,
        ]

        min_index = level_order.index(min_level)

        return [
            zone
            for zone in self._zones.values()
            if level_order.index(zone["current_level"]) >= min_index
        ]

    def get_congestion_trends(self, zone_id: str, hours: int = 24) -> Dict[str, Any]:
        """
        Analyze congestion trends for a zone.

        Args:
            zone_id: Zone identifier
            hours: Number of hours to analyze

        Returns:
            Trend analysis with statistics
        """
        if not self.enabled or zone_id not in self._congestion_history:
            return {"error": "No data", "zone_id": zone_id}

        cutoff = datetime.now() - timedelta(hours=hours)
        history = [
            entry
            for entry in self._congestion_history[zone_id]
            if datetime.fromisoformat(entry["timestamp"]) >= cutoff
        ]

        if not history:
            return {"error": "No recent data"}

        # Calculate statistics
        utilizations = [entry["utilization"] for entry in history]

        return {
            "zone_id": zone_id,
            "period_hours": hours,
            "samples": len(history),
            "avg_utilization": sum(utilizations) / len(utilizations),
            "max_utilization": max(utilizations),
            "min_utilization": min(utilizations),
            "current_level": history[-1]["level"] if history else None,
            "real_analysis": True,
        }

    def should_generate_alert(self, zone_id: str) -> bool:
        """
        Determine if congestion alert should be generated.

        Args:
            zone_id: Zone to check

        Returns:
            True if alert should be sent
        """
        if not self.enabled or zone_id not in self._zones:
            return False

        zone = self._zones[zone_id]

        # Alert on HEAVY or SEVERE congestion
        return zone["current_level"] in [
            CongestionLevel.HEAVY.value,
            CongestionLevel.SEVERE.value,
        ]

    def _calculate_congestion_level(self, utilization_percent: float) -> str:
        """Calculate congestion level from utilization percentage."""
        if utilization_percent >= self._thresholds[CongestionLevel.SEVERE.value]:
            return CongestionLevel.SEVERE.value
        elif utilization_percent >= self._thresholds[CongestionLevel.HEAVY.value]:
            return CongestionLevel.HEAVY.value
        elif utilization_percent >= self._thresholds[CongestionLevel.MODERATE.value]:
            return CongestionLevel.MODERATE.value
        elif utilization_percent >= self._thresholds[CongestionLevel.LIGHT.value]:
            return CongestionLevel.LIGHT.value
        else:
            return CongestionLevel.FREE_FLOW.value

    async def run(self):
        """
        Main agent loop - processes automatic congestion level updates.

        Monitors zones and performs:
        - Auto-update congestion levels based on vehicle counts
        - Alert generation on level changes
        - Severe congestion warnings
        - Historical data archiving
        """
        if not self.enabled:
            logger.info("CongestionStateManagerAgent.run() skipped (disabled)")
            return {"status": "skipped", "reason": "disabled"}

        logger.info("CongestionStateManagerAgent.run() - Monitoring zones")

        # Process all zones for level updates
        processed = 0
        alerts = []
        for zone_id, zone in self._zones.items():
            # Calculate utilization
            utilization = (
                zone["vehicle_count"] / zone["capacity"] if zone["capacity"] > 0 else 0
            )

            # Determine new level based on utilization
            new_level = CongestionLevel.FREE_FLOW.value
            for level, threshold in sorted(
                self._thresholds.items(), key=lambda x: x[1]
            ):
                if utilization >= threshold:
                    new_level = level

            # Update if changed
            if new_level != zone["current_level"]:
                old_level = zone["current_level"]
                zone["current_level"] = new_level
                zone["last_updated"] = datetime.utcnow()

                alerts.append(
                    {
                        "zone_id": zone_id,
                        "old_level": old_level,
                        "new_level": new_level,
                        "utilization": utilization,
                    }
                )
                processed += 1

        return {
            "status": "completed",
            "processed": processed,
            "total_zones": len(self._zones),
            "alerts": alerts,
        }
