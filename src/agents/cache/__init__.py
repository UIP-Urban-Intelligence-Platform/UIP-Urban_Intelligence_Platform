#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Cache Management Agents Package.

UIP - Urban Intelligence Platform
Copyright (c) 2025 UIP Team. All rights reserved.
https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.cache
Author: Nguyen Viet Hoang
Created: 2025-11-25
Version: 1.0.0
License: MIT

Description:
    Provides intelligent caching for API responses, computation results,
    and frequently accessed data.
"""

__version__ = "1.0.0"
__all__ = [
    "CacheManagerAgent",
    "CacheInvalidatorAgent",
]

try:
    from .cache_invalidator_agent import CacheInvalidatorAgent
    from .cache_manager_agent import CacheManagerAgent
except ImportError:
    # Optional dependencies not installed - agents unavailable
    pass
