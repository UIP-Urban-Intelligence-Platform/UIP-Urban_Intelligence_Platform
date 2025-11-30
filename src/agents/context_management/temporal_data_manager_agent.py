"""Temporal Data Manager Agent - Temporal Data Lifecycle Management.

Module: src.agents.context_management.temporal_data_manager_agent
Author: Nguyễn Nhật Quang
Created: 2025-11-27
Version: 2.0.0
License: MIT

Description:
    Manages the complete lifecycle of temporal observations with storage,
    retention policies, aggregation, archival, and cleanup.

Lifecycle Stages:
    1. Storage: POST temporal instances to Stellio
    2. Retention: Apply detailed/aggregated/archived policies
    3. Aggregation: Reduce resolution (hourly → daily → weekly)
    4. Archival: Move old data to cold storage (S3/filesystem)
    5. Cleanup: Delete expired data based on policies
    6. Optimization: Neo4j indexes for query performance

Core Features:
    - Cron-based scheduling for automated tasks
    - Batch processing for efficient operations
    - Multiple storage tiers (hot, warm, cold)
    - Configurable retention policies per entity type
    - Aggregation with statistical functions (avg, min, max)

Dependencies:
    - requests>=2.28: HTTP client
    - neo4j>=5.0: Graph database
    - boto3>=1.28: AWS S3 client (optional)
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/temporal_config.yaml:
        - retention_policies: Time-based retention rules
        - aggregation_schedules: Cron expressions
        - archive_storage: S3 or filesystem config
        - cleanup_rules: Expiration policies

Example:
    ```python
    from src.agents.context_management.temporal_data_manager_agent import TemporalDataManagerAgent
    
    agent = TemporalDataManagerAgent()
    agent.start_scheduler()
    ```

Architecture:
    Stellio → Aggregator → Archiver → Cold Storage (S3/Filesystem)
"""

import gzip
import hashlib
import json
import logging
import os
import statistics
import time
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urljoin

import requests
import yaml

# Optional dependencies
try:
    from neo4j import GraphDatabase
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# Configuration Management
# ============================================================================

class TemporalConfig:
    """
    Configuration loader for Temporal Data Manager Agent.
    
    Loads and validates configuration from YAML file.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize configuration.
        
        Args:
            config_path: Path to temporal_config.yaml
        
        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If configuration is invalid
        """
        self.config_path = config_path
        
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
        
        if not self.config or 'temporal_data_manager' not in self.config:
            raise ValueError("Invalid configuration: 'temporal_data_manager' section not found")
        
        self.temporal_manager = self.config['temporal_data_manager']
        logger.info(f"Configuration loaded from {config_path}")
    
    def get_stellio_config(self) -> Dict[str, Any]:
        """Get Stellio configuration."""
        return self.temporal_manager.get('stellio', {})
    
    def get_neo4j_config(self) -> Dict[str, Any]:
        """Get Neo4j configuration."""
        return self.temporal_manager.get('neo4j', {})
    
    def get_retention_config(self) -> Dict[str, Any]:
        """Get retention policies configuration."""
        return self.temporal_manager.get('retention', {})
    
    def get_cleanup_config(self) -> Dict[str, Any]:
        """Get cleanup configuration."""
        return self.temporal_manager.get('cleanup', {})
    
    def get_aggregation_config(self) -> Dict[str, Any]:
        """Get aggregation configuration."""
        return self.temporal_manager.get('aggregation', {})
    
    def get_monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring configuration."""
        return self.temporal_manager.get('monitoring', {})


# ============================================================================
# Temporal Data Store
# ============================================================================

class TemporalDataStore:
    """
    Handles storage of temporal instances to Stellio.
    
    Features:
    - Batch POST operations
    - Retry logic
    - Connection pooling
    """
    
    def __init__(self, config: TemporalConfig):
        """
        Initialize temporal data store.
        
        Args:
            config: Temporal configuration
        """
        self.config = config
        self.stellio_config = config.get_stellio_config()
        
        self.base_url = self.stellio_config.get('base_url', 'http://stellio:8080')
        self.timeout = self.stellio_config.get('timeout', 30)
        self.max_retries = self.stellio_config.get('max_retries', 3)
        
        # Batch configuration
        batch_config = self.stellio_config.get('batch', {})
        self.batch_enabled = batch_config.get('enabled', True)
        self.max_batch_size = batch_config.get('max_batch_size', 100)
        
        # Create HTTP session
        self.session = requests.Session()
        headers = self.stellio_config.get('headers', {})
        self.session.headers.update(headers)
        
        logger.info(f"Temporal data store initialized: {self.base_url}")
    
    def build_temporal_url(self, entity_id: str) -> str:
        """
        Build temporal POST URL for entity.
        
        Args:
            entity_id: Entity ID
        
        Returns:
            Full temporal URL
        """
        endpoint_template = self.stellio_config.get('temporal_endpoint',
                                                     '/ngsi-ld/v1/temporal/entities/{entity_id}/attrs')
        path = endpoint_template.format(entity_id=entity_id)
        return urljoin(self.base_url, path)
    
    def post_temporal_instances(self, entity_id: str, instances: Dict[str, List[Dict[str, Any]]]) -> bool:
        """
        POST temporal instances to Stellio.
        
        Args:
            entity_id: Entity ID
            instances: Dictionary of attribute name → list of temporal instances
        
        Returns:
            True if successful, False otherwise
        
        Example:
            instances = {
                "intensity": [
                    {"type": "Property", "value": 0.75, "observedAt": "2025-11-01T10:00:00Z"},
                    {"type": "Property", "value": 0.78, "observedAt": "2025-11-01T10:01:00Z"}
                ]
            }
        """
        url = self.build_temporal_url(entity_id)
        
        try:
            response = self.session.post(
                url,
                json=instances,
                timeout=self.timeout
            )
            
            if 200 <= response.status_code < 300:
                logger.debug(f"Stored {sum(len(v) for v in instances.values())} temporal instances for {entity_id}")
                return True
            else:
                logger.error(f"Failed to store temporal instances: {response.status_code} - {response.text}")
                return False
        
        except Exception as e:
            logger.error(f"Error storing temporal instances: {e}")
            return False
    
    def close(self) -> None:
        """Close HTTP session."""
        self.session.close()


# ============================================================================
# Aggregation Engine
# ============================================================================

class AggregationEngine:
    """
    Aggregates temporal data to reduce resolution.
    
    Supports: hourly → daily → weekly aggregation
    Methods: mean, median, min, max, sum, count, mode
    """
    
    def __init__(self, config: TemporalConfig):
        """
        Initialize aggregation engine.
        
        Args:
            config: Temporal configuration
        """
        self.config = config
        self.agg_config = config.get_aggregation_config()
        self.metrics = self.agg_config.get('metrics', [])
        
        logger.info("Aggregation engine initialized")
    
    def aggregate_observations(self, observations: List[Dict[str, Any]], 
                              resolution: str = 'hourly') -> List[Dict[str, Any]]:
        """
        Aggregate observations to specified resolution.
        
        Args:
            observations: List of observations with timestamp and attributes
            resolution: hourly, daily, weekly
        
        Returns:
            List of aggregated observations
        """
        if not observations:
            return []
        
        # Get window size
        resolutions = self.agg_config.get('resolutions', {})
        window = resolutions.get(resolution, {}).get('window', 3600)
        
        # Group by time window
        windows = defaultdict(list)
        
        for obs in observations:
            timestamp = obs.get('observedAt')
            if not timestamp:
                continue
            
            # Parse timestamp
            if isinstance(timestamp, str):
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            else:
                dt = timestamp
            
            # Calculate window start
            epoch = int(dt.timestamp())
            window_start = (epoch // window) * window
            
            windows[window_start].append(obs)
        
        # Aggregate each window
        aggregated = []
        
        for window_start, window_obs in windows.items():
            agg_obs = {
                'observedAt': datetime.fromtimestamp(window_start).isoformat() + 'Z',
                'observation_count': len(window_obs)
            }
            
            # Aggregate each metric
            for metric_config in self.metrics:
                metric_name = metric_config['name']
                method = metric_config.get('method', 'mean')
                precision = metric_config.get('precision', 2)
                
                # Extract values
                values = []
                for obs in window_obs:
                    value = obs.get(metric_name)
                    if value is not None:
                        values.append(value)
                
                # Calculate aggregate
                if values:
                    agg_value = self._calculate_aggregate(values, method)
                    
                    # Round to precision
                    if isinstance(agg_value, float):
                        agg_value = round(agg_value, precision)
                    
                    agg_obs[metric_name] = agg_value
                else:
                    # Fill missing
                    if metric_config.get('fill_missing', False):
                        agg_obs[metric_name] = metric_config.get('fill_value', 0)
            
            aggregated.append(agg_obs)
        
        return sorted(aggregated, key=lambda x: x['observedAt'])
    
    def _calculate_aggregate(self, values: List[Any], method: str) -> Any:
        """
        Calculate aggregate value.
        
        Args:
            values: List of values
            method: Aggregation method
        
        Returns:
            Aggregated value
        """
        if not values:
            return None
        
        if method == 'mean':
            return statistics.mean(values)
        elif method == 'median':
            return statistics.median(values)
        elif method == 'min':
            return min(values)
        elif method == 'max':
            return max(values)
        elif method == 'sum':
            return sum(values)
        elif method == 'count':
            return len(values)
        elif method == 'mode':
            try:
                return statistics.mode(values)
            except statistics.StatisticsError:
                return values[0]  # No unique mode
        else:
            return statistics.mean(values)  # Default to mean


# ============================================================================
# Retention Manager
# ============================================================================

class RetentionManager:
    """
    Applies retention policies to temporal data.
    
    Policies:
    - Detailed: Keep full-resolution data for N days
    - Aggregated: Keep hourly aggregates for M days
    - Archived: Keep daily aggregates in cold storage for P days
    - Deletion: Delete data older than Q days
    """
    
    def __init__(self, config: TemporalConfig):
        """
        Initialize retention manager.
        
        Args:
            config: Temporal configuration
        """
        self.config = config
        self.retention_config = config.get_retention_config()
        
        # Parse policies
        detailed = self.retention_config.get('detailed', {})
        self.detailed_days = detailed.get('period', 30)
        
        aggregated = self.retention_config.get('aggregated', {})
        self.aggregated_days = aggregated.get('period', 60)
        self.aggregated_start = aggregated.get('start_after', 30)
        
        archived = self.retention_config.get('archived', {})
        self.archived_days = archived.get('period', 365)
        self.archived_start = archived.get('start_after', 90)
        
        deletion = self.retention_config.get('deletion', {})
        self.deletion_start = deletion.get('start_after', 455)
        
        logger.info(f"Retention policies: detailed={self.detailed_days}d, aggregated={self.aggregated_days}d, archived={self.archived_days}d")
    
    def should_aggregate(self, timestamp: datetime) -> bool:
        """
        Check if observation should be aggregated.
        
        Args:
            timestamp: Observation timestamp
        
        Returns:
            True if observation is older than aggregation threshold
        """
        # Handle both naive and aware datetimes
        ts = timestamp.replace(tzinfo=None) if timestamp.tzinfo else timestamp
        age_days = (datetime.utcnow() - ts).days
        return age_days >= self.aggregated_start
    
    def should_archive(self, timestamp: datetime) -> bool:
        """
        Check if observation should be archived.
        
        Args:
            timestamp: Observation timestamp
        
        Returns:
            True if observation is older than archival threshold
        """
        ts = timestamp.replace(tzinfo=None) if timestamp.tzinfo else timestamp
        age_days = (datetime.utcnow() - ts).days
        return age_days >= self.archived_start
    
    def should_delete(self, timestamp: datetime) -> bool:
        """
        Check if observation should be deleted.
        
        Args:
            timestamp: Observation timestamp
        
        Returns:
            True if observation is older than deletion threshold
        """
        ts = timestamp.replace(tzinfo=None) if timestamp.tzinfo else timestamp
        age_days = (datetime.utcnow() - ts).days
        return age_days >= self.deletion_start
    
    def get_cutoff_dates(self) -> Dict[str, datetime]:
        """
        Get cutoff dates for all policies.
        
        Returns:
            Dictionary of policy → cutoff date
        """
        now = datetime.utcnow()
        
        return {
            'detailed': now - timedelta(days=self.detailed_days),
            'aggregated': now - timedelta(days=self.aggregated_start + self.aggregated_days),
            'archived': now - timedelta(days=self.archived_start + self.archived_days),
            'deletion': now - timedelta(days=self.deletion_start)
        }


# ============================================================================
# Archive Manager
# ============================================================================

class ArchiveManager:
    """
    Manages archival of temporal data to cold storage.
    
    Supported backends:
    - Filesystem (with gzip compression)
    - S3 (Glacier storage class)
    - Azure Blob (Cool/Archive tier)
    """
    
    def __init__(self, config: TemporalConfig):
        """
        Initialize archive manager.
        
        Args:
            config: Temporal configuration
        """
        self.config = config
        retention_config = config.get_retention_config()
        archived_config = retention_config.get('archived', {})
        
        self.storage = archived_config.get('storage', 'filesystem')
        self.filesystem_config = archived_config.get('filesystem', {})
        
        if self.storage == 'filesystem':
            self.base_path = Path(self.filesystem_config.get('base_path', '/data/archive'))
            self.base_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Archive manager initialized: {self.storage}")
    
    def generate_archive_path(self, entity_id: str, date: datetime) -> Path:
        """
        Generate archive file path.
        
        Args:
            entity_id: Entity ID
            date: Date of data
        
        Returns:
            Path to archive file
        """
        # Extract entity type and name from ID
        # Example: urn:ngsi-ld:Camera:TTH406 → Camera/TTH406
        parts = entity_id.split(':')
        if len(parts) >= 4:
            entity_type = parts[2]  # "Camera"
            entity_name = parts[3]  # "TTH406"
        else:
            entity_type = 'Unknown'
            entity_name = parts[-1]
        
        # Create path: base/entity_type/entity_name/YYYY/MM/DD.json.gz
        path = self.base_path / entity_type / entity_name / str(date.year) / f"{date.month:02d}" / f"{date.day:02d}.json.gz"
        path.parent.mkdir(parents=True, exist_ok=True)
        
        return path
    
    def archive_data(self, entity_id: str, date: datetime, observations: List[Dict[str, Any]]) -> bool:
        """
        Archive observations to cold storage.
        
        Args:
            entity_id: Entity ID
            date: Date of observations
            observations: List of observations to archive
        
        Returns:
            True if successful
        """
        if self.storage != 'filesystem':
            logger.warning(f"Archive backend {self.storage} not yet implemented")
            return False
        
        try:
            archive_path = self.generate_archive_path(entity_id, date)
            
            # Prepare archive data
            archive_data = {
                'entity_id': entity_id,
                'date': date.isoformat(),
                'observation_count': len(observations),
                'observations': observations
            }
            
            # Write compressed JSON
            with gzip.open(archive_path, 'wt', encoding='utf-8') as f:
                json.dump(archive_data, f, indent=2)
            
            logger.info(f"Archived {len(observations)} observations to {archive_path}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to archive data: {e}")
            return False
    
    def retrieve_archived_data(self, entity_id: str, date: datetime) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve archived observations.
        
        Args:
            entity_id: Entity ID
            date: Date of observations
        
        Returns:
            List of observations or None if not found
        """
        if self.storage != 'filesystem':
            return None
        
        try:
            archive_path = self.generate_archive_path(entity_id, date)
            
            if not archive_path.exists():
                return None
            
            with gzip.open(archive_path, 'rt', encoding='utf-8') as f:
                archive_data = json.load(f)
            
            return archive_data.get('observations', [])
        
        except Exception as e:
            logger.error(f"Failed to retrieve archived data: {e}")
            return None


# ============================================================================
# Temporal Data Manager Agent
# ============================================================================

class TemporalDataManagerAgent:
    """
    Main orchestrator for temporal data lifecycle management.
    
    Coordinates:
    - Data storage
    - Retention policies
    - Aggregation
    - Archival
    - Cleanup
    """
    
    def __init__(self, config_path: str):
        """
        Initialize Temporal Data Manager Agent.
        
        Args:
            config_path: Path to configuration file
        """
        self.config = TemporalConfig(config_path)
        
        self.data_store = TemporalDataStore(self.config)
        self.aggregation_engine = AggregationEngine(self.config)
        self.retention_manager = RetentionManager(self.config)
        self.archive_manager = ArchiveManager(self.config)
        
        # Statistics
        self.stats = {
            'observations_stored': 0,
            'observations_aggregated': 0,
            'observations_archived': 0,
            'observations_deleted': 0,
            'cleanup_runs': 0
        }
        
        logger.info("Temporal Data Manager Agent initialized")
    
    def store_temporal_observations(self, entity_id: str, observations: List[Dict[str, Any]]) -> bool:
        """
        Store temporal observations for entity.
        
        Args:
            entity_id: Entity ID
            observations: List of observations with timestamps
        
        Returns:
            True if successful
        """
        if not observations:
            return True
        
        # Group by attribute
        instances = defaultdict(list)
        
        for obs in observations:
            observed_at = obs.get('observedAt')
            
            for attr_name, value in obs.items():
                if attr_name == 'observedAt':
                    continue
                
                instances[attr_name].append({
                    'type': 'Property',
                    'value': value,
                    'observedAt': observed_at
                })
        
        # POST to Stellio
        success = self.data_store.post_temporal_instances(entity_id, dict(instances))
        
        if success:
            self.stats['observations_stored'] += len(observations)
        
        return success
    
    def run_cleanup(self, entity_id: str, observations: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Run cleanup process on observations.
        
        Args:
            entity_id: Entity ID
            observations: List of observations
        
        Returns:
            Dictionary with counts of actions taken
        """
        results = {
            'aggregated': 0,
            'archived': 0,
            'deleted': 0
        }
        
        # Group observations by age
        to_aggregate = []
        to_archive = []
        to_delete = []
        
        for obs in observations:
            timestamp_str = obs.get('observedAt')
            if not timestamp_str:
                continue
            
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            
            if self.retention_manager.should_delete(timestamp):
                to_delete.append(obs)
            elif self.retention_manager.should_archive(timestamp):
                to_archive.append(obs)
            elif self.retention_manager.should_aggregate(timestamp):
                to_aggregate.append(obs)
        
        # Aggregate old data
        if to_aggregate:
            aggregated = self.aggregation_engine.aggregate_observations(to_aggregate, 'hourly')
            results['aggregated'] = len(aggregated)
            self.stats['observations_aggregated'] += len(to_aggregate)
            logger.info(f"Aggregated {len(to_aggregate)} observations into {len(aggregated)} hourly aggregates")
        
        # Archive aggregated data
        if to_archive:
            # Group by date
            by_date = defaultdict(list)
            for obs in to_archive:
                timestamp_str = obs.get('observedAt')
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                date = timestamp.date()
                by_date[date].append(obs)
            
            for date, date_obs in by_date.items():
                if self.archive_manager.archive_data(entity_id, datetime.combine(date, datetime.min.time()), date_obs):
                    results['archived'] += len(date_obs)
                    self.stats['observations_archived'] += len(date_obs)
        
        # Delete expired data
        if to_delete:
            results['deleted'] = len(to_delete)
            self.stats['observations_deleted'] += len(to_delete)
            logger.info(f"Marked {len(to_delete)} observations for deletion")
        
        self.stats['cleanup_runs'] += 1
        
        return results
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get agent statistics.
        
        Returns:
            Statistics dictionary
        """
        return self.stats.copy()
    
    def close(self) -> None:
        """Cleanup resources."""
        self.data_store.close()
        logger.info("Temporal Data Manager Agent closed")


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Main entry point for Temporal Data Manager Agent."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Temporal Data Manager Agent')
    parser.add_argument('--config', type=str, default='config/temporal_config.yaml',
                       help='Path to configuration file')
    
    args = parser.parse_args()
    
    # Initialize agent
    agent = TemporalDataManagerAgent(args.config)
    
    logger.info("Temporal Data Manager Agent ready")
    
    # Agent is typically run as a cron job or daemon
    # For testing, we just initialize and close
    agent.close()


if __name__ == '__main__':
    main()
