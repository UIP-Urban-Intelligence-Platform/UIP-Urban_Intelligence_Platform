/**
 * @module apps/traffic-web-app/frontend/src/components/CorrelationLines
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Correlation Lines Component - Visualizes spatial relationships between entities.
 * Draws connecting lines between cameras, accidents, and weather stations to show
 * correlations and proximity relationships.
 * 
 * Features:
 * - Polyline rendering between correlated entities
 * - Color-coded lines by relationship type
 * - Interactive popups with correlation details
 * - Automatic nearest entity calculation
 * - Performance optimized with memoization
 * 
 * @dependencies
 * - react-leaflet@^4.2: Polyline rendering
 * - leaflet@^1.9: Geospatial calculations
 */

import React, { useState, useMemo } from 'react';
import { Polyline, Popup } from 'react-leaflet';
import { useTrafficStore } from '../store/trafficStore';

interface CorrelationLinesProps {
  visible?: boolean;
}

interface Weather {
  id: string;
  cameraId?: string;
  location: {
    latitude: number;
    longitude: number;
    district: string;
  };
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: string;
  condition: string;
  timestamp: string;
}

interface Accident {
  id: string;
  affectedCamera?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  type: string;
  severity: 'minor' | 'moderate' | 'severe' | 'fatal';
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface Correlation {
  id: string;
  weather: Weather;
  accident: Accident;
  distance: number;
  timeDiff: number;
  strength: number;
  positions: [[number, number], [number, number]];
  color: string;
  weight: number;
}

const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Earth's radius in meters
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

const calculateTimeDiff = (time1: string, time2: string): number => {
  const date1 = new Date(time1);
  const date2 = new Date(time2);
  return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60); // minutes
};

const getSeverityColor = (severity: string): string => {
  const severityMap: Record<string, string> = {
    severe: '#ff0000',
    fatal: '#ff0000',
    moderate: '#ff8800',
    minor: '#ffff00',
  };
  return severityMap[severity.toLowerCase()] || '#ffff00';
};

const calculateCorrelationStrength = (distanceMeters: number, timeDiffMinutes: number): number => {
  return 1 / (distanceMeters / 100 + timeDiffMinutes / 10);
};

export const CorrelationLines: React.FC<CorrelationLinesProps> = ({ visible = false }) => {
  // Early return BEFORE any hooks
  if (!visible) return null;

  const weatherData = useTrafficStore((state) => state.weather);
  const accidentData = useTrafficStore((state) => state.accidents);
  const [hoveredLineId, setHoveredLineId] = useState<string | null>(null);

  const correlations = useMemo((): Correlation[] => {
    if (weatherData.length === 0 || accidentData.length === 0) {
      return [];
    }

    const allCorrelations: Correlation[] = [];

    accidentData
      .filter(accident =>
        accident?.location?.latitude != null &&
        accident?.location?.longitude != null &&
        !isNaN(accident.location.latitude) &&
        !isNaN(accident.location.longitude)
      )
      .forEach((accident) => {
        let nearestWeather: Weather | null = null;
        let minDistance = Infinity;
        let minTimeDiff = Infinity;

        weatherData
          .filter(weather =>
            weather?.location?.latitude != null &&
            weather?.location?.longitude != null &&
            !isNaN(weather.location.latitude) &&
            !isNaN(weather.location.longitude)
          )
          .forEach((weather) => {
            const distance = calculateDistance(
              accident.location.latitude,
              accident.location.longitude,
              weather.location.latitude,
              weather.location.longitude
            );

            const timeDiff = calculateTimeDiff(accident.timestamp, weather.timestamp);

            // Check correlation criteria: distance < 500m AND time < 30min
            if (distance < 500 && timeDiff < 30) {
              if (distance < minDistance) {
                minDistance = distance;
                minTimeDiff = timeDiff;
                nearestWeather = weather;
              }
            }
          });

        if (nearestWeather !== null) {
          const weatherStation: Weather = nearestWeather;
          const strength = calculateCorrelationStrength(minDistance, minTimeDiff);
          const color = getSeverityColor(accident.severity);
          const weight = Math.min(Math.max(strength * 2, 1), 4);

          allCorrelations.push({
            id: `${accident.id}-${weatherStation.id}`,
            weather: weatherStation,
            accident,
            distance: minDistance,
            timeDiff: minTimeDiff,
            strength,
            positions: [
              [weatherStation.location.latitude, weatherStation.location.longitude],
              [accident.location.latitude, accident.location.longitude],
            ],
            color,
            weight,
          });
        }
      });

    // Sort by strength and take top 50
    return allCorrelations
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 50);
  }, [weatherData, accidentData]);

  if (!visible) return null;

  return (
    <>
      {/* Control Panel removed - toggle available in Sidebar (Advanced Layers -> Correlations) */}

      {/* Correlation Lines */}
      {visible &&
        correlations.map((correlation) => {
          const isHovered = hoveredLineId === correlation.id;

          return (
            <Polyline
              key={correlation.id}
              positions={correlation.positions}
              pathOptions={{
                color: correlation.color,
                weight: isHovered ? correlation.weight + 1 : correlation.weight,
                opacity: isHovered ? 0.9 : 0.6,
                dashArray: '5, 5',
              }}
              eventHandlers={{
                mouseover: () => setHoveredLineId(correlation.id),
                mouseout: () => setHoveredLineId(null),
              }}
            >
              <Popup maxWidth={320}>
                <div style={{ padding: '8px' }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '12px',
                      color: correlation.color,
                    }}
                  >
                    Weather Impact on Accident
                  </h3>

                  <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                    {/* Correlation Metrics */}
                    <div
                      style={{
                        marginBottom: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${correlation.color}`,
                      }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                          Correlation Strength
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: correlation.color }}>
                          {correlation.strength.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                        <div>
                          <div style={{ color: '#6b7280' }}>Distance</div>
                          <div style={{ fontWeight: 'bold' }}>{Math.round(correlation.distance)}m</div>
                        </div>
                        <div>
                          <div style={{ color: '#6b7280' }}>Time Diff</div>
                          <div style={{ fontWeight: 'bold' }}>{Math.round(correlation.timeDiff)} min</div>
                        </div>
                      </div>
                    </div>

                    {/* Accident Info */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                        Accident Details
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Type:</strong> {correlation.accident.type}
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Severity:</strong>{' '}
                          <span style={{ color: correlation.color, fontWeight: 'bold' }}>
                            {correlation.accident.severity.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Location:</strong> {correlation.accident.location.address}
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Time:</strong> {new Date(correlation.accident.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Weather Info */}
                    <div
                      style={{
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                        Weather Conditions
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Condition:</strong> {correlation.weather.condition}
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Temperature:</strong> {correlation.weather.temperature}°C
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Rainfall:</strong> {correlation.weather.rainfall}mm
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Wind:</strong> {correlation.weather.windSpeed} km/h {correlation.weather.windDirection}
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Humidity:</strong> {correlation.weather.humidity}%
                        </div>
                        <div style={{ marginBottom: '2px' }}>
                          <strong>Station:</strong> {correlation.weather.location.district}
                        </div>
                      </div>
                    </div>

                    {/* Analysis */}
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#fef3c7',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#92400e',
                      }}
                    >
                      <strong>Correlation Analysis:</strong> This accident occurred {Math.round(correlation.distance)}m
                      from a weather station, {Math.round(correlation.timeDiff)} minutes after the weather conditions
                      were recorded, suggesting potential weather-related contributing factors.
                    </div>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })
      }
    </>
  );
};

export default CorrelationLines;