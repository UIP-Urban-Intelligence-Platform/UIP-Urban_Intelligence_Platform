/**
 * Vehicle Heatmap - Traffic Density Visualization
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/VehicleHeatmap
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-12-07
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * Vehicle Heatmap Component - Visualizes traffic density using MapLibre GL native heatmap.
 * Displays vehicle intensity heatmap with configurable gradient and radius.
 * 
 * Features:
 * - Native MapLibre GL heatmap rendering (no Leaflet plugin required)
 * - Real-time vehicle density visualization
 * - Color gradient from blue (low) to red (high density)
 * - Configurable heat radius and intensity
 * - Performance optimized rendering
 * - 100% MIT/BSD-3 compatible (no GPL dependencies)
 * 
 * @dependencies
 * - react-map-gl@^7.1: MIT License
 * - maplibre-gl@^4.7: BSD-3-Clause License
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import type { HeatmapLayerSpecification } from 'maplibre-gl';

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

// Heatmap layer configuration - traffic density colors (blue to red)
const heatmapLayerStyle: Omit<HeatmapLayerSpecification, 'id' | 'source'> = {
  type: 'heatmap',
  paint: {
    // Increase weight based on intensity
    'heatmap-weight': ['get', 'intensity'],
    // Increase intensity as zoom level increases
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 1,
      18, 3
    ],
    // Color gradient from blue (low) to red (high density)
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0, 0, 255, 0)',
      0.2, 'rgba(0, 0, 255, 0.5)',
      0.5, 'rgba(255, 255, 0, 0.7)',
      0.8, 'rgba(255, 165, 0, 0.8)',
      1, 'rgba(255, 0, 0, 0.9)'
    ],
    // Adjust radius by zoom level
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 5,
      14, 40
    ],
    // Opacity adjustments
    'heatmap-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      13, 1,
      18, 0.8
    ]
  }
};

export const VehicleHeatmap: React.FC<VehicleHeatmapProps> = ({ visible = false }) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const sourceId = 'vehicle-heatmap-source';
  const layerId = 'vehicle-heatmap-layer';

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

  // Convert heatmap data to GeoJSON format
  const geojsonData = useMemo(() => {
    const features = heatmapData
      .filter(point =>
        point?.lat != null &&
        point?.lng != null &&
        point?.intensity != null &&
        !isNaN(point.lat) &&
        !isNaN(point.lng) &&
        !isNaN(point.intensity)
      )
      .map(point => ({
        type: 'Feature' as const,
        properties: {
          intensity: point.intensity
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [point.lng, point.lat]
        }
      }));

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [heatmapData]);

  if (!visible || geojsonData.features.length === 0) {
    return null;
  }

  return (
    <Source id={sourceId} type="geojson" data={geojsonData}>
      <Layer id={layerId} {...heatmapLayerStyle} />
    </Source>
  );
};

export default VehicleHeatmap;
