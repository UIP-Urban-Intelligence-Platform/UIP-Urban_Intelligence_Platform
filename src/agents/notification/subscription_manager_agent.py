"""Subscription Manager Agent.

Module: src.agents.notification.subscription_manager_agent
Author: nguyễn Nhật Quang
Created: 2025-11-22
License: MIT

Description:
    NGSI-LD subscription lifecycle manager for Stellio Context Broker.
    Manages subscription creation, monitoring, and auto-renewal.

Core Features:
    - CRUD operations for NGSI-LD subscriptions
    - Health monitoring with auto-renewal
    - Support for query filters, temporal queries, geo-queries
    - Subscription templates for programmatic creation
    - Comprehensive error handling and retry logic

Dependencies:
    - requests>=2.28: HTTP client
    - PyYAML>=6.0: Configuration parsing

Configuration:
    config/subscriptions.yaml:
        - subscription_definitions: Entity types and notification endpoints
        - health_check: Monitoring and renewal settings

Example:
    ```python
    from src.agents.notification.subscription_manager_agent import SubscriptionManagerAgent
    
    agent = SubscriptionManagerAgent()
    subscription_id = agent.create_subscription(entity_type="RoadAccident")
    ```
"""

import json
import logging
import time
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urljoin

import requests
import yaml


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SubscriptionConfig:
    """
    Load and manage subscription configuration.
    
    Loads subscription definitions from YAML configuration file.
    Provides access to Stellio endpoints, monitoring settings, and subscription templates.
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
        
        with open(self.config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.subscription_manager = self.config.get('subscription_manager', {})
        
        logger.info(f"Loaded configuration from {config_path}")
    
    def get_stellio_config(self) -> Dict[str, Any]:
        """Get Stellio API configuration."""
        return self.subscription_manager.get('stellio', {})
    
    def get_monitoring_config(self) -> Dict[str, Any]:
        """Get monitoring configuration."""
        return self.subscription_manager.get('monitoring', {})
    
    def get_subscriptions(self) -> List[Dict[str, Any]]:
        """Get subscription definitions."""
        return self.subscription_manager.get('subscriptions', [])
    
    def get_templates(self) -> List[Dict[str, Any]]:
        """Get subscription templates."""
        return self.subscription_manager.get('templates', [])
    
    def get_statistics_config(self) -> Dict[str, Any]:
        """Get statistics configuration."""
        return self.subscription_manager.get('statistics', {})


class SubscriptionManager:
    """
    NGSI-LD Subscription Manager.
    
    Manages the complete lifecycle of NGSI-LD subscriptions:
    - Create subscriptions from configuration
    - Read/query existing subscriptions
    - Update subscription parameters
    - Delete subscriptions
    - Monitor subscription health
    - Auto-renew expiring subscriptions
    """
    
    def __init__(self, config_path: str):
        """
        Initialize subscription manager.
        
        Args:
            config_path: Path to YAML configuration file
        """
        self.config = SubscriptionConfig(config_path)
        
        # Load Stellio configuration
        stellio_config = self.config.get_stellio_config()
        self.base_url = stellio_config.get('base_url', 'http://localhost:8080')
        self.timeout = stellio_config.get('timeout', 10)
        self.max_retries = stellio_config.get('max_retries', 3)
        self.retry_backoff_factor = stellio_config.get('retry_backoff_factor', 2)
        
        # Endpoints
        endpoints = stellio_config.get('endpoints', {})
        self.create_endpoint = endpoints.get('create', '/ngsi-ld/v1/subscriptions')
        self.get_endpoint = endpoints.get('get', '/ngsi-ld/v1/subscriptions/{subscription_id}')
        self.update_endpoint = endpoints.get('update', '/ngsi-ld/v1/subscriptions/{subscription_id}')
        self.delete_endpoint = endpoints.get('delete', '/ngsi-ld/v1/subscriptions/{subscription_id}')
        self.list_endpoint = endpoints.get('list', '/ngsi-ld/v1/subscriptions')
        
        # Headers
        self.headers = stellio_config.get('headers', {
            'Content-Type': 'application/ld+json',
            'Accept': 'application/ld+json'
        })
        
        # Load monitoring configuration
        monitoring_config = self.config.get_monitoring_config()
        self.monitoring_enabled = monitoring_config.get('enabled', True)
        self.check_interval = monitoring_config.get('check_interval', 300)
        
        auto_renew = monitoring_config.get('auto_renew', {})
        self.auto_renew_enabled = auto_renew.get('enabled', True)
        self.renew_before_days = auto_renew.get('renew_before_days', 7)
        self.default_extension_days = auto_renew.get('default_extension_days', 365)
        
        # HTTP session for connection pooling
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Statistics
        self.stats = {
            'subscriptions_created': 0,
            'subscriptions_updated': 0,
            'subscriptions_deleted': 0,
            'subscriptions_active': 0,
            'subscriptions_failed': 0,
            'auto_renewals': 0,
            'health_checks': 0
        }
        
        # Subscription registry (name -> subscription_id mapping)
        self.subscription_registry: Dict[str, str] = {}
        
        logger.info("Subscription manager initialized")
    
    def build_subscription_payload(self, subscription_def: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build NGSI-LD subscription payload from configuration.
        
        Args:
            subscription_def: Subscription definition from configuration
        
        Returns:
            NGSI-LD subscription payload
        """
        payload = {
            'type': 'Subscription'
        }
        
        # Add subscription ID if not present
        if 'id' not in subscription_def:
            subscription_id = f"urn:ngsi-ld:Subscription:{uuid.uuid4()}"
            payload['id'] = subscription_id
        else:
            payload['id'] = subscription_def['id']
        
        # Add description
        if 'description' in subscription_def:
            payload['description'] = subscription_def['description']
        
        # Add entities
        if 'entities' in subscription_def:
            payload['entities'] = subscription_def['entities']
        
        # Add watched attributes
        if 'watched_attributes' in subscription_def:
            payload['watchedAttributes'] = subscription_def['watched_attributes']
        
        # Add query filter
        if 'q' in subscription_def:
            payload['q'] = subscription_def['q']
        
        # Add temporal query
        if 'temporal_q' in subscription_def:
            payload['temporalQ'] = subscription_def['temporal_q']
        
        # Add geo-query
        if 'geo_q' in subscription_def:
            payload['geoQ'] = subscription_def['geo_q']
        
        # Add notification
        if 'notification' in subscription_def:
            notification = subscription_def['notification'].copy()
            
            # Add attributes to notification if specified
            if 'attributes' in notification:
                notification['attributes'] = notification['attributes']
            
            # Add format if specified
            if 'format' in notification:
                notification['format'] = notification['format']
            
            payload['notification'] = notification
        
        # Add throttling
        if 'throttling' in subscription_def:
            payload['throttling'] = subscription_def['throttling']
        
        # Add expiration
        if 'expires_at' in subscription_def:
            payload['expiresAt'] = subscription_def['expires_at']
        
        return payload
    
    def create_subscription(self, subscription_def: Dict[str, Any]) -> Optional[str]:
        """
        Create NGSI-LD subscription.
        
        Args:
            subscription_def: Subscription definition
        
        Returns:
            Subscription ID if successful, None otherwise
        """
        try:
            payload = self.build_subscription_payload(subscription_def)
            url = urljoin(self.base_url, self.create_endpoint)
            
            logger.info(f"Creating subscription: {subscription_def.get('name', 'unnamed')}")
            
            # Retry logic
            for attempt in range(self.max_retries):
                try:
                    response = self.session.post(
                        url,
                        json=payload,
                        timeout=self.timeout
                    )
                    
                    if response.status_code == 201:
                        # Extract subscription ID from Location header
                        location = response.headers.get('Location', '')
                        subscription_id = location.split('/')[-1] if location else payload.get('id')
                        
                        # Register subscription
                        subscription_name = subscription_def.get('name', subscription_id)
                        self.subscription_registry[subscription_name] = subscription_id
                        
                        self.stats['subscriptions_created'] += 1
                        self.stats['subscriptions_active'] += 1
                        
                        logger.info(f"Created subscription: {subscription_id}")
                        return subscription_id
                    
                    elif response.status_code == 409:
                        # Subscription already exists
                        logger.warning(f"Subscription already exists: {response.text}")
                        return None
                    
                    else:
                        logger.error(f"Failed to create subscription: {response.status_code} - {response.text}")
                        
                        if attempt < self.max_retries - 1:
                            sleep_time = self.retry_backoff_factor ** attempt
                            logger.info(f"Retrying in {sleep_time} seconds...")
                            time.sleep(sleep_time)
                        else:
                            self.stats['subscriptions_failed'] += 1
                            return None
                
                except requests.RequestException as e:
                    logger.error(f"Request error on attempt {attempt + 1}: {e}")
                    
                    if attempt < self.max_retries - 1:
                        sleep_time = self.retry_backoff_factor ** attempt
                        time.sleep(sleep_time)
                    else:
                        self.stats['subscriptions_failed'] += 1
                        return None
        
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            self.stats['subscriptions_failed'] += 1
            return None
    
    def get_subscription(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """
        Get subscription details.
        
        Args:
            subscription_id: Subscription ID
        
        Returns:
            Subscription details if found, None otherwise
        """
        try:
            url = urljoin(
                self.base_url,
                self.get_endpoint.format(subscription_id=subscription_id)
            )
            
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                return response.json()
            
            elif response.status_code == 404:
                logger.warning(f"Subscription not found: {subscription_id}")
                return None
            
            else:
                logger.error(f"Failed to get subscription: {response.status_code} - {response.text}")
                return None
        
        except Exception as e:
            logger.error(f"Error getting subscription: {e}")
            return None
    
    def list_subscriptions(self) -> List[Dict[str, Any]]:
        """
        List all subscriptions.
        
        Returns:
            List of subscription details
        """
        try:
            url = urljoin(self.base_url, self.list_endpoint)
            
            response = self.session.get(url, timeout=self.timeout)
            
            if response.status_code == 200:
                return response.json()
            
            else:
                logger.error(f"Failed to list subscriptions: {response.status_code} - {response.text}")
                return []
        
        except Exception as e:
            logger.error(f"Error listing subscriptions: {e}")
            return []
    
    def update_subscription(self, subscription_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update subscription.
        
        Args:
            subscription_id: Subscription ID
            updates: Fields to update
        
        Returns:
            True if successful, False otherwise
        """
        try:
            url = urljoin(
                self.base_url,
                self.update_endpoint.format(subscription_id=subscription_id)
            )
            
            logger.info(f"Updating subscription: {subscription_id}")
            
            response = self.session.patch(
                url,
                json=updates,
                timeout=self.timeout
            )
            
            if response.status_code == 204:
                self.stats['subscriptions_updated'] += 1
                logger.info(f"Updated subscription: {subscription_id}")
                return True
            
            else:
                logger.error(f"Failed to update subscription: {response.status_code} - {response.text}")
                return False
        
        except Exception as e:
            logger.error(f"Error updating subscription: {e}")
            return False
    
    def delete_subscription(self, subscription_id: str) -> bool:
        """
        Delete subscription.
        
        Args:
            subscription_id: Subscription ID
        
        Returns:
            True if successful, False otherwise
        """
        try:
            url = urljoin(
                self.base_url,
                self.delete_endpoint.format(subscription_id=subscription_id)
            )
            
            logger.info(f"Deleting subscription: {subscription_id}")
            
            response = self.session.delete(url, timeout=self.timeout)
            
            if response.status_code == 204:
                self.stats['subscriptions_deleted'] += 1
                self.stats['subscriptions_active'] -= 1
                
                # Remove from registry
                for name, sub_id in list(self.subscription_registry.items()):
                    if sub_id == subscription_id:
                        del self.subscription_registry[name]
                        break
                
                logger.info(f"Deleted subscription: {subscription_id}")
                return True
            
            elif response.status_code == 404:
                logger.warning(f"Subscription not found: {subscription_id}")
                return False
            
            else:
                logger.error(f"Failed to delete subscription: {response.status_code} - {response.text}")
                return False
        
        except Exception as e:
            logger.error(f"Error deleting subscription: {e}")
            return False
    
    def check_expiry(self, subscription: Dict[str, Any]) -> Tuple[bool, Optional[datetime]]:
        """
        Check if subscription is expiring soon.
        
        Args:
            subscription: Subscription details
        
        Returns:
            Tuple of (is_expiring_soon, expiry_date)
        """
        try:
            expires_at = subscription.get('expiresAt')
            
            if not expires_at:
                return False, None
            
            # Parse expiry date
            expiry_date = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            
            # Check if expiring within renew_before_days
            now = datetime.utcnow()
            days_until_expiry = (expiry_date.replace(tzinfo=None) - now).days
            
            is_expiring = days_until_expiry <= self.renew_before_days
            
            return is_expiring, expiry_date.replace(tzinfo=None)
        
        except Exception as e:
            logger.error(f"Error checking expiry: {e}")
            return False, None
    
    def renew_subscription(self, subscription_id: str) -> bool:
        """
        Renew subscription by extending expiry date.
        
        Args:
            subscription_id: Subscription ID
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Calculate new expiry date
            new_expiry = datetime.utcnow() + timedelta(days=self.default_extension_days)
            new_expiry_str = new_expiry.isoformat() + 'Z'
            
            # Update subscription
            updates = {
                'expiresAt': new_expiry_str
            }
            
            success = self.update_subscription(subscription_id, updates)
            
            if success:
                self.stats['auto_renewals'] += 1
                logger.info(f"Renewed subscription {subscription_id} until {new_expiry_str}")
            
            return success
        
        except Exception as e:
            logger.error(f"Error renewing subscription: {e}")
            return False
    
    def check_subscription_health(self, subscription_id: str) -> bool:
        """
        Check subscription health status.
        
        Args:
            subscription_id: Subscription ID
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            subscription = self.get_subscription(subscription_id)
            
            if not subscription:
                logger.warning(f"Subscription not found: {subscription_id}")
                return False
            
            # Check status (if available)
            status = subscription.get('status', 'active')
            
            if status != 'active':
                logger.warning(f"Subscription {subscription_id} status: {status}")
                return False
            
            # Check expiry
            is_expiring, expiry_date = self.check_expiry(subscription)
            
            if is_expiring and self.auto_renew_enabled:
                logger.info(f"Subscription {subscription_id} expiring on {expiry_date}, renewing...")
                self.renew_subscription(subscription_id)
            
            return True
        
        except Exception as e:
            logger.error(f"Error checking subscription health: {e}")
            return False
    
    def monitor_subscriptions(self):
        """
        Monitor all registered subscriptions.
        
        Checks health status and auto-renews expiring subscriptions.
        """
        if not self.monitoring_enabled:
            logger.info("Monitoring is disabled")
            return
        
        logger.info("Starting subscription health check...")
        
        self.stats['health_checks'] += 1
        
        for name, subscription_id in self.subscription_registry.items():
            logger.info(f"Checking subscription: {name} ({subscription_id})")
            
            healthy = self.check_subscription_health(subscription_id)
            
            if not healthy:
                logger.warning(f"Subscription {name} is unhealthy")
        
        logger.info("Subscription health check complete")
    
    def create_all_subscriptions(self) -> int:
        """
        Create all subscriptions from configuration.
        
        Returns:
            Number of subscriptions created
        """
        subscriptions = self.config.get_subscriptions()
        created_count = 0
        
        logger.info(f"Creating {len(subscriptions)} subscriptions...")
        
        for sub_def in subscriptions:
            # Check if enabled
            if not sub_def.get('enabled', True):
                logger.info(f"Skipping disabled subscription: {sub_def.get('name')}")
                continue
            
            subscription_id = self.create_subscription(sub_def)
            
            if subscription_id:
                created_count += 1
        
        logger.info(f"Created {created_count} subscriptions")
        
        return created_count
    
    def delete_all_subscriptions(self) -> int:
        """
        Delete all registered subscriptions.
        
        Returns:
            Number of subscriptions deleted
        """
        deleted_count = 0
        
        logger.info(f"Deleting {len(self.subscription_registry)} subscriptions...")
        
        for name, subscription_id in list(self.subscription_registry.items()):
            success = self.delete_subscription(subscription_id)
            
            if success:
                deleted_count += 1
        
        logger.info(f"Deleted {deleted_count} subscriptions")
        
        return deleted_count
    
    def create_from_template(
        self,
        template_name: str,
        parameters: Dict[str, str]
    ) -> Optional[str]:
        """
        Create subscription from template.
        
        Args:
            template_name: Template name
            parameters: Template parameters
        
        Returns:
            Subscription ID if successful, None otherwise
        """
        try:
            templates = self.config.get_templates()
            
            # Find template
            template = None
            for tmpl in templates:
                if tmpl.get('name') == template_name:
                    template = tmpl.get('template')
                    break
            
            if not template:
                logger.error(f"Template not found: {template_name}")
                return None
            
            # Replace parameters
            template_str = json.dumps(template)
            
            for key, value in parameters.items():
                placeholder = f"{{{key}}}"
                template_str = template_str.replace(placeholder, str(value))
            
            subscription_def = json.loads(template_str)
            
            # Create subscription
            return self.create_subscription(subscription_def)
        
        except Exception as e:
            logger.error(f"Error creating from template: {e}")
            return None
    
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get subscription manager statistics.
        
        Returns:
            Statistics dictionary
        """
        return self.stats.copy()
    
    def __del__(self):
        """Clean up resources."""
        if hasattr(self, 'session'):
            self.session.close()


if __name__ == '__main__':
    # Example usage
    manager = SubscriptionManager('config/subscriptions.yaml')
    
    # Create all subscriptions
    created = manager.create_all_subscriptions()
    print(f"Created {created} subscriptions")
    
    # List subscriptions
    subscriptions = manager.list_subscriptions()
    print(f"Active subscriptions: {len(subscriptions)}")
    
    # Monitor subscriptions
    manager.monitor_subscriptions()
    
    # Get statistics
    stats = manager.get_statistics()
    print(f"Statistics: {stats}")
