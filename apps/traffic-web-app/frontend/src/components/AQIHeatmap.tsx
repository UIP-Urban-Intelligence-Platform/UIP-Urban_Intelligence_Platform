/**
 * AQI Heatmap - Air Quality Visualization Layer
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/AQIHeatmap
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-12-07
 * @version 3.0.0
 * @license MIT
 * 
 * @description
 * AQI Heatmap Component - Visualizes air quality data using MapLibre GL native heatmap.
 * Displays AQI intensity across the city with color-coded heat gradients.
 * 
 * Features:
 * - Native MapLibre GL heatmap rendering (no Leaflet plugin required)
 * - AQI intensity-based color gradients (green to red)
 * - Configurable radius and intensity for heat points
 * - Real-time updates from air quality sensors
 * - Performance optimized with memoization
 * - 100% MIT/BSD-3 compatible (no GPL dependencies)
 * 
 * @dependencies
 * - react-map-gl@^7.1: MIT License
 * - maplibre-gl@^4.7: BSD-3-Clause License
 */

import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { useTrafficStore } from '../store/trafficStore';
import type { HeatmapLayerSpecification } from 'maplibre-gl';

interface AQIHeatmapProps {
  visible?: boolean;
}

// Heatmap layer configuration
const heatmapLayerStyle: Omit<HeatmapLayerSpecification, 'id' | 'source'> = {
  type: 'heatmap',
  paint: {
    // Increase weight based on intensity (AQI normalized to 0-1)
    'heatmap-weight': ['get', 'intensity'],
    // Increase intensity as zoom level increases
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 1,
      14, 3
    ],
    // Color gradient from green (low AQI) to purple (hazardous)
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0, 255, 0, 0)',
      0.2, 'rgba(0, 255, 0, 0.5)',
      0.4, 'rgba(255, 255, 0, 0.6)',
      0.6, 'rgba(255, 136, 0, 0.7)',
      0.8, 'rgba(255, 0, 0, 0.8)',
      1, 'rgba(128, 0, 128, 0.9)'
    ],
    // Adjust radius by zoom level
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 2,
      14, 30
    ],
    // Transition from heatmap to circle layer at zoom 14
    'heatmap-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      13, 1,
      15, 0.8
    ]
  }
};

const AQIHeatmap: React.FC<AQIHeatmapProps> = ({ visible = true }) => {
  const { airQuality } = useTrafficStore();
  const sourceId = 'aqi-heatmap-source';
  const layerId = 'aqi-heatmap-layer';

  // Convert air quality data to GeoJSON format
  const geojsonData = useMemo(() => {
    const features = airQuality
      .filter((aq) =>
        aq?.location?.latitude != null &&
        aq?.location?.longitude != null &&
        !isNaN(aq.location.latitude) &&
        !isNaN(aq.location.longitude) &&
        aq.aqi != null &&
        !isNaN(aq.aqi)
      )
      .map((aq) => ({
        type: 'Feature' as const,
        properties: {
          // Normalize AQI to 0-1 intensity (assuming max AQI of 300)
          intensity: Math.min(aq.aqi / 300, 1),
          aqi: aq.aqi
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [aq.location.longitude, aq.location.latitude]
        }
      }));

    return {
      type: 'FeatureCollection' as const,
      features
    };
  }, [airQuality]);

  if (!visible || geojsonData.features.length === 0) {
    return null;
  }

  return (
    <Source id={sourceId} type="geojson" data={geojsonData}>
      <Layer id={layerId} {...heatmapLayerStyle} />
    </Source>
  );
};

export default AQIHeatmap;
