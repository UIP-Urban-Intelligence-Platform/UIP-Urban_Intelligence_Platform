/**
 * Speed Zones - Speed Limit Area Visualization
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/SpeedZones
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Speed Zones Component - Displays speed limit zones as colored polygons on map.
 * Visualizes different speed limit areas across the city with color coding.
 * 
 * Features:
 * - GeoJSON polygon rendering for speed zones
 * - Color-coded zones by speed limit (30, 50, 60, 80 km/h)
 * - Interactive tooltips with speed limit info
 * - Popups with zone details
 * - Semi-transparent overlays for visibility
 * 
 * @dependencies
 * - react-map-gl@^7.1: Polygon rendering (MIT license)
 * - maplibre-gl@^4.7: GeoJSON support (BSD-3-Clause)
 */

import React, { useState, useEffect } from 'react';
import { Polygon, Tooltip, Popup } from './map';

interface SpeedZonesProps {
  visible?: boolean;
}

interface SpeedZone {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    speedCategory: 'slow' | 'medium' | 'fast';
    avgSpeed: number;
    minSpeed: number;
    maxSpeed: number;
    color: string;
    patternIds: string[];
    patternCount: number;
  };
}

interface SpeedZonesGeoJSON {
  type: 'FeatureCollection';
  features: SpeedZone[];
  metadata: {
    totalZones: number;
    totalPatterns: number;
    timestamp: string;
  };
}

interface SpeedZonesResponse {
  success: boolean;
  data: SpeedZonesGeoJSON;
}

const speedCategoryConfig = {
  slow: {
    label: 'Slow (<20 km/h)',
    color: '#ff0000',
    fill: '#ff0000',
    opacity: 0.3,
    hoverOpacity: 0.5,
  },
  medium: {
    label: 'Medium (20-40 km/h)',
    color: '#ffaa00',
    fill: '#ffaa00',
    opacity: 0.3,
    hoverOpacity: 0.5,
  },
  fast: {
    label: 'Fast (>40 km/h)',
    color: '#00ff00',
    fill: '#00ff00',
    opacity: 0.3,
    hoverOpacity: 0.5,
  },
};

export const SpeedZones: React.FC<SpeedZonesProps> = ({ visible = false }) => {
  // Early return BEFORE any hooks
  if (!visible) return null;

  const [speedZones, setSpeedZones] = useState<SpeedZone[]>([]);
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const fetchSpeedZones = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/patterns/speed-zones`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: SpeedZonesResponse = await response.json();

        if (result.success && result.data.features) {
          setSpeedZones(result.data.features);
        }
      } catch (err) {
        console.error('Error fetching speed zones:', err);
      }
    };

    fetchSpeedZones();
    const interval = setInterval(fetchSpeedZones, 60000);

    return () => clearInterval(interval);
  }, [visible]);

  if (speedZones.length === 0) return null;

  return (
    <>
      {/* Control Panel removed - toggle available in Sidebar (Advanced Layers -> Speed Zones) */}

      {/* Speed Zone Polygons */}
      {speedZones
        .filter(zone =>
          zone?.geometry?.coordinates?.[0] &&
          Array.isArray(zone.geometry.coordinates[0]) &&
          zone.geometry.coordinates[0].length > 0
        )
        .map((zone, index) => {
          const config = speedCategoryConfig[zone.properties.speedCategory];
          const isHovered = hoveredZoneId === `zone-${index}`;

          // Convert GeoJSON coordinates to Leaflet format and validate
          const positions = zone.geometry.coordinates[0]
            .filter(coord =>
              Array.isArray(coord) &&
              coord.length >= 2 &&
              coord[0] != null &&
              coord[1] != null &&
              !isNaN(coord[0]) &&
              !isNaN(coord[1])
            )
            .map(coord => [coord[1], coord[0]] as [number, number]);

          // Skip if no valid positions
          if (positions.length < 3) return null;

          return (
            <Polygon
              key={`zone-${index}`}
              positions={positions}
              pathOptions={{
                color: config.color,
                fillColor: config.fill,
                fillOpacity: isHovered ? config.hoverOpacity : config.opacity,
                weight: 2,
                opacity: isHovered ? 1 : 0.6,
              }}
              eventHandlers={{
                mouseover: () => setHoveredZoneId(`zone-${index}`),
                mouseout: () => setHoveredZoneId(null),
              }}
            >
              <Tooltip direction="top" opacity={0.95}>
                <div style={{ fontSize: '12px', minWidth: '120px' }}>
                  <div style={{ fontWeight: 'bold', color: config.color, marginBottom: '4px' }}>
                    {zone.properties.speedCategory.toUpperCase()} Speed Zone
                  </div>
                  <div>
                    <strong>Avg Speed:</strong> {zone.properties.avgSpeed.toFixed(1)} km/h
                  </div>
                </div>
              </Tooltip>

              <Popup maxWidth={300}>
                <div style={{ padding: '8px' }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '12px',
                      color: config.color,
                    }}
                  >
                    {zone.properties.speedCategory.charAt(0).toUpperCase() +
                      zone.properties.speedCategory.slice(1)} Speed Zone
                  </h3>

                  <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                    <div
                      style={{
                        marginBottom: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${config.color}`,
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                            Avg Speed
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: config.color }}>
                            {zone.properties.avgSpeed.toFixed(1)}
                            <span style={{ fontSize: '12px' }}> km/h</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                            Patterns
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                            {zone.properties.patternCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <strong>Min Speed:</strong> {zone.properties.minSpeed.toFixed(1)} km/h
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <strong>Max Speed:</strong> {zone.properties.maxSpeed.toFixed(1)} km/h
                    </div>

                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                        fontSize: '11px',
                        color: '#6b7280',
                      }}
                    >
                      <div style={{ marginBottom: '4px' }}>
                        <strong>Active Patterns:</strong> {zone.properties.patternIds.length}
                      </div>
                      <div style={{
                        maxHeight: '60px',
                        overflow: 'auto',
                        fontSize: '10px',
                        color: '#9ca3af',
                      }}>
                        {zone.properties.patternIds.slice(0, 5).join(', ')}
                        {zone.properties.patternIds.length > 5 && ` and ${zone.properties.patternIds.length - 5} more...`}
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}
    </>
  );
};

export default SpeedZones;
