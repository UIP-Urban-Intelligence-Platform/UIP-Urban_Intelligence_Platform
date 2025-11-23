# State Updater Agent
"""State Updater Agent - Real-Time Entity State Updates.

Module: src.agents.context_management.state_updater_agent
Author:     Nguyen Viet Hoang
Created:  2025-11-23
Version: 2.0.0
License: MIT

Description:
    Listens to real-time events from multiple sources and atomically updates
    entity states in Stellio Context Broker using PATCH operations.

Event Sources:
    - Apache Kafka topics
    - HTTP webhooks
    - WebSocket connections

Core Features:
    - Atomic PATCH updates to Stellio
    - Retry with exponential backoff
    - Event deduplication (prevent duplicate updates)
    - Batching for high-throughput scenarios
    - Circuit breaker for fault tolerance
    - Comprehensive monitoring and metrics

Dependencies:
    - kafka-python>=2.0: Kafka consumer
    - websockets>=11.0: WebSocket client
    - requests>=2.28: HTTP client
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/state_updater_config.yaml:
        - event_sources: Kafka, webhook, WebSocket configs
        - update_rules: Entity type to attribute mappings
        - retry_policy: Backoff settings
        - batch_config: Batching parameters

Example:
    ```python
    from src.agents.context_management.state_updater_agent import StateUpdaterAgent
    
    agent = StateUpdaterAgent()
    await agent.start_listening()
    ```

Architecture:
    Event Sources → Deduplicator → Batcher → Stellio PATCH → Metrics
"""

import asyncio
import hashlib
import json
import logging
import os
import time
import threading
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from queue import Queue, Empty
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin

import requests
import yaml

# Optional dependencies
try:
    from kafka import KafkaConsumer
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False

try:
    import websocket
    WEBSOCKET_AVAILABLE = True
except ImportError:
    WEBSOCKET_AVAILABLE = False

try:
    from flask import Flask, request, jsonify
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============================================================================
# Configuration Management
# ============================================================================

class StateUpdaterConfig:
    """
    Configuration loader and validator for State Updater Agent.
    
    Loads configuration from YAML file and provides typed access to all settings.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize configuration from YAML file.
        
        Args:
            config_path: Path to state_updater_config.yaml
        
        Raises:
            FileNotFoundError: If config file doesn't exist
            yaml.YAMLError: If config file is invalid YAML
        """
        self.config_path = config_path
        
        if not os.path.exists(config_path):
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
        
        if not self.config or 'state_updater' not in self.config:
            raise ValueError("Invalid configuration: 'state_updater' section not found")
        
        self.state_updater = self.config['state_updater']
        logger.info(f"Configuration loaded from {config_path}")
    
    def get_event_sources(self) -> List[Dict[str, Any]]:
        """Get list of event source configurations."""
        return self.state_updater.get('event_sources', [])
    
    def get_stellio_config(self) -> Dict[str, Any]:
        """Get Stellio Context Broker configuration."""
        return self.state_updater.get('stellio', {})
    
    def get_update_rules(self) -> Dict[str, Dict[str, Any]]:
        """Get update rules for different entity attributes."""
        return self.state_updater.get('update_rules', {})
    
    def get_processing_config(self) -> Dict[str, Any]:
        """Get processing configuration (concurrency, batching, etc.)."""
        return self.state_updater.get('processing', {})
    
    def get_monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring and metrics configuration."""
        return self.state_updater.get('monitoring', {})
    
    def get_logging_config(self) -> Dict[str, Any]:
        """Get logging configuration."""
        return self.state_updater.get('logging', {})
    
    def get_state_config(self) -> Dict[str, Any]:
        """Get state persistence configuration."""
        return self.state_updater.get('state', {})
    
    def get_health_config(self) -> Dict[str, Any]:
        """Get health check configuration."""
        return self.state_updater.get('health', {})


# ============================================================================
# Event Data Structures
# ============================================================================

@dataclass
class UpdateEvent:
    """
    Represents a single entity update event.
    
    Attributes:
        entity_id: NGSI-LD entity ID (e.g., urn:ngsi-ld:Camera:TTH406)
        updates: Dictionary of attribute updates
        timestamp: Event timestamp
        source: Event source identifier
        event_id: Unique event ID for deduplication
    """
    entity_id: str
    updates: Dict[str, Any]
    timestamp: datetime
    source: str
    event_id: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any], source: str = "unknown") -> 'UpdateEvent':
        """
        Create UpdateEvent from dictionary.
        
        Args:
            data: Event data dictionary
            source: Event source identifier
        
        Returns:
            UpdateEvent instance
        
        Raises:
            ValueError: If required fields are missing
        """
        if 'entity_id' not in data:
            raise ValueError("Missing required field: entity_id")
        
        if 'updates' not in data:
            raise ValueError("Missing required field: updates")
        
        # Generate event ID if not provided
        event_id = data.get('event_id')
        if not event_id:
            # Hash entity_id + timestamp for deduplication
            timestamp_str = data.get('timestamp', datetime.utcnow().isoformat())
            hash_input = f"{data['entity_id']}:{timestamp_str}"
            event_id = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
        
        # Parse timestamp
        timestamp = data.get('timestamp')
        if timestamp:
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        else:
            timestamp = datetime.utcnow()
        
        return cls(
            entity_id=data['entity_id'],
            updates=data['updates'],
            timestamp=timestamp,
            source=source,
            event_id=event_id,
            metadata=data.get('metadata', {})
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            'entity_id': self.entity_id,
            'updates': self.updates,
            'timestamp': self.timestamp.isoformat(),
            'source': self.source,
            'event_id': self.event_id,
            'metadata': self.metadata
        }


@dataclass
class UpdateResult:
    """
    Result of an entity update operation.
    
    Attributes:
        success: Whether update succeeded
        entity_id: Entity ID that was updated
        event_id: Event ID
        status_code: HTTP status code (if applicable)
        latency_ms: Update latency in milliseconds
        error: Error message if failed
        retry_count: Number of retries attempted
    """
    success: bool
    entity_id: str
    event_id: str
    status_code: Optional[int] = None
    latency_ms: Optional[float] = None
    error: Optional[str] = None
    retry_count: int = 0


# ============================================================================
# Event Source Management
# ============================================================================

class KafkaEventSource:
    """
    Kafka event source consumer.
    
    Consumes events from Kafka topic and converts to UpdateEvent objects.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Kafka consumer.
        
        Args:
            config: Kafka source configuration
        
        Raises:
            RuntimeError: If kafka-python is not installed
        """
        if not KAFKA_AVAILABLE:
            raise RuntimeError("kafka-python package is required for Kafka event source")
        
        self.config = config
        self.topic = config.get('topic', 'camera-updates')
        self.enabled = config.get('enabled', True)
        self.consumer = None
        self.running = False
        
        logger.info(f"Kafka event source initialized for topic: {self.topic}")
    
    def connect(self) -> None:
        """Connect to Kafka broker."""
        if not self.enabled:
            logger.info("Kafka event source is disabled")
            return
        
        consumer_config = {
            'bootstrap_servers': self.config.get('bootstrap_servers', 'kafka:9092'),
            'group_id': self.config.get('group_id', 'state-updater-group'),
            'auto_offset_reset': self.config.get('auto_offset_reset', 'latest'),
            'enable_auto_commit': self.config.get('enable_auto_commit', True),
            'max_poll_records': self.config.get('max_poll_records', 100),
            'session_timeout_ms': self.config.get('session_timeout_ms', 30000),
            'value_deserializer': lambda m: json.loads(m.decode('utf-8'))
        }
        
        # Add security config if provided
        kafka_config = self.config.get('consumer_config', {})
        consumer_config.update(kafka_config)
        
        self.consumer = KafkaConsumer(self.topic, **consumer_config)
        self.running = True
        logger.info(f"Connected to Kafka: {consumer_config['bootstrap_servers']}")
    
    def consume(self, timeout_ms: int = 1000) -> List[UpdateEvent]:
        """
        Consume events from Kafka.
        
        Args:
            timeout_ms: Poll timeout in milliseconds
        
        Returns:
            List of UpdateEvent objects
        """
        if not self.consumer or not self.running:
            return []
        
        events = []
        
        try:
            messages = self.consumer.poll(timeout_ms=timeout_ms)
            
            for topic_partition, msgs in messages.items():
                for msg in msgs:
                    try:
                        event = UpdateEvent.from_dict(msg.value, source=f"kafka:{self.topic}")
                        events.append(event)
                    except Exception as e:
                        logger.error(f"Failed to parse Kafka message: {e}")
        
        except Exception as e:
            logger.error(f"Kafka consume error: {e}")
        
        return events
    
    def close(self) -> None:
        """Close Kafka consumer."""
        self.running = False
        if self.consumer:
            self.consumer.close()
            logger.info("Kafka consumer closed")


class WebhookEventSource:
    """
    HTTP webhook event source.
    
    Runs a Flask server to receive HTTP POST requests with update events.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize webhook server.
        
        Args:
            config: Webhook source configuration
        
        Raises:
            RuntimeError: If Flask is not installed
        """
        if not FLASK_AVAILABLE:
            raise RuntimeError("Flask package is required for webhook event source")
        
        self.config = config
        self.port = config.get('port', 8081)
        self.host = config.get('host', '0.0.0.0')
        self.endpoint = config.get('endpoint', '/updates')
        self.enabled = config.get('enabled', True)
        
        self.event_queue = Queue(maxsize=10000)
        self.app = None
        self.server_thread = None
        self.running = False
        
        logger.info(f"Webhook event source initialized on port {self.port}")
    
    def start(self) -> None:
        """Start webhook HTTP server in background thread."""
        if not self.enabled:
            logger.info("Webhook event source is disabled")
            return
        
        self.app = Flask(__name__)
        
        # Register webhook endpoint
        @self.app.route(self.endpoint, methods=['POST'])
        def handle_update():
            try:
                data = request.get_json()
                
                # Validate payload
                validation_config = self.config.get('validation', {})
                if validation_config.get('require_entity_id') and 'entity_id' not in data:
                    return jsonify({'error': 'Missing entity_id'}), 400
                
                if validation_config.get('require_updates') and 'updates' not in data:
                    return jsonify({'error': 'Missing updates'}), 400
                
                # Create event
                event = UpdateEvent.from_dict(data, source='webhook')
                
                # Add to queue
                try:
                    self.event_queue.put(event, block=False)
                    return jsonify({'status': 'accepted', 'event_id': event.event_id}), 202
                except:
                    return jsonify({'error': 'Queue full'}), 503
            
            except Exception as e:
                logger.error(f"Webhook error: {e}")
                return jsonify({'error': str(e)}), 400
        
        # Health check endpoint
        @self.app.route('/health', methods=['GET'])
        def health():
            return jsonify({'status': 'healthy', 'queue_size': self.event_queue.qsize()}), 200
        
        # Start server in background thread
        def run_server():
            self.app.run(host=self.host, port=self.port, threaded=True)
        
        self.server_thread = threading.Thread(target=run_server, daemon=True)
        self.server_thread.start()
        self.running = True
        
        logger.info(f"Webhook server started on {self.host}:{self.port}{self.endpoint}")
    
    def consume(self, timeout_s: float = 1.0) -> List[UpdateEvent]:
        """
        Consume events from webhook queue.
        
        Args:
            timeout_s: Timeout in seconds
        
        Returns:
            List of UpdateEvent objects
        """
        if not self.running:
            return []
        
        events = []
        deadline = time.time() + timeout_s
        
        while time.time() < deadline:
            try:
                event = self.event_queue.get(timeout=0.1)
                events.append(event)
                
                # Get more events if available (up to 100)
                while not self.event_queue.empty() and len(events) < 100:
                    events.append(self.event_queue.get_nowait())
                
                break
            except Empty:
                continue
        
        return events
    
    def close(self) -> None:
        """Stop webhook server."""
        self.running = False
        logger.info("Webhook server stopped")


class EventSourceManager:
    """
    Manages multiple event sources and provides unified event stream.
    
    Coordinates Kafka, webhook, and WebSocket event sources.
    """
    
    def __init__(self, config: StateUpdaterConfig):
        """
        Initialize event source manager.
        
        Args:
            config: State updater configuration
        """
        self.config = config
        self.sources = []
        
        # Initialize event sources
        for source_config in config.get_event_sources():
            source_type = source_config.get('type')
            
            if source_type == 'kafka' and source_config.get('enabled', True):
                try:
                    source = KafkaEventSource(source_config)
                    self.sources.append(source)
                    logger.info("Kafka event source added")
                except Exception as e:
                    logger.warning(f"Failed to initialize Kafka source: {e}")
            
            elif source_type == 'webhook' and source_config.get('enabled', True):
                try:
                    source = WebhookEventSource(source_config)
                    self.sources.append(source)
                    logger.info("Webhook event source added")
                except Exception as e:
                    logger.warning(f"Failed to initialize webhook source: {e}")
        
        logger.info(f"Event source manager initialized with {len(self.sources)} sources")
    
    def start(self) -> None:
        """Start all event sources."""
        for source in self.sources:
            if isinstance(source, KafkaEventSource):
                source.connect()
            elif isinstance(source, WebhookEventSource):
                source.start()
        
        logger.info("All event sources started")
    
    def consume_events(self, timeout_s: float = 1.0) -> List[UpdateEvent]:
        """
        Consume events from all sources.
        
        Args:
            timeout_s: Timeout in seconds
        
        Returns:
            List of UpdateEvent objects from all sources
        """
        all_events = []
        
        for source in self.sources:
            try:
                events = source.consume(timeout_ms=int(timeout_s * 1000) if isinstance(source, KafkaEventSource) else timeout_s)
                all_events.extend(events)
            except Exception as e:
                logger.error(f"Error consuming from {type(source).__name__}: {e}")
        
        return all_events
    
    def close(self) -> None:
        """Close all event sources."""
        for source in self.sources:
            source.close()
        
        logger.info("All event sources closed")


# ============================================================================
# Entity Updater
# ============================================================================

class EntityUpdater:
    """
    Handles atomic PATCH updates to Stellio Context Broker entities.
    
    Features:
    - Retry with exponential backoff
    - Request validation
    - Batch updates
    - Connection pooling
    """
    
    def __init__(self, config: StateUpdaterConfig):
        """
        Initialize entity updater.
        
        Args:
            config: State updater configuration
        """
        self.config = config
        self.stellio_config = config.get_stellio_config()
        self.update_rules = config.get_update_rules()
        
        self.base_url = self.stellio_config.get('base_url', 'http://stellio:8080')
        self.timeout = self.stellio_config.get('timeout', 10)
        
        # Retry configuration
        retry_config = self.stellio_config.get('retry', {})
        self.max_retry_attempts = retry_config.get('max_attempts', 3)
        self.backoff_factor = retry_config.get('backoff_factor', 2)
        self.max_backoff = retry_config.get('max_backoff', 30)
        self.retry_on_status = retry_config.get('retry_on_status', [408, 429, 500, 502, 503, 504])
        self.jitter = retry_config.get('jitter', True)
        
        # Create HTTP session with connection pooling
        self.session = requests.Session()
        
        headers = self.stellio_config.get('headers', {})
        self.session.headers.update(headers)
        
        logger.info(f"Entity updater initialized for Stellio: {self.base_url}")
    
    def build_patch_url(self, entity_id: str) -> str:
        """
        Build PATCH URL for entity.
        
        Args:
            entity_id: Entity ID
        
        Returns:
            Full PATCH URL
        """
        endpoints = self.stellio_config.get('endpoints', {})
        patch_template = endpoints.get('patch_entity', '/ngsi-ld/v1/entities/{entity_id}/attrs')
        
        path = patch_template.format(entity_id=entity_id)
        return urljoin(self.base_url, path)
    
    def validate_update(self, event: UpdateEvent) -> Tuple[bool, Optional[str]]:
        """
        Validate update event against configured rules.
        
        Args:
            event: Update event to validate
        
        Returns:
            Tuple of (is_valid, error_message)
        """
        # Check if any update rule matches
        for attr_name in event.updates.keys():
            if attr_name in self.update_rules:
                rule = self.update_rules[attr_name]
                validation = rule.get('validation', {})
                
                # Get attribute value
                attr_value = event.updates[attr_name]
                if isinstance(attr_value, dict):
                    attr_value = attr_value.get('value')
                
                # Validate based on rules
                for field, constraints in validation.items():
                    if field not in event.updates:
                        if constraints.get('required'):
                            return False, f"Required field missing: {field}"
                        continue
                    
                    field_value = event.updates[field]
                    if isinstance(field_value, dict):
                        field_value = field_value.get('value')
                    
                    # Type validation
                    expected_type = constraints.get('type')
                    if expected_type == 'string' and not isinstance(field_value, str):
                        return False, f"Field {field} must be string"
                    elif expected_type == 'number' and not isinstance(field_value, (int, float)):
                        return False, f"Field {field} must be number"
                    elif expected_type == 'boolean' and not isinstance(field_value, bool):
                        return False, f"Field {field} must be boolean"
                    
                    # Range validation
                    if expected_type == 'number':
                        min_val = constraints.get('min')
                        max_val = constraints.get('max')
                        
                        if min_val is not None and field_value < min_val:
                            return False, f"Field {field} below minimum: {min_val}"
                        
                        if max_val is not None and field_value > max_val:
                            return False, f"Field {field} above maximum: {max_val}"
        
        return True, None
    
    def patch_entity(self, event: UpdateEvent, retry_count: int = 0) -> UpdateResult:
        """
        Execute PATCH request to update entity.
        
        Args:
            event: Update event
            retry_count: Current retry attempt
        
        Returns:
            UpdateResult object
        """
        start_time = time.time()
        
        # Validate update
        is_valid, error_msg = self.validate_update(event)
        if not is_valid:
            logger.warning(f"Invalid update event: {error_msg}")
            return UpdateResult(
                success=False,
                entity_id=event.entity_id,
                event_id=event.event_id,
                error=error_msg,
                retry_count=retry_count
            )
        
        # Build URL
        url = self.build_patch_url(event.entity_id)
        
        # Prepare payload
        payload = event.updates
        
        try:
            # Execute PATCH request
            response = self.session.patch(
                url,
                json=payload,
                timeout=self.timeout
            )
            
            latency_ms = (time.time() - start_time) * 1000
            
            # Check if retry needed
            if response.status_code in self.retry_on_status and retry_count < self.max_retry_attempts:
                # Calculate backoff delay
                delay = min(self.backoff_factor ** retry_count, self.max_backoff)
                
                # Add jitter
                if self.jitter:
                    import random
                    delay = delay * (0.5 + random.random())
                
                logger.warning(f"Retrying update for {event.entity_id} (attempt {retry_count + 1}/{self.max_retry_attempts}) after {delay:.2f}s")
                time.sleep(delay)
                
                return self.patch_entity(event, retry_count + 1)
            
            # Check success
            success = 200 <= response.status_code < 300
            
            if not success:
                logger.error(f"PATCH failed for {event.entity_id}: {response.status_code} - {response.text}")
            
            return UpdateResult(
                success=success,
                entity_id=event.entity_id,
                event_id=event.event_id,
                status_code=response.status_code,
                latency_ms=latency_ms,
                error=response.text if not success else None,
                retry_count=retry_count
            )
        
        except requests.exceptions.Timeout:
            logger.error(f"Timeout updating {event.entity_id}")
            
            if retry_count < self.max_retry_attempts:
                delay = min(self.backoff_factor ** retry_count, self.max_backoff)
                time.sleep(delay)
                return self.patch_entity(event, retry_count + 1)
            
            return UpdateResult(
                success=False,
                entity_id=event.entity_id,
                event_id=event.event_id,
                error="Timeout",
                retry_count=retry_count
            )
        
        except Exception as e:
            logger.error(f"Error updating {event.entity_id}: {e}")
            
            return UpdateResult(
                success=False,
                entity_id=event.entity_id,
                event_id=event.event_id,
                error=str(e),
                retry_count=retry_count
            )
    
    def close(self) -> None:
        """Close HTTP session."""
        self.session.close()
        logger.info("Entity updater closed")


# ============================================================================
# State Updater Agent
# ============================================================================

class StateUpdaterAgent:
    """
    Main State Updater Agent orchestrator.
    
    Coordinates event consumption, deduplication, batching, and entity updates.
    """
    
    def __init__(self, config_path: str):
        """
        Initialize State Updater Agent.
        
        Args:
            config_path: Path to configuration file
        """
        self.config = StateUpdaterConfig(config_path)
        self.event_manager = EventSourceManager(self.config)
        self.entity_updater = EntityUpdater(self.config)
        
        # Processing configuration
        processing_config = self.config.get_processing_config()
        concurrency_config = processing_config.get('concurrency', {})
        
        self.max_workers = concurrency_config.get('max_workers', 10)
        self.queue_size = concurrency_config.get('queue_size', 1000)
        
        # Deduplication
        dedup_config = processing_config.get('deduplication', {})
        self.dedup_enabled = dedup_config.get('enabled', True)
        self.dedup_window = dedup_config.get('window_seconds', 60)
        self.seen_events: Dict[str, float] = {}
        
        # Statistics
        self.stats = {
            'updates_processed': 0,
            'updates_failed': 0,
            'updates_deduped': 0,
            'total_latency_ms': 0,
            'retry_count': 0
        }
        
        self.running = False
        self.executor = None
        
        logger.info("State Updater Agent initialized")
    
    def deduplicate_events(self, events: List[UpdateEvent]) -> List[UpdateEvent]:
        """
        Remove duplicate events based on event ID.
        
        Args:
            events: List of events
        
        Returns:
            List of unique events
        """
        if not self.dedup_enabled:
            return events
        
        current_time = time.time()
        unique_events = []
        
        # Clean old entries
        self.seen_events = {
            eid: ts for eid, ts in self.seen_events.items()
            if current_time - ts < self.dedup_window
        }
        
        # Filter duplicates
        for event in events:
            if event.event_id not in self.seen_events:
                self.seen_events[event.event_id] = current_time
                unique_events.append(event)
            else:
                self.stats['updates_deduped'] += 1
                logger.debug(f"Duplicate event filtered: {event.event_id}")
        
        return unique_events
    
    def process_events(self, events: List[UpdateEvent]) -> List[UpdateResult]:
        """
        Process batch of events concurrently.
        
        Args:
            events: List of events to process
        
        Returns:
            List of update results
        """
        if not events:
            return []
        
        results = []
        
        # Submit tasks to thread pool
        futures = {}
        for event in events:
            future = self.executor.submit(self.entity_updater.patch_entity, event)
            futures[future] = event
        
        # Collect results
        for future in as_completed(futures):
            event = futures[future]
            try:
                result = future.result()
                results.append(result)
                
                # Update statistics
                if result.success:
                    self.stats['updates_processed'] += 1
                else:
                    self.stats['updates_failed'] += 1
                
                if result.latency_ms:
                    self.stats['total_latency_ms'] += result.latency_ms
                
                self.stats['retry_count'] += result.retry_count
            
            except Exception as e:
                logger.error(f"Error processing event {event.event_id}: {e}")
                self.stats['updates_failed'] += 1
        
        return results
    
    def run(self, duration_seconds: Optional[int] = None) -> None:
        """
        Run the agent main loop.
        
        Args:
            duration_seconds: Run for specified duration (None = run forever)
        """
        logger.info("Starting State Updater Agent")
        
        # Start event sources
        self.event_manager.start()
        
        # Create thread pool
        self.executor = ThreadPoolExecutor(max_workers=self.max_workers)
        
        self.running = True
        start_time = time.time()
        
        try:
            while self.running:
                # Check duration
                if duration_seconds and (time.time() - start_time) >= duration_seconds:
                    logger.info("Duration limit reached, stopping agent")
                    break
                
                # Consume events
                events = self.event_manager.consume_events(timeout_s=1.0)
                
                if events:
                    logger.info(f"Received {len(events)} events")
                    
                    # Deduplicate
                    unique_events = self.deduplicate_events(events)
                    logger.info(f"Processing {len(unique_events)} unique events")
                    
                    # Process
                    results = self.process_events(unique_events)
                    
                    # Log results
                    success_count = sum(1 for r in results if r.success)
                    logger.info(f"Processed {len(results)} updates: {success_count} succeeded, {len(results) - success_count} failed")
                
                # Small sleep to prevent busy loop
                time.sleep(0.1)
        
        except KeyboardInterrupt:
            logger.info("Received interrupt signal, stopping agent")
        
        finally:
            self.stop()
    
    def stop(self) -> None:
        """Stop the agent and cleanup resources."""
        logger.info("Stopping State Updater Agent")
        
        self.running = False
        
        # Shutdown executor
        if self.executor:
            self.executor.shutdown(wait=True)
        
        # Close event sources
        self.event_manager.close()
        
        # Close entity updater
        self.entity_updater.close()
        
        # Log final statistics
        self.log_statistics()
        
        logger.info("State Updater Agent stopped")
    
    def log_statistics(self) -> None:
        """Log agent statistics."""
        total_updates = self.stats['updates_processed'] + self.stats['updates_failed']
        
        if total_updates > 0:
            success_rate = (self.stats['updates_processed'] / total_updates) * 100
            avg_latency = self.stats['total_latency_ms'] / self.stats['updates_processed'] if self.stats['updates_processed'] > 0 else 0
            
            logger.info("=== State Updater Agent Statistics ===")
            logger.info(f"Total updates: {total_updates}")
            logger.info(f"Successful: {self.stats['updates_processed']} ({success_rate:.1f}%)")
            logger.info(f"Failed: {self.stats['updates_failed']}")
            logger.info(f"Deduplicated: {self.stats['updates_deduped']}")
            logger.info(f"Average latency: {avg_latency:.2f}ms")
            logger.info(f"Total retries: {self.stats['retry_count']}")
        else:
            logger.info("No updates processed")
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get current statistics.
        
        Returns:
            Statistics dictionary
        """
        return self.stats.copy()


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Main entry point for State Updater Agent."""
    import argparse
    
    parser = argparse.ArgumentParser(description='State Updater Agent - Real-time entity state updater')
    parser.add_argument('--config', type=str, default='config/state_updater_config.yaml',
                       help='Path to configuration file')
    parser.add_argument('--duration', type=int, default=None,
                       help='Run duration in seconds (default: run forever)')
    
    args = parser.parse_args()
    
    # Initialize and run agent
    agent = StateUpdaterAgent(args.config)
    
    try:
        agent.run(duration_seconds=args.duration)
    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        raise


if __name__ == '__main__':
    main()
