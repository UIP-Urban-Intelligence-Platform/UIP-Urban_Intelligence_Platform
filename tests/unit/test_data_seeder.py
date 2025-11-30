#!/usr/bin/env python3
"""Data Seeder Unit Test Suite.
Module: tests.unit.test_data_seeder
Author: nguyễn Nhật Quang
Created: 2025-11-21
Version: 1.0.0
License: MIT

Description:
    Production-ready unit tests for data seeding functionality.
    Tests sample data generation, entity creation, and batch operations.

Usage:
    pytest tests/unit/test_data_seeder.py
"""

import pytest
from src.core.data_seeder import DataSeeder


class TestDataSeeder:
    """Test data seeding functionality."""
    
    @pytest.fixture
    def seeder(self):
        """Create data seeder instance."""
        return DataSeeder()
    
    def test_seed_cameras(self, seeder):
        """Test camera data seeding."""
        cameras = seeder.generate_cameras(count=5)
        
        assert len(cameras) == 5
        for camera in cameras:
            assert "id" in camera
            assert "name" in camera
            assert "location" in camera
            assert "lat" in camera["location"]
            assert "lon" in camera["location"]
    
    def test_seed_observations(self, seeder):
        """Test observation data generation."""
        observations = seeder.generate_observations(
            camera_id="CAM001",
            count=10
        )
        
        assert len(observations) == 10
        for obs in observations:
            assert obs["camera_id"] == "CAM001"
            assert "timestamp" in obs
            assert "vehicles" in obs
            assert obs["vehicles"] >= 0
            assert "congestion_level" in obs
