"""Performance Monitor Agent.

Module: src.agents.monitoring.performance_monitor_agent
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25s
Version: 2.0.0
License: MIT

Description:
    Comprehensive monitoring system for collecting, exporting, and analyzing
    system, application, and database performance metrics.

Monitored Metrics:
    - System: CPU, memory, disk I/O, network
    - Application: Request rate, response time, error rate
    - Database: Query performance, connection pool
    - Custom: Business-specific KPIs

Core Features:
    - Prometheus metrics export
    - Real-time metric collection
    - Historical data tracking
    - Alert threshold configuration
    - Metric aggregation and analysis
    - Grafana dashboard integration

Dependencies:
    - psutil>=5.9: System metrics
    - prometheus_client>=0.16: Metrics export
    - neo4j>=5.0: Database monitoring
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/performance_monitor_config.yaml:
        - collection_interval: Metrics collection frequency (seconds)
        - prometheus_port: Metrics export port
        - alert_thresholds: Warning/critical levels
        - enabled_collectors: Active metric collectors

Example:
    ```python
    from src.agents.monitoring.performance_monitor_agent import PerformanceMonitorAgent
    
    monitor = PerformanceMonitorAgent()
    monitor.start()
    
    # Access metrics
    metrics = monitor.get_current_metrics()
    print(f"CPU: {metrics['cpu_percent']}%")
    ```

Prometheus Metrics:
    - system_cpu_percent: CPU utilization
    - system_memory_bytes: Memory usage
    - app_requests_total: Total requests
    - app_response_time_seconds: Response latency
    - db_query_duration_seconds: Database query time

Integration:
    Grafana Dashboard: config/grafana_dashboard.json

References:
    - Prometheus: https://prometheus.io/docs/
    - Grafana: https://grafana.com/docs/
"""

import os
import sys
import time
import logging
import threading
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict, deque
import statistics

# Import centralized environment variable expansion helper
from src.core.config_loader import expand_env_var

# System monitoring
import psutil

# Prometheus metrics
from prometheus_client import (
    start_http_server,
    Counter,
    Gauge,
    Histogram,
    Summary,
    generate_latest,
    CollectorRegistry,
    REGISTRY
)

# Neo4j
from neo4j import GraphDatabase, basic_auth


# ==============================================================================
# CONFIGURATION LOADER
# ==============================================================================

class PerformanceMonitorConfig:
    """Load and validate performance monitor configuration from YAML."""
    
    def __init__(self, config_path: str):
        """
        Initialize configuration loader.
        
        Args:
            config_path: Path to YAML configuration file
        """
        self.config_path = config_path
        self.config = self._load_config()
        # Use centralized expand_env_var for ${VAR:-default} syntax support
        self.config = expand_env_var(self.config)
        self.logger = self._setup_logging()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load YAML configuration file."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            if not config or 'performance_monitor' not in config:
                raise ValueError("Invalid configuration: missing 'performance_monitor' section")
            
            return config
        
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML configuration: {e}")
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration."""
        log_config = self.config.get('logging', {})
        
        # Create logs directory
        log_file = log_config.get('file', 'logs/performance_monitor.log')
        log_dir = os.path.dirname(log_file)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)
        
        # Configure logger
        logger = logging.getLogger('PerformanceMonitor')
        logger.setLevel(getattr(logging, log_config.get('level', 'INFO')))
        
        # File handler with rotation
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=log_config.get('max_bytes', 10485760),
            backupCount=log_config.get('backup_count', 5)
        )
        file_handler.setFormatter(
            logging.Formatter(log_config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        )
        logger.addHandler(file_handler)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(
            logging.Formatter(log_config.get('format', '%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        )
        logger.addHandler(console_handler)
        
        return logger
    
    def get_collection_interval(self) -> int:
        """Get metrics collection interval in seconds."""
        return self.config['performance_monitor'].get('collection_interval', 30)
    
    def get_enabled_collectors(self) -> List[str]:
        """Get list of enabled metric collectors."""
        return self.config['performance_monitor'].get('enabled_collectors', ['system', 'application', 'neo4j'])
    
    def get_system_metrics(self) -> List[Dict[str, Any]]:
        """Get system metrics configuration."""
        return self.config['performance_monitor'].get('system_metrics', [])
    
    def get_application_metrics(self) -> List[Dict[str, Any]]:
        """Get application metrics configuration."""
        return self.config['performance_monitor'].get('application_metrics', [])
    
    def get_neo4j_config(self) -> Dict[str, Any]:
        """Get Neo4j metrics configuration."""
        return self.config['performance_monitor'].get('neo4j_metrics', {})
    
    def get_prometheus_config(self) -> Dict[str, Any]:
        """Get Prometheus exporter configuration."""
        return self.config['performance_monitor'].get('prometheus', {})
    
    def get_alerting_config(self) -> Dict[str, Any]:
        """Get alerting rules configuration."""
        return self.config.get('performance_monitor', {}).get('alerting', {})
    
    def get_trend_analysis_config(self) -> Dict[str, Any]:
        """Get trend analysis configuration."""
        return self.config.get('trend_analysis', {})


# ==============================================================================
# SYSTEM METRICS COLLECTOR
# ==============================================================================

class SystemMetricsCollector:
    """
    Collect OS-level system metrics using psutil.
    Domain-agnostic system resource monitoring.
    """
    
    def __init__(self, config: PerformanceMonitorConfig):
        """
        Initialize system metrics collector.
        
        Args:
            config: Performance monitor configuration
        """
        self.config = config
        self.logger = config.logger
        self.metrics_config = config.get_system_metrics()
        
        # Track previous values for rate calculations
        self.prev_disk_io = None
        self.prev_net_io = None
        self.prev_timestamp = None
    
    def collect(self) -> Dict[str, Any]:
        """
        Collect all enabled system metrics.
        
        Returns:
            Dictionary of metric name to value(s)
        """
        metrics = {}
        current_time = time.time()
        
        for metric_config in self.metrics_config:
            if not metric_config.get('enabled', True):
                continue
            
            metric_name = metric_config['name']
            
            try:
                # CPU metrics
                if metric_name == 'cpu_percent':
                    metrics[metric_name] = psutil.cpu_percent(interval=0.1)
                
                elif metric_name == 'cpu_count':
                    metrics[metric_name] = psutil.cpu_count()
                
                elif metric_name == 'cpu_freq_current':
                    freq = psutil.cpu_freq()
                    if freq:
                        metrics[metric_name] = freq.current
                
                # Memory metrics
                elif metric_name == 'memory_percent':
                    metrics[metric_name] = psutil.virtual_memory().percent
                
                elif metric_name == 'memory_used_bytes':
                    metrics[metric_name] = psutil.virtual_memory().used
                
                elif metric_name == 'memory_available_bytes':
                    metrics[metric_name] = psutil.virtual_memory().available
                
                elif metric_name == 'swap_percent':
                    metrics[metric_name] = psutil.swap_memory().percent
                
                # Disk metrics
                elif metric_name == 'disk_usage_percent':
                    disk_metrics = []
                    for partition in psutil.disk_partitions():
                        try:
                            usage = psutil.disk_usage(partition.mountpoint)
                            disk_metrics.append({
                                'mount_point': partition.mountpoint,
                                'value': usage.percent
                            })
                        except (PermissionError, OSError):
                            continue
                    metrics[metric_name] = disk_metrics
                
                elif metric_name in ['disk_io_read_bytes', 'disk_io_write_bytes', 
                                      'disk_io_read_count', 'disk_io_write_count']:
                    current_io = psutil.disk_io_counters()
                    if current_io and self.prev_disk_io and self.prev_timestamp:
                        time_delta = current_time - self.prev_timestamp
                        
                        if metric_name == 'disk_io_read_bytes':
                            metrics[metric_name] = (current_io.read_bytes - self.prev_disk_io.read_bytes) / time_delta
                        elif metric_name == 'disk_io_write_bytes':
                            metrics[metric_name] = (current_io.write_bytes - self.prev_disk_io.write_bytes) / time_delta
                        elif metric_name == 'disk_io_read_count':
                            metrics[metric_name] = (current_io.read_count - self.prev_disk_io.read_count) / time_delta
                        elif metric_name == 'disk_io_write_count':
                            metrics[metric_name] = (current_io.write_count - self.prev_disk_io.write_count) / time_delta
                    
                    self.prev_disk_io = current_io
                
                # Network metrics
                elif metric_name in ['network_bytes_sent', 'network_bytes_recv',
                                      'network_packets_sent', 'network_packets_recv',
                                      'network_errors_in', 'network_errors_out']:
                    current_net = psutil.net_io_counters(pernic=True)
                    
                    if current_net and self.prev_net_io and self.prev_timestamp:
                        time_delta = current_time - self.prev_timestamp
                        net_metrics = []
                        
                        for interface, current_stats in current_net.items():
                            if interface in self.prev_net_io:
                                prev_stats = self.prev_net_io[interface]
                                
                                if metric_name == 'network_bytes_sent':
                                    value = (current_stats.bytes_sent - prev_stats.bytes_sent) / time_delta
                                elif metric_name == 'network_bytes_recv':
                                    value = (current_stats.bytes_recv - prev_stats.bytes_recv) / time_delta
                                elif metric_name == 'network_packets_sent':
                                    value = (current_stats.packets_sent - prev_stats.packets_sent) / time_delta
                                elif metric_name == 'network_packets_recv':
                                    value = (current_stats.packets_recv - prev_stats.packets_recv) / time_delta
                                elif metric_name == 'network_errors_in':
                                    value = (current_stats.errin - prev_stats.errin) / time_delta
                                elif metric_name == 'network_errors_out':
                                    value = (current_stats.errout - prev_stats.errout) / time_delta
                                
                                net_metrics.append({
                                    'interface': interface,
                                    'value': max(0, value)  # Ensure non-negative
                                })
                        
                        metrics[metric_name] = net_metrics
                    
                    self.prev_net_io = current_net
            
            except Exception as e:
                self.logger.error(f"Error collecting system metric {metric_name}: {e}")
        
        self.prev_timestamp = current_time
        return metrics


# ==============================================================================
# APPLICATION METRICS COLLECTOR
# ==============================================================================

class ApplicationMetricsCollector:
    """
    Collect application-level metrics (agents, APIs, queues).
    Domain-agnostic application performance monitoring.
    """
    
    def __init__(self, config: PerformanceMonitorConfig):
        """
        Initialize application metrics collector.
        
        Args:
            config: Performance monitor configuration
        """
        self.config = config
        self.logger = config.logger
        self.metrics_config = config.get_application_metrics()
        
        # In-memory storage for application metrics
        self.counters = defaultdict(int)
        self.gauges = defaultdict(float)
        self.histograms = defaultdict(list)
        self.lock = threading.Lock()
    
    def record_agent_execution(self, agent_name: str, duration: float, status: str):
        """
        Record agent execution metrics.
        
        Args:
            agent_name: Name of the agent
            duration: Execution duration in seconds
            status: Execution status (success, error, timeout)
        """
        with self.lock:
            key = f"agent_execution_time:{agent_name}:{status}"
            self.histograms[key].append(duration)
            
            counter_key = f"agent_execution_count:{agent_name}:{status}"
            self.counters[counter_key] += 1
    
    def record_agent_error(self, agent_name: str, error_type: str):
        """
        Record agent error.
        
        Args:
            agent_name: Name of the agent
            error_type: Type of error
        """
        with self.lock:
            key = f"agent_error_count:{agent_name}:{error_type}"
            self.counters[key] += 1
    
    def record_api_request(self, endpoint: str, method: str, duration: float, status: int):
        """
        Record API request metrics.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            duration: Request duration in seconds
            status: HTTP status code
        """
        with self.lock:
            key = f"api_request_duration:{endpoint}:{method}:{status}"
            self.histograms[key].append(duration)
            
            counter_key = f"api_request_count:{endpoint}:{method}:{status}"
            self.counters[counter_key] += 1
    
    def record_api_error(self, endpoint: str, method: str, error_type: str):
        """
        Record API error.
        
        Args:
            endpoint: API endpoint
            method: HTTP method
            error_type: Type of error
        """
        with self.lock:
            key = f"api_error_count:{endpoint}:{method}:{error_type}"
            self.counters[key] += 1
    
    def set_queue_length(self, queue_name: str, length: int):
        """
        Set current queue length.
        
        Args:
            queue_name: Name of the queue
            length: Current queue length
        """
        with self.lock:
            key = f"queue_length:{queue_name}"
            self.gauges[key] = length
    
    def record_queue_processing(self, queue_name: str, duration: float):
        """
        Record queue processing metrics.
        
        Args:
            queue_name: Name of the queue
            duration: Processing duration in seconds
        """
        with self.lock:
            key = f"queue_processing_time:{queue_name}"
            self.histograms[key].append(duration)
            
            counter_key = f"queue_items_processed:{queue_name}"
            self.counters[counter_key] += 1
    
    def record_entity_processing(self, entity_type: str, operation: str, duration: float):
        """
        Record entity processing metrics.
        
        Args:
            entity_type: Type of entity
            operation: Operation performed
            duration: Processing duration in seconds
        """
        with self.lock:
            key = f"entities_processing_time:{entity_type}:{operation}"
            self.histograms[key].append(duration)
            
            counter_key = f"entities_processed_total:{entity_type}:{operation}"
            self.counters[counter_key] += 1
    
    def record_cache_hit(self, cache_name: str):
        """Record cache hit."""
        with self.lock:
            key = f"cache_hits:{cache_name}"
            self.counters[key] += 1
    
    def record_cache_miss(self, cache_name: str):
        """Record cache miss."""
        with self.lock:
            key = f"cache_misses:{cache_name}"
            self.counters[key] += 1
    
    def set_cache_size(self, cache_name: str, size: int):
        """Set current cache size."""
        with self.lock:
            key = f"cache_size:{cache_name}"
            self.gauges[key] = size
    
    def collect(self) -> Dict[str, Any]:
        """
        Collect all application metrics.
        
        Returns:
            Dictionary of metric name to value(s)
        """
        with self.lock:
            metrics = {
                'counters': dict(self.counters),
                'gauges': dict(self.gauges),
                'histograms': {k: list(v) for k, v in self.histograms.items()}
            }
            
            # Clear histograms after collection to avoid memory growth
            for key in self.histograms:
                # Keep last 1000 samples for each histogram
                if len(self.histograms[key]) > 1000:
                    self.histograms[key] = self.histograms[key][-1000:]
        
        return metrics


# ==============================================================================
# NEO4J METRICS COLLECTOR
# ==============================================================================

class Neo4jMetricsCollector:
    """
    Collect Neo4j database performance metrics.
    Domain-agnostic database monitoring.
    """
    
    def __init__(self, config: PerformanceMonitorConfig):
        """
        Initialize Neo4j metrics collector.
        
        Args:
            config: Performance monitor configuration
        """
        self.config = config
        self.logger = config.logger
        self.neo4j_config = config.get_neo4j_config()
        
        # Initialize Neo4j driver
        self.driver = None
        self._connect()
    
    def _connect(self):
        """Establish Neo4j connection."""
        try:
            import os
            # Priority: environment variables > config > defaults
            uri = os.environ.get("NEO4J_URL") or self.neo4j_config.get('uri', 'bolt://localhost:7687')
            user = os.environ.get("NEO4J_USER") or self.neo4j_config.get('user', 'neo4j')
            password = os.environ.get("NEO4J_PASSWORD") or self.neo4j_config.get('password', 'password')
            
            pool_config = self.neo4j_config.get('connection_pool', {})
            
            self.driver = GraphDatabase.driver(
                uri,
                auth=basic_auth(user, password),
                max_connection_pool_size=pool_config.get('max_size', 50),
                connection_timeout=pool_config.get('timeout', 30)
            )
            
            # Test connection
            with self.driver.session() as session:
                session.run("RETURN 1")
            
            self.logger.info(f"Connected to Neo4j at {uri}")
        
        except Exception as e:
            self.logger.error(f"Failed to connect to Neo4j: {e}")
            self.driver = None
    
    def collect(self) -> Dict[str, Any]:
        """
        Collect all Neo4j metrics.
        
        Returns:
            Dictionary of metric name to value(s)
        """
        if not self.driver:
            self.logger.warning("Neo4j driver not initialized, skipping metrics collection")
            return {}
        
        metrics = {}
        queries = self.neo4j_config.get('queries', [])
        database = self.neo4j_config.get('database', 'neo4j')
        
        for query_config in queries:
            if not query_config.get('enabled', True):
                continue
            
            metric_name = query_config['name']
            query = query_config['query']
            labels = query_config.get('labels', [])
            
            try:
                with self.driver.session(database=database) as session:
                    result = session.run(query)
                    
                    if labels:
                        # Multi-value metric with labels
                        metric_values = []
                        for record in result:
                            value_dict = dict(record)
                            if 'value' in value_dict:
                                metric_values.append(value_dict)
                        metrics[metric_name] = metric_values
                    else:
                        # Single value metric
                        record = result.single()
                        if record and 'value' in record:
                            metrics[metric_name] = record['value']
            
            except Exception as e:
                self.logger.error(f"Error collecting Neo4j metric {metric_name}: {e}")
        
        return metrics
    
    def close(self):
        """Close Neo4j connection."""
        if self.driver:
            self.driver.close()
            self.logger.info("Neo4j connection closed")


# ==============================================================================
# PROMETHEUS EXPORTER
# ==============================================================================

class PrometheusExporter:
    """
    Export metrics in Prometheus format.
    Domain-agnostic metrics exposition.
    """
    
    def __init__(self, config: PerformanceMonitorConfig):
        """
        Initialize Prometheus exporter.
        
        Args:
            config: Performance monitor configuration
        """
        self.config = config
        self.logger = config.logger
        self.prom_config = config.get_prometheus_config()
        
        # Create custom registry to avoid conflicts
        self.registry = CollectorRegistry()
        
        # Metric prefix
        self.prefix = self.prom_config.get('metric_prefix', 'multi_agent_system')
        
        # Default labels
        self.default_labels = self.prom_config.get('default_labels', {})
        
        # Prometheus metric objects
        self.gauges = {}
        self.counters = {}
        self.histograms = {}
        
        # Initialize metrics from config
        self._initialize_metrics()
    
    def _initialize_metrics(self):
        """Initialize Prometheus metric objects from configuration."""
        # System metrics
        for metric_config in self.config.get_system_metrics():
            if not metric_config.get('enabled', True):
                continue
            
            metric_name = f"{self.prefix}_{metric_config['name']}"
            labels = list(self.default_labels.keys()) + metric_config.get('labels', [])
            
            if metric_config.get('type') == 'gauge':
                self.gauges[metric_config['name']] = Gauge(
                    metric_name,
                    metric_config.get('description', ''),
                    labels,
                    registry=self.registry
                )
            elif metric_config.get('type') == 'counter':
                self.counters[metric_config['name']] = Counter(
                    metric_name,
                    metric_config.get('description', ''),
                    labels,
                    registry=self.registry
                )
        
        # Application metrics
        for metric_config in self.config.get_application_metrics():
            if not metric_config.get('enabled', True):
                continue
            
            metric_name = f"{self.prefix}_{metric_config['name']}"
            labels = list(self.default_labels.keys()) + metric_config.get('labels', [])
            
            if metric_config.get('type') == 'gauge':
                self.gauges[metric_config['name']] = Gauge(
                    metric_name,
                    metric_config.get('description', ''),
                    labels,
                    registry=self.registry
                )
            elif metric_config.get('type') == 'counter':
                self.counters[metric_config['name']] = Counter(
                    metric_name,
                    metric_config.get('description', ''),
                    labels,
                    registry=self.registry
                )
            elif metric_config.get('type') == 'histogram':
                self.histograms[metric_config['name']] = Histogram(
                    metric_name,
                    metric_config.get('description', ''),
                    labels,
                    buckets=metric_config.get('buckets', (0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0)),
                    registry=self.registry
                )
        
        # Neo4j metrics
        neo4j_queries = self.config.get_neo4j_config().get('queries', [])
        for query_config in neo4j_queries:
            if not query_config.get('enabled', True):
                continue
            
            metric_name = f"{self.prefix}_{query_config['name']}"
            labels = list(self.default_labels.keys()) + query_config.get('labels', [])
            
            if query_config.get('type') == 'gauge':
                self.gauges[query_config['name']] = Gauge(
                    metric_name,
                    query_config.get('description', ''),
                    labels,
                    registry=self.registry
                )
            elif query_config.get('type') == 'counter':
                self.counters[query_config['name']] = Counter(
                    metric_name,
                    query_config.get('description', ''),
                    labels,
                    registry=self.registry
                )
    
    def update_metrics(self, system_metrics: Dict[str, Any], 
                       app_metrics: Dict[str, Any],
                       neo4j_metrics: Dict[str, Any]):
        """
        Update Prometheus metrics with collected data.
        
        Args:
            system_metrics: System metrics from SystemMetricsCollector
            app_metrics: Application metrics from ApplicationMetricsCollector
            neo4j_metrics: Neo4j metrics from Neo4jMetricsCollector
        """
        # Update system metrics
        for metric_name, value in system_metrics.items():
            if metric_name in self.gauges:
                if isinstance(value, list):
                    # Multi-label metric
                    for item in value:
                        label_values = {**self.default_labels, **{k: v for k, v in item.items() if k != 'value'}}
                        self.gauges[metric_name].labels(**label_values).set(item['value'])
                else:
                    # Single value metric
                    self.gauges[metric_name].labels(**self.default_labels).set(value)
            
            elif metric_name in self.counters:
                if isinstance(value, list):
                    for item in value:
                        label_values = {**self.default_labels, **{k: v for k, v in item.items() if k != 'value'}}
                        # Counter.inc() for rate metrics
                        self.counters[metric_name].labels(**label_values).inc(item['value'])
                else:
                    self.counters[metric_name].labels(**self.default_labels).inc(value)
        
        # Update application metrics
        for counter_key, count in app_metrics.get('counters', {}).items():
            metric_name, *label_parts = counter_key.split(':')
            if metric_name in self.counters:
                # Parse labels from key
                labels_dict = self.default_labels.copy()
                
                # Get label names from metric config
                for metric_config in self.config.get_application_metrics():
                    if metric_config['name'] == metric_name:
                        label_names = metric_config.get('labels', [])
                        for i, label_name in enumerate(label_names):
                            if i < len(label_parts):
                                labels_dict[label_name] = label_parts[i]
                        break
                
                self.counters[metric_name].labels(**labels_dict).inc(count)
        
        for gauge_key, value in app_metrics.get('gauges', {}).items():
            metric_name, *label_parts = gauge_key.split(':')
            if metric_name in self.gauges:
                labels_dict = self.default_labels.copy()
                
                for metric_config in self.config.get_application_metrics():
                    if metric_config['name'] == metric_name:
                        label_names = metric_config.get('labels', [])
                        for i, label_name in enumerate(label_names):
                            if i < len(label_parts):
                                labels_dict[label_name] = label_parts[i]
                        break
                
                self.gauges[metric_name].labels(**labels_dict).set(value)
        
        for hist_key, values in app_metrics.get('histograms', {}).items():
            metric_name, *label_parts = hist_key.split(':')
            if metric_name in self.histograms:
                labels_dict = self.default_labels.copy()
                
                for metric_config in self.config.get_application_metrics():
                    if metric_config['name'] == metric_name:
                        label_names = metric_config.get('labels', [])
                        for i, label_name in enumerate(label_names):
                            if i < len(label_parts):
                                labels_dict[label_name] = label_parts[i]
                        break
                
                # Observe all histogram values
                hist_metric = self.histograms[metric_name].labels(**labels_dict)
                for value in values:
                    hist_metric.observe(value)
        
        # Update Neo4j metrics
        for metric_name, value in neo4j_metrics.items():
            if metric_name in self.gauges:
                if isinstance(value, list):
                    for item in value:
                        label_values = {**self.default_labels, **{k: v for k, v in item.items() if k != 'value'}}
                        self.gauges[metric_name].labels(**label_values).set(item['value'])
                else:
                    self.gauges[metric_name].labels(**self.default_labels).set(value)
            
            elif metric_name in self.counters:
                if isinstance(value, list):
                    for item in value:
                        label_values = {**self.default_labels, **{k: v for k, v in item.items() if k != 'value'}}
                        self.counters[metric_name].labels(**label_values).inc(item['value'])
                else:
                    self.counters[metric_name].labels(**self.default_labels).inc(value)
    
    def start_http_server(self):
        """Start HTTP server to expose metrics."""
        host = self.prom_config.get('host', '0.0.0.0')
        port = self.prom_config.get('port', 9091)
        
        try:
            start_http_server(port, addr=host, registry=self.registry)
            self.logger.info(f"Prometheus metrics exposed on http://{host}:{port}/metrics")
        except Exception as e:
            self.logger.error(f"Failed to start Prometheus HTTP server: {e}")
    
    def generate_metrics_text(self) -> str:
        """
        Generate metrics in Prometheus text format.
        
        Returns:
            Prometheus metrics as text
        """
        return generate_latest(self.registry).decode('utf-8')


# ==============================================================================
# ALERT MANAGER
# ==============================================================================

class AlertManager:
    """
    Evaluate alert rules and send notifications.
    Domain-agnostic alerting system.
    """
    
    def __init__(self, config: PerformanceMonitorConfig):
        """
        Initialize alert manager.
        
        Args:
            config: Performance monitor configuration
        """
        self.config = config
        self.logger = config.logger
        self.alerting_config = config.get_alerting_config()
        
        # Alert state tracking
        self.alert_states = {}  # metric_name -> {start_time, triggered}
        self.active_alerts = []
        
        # Historical data for aggregations
        self.metric_history = defaultdict(lambda: deque(maxlen=1000))
    
    def record_metric_value(self, metric_name: str, value: float, timestamp: float = None):
        """
        Record metric value for alert evaluation.
        
        Args:
            metric_name: Name of the metric
            value: Metric value
            timestamp: Optional timestamp (defaults to current time)
        """
        if timestamp is None:
            timestamp = time.time()
        
        self.metric_history[metric_name].append({
            'value': value,
            'timestamp': timestamp
        })
    
    def evaluate_rules(self) -> List[Dict[str, Any]]:
        """
        Evaluate all alert rules and trigger alerts if necessary.
        
        Returns:
            List of triggered alerts
        """
        if not self.alerting_config.get('enabled', True):
            return []
        
        triggered_alerts = []
        rules = self.alerting_config.get('rules', [])
        current_time = time.time()
        
        for rule in rules:
            if not rule.get('enabled', True):
                continue
            
            rule_name = rule['name']
            metric_name = rule['metric']
            condition = rule['condition']
            threshold = rule['threshold']
            duration = rule.get('duration', 0)
            aggregation = rule.get('aggregation', None)
            
            # Get metric values
            if metric_name not in self.metric_history:
                continue
            
            history = self.metric_history[metric_name]
            
            # Apply aggregation if specified
            if aggregation:
                recent_values = [
                    item['value'] for item in history
                    if current_time - item['timestamp'] <= duration
                ]
                
                if not recent_values:
                    continue
                
                if aggregation == 'p50':
                    value = statistics.median(recent_values)
                elif aggregation == 'p95':
                    value = statistics.quantiles(recent_values, n=20)[18] if len(recent_values) >= 20 else max(recent_values)
                elif aggregation == 'p99':
                    value = statistics.quantiles(recent_values, n=100)[98] if len(recent_values) >= 100 else max(recent_values)
                elif aggregation == 'mean':
                    value = statistics.mean(recent_values)
                elif aggregation == 'max':
                    value = max(recent_values)
                elif aggregation == 'min':
                    value = min(recent_values)
                elif aggregation.startswith('rate_'):
                    # Rate over time window (e.g., rate_5m)
                    window_str = aggregation.split('_')[1]
                    if window_str.endswith('m'):
                        window = int(window_str[:-1]) * 60
                    elif window_str.endswith('s'):
                        window = int(window_str[:-1])
                    else:
                        window = 300  # Default 5 minutes
                    
                    window_values = [
                        item['value'] for item in history
                        if current_time - item['timestamp'] <= window
                    ]
                    
                    if len(window_values) >= 2:
                        value = sum(window_values) / window
                    else:
                        continue
                else:
                    value = recent_values[-1]
            else:
                # Use most recent value
                if not history:
                    continue
                value = history[-1]['value']
            
            # Evaluate condition
            condition_met = False
            if condition == '>':
                condition_met = value > threshold
            elif condition == '<':
                condition_met = value < threshold
            elif condition == '>=':
                condition_met = value >= threshold
            elif condition == '<=':
                condition_met = value <= threshold
            elif condition == '==':
                condition_met = value == threshold
            elif condition == '!=':
                condition_met = value != threshold
            
            # Check duration
            if condition_met:
                if rule_name not in self.alert_states:
                    self.alert_states[rule_name] = {
                        'start_time': current_time,
                        'triggered': False
                    }
                
                state = self.alert_states[rule_name]
                duration_met = (current_time - state['start_time']) >= duration
                
                if duration_met and not state['triggered']:
                    # Trigger alert
                    alert = {
                        'rule_name': rule_name,
                        'metric': metric_name,
                        'value': value,
                        'threshold': threshold,
                        'condition': condition,
                        'severity': rule.get('severity', 'warning'),
                        'message': rule.get('message', f'{metric_name} {condition} {threshold}'),
                        'timestamp': current_time
                    }
                    
                    triggered_alerts.append(alert)
                    self.active_alerts.append(alert)
                    state['triggered'] = True
                    
                    self._send_notification(alert)
            else:
                # Reset alert state
                if rule_name in self.alert_states:
                    if self.alert_states[rule_name]['triggered']:
                        # Alert resolved
                        self.logger.info(f"Alert resolved: {rule_name}")
                    del self.alert_states[rule_name]
        
        return triggered_alerts
    
    def _send_notification(self, alert: Dict[str, Any]):
        """
        Send alert notification via configured channels.
        
        Args:
            alert: Alert details
        """
        channels = self.alerting_config.get('notifications', {}).get('channels', [])
        
        for channel in channels:
            if not channel.get('enabled', False):
                continue
            
            channel_type = channel['type']
            
            try:
                if channel_type == 'log':
                    level = channel.get('level', 'warning').upper()
                    log_method = getattr(self.logger, level.lower(), self.logger.warning)
                    log_method(f"ALERT [{alert['severity']}]: {alert['message']} (value={alert['value']:.2f}, threshold={alert['threshold']})")
                
                elif channel_type == 'kafka':
                    # Send to Kafka topic (implementation depends on existing Kafka setup)
                    topic = channel.get('topic', 'system-alerts')
                    self.logger.info(f"Would send alert to Kafka topic '{topic}': {alert['message']}")
                
                elif channel_type == 'webhook':
                    # Send to webhook URL
                    url = channel.get('url')
                    if url:
                        import requests
                        requests.post(url, json=alert, timeout=5)
                        self.logger.info(f"Sent alert to webhook: {url}")
            
            except Exception as e:
                self.logger.error(f"Failed to send notification via {channel_type}: {e}")
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get list of currently active alerts."""
        return self.active_alerts.copy()
    
    def clear_active_alerts(self):
        """Clear all active alerts."""
        self.active_alerts.clear()


# ==============================================================================
# TREND ANALYSIS ENGINE
# ==============================================================================

class TrendAnalysisEngine:
    """
    Analyze historical trends and detect anomalies.
    Domain-agnostic trend analysis.
    """
    
    def __init__(self, config: PerformanceMonitorConfig):
        """
        Initialize trend analysis engine.
        
        Args:
            config: Performance monitor configuration
        """
        self.config = config
        self.logger = config.logger
        self.trend_config = config.get_trend_analysis_config()
        
        # Historical data storage
        self.metric_history = defaultdict(lambda: deque(maxlen=10000))
        
        # Storage backend
        self._initialize_storage()
    
    def _initialize_storage(self):
        """Initialize persistent storage for historical data."""
        if not self.trend_config.get('enabled', True):
            return
        
        storage_config = self.trend_config.get('storage', {})
        backend = storage_config.get('backend', 'file')
        
        if backend == 'file':
            path = storage_config.get('path', 'logs/metrics_history')
            os.makedirs(path, exist_ok=True)
            self.storage_path = path
        else:
            self.logger.warning(f"Storage backend '{backend}' not yet implemented, using in-memory only")
    
    def record_metric(self, metric_name: str, value: float, timestamp: float = None):
        """
        Record metric value for trend analysis.
        
        Args:
            metric_name: Name of the metric
            value: Metric value
            timestamp: Optional timestamp (defaults to current time)
        """
        if timestamp is None:
            timestamp = time.time()
        
        self.metric_history[metric_name].append({
            'value': value,
            'timestamp': timestamp
        })
    
    def get_trend_statistics(self, metric_name: str, window: str) -> Dict[str, float]:
        """
        Calculate trend statistics for a metric over a time window.
        
        Args:
            metric_name: Name of the metric
            window: Time window (e.g., '1h', '24h', '7d')
        
        Returns:
            Dictionary of statistics (mean, max, min, p50, p95, p99)
        """
        if metric_name not in self.metric_history:
            return {}
        
        # Parse window
        window_seconds = self._parse_window(window)
        current_time = time.time()
        
        # Get values in window
        values = [
            item['value'] for item in self.metric_history[metric_name]
            if current_time - item['timestamp'] <= window_seconds
        ]
        
        if not values:
            return {}
        
        stats = {
            'mean': statistics.mean(values),
            'max': max(values),
            'min': min(values),
            'count': len(values)
        }
        
        # Percentiles
        if len(values) >= 2:
            stats['p50'] = statistics.median(values)
        
        if len(values) >= 20:
            quantiles = statistics.quantiles(values, n=20)
            stats['p95'] = quantiles[18]
        
        if len(values) >= 100:
            quantiles = statistics.quantiles(values, n=100)
            stats['p99'] = quantiles[98]
        
        return stats
    
    def detect_anomalies(self, metric_name: str) -> List[Dict[str, Any]]:
        """
        Detect anomalies in metric values using configured algorithm.
        
        Args:
            metric_name: Name of the metric
        
        Returns:
            List of detected anomalies
        """
        if not self.trend_config.get('enabled', True):
            return []
        
        anomaly_config = self.trend_config.get('anomaly_detection', {})
        if not anomaly_config.get('enabled', True):
            return []
        
        if metric_name not in self.metric_history:
            return []
        
        history = list(self.metric_history[metric_name])
        min_samples = anomaly_config.get('min_samples', 100)
        
        if len(history) < min_samples:
            return []
        
        algorithm = anomaly_config.get('algorithm', 'zscore')
        sensitivity = anomaly_config.get('sensitivity', 2.0)
        
        anomalies = []
        
        if algorithm == 'zscore':
            # Z-score based anomaly detection
            values = [item['value'] for item in history]
            mean = statistics.mean(values)
            stdev = statistics.stdev(values)
            
            for item in history[-10:]:  # Check last 10 values
                if stdev > 0:
                    zscore = abs((item['value'] - mean) / stdev)
                    if zscore > sensitivity:
                        anomalies.append({
                            'metric': metric_name,
                            'value': item['value'],
                            'timestamp': item['timestamp'],
                            'zscore': zscore,
                            'expected_range': (mean - sensitivity * stdev, mean + sensitivity * stdev)
                        })
        
        elif algorithm == 'iqr':
            # Interquartile range based detection
            values = sorted([item['value'] for item in history])
            q1 = statistics.quantiles(values, n=4)[0]
            q3 = statistics.quantiles(values, n=4)[2]
            iqr = q3 - q1
            
            lower_bound = q1 - sensitivity * iqr
            upper_bound = q3 + sensitivity * iqr
            
            for item in history[-10:]:
                if item['value'] < lower_bound or item['value'] > upper_bound:
                    anomalies.append({
                        'metric': metric_name,
                        'value': item['value'],
                        'timestamp': item['timestamp'],
                        'expected_range': (lower_bound, upper_bound)
                    })
        
        return anomalies
    
    def _parse_window(self, window: str) -> int:
        """
        Parse time window string to seconds.
        
        Args:
            window: Time window string (e.g., '1h', '24h', '7d')
        
        Returns:
            Window duration in seconds
        """
        if window.endswith('s'):
            return int(window[:-1])
        elif window.endswith('m'):
            return int(window[:-1]) * 60
        elif window.endswith('h'):
            return int(window[:-1]) * 3600
        elif window.endswith('d'):
            return int(window[:-1]) * 86400
        else:
            return 300  # Default 5 minutes


# ==============================================================================
# PERFORMANCE MONITOR AGENT (MAIN ORCHESTRATOR)
# ==============================================================================

class PerformanceMonitorAgent:
    """Main performance monitoring agent that orchestrates all collectors.
    
    Configuration-driven monitoring system for system, application, and database metrics.
    """
    
    def __init__(self, config_path: str = "config/performance_monitor_config.yaml"):
        """
        Initialize performance monitor agent.
        
        Args:
            config_path: Path to configuration file
        """
        self.config = PerformanceMonitorConfig(config_path)
        self.logger = self.config.logger
        
        # Initialize collectors based on enabled list
        enabled_collectors = self.config.get_enabled_collectors()
        
        self.system_collector = None
        if 'system' in enabled_collectors:
            self.system_collector = SystemMetricsCollector(self.config)
        
        self.app_collector = None
        if 'application' in enabled_collectors:
            self.app_collector = ApplicationMetricsCollector(self.config)
        
        self.neo4j_collector = None
        if 'neo4j' in enabled_collectors:
            self.neo4j_collector = Neo4jMetricsCollector(self.config)
        
        # Prometheus exporter
        self.exporter = PrometheusExporter(self.config)
        
        # Alert manager
        self.alert_manager = AlertManager(self.config)
        
        # Trend analysis
        self.trend_analyzer = TrendAnalysisEngine(self.config)
        
        # Collection control
        self.running = False
        self.collection_thread = None
    
    def start(self):
        """Start metrics collection and HTTP server."""
        if self.running:
            self.logger.warning("Performance monitor already running")
            return
        
        self.running = True
        
        # Start Prometheus HTTP server
        self.exporter.start_http_server()
        
        # Start collection thread
        self.collection_thread = threading.Thread(target=self._collection_loop, daemon=True)
        self.collection_thread.start()
        
        self.logger.info("Performance monitor agent started")
    
    def stop(self):
        """Stop metrics collection."""
        self.running = False
        
        if self.collection_thread:
            self.collection_thread.join(timeout=5)
        
        if self.neo4j_collector:
            self.neo4j_collector.close()
        
        self.logger.info("Performance monitor agent stopped")
    
    def _collection_loop(self):
        """Main collection loop running in background thread."""
        interval = self.config.get_collection_interval()
        
        while self.running:
            try:
                self._collect_and_export()
            except Exception as e:
                self.logger.error(f"Error in collection loop: {e}", exc_info=True)
            
            time.sleep(interval)
    
    def _collect_and_export(self):
        """Collect metrics from all sources and export to Prometheus."""
        collection_start = time.time()
        
        # Collect metrics
        system_metrics = {}
        app_metrics = {}
        neo4j_metrics = {}
        
        if self.system_collector:
            system_metrics = self.system_collector.collect()
        
        if self.app_collector:
            app_metrics = self.app_collector.collect()
        
        if self.neo4j_collector:
            neo4j_metrics = self.neo4j_collector.collect()
        
        # Update Prometheus metrics
        self.exporter.update_metrics(system_metrics, app_metrics, neo4j_metrics)
        
        # Record metrics for alerting and trend analysis
        self._record_for_analysis(system_metrics, app_metrics, neo4j_metrics)
        
        # Evaluate alert rules
        alerts = self.alert_manager.evaluate_rules()
        if alerts:
            self.logger.info(f"Triggered {len(alerts)} alerts")
        
        # Detect anomalies
        self._detect_anomalies()
        
        collection_duration = time.time() - collection_start
        self.logger.debug(f"Metrics collection completed in {collection_duration:.2f}s")
    
    def _record_for_analysis(self, system_metrics: Dict, app_metrics: Dict, neo4j_metrics: Dict):
        """Record metrics for alerting and trend analysis."""
        current_time = time.time()
        
        # Record system metrics
        for metric_name, value in system_metrics.items():
            if isinstance(value, (int, float)):
                self.alert_manager.record_metric_value(metric_name, value, current_time)
                self.trend_analyzer.record_metric(metric_name, value, current_time)
        
        # Record Neo4j metrics
        for metric_name, value in neo4j_metrics.items():
            if isinstance(value, (int, float)):
                self.alert_manager.record_metric_value(metric_name, value, current_time)
                self.trend_analyzer.record_metric(metric_name, value, current_time)
    
    def _detect_anomalies(self):
        """Detect anomalies in tracked metrics."""
        tracked_metrics = self.config.get_trend_analysis_config().get('tracked_metrics', [])
        
        for metric_config in tracked_metrics:
            metric_name = metric_config['metric']
            anomalies = self.trend_analyzer.detect_anomalies(metric_name)
            
            for anomaly in anomalies:
                self.logger.warning(
                    f"Anomaly detected in {metric_name}: "
                    f"value={anomaly['value']:.2f}, "
                    f"expected_range={anomaly['expected_range']}"
                )
    
    def get_application_collector(self) -> Optional[ApplicationMetricsCollector]:
        """Get application metrics collector for external use."""
        return self.app_collector
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """
        Get current metrics summary.
        
        Returns:
            Dictionary containing metrics summary
        """
        summary = {
            'timestamp': datetime.now().isoformat(),
            'active_alerts': self.alert_manager.get_active_alerts(),
            'collectors': {
                'system': self.system_collector is not None,
                'application': self.app_collector is not None,
                'neo4j': self.neo4j_collector is not None
            }
        }
        
        # Add trend statistics for tracked metrics
        tracked_metrics = self.config.get_trend_analysis_config().get('tracked_metrics', [])
        summary['trends'] = {}
        
        for metric_config in tracked_metrics:
            metric_name = metric_config['metric']
            windows = metric_config.get('windows', ['1h'])
            
            summary['trends'][metric_name] = {}
            for window in windows:
                stats = self.trend_analyzer.get_trend_statistics(metric_name, window)
                summary['trends'][metric_name][window] = stats
        
        return summary


# ==============================================================================
# MAIN EXECUTION
# ==============================================================================

if __name__ == "__main__":
    # Example usage
    agent = PerformanceMonitorAgent()
    
    try:
        agent.start()
        
        # Keep running
        while True:
            time.sleep(60)
            
            # Print summary every minute
            summary = agent.get_metrics_summary()
            print(f"\n=== Metrics Summary at {summary['timestamp']} ===")
            print(f"Active alerts: {len(summary['active_alerts'])}")
            
            for alert in summary['active_alerts']:
                print(f"  [{alert['severity']}] {alert['message']}")
    
    except KeyboardInterrupt:
        print("\nShutting down...")
        agent.stop()
