"""Analytics Agents Package.

Module: src.agents.analytics
Author: nguyễn Nhật Quang
Created: 2025-11-21
License: MIT

SPDX-License-Identifier: MIT

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
    YOLOXDetector,
    ImageDownloader,
    MetricsCalculator,
    NGSILDEntityGenerator,
    Detection,
    ImageAnalysisResult,
    TrafficMetrics,
    DetectionStatus
)

__all__ = [
    'CVAnalysisAgent',
    'CVConfig',
    'YOLOXDetector',
    'ImageDownloader',
    'MetricsCalculator',
    'NGSILDEntityGenerator',
    'Detection',
    'ImageAnalysisResult',
    'TrafficMetrics',
    'DetectionStatus'
]
