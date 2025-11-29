"""Entity Publisher Agent - NGSI-LD Publication to Stellio Context Broker.

Module: src.agents.context_management.entity_publisher_agent
Author: Nguyen Viet Hoang
Created: 2025-11-22
Version: 2.0.0
License: MIT

Description:
    Publishes NGSI-LD entities to Stellio Context Broker with comprehensive
    error handling, batch processing, and conflict resolution capabilities.

Core Features:
    - Batch publishing (configurable batch size, default 50)
    - Retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
    - Conflict resolution (HTTP 409 → PATCH update)
    - Token-based authentication support
    - Performance tracking and reporting
    - Detailed error logging

Dependencies:
    - requests>=2.28: HTTP client
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/stellio.yaml:
        - broker_url: Stellio Context Broker endpoint
        - batch_size: Number of entities per batch
        - retry_attempts: Maximum retry count
        - auth_token: Optional authentication token

Example:
    ```python
    from src.agents.context_management.entity_publisher_agent import EntityPublisherAgent
    
    agent = EntityPublisherAgent()
    report = agent.publish_entities(ngsi_ld_entities)
    print(f"Published: {report['successful']}, Failed: {report['failed']}")
    ```

Architecture:
    ConfigLoader → BatchPublisher → Stellio API → PublishReportGenerator
    - Load configuration and entities
    - Split into batches for efficient processing
    - Publish with retry and conflict handling
    - Generate detailed reports
"""


import json
import logging
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import yaml
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class PublishResult:
    """
    Data class to track publishing results for a single entity or batch.
    
    Attributes:
        entity_id: NGSI-LD entity ID
        status_code: HTTP status code from Stellio
        success: Whether the operation succeeded
        error: Error message if failed
        attempts: Number of attempts made
        duration: Time taken for operation (seconds)
    """
    entity_id: str
    status_code: int
    success: bool
    error: Optional[str] = None
    attempts: int = 1
    duration: float = 0.0


@dataclass
class PublishStatistics:
    """
    Data class to track overall publishing statistics.
    
    Attributes:
        total_entities: Total number of entities to publish
        successful: Number of successfully published entities
        failed: Number of failed entities
        duration_seconds: Total duration of publishing process
        errors: List of error details for failed entities
    """
    total_entities: int = 0
    successful: int = 0
    failed: int = 0
    duration_seconds: float = 0.0
    errors: List[Dict[str, Any]] = field(default_factory=list)


class ConfigLoader:
    """
    Load and validate Stellio Context Broker configuration from YAML file.
    
    This class handles:
    - Loading stellio.yaml configuration
    - Environment variable substitution
    - Configuration validation
    - Default value assignment
    """
    
    def __init__(self, config_path: str = "config/stellio.yaml"):
        """
        Initialize ConfigLoader.
        
        Args:
            config_path: Path to stellio.yaml configuration file
        """
        self.config_path = config_path
        self.config = None
        
    def load_config(self) -> Dict[str, Any]:
        """
        Load configuration from YAML file with environment variable substitution.
        
        Returns:
            Dictionary containing Stellio configuration
            
        Raises:
            FileNotFoundError: If config file doesn't exist
            yaml.YAMLError: If config file is invalid YAML
            ValueError: If required config fields are missing
        """
        logger.info(f"Loading Stellio configuration from: {self.config_path}")
        
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise yaml.YAMLError(f"Invalid YAML in configuration file: {e}")
        
        if not self.config or 'stellio' not in self.config:
            raise ValueError("Configuration file must contain 'stellio' section")
        
        # Apply environment variable overrides
        self._apply_env_overrides()
        
        # Validate configuration
        self._validate_config()
        
        logger.info("Stellio configuration loaded successfully")
        return self.config['stellio']
    
    def _apply_env_overrides(self) -> None:
        """
        Apply environment variable overrides to configuration.
        
        Supports:
        - STELLIO_BASE_URL
        - STELLIO_AUTH_TOKEN
        - STELLIO_BATCH_SIZE
        - STELLIO_TIMEOUT
        - STELLIO_MAX_RETRIES
        """
        stellio_config = self.config['stellio']
        
        # Base URL override
        if 'STELLIO_BASE_URL' in os.environ:
            stellio_config['base_url'] = os.environ['STELLIO_BASE_URL']
            logger.info(f"Base URL overridden from environment: {stellio_config['base_url']}")
        
        # Auth token override
        if 'STELLIO_AUTH_TOKEN' in os.environ:
            stellio_config['auth']['enabled'] = True
            stellio_config['auth']['token'] = os.environ['STELLIO_AUTH_TOKEN']
            logger.info("Auth token overridden from environment")
        
        # Batch size override
        if 'STELLIO_BATCH_SIZE' in os.environ:
            stellio_config['batch_size'] = int(os.environ['STELLIO_BATCH_SIZE'])
            logger.info(f"Batch size overridden from environment: {stellio_config['batch_size']}")
        
        # Timeout override
        if 'STELLIO_TIMEOUT' in os.environ:
            stellio_config['timeout'] = int(os.environ['STELLIO_TIMEOUT'])
            logger.info(f"Timeout overridden from environment: {stellio_config['timeout']}")
        
        # Max retries override
        if 'STELLIO_MAX_RETRIES' in os.environ:
            stellio_config['retry']['max_attempts'] = int(os.environ['STELLIO_MAX_RETRIES'])
            logger.info(f"Max retries overridden from environment: {stellio_config['retry']['max_attempts']}")
    
    def _validate_config(self) -> None:
        """
        Validate required configuration fields.
        
        Raises:
            ValueError: If required fields are missing or invalid
        """
        stellio_config = self.config['stellio']
        
        # Required fields
        required_fields = ['base_url', 'api_version', 'endpoints']
        for field in required_fields:
            if field not in stellio_config:
                raise ValueError(f"Required field '{field}' missing in stellio configuration")
        
        # Validate endpoints
        required_endpoints = ['entities', 'batch']
        for endpoint in required_endpoints:
            if endpoint not in stellio_config['endpoints']:
                raise ValueError(f"Required endpoint '{endpoint}' missing in stellio.endpoints")
        
        # Validate batch size
        if stellio_config.get('batch_size', 0) <= 0:
            raise ValueError("batch_size must be greater than 0")
        
        # Validate timeout
        if stellio_config.get('timeout', 0) <= 0:
            raise ValueError("timeout must be greater than 0")
        
        # Validate retry configuration
        retry_config = stellio_config.get('retry', {})
        if retry_config.get('max_attempts', 0) < 0:
            raise ValueError("retry.max_attempts must be non-negative")
        if retry_config.get('backoff_factor', 0) <= 0:
            raise ValueError("retry.backoff_factor must be greater than 0")


class BatchPublisher:
    """
    Handle batch publishing of NGSI-LD entities to Stellio Context Broker.
    
    This class provides:
    - HTTP POST/PATCH requests to Stellio
    - Retry logic with exponential backoff
    - Conflict resolution (409 → PATCH update)
    - Error handling and tracking
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize BatchPublisher with Stellio configuration.
        
        Args:
            config: Stellio configuration dictionary from ConfigLoader
        """
        self.config = config
        self.base_url = config['base_url']
        self.api_version = config['api_version']
        self.endpoints = config['endpoints']
        self.timeout = config['timeout']
        self.retry_config = config['retry']
        self.headers_config = config['headers']
        self.conflict_resolution = config['conflict_resolution']
        
        # Setup HTTP session with connection pooling
        self.session = self._create_session()
        
        # Setup authentication headers
        self.headers = self._create_headers()
    
    def _create_session(self) -> requests.Session:
        """
        Create HTTP session with connection pooling and retry configuration.
        
        Returns:
            Configured requests.Session object
        """
        session = requests.Session()
        
        # Configure connection pool
        pool_size = self.config.get('performance', {}).get('connection_pool_size', 10)
        adapter = HTTPAdapter(
            pool_connections=pool_size,
            pool_maxsize=pool_size,
            max_retries=0  # We handle retries manually
        )
        session.mount('http://', adapter)
        session.mount('https://', adapter)
        
        return session
    
    def _create_headers(self) -> Dict[str, str]:
        """
        Create HTTP headers for Stellio requests.
        
        Returns:
            Dictionary of HTTP headers
        """
        headers = {
            'Content-Type': self.headers_config['content_type'],
            'Accept': self.headers_config['accept'],
            'User-Agent': self.headers_config['user_agent']
        }
        
        # Add authentication token if enabled
        auth_config = self.config['auth']
        if auth_config['enabled'] and auth_config['token']:
            token_type = auth_config['token_type']
            token = auth_config['token']
            header_name = auth_config['header_name']
            headers[header_name] = f"{token_type} {token}"
            logger.info("Authentication enabled for Stellio requests")
        
        return headers
    
    def publish_batch(self, entities: List[Dict[str, Any]]) -> List[PublishResult]:
        """
        Publish a batch of entities to Stellio using batch upsert endpoint.
        
        Args:
            entities: List of NGSI-LD entities to publish
            
        Returns:
            List of PublishResult objects for each entity
        """
        if not entities:
            return []
        
        logger.info(f"Publishing batch of {len(entities)} entities to Stellio")
        
        # Build batch upsert URL
        url = f"{self.base_url}/{self.api_version}{self.endpoints['batch']}"
        
        # Try batch upsert first
        start_time = time.time()
        results = []
        
        try:
            response = self._make_request_with_retry(
                method='POST',
                url=url,
                json=entities,
                headers=self.headers,
                timeout=self.timeout
            )
            
            duration = time.time() - start_time
            
            if response.status_code in [200, 201, 204]:
                # Batch upsert successful
                logger.info(f"Batch upsert successful for {len(entities)} entities")
                for entity in entities:
                    results.append(PublishResult(
                        entity_id=entity.get('id', 'unknown'),
                        status_code=response.status_code,
                        success=True,
                        duration=duration / len(entities)
                    ))
            else:
                # Batch upsert failed, try individual entities
                logger.warning(f"Batch upsert failed with status {response.status_code}, trying individual entities")
                results = self._publish_entities_individually(entities)
        
        except requests.exceptions.RequestException as e:
            # Network error, try individual entities
            logger.error(f"Batch upsert request failed: {e}, trying individual entities")
            results = self._publish_entities_individually(entities)
        
        return results
    
    def _publish_entities_individually(self, entities: List[Dict[str, Any]]) -> List[PublishResult]:
        """
        Publish entities one by one (fallback when batch fails).
        
        Args:
            entities: List of NGSI-LD entities to publish
            
        Returns:
            List of PublishResult objects for each entity
        """
        results = []
        
        for entity in entities:
            result = self.publish_entity(entity)
            results.append(result)
        
        return results
    
    def publish_entity(self, entity: Dict[str, Any]) -> PublishResult:
        """
        Publish a single entity to Stellio with retry logic.
        
        Args:
            entity: NGSI-LD entity to publish
            
        Returns:
            PublishResult object with operation details
        """
        entity_id = entity.get('id', 'unknown')
        url = f"{self.base_url}/{self.api_version}{self.endpoints['entities']}"
        
        start_time = time.time()
        attempts = 0
        last_error = None
        
        while attempts < self.retry_config['max_attempts']:
            attempts += 1
            
            try:
                # POST entity to Stellio
                response = self.session.post(
                    url,
                    json=entity,
                    headers=self.headers,
                    timeout=self.timeout
                )
                
                duration = time.time() - start_time
                
                # Handle different status codes
                if response.status_code in [200, 201]:
                    # Success - entity published
                    logger.info(f"Entity {entity_id} published successfully (attempt {attempts})")
                    
                    # CRITICAL: If this is an ItemFlowObserved (sosa:Observation),
                    # update the parent Camera (sosa:Sensor) with sosa:madeObservation link
                    entity_type = entity.get('type', '')
                    if entity_type == 'ItemFlowObserved' or 'ItemFlowObserved' in entity_type:
                        # Extract camera ID from refDevice relationship
                        ref_device = entity.get('refDevice', {})
                        if ref_device and ref_device.get('type') == 'Relationship':
                            camera_id = ref_device.get('object', '')
                            if camera_id:
                                # Extract observedAt timestamp from any property
                                observed_at = None
                                for key, value in entity.items():
                                    if isinstance(value, dict) and 'observedAt' in value:
                                        observed_at = value['observedAt']
                                        break
                                
                                # Update Camera with new observation
                                logger.info(f"🔗 Updating Camera {camera_id} with observation {entity_id}")
                                self.update_camera_with_observation(
                                    camera_id=camera_id,
                                    observation_id=entity_id,
                                    observed_at=observed_at
                                )
                    
                    return PublishResult(
                        entity_id=entity_id,
                        status_code=response.status_code,
                        success=True,
                        attempts=attempts,
                        duration=duration
                    )
                
                elif response.status_code == 409:
                    # Conflict - entity exists, try PATCH update
                    logger.warning(f"Entity {entity_id} already exists (409), attempting PATCH update")
                    return self._patch_entity(entity, attempts, start_time)
                
                elif response.status_code in self.retry_config['retry_status_codes']:
                    # Retryable error
                    last_error = f"HTTP {response.status_code}: {response.text}"
                    logger.warning(f"Retryable error for entity {entity_id} (attempt {attempts}): {last_error}")
                    
                    if attempts < self.retry_config['max_attempts']:
                        # Calculate backoff delay
                        delay = self._calculate_backoff_delay(attempts)
                        logger.info(f"Retrying in {delay} seconds...")
                        time.sleep(delay)
                    else:
                        # Max attempts reached
                        duration = time.time() - start_time
                        return PublishResult(
                            entity_id=entity_id,
                            status_code=response.status_code,
                            success=False,
                            error=last_error,
                            attempts=attempts,
                            duration=duration
                        )
                
                else:
                    # Non-retryable error
                    duration = time.time() - start_time
                    error_msg = f"HTTP {response.status_code}: {response.text}"
                    logger.error(f"Non-retryable error for entity {entity_id}: {error_msg}")
                    return PublishResult(
                        entity_id=entity_id,
                        status_code=response.status_code,
                        success=False,
                        error=error_msg,
                        attempts=attempts,
                        duration=duration
                    )
            
            except requests.exceptions.Timeout:
                last_error = f"Request timeout after {self.timeout} seconds"
                logger.error(f"Timeout for entity {entity_id} (attempt {attempts})")
                
                if attempts < self.retry_config['max_attempts']:
                    delay = self._calculate_backoff_delay(attempts)
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    duration = time.time() - start_time
                    return PublishResult(
                        entity_id=entity_id,
                        status_code=504,
                        success=False,
                        error=last_error,
                        attempts=attempts,
                        duration=duration
                    )
            
            except requests.exceptions.RequestException as e:
                last_error = f"Request failed: {str(e)}"
                logger.error(f"Request exception for entity {entity_id} (attempt {attempts}): {last_error}")
                
                if attempts < self.retry_config['max_attempts']:
                    delay = self._calculate_backoff_delay(attempts)
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
                else:
                    duration = time.time() - start_time
                    return PublishResult(
                        entity_id=entity_id,
                        status_code=500,
                        success=False,
                        error=last_error,
                        attempts=attempts,
                        duration=duration
                    )
        
        # Should never reach here, but handle it anyway
        duration = time.time() - start_time
        return PublishResult(
            entity_id=entity_id,
            status_code=500,
            success=False,
            error=last_error or "Unknown error",
            attempts=attempts,
            duration=duration
        )
    
    def _patch_entity(self, entity: Dict[str, Any], attempts: int, start_time: float) -> PublishResult:
        """
        Update existing entity using PATCH (for 409 conflicts).
        
        Args:
            entity: NGSI-LD entity to update
            attempts: Number of attempts already made
            start_time: Start time of operation
            
        Returns:
            PublishResult object with operation details
        """
        entity_id = entity.get('id', 'unknown')
        
        if not self.conflict_resolution['use_patch']:
            # Skip PATCH if not configured
            duration = time.time() - start_time
            return PublishResult(
                entity_id=entity_id,
                status_code=409,
                success=False,
                error="Entity exists and PATCH is disabled",
                attempts=attempts,
                duration=duration
            )
        
        # Build PATCH URL
        patch_endpoint = self.conflict_resolution['patch_endpoint'].replace('{entityId}', entity_id)
        url = f"{self.base_url}/{self.api_version}{patch_endpoint}"
        
        # Extract attributes for PATCH (exclude id, type)
        # Include @context for NGSI-LD compliance
        attrs = {k: v for k, v in entity.items() if k not in ['id', 'type']}
        
        # Ensure @context is included
        if '@context' not in attrs and '@context' in entity:
            attrs['@context'] = entity['@context']
        elif '@context' not in attrs:
            # Add default context if not present
            attrs['@context'] = self.context
        
        try:
            response = self.session.patch(
                url,
                json=attrs,
                headers=self.headers,
                timeout=self.timeout
            )
            
            duration = time.time() - start_time
            
            if response.status_code in [200, 204]:
                logger.info(f"Entity {entity_id} updated successfully via PATCH")
                return PublishResult(
                    entity_id=entity_id,
                    status_code=response.status_code,
                    success=True,
                    attempts=attempts,
                    duration=duration
                )
            else:
                error_msg = f"PATCH failed with HTTP {response.status_code}: {response.text}"
                logger.error(f"PATCH update failed for entity {entity_id}: {error_msg}")
                return PublishResult(
                    entity_id=entity_id,
                    status_code=response.status_code,
                    success=False,
                    error=error_msg,
                    attempts=attempts,
                    duration=duration
                )
        
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            error_msg = f"PATCH request failed: {str(e)}"
            logger.error(f"PATCH request exception for entity {entity_id}: {error_msg}")
            return PublishResult(
                entity_id=entity_id,
                status_code=500,
                success=False,
                error=error_msg,
                attempts=attempts,
                duration=duration
            )
    
    def update_camera_with_observation(
        self, 
        camera_id: str, 
        observation_id: str, 
        observed_at: Optional[str] = None
    ) -> bool:
        """
        Update Camera entity to append new observation to sosa:madeObservation array.
        
        This is CRITICAL for SOSA/SSN compliance: a sosa:Sensor (Camera) MUST
        link to all sosa:Observation (ItemFlowObserved) entities it creates.
        
        Args:
            camera_id: Camera entity ID (e.g. "urn:ngsi-ld:Camera:TTH406")
            observation_id: Observation entity ID (e.g. "urn:ngsi-ld:ItemFlowObserved:TTH406-ts123")
            observed_at: Optional ISO 8601 timestamp of observation
            
        Returns:
            True if update successful, False otherwise
        """
        try:
            # Build PATCH URL for Camera entity
            patch_endpoint = self.conflict_resolution['patch_endpoint'].replace('{entityId}', camera_id)
            url = f"{self.base_url}/{self.api_version}{patch_endpoint}"
            
            # Build PATCH body to append observation to sosa:madeObservation
            # Stellio will automatically append to existing array
            patch_body = {
                'sosa:madeObservation': {
                    'type': 'Relationship',
                    'object': observation_id
                }
            }
            
            # Add observedAt timestamp if provided
            if observed_at:
                patch_body['sosa:madeObservation']['observedAt'] = observed_at
            
            # Send PATCH request
            response = self.session.patch(
                url,
                json=patch_body,
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code in [200, 204]:
                logger.info(
                    f"✅ Camera {camera_id} updated: added observation {observation_id} "
                    f"to sosa:madeObservation"
                )
                return True
            else:
                logger.warning(
                    f"⚠️ Failed to update Camera {camera_id} with observation {observation_id}: "
                    f"HTTP {response.status_code} - {response.text}"
                )
                return False
        
        except Exception as e:
            logger.error(
                f"❌ Exception updating Camera {camera_id} with observation {observation_id}: {e}"
            )
            return False
    
    def _make_request_with_retry(
        self,
        method: str,
        url: str,
        json: Any = None,
        headers: Dict[str, str] = None,
        timeout: int = 30
    ) -> requests.Response:
        """
        Make HTTP request with retry logic.
        
        Args:
            method: HTTP method (GET, POST, PATCH, etc.)
            url: Request URL
            json: JSON body for request
            headers: HTTP headers
            timeout: Request timeout in seconds
            
        Returns:
            requests.Response object
            
        Raises:
            requests.exceptions.RequestException: If all retries fail
        """
        attempts = 0
        last_exception = None
        
        while attempts < self.retry_config['max_attempts']:
            attempts += 1
            
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    json=json,
                    headers=headers,
                    timeout=timeout
                )
                return response
            
            except requests.exceptions.RequestException as e:
                last_exception = e
                logger.warning(f"Request failed (attempt {attempts}): {e}")
                
                if attempts < self.retry_config['max_attempts']:
                    delay = self._calculate_backoff_delay(attempts)
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
        
        # All retries failed
        raise last_exception
    
    def _calculate_backoff_delay(self, attempt: int) -> float:
        """
        Calculate exponential backoff delay.
        
        Args:
            attempt: Current attempt number (1-indexed)
            
        Returns:
            Delay in seconds
        """
        backoff_factor = self.retry_config['backoff_factor']
        initial_delay = self.retry_config['initial_delay']
        max_delay = self.retry_config['max_delay']
        
        # Calculate exponential backoff: initial_delay * (backoff_factor ^ (attempt - 1))
        delay = initial_delay * (backoff_factor ** (attempt - 1))
        
        # Cap at max_delay
        return min(delay, max_delay)
    
    def close(self) -> None:
        """Close HTTP session and cleanup resources."""
        if self.session:
            self.session.close()
            logger.info("HTTP session closed")


class PublishReportGenerator:
    """
    Generate comprehensive publishing reports with statistics and error details.
    
    This class provides:
    - Aggregate statistics (total, success, failure counts)
    - Detailed error information
    - Duration tracking
    - JSON report generation
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize PublishReportGenerator.
        
        Args:
            config: Stellio configuration dictionary
        """
        self.config = config
        self.output_config = config['output']
        self.statistics = PublishStatistics()
        self.start_time = None
        self.end_time = None
    
    def start_tracking(self) -> None:
        """Start tracking publishing operation."""
        self.start_time = time.time()
        logger.info("Started tracking publishing operation")
    
    def end_tracking(self) -> None:
        """End tracking publishing operation."""
        self.end_time = time.time()
        if self.start_time:
            self.statistics.duration_seconds = self.end_time - self.start_time
        logger.info(f"Ended tracking publishing operation (duration: {self.statistics.duration_seconds:.2f}s)")
    
    def record_results(self, results: List[PublishResult]) -> None:
        """
        Record publishing results.
        
        Args:
            results: List of PublishResult objects
        """
        for result in results:
            self.statistics.total_entities += 1
            
            if result.success:
                self.statistics.successful += 1
            else:
                self.statistics.failed += 1
                
                # Add error details
                if self.output_config['detailed_errors']:
                    self.statistics.errors.append({
                        'entity_id': result.entity_id,
                        'status_code': result.status_code,
                        'error': result.error,
                        'attempts': result.attempts,
                        'duration': round(result.duration, 3)
                    })
    
    def generate_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive publish report.
        
        Returns:
            Dictionary containing report data
        """
        report = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'total_entities': self.statistics.total_entities,
            'successful': self.statistics.successful,
            'failed': self.statistics.failed,
            'success_rate': round(
                (self.statistics.successful / self.statistics.total_entities * 100)
                if self.statistics.total_entities > 0 else 0,
                2
            ),
            'duration_seconds': round(self.statistics.duration_seconds, 2)
        }
        
        # Add error details if configured
        if self.output_config['detailed_errors'] and self.statistics.errors:
            report['errors'] = self.statistics.errors
        else:
            report['error_count'] = len(self.statistics.errors)
        
        # Add performance metrics
        if self.statistics.duration_seconds > 0 and self.statistics.total_entities > 0:
            report['throughput'] = round(
                self.statistics.total_entities / self.statistics.duration_seconds,
                2
            )
        elif self.statistics.total_entities > 0:
            # If duration is effectively 0, calculate based on very small duration
            report['throughput'] = round(
                self.statistics.total_entities / max(0.001, self.statistics.duration_seconds),
                2
            )
        
        return report
    
    def save_report(self, report: Dict[str, Any]) -> str:
        """
        Save report to JSON file.
        
        Args:
            report: Report dictionary
            
        Returns:
            Path to saved report file
        """
        report_dir = Path(self.output_config['report_dir'])
        report_dir.mkdir(parents=True, exist_ok=True)
        
        report_path = report_dir / self.output_config['report_filename']
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Report saved to: {report_path}")
        return str(report_path)
    
    def save_failed_entities(self, entities: List[Dict[str, Any]], results: List[PublishResult]) -> Optional[str]:
        """
        Save failed entities to separate file.
        
        Args:
            entities: Original list of entities
            results: List of PublishResult objects
            
        Returns:
            Path to saved file, or None if no failures
        """
        if not self.output_config['save_failed_entities']:
            return None
        
        # Filter failed entities
        failed_entity_ids = {r.entity_id for r in results if not r.success}
        failed_entities = [e for e in entities if e.get('id') in failed_entity_ids]
        
        if not failed_entities:
            return None
        
        report_dir = Path(self.output_config['report_dir'])
        report_dir.mkdir(parents=True, exist_ok=True)
        
        failed_path = report_dir / self.output_config['failed_entities_filename']
        
        with open(failed_path, 'w', encoding='utf-8') as f:
            json.dump(failed_entities, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Failed entities saved to: {failed_path}")
        return str(failed_path)


class EntityPublisherAgent:
    """
    Main orchestrator for publishing NGSI-LD entities to Stellio Context Broker.
    
    This agent provides:
    - Domain-agnostic entity publishing
    - Batch processing with configurable batch size
    - Comprehensive error handling and reporting
    - Retry logic with exponential backoff
    - Conflict resolution for existing entities
    
    Usage:
        agent = EntityPublisherAgent(config_path='config/stellio.yaml')
        report = agent.publish(input_file='data/validated_entities.json')
    """
    
    def __init__(self, config_path: str = "config/stellio.yaml"):
        """
        Initialize EntityPublisherAgent.
        
        Args:
            config_path: Path to stellio.yaml configuration file
        """
        self.config_path = config_path
        self.config = None
        self.publisher = None
        self.report_generator = None
        
        # Load configuration
        self._load_configuration()
    
    def _load_configuration(self) -> None:
        """Load and validate Stellio configuration."""
        logger.info("Initializing Entity Publisher Agent")
        
        config_loader = ConfigLoader(self.config_path)
        self.config = config_loader.load_config()
        
        # Initialize components
        self.publisher = BatchPublisher(self.config)
        self.report_generator = PublishReportGenerator(self.config)
        
        logger.info("Entity Publisher Agent initialized successfully")
    
    def publish(
        self,
        input_file: str = "data/validated_entities.json",
        output_report: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Publish NGSI-LD entities from input file to Stellio Context Broker.
        
        Args:
            input_file: Path to JSON file containing NGSI-LD entities
            output_report: Optional custom path for output report
            
        Returns:
            Dictionary containing publish report
        """
        logger.info(f"Starting entity publication from: {input_file}")
        
        # Load entities from input file
        entities = self._load_entities(input_file)
        
        if not entities:
            # Empty entity files are expected when no new data is generated
            logger.info("No entities to publish - empty input file")
            return self._generate_empty_report()
        
        logger.info(f"Loaded {len(entities)} entities to publish")
        
        # Start tracking
        self.report_generator.start_tracking()
        
        # Publish entities in batches
        all_results = []
        batch_size = self.config['batch_size']
        
        for i in range(0, len(entities), batch_size):
            batch = entities[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (len(entities) + batch_size - 1) // batch_size
            
            logger.info(f"Publishing batch {batch_num}/{total_batches} ({len(batch)} entities)")
            
            # Publish batch
            results = self.publisher.publish_batch(batch)
            all_results.extend(results)
            
            # Record results
            self.report_generator.record_results(results)
        
        # End tracking
        self.report_generator.end_tracking()
        
        # Generate report
        report = self.report_generator.generate_report()
        
        # Save report
        if output_report:
            self.report_generator.output_config['report_filename'] = os.path.basename(output_report)
            self.report_generator.output_config['report_dir'] = os.path.dirname(output_report) or 'data'
        
        report_path = self.report_generator.save_report(report)
        report['report_path'] = report_path
        
        # Save failed entities if any
        failed_path = self.report_generator.save_failed_entities(entities, all_results)
        if failed_path:
            report['failed_entities_path'] = failed_path
        
        # Log summary
        self._log_summary(report)
        
        return report
    
    def _load_entities(self, input_file: str) -> List[Dict[str, Any]]:
        """
        Load NGSI-LD entities from JSON file.
        
        Args:
            input_file: Path to JSON file
            
        Returns:
            List of NGSI-LD entities with normalized @context
            
        Raises:
            FileNotFoundError: If input file doesn't exist
            json.JSONDecodeError: If input file is not valid JSON
        """
        if not os.path.exists(input_file):
            logger.warning(f"Input file not found: {input_file} - returning empty entity list")
            return []
        
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle both array and object with entities array
            if isinstance(data, list):
                entities = data
            elif isinstance(data, dict) and 'entities' in data:
                entities = data['entities']
            else:
                logger.error(f"Invalid input format in {input_file}")
                return []
            
            # Normalize @context to use only NGSI-LD core context
            # This prevents HTTP 503 errors from unreachable remote contexts
            normalized_entities = []
            for entity in entities:
                normalized_entity = entity.copy()
                
                # Replace any @context with NGSI-LD core context only
                normalized_entity['@context'] = "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld"
                
                normalized_entities.append(normalized_entity)
            
            logger.info(f"Loaded and normalized {len(normalized_entities)} entities from {input_file}")
            return normalized_entities
        
        except json.JSONDecodeError as e:
            raise json.JSONDecodeError(f"Invalid JSON in input file: {e}", e.doc, e.pos)
    
    def _generate_empty_report(self) -> Dict[str, Any]:
        """
        Generate empty report when no entities to publish.
        
        Returns:
            Empty report dictionary
        """
        return {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'total_entities': 0,
            'successful': 0,
            'failed': 0,
            'success_rate': 0.0,
            'duration_seconds': 0.0,
            'errors': []
        }
    
    def _log_summary(self, report: Dict[str, Any]) -> None:
        """
        Log publishing summary.
        
        Args:
            report: Publish report dictionary
        """
        logger.info("=" * 80)
        logger.info("PUBLISHING SUMMARY")
        logger.info("=" * 80)
        logger.info(f"Total entities:    {report['total_entities']}")
        logger.info(f"Successful:        {report['successful']}")
        logger.info(f"Failed:            {report['failed']}")
        logger.info(f"Success rate:      {report['success_rate']}%")
        logger.info(f"Duration:          {report['duration_seconds']}s")
        if 'throughput' in report:
            logger.info(f"Throughput:        {report['throughput']} entities/second")
        logger.info(f"Report saved to:   {report.get('report_path', 'N/A')}")
        if 'failed_entities_path' in report:
            logger.info(f"Failed entities:   {report['failed_entities_path']}")
        logger.info("=" * 80)
    
    def close(self) -> None:
        """Close agent and cleanup resources."""
        if self.publisher:
            self.publisher.close()
        logger.info("Entity Publisher Agent closed")


def main(config: Dict = None):
    """
    Main entry point for Entity Publisher Agent.
    
    Usage:
        python agents/context_management/entity_publisher_agent.py
    """
    try:
        # If called from orchestrator with config dict
        if config:
            input_file = config.get('input_file', 'data/validated_entities.json')
            fallback_file = config.get('fallback_file', 'data/validated_entities.json')
            output_report = config.get('output_report', 'data/publish_report.json')
            config_path = config.get('config_path', 'config/stellio.yaml')
            
            # Check if primary input file exists, fallback if not
            from pathlib import Path
            if not Path(input_file).exists() and Path(fallback_file).exists():
                logger.warning(f"Primary input file not found: {input_file}")
                logger.info(f"Using fallback file: {fallback_file}")
                input_file = fallback_file
            
            agent = EntityPublisherAgent(config_path=config_path)
            report = agent.publish(input_file=input_file, output_report=output_report)
            agent.close()
            
            return {
                'status': 'success',
                'report': report
            }
        
        # Command line execution
        # Initialize agent
        agent = EntityPublisherAgent(config_path='config/stellio.yaml')
        
        # Publish entities
        report = agent.publish(
            input_file='data/validated_entities.json',
            output_report='data/publish_report.json'
        )
        
        # Print summary
        print("\n" + "=" * 80)
        print("ENTITY PUBLISHER AGENT - EXECUTION SUMMARY")
        print("=" * 80)
        print(f"Total entities:    {report['total_entities']}")
        print(f"Successful:        {report['successful']}")
        print(f"Failed:            {report['failed']}")
        print(f"Success rate:      {report['success_rate']}%")
        print(f"Duration:          {report['duration_seconds']}s")
        if 'throughput' in report:
            print(f"Throughput:        {report['throughput']} entities/second")
        print("=" * 80)
        
        # Close agent
        agent.close()
        
        return 0
    
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        if config:
            return {
                'status': 'failed',
                'error': str(e)
            }
        return 1


if __name__ == '__main__':
    exit(main())
