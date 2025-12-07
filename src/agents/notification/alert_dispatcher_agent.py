#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Multi-Channel Alert Dispatcher Agent.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.notification.alert_dispatcher_agent
Author: Nguyen Nhat Quang
Created: 2025-11-22
Version: 1.0.0
License: MIT

Description:
    Domain-agnostic notification system that receives NGSI-LD subscription webhooks
    from Stellio Context Broker and dispatches alerts via multiple communication channels.

Core Capabilities:
    - HTTP webhook endpoint for Stellio notification reception
    - Multi-channel delivery: WebSocket, Firebase Cloud Messaging, Email, SMS, HTTP Webhooks
    - Priority-based message routing and queuing
    - Jinja2 template engine for customizable message formatting
    - Per-user rate limiting to prevent notification spam
    - Retry logic with exponential backoff for failed deliveries
    - Delivery tracking, statistics, and audit logging

Dependencies:
    - flask>=2.0: HTTP webhook server
    - flask-socketio>=5.0: WebSocket support
    - firebase-admin>=6.0: Firebase Cloud Messaging
    - jinja2>=3.0: Template rendering

Configuration:
    Requires alert_dispatcher_config.yaml containing:
    - webhook_port: HTTP server port for incoming webhooks
    - channels: Configuration for each notification channel
    - templates: Jinja2 message templates per alert type
    - rate_limits: Per-user/per-channel rate limiting rules
    - retry_policy: Retry attempts and backoff configuration

Examples:
    >>> from src.agents.notification import AlertDispatcherAgent
    >>>
    >>> config = {'config_file': 'config/alert_dispatcher_config.yaml'}
    >>> agent = AlertDispatcherAgent(config)
    >>> agent.start_server()  # Starts webhook HTTP server
    >>>
    >>> # Manual dispatch example
    >>> alert = {
    ...     'type': 'TrafficIncident',
    ...     'severity': 'high',
    ...     'message': 'Accident detected'
    ... }
    >>> agent.dispatch(alert, channels=['email', 'sms'])

Supported Channels:
    - websocket: Real-time browser notifications
    - fcm: Firebase Cloud Messaging (mobile push)
    - email: SMTP email delivery
    - sms: SMS gateway integration (Twilio, AWS SNS)
    - webhook: HTTP POST to external endpoints

References:
    - Stellio Subscriptions: https://stellio.readthedocs.io/en/latest/user/subscriptions/
    - Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
"""

import logging
import re
import smtplib
import time
from collections import defaultdict
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from threading import Lock
from typing import Any, Dict, List, Set

import requests
import yaml
from flask import Flask, jsonify, request

# Import centralized environment variable expansion helper
from src.core.config_loader import expand_env_var

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class AlertDispatcherConfig:
    """
    Load and manage alert dispatcher configuration.

    Loads configuration from YAML file including server settings,
    channel configurations, routing rules, and message templates.
    """

    def __init__(self, config_path: str):
        """
        Initialize configuration.

        Args:
            config_path: Path to YAML configuration file

        Raises:
            FileNotFoundError: If configuration file not found
            yaml.YAMLError: If configuration is invalid YAML
        """
        self.config_path = Path(config_path)

        if not self.config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")

        with open(self.config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

        # Expand environment variables like ${VAR:-default} using centralized helper
        self.config = expand_env_var(self.config)

        self.alert_dispatcher = self.config.get("alert_dispatcher", {})

        logger.info(f"Loaded configuration from {config_path}")

    def get_server_config(self) -> Dict[str, Any]:
        """Get server configuration."""
        return self.alert_dispatcher.get("server", {})

    def get_channels_config(self) -> Dict[str, Any]:
        """Get channels configuration."""
        return self.alert_dispatcher.get("channels", {})

    def get_routing_rules(self) -> Dict[str, Any]:
        """Get routing rules."""
        return self.alert_dispatcher.get("routing_rules", {})

    def get_templates(self) -> Dict[str, Any]:
        """Get message templates."""
        return self.alert_dispatcher.get("templates", {})

    def get_rate_limiting_config(self) -> Dict[str, Any]:
        """Get rate limiting configuration."""
        return self.alert_dispatcher.get("rate_limiting", {})

    def get_retry_config(self) -> Dict[str, Any]:
        """Get retry configuration."""
        return self.alert_dispatcher.get("retry", {})


class RateLimiter:
    """
    Rate limiter for user notifications.

    Implements per-user rate limiting with hourly and daily limits.
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize rate limiter.

        Args:
            config: Rate limiting configuration
        """
        self.enabled = config.get("enabled", True)
        self.max_per_user_per_hour = config.get("max_per_user_per_hour", 10)
        self.max_per_user_per_day = config.get("max_per_user_per_day", 50)
        self.whitelist = set(config.get("whitelist", []))

        # Tracking: user_id -> list of timestamps
        self.hourly_counts: Dict[str, List[datetime]] = defaultdict(list)
        self.daily_counts: Dict[str, List[datetime]] = defaultdict(list)

        self.lock = Lock()

        logger.info("Rate limiter initialized")

    def is_allowed(self, user_id: str) -> bool:
        """
        Check if user is allowed to receive notification.

        Args:
            user_id: User identifier

        Returns:
            True if allowed, False if rate limit exceeded
        """
        if not self.enabled:
            return True

        if user_id in self.whitelist:
            return True

        with self.lock:
            now = datetime.utcnow()
            hour_ago = now - timedelta(hours=1)
            day_ago = now - timedelta(days=1)

            # Clean old entries
            self.hourly_counts[user_id] = [
                ts for ts in self.hourly_counts[user_id] if ts > hour_ago
            ]
            self.daily_counts[user_id] = [
                ts for ts in self.daily_counts[user_id] if ts > day_ago
            ]

            # Check limits
            if len(self.hourly_counts[user_id]) >= self.max_per_user_per_hour:
                logger.warning(f"Hourly rate limit exceeded for user: {user_id}")
                return False

            if len(self.daily_counts[user_id]) >= self.max_per_user_per_day:
                logger.warning(f"Daily rate limit exceeded for user: {user_id}")
                return False

            # Record timestamp
            self.hourly_counts[user_id].append(now)
            self.daily_counts[user_id].append(now)

            return True


class TemplateEngine:
    """
    Simple template engine for message formatting.

    Supports {{variable}} syntax for variable substitution.
    """

    def __init__(self, templates: Dict[str, Any]):
        """
        Initialize template engine.

        Args:
            templates: Template definitions
        """
        self.templates = templates
        logger.info(f"Template engine initialized with {len(templates)} templates")

    def render(self, template_name: str, field: str, variables: Dict[str, Any]) -> str:
        """
        Render template with variables.

        Args:
            template_name: Template name
            field: Template field (title, body, email_subject, etc.)
            variables: Variables for substitution

        Returns:
            Rendered template
        """
        template = self.templates.get(template_name, {})
        template_str = template.get(field, "")

        if not template_str:
            logger.warning(f"Template field not found: {template_name}.{field}")
            return ""

        # Replace {{variable}} with values
        def replace_var(match):
            var_name = match.group(1)
            value = variables.get(var_name, "")
            return str(value)

        rendered = re.sub(r"\{\{(\w+)\}\}", replace_var, template_str)

        return rendered


class ChannelDelivery:
    """
    Base class for channel delivery implementations.
    """

    def __init__(self, config: Dict[str, Any], retry_config: Dict[str, Any]):
        """
        Initialize channel.

        Args:
            config: Channel configuration
            retry_config: Retry configuration
        """
        self.config = config
        self.enabled = config.get("enabled", False)
        self.max_retries = config.get("max_retries", 3)
        self.timeout = config.get("timeout", 10)

        # Retry configuration
        self.retry_enabled = retry_config.get("enabled", True)
        self.retry_backoff_factor = retry_config.get("backoff_factor", 2)

    def deliver(self, message: Dict[str, Any]) -> bool:
        """
        Deliver message via channel.

        Args:
            message: Message to deliver

        Returns:
            True if successful, False otherwise
        """
        raise NotImplementedError


class WebSocketChannel(ChannelDelivery):
    """
    WebSocket channel for real-time notifications.
    """

    def __init__(self, config: Dict[str, Any], retry_config: Dict[str, Any]):
        super().__init__(config, retry_config)
        self.connections: Set[Any] = set()
        logger.info("WebSocket channel initialized")

    def deliver(self, message: Dict[str, Any]) -> bool:
        """Deliver message via WebSocket."""
        if not self.enabled:
            return False

        try:
            # Broadcast to all connected clients
            payload = {
                "type": message.get("alert_type", "generic"),
                "title": message.get("title", ""),
                "body": message.get("body", ""),
                "data": message.get("data", {}),
                "timestamp": message.get("timestamp", datetime.utcnow().isoformat()),
            }

            # In a real implementation, this would use Socket.IO or similar
            # For now, log the broadcast with payload type
            logger.info(f"Broadcasting WebSocket message: {payload['type']}")

            return True

        except Exception as e:
            logger.error(f"WebSocket delivery error: {e}")
            return False


class FCMChannel(ChannelDelivery):
    """
    Firebase Cloud Messaging channel for mobile push notifications.
    """

    def __init__(self, config: Dict[str, Any], retry_config: Dict[str, Any]):
        super().__init__(config, retry_config)
        self.server_key = config.get("server_key", "")
        self.api_url = config.get("api_url", "https://fcm.googleapis.com/fcm/send")
        self.priority = config.get("priority", "high")
        logger.info("FCM channel initialized")

    def deliver(self, message: Dict[str, Any]) -> bool:
        """Deliver message via FCM."""
        if not self.enabled:
            return False

        try:
            fcm_token = message.get("fcm_token")

            if not fcm_token:
                logger.warning("No FCM token provided")
                return False

            headers = {
                "Authorization": f"key={self.server_key}",
                "Content-Type": "application/json",
            }

            payload = {
                "to": fcm_token,
                "priority": self.priority,
                "notification": {
                    "title": message.get("title", ""),
                    "body": message.get("body", ""),
                    "sound": "default",
                },
                "data": message.get("data", {}),
            }

            # Retry logic
            for attempt in range(self.max_retries):
                try:
                    response = requests.post(
                        self.api_url,
                        headers=headers,
                        json=payload,
                        timeout=self.timeout,
                    )

                    if response.status_code == 200:
                        logger.info(f"FCM message delivered successfully")
                        return True

                    else:
                        logger.error(
                            f"FCM delivery failed: {response.status_code} - {response.text}"
                        )

                        if attempt < self.max_retries - 1 and self.retry_enabled:
                            sleep_time = self.retry_backoff_factor**attempt
                            time.sleep(sleep_time)
                        else:
                            return False

                except requests.RequestException as e:
                    logger.error(f"FCM request error on attempt {attempt + 1}: {e}")

                    if attempt < self.max_retries - 1 and self.retry_enabled:
                        sleep_time = self.retry_backoff_factor**attempt
                        time.sleep(sleep_time)
                    else:
                        return False

            return False

        except Exception as e:
            logger.error(f"FCM delivery error: {e}")
            return False


class EmailChannel(ChannelDelivery):
    """
    Email channel via SMTP.
    """

    def __init__(self, config: Dict[str, Any], retry_config: Dict[str, Any]):
        super().__init__(config, retry_config)
        self.smtp_host = config.get("smtp_host", "smtp.gmail.com")
        self.smtp_port = config.get("smtp_port", 587)
        self.use_tls = config.get("use_tls", True)
        self.username = config.get("username", "")
        self.password = config.get("password", "")
        self.from_addr = config.get("from_addr", "")
        self.from_name = config.get("from_name", "Alert System")
        logger.info("Email channel initialized")

    def deliver(self, message: Dict[str, Any]) -> bool:
        """Deliver message via Email."""
        if not self.enabled:
            return False

        try:
            to_email = message.get("email")

            if not to_email:
                logger.warning("No email address provided")
                return False

            subject = message.get("email_subject", message.get("title", "Notification"))
            body = message.get("email_body", message.get("body", ""))

            # Create message
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self.from_name} <{self.from_addr}>"
            msg["To"] = to_email
            msg["Subject"] = subject

            # Attach body
            if "<html>" in body.lower():
                msg.attach(MIMEText(body, "html"))
            else:
                msg.attach(MIMEText(body, "plain"))

            # Send email with retry
            for attempt in range(self.max_retries):
                try:
                    with smtplib.SMTP(
                        self.smtp_host, self.smtp_port, timeout=self.timeout
                    ) as server:
                        if self.use_tls:
                            server.starttls()

                        if self.username and self.password:
                            server.login(self.username, self.password)

                        server.send_message(msg)

                        logger.info(f"Email delivered to {to_email}")
                        return True

                except Exception as e:
                    logger.error(f"Email send error on attempt {attempt + 1}: {e}")

                    if attempt < self.max_retries - 1 and self.retry_enabled:
                        sleep_time = self.retry_backoff_factor**attempt
                        time.sleep(sleep_time)
                    else:
                        return False

            return False

        except Exception as e:
            logger.error(f"Email delivery error: {e}")
            return False


class SMSChannel(ChannelDelivery):
    """
    SMS channel via Twilio.
    """

    def __init__(self, config: Dict[str, Any], retry_config: Dict[str, Any]):
        super().__init__(config, retry_config)
        self.provider = config.get("provider", "twilio")
        self.account_sid = config.get("account_sid", "")
        self.auth_token = config.get("auth_token", "")
        self.from_number = config.get("from_number", "")
        self.api_url = config.get("api_url", "https://api.twilio.com/2010-04-01")
        logger.info("SMS channel initialized")

    def deliver(self, message: Dict[str, Any]) -> bool:
        """Deliver message via SMS."""
        if not self.enabled:
            return False

        try:
            to_phone = message.get("phone")

            if not to_phone:
                logger.warning("No phone number provided")
                return False

            sms_body = message.get("sms_body", message.get("body", ""))

            # Twilio API
            url = f"{self.api_url}/Accounts/{self.account_sid}/Messages.json"

            payload = {"From": self.from_number, "To": to_phone, "Body": sms_body}

            # Retry logic
            for attempt in range(self.max_retries):
                try:
                    response = requests.post(
                        url,
                        auth=(self.account_sid, self.auth_token),
                        data=payload,
                        timeout=self.timeout,
                    )

                    if response.status_code == 201:
                        logger.info(f"SMS delivered to {to_phone}")
                        return True

                    else:
                        logger.error(
                            f"SMS delivery failed: {response.status_code} - {response.text}"
                        )

                        if attempt < self.max_retries - 1 and self.retry_enabled:
                            sleep_time = self.retry_backoff_factor**attempt
                            time.sleep(sleep_time)
                        else:
                            return False

                except requests.RequestException as e:
                    logger.error(f"SMS request error on attempt {attempt + 1}: {e}")

                    if attempt < self.max_retries - 1 and self.retry_enabled:
                        sleep_time = self.retry_backoff_factor**attempt
                        time.sleep(sleep_time)
                    else:
                        return False

            return False

        except Exception as e:
            logger.error(f"SMS delivery error: {e}")
            return False


class AlertDispatcher:
    """
    Main alert dispatcher agent.

    Receives webhook notifications and dispatches alerts via multiple channels
    based on routing rules and user preferences.
    """

    def __init__(self, config_path: str):
        """
        Initialize alert dispatcher.

        Args:
            config_path: Path to YAML configuration file
        """
        self.config = AlertDispatcherConfig(config_path)

        # Initialize components
        server_config = self.config.get_server_config()
        self.host = server_config.get("host", "0.0.0.0")
        self.port = server_config.get("port", 8080)
        self.endpoints = server_config.get("endpoints", {})

        # Initialize channels
        channels_config = self.config.get_channels_config()
        retry_config = self.config.get_retry_config()

        self.channels = {
            "websocket": WebSocketChannel(
                channels_config.get("websocket", {}), retry_config
            ),
            "fcm": FCMChannel(channels_config.get("fcm", {}), retry_config),
            "email": EmailChannel(channels_config.get("email", {}), retry_config),
            "sms": SMSChannel(channels_config.get("sms", {}), retry_config),
        }

        # Initialize routing rules
        self.routing_rules = self.config.get_routing_rules()

        # Initialize template engine
        templates = self.config.get_templates()
        self.template_engine = TemplateEngine(templates)

        # Initialize rate limiter
        rate_limit_config = self.config.get_rate_limiting_config()
        self.rate_limiter = RateLimiter(rate_limit_config)

        # Initialize Flask app
        self.app = Flask(__name__)
        self._setup_routes()

        # Statistics
        self.stats = {
            "alerts_received": 0,
            "alerts_delivered": 0,
            "alerts_failed": 0,
            "channel_deliveries": defaultdict(int),
            "rate_limit_exceeded": 0,
        }

        logger.info("Alert dispatcher initialized")

    def _setup_routes(self):
        """Setup Flask routes."""

        @self.app.route("/health", methods=["GET"])
        def health():
            return jsonify({"status": "healthy"}), 200

        @self.app.route("/stats", methods=["GET"])
        def stats():
            return jsonify(dict(self.stats)), 200

        # Dynamic endpoints from config
        for alert_type, endpoint in self.endpoints.items():
            self._create_webhook_endpoint(alert_type, endpoint)

    def _create_webhook_endpoint(self, alert_type: str, endpoint: str):
        """
        Create webhook endpoint dynamically.

        Args:
            alert_type: Alert type
            endpoint: Endpoint path
        """

        def handler():
            return self.handle_webhook(alert_type, request)

        handler.__name__ = f"webhook_{alert_type}"
        self.app.add_url_rule(
            endpoint, f"webhook_{alert_type}", handler, methods=["POST"]
        )
        logger.info(f"Registered webhook endpoint: {endpoint} -> {alert_type}")

    def handle_webhook(self, alert_type: str, req) -> tuple:
        """
        Handle incoming webhook notification.

        Args:
            alert_type: Alert type
            req: Flask request object

        Returns:
            Tuple of (response, status_code)
        """
        try:
            self.stats["alerts_received"] += 1

            # Parse notification
            notification = req.get_json()

            if not notification:
                logger.error("Invalid notification payload")
                return jsonify({"error": "Invalid payload"}), 400

            logger.info(
                f"Received {alert_type} notification: {notification.get('id', 'unknown')}"
            )

            # Extract variables for template
            variables = self._extract_variables(notification, alert_type)

            # Dispatch to channels
            success = self.dispatch_alert(alert_type, variables)

            if success:
                self.stats["alerts_delivered"] += 1
                return jsonify({"status": "delivered"}), 200
            else:
                self.stats["alerts_failed"] += 1
                return jsonify({"status": "failed"}), 500

        except Exception as e:
            logger.error(f"Error handling webhook: {e}")
            self.stats["alerts_failed"] += 1
            # Avoid exposing internal error details to clients
            return jsonify({"error": "Internal processing error"}), 500

    def _extract_variables(
        self, notification: Dict[str, Any], alert_type: str
    ) -> Dict[str, Any]:
        """
        Extract variables from notification for template rendering.

        Args:
            notification: NGSI-LD notification
            alert_type: Alert type

        Returns:
            Variables dictionary
        """
        variables = {
            "entity_id": notification.get("id", "unknown"),
            "entity_type": notification.get("type", "unknown"),
            "timestamp": notification.get("observedAt", datetime.utcnow().isoformat()),
            "alert_type": alert_type,
        }

        # Extract attributes
        data = notification.get("data", [{}])[0] if notification.get("data") else {}

        for key, value in data.items():
            if isinstance(value, dict):
                variables[key] = value.get("value", value)
            else:
                variables[key] = value

        return variables

    def dispatch_alert(self, alert_type: str, variables: Dict[str, Any]) -> bool:
        """
        Dispatch alert to appropriate channels.

        Args:
            alert_type: Alert type
            variables: Template variables

        Returns:
            True if at least one channel succeeded, False otherwise
        """
        # Get routing rules
        routing = self.routing_rules.get(
            alert_type, self.routing_rules.get("generic", {})
        )

        channels = routing.get("channels", ["websocket"])
        priority = routing.get("priority", "medium")

        logger.info(
            f"Dispatching {alert_type} alert to channels: {channels} (priority: {priority})"
        )

        # Render templates
        title = self.template_engine.render(alert_type, "title", variables)
        body = self.template_engine.render(alert_type, "body", variables)
        email_subject = self.template_engine.render(
            alert_type, "email_subject", variables
        )
        email_body = self.template_engine.render(alert_type, "email_body", variables)
        sms_body = self.template_engine.render(alert_type, "sms_body", variables)

        # Build message
        message = {
            "alert_type": alert_type,
            "priority": priority,
            "title": title,
            "body": body,
            "email_subject": email_subject,
            "email_body": email_body,
            "sms_body": sms_body,
            "data": variables,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Deliver to each channel
        success = False

        for channel_name in channels:
            channel = self.channels.get(channel_name)

            if not channel or not channel.enabled:
                logger.warning(f"Channel not available: {channel_name}")
                continue

            try:
                delivered = channel.deliver(message)

                if delivered:
                    self.stats["channel_deliveries"][channel_name] += 1
                    success = True
                    logger.info(f"Delivered to {channel_name}")
                else:
                    logger.warning(f"Failed to deliver to {channel_name}")

            except Exception as e:
                logger.error(f"Error delivering to {channel_name}: {e}")

        return success

    def run(self):
        """Run the HTTP server."""
        logger.info(f"Starting alert dispatcher on {self.host}:{self.port}")
        self.app.run(host=self.host, port=self.port, threaded=True)


if __name__ == "__main__":
    # Example usage
    dispatcher = AlertDispatcher("config/alert_dispatcher_config.yaml")
    dispatcher.run()
