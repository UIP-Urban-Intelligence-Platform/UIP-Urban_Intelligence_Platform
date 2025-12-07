#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Integration Agents Package.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.integration
Author: Nguyen Nhat Quang
Created: 2025-11-27
Version: 2.0.0
License: MIT

Description:
    Integration agents for connecting external systems including
    Neo4j synchronization, cache management, and API gateway.

Components:
    - neo4j_sync_agent: Sync Stellio PostgreSQL to Neo4j
    - api_gateway_agent: API gateway with auth, rate limiting, caching
    - cache_manager_agent: Redis-based caching layer
"""

__all__ = [
    "neo4j_sync_agent",
    "api_gateway_agent",
    "cache_manager_agent",
]
