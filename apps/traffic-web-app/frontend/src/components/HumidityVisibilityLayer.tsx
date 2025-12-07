/**
 * Humidity & Visibility Layer - Environmental Visualization
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/HumidityVisibilityLayer
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Dual-mode environmental visualization component displaying humidity levels and visibility
 * conditions across geographic zones. Provides color-coded polygon overlays and interactive
 * circle markers representing weather station measurements.
 * 
 * Core features:
 * - Dual view modes: Humidity (%) and Visibility (meters)
 * - Dynamic zone polygons with comfort/safety levels
 * - Interactive weather station markers with real-time data
 * - Color-coded thresholds (green/yellow/orange/red)
 * - Tooltip popups with detailed measurements
 * - Automatic zone aggregation from station data
 * 
 * @dependencies
 * - react@18.2.0 - React hooks and component lifecycle
 * - react-map-gl@^7.1 - Circle, Polygon, Popup, Tooltip components (MIT license)
 * - maplibre-gl@^4.7 - Geospatial geometry calculations (BSD-3-Clause)
 * 
 * @example
 * ```tsx
 * <HumidityVisibilityLayer visible={showWeather} />
 * ```
 */
import React, { useState, useMemo, useEffect } from 'react';
import { CircleMarker as Circle, Polygon, Popup, Tooltip } from './map';

interface HumidityVisibilityLayerProps {
  visible?: boolean;
}

type ViewMode = 'humidity' | 'visibility';

interface HumidityZone {
  id: string;
  polygon: number[][];
  humidity: number;
  avgHumidity: number;
  comfortLevel: string;
  color: string;
  stationCount: number;
}

interface HumidityZonesResponse {
  success: boolean;
  data: {
    zones: HumidityZone[];
    metadata: {
      totalZones: number;
      timestamp: string;
    };
  };
}

interface WeatherData {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  visibility: number;
  rainfall?: number;
  humidity?: number;
  temperature?: number;
  timestamp: string;
}

interface WeatherResponse {
  success: boolean;
  data: WeatherData[];
}

const HumidityVisibilityLayer: React.FC<HumidityVisibilityLayerProps> = ({ visible = false }) => {
  // Early return BEFORE any hooks
  if (!visible) return null;

  // viewMode controls which layer is rendered (humidity zones vs visibility circles)
  // State preserved for future toggle UI - can be added to Sidebar
  const [viewMode, _setViewMode] = useState<ViewMode>('humidity');
  // _setViewMode is intentionally unused - kept for future toggle functionality
  void _setViewMode; // Prevents TS6133 while keeping setter available
  const [humidityZones, setHumidityZones] = useState<HumidityZone[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);

  useEffect(() => {
    if (!visible) return;

    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const [humidityResponse, weatherResponse] = await Promise.all([
          fetch(`${API_URL}/api/weather/humidity-zones`),
          fetch(`${API_URL}/api/weather`)
        ]);

        if (!humidityResponse.ok || !weatherResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const humidityResult: HumidityZonesResponse = await humidityResponse.json();
        const weatherResult: WeatherResponse = await weatherResponse.json();

        if (humidityResult.success && humidityResult.data.zones) {
          setHumidityZones(humidityResult.data.zones);
        }

        if (weatherResult.success && weatherResult.data) {
          setWeatherData(weatherResult.data);
        }
      } catch (err) {
        console.error('Error fetching humidity/visibility data:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [visible]);

  const getHumidityGradientColor = (humidity: number): string => {
    if (humidity < 30) return '#0066cc';
    if (humidity < 50) return '#0080dd';
    if (humidity < 70) return '#00aaee';
    return '#00ccff';
  };

  const getHumidityOpacity = (humidity: number): number => {
    return Math.max(0.2, Math.min(humidity / 100, 0.8));
  };

  const getVisibilityColor = (visibility: number): string => {
    // visibility > 5000m green, 1000-5000m yellow, <1000m red
    if (visibility > 5000) return '#22c55e';
    if (visibility >= 1000) return '#eab308';
    return '#ef4444';
  };

  const getVisibilityRadius = (visibility: number): number => {
    // Radius = visibility distance / 100 (scaled)
    return Math.max(visibility / 100, 10); // Minimum radius of 10
  };

  const getVisibilityLevel = (visibility: number): string => {
    if (visibility > 10000) return 'Excellent';
    if (visibility > 5000) return 'Good';
    if (visibility >= 1000) return 'Moderate';
    return 'Poor';
  };

  const visibilityCircles = useMemo(() => {
    return weatherData
      .filter(w =>
        typeof w.visibility === 'number' &&
        w?.location?.lat != null &&
        w?.location?.lng != null &&
        !isNaN(w.location.lat) &&
        !isNaN(w.location.lng)
      )
      .map(w => ({
        weather: w,
        radius: getVisibilityRadius(w.visibility),
        color: getVisibilityColor(w.visibility),
        level: getVisibilityLevel(w.visibility),
        visibilityKm: (w.visibility / 1000).toFixed(1),
      }));
  }, [weatherData]);

  return (
    <>
      {/* Control Panel removed - toggle available in Sidebar (Advanced Layers -> Humidity/Visibility) */}

      {/* Render Mode: Humidity Zones */}
      {
        viewMode === 'humidity' && humidityZones.map(zone => {
          const color = getHumidityGradientColor(zone.avgHumidity);
          const opacity = getHumidityOpacity(zone.avgHumidity);

          return (
            <Polygon
              key={zone.id}
              positions={zone.polygon as any}
              pathOptions={{
                color: 'white',
                fillColor: color,
                fillOpacity: opacity,
                weight: 2,
                dashArray: '5, 5', // Dashed white line
                opacity: 0.8,
              }}
            >
              <Tooltip direction="top" opacity={0.95}>
                <div style={{ fontSize: '12px', minWidth: '150px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    Humidity Zone
                  </div>
                  <div>
                    <strong>Avg Humidity:</strong> {zone.avgHumidity.toFixed(1)}%
                  </div>
                  <div>
                    <strong>Comfort Level:</strong> {zone.comfortLevel}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    {zone.stationCount} weather station{zone.stationCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </Tooltip>

              <Popup maxWidth={300}>
                <div style={{ padding: '8px' }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginBottom: '12px',
                    color: color,
                  }}>
                    Humidity Zone
                  </h3>

                  <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                    <div style={{
                      marginBottom: '12px',
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      borderLeft: `4px solid ${color}`,
                    }}>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                        Average Humidity
                      </div>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: color,
                      }}>
                        {zone.avgHumidity.toFixed(1)}<span style={{ fontSize: '16px' }}>%</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <strong>Comfort Level:</strong>{' '}
                      <span style={{
                        color: color,
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${color}20`,
                      }}>
                        {zone.comfortLevel}
                      </span>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <strong>Weather Stations:</strong> {zone.stationCount}
                    </div>

                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid #e5e7eb',
                      fontSize: '11px',
                      color: '#6b7280',
                    }}>
                      Polygon generated from K-means clustering
                    </div>
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })
      }

      {/* Render Mode: Visibility Circles */}
      {
        viewMode === 'visibility' && visibilityCircles.map(circle => (
          <Circle
            key={circle.weather.id}
            center={[circle.weather.location.lat, circle.weather.location.lng]}
            radius={circle.radius}
            pathOptions={{
              color: circle.color,
              fillColor: circle.color,
              fillOpacity: 0.3,
              weight: 2,
              opacity: 0.7,
            }}
          >
            <Tooltip direction="top" opacity={0.95}>
              <div style={{ fontSize: '12px', minWidth: '120px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  Visibility
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: circle.color,
                }}>
                  {circle.visibilityKm} km
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  {circle.level}
                </div>
              </div>
            </Tooltip>

            <Popup maxWidth={300}>
              <div style={{ padding: '8px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  color: circle.color,
                }}>
                  Visibility Data
                </h3>

                <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                  <div style={{
                    marginBottom: '12px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px',
                    borderLeft: `4px solid ${circle.color}`,
                  }}>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                      Visibility Distance
                    </div>
                    <div style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: circle.color,
                    }}>
                      {circle.visibilityKm} <span style={{ fontSize: '16px' }}>km</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <strong>Condition:</strong>{' '}
                    <span style={{
                      color: circle.color,
                      fontWeight: 'bold',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${circle.color}20`,
                    }}>
                      {circle.level}
                    </span>
                  </div>

                  {circle.weather.rainfall !== undefined && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Rainfall:</strong> {circle.weather.rainfall.toFixed(1)} mm
                    </div>
                  )}

                  {circle.weather.humidity !== undefined && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Humidity:</strong> {circle.weather.humidity.toFixed(1)}%
                    </div>
                  )}

                  {circle.weather.temperature !== undefined && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Temperature:</strong> {circle.weather.temperature.toFixed(1)}°C
                    </div>
                  )}

                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '11px',
                    color: '#6b7280',
                  }}>
                    <div>
                      <strong>Location:</strong> {circle.weather.location.lat.toFixed(4)}, {circle.weather.location.lng.toFixed(4)}
                    </div>
                    <div>
                      <strong>Updated:</strong> {new Date(circle.weather.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Circle>
        ))
      }
    </>
  );
};

export default HumidityVisibilityLayer;