#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analytics Agents Package.

UIP - Urban Intelligence Platform
Copyright (c) 2024-2025 UIP Team. All rights reserved.
https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform

SPDX-License-Identifier: MIT

Module: src.agents.analytics
Author: Nguyen Nhat Quang
Created: 2025-11-21
Version: 1.0.0
License: MIT

Description:
    Analytical processing agents for traffic monitoring including
    computer vision analysis, accident detection, congestion detection,
    and pattern recognition.

Computer Vision Stack:
    - YOLOX (Apache-2.0) - Vehicle and pedestrian detection
    - DETR (Apache-2.0) - Accident detection via HuggingFace Transformers
"""

from .cv_analysis_agent import (
    CVAnalysisAgent,
    CVConfig,
    Detection,
    DetectionStatus,
    ImageAnalysisResult,
    ImageDownloader,
    MetricsCalculator,
    NGSILDEntityGenerator,
    TrafficMetrics,
    YOLOXDetector,
)

__all__ = [
    "CVAnalysisAgent",
    "CVConfig",
    "YOLOXDetector",
    "ImageDownloader",
    "MetricsCalculator",
    "NGSILDEntityGenerator",
    "Detection",
    "ImageAnalysisResult",
    "TrafficMetrics",
    "DetectionStatus",
]
