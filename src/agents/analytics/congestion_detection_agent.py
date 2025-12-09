#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Congestion Detection Agent.

UIP - Urban Intelligence Platform
Copyright (C) 2025 UIP Team

SPDX-License-Identifier: MIT

Module: src.agents.analytics.congestion_detection_agent
Project: UIP - Urban Intelligence Platform
Author: Nguyen Nhat Quang <nguyennhatquang522004@gmail.com>
Created: 2025-11-21
Version: 2.0.0
License: MIT

Description:
    Evaluates traffic congestion based on ItemFlowObserved NGSI-LD entities
    and updates Camera entity states when congestion thresholds are breached.

Core Features:
    - Configuration-driven threshold evaluation
    - State change detection (PATCH only changed attributes)
    - Persistent state tracking (first-breach times, history)
    - Batch concurrent updates to Stellio
    - Alert generation for new congestion events
    - Robust error handling and validation

Dependencies:
    - requests>=2.28: HTTP client
    - PyYAML>=6.0: Configuration parsing
    - asyncpg>=0.29: PostgreSQL async driver (Apache-2.0 - MIT compatible)

Configuration:
    config/congestion_config.yaml:
        - thresholds: Congestion detection rules
        - stellio_url: Context Broker endpoint
        - batch_size: Concurrent update limit
        - alert_config: Alert dispatcher settings

Example:
    ```python
    from src.agents.analytics.congestion_detection_agent import CongestionDetectionAgent

    agent = CongestionDetectionAgent()
    agent.process_observations("data/observations.json")
    ```

"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import asyncpg
import requests
import yaml

from src.core.config_loader import expand_env_var

# HTTP requests for real-time publishing
import requests as http_requests

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


# ============================================================
# Real-time Stellio Publisher for CongestionObservation
# ============================================================
class CongestionRealtimePublisher:
    """Real-time publisher to push CongestionObservation entities to Stellio immediately."""
    
    def __init__(self, stellio_url: str = None):
        self.stellio_url = stellio_url or os.environ.get('STELLIO_URL', 'http://localhost:8080')
        self.session = None
        self._enabled = True
        
    def _get_session(self):
        """Get or create HTTP session."""
        if self.session is None:
            self.session = http_requests.Session()
            self.session.headers.update({
                'Content-Type': 'application/ld+json',
                'Accept': 'application/ld+json'
            })
        return self.session
    
    def publish_entities_batch(self, entities: List[Dict[str, Any]]) -> Tuple[int, int]:
        """
        Publish CongestionObservation entities to Stellio immediately.
        
        Args:
            entities: List of NGSI-LD CongestionObservation entities
            
        Returns:
            Tuple of (successful_count, failed_count)
        """
        if not entities or not self._enabled:
            return 0, 0
            
        try:
            session = self._get_session()
            url = f"{self.stellio_url}/ngsi-ld/v1/entityOperations/upsert"
            
            response = session.post(url, json=entities, params={'options': 'update'}, timeout=30)
            
            if response.status_code in [200, 201, 204]:
                logger.info(f"📤 REAL-TIME: Published {len(entities)} CongestionObservation entities to Stellio")
                return len(entities), 0
            elif response.status_code == 207:
                logger.warning(f"📤 REAL-TIME: Partial success publishing CongestionObservation to Stellio")
                return len(entities) // 2, len(entities) // 2
            else:
                logger.warning(f"📤 REAL-TIME: Failed to publish CongestionObservation: {response.status_code}")
                return 0, len(entities)
                
        except Exception as e:
            logger.warning(f"📤 REAL-TIME: Stellio publish error (non-critical): {e}")
            return 0, len(entities)


# Global real-time publisher instance
_congestion_publisher: Optional[CongestionRealtimePublisher] = None

def get_congestion_publisher() -> CongestionRealtimePublisher:
    """Get singleton congestion publisher."""
    global _congestion_publisher
    if _congestion_publisher is None:
        _congestion_publisher = CongestionRealtimePublisher()
    return _congestion_publisher


# ============================================================
# NGSI-LD CongestionObservation Entity Generator
# ============================================================
class CongestionEntityGenerator:
    """Generate NGSI-LD CongestionObservation entities."""
    
    @staticmethod
    def create_congestion_observation(
        camera_id: str,
        congested: bool,
        location: Dict[str, Any],
        timestamp: str,
        occupancy: Optional[float] = None,
        average_speed: Optional[float] = None,
        intensity: Optional[float] = None,
        congestion_level: str = "unknown",
    ) -> Dict[str, Any]:
        """
        Create NGSI-LD CongestionObservation entity.
        
        Args:
            camera_id: Reference camera ID
            congested: Whether congestion is detected
            location: GeoJSON location
            timestamp: ISO timestamp
            occupancy: Occupancy value (0-1)
            average_speed: Average speed in km/h
            intensity: Traffic intensity (0-1)
            congestion_level: "free", "moderate", "congested"
            
        Returns:
            NGSI-LD entity dict
        """
        # Generate unique ID based on camera and timestamp
        # Clean camera_id for use in entity ID
        clean_camera = camera_id.replace("urn:ngsi-ld:Camera:", "").replace("%20", "_").replace(" ", "_")
        ts_part = timestamp.replace(":", "").replace("-", "").replace("Z", "")[:14]
        entity_id = f"urn:ngsi-ld:CongestionObservation:{clean_camera}:{ts_part}"
        
        entity = {
            "id": entity_id,
            "type": "CongestionObservation",
            "@context": [
                "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
            ],
            "congested": {
                "type": "Property",
                "value": congested,
                "observedAt": timestamp
            },
            "congestionLevel": {
                "type": "Property",
                "value": congestion_level,
                "observedAt": timestamp
            },
            "refDevice": {
                "type": "Relationship",
                "object": camera_id
            },
            "dateObserved": {
                "type": "Property",
                "value": timestamp
            }
        }
        
        # Add location if available
        if location:
            entity["location"] = {
                "type": "GeoProperty",
                "value": location
            }
        
        # Add optional metrics
        if occupancy is not None:
            entity["occupancy"] = {
                "type": "Property",
                "value": round(occupancy, 3),
                "observedAt": timestamp
            }
        
        if average_speed is not None:
            entity["averageSpeed"] = {
                "type": "Property",
                "value": round(average_speed, 1),
                "observedAt": timestamp,
                "unitCode": "KMH"
            }
        
        if intensity is not None:
            entity["intensity"] = {
                "type": "Property",
                "value": round(intensity, 3),
                "observedAt": timestamp
            }
        
        return entity

# Thread lock for file operations to prevent race conditions
_alerts_file_lock = threading.Lock()


ISO_FMT = "%Y-%m-%dT%H:%M:%SZ"


def now_iso() -> str:
    return datetime.utcnow().strftime(ISO_FMT)


def parse_iso(ts: str) -> datetime:
    try:
        return datetime.strptime(ts, ISO_FMT).replace(tzinfo=timezone.utc)
    except Exception:
        # Try parsing without Z
        try:
            return datetime.fromisoformat(ts).astimezone(timezone.utc)
        except Exception:
            return datetime.utcnow().replace(tzinfo=timezone.utc)


@dataclass
class CongestionConfig:
    path: str
    config: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.load()
        self.validate()

    def load(self) -> None:
        if not Path(self.path).exists():
            raise FileNotFoundError(f"Configuration file not found: {self.path}")
        with open(self.path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f) or {}

        # Expand environment variables in config values
        self.config = expand_env_var(self.config)

        logger.info(f"Loaded congestion config from {self.path}")

    def validate(self) -> None:
        root = self.config.get("congestion_detection")
        if root is None:
            raise ValueError("Missing 'congestion_detection' section in config")
        thresholds = root.get("thresholds")
        if not thresholds:
            raise ValueError("Missing 'thresholds' in congestion_detection config")
        for key in ("occupancy", "average_speed", "intensity"):
            if key not in thresholds:
                raise ValueError(f"Missing threshold '{key}' in config")
        stellio = root.get("stellio")
        if not stellio or "update_endpoint" not in stellio:
            raise ValueError("Missing 'stellio.update_endpoint' in config (required)")
        # base_url may be required for real HTTP calls; prefer config value
        if "base_url" not in stellio and "STELLIO_BASE_URL" not in os.environ:
            # Not raising yet; we'll accept if environment set later
            logger.warning(
                "No 'stellio.base_url' in config and STELLIO_BASE_URL is not set; HTTP calls may fail"
            )

    def get_thresholds(self) -> Dict[str, float]:
        return self.config["congestion_detection"]["thresholds"]

    def get_rules(self) -> Dict[str, Any]:
        return self.config["congestion_detection"].get("rules", {})

    def get_stellio(self) -> Dict[str, Any]:
        return self.config["congestion_detection"].get("stellio", {})

    def get_alert(self) -> Dict[str, Any]:
        return self.config["congestion_detection"].get("alert", {})

    def get_state_file(self) -> str:
        state_cfg = self.config["congestion_detection"].get("state", {})
        return state_cfg.get("file", "data/congestion_state.json")

    def get_output_config(self) -> Dict[str, Any]:
        """Return output configuration"""
        return self.config["congestion_detection"].get("output", {})


class StateStore:
    """Persistent state store for congestion statuses and history"""

    def __init__(self, path: str):
        self.path = Path(path)
        self.data: Dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        if self.path.exists():
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except Exception:
                logger.warning(f"Failed to load state file {self.path}, starting fresh")
                self.data = {}
        else:
            self.data = {}

    def save(self) -> None:
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save state to {self.path}: {e}")

    def get(self, camera_ref: str) -> Dict[str, Any]:
        default = {
            "congested": False,
            "first_breach_ts": None,
            "last_update_ts": None,
            "history": [],
        }
        return self.data.get(camera_ref, default.copy())

    def update(
        self,
        camera_ref: str,
        congested: bool,
        first_breach_ts: Optional[str],
        observed_at: Optional[str],
    ) -> None:
        state = self.data.get(
            camera_ref,
            {
                "congested": False,
                "first_breach_ts": None,
                "last_update_ts": None,
                "history": [],
            },
        )
        state["congested"] = congested
        state["first_breach_ts"] = first_breach_ts
        state["last_update_ts"] = observed_at or now_iso()
        # Append history
        state.setdefault("history", [])
        state["history"].append({"ts": state["last_update_ts"], "congested": congested})
        # Keep history length reasonable
        if len(state["history"]) > 1000:
            state["history"] = state["history"][-1000:]
        self.data[camera_ref] = state


class CongestionDetector:
    """Evaluate congestion rules for single observation"""

    def __init__(self, config: CongestionConfig, state_store: StateStore):
        self.config = config
        self.state_store = state_store
        thresholds = config.get_thresholds()
        self.occupancy_thresh = float(thresholds.get("occupancy"))
        self.avg_speed_thresh = float(thresholds.get("average_speed"))
        self.intensity_thresh = float(thresholds.get("intensity"))
        rules = config.get_rules() or {}
        self.logic = rules.get("logic", "AND").upper()
        self.min_duration = int(rules.get("min_duration", 0))

    @staticmethod
    def _get_value(entity: Dict[str, Any], prop: str) -> Optional[float]:
        # Look for property in entity; supports NGSI-LD Property structure
        try:
            prop_obj = entity.get(prop)
            if isinstance(prop_obj, dict):
                val = prop_obj.get("value")
                if val is None:
                    return None
                return float(val)
        except Exception:
            return None
        return None

    def evaluate(self, entity: Dict[str, Any]) -> Tuple[bool, bool, Optional[str], str]:
        """
        Evaluate congestion for an entity.
        Returns: (should_update, new_congested_state, reason, observedAt)
        should_update: whether congestion state changed and should be patched
        new_congested_state: boolean
        reason: textual reason (diagnostics)
        observedAt: timestamp used for observedAt
        """
        # Extract camera reference ID (Camera entity id), prefer refDevice.object
        camera_ref = self._get_camera_ref(entity)
        if not camera_ref:
            raise ValueError("Cannot determine camera reference from entity")

        occupancy = self._get_value(entity, "occupancy")
        avg_speed = self._get_value(entity, "averageSpeed")
        intensity = self._get_value(entity, "intensity")

        observed_at = None
        # Try to find observedAt from intensity/intensity property
        for prop in ("intensity", "occupancy", "averageSpeed"):
            p = entity.get(prop)
            if isinstance(p, dict):
                observed_at = p.get("observedAt")
                if observed_at:
                    break
        if not observed_at:
            observed_at = now_iso()

        # Default missing values to False in comparisons
        occ_ok = occupancy is not None and occupancy > self.occupancy_thresh
        speed_ok = avg_speed is not None and avg_speed < self.avg_speed_thresh
        int_ok = intensity is not None and intensity > self.intensity_thresh

        if self.logic == "AND":
            breached = occ_ok and speed_ok and int_ok
        else:
            breached = occ_ok or speed_ok or int_ok

        # Determine new congested state considering min_duration and previous state
        prev_state = self.state_store.get(camera_ref)
        prev_congested = bool(prev_state.get("congested", False))
        first_breach_ts = prev_state.get("first_breach_ts")

        reason = (
            f"occ={occupancy}, speed={avg_speed}, int={intensity}, logic={self.logic}"
        )

        if breached:
            if prev_congested:
                # Already congested, no change
                return (False, True, reason, observed_at)
            # Not currently congested: check min_duration
            if first_breach_ts is None:
                # Start timer (or immediate if min_duration is 0)
                if self.min_duration == 0:
                    # Immediate congestion
                    return (True, True, reason + "; immediate", observed_at)
                first_breach_ts = observed_at
                # Not yet enough duration
                return (False, False, reason + "; started_timer", observed_at)
            else:
                # Calculate elapsed
                elapsed = (
                    parse_iso(observed_at) - parse_iso(first_breach_ts)
                ).total_seconds()
                if elapsed >= self.min_duration:
                    # Now considered congested
                    return (True, True, reason + f"; elapsed={elapsed}", observed_at)
                else:
                    return (False, False, reason + f"; elapsed={elapsed}", observed_at)
        else:
            # Reset timer if it exists and clear congestion state
            if prev_congested:
                # Was congested before, now cleared -> update required
                return (True, False, reason + "; cleared", observed_at)
            if first_breach_ts is not None:
                # Timer existed but breach cleared before min_duration
                return (False, False, reason + "; timer_reset", observed_at)
            return (False, False, reason + "; no_breach", observed_at)

    def _get_camera_ref(self, entity: Dict[str, Any]) -> Optional[str]:
        # Prefer refDevice.object
        rd = entity.get("refDevice")
        if isinstance(rd, dict) and rd.get("object"):
            return rd.get("object")
        # Otherwise, attempt to parse from id (ItemFlowObserved:...)
        eid = entity.get("id")
        if isinstance(eid, str):
            # If id contains camera id after last ':' maybe can't map to camera ref
            # Fallback: return entity id (some deployments may use same id)
            return eid
        return None


class CongestionDetectionAgent:
    """Main agent class for congestion detection"""

    def __init__(self, config_path: str = "config/congestion_config.yaml") -> None:
        self.config = CongestionConfig(config_path)
        state_file = self.config.get_state_file()
        self.state_store = StateStore(state_file)
        self.detector = CongestionDetector(self.config, self.state_store)
        stellio = self.config.get_stellio()
        self.stellio_base = stellio.get("base_url") or os.environ.get(
            "STELLIO_BASE_URL"
        )
        self.update_endpoint = stellio.get("update_endpoint")
        self.batch_updates = bool(stellio.get("batch_updates", True))
        self.max_workers = int(stellio.get("max_workers", 4))
        self.alert_cfg = self.config.get_alert()
        self.session = requests.Session()

        # Camera ID mapping (index -> real Camera ID)
        self.camera_mapping: Dict[int, str] = {}
        self._build_camera_mapping()

        if not self.update_endpoint:
            raise ValueError("Stellio update_endpoint is required in config")
        if not self.stellio_base:
            logger.warning("Stellio base URL not configured; HTTP calls may fail")

    def _build_camera_mapping(self) -> None:
        """Build mapping from camera indices to real Camera entity IDs.

        Strategy:
        1. Load cameras_enriched.json to get index -> code mapping
        2. Query all Camera entities from PostgreSQL to get code -> entity_id mapping
        3. Combine to create index -> entity_id mapping
        """
        postgres_cfg = self.config.config.get("congestion_detection", {}).get(
            "postgres"
        )
        if not postgres_cfg:
            logger.warning("No PostgreSQL config found, camera mapping will be empty")
            return

        # Step 1: Load cameras_enriched.json to get index -> code mapping
        camera_file = self.config.config.get("congestion_detection", {}).get(
            "camera_enriched_file", "data/cameras_enriched.json"
        )
        index_to_code = {}

        try:
            if Path(camera_file).exists():
                with open(camera_file, "r", encoding="utf-8") as f:
                    cameras_data = json.load(f)
                    for camera in cameras_data:
                        camera_index = int(camera.get("id", -1))
                        camera_code = camera.get("code", "")
                        if camera_index >= 0 and camera_code:
                            index_to_code[camera_index] = camera_code
                logger.info(
                    f"Loaded {len(index_to_code)} camera index->code mappings from {camera_file}"
                )
            else:
                logger.warning(f"Camera enriched file not found: {camera_file}")
        except Exception as e:
            logger.error(f"Failed to load camera enriched file: {e}")

        # Step 2: Query all Camera entities from PostgreSQL to get code -> entity_id mapping
        code_to_entity_id = {}

        async def _fetch_camera_entities() -> Dict[str, str]:
            """Async function to fetch camera entities from PostgreSQL."""
            mapping = {}
            try:
                # Expand env vars from config values, then override with direct env vars
                pg_host = os.environ.get("POSTGRES_HOST") or expand_env_var(
                    postgres_cfg.get("host", "localhost")
                )
                pg_port = int(
                    os.environ.get("POSTGRES_PORT")
                    or expand_env_var(postgres_cfg.get("port", 5432))
                )
                pg_database = os.environ.get("POSTGRES_DATABASE") or expand_env_var(
                    postgres_cfg.get("database", "stellio_search")
                )
                pg_user = os.environ.get("POSTGRES_USER") or expand_env_var(
                    postgres_cfg.get("user", "stellio")
                )
                pg_password = os.environ.get("POSTGRES_PASSWORD") or expand_env_var(
                    postgres_cfg.get("password", "stellio_password")
                )

                conn = await asyncpg.connect(
                    host=pg_host,
                    port=pg_port,
                    database=pg_database,
                    user=pg_user,
                    password=pg_password,
                )

                # Query all Camera entities - entity_id contains the camera code
                # Format: urn:ngsi-ld:Camera:TTH%20406 -> code is "TTH 406" (URL encoded)
                query = """
                    SELECT entity_id 
                    FROM entity_payload 
                    WHERE 'https://uri.etsi.org/ngsi-ld/default-context/Camera' = ANY(types)
                """

                rows = await conn.fetch(query)

                # Extract camera code from entity_id and build mapping
                from urllib.parse import unquote

                for row in rows:
                    entity_id = row["entity_id"]
                    # Extract code from entity_id: urn:ngsi-ld:Camera:TTH%20406 -> TTH 406
                    if ":Camera:" in entity_id:
                        encoded_code = entity_id.split(":Camera:")[-1]
                        camera_code = unquote(encoded_code)
                        mapping[camera_code] = entity_id

                logger.info(
                    f"Built code->entity_id mapping with {len(mapping)} Camera entities from PostgreSQL"
                )

                await conn.close()
            except Exception as e:
                logger.error(f"Failed to query PostgreSQL for camera mapping: {e}")
            return mapping

        try:
            # Run async function in event loop
            try:
                loop = asyncio.get_running_loop()
                # If we're already in an async context, create task
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor() as executor:
                    code_to_entity_id = executor.submit(
                        lambda: asyncio.run(_fetch_camera_entities())
                    ).result()
            except RuntimeError:
                # No running loop, safe to use asyncio.run
                code_to_entity_id = asyncio.run(_fetch_camera_entities())
        except Exception as e:
            logger.error(f"Failed to run async PostgreSQL query: {e}")
            code_to_entity_id = {}

        # Step 3: Combine mappings: index -> code -> entity_id
        self.camera_mapping = {}
        missing_codes = []

        for camera_index, camera_code in index_to_code.items():
            if camera_code in code_to_entity_id:
                self.camera_mapping[camera_index] = code_to_entity_id[camera_code]
            else:
                missing_codes.append((camera_index, camera_code))

        logger.info(
            f"Built camera index->entity_id mapping with {len(self.camera_mapping)} entries"
        )

        if missing_codes:
            logger.warning(
                f"Found {len(missing_codes)} cameras in enriched file but not in PostgreSQL:"
            )
            for idx, code in missing_codes[:10]:  # Log first 10
                logger.warning(
                    f"  - Camera index {idx} (code: {code}) not found in Stellio"
                )
            if len(missing_codes) > 10:
                logger.warning(f"  ... and {len(missing_codes) - 10} more")

    def _map_camera_id(self, camera_ref: str) -> Optional[str]:
        """Map index-based Camera ID to real Camera ID.

        Args:
            camera_ref: Camera reference like 'urn:ngsi-ld:Camera:0'

        Returns:
            Real Camera ID like 'urn:ngsi-ld:Camera:TTH%20406' or None if not found in mapping
            Returns None to signal that the camera should be skipped (not in Stellio)
        """
        if "Camera:" not in camera_ref:
            return camera_ref

        camera_index_str = camera_ref.split("Camera:")[-1]
        if camera_index_str.isdigit():
            camera_index = int(camera_index_str)
            if camera_index in self.camera_mapping:
                mapped_id = self.camera_mapping[camera_index]
                logger.debug(f"✓ Mapped Camera:{camera_index} -> {mapped_id}")
                return mapped_id
            else:
                # Camera not in mapping - it doesn't exist in Stellio
                # Log as WARNING only once per camera during mapping build
                logger.warning(
                    f"Camera index {camera_index} not found in mapping - camera not in Stellio (total mapped: {len(self.camera_mapping)})"
                )
                return None  # Signal to skip this camera

        # If not digit format, assume it's already a real ID
        return camera_ref

    def _build_patch_payload(self, congested: bool, observed_at: str) -> Dict[str, Any]:
        return {
            "congested": {
                "type": "Property",
                "value": bool(congested),
                "observedAt": observed_at,
            },
            "@context": ["https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"],
        }

    def _patch_entity(
        self, entity_id: str, payload: Dict[str, Any]
    ) -> Tuple[bool, Optional[int], Optional[str]]:
        """Send PATCH to Stellio for entity attributes update."""
        url = None
        try:
            # URL encode the entity_id since it may contain % characters that need double-encoding
            from urllib.parse import quote

            encoded_id = quote(entity_id, safe="")

            # Build full URL
            if self.stellio_base:
                url = self.stellio_base.rstrip("/") + self.update_endpoint.format(
                    id=encoded_id
                )
            else:
                url = self.update_endpoint.format(id=encoded_id)
            headers = {"Content-Type": "application/ld+json"}
            logger.debug(f"PATCH {url} payload={payload}")
            resp = self.session.patch(url, json=payload, headers=headers, timeout=10)
            resp.raise_for_status()
            return True, resp.status_code, None
        except Exception as e:
            logger.error(f"Failed to PATCH {url}: {e}")
            return (
                False,
                (
                    getattr(e, "response", None).status_code
                    if hasattr(e, "response") and e.response is not None
                    else None
                ),
                str(e),
            )

    def _alert(self, camera_ref: str, entity: Dict[str, Any], observed_at: str) -> None:
        if not self.alert_cfg.get("enabled", False):
            return
        # Very basic alert: append to local alerts file
        alerts_file = Path("data/alerts.json")
        alert = {
            "camera": camera_ref,
            "observedAt": observed_at,
            "message": f"Congestion detected for {camera_ref} at {observed_at}",
        }
        try:
            alerts_file.parent.mkdir(parents=True, exist_ok=True)
            # Use thread lock to prevent race condition when multiple threads write simultaneously
            with _alerts_file_lock:
                data = []
                if alerts_file.exists():
                    # Handle empty or invalid JSON file gracefully
                    try:
                        content = alerts_file.read_text(encoding="utf-8").strip()
                        if content:
                            data = json.loads(content)
                            if not isinstance(data, list):
                                logger.warning(
                                    f"alerts.json contains non-list data, resetting to empty list"
                                )
                                data = []
                    except json.JSONDecodeError as je:
                        logger.warning(f"Invalid JSON in alerts.json, resetting: {je}")
                        data = []
                data.append(alert)
                with open(alerts_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Alert generated for {camera_ref}")
        except Exception as e:
            logger.error(f"Failed to write alert for {camera_ref}: {e}")

    def process_observations_file(self, input_file: str) -> List[Dict[str, Any]]:
        """
        Process observations JSON file and update Stellio when congestion state changes.
        Returns list of result dicts with camera_ref, updated(bool), success(bool), status_code, error
        """
        input_path = Path(input_file)
        if not input_path.exists():
            raise FileNotFoundError(f"Observations file not found: {input_file}")

        with open(input_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if isinstance(data, dict):
            # Support both list and object with key 'observations' or 'entities'
            if "observations" in data:
                entities = data["observations"]
            elif "entities" in data:
                entities = data["entities"]
            else:
                # Assume it's a single entity or keyed object
                # try to flatten
                entities = data.get("data") or data.get("cameras") or []
        elif isinstance(data, list):
            entities = data
        else:
            entities = []

        results: List[Dict[str, Any]] = []
        to_update: List[Tuple[str, Dict[str, Any], Dict[str, Any], bool]] = (
            []
        )  # (camera_ref,payload,entity,new_state)

        for entity in entities:
            try:
                should_update, new_state, reason, observed_at = self.detector.evaluate(
                    entity
                )
            except Exception as e:
                logger.error(f"Skipping entity due to evaluation error: {e}")
                continue
            camera_ref = self.detector._get_camera_ref(entity)
            prev_state = self.state_store.get(camera_ref)

            # If a first_breach_ts should be initialized or reset based on reasons
            if "started_timer" in (reason or ""):
                # initialize timer
                self.state_store.update(camera_ref, False, observed_at, observed_at)
                results.append(
                    {
                        "camera": camera_ref,
                        "updated": False,
                        "success": True,
                        "reason": reason,
                    }
                )
                continue

            if should_update:
                # Build payload and schedule update
                payload = self._build_patch_payload(new_state, observed_at)
                # Map camera_ref to real Camera ID
                real_camera_id = self._map_camera_id(camera_ref)

                if real_camera_id is None:
                    # Camera not in Stellio - skip PATCH but still update local state for consistency
                    logger.info(
                        f"Skipping PATCH for {camera_ref} (not in Stellio), but updating local state"
                    )

                    # Update local state even though we can't PATCH
                    prev = self.state_store.get(camera_ref)
                    if new_state:
                        fb = prev.get("first_breach_ts") or observed_at
                        self.state_store.update(camera_ref, True, fb, observed_at)
                    else:
                        self.state_store.update(camera_ref, False, None, observed_at)

                    # Record result as skipped
                    results.append(
                        {
                            "camera": camera_ref,
                            "updated": True,
                            "success": False,
                            "status_code": None,
                            "error": "Camera not found in Stellio mapping",
                            "reason": "skipped_no_mapping",
                        }
                    )
                    continue

                to_update.append(
                    (real_camera_id, payload, entity, new_state, camera_ref)
                )
            else:
                # If no update needed, we may still need to update first_breach_ts or reset it
                # Detector logic handles timer resets and returns no update; update state accordingly
                # Update state store based on detector outputs
                # If detector returned "timer_reset" or "no_breach" it implies first_breach_ts should be None
                if (
                    "timer_reset" in (reason or "")
                    or "no_breach" in (reason or "")
                    or "cleared" in (reason or "")
                ):
                    # Reset timer and set congested False
                    self.state_store.update(camera_ref, False, None, observed_at)
                results.append(
                    {
                        "camera": camera_ref,
                        "updated": False,
                        "success": True,
                        "reason": reason,
                    }
                )

        # Execute updates (batch or sequential)
        update_results: List[Dict[str, Any]] = []
        if to_update:
            if self.batch_updates:
                # Use ThreadPoolExecutor
                with ThreadPoolExecutor(max_workers=self.max_workers) as exe:
                    futures = {
                        exe.submit(self._patch_entity, real_cam_id, payload): (
                            real_cam_id,
                            payload,
                            ent,
                            new_st,
                            orig_cam,
                        )
                        for real_cam_id, payload, ent, new_st, orig_cam in to_update
                    }
                    for fut in as_completed(futures):
                        real_cam_id, payload, ent, new_st, orig_cam = futures[fut]
                        try:
                            success, status_code, error = fut.result()
                        except Exception as e:
                            success = False
                            status_code = None
                            error = str(e)
                        update_results.append(
                            {
                                "camera": orig_cam,
                                "updated": True,
                                "success": success,
                                "status_code": status_code,
                                "error": error,
                            }
                        )

                        # CRITICAL FIX: Update state REGARDLESS of PATCH result
                        # Detection logic is independent of PATCH success
                        # Use original camera_ref for state tracking
                        prev = self.state_store.get(orig_cam)
                        if new_st:
                            # Set congested True
                            fb = prev.get("first_breach_ts") or now_iso()
                            self.state_store.update(
                                orig_cam,
                                True,
                                fb,
                                payload.get("congested", {}).get("observedAt"),
                            )
                        else:
                            # Clear congestion
                            self.state_store.update(
                                orig_cam,
                                False,
                                None,
                                payload.get("congested", {}).get("observedAt"),
                            )

                        # Alert if notify_on_change and previous was False (only if PATCH successful)
                        if (
                            success
                            and self.alert_cfg.get("enabled", False)
                            and self.alert_cfg.get("notify_on_change", False)
                        ):
                            if not prev.get("congested", False) and new_st:
                                self._alert(
                                    orig_cam,
                                    ent,
                                    payload.get("congested", {}).get("observedAt"),
                                )

                        if not success:
                            logger.error(f"Failed to update {real_cam_id}: {error}")
            else:
                # Sequential updates
                for real_cam_id, payload, ent, new_st, orig_cam in to_update:
                    success, status_code, error = self._patch_entity(
                        real_cam_id, payload
                    )
                    update_results.append(
                        {
                            "camera": orig_cam,
                            "updated": True,
                            "success": success,
                            "status_code": status_code,
                            "error": error,
                        }
                    )

                    # CRITICAL FIX: Update state REGARDLESS of PATCH result
                    # Detection logic is independent of PATCH success
                    # Use original camera_ref for state tracking
                    prev = self.state_store.get(orig_cam)
                    if new_st:
                        # Set congested True
                        fb = prev.get("first_breach_ts") or now_iso()
                        self.state_store.update(
                            orig_cam,
                            True,
                            fb,
                            payload.get("congested", {}).get("observedAt"),
                        )
                    else:
                        # Clear congestion
                        self.state_store.update(
                            orig_cam,
                            False,
                            None,
                            payload.get("congested", {}).get("observedAt"),
                        )

                    # Alert if notify_on_change and previous was False (only if PATCH successful)
                    if (
                        success
                        and self.alert_cfg.get("enabled", False)
                        and self.alert_cfg.get("notify_on_change", False)
                    ):
                        if not prev.get("congested", False) and new_st:
                            self._alert(
                                orig_cam,
                                ent,
                                payload.get("congested", {}).get("observedAt"),
                            )

                    if not success:
                        logger.error(f"Failed to update {real_cam_id}: {error}")

        # Combine results
        results.extend(update_results)
        # Save state
        self.state_store.save()

        # ============================================================
        # CRITICAL FIX: Write congestion.json output file
        # ============================================================
        # This ensures downstream monitoring and analytics have structured data
        output_config = self.config.get_output_config()
        congestion_file = output_config.get("congestion_file", "data/congestion.json")

        # Build congestion events list based on DETECTED congestion (not PATCH success)
        # This ensures we log all detected congestion events for analytics
        congestion_events = []
        for res in results:
            # Include any camera that was detected as congested, regardless of PATCH result
            if res.get("updated"):
                # This means should_update=True, which means congestion state CHANGED
                # Check current state from state_store to determine if it's congested
                camera_ref = res.get("camera")
                current_state = self.state_store.get(camera_ref)

                congestion_event = {
                    "camera": camera_ref,
                    "congested": current_state.get("congested", False),
                    "first_breach_ts": current_state.get("first_breach_ts"),
                    "last_update_ts": current_state.get("last_update_ts"),
                    "patch_success": res.get("success", False),
                    "timestamp": now_iso(),
                }
                congestion_events.append(congestion_event)

        # ALWAYS write file (even if empty list) for consistency
        try:
            congestion_path = Path(congestion_file)
            congestion_path.parent.mkdir(parents=True, exist_ok=True)

            with open(congestion_file, "w", encoding="utf-8") as f:
                json.dump(congestion_events, f, indent=2, ensure_ascii=False)

            logger.info(
                f"✅ Saved {len(congestion_events)} congestion events to {congestion_file}"
            )
        except Exception as e:
            logger.error(f"Failed to write congestion file {congestion_file}: {e}")

        # ============================================================
        # 🚀 REAL-TIME: Create and publish CongestionObservation entities
        # ============================================================
        congestion_entities = []
        
        # Get real-time publisher
        publisher = get_congestion_publisher()
        
        # Create NGSI-LD entities for each congestion event
        for event in congestion_events:
            camera_ref = event.get("camera", "")
            congested = event.get("congested", False)
            timestamp = event.get("last_update_ts") or event.get("timestamp") or now_iso()
            
            # Determine congestion level
            if congested:
                congestion_level = "congested"
            else:
                congestion_level = "free"
            
            # Try to get location from original entity
            location = None
            for ent in entities:
                ent_camera = self.detector._get_camera_ref(ent)
                if ent_camera == camera_ref:
                    # Extract location from entity
                    loc_prop = ent.get("location")
                    if isinstance(loc_prop, dict):
                        if "value" in loc_prop:
                            location = loc_prop["value"]
                        elif "coordinates" in loc_prop:
                            location = loc_prop
                    break
            
            # Create CongestionObservation entity
            entity = CongestionEntityGenerator.create_congestion_observation(
                camera_id=camera_ref,
                congested=congested,
                location=location,
                timestamp=timestamp,
                congestion_level=congestion_level,
            )
            
            congestion_entities.append(entity)
        
        # Publish to Stellio if we have entities
        if congestion_entities:
            success_count, failed_count = publisher.publish_entities_batch(congestion_entities)
            logger.info(f"🚀 Published {success_count} CongestionObservation entities to Stellio (failed: {failed_count})")
            
            # Also save to congestion_observations.json for backup
            observations_file = output_config.get("observations_file", "data/congestion_observations.json")
            try:
                obs_path = Path(observations_file)
                obs_path.parent.mkdir(parents=True, exist_ok=True)
                
                # Append to existing file or create new
                existing = []
                if obs_path.exists():
                    try:
                        with open(obs_path, 'r', encoding='utf-8') as f:
                            existing = json.load(f)
                    except:
                        existing = []
                
                # Add new entities (deduplicate by id)
                existing_ids = {e.get("id") for e in existing}
                for ent in congestion_entities:
                    if ent.get("id") not in existing_ids:
                        existing.append(ent)
                
                # Keep only last 1000 entries
                if len(existing) > 1000:
                    existing = existing[-1000:]
                
                with open(obs_path, 'w', encoding='utf-8') as f:
                    json.dump(existing, f, indent=2, ensure_ascii=False)
                
                logger.info(f"✅ Saved CongestionObservation entities to {observations_file}")
            except Exception as e:
                logger.error(f"Failed to save congestion observations: {e}")
        
        return results


def main(config: Optional[Dict[str, Any]] = None):
    """Main entry point

    Args:
        config: Optional workflow agent config (from orchestrator)
    """
    import argparse

    # Use config from orchestrator if provided
    if config:
        input_file = config.get("input_file", "data/observations.json")
        config_path = config.get("config_path", "config/congestion_config.yaml")
    else:
        parser = argparse.ArgumentParser(description="Congestion Detection Agent")
        parser.add_argument(
            "input_file",
            nargs="?",
            default="data/observations.json",
            help="Observations JSON file",
        )
        parser.add_argument(
            "--config",
            default="config/congestion_config.yaml",
            help="Path to congestion config",
        )
        args = parser.parse_args()
        input_file = args.input_file
        config_path = args.config

    agent = CongestionDetectionAgent(config_path)
    res = agent.process_observations_file(input_file)
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
