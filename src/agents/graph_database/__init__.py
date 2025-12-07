#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Graph Database Agents Package.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.graph_database
Author: Nguyen Viet Hoang
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Neo4j integration agents for graph-based traffic analysis and relationship queries.
"""

__version__ = "1.0.0"
__all__ = [
    "Neo4jSyncAgent",
    "Neo4jQueryAgent",
]

try:
    from .neo4j_query_agent import Neo4jQueryAgent
    from .neo4j_sync_agent import Neo4jSyncAgent
except ImportError:
    # Neo4j dependencies not installed - agents unavailable
    pass
