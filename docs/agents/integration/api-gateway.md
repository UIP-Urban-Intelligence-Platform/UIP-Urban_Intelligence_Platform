---
sidebar_position: 1
---

<!--
============================================================================
UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT
============================================================================
File: agents/integration/api-gateway.md
Module: Integration - API Gateway Agent
Author: Nguyen Nhat Quang (Lead), Nguyen Viet Hoang, Nguyen Dinh Anh Tuan
Created: 2025-11-20
Version: 1.0.0
License: MIT

Description:
  API Gateway Agent documentation for providing unified API access with
  authentication, rate limiting, and routing.
============================================================================
-->

# API Gateway Agent

The API Gateway Agent provides unified API access with authentication, rate limiting, and routing.

## 📋 Overview

| Property | Value |
|----------|-------|
| **Module** | `src.agents.integration.api_gateway_agent` |
| **Class** | `APIGatewayAgent` |
| **Author** | UIP Team |
| **Version** | 1.0.0 |

## 🎯 Purpose

- **Unified API endpoint** for all platform services
- **Authentication and authorization** management
- **Rate limiting** per client/endpoint
- **Request routing** to appropriate services

## 🚀 Usage

### Initialize Gateway

```python
from src.agents.integration.api_gateway_agent import APIGatewayAgent

gateway = APIGatewayAgent()

# Start gateway
await gateway.start(port=8080)
```

### Register Routes

```python
# Register service routes
gateway.register_route(
    path="/api/v1/cameras",
    service="camera-service",
    methods=["GET", "POST"]
)

gateway.register_route(
    path="/api/v1/analytics",
    service="analytics-service",
    methods=["GET"],
    rate_limit="100/minute"
)
```

### Authentication

```python
# Validate request
result = await gateway.authenticate(request)
# {
#     "valid": True,
#     "user_id": "USER_001",
#     "roles": ["viewer", "reporter"],
#     "rate_limit_remaining": 95
# }
```

## ⚙️ Configuration

```yaml
# config/api_gateway_config.yaml
api_gateway:
  enabled: true
  port: 8080
  
  # Authentication
  auth:
    type: "jwt"
    secret: "${JWT_SECRET}"
    expiry_hours: 24
    
  # Rate limiting
  rate_limiting:
    enabled: true
    default: "1000/hour"
    by_endpoint:
      "/api/v1/analytics": "100/minute"
      "/api/v1/reports": "50/minute"
  
  # CORS
  cors:
    allowed_origins: ["*"]
    allowed_methods: ["GET", "POST", "PUT", "DELETE"]
    allowed_headers: ["Authorization", "Content-Type"]
  
  # Routing
  routes:
    - path: "/api/v1/cameras"
      upstream: "http://camera-service:8001"
    - path: "/api/v1/analytics"
      upstream: "http://analytics-service:8002"
```

## 📊 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/cameras` | GET | List cameras |
| `/api/v1/cameras/{id}` | GET | Get camera details |
| `/api/v1/analytics/traffic` | GET | Traffic analytics |
| `/api/v1/reports` | POST | Submit report |
| `/health` | GET | Health check |

## 📖 Related Documentation

- [Health Check](../monitoring/health-check) - Service health
- [Performance Monitor](../monitoring/performance-monitor) - Metrics
- [Cache Manager](../cache/cache-manager) - Response caching

---

See the [complete agents reference](../complete-agents-reference) for all available agents.
