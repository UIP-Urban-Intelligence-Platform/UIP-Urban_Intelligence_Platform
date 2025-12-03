#!/usr/bin/env python3
"""Pattern Recognition Agent - Time-Series Analysis & Forecasting.

Module: src.agents.analytics.pattern_recognition_agent
Author: nguyễn Nhật Quang
Created: 2025-11-21
Version: 2.0.0
License: MIT

Description:
    Performs time-series analysis and forecasting on temporal data with
    anomaly detection, pattern recognition, and prediction capabilities.

Analysis Methods:
    - Time-series analysis (hourly, daily, weekly patterns)
    - Anomaly detection (z-score based statistical analysis)
    - Forecasting (moving average, exponential smoothing, ARIMA)
    - Rush hour detection and pattern identification

Core Features:
    - Neo4j temporal data querying (Cypher)
    - TrafficPattern NGSI-LD entity creation
    - Camera prediction updates
    - Statistical pattern detection

Dependencies:
    - neo4j>=5.0: Graph database client
    - statsmodels>=0.14: ARIMA forecasting
    - numpy>=1.24: Numerical computing
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/pattern_recognition.yaml:
        - neo4j_config: Database connection settings
        - analysis_window: Time window for analysis
        - anomaly_threshold: Z-score threshold for anomalies
        - forecast_methods: Enabled forecasting algorithms

Example:
    ```python
    from src.agents.analytics.pattern_recognition_agent import PatternRecognitionAgent
    
    agent = PatternRecognitionAgent()
    patterns = agent.analyze_patterns(time_window="7d")
    forecast = agent.forecast_traffic(camera_id="cam_001", horizon="24h")
    ```

Architecture:
    Neo4j → TimeSeriesAnalyzer → PatternDetector → ForecastEngine → NGSI-LD

References:
    - ARIMA: https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html
    - Z-score: https://en.wikipedia.org/wiki/Standard_score
"""

import os
import json
import logging
import warnings
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict, deque
from abc import ABC, abstractmethod
import yaml
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Neo4j driver
try:
    from neo4j import GraphDatabase, Driver, Session
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    logging.warning("neo4j package not available - install with: pip install neo4j")

# Pandas for time-series
try:
    import pandas as pd
    import numpy as np
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    logging.warning("pandas/numpy not available - install with: pip install pandas numpy")

# Statsmodels for ARIMA
try:
    from statsmodels.tsa.arima.model import ARIMA
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    logging.warning("statsmodels not available - install with: pip install statsmodels")

# Suppress Neo4j notifications (property warnings, etc.)
# These are informational notifications, not errors
logging.getLogger('neo4j.notifications').setLevel(logging.ERROR)


# ============================================================================
# Configuration
# ============================================================================

class PatternConfig:
    """Load and validate pattern recognition configuration from YAML."""
    
    def __init__(self, config_path: str):
        """
        Load configuration from YAML file.
        
        Args:
            config_path: Path to YAML configuration file
        """
        self.config_path = config_path
        self.config = self._load_config()
        self._validate_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load YAML configuration file."""
        try:
            # Import expand_env_var helper for ${VAR:-default} syntax support
            from src.core.config_loader import expand_env_var
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            # Use centralized expand_env_var for proper ${VAR:-default} syntax support
            config = expand_env_var(config)
            
            return config
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML configuration: {e}")
    
    def _validate_config(self):
        """Validate required configuration keys."""
        required_keys = ['pattern_recognition']
        for key in required_keys:
            if key not in self.config:
                raise ValueError(f"Missing required configuration key: {key}")
        
        pr_config = self.config['pattern_recognition']
        required_sections = ['neo4j', 'analysis', 'patterns', 'forecasting', 'entity', 'stellio']
        for section in required_sections:
            if section not in pr_config:
                raise ValueError(f"Missing required section: {section}")
    
    def get_neo4j_config(self) -> Dict[str, Any]:
        """Get Neo4j connection configuration."""
        return self.config['pattern_recognition']['neo4j']
    
    def get_analysis_config(self) -> Dict[str, Any]:
        """Get analysis configuration."""
        return self.config['pattern_recognition']['analysis']
    
    def get_patterns_config(self) -> Dict[str, Any]:
        """Get pattern detection configuration."""
        return self.config['pattern_recognition']['patterns']
    
    def get_forecasting_config(self) -> Dict[str, Any]:
        """Get forecasting configuration."""
        return self.config['pattern_recognition']['forecasting']
    
    def get_entity_config(self) -> Dict[str, Any]:
        """Get entity configuration."""
        return self.config['pattern_recognition']['entity']
    
    def get_stellio_config(self) -> Dict[str, Any]:
        """Get Stellio configuration."""
        return self.config['pattern_recognition']['stellio']
    
    def get_output_config(self) -> Dict[str, Any]:
        """Get output configuration."""
        return self.config['pattern_recognition'].get('output', {})
    
    def get_state_config(self) -> Dict[str, Any]:
        """Get state persistence configuration."""
        return self.config['pattern_recognition'].get('state', {})


# ============================================================================
# Neo4j Connector
# ============================================================================

class Neo4jConnector:
    """Connect to Neo4j and query temporal data."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Neo4j connection.
        
        Args:
            config: Neo4j configuration dictionary
        """
        if not NEO4J_AVAILABLE:
            raise ImportError("neo4j package required - install with: pip install neo4j")
        
        self.config = config
        
        # Read from environment variables first, fallback to config file
        self.uri = os.environ.get('NEO4J_URL') or config.get('uri', 'bolt://localhost:7687')
        
        neo4j_user = os.environ.get('NEO4J_USER') or config.get('auth', {}).get('username', 'neo4j')
        neo4j_password = os.environ.get('NEO4J_PASSWORD') or config.get('auth', {}).get('password', '')
        self.auth = (neo4j_user, neo4j_password)
        
        self.database = os.environ.get('NEO4J_DATABASE') or config.get('database', 'neo4j')
        
        self.driver: Optional[Driver] = None
        self._connect()
    
    def _connect(self):
        """Establish connection to Neo4j."""
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=self.auth,
                max_connection_lifetime=self.config.get('max_connection_lifetime', 3600),
                connection_timeout=self.config.get('connection_timeout', 30)
            )
            # Verify connectivity
            self.driver.verify_connectivity()
        except Exception as e:
            raise ConnectionError(f"Failed to connect to Neo4j: {e}")
    
    def close(self):
        """Close Neo4j connection."""
        if self.driver:
            self.driver.close()
    
    def query_temporal_data(
        self,
        camera_id: str,
        start_time: datetime,
        end_time: datetime,
        metrics: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Query temporal observation data for a camera.
        
        Args:
            camera_id: Camera entity ID
            start_time: Start of time window
            end_time: End of time window
            metrics: List of metric names to retrieve
        
        Returns:
            List of observations with timestamps and metric values
        """
        if not self.driver:
            raise ConnectionError("Not connected to Neo4j")
        
        # Build Cypher query dynamically based on metrics
        metric_return = ", ".join([f"o.{m}" for m in metrics])
        
        # Use createdAt as the timestamp field (observedAt may not exist in Neo4j sync)
        query = f"""
        MATCH (c:Camera {{id: $camera_id}})
              -[:HAS_OBSERVATION]->(o:Observation)
        WHERE o.createdAt >= $start_time
          AND o.createdAt <= $end_time
        RETURN o.createdAt AS timestamp, {metric_return}
        ORDER BY o.createdAt
        """
        
        with self.driver.session(database=self.database) as session:
            result = session.run(
                query,
                camera_id=camera_id,
                start_time=start_time.isoformat(),
                end_time=end_time.isoformat()
            )
            
            records = []
            for record in result:
                data = {'timestamp': record['timestamp']}
                for metric in metrics:
                    data[metric] = record.get(metric)
                records.append(data)
            
            return records
    
    def check_observation_nodes_exist(self) -> bool:
        """
        Check if Observation nodes exist in Neo4j database.
        
        This is a readiness check to ensure Neo4j sync has completed
        before attempting to query temporal data.
        
        Returns:
            True if Observation nodes exist, False otherwise
        """
        if not self.driver:
            raise ConnectionError("Not connected to Neo4j")
        
        query = "MATCH (o:Observation) RETURN count(o) as count LIMIT 1"
        
        try:
            # Temporarily suppress Neo4j driver notifications during readiness check
            # These notifications are expected when checking if data exists
            neo4j_logger = logging.getLogger('neo4j')
            original_level = neo4j_logger.level
            neo4j_logger.setLevel(logging.ERROR)
            
            try:
                with self.driver.session(database=self.database) as session:
                    result = session.run(query)
                    record = result.single()
                    if record and record['count'] > 0:
                        return True
                    return False
            finally:
                # Restore original logging level
                neo4j_logger.setLevel(original_level)
                
        except Exception as e:
            # If query fails (e.g., label doesn't exist), return False
            # No logging needed - this is expected during readiness checks
            return False
    
    def check_has_observation_relationship_exists(self) -> bool:
        """
        Check if HAS_OBSERVATION relationships exist in Neo4j database.
        
        Returns:
            True if relationships exist, False otherwise
        """
        if not self.driver:
            raise ConnectionError("Not connected to Neo4j")
        
        query = "MATCH ()-[r:HAS_OBSERVATION]->() RETURN count(r) as count LIMIT 1"
        
        try:
            # Temporarily suppress Neo4j driver notifications during readiness check
            neo4j_logger = logging.getLogger('neo4j')
            original_level = neo4j_logger.level
            neo4j_logger.setLevel(logging.ERROR)
            
            try:
                with self.driver.session(database=self.database) as session:
                    result = session.run(query)
                    record = result.single()
                    if record and record['count'] > 0:
                        return True
                    return False
            finally:
                neo4j_logger.setLevel(original_level)
                
        except Exception as e:
            # Expected during readiness checks when relationships don't exist yet
            return False
    
    def is_ready_for_pattern_analysis(self) -> Tuple[bool, str]:
        """
        Comprehensive readiness check for pattern analysis.
        
        Verifies that:
        1. Observation nodes exist
        2. HAS_OBSERVATION relationships exist
        3. Cameras are connected to observations
        
        Returns:
            Tuple of (is_ready: bool, reason: str)
        """
        if not self.driver:
            return False, "Not connected to Neo4j"
        
        # Check 1: Observation nodes exist
        if not self.check_observation_nodes_exist():
            return False, "Observation nodes not found - Neo4j sync may not have completed yet"
        
        # Check 2: HAS_OBSERVATION relationships exist
        if not self.check_has_observation_relationship_exists():
            return False, "HAS_OBSERVATION relationships not found - data sync incomplete"
        
        # Check 3: Verify at least one camera has observations
        query = """
        MATCH (c:Camera)-[:HAS_OBSERVATION]->(o:Observation)
        RETURN count(o) as count LIMIT 1
        """
        
        try:
            # Temporarily suppress Neo4j driver notifications during readiness check
            neo4j_logger = logging.getLogger('neo4j')
            original_level = neo4j_logger.level
            neo4j_logger.setLevel(logging.ERROR)
            
            try:
                with self.driver.session(database=self.database) as session:
                    result = session.run(query)
                    record = result.single()
                    if not record or record['count'] == 0:
                        return False, "No cameras connected to observations yet"
            finally:
                neo4j_logger.setLevel(original_level)
                
        except Exception as e:
            return False, f"Readiness verification failed: {e}"
        
        return True, "Neo4j ready for pattern analysis"
    
    def get_all_cameras(self) -> List[str]:
        """
        Get list of all camera IDs in graph.
        
        Returns:
            List of camera entity IDs
        """
        if not self.driver:
            raise ConnectionError("Not connected to Neo4j")
        
        query = "MATCH (c:Camera) RETURN c.id AS camera_id"
        
        with self.driver.session(database=self.database) as session:
            result = session.run(query)
            return [record['camera_id'] for record in result]


# ============================================================================
# Time-Series Analyzer
# ============================================================================

class TimeSeriesAnalyzer:
    """Analyze time-series data for patterns and statistics."""
    
    def __init__(self, data: List[Dict[str, Any]], metrics: List[str]):
        """
        Initialize analyzer with temporal data.
        
        Args:
            data: List of observations with timestamps
            metrics: List of metric names to analyze
        """
        self.data = data
        self.metrics = metrics
        
        # Convert to pandas DataFrame if available
        if PANDAS_AVAILABLE and data:
            self.df = pd.DataFrame(data)
            if 'timestamp' in self.df.columns:
                self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
                self.df.set_index('timestamp', inplace=True)
        else:
            self.df = None
    
    def get_hourly_aggregates(self, metric: str) -> Dict[int, Dict[str, float]]:
        """
        Calculate hourly aggregates (mean, std, count) for a metric.
        
        Args:
            metric: Metric name
        
        Returns:
            Dictionary mapping hour (0-23) to statistics
        """
        hourly_stats = defaultdict(lambda: {'values': []})
        
        for obs in self.data:
            if metric not in obs or obs[metric] is None:
                continue
            
            timestamp = obs['timestamp']
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            hour = timestamp.hour
            hourly_stats[hour]['values'].append(float(obs[metric]))
        
        # Calculate statistics
        result = {}
        for hour, stats in hourly_stats.items():
            values = stats['values']
            if values:
                result[hour] = {
                    'mean': statistics.mean(values),
                    'std': statistics.stdev(values) if len(values) > 1 else 0.0,
                    'count': len(values),
                    'min': min(values),
                    'max': max(values)
                }
        
        return result
    
    def get_daily_aggregates(self, metric: str) -> Dict[str, Dict[str, float]]:
        """
        Calculate daily aggregates for a metric.
        
        Args:
            metric: Metric name
        
        Returns:
            Dictionary mapping date (YYYY-MM-DD) to statistics
        """
        daily_stats = defaultdict(lambda: {'values': []})
        
        for obs in self.data:
            if metric not in obs or obs[metric] is None:
                continue
            
            timestamp = obs['timestamp']
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            date_key = timestamp.strftime('%Y-%m-%d')
            daily_stats[date_key]['values'].append(float(obs[metric]))
        
        # Calculate statistics
        result = {}
        for date, stats in daily_stats.items():
            values = stats['values']
            if values:
                result[date] = {
                    'mean': statistics.mean(values),
                    'std': statistics.stdev(values) if len(values) > 1 else 0.0,
                    'count': len(values),
                    'min': min(values),
                    'max': max(values)
                }
        
        return result
    
    def get_weekday_aggregates(self, metric: str) -> Dict[int, Dict[str, float]]:
        """
        Calculate weekday aggregates (0=Monday, 6=Sunday) for a metric.
        
        Args:
            metric: Metric name
        
        Returns:
            Dictionary mapping weekday to statistics
        """
        weekday_stats = defaultdict(lambda: {'values': []})
        
        for obs in self.data:
            if metric not in obs or obs[metric] is None:
                continue
            
            timestamp = obs['timestamp']
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            weekday = timestamp.weekday()
            weekday_stats[weekday]['values'].append(float(obs[metric]))
        
        # Calculate statistics
        result = {}
        for weekday, stats in weekday_stats.items():
            values = stats['values']
            if values:
                result[weekday] = {
                    'mean': statistics.mean(values),
                    'std': statistics.stdev(values) if len(values) > 1 else 0.0,
                    'count': len(values),
                    'min': min(values),
                    'max': max(values)
                }
        
        return result
    
    def calculate_zscore(self, metric: str) -> List[Tuple[datetime, float, float]]:
        """
        Calculate z-scores for anomaly detection.
        
        Args:
            metric: Metric name
        
        Returns:
            List of (timestamp, value, z_score) tuples
        """
        values = []
        timestamps = []
        
        for obs in self.data:
            if metric not in obs or obs[metric] is None:
                continue
            
            timestamp = obs['timestamp']
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            timestamps.append(timestamp)
            values.append(float(obs[metric]))
        
        if len(values) < 2:
            return []
        
        mean_val = statistics.mean(values)
        std_val = statistics.stdev(values)
        
        if std_val == 0:
            return [(ts, val, 0.0) for ts, val in zip(timestamps, values)]
        
        z_scores = [(ts, val, (val - mean_val) / std_val)
                    for ts, val in zip(timestamps, values)]
        
        return z_scores


# ============================================================================
# Pattern Detector
# ============================================================================

class PatternDetector:
    """Detect traffic patterns (rush hours, weekly trends, anomalies)."""
    
    def __init__(self, config: Dict[str, Any], analyzer: TimeSeriesAnalyzer):
        """
        Initialize pattern detector.
        
        Args:
            config: Pattern detection configuration
            analyzer: TimeSeriesAnalyzer instance
        """
        self.config = config
        self.analyzer = analyzer
    
    def detect_rush_hours(self, metric: str = 'intensity') -> List[Dict[str, Any]]:
        """
        Detect rush hour periods based on traffic intensity/occupancy.
        
        Args:
            metric: Metric to analyze (intensity, occupancy)
        
        Returns:
            List of rush hour detections with hour and intensity
        """
        rush_config = self.config.get('rush_hours', {})
        morning_start = rush_config.get('morning', {}).get('start', 7)
        morning_end = rush_config.get('morning', {}).get('end', 9)
        evening_start = rush_config.get('evening', {}).get('start', 17)
        evening_end = rush_config.get('evening', {}).get('end', 19)
        
        intensity_threshold = rush_config.get('intensity_threshold', 0.7)
        occupancy_threshold = rush_config.get('occupancy_threshold', 0.6)
        
        threshold = intensity_threshold if metric == 'intensity' else occupancy_threshold
        
        hourly_stats = self.analyzer.get_hourly_aggregates(metric)
        
        rush_hours = []
        for hour, stats in hourly_stats.items():
            if stats['mean'] >= threshold:
                period = None
                if morning_start <= hour < morning_end:
                    period = 'morning'
                elif evening_start <= hour < evening_end:
                    period = 'evening'
                
                rush_hours.append({
                    'hour': hour,
                    'period': period,
                    'intensity': stats['mean'],
                    'confidence': min(stats['mean'] / threshold, 1.0)
                })
        
        return sorted(rush_hours, key=lambda x: x['hour'])
    
    def detect_anomalies(
        self,
        metric: str = 'intensity',
        threshold: float = 2.5,
        min_samples: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Detect anomalies using z-score method.
        
        Args:
            metric: Metric to analyze
            threshold: Z-score threshold for anomaly detection
            min_samples: Minimum samples required
        
        Returns:
            List of anomaly detections
        """
        if len(self.analyzer.data) < min_samples:
            return []
        
        z_scores = self.analyzer.calculate_zscore(metric)
        
        anomalies = []
        for timestamp, value, z_score in z_scores:
            if abs(z_score) > threshold:
                anomalies.append({
                    'timestamp': timestamp.isoformat(),
                    'value': value,
                    'z_score': z_score,
                    'severity': 'high' if abs(z_score) > threshold * 1.5 else 'medium'
                })
        
        return anomalies
    
    def detect_weekly_patterns(self, metric: str = 'intensity') -> Dict[str, Any]:
        """
        Detect weekly patterns (weekday vs weekend differences).
        
        Args:
            metric: Metric to analyze
        
        Returns:
            Dictionary with weekday statistics and comparison
        """
        weekday_stats = self.analyzer.get_weekday_aggregates(metric)
        
        if not weekday_stats:
            return {}
        
        # Separate weekdays (0-4) and weekends (5-6)
        weekday_values = [stats['mean'] for day, stats in weekday_stats.items() if day < 5]
        weekend_values = [stats['mean'] for day, stats in weekday_stats.items() if day >= 5]
        
        result = {
            'weekday_stats': {day: stats for day, stats in weekday_stats.items() if day < 5},
            'weekend_stats': {day: stats for day, stats in weekday_stats.items() if day >= 5}
        }
        
        if weekday_values and weekend_values:
            result['comparison'] = {
                'weekday_avg': statistics.mean(weekday_values),
                'weekend_avg': statistics.mean(weekend_values),
                'difference': statistics.mean(weekday_values) - statistics.mean(weekend_values),
                'pattern': 'weekday_higher' if statistics.mean(weekday_values) > statistics.mean(weekend_values) else 'weekend_higher'
            }
        
        return result


# ============================================================================
# Forecast Engine
# ============================================================================

class ForecastEngine:
    """Generate forecasts using time-series models."""
    
    def __init__(self, config: Dict[str, Any], analyzer: TimeSeriesAnalyzer):
        """
        Initialize forecast engine.
        
        Args:
            config: Forecasting configuration
            analyzer: TimeSeriesAnalyzer instance
        """
        self.config = config
        self.analyzer = analyzer
        self.method = config.get('method', 'moving_average')
    
    def forecast_next_hour(self, metric: str = 'intensity') -> Dict[str, float]:
        """
        Forecast next hour value using configured method.
        
        Args:
            metric: Metric to forecast
        
        Returns:
            Dictionary with forecast value and confidence
        """
        if not self.analyzer.data:
            return {'forecast': 0.0, 'confidence': 0.0}
        
        if self.method == 'moving_average':
            return self._moving_average_forecast(metric)
        elif self.method == 'exponential_smoothing':
            return self._exponential_smoothing_forecast(metric)
        elif self.method == 'arima':
            return self._arima_forecast(metric)
        else:
            raise ValueError(f"Unknown forecasting method: {self.method}")
    
    def _moving_average_forecast(self, metric: str) -> Dict[str, float]:
        """Moving average forecast."""
        window = self.config.get('window', 7)
        
        # Get recent values
        values = []
        for obs in reversed(self.analyzer.data):
            if metric in obs and obs[metric] is not None:
                values.append(float(obs[metric]))
                if len(values) >= window:
                    break
        
        if not values:
            return {'forecast': 0.0, 'confidence': 0.0}
        
        forecast = statistics.mean(values)
        confidence = self.config.get('confidence_level', 0.75)
        
        return {
            'forecast': forecast,
            'confidence': confidence,
            'method': 'moving_average',
            'window': len(values)
        }
    
    def _exponential_smoothing_forecast(self, metric: str) -> Dict[str, float]:
        """Exponential smoothing forecast."""
        alpha = self.config.get('alpha', 0.3)
        
        # Get values in chronological order
        values = []
        for obs in self.analyzer.data:
            if metric in obs and obs[metric] is not None:
                values.append(float(obs[metric]))
        
        if not values:
            return {'forecast': 0.0, 'confidence': 0.0}
        
        # Apply exponential smoothing
        smoothed = values[0]
        for value in values[1:]:
            smoothed = alpha * value + (1 - alpha) * smoothed
        
        forecast = smoothed
        confidence = self.config.get('confidence_level', 0.75)
        
        return {
            'forecast': forecast,
            'confidence': confidence,
            'method': 'exponential_smoothing',
            'alpha': alpha
        }
    
    def _arima_forecast(self, metric: str) -> Dict[str, float]:
        """ARIMA forecast (requires statsmodels)."""
        if not STATSMODELS_AVAILABLE:
            # Fallback to moving average
            return self._moving_average_forecast(metric)
        
        arima_config = self.config.get('arima', {})
        p = arima_config.get('p', 1)
        d = arima_config.get('d', 1)
        q = arima_config.get('q', 1)
        
        # Get values
        values = []
        for obs in self.analyzer.data:
            if metric in obs and obs[metric] is not None:
                values.append(float(obs[metric]))
        
        if len(values) < 10:
            # Not enough data for ARIMA
            return self._moving_average_forecast(metric)
        
        try:
            model = ARIMA(values, order=(p, d, q))
            fitted = model.fit()
            forecast_result = fitted.forecast(steps=1)
            
            forecast = float(forecast_result[0]) if hasattr(forecast_result, '__getitem__') else float(forecast_result)
            confidence = self.config.get('confidence_level', 0.75)
            
            return {
                'forecast': forecast,
                'confidence': confidence,
                'method': 'arima',
                'order': (p, d, q)
            }
        except Exception as e:
            logging.warning(f"ARIMA forecast failed: {e}. Using moving average fallback.")
            return self._moving_average_forecast(metric)


# ============================================================================
# Pattern Recognition Agent
# ============================================================================

class PatternRecognitionAgent:
    """Main orchestrator for pattern recognition pipeline."""
    
    def __init__(self, config_path: str):
        """
        Initialize pattern recognition agent.
        
        Args:
            config_path: Path to YAML configuration file
        """
        self.config = PatternConfig(config_path)
        
        # Initialize Neo4j connector
        neo4j_config = self.config.get_neo4j_config()
        self.neo4j = Neo4jConnector(neo4j_config)
        
        # HTTP session for Stellio
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
        })
        
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger('PatternRecognitionAgent')
    
    def analyze_camera_patterns(
        self,
        camera_id: str,
        time_window: str = '7_days'
    ) -> Dict[str, Any]:
        """
        Analyze patterns for a single camera.
        
        Args:
            camera_id: Camera entity ID
            time_window: Time window for analysis (1_hour, 1_day, 7_days, 30_days)
        
        Returns:
            Dictionary with pattern analysis results or skip status
        """
        # ============================================================
        # CRITICAL: Neo4j Readiness Check
        # ============================================================
        # Pattern recognition requires Observation nodes and relationships
        # to exist in Neo4j. If Neo4j sync hasn't completed yet, we skip
        # analysis gracefully instead of generating warnings/errors.
        
        is_ready, reason = self.neo4j.is_ready_for_pattern_analysis()
        
        if not is_ready:
            self.logger.info(f"Skipping pattern analysis: {reason}")
            return {
                'status': 'skipped',
                'reason': reason,
                'camera_id': camera_id,
                'time_window': time_window,
                'message': 'Pattern analysis will run after Neo4j sync completes'
            }
        
        # ============================================================
        # Proceed with Pattern Analysis
        # ============================================================
        
        # Calculate time range
        end_time = datetime.now()
        if time_window == '1_hour':
            start_time = end_time - timedelta(hours=1)
        elif time_window == '1_day':
            start_time = end_time - timedelta(days=1)
        elif time_window == '7_days':
            start_time = end_time - timedelta(days=7)
        elif time_window == '30_days':
            start_time = end_time - timedelta(days=30)
        else:
            raise ValueError(f"Invalid time window: {time_window}")
        
        # Query temporal data
        analysis_config = self.config.get_analysis_config()
        metrics = analysis_config['metrics']
        
        try:
            data = self.neo4j.query_temporal_data(camera_id, start_time, end_time, metrics)
        except Exception as e:
            self.logger.error(f"Failed to query Neo4j for camera {camera_id}: {e}")
            return {
                'status': 'failed',
                'reason': f"Neo4j query error: {str(e)}",
                'camera_id': camera_id,
                'time_window': time_window
            }
        
        if not data:
            # CRITICAL FIX: Change to DEBUG level - this is expected when no historical data exists yet
            self.logger.debug(f"No data found for camera {camera_id} in window {time_window}")
            return {
                'status': 'no_data',
                'reason': 'No observations found in time window',
                'camera_id': camera_id,
                'time_window': time_window,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat()
            }
        
        # Initialize analyzer
        analyzer = TimeSeriesAnalyzer(data, metrics)
        
        # Detect patterns
        patterns_config = self.config.get_patterns_config()
        detector = PatternDetector(patterns_config, analyzer)
        
        results = {
            'status': 'success',
            'camera_id': camera_id,
            'time_window': time_window,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'data_points': len(data)
        }
        
        # Rush hours
        rush_hours = detector.detect_rush_hours('intensity')
        results['rush_hours'] = rush_hours
        
        # Anomalies
        anomaly_config = patterns_config.get('anomaly_detection', {})
        if anomaly_config.get('enabled', True):
            anomaly_threshold = anomaly_config.get('z_score_threshold', anomaly_config.get('threshold', 2.5))
            min_samples = anomaly_config.get('min_samples', 30)
            anomalies = detector.detect_anomalies('intensity', anomaly_threshold, min_samples)
            results['anomalies'] = anomalies
        
        # Weekly patterns
        if patterns_config.get('weekly_patterns', {}).get('enabled', True):
            weekly = detector.detect_weekly_patterns('intensity')
            results['weekly_patterns'] = weekly
        
        # Forecasting
        forecasting_config = self.config.get_forecasting_config()
        if forecasting_config.get('enabled', True):
            forecast_engine = ForecastEngine(forecasting_config, analyzer)
            if forecasting_config.get('horizon', {}).get('next_hour', True):
                forecast = forecast_engine.forecast_next_hour('intensity')
                results['forecast'] = forecast
        
        return results
    
    def create_pattern_entity(
        self,
        camera_id: str,
        pattern_type: str,
        analysis_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create TrafficPattern NGSI-LD entity.
        
        Args:
            camera_id: Camera entity ID
            pattern_type: Pattern type (hourly, daily, weekly)
            analysis_results: Pattern analysis results
        
        Returns:
            TrafficPattern entity
        """
        entity_config = self.config.get_entity_config()
        id_prefix = entity_config['id_prefix']
        
        # Generate entity ID
        timestamp_str = datetime.now().strftime('%Y%m%d-%H%M%S')
        camera_short = camera_id.split(':')[-1] if ':' in camera_id else camera_id
        entity_id = f"{id_prefix}{camera_short}-{pattern_type}-{timestamp_str}"
        
        entity = {
            '@context': 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld',
            'id': entity_id,
            'type': entity_config['type'],
            'patternType': {
                'type': 'Property',
                'value': pattern_type
            },
            'analysisWindow': {
                'type': 'Property',
                'value': {
                    'start': analysis_results.get('start_time'),
                    'end': analysis_results.get('end_time'),
                    'dataPoints': analysis_results.get('data_points', 0)
                }
            }
        }
        
        # Add relationship to camera
        if entity_config.get('relationships', {}).get('link_to_camera', True):
            entity['refCamera'] = {
                'type': 'Relationship',
                'object': camera_id
            }
        
        # Add rush hours
        if 'rush_hours' in analysis_results:
            entity['rushHours'] = {
                'type': 'Property',
                'value': analysis_results['rush_hours']
            }
        
        # Add forecast
        if 'forecast' in analysis_results:
            entity['forecast'] = {
                'type': 'Property',
                'value': analysis_results['forecast']
            }
        
        # Add anomalies count
        if 'anomalies' in analysis_results:
            entity['anomalyCount'] = {
                'type': 'Property',
                'value': len(analysis_results['anomalies'])
            }
        
        # Add weekly patterns
        if 'weekly_patterns' in analysis_results and analysis_results['weekly_patterns']:
            entity['weeklyPattern'] = {
                'type': 'Property',
                'value': analysis_results['weekly_patterns'].get('comparison', {})
            }
        
        return entity
    
    def post_entity(self, entity: Dict[str, Any]) -> bool:
        """
        POST entity to Stellio Context Broker.
        
        Args:
            entity: NGSI-LD entity
        
        Returns:
            True if successful, False otherwise
        """
        stellio_config = self.config.get_stellio_config()
        # Config has endpoints.create_entity, not create_endpoint
        endpoints = stellio_config.get('endpoints', {})
        create_endpoint = endpoints.get('create_entity', '/ngsi-ld/v1/entities')
        url = f"{stellio_config['base_url']}{create_endpoint}"
        
        try:
            response = self.session.post(url, json=entity, timeout=30)
            if response.status_code in [201, 204]:
                self.logger.info(f"Created entity: {entity['id']}")
                return True
            else:
                self.logger.error(f"Failed to create entity: {response.status_code} {response.text}")
                return False
        except Exception as e:
            self.logger.error(f"Error posting entity: {e}")
            return False
    
    def process_all_cameras(self, time_window: str = '7_days') -> Dict[str, Any]:
        """
        Process all cameras in Neo4j graph.
        
        Args:
            time_window: Time window for analysis
        
        Returns:
            Summary of processing results
        """
        # ============================================================
        # CRITICAL: Neo4j Readiness Check (Global)
        # ============================================================
        # Check if Neo4j is ready before processing any cameras
        
        is_ready, reason = self.neo4j.is_ready_for_pattern_analysis()
        
        if not is_ready:
            self.logger.info(f"Skipping pattern recognition for all cameras: {reason}")
            
            # ============================================================
            # CRITICAL FIX: Write empty LIST (not dict) when skipped
            # ============================================================
            # Downstream validation agents expect a LIST of entities, not a dict
            # Return empty list to maintain data structure compatibility
            empty_patterns_list = []
            
            # ALWAYS write output file as empty list
            output_config = self.config.get_output_config()
            patterns_file = output_config.get('patterns_file', 'data/patterns.json')
            self._save_results(empty_patterns_list, patterns_file)
            
            # Return summary dict for orchestrator/logging
            skipped_summary = {
                'status': 'skipped',
                'reason': reason,
                'message': 'Pattern analysis will run after Neo4j sync completes',
                'cameras_processed': 0,
                'entities_created': 0,
                'failures': []
            }
            
            return skipped_summary
        
        # ============================================================
        # Proceed with Camera Processing
        # ============================================================
        
        try:
            cameras = self.neo4j.get_all_cameras()
        except Exception as e:
            self.logger.error(f"Failed to get cameras from Neo4j: {e}")
            return {
                'status': 'failed',
                'cameras_processed': 0,
                'entities_created': 0,
                'failures': [],
                'error': str(e)
            }
        
        if not cameras:
            self.logger.warning("No cameras found in Neo4j")
            return {
                'status': 'no_cameras',
                'cameras_processed': 0,
                'entities_created': 0,
                'failures': []
            }
        
        self.logger.info(f"Processing {len(cameras)} cameras...")
        
        results = {
            'status': 'success',
            'cameras_processed': 0,
            'entities_created': 0,
            'skipped': 0,
            'failures': []
        }
        
        entity_config = self.config.get_entity_config()
        pattern_types = entity_config.get('pattern_types', ['hourly', 'daily', 'weekly'])
        
        for camera_id in cameras:
            try:
                # Analyze patterns
                analysis = self.analyze_camera_patterns(camera_id, time_window)
                
                # Check if analysis was skipped or failed
                if not analysis or analysis.get('status') in ['skipped', 'failed', 'no_data']:
                    if analysis.get('status') == 'skipped':
                        results['skipped'] += 1
                    continue
                
                results['cameras_processed'] += 1
                
                # Create entities for each pattern type
                for pattern_type in pattern_types:
                    entity = self.create_pattern_entity(camera_id, pattern_type, analysis)
                    if self.post_entity(entity):
                        results['entities_created'] += 1
                
            except Exception as e:
                self.logger.error(f"Error processing camera {camera_id}: {e}")
                results['failures'].append({'camera': camera_id, 'error': str(e)})
        
        # ============================================================
        # CRITICAL FIX: ALWAYS save output file
        # ============================================================
        # Save output to file (even if no patterns found)
        output_config = self.config.get_output_config()
        patterns_file = output_config.get('patterns_file', 'data/patterns.json')
        self._save_results(results, patterns_file)
        
        return results
    
    def _save_results(self, results: Dict[str, Any], filepath: str):
        """Save analysis results to JSON file."""
        try:
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)
            self.logger.info(f"Saved results to {filepath}")
        except Exception as e:
            self.logger.error(f"Failed to save results: {e}")
    
    def close(self):
        """Clean up resources."""
        if self.neo4j:
            self.neo4j.close()
        if self.session:
            self.session.close()


# ============================================================================
# Main Entry Point
# ============================================================================

def main(config: Optional[Dict[str, Any]] = None):
    """Main entry point for pattern recognition agent.
    
    Args:
        config: Optional workflow agent config (from orchestrator)
    """
    import argparse
    
    # Use config from orchestrator if provided
    if config:
        config_path = config.get('config_path', 'config/pattern_config.yaml')
        camera_id = config.get('camera_id')
        time_window = config.get('time_window', '7_days')
    else:
        parser = argparse.ArgumentParser(description='Pattern Recognition Agent')
        parser.add_argument('--config', required=True, help='Path to configuration file')
        parser.add_argument('--camera', help='Process specific camera ID')
        parser.add_argument('--time-window', default='7_days', 
                           choices=['1_hour', '1_day', '7_days', '30_days'],
                           help='Time window for analysis')
        
        args = parser.parse_args()
        config_path = args.config
        camera_id = args.camera
        time_window = args.time_window
    
    agent = PatternRecognitionAgent(config_path)
    
    try:
        if camera_id:
            # Process single camera
            results = agent.analyze_camera_patterns(camera_id, time_window)
            print(json.dumps(results, indent=2))
        else:
            # Process all cameras
            results = agent.process_all_cameras(time_window)
            print(f"Processed {results['cameras_processed']} cameras, "
                  f"created {results['entities_created']} entities")
    finally:
        agent.close()


if __name__ == '__main__':
    main()
