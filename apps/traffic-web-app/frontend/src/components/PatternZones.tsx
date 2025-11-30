/**
 * @module apps/traffic-web-app/frontend/src/components/PatternZones
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Pattern Zones Component - Visualizes traffic patterns and congestion zones
 * with dual-mode display supporting both congestion and AQI visualization.
 * 
 * Features:
 * - Dual display mode: congestion only, AQI only, or combined view
 * - Color-coded zones by congestion level (none, low, medium, high, severe)
 * - AQI overlay with opacity-based intensity
 * - Pattern stripes for better distinction
 * - Interactive popups with detailed metrics
 * - Real-time pattern updates
 * - SVG overlays for pattern visualization
 * 
 * Congestion Levels:
 * - None: Green (#10b981)
 * - Low: Yellow (#fbbf24)
 * - Medium: Orange (#f97316)
 * - High: Red (#ef4444)
 * - Severe: Dark red (#991b1b)
 * 
 * @dependencies
 * - react-leaflet@^4.2: Polygon and SVG overlays
 * - leaflet@^1.9: Bounds and coordinates
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Polygon, Popup, SVGOverlay } from 'react-leaflet';
import { LatLngExpression, LatLngBounds } from 'leaflet';
import { useTrafficStore } from '../store/trafficStore';
import { TrafficPattern, AirQuality } from '../types';

interface PatternZonesProps {
  visible?: boolean;
  displayMode?: 'congestion' | 'aqi' | 'dual';
}

interface ZonePolygon {
  pattern: TrafficPattern;
  coordinates: LatLngExpression[];
  color: string;
  opacity: number;
  aqiLevel?: string;
  aqiValue?: number;
  aqiColor?: string;
}

// DisplayMode type for future filter UI toggle: 'congestion' | 'aqi' | 'dual'
// Currently using propDisplayMode from props directly

const calculateConvexHull = (points: Array<[number, number]>): Array<[number, number]> => {
  if (points.length < 3) return points;

  const sorted = [...points].sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);

  const cross = (o: [number, number], a: [number, number], b: [number, number]): number => {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  };

  const lower: Array<[number, number]> = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: Array<[number, number]> = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();

  return [...lower, ...upper];
};

const expandPolygon = (points: Array<[number, number]>, factor: number = 0.002): Array<[number, number]> => {
  if (points.length === 0) return points;

  const centerLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
  const centerLng = points.reduce((sum, p) => sum + p[1], 0) / points.length;

  return points.map(([lat, lng]) => {
    const dLat = lat - centerLat;
    const dLng = lng - centerLng;
    return [lat + dLat * factor, lng + dLng * factor] as [number, number];
  });
};

const getCongestionColor = (level: string): { color: string; opacity: number } => {
  const normalized = level.toLowerCase();

  switch (normalized) {
    case 'high':
    case 'severe':
      return { color: '#ff0000', opacity: 0.3 };
    case 'medium':
    case 'moderate':
    case 'heavy':
      return { color: '#ffa500', opacity: 0.3 };
    case 'low':
    case 'light':
    case 'free_flow':
      return { color: '#00ff00', opacity: 0.3 };
    default:
      return { color: '#808080', opacity: 0.2 };
  }
};

// Get AQI level and color
const getAQIColor = (aqi: number): { level: string; color: string } => {
  if (aqi <= 50) return { level: 'Good', color: '#00e400' };
  if (aqi <= 100) return { level: 'Moderate', color: '#ffff00' };
  if (aqi <= 150) return { level: 'Unhealthy for Sensitive', color: '#ff7e00' };
  if (aqi <= 200) return { level: 'Unhealthy', color: '#ff0000' };
  if (aqi <= 300) return { level: 'Very Unhealthy', color: '#8f3f97' };
  return { level: 'Hazardous', color: '#7e0023' };
};

// Calculate distance between two points
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const isPatternActiveNow = (pattern: TrafficPattern): boolean => {
  if (!pattern.timeRange && !pattern.daysOfWeek) return true;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[now.getDay()];

  if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
    const isActiveDay = pattern.daysOfWeek.some(day =>
      day.toLowerCase() === currentDay.toLowerCase()
    );
    if (!isActiveDay) return false;
  }

  if (pattern.timeRange) {
    const timeRangeRegex = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;
    const match = pattern.timeRange.match(timeRangeRegex);

    if (match) {
      const [, startH, startM, endH, endM] = match.map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;

      if (endTime > startTime) {
        return currentTime >= startTime && currentTime <= endTime;
      } else {
        return currentTime >= startTime || currentTime <= endTime;
      }
    }
  }

  return true;
};

const PatternZones: React.FC<PatternZonesProps> = ({ visible = true, displayMode: propDisplayMode = 'dual' }) => {
  const { patterns, cameras, airQuality, setSelectedPattern } = useTrafficStore();
  const [hoveredPatternId, setHoveredPatternId] = useState<string | null>(null);
  // filterByTime state - setter preserved for future time-based filter UI
  const [filterByTime, _setFilterByTime] = useState(false);
  void _setFilterByTime; // Prevents TS6133 while keeping setter available for future UI
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const displayMode = propDisplayMode; // Use displayMode from props

  const zones = useMemo((): ZonePolygon[] => {
    const result: ZonePolygon[] = [];

    patterns.forEach((pattern) => {
      if (!pattern.affectedCameras || pattern.affectedCameras.length === 0) {
        return;
      }

      if (filterByTime && !isPatternActiveNow(pattern)) {
        return;
      }

      const cameraPoints: Array<[number, number]> = [];

      pattern.affectedCameras.forEach((cameraId) => {
        const camera = cameras.find((c) => c.id === cameraId);
        if (camera &&
          camera?.location?.latitude != null &&
          camera?.location?.longitude != null &&
          !isNaN(camera.location.latitude) &&
          !isNaN(camera.location.longitude)) {
          cameraPoints.push([camera.location.latitude, camera.location.longitude]);
        }
      });

      if (cameraPoints.length === 0) return;

      // Calculate center of pattern for AQI lookup
      const centerLat = cameraPoints.reduce((sum, p) => sum + p[0], 0) / cameraPoints.length;
      const centerLng = cameraPoints.reduce((sum, p) => sum + p[1], 0) / cameraPoints.length;

      // Find nearest AQI sensor
      let nearestAQI: AirQuality | null = null;
      let minDistance = Infinity;
      airQuality.forEach((aqi) => {
        const dist = calculateDistance(
          centerLat,
          centerLng,
          aqi.location.latitude,
          aqi.location.longitude
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestAQI = aqi;
        }
      });

      let polygonPoints: Array<[number, number]>;

      if (cameraPoints.length === 1) {
        const [lat, lng] = cameraPoints[0];
        const radius = 0.005;
        polygonPoints = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * 2 * Math.PI;
          polygonPoints.push([
            lat + radius * Math.cos(angle),
            lng + radius * Math.sin(angle)
          ]);
        }
      } else if (cameraPoints.length === 2) {
        const [p1, p2] = cameraPoints;
        const dLat = p2[0] - p1[0];
        const dLng = p2[1] - p1[1];
        const perpLat = -dLng * 0.3;
        const perpLng = dLat * 0.3;

        polygonPoints = [
          [p1[0] + perpLat, p1[1] + perpLng],
          [p2[0] + perpLat, p2[1] + perpLng],
          [p2[0] - perpLat, p2[1] - perpLng],
          [p1[0] - perpLat, p1[1] - perpLng],
        ];
      } else {
        const hull = calculateConvexHull(cameraPoints);
        polygonPoints = expandPolygon(hull, 0.3);
      }

      const { color: congestionColor, opacity } = getCongestionColor(pattern.congestionLevel);
      const isHovered = hoveredPatternId === pattern.id;

      // Determine final color based on display mode
      let finalColor = congestionColor;
      let aqiInfo = undefined;

      if (nearestAQI !== null && minDistance < 2) { // Within 2km
        const aqiStation: AirQuality = nearestAQI;
        const aqiData = getAQIColor(aqiStation.aqi);
        aqiInfo = {
          level: aqiData.level,
          value: aqiStation.aqi,
          color: aqiData.color,
        };

        // In dual mode, create a gradient or split color
        if (displayMode === 'dual') {
          // Use AQI color with congestion border
          finalColor = aqiData.color;
        } else if (displayMode === 'aqi') {
          finalColor = aqiData.color;
        }
      }

      result.push({
        pattern,
        coordinates: polygonPoints as LatLngExpression[],
        color: finalColor,
        opacity: isHovered ? opacity + 0.2 : opacity,
        aqiLevel: aqiInfo?.level,
        aqiValue: aqiInfo?.value,
        aqiColor: aqiInfo?.color,
      });
    });

    return result;
  }, [patterns, cameras, airQuality, filterByTime, hoveredPatternId, displayMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTrigger((prev) => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    zones.forEach((zone) => {
      zone.opacity = zone.opacity + Math.sin(animationTrigger * 0.1) * 0.05;
    });
  }, [animationTrigger, zones]);

  if (!visible) return null;

  return (
    <>
      {/* SVG Pattern Definitions for AQI Stripes */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Good AQI (green stripes) */}
          <pattern
            id="aqi-good"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="#00e400" strokeWidth="5" />
          </pattern>

          {/* Moderate AQI (yellow stripes) */}
          <pattern
            id="aqi-moderate"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="#ffff00" strokeWidth="5" />
          </pattern>

          {/* Unhealthy AQI (red stripes) */}
          <pattern
            id="aqi-unhealthy"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="#ff0000" strokeWidth="5" />
          </pattern>

          {/* Very Unhealthy AQI (purple stripes) */}
          <pattern
            id="aqi-very-unhealthy"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="#8f3f97" strokeWidth="5" />
          </pattern>

          {/* Hazardous AQI (maroon stripes) */}
          <pattern
            id="aqi-hazardous"
            patternUnits="userSpaceOnUse"
            width="10"
            height="10"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="10" stroke="#7e0023" strokeWidth="5" />
          </pattern>
        </defs>
      </svg>

      {/* Legacy Panel - Now using MapLegend component instead */}
      {/* 
      <div
        style={{
          position: 'absolute',
          top: '240px',
          right: '10px',
          ...
        }}
      >
        ... Panel content removed - see MapLegend component
      </div>
      */}

      {zones.map((zone) => {
        // Determine fill and border for dual mode
        const { color: congestionColor } = getCongestionColor(zone.pattern.congestionLevel);
        let fillColor = zone.color;
        let fillPattern: string | undefined = undefined;

        // In dual mode, use congestion for border and AQI pattern for fill
        if (displayMode === 'dual' && zone.aqiValue !== undefined) {
          const aqiValue = zone.aqiValue;
          if (aqiValue <= 50) {
            fillPattern = 'url(#aqi-good)';
          } else if (aqiValue <= 100) {
            fillPattern = 'url(#aqi-moderate)';
          } else if (aqiValue <= 150) {
            fillPattern = 'url(#aqi-unhealthy)';
          } else if (aqiValue <= 200) {
            fillPattern = 'url(#aqi-very-unhealthy)';
          } else {
            fillPattern = 'url(#aqi-hazardous)';
          }
        }

        return (
          <Polygon
            key={zone.pattern.id}
            positions={zone.coordinates}
            pathOptions={{
              color: displayMode === 'dual' ? congestionColor : zone.color, // Border color
              fillColor: fillPattern ? 'transparent' : fillColor, // Use transparent if using SVG pattern
              fillOpacity: fillPattern ? 0 : zone.opacity,
              weight: 3, // Thicker border as per requirements
              opacity: 0.8,
            }}
            eventHandlers={{
              mouseover: () => setHoveredPatternId(zone.pattern.id),
              mouseout: () => setHoveredPatternId(null),
              click: () => setSelectedPattern(zone.pattern),
            }}
          >
            {fillPattern && (
              <SVGOverlay
                attributes={{ fill: fillPattern, fillOpacity: '0.4' }}
                bounds={
                  new LatLngBounds(
                    zone.coordinates as Array<[number, number]>
                  )
                }
              >
                <polygon
                  points={zone.coordinates
                    .map((coord) => {
                      const [lat, lng] = coord as [number, number];
                      return `${lng},${lat}`;
                    })
                    .join(' ')}
                />
              </SVGOverlay>
            )}
            <Popup>
              <div style={{ minWidth: '260px', padding: '8px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  color: zone.color,
                  borderBottom: `2px solid ${zone.color}`,
                  paddingBottom: '6px'
                }}>
                  Traffic Pattern Zone {zone.aqiLevel && `(${displayMode === 'dual' ? 'Dual View' : displayMode === 'aqi' ? 'AQI View' : 'Congestion View'})`}
                </h3>

                <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                  {/* Congestion Info */}
                  {displayMode !== 'aqi' && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>Traffic Congestion:</div>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Level:</strong>{' '}
                        <span style={{
                          color: getCongestionColor(zone.pattern.congestionLevel).color,
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}>
                          {zone.pattern.congestionLevel}
                        </span>
                      </div>
                      {zone.pattern.avgVehicleCount !== undefined && (
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Avg Vehicles:</strong> {zone.pattern.avgVehicleCount}
                        </div>
                      )}
                      {zone.pattern.averageSpeed !== undefined && (
                        <div style={{ marginBottom: '6px' }}>
                          <strong>Avg Speed:</strong> {zone.pattern.averageSpeed} km/h
                        </div>
                      )}
                    </div>
                  )}

                  {/* AQI Info */}
                  {zone.aqiLevel && displayMode !== 'congestion' && (
                    <div style={{
                      marginBottom: '10px',
                      padding: '8px',
                      backgroundColor: '#e0f2fe',
                      borderRadius: '4px',
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '12px' }}>Air Quality (Nearby):</div>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>AQI:</strong>{' '}
                        <span style={{
                          color: zone.aqiColor,
                          fontWeight: 'bold',
                        }}>
                          {zone.aqiValue}
                        </span>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <strong>Level:</strong>{' '}
                        <span style={{
                          color: zone.aqiColor,
                          fontWeight: 'bold',
                        }}>
                          {zone.aqiLevel}
                        </span>
                      </div>
                    </div>
                  )}

                  {zone.pattern.patternType && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Type:</strong> {zone.pattern.patternType}
                    </div>
                  )}

                  {zone.pattern.roadSegment && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Location:</strong> {zone.pattern.roadSegment}
                    </div>
                  )}

                  {zone.pattern.timeRange && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Active Time:</strong> {zone.pattern.timeRange}
                    </div>
                  )}

                  {zone.pattern.daysOfWeek && zone.pattern.daysOfWeek.length > 0 && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Active Days:</strong> {zone.pattern.daysOfWeek.join(', ')}
                    </div>
                  )}

                  {zone.pattern.affectedCameras && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      <strong>Affected Cameras:</strong> {zone.pattern.affectedCameras.length}
                      <div style={{ marginTop: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                        {zone.pattern.affectedCameras.map((cameraId) => {
                          const camera = cameras.find((c) => c.id === cameraId);
                          return (
                            <div key={cameraId} style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                              • {camera ? camera.name : cameraId}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {zone.pattern.predictions && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px',
                      backgroundColor: '#e0f2fe',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      <strong>🔮 Predictions:</strong>
                      <div style={{ marginTop: '4px' }}>
                        Next hour: {zone.pattern.predictions.nextHour} km/h
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                        Confidence: {(zone.pattern.predictions.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}

                  <div style={{
                    marginTop: '10px',
                    padding: '6px',
                    backgroundColor: isPatternActiveNow(zone.pattern) ? '#d1fae5' : '#fee2e2',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    {isPatternActiveNow(zone.pattern) ? '✅ Active Now' : '❌ Inactive Now'}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPattern(zone.pattern)}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: zone.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}
                >
                  View Full Details
                </button>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};

export default PatternZones;
