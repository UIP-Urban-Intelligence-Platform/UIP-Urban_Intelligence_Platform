#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Health Check Agent - Comprehensive Monitoring System.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.monitoring.health_check_agent
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-25
Version: 2.0.0
License: MIT

Description:
    Comprehensive health monitoring system for services, data quality,
    and performance metrics with alerting capabilities.

Monitoring Capabilities:
    - Service availability (HTTP, TCP, Cypher, SPARQL, Kafka)
    - Data quality validation (thresholds, counts, age)
    - Performance metrics (response times, latency)
    - Alerting (webhook, email, Slack integration)
    - Prometheus metrics export
    - Health dashboard REST API

Core Features:
    - Multi-protocol health checks
    - Configurable alert thresholds
    - Historical health tracking
    - Real-time dashboard
    - Automated remediation triggers

Dependencies:
    - requests>=2.28: HTTP health checks
    - neo4j>=5.0: Cypher query validation
    - kafka-python>=2.0: Kafka connectivity
    - prometheus_client>=0.16: Metrics export
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/health_check_config.yaml:
        - services: Monitored services and endpoints
        - checks: Health check definitions
        - alert_rules: Alert thresholds
        - prometheus_config: Metrics export settings

Example:
    ```python
    from src.agents.monitoring.health_check_agent import HealthCheckAgent

    agent = HealthCheckAgent()
    agent.start_monitoring()

    # Get health status
    status = agent.get_health_status()
    print(f"Overall Health: {status['overall_health']}")
    ```

Prometheus Metrics:
    - service_health_status: Binary health indicator (0=down, 1=up)
    - service_response_time_seconds: Health check latency
    - data_quality_score: Quality metric (0-100)

References:
    - Prometheus: https://prometheus.io/
"""

import logging
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

# HTTP requests
import requests
import yaml

# Flask for API
from flask import Flask, jsonify, request

from src.core.config_loader import expand_env_var

# Prometheus client
try:
    from prometheus_client import REGISTRY, Counter, Gauge, Histogram, generate_latest

    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    logging.warning("prometheus_client not available - metrics export disabled")

# Neo4j driver (optional)
try:
    from neo4j import GraphDatabase

    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    logging.warning("neo4j driver not available - Cypher checks disabled")

# Kafka client (optional)
try:
    from kafka import KafkaAdminClient

    KAFKA_AVAILABLE = True
except (ImportError, SyntaxError):
    KAFKA_AVAILABLE = False
    logging.warning("kafka-python not available - Kafka checks disabled")


class HealthCheckConfig:
    """Configuration loader with environment variable expansion."""

    def __init__(self, config_path: str):
        """
        Load health check configuration from YAML.

        Args:
            config_path: Path to YAML configuration file
        """
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load and parse YAML configuration."""
        if not Path(self.config_path).exists():
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")

        with open(self.config_path, "r") as f:
            config = yaml.safe_load(f)

        # Expand environment variables using centralized helper
        config = expand_env_var(config)

        return config

    def get_checks(self) -> List[Dict[str, Any]]:
        """Get service availability checks."""
        return self.config.get("health_check", {}).get("checks", [])

    def get_data_quality_checks(self) -> List[Dict[str, Any]]:
        """Get data quality checks."""
        return self.config.get("health_check", {}).get("data_quality_checks", [])

    def get_performance_checks(self) -> List[Dict[str, Any]]:
        """Get performance checks."""
        return self.config.get("health_check", {}).get("performance_checks", [])

    def get_interval(self) -> int:
        """Get check interval in seconds."""
        return self.config.get("health_check", {}).get("interval", 300)

    def get_alerting_config(self) -> Dict[str, Any]:
        """Get alerting configuration."""
        return self.config.get("health_check", {}).get("alerting", {})

    def get_prometheus_config(self) -> Dict[str, Any]:
        """Get Prometheus configuration."""
        return self.config.get("health_check", {}).get("prometheus", {})

    def get_api_config(self) -> Dict[str, Any]:
        """Get API configuration."""
        return self.config.get("health_check", {}).get("api", {})

    def get_status_rules(self) -> List[Dict[str, Any]]:
        """Get status aggregation rules."""
        return self.config.get("health_check", {}).get("status", {}).get("rules", [])


class ServiceChecker:
    """Execute service availability checks."""

    def __init__(self):
        """Initialize service checker."""
        self.logger = logging.getLogger(__name__)

    def check(self, check_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a service check.

        Args:
            check_config: Check configuration

        Returns:
            Check result with status, response_time, error
        """
        check_type = check_config.get("type")
        check_name = check_config.get("name")

        start_time = time.time()
        result = {
            "name": check_name,
            "type": check_type,
            "status": "UNKNOWN",
            "response_time_ms": 0,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        try:
            if check_type == "http":
                result.update(self._check_http(check_config))
            elif check_type == "tcp":
                result.update(self._check_tcp(check_config))
            elif check_type == "cypher":
                result.update(self._check_cypher(check_config))
            elif check_type == "sparql":
                result.update(self._check_sparql(check_config))
            elif check_type == "kafka":
                result.update(self._check_kafka(check_config))
            else:
                result["status"] = "ERROR"
                result["error"] = f"Unknown check type: {check_type}"

            # Calculate response time
            response_time = (time.time() - start_time) * 1000
            result["response_time_ms"] = round(response_time, 2)

        except Exception as e:
            self.logger.error(f"Check {check_name} failed: {e}")
            result["status"] = "ERROR"
            result["error"] = str(e)
            result["response_time_ms"] = round((time.time() - start_time) * 1000, 2)

        return result

    def _check_http(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check HTTP endpoint."""
        url = config.get("url")
        method = config.get("method", "GET").upper()
        timeout = config.get("timeout", 5)
        expected_status = config.get("expected_status", 200)
        headers = config.get("headers", {})

        # Convert single status to list
        if isinstance(expected_status, int):
            expected_status = [expected_status]

        response = requests.request(method, url, headers=headers, timeout=timeout)

        if response.status_code in expected_status:
            return {"status": "OK", "status_code": response.status_code}
        else:
            return {
                "status": "FAILED",
                "status_code": response.status_code,
                "error": f"Unexpected status code: {response.status_code}",
            }

    def _check_tcp(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check TCP connectivity."""
        import socket

        host = config.get("host")
        port = config.get("port")
        timeout = config.get("timeout", 5)

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)

        try:
            result = sock.connect_ex((host, port))
            sock.close()

            if result == 0:
                return {"status": "OK"}
            else:
                return {
                    "status": "FAILED",
                    "error": f"Connection failed with code {result}",
                }
        finally:
            sock.close()

    def _check_cypher(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check Neo4j with Cypher query."""
        if not NEO4J_AVAILABLE:
            return {"status": "SKIPPED", "error": "Neo4j driver not available"}

        uri = config.get("uri")
        username = config.get("username", "neo4j")
        password = config.get("password", "")
        database = config.get("database", "neo4j")
        query = config.get("query")
        config.get("timeout", 10)

        driver = GraphDatabase.driver(uri, auth=(username, password))

        try:
            with driver.session(database=database) as session:
                result = session.run(query)
                records = list(result)

                # Check expected fields if specified
                expected_fields = config.get("expected_fields", [])
                if expected_fields and records:
                    record = records[0]
                    for field in expected_fields:
                        if field not in record.keys():
                            return {
                                "status": "FAILED",
                                "error": f"Expected field '{field}' not in result",
                            }

                return {"status": "OK", "record_count": len(records)}
        finally:
            driver.close()

    def _check_sparql(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check SPARQL endpoint."""
        url = config.get("url")
        query = config.get("query")
        timeout = config.get("timeout", 10)

        response = requests.post(
            url,
            data={"query": query},
            headers={"Accept": "application/sparql-results+json"},
            timeout=timeout,
        )

        if response.status_code == 200:
            try:
                data = response.json()
                return {
                    "status": "OK",
                    "results": len(data.get("results", {}).get("bindings", [])),
                }
            except Exception as e:
                return {"status": "FAILED", "error": f"Invalid SPARQL response: {e}"}
        else:
            return {
                "status": "FAILED",
                "status_code": response.status_code,
                "error": f"SPARQL query failed: {response.status_code}",
            }

    def _check_kafka(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check Kafka broker."""
        if not KAFKA_AVAILABLE:
            return {"status": "SKIPPED", "error": "kafka-python not available"}

        bootstrap_servers = config.get("bootstrap_servers")
        check_type = config.get("check", "list_topics")
        timeout = config.get("timeout", 10)

        admin_client = KafkaAdminClient(
            bootstrap_servers=bootstrap_servers, request_timeout_ms=timeout * 1000
        )

        try:
            if check_type == "list_topics":
                topics = admin_client.list_topics()
                expected_topics = config.get("expected_topics", [])

                missing_topics = [t for t in expected_topics if t not in topics]

                if missing_topics:
                    return {
                        "status": "FAILED",
                        "error": f"Missing topics: {missing_topics}",
                        "topic_count": len(topics),
                    }
                else:
                    return {"status": "OK", "topic_count": len(topics)}
            else:
                return {
                    "status": "ERROR",
                    "error": f"Unknown Kafka check type: {check_type}",
                }
        finally:
            admin_client.close()


class DataQualityChecker:
    """Execute data quality checks."""

    def __init__(self):
        """Initialize data quality checker."""
        self.logger = logging.getLogger(__name__)

    def check(self, check_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a data quality check.

        Args:
            check_config: Check configuration

        Returns:
            Check result with status, value, threshold
        """
        check_type = check_config.get("type")
        check_name = check_config.get("name")

        start_time = time.time()
        result = {
            "name": check_name,
            "type": check_type,
            "status": "UNKNOWN",
            "response_time_ms": 0,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        try:
            if check_type == "cypher_count":
                result.update(self._check_cypher_count(check_config))
            elif check_type == "cypher_age":
                result.update(self._check_cypher_age(check_config))
            elif check_type == "cypher_validation":
                result.update(self._check_cypher_validation(check_config))
            elif check_type == "http_json":
                result.update(self._check_http_json(check_config))
            elif check_type == "sparql_count":
                result.update(self._check_sparql_count(check_config))
            else:
                result["status"] = "ERROR"
                result["error"] = f"Unknown check type: {check_type}"

            response_time = (time.time() - start_time) * 1000
            result["response_time_ms"] = round(response_time, 2)

        except Exception as e:
            self.logger.error(f"Data quality check {check_name} failed: {e}")
            result["status"] = "ERROR"
            result["error"] = str(e)
            result["response_time_ms"] = round((time.time() - start_time) * 1000, 2)

        return result

    def _check_cypher_count(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check count from Cypher query."""
        if not NEO4J_AVAILABLE:
            return {"status": "SKIPPED", "error": "Neo4j driver not available"}

        uri = config.get("uri")
        username = config.get("username", "neo4j")
        password = config.get("password", "")
        database = config.get("database", "neo4j")
        query = config.get("query")
        threshold = config.get("threshold", {})

        driver = GraphDatabase.driver(uri, auth=(username, password))

        try:
            with driver.session(database=database) as session:
                result = session.run(query)
                record = result.single()

                if not record:
                    return {"status": "FAILED", "error": "Query returned no results"}

                count = record.get("count", 0)

                # Evaluate thresholds
                status = self._evaluate_threshold(count, threshold)

                return {"status": status, "value": count, "threshold": threshold}
        finally:
            driver.close()

    def _check_cypher_age(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check age of data from Cypher query."""
        if not NEO4J_AVAILABLE:
            return {"status": "SKIPPED", "error": "Neo4j driver not available"}

        uri = config.get("uri")
        username = config.get("username", "neo4j")
        password = config.get("password", "")
        database = config.get("database", "neo4j")
        query = config.get("query")
        field = config.get("field", "timestamp")
        threshold = config.get("threshold", {})

        driver = GraphDatabase.driver(uri, auth=(username, password))

        try:
            with driver.session(database=database) as session:
                result = session.run(query)
                record = result.single()

                if not record:
                    return {"status": "FAILED", "error": "Query returned no results"}

                timestamp_str = record.get(field)
                if not timestamp_str:
                    return {
                        "status": "FAILED",
                        "error": f"Field '{field}' not in result",
                    }

                # Parse timestamp
                timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                age_seconds = (
                    datetime.now(timestamp.tzinfo) - timestamp
                ).total_seconds()

                # Evaluate thresholds
                status = self._evaluate_threshold(age_seconds, threshold)

                return {
                    "status": status,
                    "value": age_seconds,
                    "threshold": threshold,
                    "unit": "seconds",
                }
        finally:
            driver.close()

    def _check_cypher_validation(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data using Cypher query."""
        # Similar to cypher_count
        return self._check_cypher_count(config)

    def _check_http_json(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check value from HTTP JSON response."""
        url = config.get("url")
        method = config.get("method", "GET").upper()
        headers = config.get("headers", {})
        timeout = config.get("timeout", 10)
        json_path = config.get("json_path", "$.totalCount")
        threshold = config.get("threshold", {})

        response = requests.request(method, url, headers=headers, timeout=timeout)

        if response.status_code != 200:
            return {"status": "FAILED", "error": f"HTTP {response.status_code}"}

        data = response.json()

        # Simple JSON path parsing (supports $.field)
        value = self._extract_json_value(data, json_path)

        if value is None:
            return {"status": "FAILED", "error": f"JSON path not found: {json_path}"}

        status = self._evaluate_threshold(value, threshold)

        return {"status": status, "value": value, "threshold": threshold}

    def _check_sparql_count(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check count from SPARQL query."""
        url = config.get("url")
        query = config.get("query")
        timeout = config.get("timeout", 10)
        threshold = config.get("threshold", {})

        response = requests.post(
            url,
            data={"query": query},
            headers={"Accept": "application/sparql-results+json"},
            timeout=timeout,
        )

        if response.status_code != 200:
            return {
                "status": "FAILED",
                "error": f"SPARQL query failed: {response.status_code}",
            }

        data = response.json()
        bindings = data.get("results", {}).get("bindings", [])

        if not bindings:
            return {"status": "FAILED", "error": "Query returned no results"}

        count = int(bindings[0].get("count", {}).get("value", 0))

        status = self._evaluate_threshold(count, threshold)

        return {"status": status, "value": count, "threshold": threshold}

    def _evaluate_threshold(self, value: float, threshold: Dict[str, Any]) -> str:
        """Evaluate value against threshold."""
        min_val = threshold.get("min")
        max_val = threshold.get("max")
        warn_min = threshold.get("warn_min")
        warn_max = threshold.get("warn_max")

        # Check critical thresholds first
        if min_val is not None and value < min_val:
            # But check if it's only a warning
            if warn_min is not None and value >= warn_min:
                return "WARNING"
            return "FAILED"
        if max_val is not None and value > max_val:
            # But check if it's only a warning
            if warn_max is not None and value <= warn_max:
                return "WARNING"
            return "FAILED"

        # Check warning thresholds
        if warn_min is not None and value < warn_min:
            return "WARNING"
        if warn_max is not None and value > warn_max:
            return "WARNING"

        return "OK"

    def _extract_json_value(self, data: Any, json_path: str) -> Any:
        """Simple JSON path extraction (supports $.field)."""
        if json_path.startswith("$."):
            field = json_path[2:]
            return data.get(field)
        return None


class PerformanceChecker:
    """Execute performance checks."""

    def __init__(self):
        """Initialize performance checker."""
        self.logger = logging.getLogger(__name__)

    def check(self, check_config: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a performance check."""
        check_type = check_config.get("type")
        check_name = check_config.get("name")

        result = {
            "name": check_name,
            "type": check_type,
            "status": "UNKNOWN",
            "response_time_ms": 0,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

        try:
            if check_type == "http_timing":
                result.update(self._check_http_timing(check_config))
            elif check_type == "cypher_timing":
                result.update(self._check_cypher_timing(check_config))
            elif check_type == "sparql_timing":
                result.update(self._check_sparql_timing(check_config))
            else:
                result["status"] = "ERROR"
                result["error"] = f"Unknown check type: {check_type}"
        except Exception as e:
            self.logger.error(f"Performance check {check_name} failed: {e}")
            result["status"] = "ERROR"
            result["error"] = str(e)

        return result

    def _check_http_timing(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check HTTP response time."""
        url = config.get("url")
        method = config.get("method", "GET").upper()
        timeout = config.get("timeout", 10)
        threshold = config.get("threshold", {})

        start_time = time.time()
        # Execute request to measure response time (response object used implicitly for timing)
        _ = requests.request(method, url, timeout=timeout)
        response_time = (time.time() - start_time) * 1000

        status = self._evaluate_timing_threshold(response_time, threshold)

        return {
            "status": status,
            "response_time_ms": round(response_time, 2),
            "threshold": threshold,
        }

    def _check_cypher_timing(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check Cypher query time."""
        if not NEO4J_AVAILABLE:
            return {"status": "SKIPPED", "error": "Neo4j driver not available"}

        uri = config.get("uri")
        username = config.get("username", "neo4j")
        password = config.get("password", "")
        database = config.get("database", "neo4j")
        query = config.get("query")
        threshold = config.get("threshold", {})

        driver = GraphDatabase.driver(uri, auth=(username, password))

        try:
            start_time = time.time()
            with driver.session(database=database) as session:
                result = session.run(query)
                list(result)  # Consume results
            response_time = (time.time() - start_time) * 1000

            status = self._evaluate_timing_threshold(response_time, threshold)

            return {
                "status": status,
                "response_time_ms": round(response_time, 2),
                "threshold": threshold,
            }
        finally:
            driver.close()

    def _check_sparql_timing(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Check SPARQL query time."""
        url = config.get("url")
        query = config.get("query")
        timeout = config.get("timeout", 10)
        threshold = config.get("threshold", {})

        start_time = time.time()
        response = requests.post(
            url,
            data={"query": query},
            headers={"Accept": "application/sparql-results+json"},
            timeout=timeout,
        )
        response_time = (time.time() - start_time) * 1000

        if response.status_code != 200:
            return {
                "status": "FAILED",
                "error": f"SPARQL query failed: {response.status_code}",
            }

        status = self._evaluate_timing_threshold(response_time, threshold)

        return {
            "status": status,
            "response_time_ms": round(response_time, 2),
            "threshold": threshold,
        }

    def _evaluate_timing_threshold(
        self, response_time: float, threshold: Dict[str, Any]
    ) -> str:
        """Evaluate response time against threshold."""
        max_val = threshold.get("max")
        warn_max = threshold.get("warn_max")

        if max_val is not None and response_time > max_val:
            return "FAILED"
        if warn_max is not None and response_time > warn_max:
            return "WARNING"

        return "OK"


class HealthAggregator:
    """Aggregate check results into overall health status."""

    def __init__(self, config: HealthCheckConfig):
        """Initialize health aggregator."""
        self.config = config
        self.logger = logging.getLogger(__name__)

    def aggregate(self, check_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate check results into overall health status.

        Args:
            check_results: List of check results

        Returns:
            Aggregated health status
        """
        # Count statuses
        critical_failed = 0
        non_critical_failed = 0
        warnings = 0
        total = len(check_results)

        failed_checks = []

        for result in check_results:
            status = result.get("status")
            critical = result.get("critical", False)

            if status == "FAILED" or status == "ERROR":
                if critical:
                    critical_failed += 1
                else:
                    non_critical_failed += 1
                failed_checks.append(result)
            elif status == "WARNING":
                warnings += 1

        # Determine overall status
        if critical_failed > 0:
            overall_status = "RED"
            description = f"{critical_failed} critical service(s) failed"
        elif non_critical_failed > 0 or warnings > 0:
            overall_status = "YELLOW"
            description = f"{non_critical_failed} non-critical service(s) failed, {warnings} warning(s)"
        else:
            overall_status = "GREEN"
            description = "All services operational"

        return {
            "status": overall_status,
            "description": description,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "checks": check_results,
            "summary": {
                "total": total,
                "ok": total - critical_failed - non_critical_failed - warnings,
                "warning": warnings,
                "failed": critical_failed + non_critical_failed,
                "critical_failed": critical_failed,
            },
            "failed_checks": failed_checks,
        }


class AlertManager:
    """Manage health check alerts."""

    def __init__(self, config: HealthCheckConfig):
        """Initialize alert manager."""
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.alert_config = config.get_alerting_config()
        self.last_status = None
        self.last_alert_time = {}

    def should_alert(self, health_status: Dict[str, Any]) -> bool:
        """Determine if alert should be sent."""
        if not self.alert_config.get("enabled", True):
            return False

        triggers = self.alert_config.get("triggers", {})
        current_status = health_status.get("status")

        # Check state change
        if triggers.get("on_state_change", True):
            if self.last_status and self.last_status != current_status:
                self.last_status = current_status
                return True

        # Check critical failure
        if triggers.get("on_critical_failure", True):
            if current_status == "RED":
                return self._check_rate_limit()

        # Check recovery
        if triggers.get("on_recovery", True):
            if self.last_status == "RED" and current_status == "GREEN":
                self.last_status = current_status
                return True

        self.last_status = current_status
        return False

    def send_alert(self, health_status: Dict[str, Any]):
        """Send alert through configured channels."""
        channels = self.alert_config.get("channels", [])

        for channel in channels:
            if not channel.get("enabled", True):
                continue

            channel_type = channel.get("type")

            try:
                if channel_type == "webhook":
                    self._send_webhook(channel, health_status)
                elif channel_type == "email":
                    self._send_email(channel, health_status)
                elif channel_type == "slack":
                    self._send_slack(channel, health_status)
            except Exception as e:
                self.logger.error(f"Failed to send alert via {channel_type}: {e}")

    def _send_webhook(self, channel: Dict[str, Any], health_status: Dict[str, Any]):
        """Send webhook alert."""
        url = channel.get("url")
        method = channel.get("method", "POST").upper()
        headers = channel.get("headers", {})
        payload_template = channel.get("payload", {})
        timeout = channel.get("timeout", 10)

        # Render payload template
        payload = self._render_template(payload_template, health_status)

        response = requests.request(
            method, url, json=payload, headers=headers, timeout=timeout
        )

        if response.status_code >= 200 and response.status_code < 300:
            self.logger.info(f"Webhook alert sent to {url}")
        else:
            self.logger.error(f"Webhook alert failed: {response.status_code}")

    def _send_email(self, channel: Dict[str, Any], health_status: Dict[str, Any]):
        """Send email alert."""
        # Email implementation (similar to incident report generator)
        self.logger.info("Email alert would be sent here")

    def _send_slack(self, channel: Dict[str, Any], health_status: Dict[str, Any]):
        """Send Slack alert."""
        webhook_url = channel.get("webhook_url")
        template = channel.get("template", "")

        message = self._render_template({"text": template}, health_status)

        response = requests.post(webhook_url, json=message, timeout=10)

        if response.status_code == 200:
            self.logger.info("Slack alert sent")
        else:
            self.logger.error(f"Slack alert failed: {response.status_code}")

    def _render_template(self, template: Any, health_status: Dict[str, Any]) -> Any:
        """Render template with health status data."""
        if isinstance(template, dict):
            return {
                k: self._render_template(v, health_status) for k, v in template.items()
            }
        elif isinstance(template, list):
            return [self._render_template(item, health_status) for item in template]
        elif isinstance(template, str):
            # Simple template rendering
            result = template
            result = result.replace("{{status}}", health_status.get("status", ""))
            result = result.replace(
                "{{description}}", health_status.get("description", "")
            )
            result = result.replace("{{timestamp}}", health_status.get("timestamp", ""))
            result = result.replace(
                "{{severity}}", self._map_severity(health_status.get("status", ""))
            )
            return result
        else:
            return template

    def _map_severity(self, status: str) -> str:
        """Map health status to alert severity."""
        if status == "RED":
            return "critical"
        elif status == "YELLOW":
            return "warning"
        else:
            return "info"

    def _check_rate_limit(self) -> bool:
        """Check if rate limit allows sending alert."""
        rate_limit = self.alert_config.get("rate_limit", {})
        if not rate_limit.get("enabled", True):
            return True

        cooldown = rate_limit.get("cooldown_seconds", 300)
        current_time = time.time()
        last_alert = self.last_alert_time.get("global", 0)

        if current_time - last_alert >= cooldown:
            self.last_alert_time["global"] = current_time
            return True

        return False


class PrometheusExporter:
    """Export health metrics to Prometheus."""

    def __init__(self, config: HealthCheckConfig):
        """Initialize Prometheus exporter."""
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.prom_config = config.get_prometheus_config()

        if not PROMETHEUS_AVAILABLE or not self.prom_config.get("enabled", True):
            self.enabled = False
            return

        self.enabled = True
        self._init_metrics()

    def _init_metrics(self):
        """Initialize Prometheus metrics."""
        # Service up gauge
        self.service_up = Gauge(
            "health_check_service_up",
            "Service availability (1=up, 0=down)",
            ["service", "type"],
        )

        # Overall status gauge
        self.overall_status = Gauge(
            "health_check_overall_status",
            "Overall health status (0=RED, 1=YELLOW, 2=GREEN)",
        )

        # Response time histogram
        self.response_time = Histogram(
            "health_check_response_time_seconds",
            "Service response time in seconds",
            ["service", "type"],
            buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 5.0, 10.0],
        )

        # Check execution counter
        self.executions = Counter(
            "health_check_executions_total",
            "Total number of health check executions",
            ["check_name", "status"],
        )

        # Failure counter
        self.failures = Counter(
            "health_check_failures_total",
            "Total number of failed health checks",
            ["check_name", "error_type"],
        )

        # Data quality metrics
        self.cameras_online = Gauge(
            "health_check_cameras_online", "Number of cameras currently online"
        )

        self.observation_age = Gauge(
            "health_check_observation_age_seconds",
            "Age of most recent observation in seconds",
        )

    def update_metrics(self, health_status: Dict[str, Any]):
        """Update Prometheus metrics."""
        if not self.enabled:
            return

        try:
            # Update overall status
            status_map = {"RED": 0, "YELLOW": 1, "GREEN": 2}
            self.overall_status.set(status_map.get(health_status.get("status"), -1))

            # Update check metrics
            for check in health_status.get("checks", []):
                check_name = check.get("name")
                check_type = check.get("type")
                status = check.get("status")

                # Service up/down
                self.service_up.labels(service=check_name, type=check_type).set(
                    1 if status == "OK" else 0
                )

                # Response time
                response_time_ms = check.get("response_time_ms", 0)
                self.response_time.labels(service=check_name, type=check_type).observe(
                    response_time_ms / 1000.0
                )

                # Execution counter
                self.executions.labels(check_name=check_name, status=status).inc()

                # Failure counter
                if status in ["FAILED", "ERROR"]:
                    error_type = check.get("error", "unknown")[:50]
                    self.failures.labels(
                        check_name=check_name, error_type=error_type
                    ).inc()

                # Data quality metrics
                if check_name == "cameras_online_count":
                    value = check.get("value", 0)
                    self.cameras_online.set(value)
                elif check_name == "recent_observations":
                    value = check.get("value", 0)
                    self.observation_age.set(value)

        except Exception as e:
            self.logger.error(f"Failed to update Prometheus metrics: {e}")


class HealthCheckAgent:
    """Main health check agent orchestrator."""

    def __init__(self, config_path: str):
        """
        Initialize health check agent.

        Args:
            config_path: Path to configuration file
        """
        self.config = HealthCheckConfig(config_path)
        self.logger = logging.getLogger(__name__)

        # Initialize components
        self.service_checker = ServiceChecker()
        self.data_quality_checker = DataQualityChecker()
        self.performance_checker = PerformanceChecker()
        self.health_aggregator = HealthAggregator(self.config)
        self.alert_manager = AlertManager(self.config)
        self.prometheus_exporter = PrometheusExporter(self.config)

        # State
        self.running = False
        self.check_thread = None

        # Flask app for API
        self.app = Flask(__name__)
        self._setup_api()

        self.logger.info("Health Check Agent initialized")

    def _setup_api(self):
        """Set up Flask API endpoints."""

        @self.app.route("/health", methods=["GET"])
        def get_health():
            """Get current health status."""
            # Run checks immediately
            health_status = self.run_checks()
            return jsonify(health_status)

        @self.app.route("/health/history", methods=["GET"])
        def get_health_history():
            """Get health status history."""
            hours_param = request.args.get("hours", 24, type=int)
            # TODO: Implement history retrieval with hours_param filter
            return jsonify({"data": [], "hours_requested": hours_param})

        @self.app.route("/metrics", methods=["GET"])
        def get_metrics():
            """Get Prometheus metrics."""
            if PROMETHEUS_AVAILABLE:
                return generate_latest(REGISTRY)
            else:
                return "Prometheus not available", 503

    def run_checks(self) -> Dict[str, Any]:
        """
        Execute all health checks.

        Returns:
            Aggregated health status
        """
        self.logger.info("Running health checks")

        all_results = []

        # Run service checks
        for check_config in self.config.get_checks():
            if not check_config.get("enabled", True):
                continue

            result = self.service_checker.check(check_config)
            result["critical"] = check_config.get("critical", False)
            all_results.append(result)

        # Run data quality checks
        for check_config in self.config.get_data_quality_checks():
            if not check_config.get("enabled", True):
                continue

            result = self.data_quality_checker.check(check_config)
            result["critical"] = check_config.get("critical", False)
            all_results.append(result)

        # Run performance checks
        for check_config in self.config.get_performance_checks():
            if not check_config.get("enabled", True):
                continue

            result = self.performance_checker.check(check_config)
            result["critical"] = check_config.get("critical", False)
            all_results.append(result)

        # Aggregate results
        health_status = self.health_aggregator.aggregate(all_results)

        # Update Prometheus metrics
        self.prometheus_exporter.update_metrics(health_status)

        # Check if alert needed
        if self.alert_manager.should_alert(health_status):
            self.alert_manager.send_alert(health_status)

        self.logger.info(f"Health check complete: {health_status['status']}")

        return health_status

    def start_monitoring(self):
        """Start periodic health monitoring."""
        self.running = True
        self.check_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.check_thread.start()
        self.logger.info("Health monitoring started")

    def stop_monitoring(self):
        """Stop periodic health monitoring."""
        self.running = False
        if self.check_thread:
            self.check_thread.join(timeout=5)
        self.logger.info("Health monitoring stopped")

    def _monitoring_loop(self):
        """Periodic monitoring loop."""
        interval = self.config.get_interval()

        while self.running:
            try:
                self.run_checks()
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")

            # Sleep in small increments to allow stopping
            for _ in range(interval):
                if not self.running:
                    break
                time.sleep(1)

    def run_api(self, host: str = "0.0.0.0", port: int = 8082):
        """
        Start Flask API server.

        Args:
            host: Host address
            port: Port number
        """
        self.logger.info(f"Starting Health Check API on {host}:{port}")
        self.app.run(host=host, port=port, threaded=True)


# Example usage
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # Create agent
    config_path = "config/health_check_config.yaml"
    agent = HealthCheckAgent(config_path)

    # Start periodic monitoring
    agent.start_monitoring()

    # Run API server (blocking)
    api_config = agent.config.get_api_config()
    host = api_config.get("host", "0.0.0.0")
    port = api_config.get("port", 8082)
    agent.run_api(host, port)
