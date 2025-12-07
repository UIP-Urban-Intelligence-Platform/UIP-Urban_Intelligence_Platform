#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Accident State Lifecycle Management Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.state_management.accident_state_manager_agent
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-24
Version: 1.0.0
License: MIT

Description:
    Manages the complete lifecycle of traffic accident entities from detection
    through resolution, including state transitions, severity tracking, and
    automatic escalation.

State Lifecycle:
    1. DETECTED -> Initial detection from CV analysis
    2. CONFIRMED -> Validated by multiple sources
    3. ACTIVE -> Confirmed accident with ongoing impact
    4. RESOLVING -> Emergency services on scene
    5. RESOLVED -> Accident cleared
    6. ARCHIVED -> Historical record
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class AccidentState(Enum):
    """Accident lifecycle states."""

    DETECTED = "detected"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    RESOLVING = "resolving"
    RESOLVED = "resolved"
    ARCHIVED = "archived"


class AccidentSeverity(Enum):
    """Accident severity levels."""

    MINOR = "minor"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


class AccidentStateManagerAgent:
    """
    Manages accident entity lifecycle and state transitions.

    Tracks accidents from initial detection through resolution,
    with automatic state transitions based on conditions and time.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize accident state manager.

        Args:
            config: Configuration with state transition rules
        """
        self.config = config or {}
        self._accidents: Dict[str, Dict[str, Any]] = {}
        self._state_history: Dict[str, List[Dict[str, Any]]] = {}
        self.enabled = self.config.get("enabled", False)

        # State transition timeouts (in seconds)
        self._timeouts = {
            "confirmation": self.config.get("confirmation_timeout", 300),  # 5 min
            "auto_resolve": self.config.get("auto_resolve_timeout", 3600),  # 1 hour
            "archive": self.config.get("archive_timeout", 86400),  # 24 hours
        }

        logger.info(
            "AccidentStateManagerAgent initialized", extra={"timeouts": self._timeouts}
        )

    def create_accident(
        self,
        accident_id: str,
        location: Dict[str, float],
        severity: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create new accident entity in DETECTED state.

        Args:
            accident_id: Unique accident identifier
            location: Geographic coordinates {"lat": float, "lon": float}
            severity: Severity level (minor/moderate/severe/critical)
            metadata: Additional accident metadata

        Returns:
            Created accident entity
        """
        if not self.enabled:
            logger.debug(f"Accident creation skipped (disabled): {accident_id}")
            return {"id": accident_id, "state": None, "reason": "disabled"}

        accident = {
            "id": accident_id,
            "state": AccidentState.DETECTED.value,
            "severity": severity,
            "location": location,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "metadata": metadata or {},
            "state_transitions": [],
        }

        self._accidents[accident_id] = accident
        self._record_state_transition(accident_id, None, AccidentState.DETECTED.value)

        logger.info(
            f"Accident created: {accident_id}",
            extra={"severity": severity, "location": location},
        )

        return accident

    def update_accident_state(
        self, accident_id: str, new_state: str, reason: Optional[str] = None
    ) -> bool:
        """
        Transition accident to new state.

        Args:
            accident_id: Accident identifier
            new_state: Target state
            reason: Reason for state transition

        Returns:
            True if transition successful
        """
        if not self.enabled or accident_id not in self._accidents:
            return False

        accident = self._accidents[accident_id]
        old_state = accident["state"]

        # Validate state transition
        if not self._is_valid_transition(old_state, new_state):
            logger.warning(
                f"Invalid state transition: {old_state} -> {new_state}",
                extra={"accident_id": accident_id},
            )
            return False

        # Update state
        accident["state"] = new_state
        accident["updated_at"] = datetime.now().isoformat()

        self._record_state_transition(accident_id, old_state, new_state, reason)

        logger.info(
            f"Accident state updated: {accident_id} {old_state} -> {new_state}",
            extra={"reason": reason},
        )

        return True

    def get_accident(self, accident_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve accident entity by ID."""
        if not self.enabled:
            return None
        return self._accidents.get(accident_id)

    def get_active_accidents(self) -> List[Dict[str, Any]]:
        """Get all accidents in ACTIVE or CONFIRMED state."""
        if not self.enabled:
            return []

        return [
            accident
            for accident in self._accidents.values()
            if accident["state"]
            in [
                AccidentState.CONFIRMED.value,
                AccidentState.ACTIVE.value,
                AccidentState.RESOLVING.value,
            ]
        ]

    def get_accidents_by_severity(self, severity: str) -> List[Dict[str, Any]]:
        """Filter accidents by severity level."""
        if not self.enabled:
            return []

        return [
            accident
            for accident in self._accidents.values()
            if accident["severity"] == severity
        ]

    def auto_escalate_severity(self, accident_id: str) -> bool:
        """
        Automatically escalate accident severity based on duration.

        Args:
            accident_id: Accident to escalate

        Returns:
            True if escalated
        """
        if not self.enabled or accident_id not in self._accidents:
            return False

        accident = self._accidents[accident_id]
        created_at = datetime.fromisoformat(accident["created_at"])
        duration = (datetime.now() - created_at).total_seconds()

        # Escalate if accident active for >30 minutes
        if duration > 1800 and accident["severity"] != AccidentSeverity.CRITICAL.value:
            old_severity = accident["severity"]

            # Escalation logic
            severity_order = [
                AccidentSeverity.MINOR.value,
                AccidentSeverity.MODERATE.value,
                AccidentSeverity.SEVERE.value,
                AccidentSeverity.CRITICAL.value,
            ]

            current_index = severity_order.index(old_severity)
            if current_index < len(severity_order) - 1:
                accident["severity"] = severity_order[current_index + 1]
                logger.warning(
                    f"Accident severity escalated: {accident_id} "
                    f"{old_severity} -> {accident['severity']}"
                )
                return True

        return False

    def auto_resolve_stale_accidents(self):
        """Automatically resolve accidents with no updates."""
        if not self.enabled:
            return

        cutoff_time = datetime.now() - timedelta(seconds=self._timeouts["auto_resolve"])

        for accident_id, accident in list(self._accidents.items()):
            updated_at = datetime.fromisoformat(accident["updated_at"])

            if (
                updated_at < cutoff_time
                and accident["state"] == AccidentState.ACTIVE.value
            ):
                self.update_accident_state(
                    accident_id,
                    AccidentState.RESOLVED.value,
                    reason="Auto-resolved due to inactivity",
                )

    def _is_valid_transition(self, from_state: str, to_state: str) -> bool:
        """Validate state transition according to lifecycle rules."""
        valid_transitions = {
            AccidentState.DETECTED.value: [
                AccidentState.CONFIRMED.value,
                AccidentState.ARCHIVED.value,  # False positive
            ],
            AccidentState.CONFIRMED.value: [
                AccidentState.ACTIVE.value,
                AccidentState.RESOLVED.value,
            ],
            AccidentState.ACTIVE.value: [
                AccidentState.RESOLVING.value,
                AccidentState.RESOLVED.value,
            ],
            AccidentState.RESOLVING.value: [
                AccidentState.RESOLVED.value,
            ],
            AccidentState.RESOLVED.value: [
                AccidentState.ARCHIVED.value,
            ],
        }

        return to_state in valid_transitions.get(from_state, [])

    def _record_state_transition(
        self,
        accident_id: str,
        from_state: Optional[str],
        to_state: str,
        reason: Optional[str] = None,
    ):
        """Record state transition in history."""
        if accident_id not in self._state_history:
            self._state_history[accident_id] = []

        self._state_history[accident_id].append(
            {
                "from_state": from_state,
                "to_state": to_state,
                "timestamp": datetime.now().isoformat(),
                "reason": reason,
            }
        )

    async def run(self):
        """
        Main agent loop - processes automatic state transitions.

        Monitors accident states and performs:
        - Auto-confirm detected accidents after timeout
        - Auto-escalate severity based on duration
        - Auto-resolve stale accidents
        - Archive old resolved records
        """
        if not self.enabled:
            logger.info("AccidentStateManagerAgent.run() skipped (disabled)")
            return {"status": "skipped", "reason": "disabled"}

        logger.info("AccidentStateManagerAgent.run() - Processing state transitions")

        # Process automatic state transitions based on timeouts
        processed = 0
        for accident_id, accident in list(self._accidents.items()):
            current_state = accident["state"]
            elapsed = (datetime.utcnow() - accident["last_updated"]).total_seconds()

            # Auto-confirm after timeout
            if (
                current_state == AccidentState.DETECTED.value
                and elapsed > self._timeouts["confirmation"]
            ):
                self.transition_state(accident_id, AccidentState.CONFIRMED)
                processed += 1

            # Auto-archive resolved accidents
            elif (
                current_state == AccidentState.RESOLVED.value
                and elapsed > self._timeouts["archive"]
            ):
                self.transition_state(accident_id, AccidentState.ARCHIVED)
                processed += 1

        return {
            "status": "completed",
            "processed": processed,
            "total_accidents": len(self._accidents),
        }
