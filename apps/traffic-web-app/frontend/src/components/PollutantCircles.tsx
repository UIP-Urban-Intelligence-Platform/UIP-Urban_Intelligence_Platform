/**
 * Pollutant Circles - Air Quality Marker Visualization
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/PollutantCircles
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Pollutant Circles Component - Visualizes individual pollutant concentrations
 * using proportional circle markers. Supports multiple pollutant types with
 * color-coded visualization.
 * 
 * Features:
 * - Multi-pollutant visualization (PM2.5, PM10, NO2, O3, CO, SO2)
 * - Circle size proportional to concentration
 * - Color-coded by pollutant type
 * - Interactive tooltips with exact values
 * - Pollutant type selector
 * - AQI standard thresholds
 * 
 * @dependencies
 * - react-map-gl@^7.1: Circle markers (MIT license)
 * - maplibre-gl@^4.7: Map integration (BSD-3-Clause)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { CircleMarker, Popup, Tooltip } from './map';

interface PollutantCirclesProps {
  visible?: boolean;
}

type PollutantType = 'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'CO' | 'SO2';

interface PollutantData {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  pollutantType: PollutantType;
  value: number;
  unit: string;
  healthLevel: string;
  healthColor: string;
  healthAdvice: string;
  timestamp: string;
}

interface PollutantResponse {
  success: boolean;
  data: {
    pollutants: PollutantData[];
    timestamp: string;
  };
}

interface PollutantConfig {
  name: PollutantType;
  color: string;
  defaultVisible: boolean;
}

const pollutantConfigs: PollutantConfig[] = [
  { name: 'PM2.5', color: '#9333ea', defaultVisible: true },   // Purple
  { name: 'PM10', color: '#92400e', defaultVisible: true },    // Brown
  { name: 'NO2', color: '#ea580c', defaultVisible: true },     // Orange
  { name: 'O3', color: '#0284c7', defaultVisible: false },     // Blue
  { name: 'CO', color: '#6b7280', defaultVisible: false },     // Gray
  { name: 'SO2', color: '#eab308', defaultVisible: false },    // Yellow
];

const PollutantCircles: React.FC<PollutantCirclesProps> = ({ visible = false }) => {
  // Early return BEFORE any hooks
  if (!visible) return null;

  const [pollutants, setPollutants] = useState<PollutantData[]>([]);
  const [visibleLayers, setVisibleLayers] = useState<Set<PollutantType>>(
    new Set(pollutantConfigs.filter(p => p.defaultVisible).map(p => p.name))
  );

  useEffect(() => {
    if (!visible) return;

    const fetchPollutants = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/air-quality/pollutants`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: PollutantResponse = await response.json();

        if (result.success && result.data.pollutants) {
          setPollutants(result.data.pollutants);
        }
      } catch (err) {
        console.error('Error fetching pollutants:', err);
      }
    };

    fetchPollutants();
    const interval = setInterval(fetchPollutants, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [visible]);

  // toggleLayer function for pollutant layer visibility control
  // Preserved for future layer control UI in sidebar
  const toggleLayer = (pollutantType: PollutantType) => {
    setVisibleLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pollutantType)) {
        newSet.delete(pollutantType);
      } else {
        newSet.add(pollutantType);
      }
      return newSet;
    });
  };
  // Prevent TS6133 - function available for future layer toggle UI
  void toggleLayer;

  const getHealthLevelColor = (healthLevel: string): string => {
    const level = healthLevel.toLowerCase();
    if (level.includes('good')) return '#10b981';
    if (level.includes('moderate')) return '#f59e0b';
    if (level.includes('unhealthy')) return '#dc2626';
    if (level.includes('very unhealthy')) return '#991b1b';
    if (level.includes('hazardous')) return '#7f1d1d';
    return '#6b7280';
  };

  const calculateRadius = (value: number, pollutantType: PollutantType): number => {
    const baseRadius = Math.sqrt(value) * 2;
    const scaleFactor: Record<PollutantType, number> = {
      'PM2.5': 0.8,
      'PM10': 0.7,
      'NO2': 1.0,
      'O3': 0.9,
      'CO': 3.0,
      'SO2': 1.2,
    };
    return Math.max(baseRadius * (scaleFactor[pollutantType] || 1), 5);
  };

  const filteredPollutants = useMemo(() => {
    return pollutants.filter(p => visibleLayers.has(p.pollutantType));
  }, [pollutants, visibleLayers]);

  const pollutantsByType = useMemo(() => {
    const grouped = new Map<PollutantType, PollutantData[]>();

    pollutantConfigs.forEach(config => {
      grouped.set(config.name, []);
    });

    filteredPollutants.forEach(pollutant => {
      const existing = grouped.get(pollutant.pollutantType);
      if (existing) {
        existing.push(pollutant);
      }
    });

    return grouped;
  }, [filteredPollutants]);

  return (
    <>
      {/* Control Panel removed - toggle available in Sidebar (Advanced Layers -> Pollutant Circles) */}

      {/* Pollutant Circles - Render each layer separately */}
      {
        Array.from(pollutantsByType.entries()).map(([pollutantType, pollutantList]) => {
          const config = pollutantConfigs.find(c => c.name === pollutantType);
          if (!config || pollutantList.length === 0) return null;

          return (
            <React.Fragment key={pollutantType}>
              {pollutantList
                .filter(pollutant =>
                  pollutant?.location?.lat != null &&
                  pollutant?.location?.lng != null &&
                  !isNaN(pollutant.location.lat) &&
                  !isNaN(pollutant.location.lng)
                )
                .map(pollutant => {
                  const radius = calculateRadius(pollutant.value, pollutant.pollutantType);
                  const fillColor = getHealthLevelColor(pollutant.healthLevel);

                  return (
                    <CircleMarker
                      key={pollutant.id}
                      center={[pollutant.location.lat, pollutant.location.lng]}
                      radius={radius}
                      pathOptions={{
                        color: config.color,
                        fillColor: fillColor,
                        fillOpacity: 0.5,
                        weight: 2,
                        opacity: 0.8,
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
                        <div style={{ fontSize: '12px', minWidth: '150px' }}>
                          <div style={{
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            color: config.color,
                            fontSize: '13px',
                          }}>
                            {pollutant.pollutantType}
                          </div>
                          <div style={{ marginBottom: '2px' }}>
                            <strong>Value:</strong> {pollutant.value} {pollutant.unit}
                          </div>
                          <div style={{
                            color: fillColor,
                            fontWeight: 'bold',
                          }}>
                            {pollutant.healthLevel}
                          </div>
                        </div>
                      </Tooltip>

                      <Popup maxWidth={300}>
                        <div style={{ padding: '8px' }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            color: config.color,
                          }}>
                            {pollutant.pollutantType} Measurement
                          </h3>

                          <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                            <div style={{
                              marginBottom: '8px',
                              padding: '12px',
                              backgroundColor: '#f9fafb',
                              borderRadius: '6px',
                              borderLeft: `4px solid ${config.color}`,
                            }}>
                              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                                Concentration
                              </div>
                              <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: config.color,
                              }}>
                                {pollutant.value} <span style={{ fontSize: '14px' }}>{pollutant.unit}</span>
                              </div>
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                              <strong>Health Level:</strong>{' '}
                              <span style={{
                                color: fillColor,
                                fontWeight: 'bold',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: `${fillColor}20`,
                              }}>
                                {pollutant.healthLevel}
                              </span>
                            </div>

                            <div style={{
                              marginTop: '12px',
                              padding: '10px',
                              backgroundColor: `${fillColor}10`,
                              borderRadius: '6px',
                              fontSize: '12px',
                              lineHeight: '1.6',
                            }}>
                              <strong style={{ display: 'block', marginBottom: '4px' }}>
                                Health Advisory:
                              </strong>
                              {pollutant.healthAdvice}
                            </div>

                            <div style={{
                              marginTop: '12px',
                              paddingTop: '12px',
                              borderTop: '1px solid #e5e7eb',
                              fontSize: '11px',
                              color: '#6b7280',
                            }}>
                              <div>
                                <strong>Location:</strong> {pollutant.location.lat.toFixed(4)}, {pollutant.location.lng.toFixed(4)}
                              </div>
                              <div>
                                <strong>Timestamp:</strong> {new Date(pollutant.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
            </React.Fragment>
          );
        })
      }
    </>
  );
};

export default PollutantCircles;
