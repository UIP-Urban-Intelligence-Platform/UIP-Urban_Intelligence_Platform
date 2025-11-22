#!/usr/bin/env python3
"""Accident Detection Agent.

Module: src.agents.analytics.accident_detection_agent
Author: nguyễn Nhật Quang
Created: 2025-11-21
Version: 2.0.0
License: MIT

Description:
    Anomaly detection framework for identifying traffic accidents from
    ItemFlowObserved entities and creating RoadAccident NGSI-LD entities.

Detection Methods:
    - SpeedVarianceDetector: Statistical analysis of speed variance
    - OccupancySpikeDetector: Rule-based occupancy spike detection
    - SuddenStopDetector: Sudden speed drop detection
    - PatternAnomalyDetector: Historical pattern deviation

Core Features:
    - Multiple detection algorithms with configurable weights
    - Severity classification (minor, moderate, severe)
    - False positive filtering with cooldown mechanism
    - Batch RoadAccident entity creation in Stellio
    - Alert generation for significant events
    - State persistence and history tracking

Dependencies:
    - requests>=2.28: HTTP client
    - numpy>=1.24: Statistical computations
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/accident_config.yaml:
        - detection_methods: Enabled algorithms and weights
        - severity_thresholds: Classification rules
        - cooldown_period: False positive prevention
        - stellio_url: Context Broker endpoint

Example:
    ```python
    from src.agents.analytics.accident_detection_agent import AccidentDetectionAgent
    
    agent = AccidentDetectionAgent()
    accidents = agent.detect_accidents("data/observations.json")
    ```

Usage:
    python src/agents/analytics/accident_detection_agent.py data/observations.json
    python src/agents/analytics/accident_detection_agent.py data/observations.json --config path/to/config.yaml
"""

import json
import logging
import os
import sys
from abc import ABC, abstractmethod
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
import yaml

# Add project root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def now_iso() -> str:
    """Return current timestamp in ISO 8601 format"""
    return datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')


def parse_iso(ts: str) -> datetime:
    """Parse ISO 8601 timestamp to datetime"""
    return datetime.strptime(ts, '%Y-%m-%dT%H:%M:%SZ')


class AccidentConfig:
    """Load and validate accident detection configuration from YAML"""

    def __init__(self, config_path: str = 'config/accident_config.yaml'):
        self.config_path = Path(config_path)
        if not self.config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")
        
        with open(self.config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
        
        if 'accident_detection' not in self.config:
            raise ValueError("Config must have 'accident_detection' section")
        
        # Validate required sections
        required = ['methods', 'severity_thresholds', 'filtering', 'stellio']
        for key in required:
            if key not in self.config['accident_detection']:
                logger.warning(f"Missing '{key}' in config, using defaults")

    def get_methods(self) -> List[Dict[str, Any]]:
        """Return list of detection method configurations"""
        return self.config['accident_detection'].get('methods', [])

    def get_severity_thresholds(self) -> Dict[str, float]:
        """Return severity classification thresholds"""
        return self.config['accident_detection'].get('severity_thresholds', {
            'minor': 0.3,
            'moderate': 0.6,
            'severe': 0.9
        })

    def get_filtering(self) -> Dict[str, Any]:
        """Return false positive filtering configuration"""
        return self.config['accident_detection'].get('filtering', {})

    def get_stellio(self) -> Dict[str, Any]:
        """Return Stellio connection configuration"""
        return self.config['accident_detection'].get('stellio', {})

    def get_alert(self) -> Dict[str, Any]:
        """Return alert configuration"""
        return self.config['accident_detection'].get('alert', {})

    def get_state_config(self) -> Dict[str, Any]:
        """Return state management configuration"""
        return self.config['accident_detection'].get('state', {})

    def get_entity_config(self) -> Dict[str, Any]:
        """Return entity configuration"""
        return self.config['accident_detection'].get('entity', {})

    def get_output_config(self) -> Dict[str, Any]:
        """Return output file configuration"""
        return self.config['accident_detection'].get('output', {
            'accidents_file': 'data/accidents.json',
            'statistics_file': 'data/accident_statistics.json'
        })


class StateStore:
    """Persistent state store for accident detection"""

    def __init__(self, path: str, history_path: Optional[str] = None):
        self.path = Path(path)
        self.history_path = Path(history_path) if history_path else None
        self.data: Dict[str, Any] = {}
        self.history: List[Dict[str, Any]] = []
        self._load()
        self._load_history()

    def _load(self) -> None:
        """Load state from JSON file"""
        if self.path.exists():
            try:
                with open(self.path, 'r', encoding='utf-8') as f:
                    self.data = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load state file {self.path}: {e}, starting fresh")
                self.data = {}
        else:
            self.data = {}

    def _load_history(self) -> None:
        """Load detection history from JSON file"""
        if self.history_path and self.history_path.exists():
            try:
                with open(self.history_path, 'r', encoding='utf-8') as f:
                    self.history = json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load history file {self.history_path}: {e}, starting fresh")
                self.history = []
        else:
            self.history = []

    def save(self) -> None:
        """Write state to JSON file"""
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.path, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save state to {self.path}: {e}")

    def save_history(self) -> None:
        """Write detection history to JSON file"""
        if self.history_path:
            try:
                self.history_path.parent.mkdir(parents=True, exist_ok=True)
                with open(self.history_path, 'w', encoding='utf-8') as f:
                    json.dump(self.history, f, indent=2, ensure_ascii=False)
            except Exception as e:
                logger.error(f"Failed to save history to {self.history_path}: {e}")

    def get_camera_state(self, camera_ref: str) -> Dict[str, Any]:
        """Get state for camera"""
        default = {
            'last_alert_ts': None,
            'alert_count_hour': 0,
            'hour_start': None,
            'observations': []
        }
        return self.data.get(camera_ref, default.copy())

    def update_camera_state(self, camera_ref: str, state: Dict[str, Any]) -> None:
        """Update state for camera"""
        self.data[camera_ref] = state

    def add_to_history(self, detection: Dict[str, Any]) -> None:
        """Add detection to history"""
        self.history.append(detection)
        # Keep history manageable
        if len(self.history) > 10000:
            self.history = self.history[-10000:]

    def cleanup_old_history(self, retention_days: int) -> None:
        """Remove detections older than retention period"""
        cutoff = datetime.utcnow() - timedelta(days=retention_days)
        cutoff_str = cutoff.strftime('%Y-%m-%dT%H:%M:%SZ')
        self.history = [h for h in self.history if h.get('timestamp', '') >= cutoff_str]


class DetectionMethod(ABC):
    """Base class for accident detection methods"""

    def __init__(self, name: str, config: Dict[str, Any]):
        self.name = name
        self.config = config
        self.enabled = config.get('enabled', True)
        self.weight = float(config.get('weight', 1.0))

    @abstractmethod
    def detect(self, observations: List[Dict[str, Any]], camera_ref: str) -> Tuple[bool, float, str]:
        """
        Detect anomaly in observations.
        
        Args:
            observations: List of recent observations for camera
            camera_ref: Camera entity reference
        
        Returns:
            (detected, confidence, reason)
        """
        pass


class SpeedVarianceDetector(DetectionMethod):
    """Detect accidents via abnormal speed variance (statistical method)"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__('speed_variance', config)
        self.threshold = float(config.get('threshold', 3.0))
        self.window_size = int(config.get('window_size', 10))

    def detect(self, observations: List[Dict[str, Any]], camera_ref: str) -> Tuple[bool, float, str]:
        """Detect abnormal speed variance indicating collision"""
        if len(observations) < self.window_size:
            return (False, 0.0, f"insufficient_data: {len(observations)}/{self.window_size}")

        # Extract speeds from recent observations
        speeds = []
        for obs in observations[-self.window_size:]:
            avg_speed = self._get_value(obs, 'averageSpeed')
            if avg_speed is not None:
                speeds.append(avg_speed)

        if len(speeds) < self.window_size // 2:
            return (False, 0.0, "insufficient_speed_data")

        # Calculate mean and standard deviation
        mean_speed = sum(speeds) / len(speeds)
        if mean_speed == 0:
            return (False, 0.0, "zero_mean_speed")

        variance = sum((s - mean_speed) ** 2 for s in speeds) / len(speeds)
        std_dev = variance ** 0.5

        if std_dev == 0:
            return (False, 0.0, "zero_variance")

        # Calculate coefficient of variation
        cv = std_dev / mean_speed if mean_speed > 0 else 0

        # Detect if variance exceeds threshold
        if cv > self.threshold:
            confidence = min(cv / (self.threshold * 2), 1.0)
            reason = f"speed_variance: cv={cv:.2f}, threshold={self.threshold}"
            return (True, confidence, reason)

        return (False, 0.0, f"normal_variance: cv={cv:.2f}")

    def _get_value(self, entity: Dict[str, Any], prop: str) -> Optional[float]:
        """Extract property value from NGSI-LD entity"""
        prop_obj = entity.get(prop)
        if isinstance(prop_obj, dict):
            val = prop_obj.get('value')
            if val is not None:
                return float(val)
        elif prop_obj is not None:
            return float(prop_obj)
        return None


class OccupancySpikeDetector(DetectionMethod):
    """Detect accidents via sudden occupancy spike (rule-based method)"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__('occupancy_spike', config)
        self.spike_factor = float(config.get('spike_factor', 2.0))
        self.baseline_window = int(config.get('baseline_window', 20))

    def detect(self, observations: List[Dict[str, Any]], camera_ref: str) -> Tuple[bool, float, str]:
        """Detect sudden increase in occupancy"""
        if len(observations) < self.baseline_window + 1:
            return (False, 0.0, f"insufficient_data: {len(observations)}/{self.baseline_window + 1}")

        # Calculate baseline occupancy
        baseline_obs = observations[-(self.baseline_window + 1):-1]
        occupancies = []
        for obs in baseline_obs:
            occ = self._get_value(obs, 'occupancy')
            if occ is not None:
                occupancies.append(occ)

        if len(occupancies) < self.baseline_window // 2:
            return (False, 0.0, "insufficient_occupancy_data")

        baseline_avg = sum(occupancies) / len(occupancies)
        if baseline_avg == 0:
            baseline_avg = 0.1  # Prevent division by zero

        # Check current occupancy
        current_obs = observations[-1]
        current_occ = self._get_value(current_obs, 'occupancy')
        if current_occ is None:
            return (False, 0.0, "missing_current_occupancy")

        # Calculate spike ratio
        spike_ratio = current_occ / baseline_avg

        if spike_ratio >= self.spike_factor:
            confidence = min((spike_ratio - 1.0) / self.spike_factor, 1.0)
            reason = f"occupancy_spike: ratio={spike_ratio:.2f}, baseline={baseline_avg:.2f}, current={current_occ:.2f}"
            return (True, confidence, reason)

        return (False, 0.0, f"normal_occupancy: ratio={spike_ratio:.2f}")

    def _get_value(self, entity: Dict[str, Any], prop: str) -> Optional[float]:
        """Extract property value from NGSI-LD entity"""
        prop_obj = entity.get(prop)
        if isinstance(prop_obj, dict):
            val = prop_obj.get('value')
            if val is not None:
                return float(val)
        elif prop_obj is not None:
            return float(prop_obj)
        return None


class SuddenStopDetector(DetectionMethod):
    """Detect accidents via sudden speed drop (rule-based method)"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__('sudden_stop', config)
        self.speed_drop_threshold = float(config.get('speed_drop_threshold', 0.8))
        self.time_window = int(config.get('time_window', 30))
        self.min_initial_speed = float(config.get('min_initial_speed', 20))

    def detect(self, observations: List[Dict[str, Any]], camera_ref: str) -> Tuple[bool, float, str]:
        """Detect sudden speed drop indicating collision"""
        if len(observations) < 2:
            return (False, 0.0, "insufficient_data")

        # Find observations within time window
        recent = []
        try:
            current_time = parse_iso(self._get_observed_at(observations[-1]))
            for obs in reversed(observations):
                obs_time = parse_iso(self._get_observed_at(obs))
                if (current_time - obs_time).total_seconds() <= self.time_window:
                    recent.insert(0, obs)
                else:
                    break
        except Exception:
            return (False, 0.0, "timestamp_parse_error")

        if len(recent) < 2:
            return (False, 0.0, "insufficient_recent_data")

        # Get initial and current speeds
        initial_speed = self._get_value(recent[0], 'averageSpeed')
        current_speed = self._get_value(recent[-1], 'averageSpeed')

        if initial_speed is None or current_speed is None:
            return (False, 0.0, "missing_speed_data")

        if initial_speed < self.min_initial_speed:
            return (False, 0.0, f"initial_speed_too_low: {initial_speed}")

        # Calculate speed drop ratio
        speed_drop_ratio = (initial_speed - current_speed) / initial_speed

        if speed_drop_ratio >= self.speed_drop_threshold:
            confidence = min(speed_drop_ratio, 1.0)
            reason = f"sudden_stop: drop={speed_drop_ratio:.2f}, initial={initial_speed:.1f}, current={current_speed:.1f}"
            return (True, confidence, reason)

        return (False, 0.0, f"normal_deceleration: drop={speed_drop_ratio:.2f}")

    def _get_value(self, entity: Dict[str, Any], prop: str) -> Optional[float]:
        """Extract property value from NGSI-LD entity"""
        prop_obj = entity.get(prop)
        if isinstance(prop_obj, dict):
            val = prop_obj.get('value')
            if val is not None:
                return float(val)
        elif prop_obj is not None:
            return float(prop_obj)
        return None

    def _get_observed_at(self, entity: Dict[str, Any]) -> str:
        """Extract observedAt timestamp from entity"""
        for prop_name in ['observedAt', 'averageSpeed', 'occupancy', 'intensity']:
            prop = entity.get(prop_name)
            if isinstance(prop, dict) and 'observedAt' in prop:
                return prop['observedAt']
        return now_iso()


class PatternAnomalyDetector(DetectionMethod):
    """Detect accidents via abnormal traffic intensity patterns (statistical method)"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__('pattern_anomaly', config)
        self.threshold = float(config.get('intensity_threshold', 2.5))

    def detect(self, observations: List[Dict[str, Any]], camera_ref: str) -> Tuple[bool, float, str]:
        """Detect abnormal traffic intensity patterns"""
        if len(observations) < 10:
            return (False, 0.0, f"insufficient_data: {len(observations)}/10")

        # Extract intensity values
        intensities = []
        for obs in observations[-20:]:
            intensity = self._get_value(obs, 'intensity')
            if intensity is not None:
                intensities.append(intensity)

        if len(intensities) < 5:
            return (False, 0.0, "insufficient_intensity_data")

        # Calculate mean and std dev
        mean_intensity = sum(intensities) / len(intensities)
        variance = sum((i - mean_intensity) ** 2 for i in intensities) / len(intensities)
        std_dev = variance ** 0.5

        if std_dev == 0:
            return (False, 0.0, "zero_variance")

        # Check if current intensity is anomalous
        current_intensity = intensities[-1]
        z_score = abs(current_intensity - mean_intensity) / std_dev

        if z_score > self.threshold:
            confidence = min(z_score / (self.threshold * 2), 1.0)
            reason = f"pattern_anomaly: z_score={z_score:.2f}, current={current_intensity:.2f}, mean={mean_intensity:.2f}"
            return (True, confidence, reason)

        return (False, 0.0, f"normal_pattern: z_score={z_score:.2f}")

    def _get_value(self, entity: Dict[str, Any], prop: str) -> Optional[float]:
        """Extract property value from NGSI-LD entity"""
        prop_obj = entity.get(prop)
        if isinstance(prop_obj, dict):
            val = prop_obj.get('value')
            if val is not None:
                return float(val)
        elif prop_obj is not None:
            return float(prop_obj)
        return None


class AccidentDetectionAgent:
    """Main agent for accident detection and RoadAccident entity creation"""

    def __init__(self, config_path: str = 'config/accident_config.yaml'):
        self.config = AccidentConfig(config_path)
        
        # Initialize state store
        state_cfg = self.config.get_state_config()
        state_file = state_cfg.get('file', 'data/accident_state.json')
        history_file = state_cfg.get('history_file', 'data/accident_history.json')
        self.retention_days = int(state_cfg.get('retention_days', 7))
        self.state_store = StateStore(state_file, history_file)
        
        # Initialize detection methods
        self.detectors: List[DetectionMethod] = []
        for method_cfg in self.config.get_methods():
            if method_cfg.get('enabled', True):
                method_name = method_cfg['name']
                if method_name == 'speed_variance':
                    self.detectors.append(SpeedVarianceDetector(method_cfg))
                elif method_name == 'occupancy_spike':
                    self.detectors.append(OccupancySpikeDetector(method_cfg))
                elif method_name == 'sudden_stop':
                    self.detectors.append(SuddenStopDetector(method_cfg))
                elif method_name == 'pattern_anomaly':
                    self.detectors.append(PatternAnomalyDetector(method_cfg))
                else:
                    logger.warning(f"Unknown detection method: {method_name}")
        
        # Load configuration
        self.severity_thresholds = self.config.get_severity_thresholds()
        self.filtering = self.config.get_filtering()
        self.alert_cfg = self.config.get_alert()
        self.entity_cfg = self.config.get_entity_config()
        
        stellio = self.config.get_stellio()
        self.stellio_base = stellio.get('base_url') or os.environ.get('STELLIO_BASE_URL')
        self.create_endpoint = stellio.get('create_endpoint')
        self.batch_create = bool(stellio.get('batch_create', True))
        self.max_workers = int(stellio.get('max_workers', 4))
        
        self.session = requests.Session()
        
        # Observation buffers per camera
        self.observations_buffer: Dict[str, deque] = defaultdict(lambda: deque(maxlen=50))

        if not self.create_endpoint:
            raise ValueError('Stellio create_endpoint is required in config')
        if not self.stellio_base:
            logger.warning('Stellio base URL not configured; HTTP calls may fail')

    def process_observations_file(self, input_file: str) -> List[Dict[str, Any]]:
        """
        Process observations and detect accidents.
        
        Args:
            input_file: Path to JSON file with ItemFlowObserved entities
        
        Returns:
            List of detection results with camera, detected, severity, etc.
        """
        # Load observations
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load {input_file}: {e}")
            return []

        # Parse observations
        if isinstance(data, dict):
            entities = data.get('data') or data.get('observations') or []
        elif isinstance(data, list):
            entities = data
        else:
            entities = []

        results: List[Dict[str, Any]] = []
        to_create: List[Tuple[str, Dict[str, Any]]] = []  # (camera_ref, accident_entity)

        # Group observations by camera and update buffers
        camera_observations: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for entity in entities:
            camera_ref = self._get_camera_ref(entity)
            if camera_ref:
                self.observations_buffer[camera_ref].append(entity)
                camera_observations[camera_ref].append(entity)

        # Run detection for each camera
        for camera_ref, obs_list in camera_observations.items():
            try:
                # Get recent observations from buffer
                recent_obs = list(self.observations_buffer[camera_ref])
                
                # Run all detection methods
                detections = []
                for detector in self.detectors:
                    detected, confidence, reason = detector.detect(recent_obs, camera_ref)
                    if detected:
                        detections.append({
                            'method': detector.name,
                            'confidence': confidence,
                            'weight': detector.weight,
                            'reason': reason
                        })

                if not detections:
                    results.append({
                        'camera': camera_ref,
                        'detected': False,
                        'reason': 'no_anomaly'
                    })
                    continue

                # Aggregate detections using weighted average
                total_weighted_confidence = sum(d['confidence'] * d['weight'] for d in detections)
                total_weight = sum(d['weight'] for d in detections)
                avg_confidence = total_weighted_confidence / total_weight if total_weight > 0 else 0.0
                methods_used = [d['method'] for d in detections]
                combined_reason = '; '.join(d['reason'] for d in detections)

                # Apply filtering
                if not self._should_alert(camera_ref, avg_confidence, len(detections)):
                    results.append({
                        'camera': camera_ref,
                        'detected': True,
                        'confidence': avg_confidence,
                        'methods': methods_used,
                        'filtered': True,
                        'reason': combined_reason
                    })
                    continue

                # Classify severity
                severity = self._classify_severity(avg_confidence)

                # Create RoadAccident entity
                accident_entity = self._build_accident_entity(
                    camera_ref=camera_ref,
                    confidence=avg_confidence,
                    severity=severity,
                    methods=methods_used,
                    observation=recent_obs[-1]
                )

                to_create.append((camera_ref, accident_entity))

                results.append({
                    'camera': camera_ref,
                    'detected': True,
                    'confidence': avg_confidence,
                    'severity': severity,
                    'methods': methods_used,
                    'entity_id': accident_entity['id'],
                    'reason': combined_reason
                })

                # Update state
                self._update_camera_state(camera_ref)

                # Add to history
                self.state_store.add_to_history({
                    'timestamp': now_iso(),
                    'camera': camera_ref,
                    'entity_id': accident_entity['id'],
                    'confidence': avg_confidence,
                    'severity': severity,
                    'methods': methods_used
                })

            except Exception as e:
                logger.error(f"Error processing camera {camera_ref}: {e}")
                results.append({
                    'camera': camera_ref,
                    'detected': False,
                    'error': str(e)
                })

        # Create entities in Stellio
        creation_results: List[Dict[str, Any]] = []
        if to_create:
            if self.batch_create:
                # Batch creation with ThreadPoolExecutor
                with ThreadPoolExecutor(max_workers=self.max_workers) as exe:
                    futures = {exe.submit(self._post_entity, entity): (cam, entity) for cam, entity in to_create}
                    for fut in as_completed(futures):
                        cam, entity = futures[fut]
                        try:
                            success, status_code, error = fut.result()
                        except Exception as e:
                            success = False
                            status_code = None
                            error = str(e)
                        
                        creation_results.append({
                            'camera': cam,
                            'entity_id': entity['id'],
                            'created': True,
                            'success': success,
                            'status_code': status_code,
                            'error': error
                        })

                        if success:
                            # Generate alert if configured
                            severity = entity.get('severity', {}).get('value')
                            if self._should_generate_alert(severity):
                                self._alert(cam, entity)
                        else:
                            logger.error(f"Failed to create entity {entity['id']}: {error}")
            else:
                # Sequential creation
                for cam, entity in to_create:
                    success, status_code, error = self._post_entity(entity)
                    creation_results.append({
                        'camera': cam,
                        'entity_id': entity['id'],
                        'created': True,
                        'success': success,
                        'status_code': status_code,
                        'error': error
                    })

                    if success:
                        severity = entity.get('severity', {}).get('value')
                        if self._should_generate_alert(severity):
                            self._alert(cam, entity)
                    else:
                        logger.error(f"Failed to create entity {entity['id']}: {error}")

        # Merge results
        for res in results:
            # Find corresponding creation result
            for cr in creation_results:
                if cr['camera'] == res['camera']:
                    res.update(cr)
                    break

        # Save state and cleanup old history
        self.state_store.save()
        self.state_store.cleanup_old_history(self.retention_days)
        self.state_store.save_history()

        # ============================================================
        # CRITICAL FIX: Write accidents.json output file
        # ============================================================
        # This ensures downstream agents (smart_data_models_validation_agent, 
        # entity_publisher_agent, etc.) have input file to process
        output_config = self.config.get_output_config()
        accidents_file = output_config.get('accidents_file', 'data/accidents.json')
        
        # Build accident entities list (even if empty)
        accident_entities = []
        for res in results:
            if res.get('created') and res.get('success'):
                # Extract RoadAccident entity data
                accident_entity = {
                    'id': res.get('entity_id'),
                    'type': 'RoadAccident',
                    'camera': res.get('camera'),
                    'severity': res.get('severity'),
                    'confidence': res.get('confidence'),
                    'detectionMethods': res.get('methods', []),
                    'detected': True,
                    'timestamp': now_iso()
                }
                accident_entities.append(accident_entity)
        
        # ALWAYS write file (even if empty list) to prevent skipping warnings
        try:
            accidents_path = Path(accidents_file)
            accidents_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(accidents_file, 'w', encoding='utf-8') as f:
                json.dump(accident_entities, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Saved {len(accident_entities)} accidents to {accidents_file}")
        except Exception as e:
            logger.error(f"Failed to write accidents file {accidents_file}: {e}")

        return results

    def _get_camera_ref(self, entity: Dict[str, Any]) -> Optional[str]:
        """Extract camera reference from entity"""
        rd = entity.get('refDevice')
        if isinstance(rd, dict) and rd.get('object'):
            return rd.get('object')
        eid = entity.get('id')
        if isinstance(eid, str):
            return eid
        return None

    def _should_alert(self, camera_ref: str, confidence: float, num_methods: int) -> bool:
        """Apply filtering rules to determine if alert should be raised"""
        # Check minimum confidence
        min_conf = float(self.filtering.get('min_confidence', 0.5))
        if confidence < min_conf:
            return False

        # Check if multiple methods required
        if self.filtering.get('require_multiple_methods', False) and num_methods < 2:
            return False

        # Check cooldown period
        state = self.state_store.get_camera_state(camera_ref)
        last_alert = state.get('last_alert_ts')
        if last_alert:
            cooldown = int(self.filtering.get('cooldown_period', 300))
            try:
                elapsed = (parse_iso(now_iso()) - parse_iso(last_alert)).total_seconds()
                if elapsed < cooldown:
                    return False
            except Exception:
                pass

        # Check max alerts per hour
        max_per_hour = int(self.filtering.get('max_alerts_per_hour', 10))
        hour_start = state.get('hour_start')
        alert_count = state.get('alert_count_hour', 0)
        
        try:
            current_time = parse_iso(now_iso())
            if hour_start:
                hour_start_dt = parse_iso(hour_start)
                if (current_time - hour_start_dt).total_seconds() >= 3600:
                    # Reset hourly counter
                    alert_count = 0
                elif alert_count >= max_per_hour:
                    return False
        except Exception:
            pass

        return True

    def _update_camera_state(self, camera_ref: str) -> None:
        """Update camera state after alert"""
        state = self.state_store.get_camera_state(camera_ref)
        current_time = now_iso()
        
        # Update last alert timestamp
        state['last_alert_ts'] = current_time

        # Update hourly counter
        hour_start = state.get('hour_start')
        try:
            current_dt = parse_iso(current_time)
            if hour_start:
                hour_start_dt = parse_iso(hour_start)
                if (current_dt - hour_start_dt).total_seconds() >= 3600:
                    # Start new hour
                    state['hour_start'] = current_time
                    state['alert_count_hour'] = 1
                else:
                    state['alert_count_hour'] = state.get('alert_count_hour', 0) + 1
            else:
                state['hour_start'] = current_time
                state['alert_count_hour'] = 1
        except Exception:
            state['hour_start'] = current_time
            state['alert_count_hour'] = 1

        self.state_store.update_camera_state(camera_ref, state)

    def _classify_severity(self, confidence: float) -> str:
        """Classify accident severity based on confidence score"""
        thresholds = self.severity_thresholds
        if confidence >= thresholds.get('severe', 0.9):
            return 'severe'
        elif confidence >= thresholds.get('moderate', 0.6):
            return 'moderate'
        elif confidence >= thresholds.get('minor', 0.3):
            return 'minor'
        else:
            return 'unknown'

    def _build_accident_entity(
        self,
        camera_ref: str,
        confidence: float,
        severity: str,
        methods: List[str],
        observation: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build RoadAccident NGSI-LD entity"""
        # Generate entity ID
        timestamp = now_iso().replace(':', '').replace('-', '').replace('Z', '')
        camera_id = camera_ref.split(':')[-1] if ':' in camera_ref else camera_ref
        entity_id = f"{self.entity_cfg.get('id_prefix', 'urn:ngsi-ld:RoadAccident')}:{camera_id}-{timestamp}"

        # Extract location from observation or camera
        location_value = self._extract_location(observation)

        # Extract observed timestamp
        observed_at = self._extract_observed_at(observation)

        # Build entity
        entity = {
            'id': entity_id,
            'type': self.entity_cfg.get('type', 'RoadAccident'),
            'accidentDate': {
                'type': 'Property',
                'value': {
                    '@type': 'DateTime',
                    '@value': observed_at
                }
            },
            'severity': {
                'type': 'Property',
                'value': severity
            },
            'confidence': {
                'type': 'Property',
                'value': confidence
            },
            'detectionMethod': {
                'type': 'Property',
                'value': ', '.join(methods)
            }
        }

        # Add location if available
        if location_value:
            entity['location'] = {
                'type': 'GeoProperty',
                'value': location_value
            }

        # Add camera relationship
        if self.entity_cfg.get('link_to_camera', True):
            entity['refCamera'] = {
                'type': 'Relationship',
                'object': camera_ref
            }

        # Add observation reference
        if self.entity_cfg.get('link_to_observations', True):
            obs_id = observation.get('id')
            if obs_id:
                entity['refObservation'] = {
                    'type': 'Relationship',
                    'object': obs_id
                }

        # Add metadata if configured
        if self.entity_cfg.get('include_metadata', True):
            entity['@context'] = 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld'

        return entity

    def _extract_location(self, observation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract location from observation"""
        loc = observation.get('location')
        if isinstance(loc, dict):
            loc_val = loc.get('value')
            if isinstance(loc_val, dict):
                return loc_val
        return None

    def _extract_observed_at(self, observation: Dict[str, Any]) -> str:
        """Extract observedAt timestamp from observation"""
        for prop_name in ['observedAt', 'averageSpeed', 'occupancy', 'intensity']:
            prop = observation.get(prop_name)
            if isinstance(prop, dict) and 'observedAt' in prop:
                return prop['observedAt']
        return now_iso()

    def _post_entity(self, entity: Dict[str, Any]) -> Tuple[bool, Optional[int], Optional[str]]:
        """POST entity to Stellio"""
        if not self.stellio_base:
            return (False, None, "Stellio base URL not configured")

        url = f"{self.stellio_base}{self.create_endpoint}"
        headers = {
            'Content-Type': 'application/ld+json',
        }

        try:
            response = self.session.post(url, json=entity, headers=headers, timeout=10)
            success = response.status_code in [201, 204]
            return (success, response.status_code, None if success else response.text)
        except Exception as e:
            return (False, None, str(e))

    def _should_generate_alert(self, severity: str) -> bool:
        """Check if alert should be generated for severity level"""
        if not self.alert_cfg.get('enabled', True):
            return False
        notify_on = self.alert_cfg.get('notify_on_severity', ['moderate', 'severe'])
        return severity in notify_on

    def _alert(self, camera_ref: str, entity: Dict[str, Any]) -> None:
        """Generate alert for accident detection"""
        alert_file = Path(self.alert_cfg.get('alert_file', 'data/accident_alerts.json'))
        
        alert = {
            'timestamp': now_iso(),
            'camera': camera_ref,
            'entity_id': entity['id'],
            'severity': entity.get('severity', {}).get('value'),
            'confidence': entity.get('confidence', {}).get('value'),
            'detection_method': entity.get('detectionMethod', {}).get('value'),
            'message': f"Accident detected: {entity.get('severity', {}).get('value')} severity at {camera_ref}"
        }

        try:
            alert_file.parent.mkdir(parents=True, exist_ok=True)
            if alert_file.exists():
                with open(alert_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            else:
                data = []
            data.append(alert)
            with open(alert_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Alert generated for {camera_ref}: {entity['id']}")
        except Exception as e:
            logger.error(f"Failed to write alert for {camera_ref}: {e}")


def main(config: Optional[Dict[str, Any]] = None):
    """Main entry point
    
    Args:
        config: Optional workflow agent config (from orchestrator)
    """
    import argparse
    
    # Use config from orchestrator if provided
    if config:
        input_file = config.get('input_file', 'data/observations.json')
        config_path = config.get('config_path', 'config/accident_config.yaml')
    else:
        parser = argparse.ArgumentParser(description='Accident Detection Agent')
        parser.add_argument('input_file', nargs='?', default='data/observations.json', help='Observations JSON file')
        parser.add_argument('--config', default='config/accident_config.yaml', help='Path to accident config')
        args = parser.parse_args()
        input_file = args.input_file
        config_path = args.config

    agent = AccidentDetectionAgent(config_path)
    results = agent.process_observations_file(input_file)
    
    detections = [r for r in results if r.get('detected')]
    created = [r for r in results if r.get('created') and r.get('success')]
    
    logger.info(f"Processed {len(results)} cameras, {len(detections)} accidents detected, {len(created)} entities created")
    
    for result in created:
        logger.info(f"  {result['camera']}: {result['severity']} (confidence={result['confidence']:.2f})")


if __name__ == '__main__':
    main()
