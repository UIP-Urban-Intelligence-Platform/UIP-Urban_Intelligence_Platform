/**
 * Vehicle Heatmap - Traffic Density Visualization
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/VehicleHeatmap
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Vehicle Heatmap Component - Visualizes traffic density using vehicle flow observations.
 * Displays vehicle intensity heatmap with configurable gradient and radius.
 * 
 * Features:
 * - Real-time vehicle density visualization
 * - Color gradient from blue (low) to red (high density)
 * - Configurable heat radius and intensity
 * - Automatic layer cleanup on unmount
 * - Performance optimized rendering
 * 
 * @dependencies
 * - react-leaflet@^4.2: Leaflet React integration
 * - leaflet.heat@^0.2: Heatmap visualization
 * - leaflet@^1.9: Mapping library
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: HeatLayerOptions
  ): any;

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }
}

interface VehicleHeatmapProps {
  visible?: boolean;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface VehicleHeatmapResponse {
  success: boolean;
  data: {
    heatmapData: HeatmapPoint[];
    metadata: {
      totalPoints: number;
      maxIntensity: number;
      minIntensity: number;
      timestamp: string;
    };
  };
}

export const VehicleHeatmap: React.FC<VehicleHeatmapProps> = ({ visible = false }) => {
  // Early return BEFORE any hooks
  if (!visible) return null;

  const map = useMap();
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [heatLayer, setHeatLayer] = useState<any>(null);

  // Heatmap configuration
  const heatmapConfig = {
    radius: 40,
    blur: 25,
    maxZoom: 18,
    max: 1.0,
    gradient: {
      0.0: 'blue',
      0.5: 'yellow',
      0.8: 'orange',
      1.0: 'red',
    },
  };

  const fetchHeatmapData = useCallback(async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/patterns/vehicle-heatmap`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: VehicleHeatmapResponse = await response.json();

      if (result.success && result.data.heatmapData) {
        setHeatmapData(result.data.heatmapData);
      }
    } catch (err) {
      console.error('Error fetching vehicle heatmap:', err);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchHeatmapData();
    }
  }, [visible, fetchHeatmapData]);

  useEffect(() => {
    if (!map || !visible) {
      if (heatLayer) {
        map?.removeLayer(heatLayer);
        setHeatLayer(null);
      }
      return;
    }

    // Remove existing layer
    if (heatLayer) {
      map.removeLayer(heatLayer);
    }

    if (heatmapData.length === 0) {
      return;
    }

    // Convert data to leaflet.heat format: [lat, lng, intensity]
    // Filter out invalid coordinates
    const heatPoints: [number, number, number][] = heatmapData
      .filter(point =>
        point?.lat != null &&
        point?.lng != null &&
        point?.intensity != null &&
        !isNaN(point.lat) &&
        !isNaN(point.lng) &&
        !isNaN(point.intensity)
      )
      .map(point => [
        point.lat,
        point.lng,
        point.intensity,
      ]);

    // Don't create heatmap if no valid points
    if (heatPoints.length === 0) {
      return;
    }

    // Create heat layer
    const newHeatLayer = L.heatLayer(heatPoints, heatmapConfig);
    newHeatLayer.addTo(map);
    setHeatLayer(newHeatLayer);

    return () => {
      if (newHeatLayer) {
        map.removeLayer(newHeatLayer);
      }
    };
  }, [map, heatmapData, visible]);

  return (
    <>
      {/* Control Panel removed - toggle available in Sidebar (Layer Visibility -> Vehicle Heatmap) */}
      {/* Heatmap layer is controlled via useEffect */}
    </>
  );
};

export default VehicleHeatmap;
