"""
State Management Agents Package
Module: src.agents.state_management
Author: Nguyen Dinh Anh Tuan
Created: 2025-11-23
Version: 1.0.0
License: MIT


Description:
    This package contains agents responsible for centralized state management,
    temporal tracking, and lifecycle management of traffic entities.


"""

__version__ = "1.0.0"
__all__ = [
    "StateManagerAgent",
    "TemporalStateTrackerAgent",
    "AccidentStateManagerAgent",
    "CongestionStateManagerAgent",
]

# Placeholder imports - actual implementations are symbolic
try:
    from .state_manager_agent import StateManagerAgent
    from .temporal_state_tracker_agent import TemporalStateTrackerAgent
    from .accident_state_manager_agent import AccidentStateManagerAgent
    from .congestion_state_manager_agent import CongestionStateManagerAgent
except ImportError:
    # Graceful degradation - these agents are not required for core functionality
    pass
