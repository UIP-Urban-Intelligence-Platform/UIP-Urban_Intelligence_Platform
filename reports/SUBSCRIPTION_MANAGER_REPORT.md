<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: reports/SUBSCRIPTION_MANAGER_REPORT.md
Module: Subscription Manager Report
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  Subscription Manager Agent implementation report.
============================================================================
-->

# Subscription Manager Agent - Implementation Report

**Agent**: Subscription Manager Agent  
**Version**: 1.0.0  
**Author**: UIP Development Team  
**Date**: November 2025  
**Status**: ✅ PRODUCTION READY

---

## Executive Summary

The **Subscription Manager Agent** implements comprehensive NGSI-LD subscription management for Stellio Context Broker. It provides full lifecycle management of subscriptions including creation, monitoring, auto-renewal, and deletion with support for query filters, temporal queries, and geo-queries.

### Key Achievements

✅ **35 tests passing** (100% pass rate)  
✅ **81% code coverage** (299 statements, 56 missed)  
✅ **CRUD operations**: Create, Read, Update, Delete subscriptions  
✅ **Health monitoring**: Auto-check and auto-renew expiring subscriptions  
✅ **Query support**: Standard queries, temporal queries, geo-queries  
✅ **Template system**: Programmatic subscription creation  
✅ **Domain-agnostic**: Works with any NGSI-LD entity types  
✅ **Config-driven**: All subscriptions defined in YAML  
✅ **Production-ready**: Comprehensive error handling and retry logic

---

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│             Subscription Manager Agent                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌─────────────────┐                 │
│  │ Subscription │──────│  Subscription   │                 │
│  │   Config     │      │   Manager       │                 │
│  └──────────────┘      └─────────────────┘                 │
│         │                      │                             │
│         │ Load subscriptions   │ CRUD operations             │
│         │ templates            │                             │
│         ↓                      ↓                             │
│  ┌─────────────────────────────────────────┐               │
│  │          CRUD Operations                 │               │
│  │  • create_subscription()                 │               │
│  │  • get_subscription()                    │               │
│  │  • update_subscription()                 │               │
│  │  • delete_subscription()                 │               │
│  │  • list_subscriptions()                  │               │
│  └─────────────────────────────────────────┘               │
│         │                                                     │
│         ↓                                                     │
│  ┌─────────────────────────────────────────┐               │
│  │      Health Monitoring                   │               │
│  │  • check_subscription_health()           │               │
│  │  • check_expiry()                        │               │
│  │  • renew_subscription()                  │               │
│  │  • monitor_subscriptions()               │               │
│  └─────────────────────────────────────────┘               │
│         │                                                     │
│         ↓                                                     │
│  ┌─────────────────────────────────────────┐               │
│  │       Stellio Subscription API           │               │
│  │  POST   /subscriptions                   │               │
│  │  GET    /subscriptions/{id}              │               │
│  │  PATCH  /subscriptions/{id}              │               │
│  │  DELETE /subscriptions/{id}              │               │
│  └─────────────────────────────────────────┘               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. CONFIGURATION LOADING
   ↓
   subscriptions.yaml → SubscriptionConfig
   - Subscription definitions
   - Templates
   - Monitoring settings
   - Stellio endpoints

2. SUBSCRIPTION CREATION
   ↓
   For each enabled subscription:
   - Build NGSI-LD payload
   - POST to Stellio /subscriptions
   - Register subscription ID
   - Track statistics

3. HEALTH MONITORING (periodic)
   ↓
   For each registered subscription:
   - GET subscription status
   - Check expiry date
   - Auto-renew if expiring soon
   - Handle failures

4. SUBSCRIPTION LIFECYCLE
   ↓
   - Active: Receiving notifications
   - Expiring: Auto-renewal triggered
   - Expired: Re-create if needed
   - Deleted: Remove from registry
```

---

## Stellio Subscription API

### Create Subscription

**Endpoint**: `POST /ngsi-ld/v1/subscriptions`

**Payload**:
```json
{
  "type": "Subscription",
  "id": "urn:ngsi-ld:Subscription:12345",
  "description": "Monitor congestion on cameras",
  "entities": [
    {"type": "Camera"}
  ],
  "watchedAttributes": ["congested", "intensity"],
  "q": "congested==true",
  "notification": {
    "endpoint": {
      "uri": "http://alert-dispatcher:8080/notify",
      "accept": "application/json"
    },
    "format": "normalized",
    "attributes": ["congested", "intensity", "location"]
  },
  "throttling": 60,
  "expiresAt": "2026-11-01T00:00:00Z"
}
```

**Response**: `201 Created`  
**Headers**: `Location: /ngsi-ld/v1/subscriptions/sub123`

### Get Subscription

**Endpoint**: `GET /ngsi-ld/v1/subscriptions/{subscription_id}`

**Response**: `200 OK`
```json
{
  "id": "urn:ngsi-ld:Subscription:12345",
  "type": "Subscription",
  "status": "active",
  "entities": [{"type": "Camera"}],
  "notification": {...},
  "expiresAt": "2026-11-01T00:00:00Z"
}
```

### Update Subscription

**Endpoint**: `PATCH /ngsi-ld/v1/subscriptions/{subscription_id}`

**Payload**:
```json
{
  "expiresAt": "2027-11-01T00:00:00Z"
}
```

**Response**: `204 No Content`

### Delete Subscription

**Endpoint**: `DELETE /ngsi-ld/v1/subscriptions/{subscription_id}`

**Response**: `204 No Content`

### List Subscriptions

**Endpoint**: `GET /ngsi-ld/v1/subscriptions`

**Response**: `200 OK`
```json
[
  {"id": "sub1", "type": "Subscription", ...},
  {"id": "sub2", "type": "Subscription", ...}
]
```

---

## CRUD Operations

### Create Subscription

```python
from agents.notification.subscription_manager_agent import SubscriptionManager

manager = SubscriptionManager('config/subscriptions.yaml')

subscription_def = {
    'name': 'traffic-alerts',
    'entities': [{'type': 'Camera'}],
    'watched_attributes': ['congested'],
    'notification': {
        'endpoint': {
            'uri': 'http://alerts:8080/notify',
            'accept': 'application/json'
        }
    },
    'throttling': 60,
    'expires_at': '2026-11-01T00:00:00Z'
}

subscription_id = manager.create_subscription(subscription_def)
print(f"Created: {subscription_id}")
```

### Get Subscription

```python
subscription = manager.get_subscription(subscription_id)

if subscription:
    print(f"Status: {subscription.get('status')}")
    print(f"Expires: {subscription.get('expiresAt')}")
```

### Update Subscription

```python
updates = {
    'expiresAt': '2027-11-01T00:00:00Z',
    'throttling': 120
}

success = manager.update_subscription(subscription_id, updates)
print(f"Updated: {success}")
```

### Delete Subscription

```python
success = manager.delete_subscription(subscription_id)
print(f"Deleted: {success}")
```

### List All Subscriptions

```python
subscriptions = manager.list_subscriptions()

for sub in subscriptions:
    print(f"{sub['id']}: {sub.get('description', 'No description')}")
```

---

## Health Monitoring

### Auto-Renewal System

The agent automatically renews subscriptions before they expire:

**Configuration**:
```yaml
monitoring:
  auto_renew:
    enabled: true
    renew_before_days: 7  # Renew 7 days before expiry
    default_extension_days: 365  # Extend by 1 year
```

**Workflow**:
```
1. Health check runs periodically (every 5 minutes)
2. For each subscription:
   - GET subscription details
   - Check expiresAt field
   - Calculate days until expiry
3. If expiring within 7 days:
   - Calculate new expiry: now + 365 days
   - PATCH subscription with new expiresAt
   - Log renewal
   - Increment auto_renewals counter
```

### Manual Health Check

```python
# Check single subscription
healthy = manager.check_subscription_health(subscription_id)

if not healthy:
    print(f"Subscription {subscription_id} is unhealthy")

# Check all subscriptions
manager.monitor_subscriptions()
```

### Expiry Checking

```python
subscription = manager.get_subscription(subscription_id)

is_expiring, expiry_date = manager.check_expiry(subscription)

if is_expiring:
    print(f"Expiring on {expiry_date}")
    manager.renew_subscription(subscription_id)
```

---

## Query Support

### Standard Query Filter

Monitor entities matching a condition:

```yaml
subscriptions:
  - name: "high-congestion-alerts"
    entities:
      - type: "Camera"
    
    watched_attributes:
      - "congested"
      - "intensity"
    
    q: "congested==true;intensity>0.8"  # AND condition
    
    notification:
      endpoint:
        uri: "http://alerts:8080/notify"
```

**Query Operators**:
- `==`: Equal
- `!=`: Not equal
- `>`, `<`, `>=`, `<=`: Comparison
- `;`: AND
- `|`: OR

### Temporal Query

Monitor entities with temporal conditions:

```yaml
subscriptions:
  - name: "recent-updates"
    entities:
      - type: "Device"
    
    temporal_q:
      timerel: "after"
      timeproperty: "modifiedAt"
      time: "PT1H"  # Last 1 hour (ISO 8601 duration)
    
    notification:
      endpoint:
        uri: "http://monitor:8080/updates"
```

**Temporal Relations**:
- `before`: Before specified time
- `after`: After specified time
- `between`: Between two times

### Geo-Query

Monitor entities in geographic area:

```yaml
subscriptions:
  - name: "geofence-alerts"
    entities:
      - type: "Vehicle"
    
    geo_q:
      georel: "near;maxDistance==500"  # Within 500m
      geometry: "Point"
      coordinates: [40.418889, -3.691944]  # Madrid center
    
    notification:
      endpoint:
        uri: "http://fleet:8080/geofence"
```

**Geo Relations**:
- `near`: Within distance
- `within`: Inside geometry
- `contains`: Contains geometry
- `intersects`: Intersects geometry

---

## Template System

### Create from Template

```python
# Define parameters
parameters = {
    'entity_type': 'Camera',
    'attribute_name': 'congested',
    'notification_endpoint': 'http://alerts:8080/notify',
    'expiry_date': '2026-11-01T00:00:00Z'
}

# Create from template
subscription_id = manager.create_from_template('basic-watch', parameters)
```

### Template Definition

```yaml
templates:
  - name: "basic-watch"
    template:
      entities:
        - type: "{entity_type}"
      
      watched_attributes:
        - "{attribute_name}"
      
      notification:
        endpoint:
          uri: "{notification_endpoint}"
          accept: "application/json"
      
      throttling: 60
      
      expires_at: "{expiry_date}"
```

### Programmatic Creation

```python
# Create multiple subscriptions programmatically
entity_types = ['Camera', 'ParkingSpot', 'TrafficLight']

for entity_type in entity_types:
    params = {
        'entity_type': entity_type,
        'attribute_name': 'status',
        'notification_endpoint': f'http://monitor:8080/{entity_type.lower()}',
        'expiry_date': '2026-11-01T00:00:00Z'
    }
    
    sub_id = manager.create_from_template('basic-watch', params)
    print(f"Created subscription for {entity_type}: {sub_id}")
```

---

## Configuration Reference

### Complete Configuration

```yaml
subscription_manager:
  # Stellio API Configuration
  stellio:
    base_url: "http://localhost:8080"
    timeout: 10
    max_retries: 3
    retry_backoff_factor: 2
    
    endpoints:
      create: "/ngsi-ld/v1/subscriptions"
      get: "/ngsi-ld/v1/subscriptions/{subscription_id}"
      update: "/ngsi-ld/v1/subscriptions/{subscription_id}"
      delete: "/ngsi-ld/v1/subscriptions/{subscription_id}"
      list: "/ngsi-ld/v1/subscriptions"
    
    headers:
      Content-Type: "application/ld+json"
      Accept: "application/ld+json"
  
  # Health Monitoring
  monitoring:
    enabled: true
    check_interval: 300  # seconds (5 minutes)
    
    auto_renew:
      enabled: true
      renew_before_days: 7
      default_extension_days: 365
    
    actions:
      on_inactive:
        action: "recreate"
        max_retries: 3
      
      on_failed:
        action: "alert"
        notify_endpoint: "http://alert-dispatcher:8080/subscription-failure"
    
    prometheus:
      enabled: true
      port: 9092
      path: "/metrics"
  
  # Subscription Definitions
  subscriptions:
    # Traffic Congestion
    - name: "congestion-alerts"
      description: "Notify on traffic congestion"
      enabled: true
      
      entities:
        - type: "Camera"
      
      watched_attributes:
        - "congested"
        - "intensity"
      
      q: "congested==true"
      
      notification:
        endpoint:
          uri: "http://alert-dispatcher:8080/congestion"
          accept: "application/json"
        
        format: "normalized"
        
        attributes:
          - "congested"
          - "intensity"
          - "location"
      
      throttling: 60
      
      expires_at: "2026-11-01T00:00:00Z"
    
    # Accident Detection
    - name: "accident-alerts"
      description: "Immediate notification on accidents"
      enabled: true
      
      entities:
        - type: "RoadAccident"
      
      watched_attributes:
        - "severity"
        - "status"
      
      notification:
        endpoint:
          uri: "http://alert-dispatcher:8080/accident"
          accept: "application/json"
        
        format: "keyValues"
      
      throttling: 0  # Immediate
      
      expires_at: "2026-11-01T00:00:00Z"
    
    # Parking Occupancy
    - name: "parking-alerts"
      description: "Alert on high parking occupancy"
      enabled: true
      
      entities:
        - type: "ParkingSpot"
      
      watched_attributes:
        - "occupancy"
      
      q: "occupancy>0.9"  # > 90% full
      
      notification:
        endpoint:
          uri: "http://parking-service:8080/alerts"
          accept: "application/json"
        
        format: "normalized"
      
      throttling: 300  # 5 minutes
      
      expires_at: "2026-11-01T00:00:00Z"
  
  # Subscription Templates
  templates:
    - name: "basic-entity-watch"
      template:
        entities:
          - type: "{entity_type}"
        
        watched_attributes:
          - "{attribute_name}"
        
        notification:
          endpoint:
            uri: "{notification_endpoint}"
            accept: "application/json"
          
          format: "normalized"
        
        throttling: 60
        
        expires_at: "{expiry_date}"
  
  # Statistics
  statistics:
    enabled: true
    collection_interval: 60
    
    metrics:
      - subscriptions_active
      - subscriptions_failed
      - subscriptions_expired
      - auto_renewals_performed
  
  # Logging
  logging:
    level: "INFO"
    format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
```

---

## Test Results

### Test Summary

**Total Tests**: 35  
**Passed**: 35 (100%)  
**Failed**: 0 (0%)  
**Coverage**: 81% (299/56)  
**Duration**: 6.85 seconds

### Test Breakdown

#### Configuration Tests (6/6) ✅

- ✅ `test_config_load`: YAML loading
- ✅ `test_config_stellio`: Stellio configuration
- ✅ `test_config_monitoring`: Monitoring settings
- ✅ `test_config_subscriptions`: Subscription definitions
- ✅ `test_config_templates`: Template definitions
- ✅ `test_config_invalid_file`: Error handling

#### Manager Tests (5/5) ✅

- ✅ `test_manager_init`: Initialization
- ✅ `test_build_subscription_payload`: Payload building
- ✅ `test_build_payload_with_query`: Query filter
- ✅ `test_build_payload_with_temporal_query`: Temporal query
- ✅ `test_build_payload_with_geo_query`: Geo-query

#### CRUD Tests (9/9) ✅

- ✅ `test_create_subscription_success`: Successful creation
- ✅ `test_create_subscription_duplicate`: Duplicate handling
- ✅ `test_create_subscription_failure`: Error handling
- ✅ `test_get_subscription_success`: Get details
- ✅ `test_get_subscription_not_found`: Not found
- ✅ `test_list_subscriptions`: List all
- ✅ `test_update_subscription_success`: Update
- ✅ `test_delete_subscription_success`: Delete
- ✅ `test_build_payload_minimal`: Minimal payload

#### Expiry/Renewal Tests (4/4) ✅

- ✅ `test_check_expiry_soon`: Expiring soon
- ✅ `test_check_expiry_not_soon`: Not expiring
- ✅ `test_check_expiry_no_expiry`: No expiry field
- ✅ `test_renew_subscription`: Renewal

#### Health Monitoring Tests (3/3) ✅

- ✅ `test_check_health_active`: Active subscription
- ✅ `test_check_health_expiring_auto_renew`: Auto-renewal
- ✅ `test_check_health_not_found`: Not found

#### Integration Tests (3/3) ✅

- ✅ `test_create_all_subscriptions`: Bulk creation
- ✅ `test_delete_all_subscriptions`: Bulk deletion
- ✅ `test_monitor_subscriptions`: Health monitoring

#### Template Tests (2/2) ✅

- ✅ `test_create_from_template`: Template creation
- ✅ `test_create_from_invalid_template`: Invalid template

#### Edge Case Tests (3/3) ✅

- ✅ `test_create_subscription_network_error`: Network error
- ✅ `test_statistics`: Statistics collection
- ✅ `test_create_subscription_retry`: Retry logic

### Coverage Report

```
Name                                                Stmts   Miss  Cover   Missing
---------------------------------------------------------------------------------
agents\notification\subscription_manager_agent.py     299     56    81%   89, 184, 291-298, 331-336, 354-359, 392-397, 432-442, 471-473, 503-505, 528-529, 540-542, 551-552, 564, 657-659, 678-693
---------------------------------------------------------------------------------
TOTAL                                                 299     56    81%
```

**Uncovered Lines Analysis**:
- Lines 89-184: Exception handling edge cases
- Lines 291-298: Retry backoff variations
- Lines 331-442: Update/delete edge cases
- Lines 657-693: __main__ block (example usage)

---

## Deployment Guide

### Prerequisites

```bash
# Python 3.10+
python --version

# Required packages
pip install pyyaml requests pytest pytest-cov
```

### Installation

```bash
# Clone repository
git clone <repository-url>
cd UIP-Urban_Intelligence_Platform

# Install dependencies
pip install -r requirements.txt

# Configure subscriptions
cp config/subscriptions.yaml.example config/subscriptions.yaml
nano config/subscriptions.yaml
```

### Configuration

**1. Update Stellio URL**:
```yaml
stellio:
  base_url: "http://your-stellio-host:8080"
```

**2. Define Subscriptions**:
```yaml
subscriptions:
  - name: "my-subscription"
    entities:
      - type: "MyEntityType"
    
    watched_attributes:
      - "myAttribute"
    
    notification:
      endpoint:
        uri: "http://my-service:8080/notify"
    
    expires_at: "2026-11-01T00:00:00Z"
```

### Running the Agent

**Python Script**:
```python
from agents.notification.subscription_manager_agent import SubscriptionManager

# Initialize manager
manager = SubscriptionManager('config/subscriptions.yaml')

# Create all subscriptions
created = manager.create_all_subscriptions()
print(f"Created {created} subscriptions")

# Start monitoring (in background thread)
import threading

def monitor_loop():
    while True:
        manager.monitor_subscriptions()
        time.sleep(manager.check_interval)

monitor_thread = threading.Thread(target=monitor_loop, daemon=True)
monitor_thread.start()

# Get statistics
stats = manager.get_statistics()
print(stats)
```

**Command Line**:
```bash
# Create subscriptions
python -c "from agents.notification.subscription_manager_agent import SubscriptionManager; \
           m = SubscriptionManager('config/subscriptions.yaml'); \
           print(f'Created: {m.create_all_subscriptions()}')"

# List subscriptions
python -c "from agents.notification.subscription_manager_agent import SubscriptionManager; \
           m = SubscriptionManager('config/subscriptions.yaml'); \
           print(f'Active: {len(m.list_subscriptions())}')"
```

### Docker Deployment

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agents/ ./agents/
COPY config/ ./config/

ENV PYTHONPATH=/app

CMD ["python", "-m", "agents.notification.subscription_manager_agent"]
```

**Docker Compose**:
```yaml
version: '3.8'

services:
  subscription-manager:
    build: .
    volumes:
      - ./config:/app/config
      - ./logs:/app/logs
    environment:
      - STELLIO_URL=http://stellio:8080
    depends_on:
      - stellio
```

---

## Best Practices

### 1. Subscription Naming

Use descriptive names:
```yaml
# ✅ Good
- name: "high-traffic-congestion-alerts"

# ❌ Bad
- name: "sub1"
```

### 2. Throttling Configuration

Set appropriate throttling:
```yaml
# High-frequency data (every 30s)
throttling: 60  # 1 minute

# Medium-frequency (every 5 minutes)
throttling: 300  # 5 minutes

# Critical alerts (immediate)
throttling: 0  # No throttling
```

### 3. Expiry Management

Set realistic expiry dates:
```yaml
# Production (1 year)
expires_at: "2026-11-01T00:00:00Z"

# Testing (1 week)
expires_at: "2025-11-08T00:00:00Z"
```

Enable auto-renewal:
```yaml
monitoring:
  auto_renew:
    enabled: true
    renew_before_days: 7
```

### 4. Error Handling

Enable retry logic:
```yaml
stellio:
  max_retries: 3
  retry_backoff_factor: 2  # 1s, 2s, 4s
```

### 5. Monitoring

Enable Prometheus metrics:
```yaml
monitoring:
  prometheus:
    enabled: true
    port: 9092
```

Monitor:
- `subscription_manager_subscriptions_active`
- `subscription_manager_subscriptions_failed`
- `subscription_manager_auto_renewals_total`

---

## Troubleshooting

### Issue 1: Stellio Connection Refused

**Symptoms**:
```
ConnectionError: Connection refused to http://stellio:8080
```

**Solution**:
```bash
# Check Stellio status
curl http://stellio:8080/ngsi-ld/v1/subscriptions

# Update configuration
nano config/subscriptions.yaml
# Change: base_url: "http://localhost:8080"
```

### Issue 2: Subscription Already Exists

**Symptoms**:
```
409 Conflict: Subscription already exists
```

**Solution**:
```python
# Delete existing subscription
manager.delete_subscription(subscription_id)

# Or list and clean up
subscriptions = manager.list_subscriptions()
for sub in subscriptions:
    manager.delete_subscription(sub['id'])

# Then recreate
manager.create_all_subscriptions()
```

### Issue 3: Notification Endpoint Not Reachable

**Symptoms**:
```
Subscription created but notifications not received
```

**Solution**:
```bash
# Test endpoint
curl -X POST http://alert-dispatcher:8080/notify \
  -H "Content-Type: application/json" \
  -d '{"test": "notification"}'

# Check firewall/network
ping alert-dispatcher

# Update notification endpoint in config
```

### Issue 4: Subscription Not Renewing

**Symptoms**:
```
Subscription expired, auto-renewal not triggered
```

**Solution**:
```yaml
# Ensure auto-renewal is enabled
monitoring:
  enabled: true
  auto_renew:
    enabled: true
    renew_before_days: 7

# Check monitoring is running
# In Python script, ensure monitor_subscriptions() is called periodically
```

---

## Conclusion

The **Subscription Manager Agent** provides production-ready NGSI-LD subscription management with:

✅ **CRUD operations** (Create, Read, Update, Delete)  
✅ **Health monitoring** with auto-renewal (7 days before expiry)  
✅ **Query support** (standard, temporal, geo-queries)  
✅ **Template system** for programmatic creation  
✅ **35 tests passing** (100% pass rate, 81% coverage)  
✅ **Domain-agnostic** (works with any NGSI-LD entities)  
✅ **Config-driven** (all subscriptions in YAML)  
✅ **Production-ready** (error handling, retry logic, monitoring)

**Ready for deployment** in production environments with comprehensive documentation and testing.

---

**Report Generated**: November 2025  
**Agent Version**: 1.0.0  
**Implementation Status**: ✅ COMPLETE
