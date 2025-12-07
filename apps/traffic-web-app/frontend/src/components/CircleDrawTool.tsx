/**
 * Circle Draw Tool - Spatial Query Interface
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/CircleDrawTool
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Circle Draw Tool - Interactive radius-based spatial query tool for map.
 * Allows users to draw circles on map and query nearby entities (cameras,
 * weather stations, air quality sensors, accidents).
 * 
 * Features:
 * - Click-to-place circle drawing
 * - Adjustable radius (50m to 5km)
 * - Real-time entity counting within radius
 * - Results popup with entity details
 * - Multi-entity type querying
 * - Visual circle overlay on map
 * 
 * Supported Entities:
 * - Cameras (traffic monitoring)
 * - Weather stations
 * - Air quality sensors
 * - Accidents
 * 
 * @dependencies
 * - react-map-gl@^7.1: Circle and map events (MIT license)
 * - maplibre-gl@^4.7: Distance calculations (BSD-3-Clause)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { CircleMarker as Circle, useMapEvents, Marker, Popup, DivIcon, LatLng } from './map';
import { Camera, Weather, AirQuality, Accident } from '../types';

// =====================================================
// TYPES & INTERFACES
// =====================================================

interface CircleDrawToolProps {
  onResults?: (results: NearbyResults | null) => void;
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

interface NearbyResults {
  center: { lat: number; lng: number };
  radius: number;
  cameras: Camera[];
  weather: Weather[];
  airQuality: AirQuality[];
  accidents: Accident[];
  counts: {
    cameras: number;
    weather: number;
    airQuality: number;
    accidents: number;
  };
}

interface CircleData {
  center: LatLng;
  radius: number;
}

// =====================================================
// CUSTOM MARKER ICON
// =====================================================

const centerIcon = new DivIcon({
  className: 'circle-center-marker',
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background-color: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// =====================================================
// CIRCLE DRAW TOOL COMPONENT
// =====================================================

const CircleDrawTool: React.FC<CircleDrawToolProps> = ({ onResults, isActive, onToggle }) => {
  const [circle, setCircle] = useState<CircleData | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<LatLng | null>(null);
  const [currentRadius, setCurrentRadius] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<NearbyResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ========== MAP EVENTS ==========

  useMapEvents({
    click: (e) => {
      if (!isActive) return;

      if (!isDrawing) {
        // Start drawing - set center
        setStartPoint(e.latlng);
        setIsDrawing(true);
        setCurrentRadius(0);
        setCircle(null);
        setResults(null);
        setError(null);
        if (onResults) onResults(null);
      }
    },

    mousemove: (e) => {
      if (!isActive || !isDrawing || !startPoint) return;

      // Calculate radius as mouse moves
      const radius = startPoint.distanceTo(e.latlng);
      setCurrentRadius(radius);
    },

    contextmenu: (e) => {
      if (!isActive || !isDrawing || !startPoint) return;

      // Right-click to finish drawing
      e.originalEvent.preventDefault();

      const finalRadius = startPoint.distanceTo(e.latlng);

      if (finalRadius < 10) {
        setError('Radius too small. Minimum is 10 meters.');
        setIsDrawing(false);
        setStartPoint(null);
        return;
      }

      if (finalRadius > 50000) {
        setError('Radius too large. Maximum is 50km.');
        setIsDrawing(false);
        setStartPoint(null);
        return;
      }

      setCircle({
        center: startPoint,
        radius: finalRadius,
      });

      setIsDrawing(false);
      setStartPoint(null);

      // Query backend
      queryNearby(startPoint, finalRadius);
    },
  });

  // ========== API QUERY ==========

  const queryNearby = async (center: LatLng, radius: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cameras/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: center.lat,
          lng: center.lng,
          radius: Math.round(radius),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch nearby data');
      }

      const data = await response.json();

      if (data.success && data.data) {
        setResults(data.data);
        if (onResults) onResults(data.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error querying nearby data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch nearby data');
      setResults(null);
      if (onResults) onResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== CLEAR CIRCLE ==========

  const clearCircle = useCallback(() => {
    setCircle(null);
    setResults(null);
    setError(null);
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRadius(0);
    if (onResults) onResults(null);
  }, [onResults]);

  // ========== KEYBOARD SHORTCUT (ESC to cancel) ==========

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        if (isDrawing) {
          setIsDrawing(false);
          setStartPoint(null);
        } else if (circle) {
          clearCircle();
        } else {
          onToggle(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isDrawing, circle, clearCircle, onToggle]);

  // ========== AUTO-CLEAR WHEN DEACTIVATED ==========

  useEffect(() => {
    if (!isActive) {
      clearCircle();
    }
  }, [isActive, clearCircle]);

  // ========== UTILITY FUNCTIONS ==========

  const formatRadius = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // ========== RENDER ==========

  if (!isActive) return null;

  return (
    <>
      {/* Drawing preview circle */}
      {isDrawing && startPoint && currentRadius > 0 && (
        <Circle
          center={startPoint}
          radius={currentRadius}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            weight: 2,
            dashArray: '5, 5',
          }}
        />
      )}

      {/* Final circle */}
      {circle && !isDrawing && (
        <>
          <Circle
            center={circle.center}
            radius={circle.radius}
            pathOptions={{
              color: isLoading ? '#f59e0b' : results ? '#10b981' : '#3b82f6',
              fillColor: isLoading ? '#f59e0b' : results ? '#10b981' : '#3b82f6',
              fillOpacity: 0.15,
              weight: 3,
            }}
          />
          <Marker position={circle.center} icon={centerIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold mb-2">Search Radius</div>
                <div className="space-y-1">
                  <div>
                    <strong>Center:</strong> {circle.center.lat.toFixed(6)}, {circle.center.lng.toFixed(6)}
                  </div>
                  <div>
                    <strong>Radius:</strong> {formatRadius(circle.radius)}
                  </div>

                  {isLoading && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-300">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      <span className="text-gray-600">Loading...</span>
                    </div>
                  )}

                  {results && !isLoading && (
                    <div className="pt-2 border-t border-gray-300 space-y-1">
                      <div className="font-semibold text-green-600">Results:</div>
                      <div className="text-xs space-y-0.5">
                        <div>📷 Cameras: {results.counts.cameras}</div>
                        <div>🌤️ Weather: {results.counts.weather}</div>
                        <div>💨 AQI: {results.counts.airQuality}</div>
                        <div>🚨 Accidents: {results.counts.accidents}</div>
                      </div>
                    </div>
                  )}

                  {error && !isLoading && (
                    <div className="pt-2 border-t border-gray-300">
                      <div className="text-xs text-red-600">
                        ⚠️ {error}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-gray-300">
                    <button
                      onClick={clearCircle}
                      className="w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Clear Circle
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        </>
      )}

      {/* Control Panel */}
      <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg z-[1000] p-4 w-72">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            🎯 Circle Search Tool
          </h3>
          <button
            onClick={() => onToggle(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
            <div className="font-semibold text-blue-900 mb-2">How to use:</div>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-xs">
              <li>Click map to set center</li>
              <li>Move mouse to adjust radius</li>
              <li>Right-click to finish</li>
              <li>Press ESC to cancel</li>
            </ol>
          </div>

          {/* Current Status */}
          <div className="border border-gray-200 rounded p-3 text-sm">
            <div className="font-semibold text-gray-700 mb-2">Status:</div>
            <div className="text-xs space-y-1">
              {isDrawing && (
                <div className="text-blue-600">
                  ✏️ Drawing... Radius: {formatRadius(currentRadius)}
                </div>
              )}
              {!isDrawing && !circle && (
                <div className="text-gray-500">
                  👆 Click map to start
                </div>
              )}
              {circle && !isLoading && !results && !error && (
                <div className="text-yellow-600">
                  ⏳ Waiting for results...
                </div>
              )}
              {isLoading && (
                <div className="text-orange-600">
                  🔄 Loading data...
                </div>
              )}
              {results && (
                <div className="text-green-600">
                  ✅ Found {results.counts.cameras + results.counts.weather + results.counts.airQuality + results.counts.accidents} items
                </div>
              )}
              {error && (
                <div className="text-red-600">
                  ❌ {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Summary */}
          {results && (
            <div className="border border-green-200 bg-green-50 rounded p-3 text-sm">
              <div className="font-semibold text-green-900 mb-2">Results in {formatRadius(results.radius)}:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Cameras</div>
                  <div className="text-lg font-bold text-blue-600">{results.counts.cameras}</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Weather</div>
                  <div className="text-lg font-bold text-cyan-600">{results.counts.weather}</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">AQI</div>
                  <div className="text-lg font-bold text-purple-600">{results.counts.airQuality}</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-gray-600">Accidents</div>
                  <div className="text-lg font-bold text-red-600">{results.counts.accidents}</div>
                </div>
              </div>
            </div>
          )}

          {/* Clear Button */}
          {circle && (
            <button
              onClick={clearCircle}
              className="w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Clear Search Area
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default CircleDrawTool;
