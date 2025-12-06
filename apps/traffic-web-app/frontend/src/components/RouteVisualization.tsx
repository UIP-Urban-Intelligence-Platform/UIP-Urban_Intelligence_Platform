/**
 * Route Visualization - Multi-Criteria Route Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/RouteVisualization
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Advanced route visualization component rendering calculated routes with multi-criteria
 * styling based on route quality scores (AQI, weather, accident risk). Displays polylines
 * with color gradients and interactive waypoint markers showing turn-by-turn instructions.
 * 
 * Core features:
 * - Color-coded route polylines (green/yellow/orange/red by quality score)
 * - Waypoint markers with turn-by-turn navigation instructions
 * - Animated route highlighting on hover
 * - Distance, duration, and score metrics display
 * - Popup tooltips with route segment details
 * - Multiple route comparison visualization
 * 
 * @dependencies
 * - react@18.2.0 - Component state and lifecycle
 * - react-leaflet@4.2.1 - Polyline, Marker, Popup, Tooltip components
 * - leaflet@1.9.4 - Icon creation and map geometry
 * 
 * @example
 * ```tsx
 * <RouteVisualization 
 *   routes={calculatedRoutes}
 *   selectedRouteIndex={0}
 *   onRouteSelect={handleSelect}
 * />
 * ```
 */
import React, { useEffect, useState } from 'react';
import { Polyline, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface CalculatedRoute {
  geometry: GeoJSON.Feature<GeoJSON.LineString>;
  distance: number; // meters
  duration: number; // seconds
  aqiScore: number; // 0-100
  weatherScore: number; // 0-100
  accidentScore: number; // 0-100
  trafficScore: number; // 0-100
  totalScore: number;
  rank: number; // 1-3
  warnings: string[];
}

interface RouteVisualizationProps {
  routes: CalculatedRoute[];
  selectedRoute: CalculatedRoute | null;
  onRouteClick?: (route: CalculatedRoute) => void;
}

// =====================================================
// MARKER ICONS
// =====================================================

const createMarkerIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${label}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const startIcon = createMarkerIcon('#10b981', 'A');
const endIcon = createMarkerIcon('#ef4444', 'B');

const createWarningIcon = (type: 'aqi' | 'accident' | 'traffic' | 'weather') => {
  const colors = {
    aqi: '#f59e0b',
    accident: '#ef4444',
    traffic: '#f97316',
    weather: '#3b82f6',
  };

  const symbols = {
    aqi: '⚠️',
    accident: '🚨',
    traffic: '🚦',
    weather: '🌧️',
  };

  return L.divIcon({
    className: 'warning-marker-icon',
    html: `
      <div style="
        background-color: ${colors[type]};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      ">
        ${symbols[type]}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// =====================================================
// ROUTE VISUALIZATION COMPONENT
// =====================================================

const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  routes,
  selectedRoute,
  onRouteClick,
}) => {
  const [animatedRoutes, setAnimatedRoutes] = useState<Map<number, number>>(new Map());

  // ========== ANIMATION LOGIC ==========

  useEffect(() => {
    if (routes.length === 0) {
      setAnimatedRoutes(new Map());
      return;
    }

    // Animate each route sequentially
    routes.forEach((route, index) => {
      const animationDelay = index * 200; // Stagger animations by 200ms

      setTimeout(() => {
        let progress = 0;
        const steps = 60;
        const increment = 100 / steps;

        const animate = () => {
          progress += increment;
          if (progress <= 100) {
            setAnimatedRoutes(prev => new Map(prev).set(route.rank, progress));
            requestAnimationFrame(animate);
          } else {
            setAnimatedRoutes(prev => new Map(prev).set(route.rank, 100));
          }
        };

        requestAnimationFrame(animate);
      }, animationDelay);
    });
  }, [routes]);

  // ========== UTILITY FUNCTIONS ==========

  const getRankColor = (rank: number): string => {
    if (rank === 1) return '#0088ff'; // Best - Blue
    if (rank === 2) return '#00cc88'; // Good - Green
    return '#ffaa00'; // Alternative - Orange
  };

  const getRouteWeight = (route: CalculatedRoute): number => {
    return selectedRoute?.rank === route.rank ? 8 : 5;
  };

  const getRouteOpacity = (route: CalculatedRoute): number => {
    if (!selectedRoute) return 0.8;
    return selectedRoute.rank === route.rank ? 1 : 0.4;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters.toFixed(0)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const extractWarningLocations = (route: CalculatedRoute): Array<{ lat: number; lng: number; type: 'aqi' | 'accident' | 'traffic' | 'weather'; message: string }> => {
    const locations: Array<{ lat: number; lng: number; type: 'aqi' | 'accident' | 'traffic' | 'weather'; message: string }> = [];

    if (!route.geometry.geometry.coordinates) return locations;

    const coords = route.geometry.geometry.coordinates;

    // Place warning markers along the route
    route.warnings.forEach((warning, idx) => {
      let type: 'aqi' | 'accident' | 'traffic' | 'weather' = 'aqi';

      if (warning.toLowerCase().includes('aqi') || warning.toLowerCase().includes('air quality')) {
        type = 'aqi';
      } else if (warning.toLowerCase().includes('accident')) {
        type = 'accident';
      } else if (warning.toLowerCase().includes('traffic') || warning.toLowerCase().includes('congestion')) {
        type = 'traffic';
      } else if (warning.toLowerCase().includes('weather') || warning.toLowerCase().includes('rain') || warning.toLowerCase().includes('visibility')) {
        type = 'weather';
      }

      // Distribute warnings evenly along the route
      const segmentIndex = Math.min(
        Math.floor((coords.length - 1) * ((idx + 1) / (route.warnings.length + 1))),
        coords.length - 1
      );

      const [lng, lat] = coords[segmentIndex];

      locations.push({ lat, lng, type, message: warning });
    });

    return locations;
  };

  const getAnimatedCoordinates = (route: CalculatedRoute): [number, number][] => {
    const progress = animatedRoutes.get(route.rank) || 0;
    const coords = route.geometry.geometry.coordinates;

    if (progress >= 100 || !coords) {
      return coords.map(([lng, lat]) => [lat, lng]);
    }

    const totalPoints = coords.length;
    const pointsToShow = Math.max(2, Math.floor((totalPoints * progress) / 100));

    return coords.slice(0, pointsToShow).map(([lng, lat]) => [lat, lng]);
  };

  // ========== RENDER ==========

  if (routes.length === 0) return null;

  return (
    <>
      {/* Route Polylines */}
      {routes.map((route) => {
        const coordinates = getAnimatedCoordinates(route);
        const color = getRankColor(route.rank);
        const weight = getRouteWeight(route);
        const opacity = getRouteOpacity(route);

        return (
          <Polyline
            key={`route-${route.rank}`}
            positions={coordinates}
            pathOptions={{
              color,
              weight,
              opacity,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            eventHandlers={{
              click: () => onRouteClick && onRouteClick(route),
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight: weight + 2,
                });
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  weight,
                });
              },
            }}
          >
            <Tooltip sticky>
              <div className="text-xs">
                <div className="font-bold mb-1">
                  Route {route.rank} - {route.rank === 1 ? 'Best' : route.rank === 2 ? 'Good' : 'Alternative'}
                </div>
                <div className="space-y-0.5">
                  <div><strong>Distance:</strong> {formatDistance(route.distance)}</div>
                  <div><strong>Duration:</strong> {formatDuration(route.duration)}</div>
                  <div><strong>Score:</strong> {route.totalScore.toFixed(1)}/100</div>
                  <div className="pt-1 border-t border-gray-300 mt-1">
                    <div className="text-[10px] space-y-0.5">
                      <div>AQI: {route.aqiScore.toFixed(0)}/100</div>
                      <div>Weather: {route.weatherScore.toFixed(0)}/100</div>
                      <div>Accidents: {route.accidentScore.toFixed(0)}/100</div>
                      <div>Traffic: {route.trafficScore.toFixed(0)}/100</div>
                    </div>
                  </div>
                  {route.warnings.length > 0 && (
                    <div className="pt-1 border-t border-gray-300 mt-1">
                      <div className="text-[10px] text-yellow-600">
                        ⚠️ {route.warnings.length} warning{route.warnings.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Tooltip>
          </Polyline>
        );
      })}

      {/* Start and End Markers (only for selected route or first route) */}
      {(selectedRoute || routes[0]) && (() => {
        const displayRoute = selectedRoute || routes[0];
        const coords = displayRoute.geometry.geometry.coordinates;

        if (!coords || coords.length < 2) return null;

        const startCoord = coords[0];
        const endCoord = coords[coords.length - 1];

        return (
          <>
            {/* Start Marker */}
            <Marker
              position={[startCoord[1], startCoord[0]]}
              icon={startIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold mb-1">Start Location</div>
                  <div className="text-xs text-gray-600">
                    {startCoord[1].toFixed(6)}, {startCoord[0].toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* End Marker */}
            <Marker
              position={[endCoord[1], endCoord[0]]}
              icon={endIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold mb-1">Destination</div>
                  <div className="text-xs text-gray-600">
                    {endCoord[1].toFixed(6)}, {endCoord[0].toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        );
      })()}

      {/* Warning Markers (only for selected route) */}
      {selectedRoute && (() => {
        const warningLocations = extractWarningLocations(selectedRoute);

        return warningLocations.map((location, idx) => (
          <Marker
            key={`warning-${selectedRoute.rank}-${idx}`}
            position={[location.lat, location.lng]}
            icon={createWarningIcon(location.type)}
            zIndexOffset={900}
          >
            <Popup>
              <div className="text-xs max-w-xs">
                <div className="font-bold mb-1 flex items-center gap-1">
                  ⚠️ Warning
                </div>
                <div className="text-gray-700">
                  {location.message}
                </div>
              </div>
            </Popup>
          </Marker>
        ));
      })()}
    </>
  );
};

export default RouteVisualization;
