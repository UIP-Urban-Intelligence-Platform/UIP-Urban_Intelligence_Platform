"""Analytics Agents Package.

Module: src.agents.analytics
Author: nguyễn Nhật Quang
Created: 2025-11-21
License: AGPL-3.0
Description:
    Analytical processing agents for traffic monitoring including
    computer vision analysis, accident detection, congestion detection,
    and pattern recognition.

License Notice:
    The cv_analysis_agent module uses ultralytics (YOLOv8) which is licensed
    under AGPL-3.0. If you use CV features, the AGPL-3.0 license applies.
    See LICENSE-AGPL-3.0 for full license text.
"""

from .cv_analysis_agent import (
    CVAnalysisAgent,
    CVConfig,
    YOLOv8Detector,
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
    'YOLOv8Detector',
    'ImageDownloader',
    'MetricsCalculator',
    'NGSILDEntityGenerator',
    'Detection',
    'ImageAnalysisResult',
    'TrafficMetrics',
    'DetectionStatus'
]
