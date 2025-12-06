/**
 * Weather Overlay - Weather Station Data Display
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/NguyenNhatquang522004/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/WeatherOverlay
 * @author Nguyễn Nhật Quang
 * @created 2025-11-27
 * @modified 2025-11-27
 * @version 2.0.0
 * @license MIT
 * 
 * @description
 * Weather Overlay Component - Displays weather station data on map with
 * multiple visualization modes (temperature, precipitation, wind, all).
 * 
 * Features:
 * - Multi-view modes: temperature, precipitation, wind, combined
 * - Color-coded weather markers
 * - Interactive popups with detailed weather metrics
 * - Temperature visualization with gradient colors
 * - Wind direction indicators
 * - Precipitation intensity markers
 * 
 * @dependencies
 * - react-leaflet@^4.2: Map markers
 * - leaflet@^1.9: Custom icons
 */

import React, { useState } from 'react';
import { CircleMarker, Marker, Popup } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { useTrafficStore } from '../store/trafficStore';
import { Weather } from '../types';

type WeatherView = 'temperature' | 'precipitation' | 'wind' | 'all';

interface WeatherOverlayProps {
  visible?: boolean;
}

const createRainIcon = (intensity: number): Icon => {
  const size = Math.min(15 + intensity * 3, 35);
  return new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [size * 0.6, size],
    iconAnchor: [size * 0.3, size],
    popupAnchor: [1, -size * 0.8],
    shadowSize: [size, size],
  });
};

const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ visible = true }) => {
  // Early return BEFORE any hooks
  if (!visible) return null;

  const { weather } = useTrafficStore();
  const [view, setView] = useState<WeatherView>('all');
  const [isPanelVisible, setIsPanelVisible] = useState(false); // Hidden - controls now in Sidebar

  const getTemperatureColor = (temp: number): string => {
    if (temp <= 15) return '#0000ff';
    if (temp <= 20) return '#00bfff';
    if (temp <= 25) return '#00ff00';
    if (temp <= 30) return '#ffff00';
    if (temp <= 35) return '#ffa500';
    return '#ff0000';
  };

  const getTemperatureRadius = (temp: number): number => {
    const normalized = Math.max(15, Math.min(40, temp));
    return 10 + ((normalized - 15) / 25) * 30;
  };

  const createWindArrow = (direction: string, speed: number): DivIcon => {
    const directionMap: Record<string, number> = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5,
    };

    const angle = directionMap[direction] || 0;
    const length = Math.min(10 + speed * 2, 50);
    const color = speed > 20 ? '#ff0000' : speed > 10 ? '#ffa500' : '#00ff00';

    const html = `
      <div style="position: relative; width: ${length}px; height: ${length}px;">
        <svg width="${length}" height="${length}" style="transform: rotate(${angle}deg); transform-origin: center;">
          <line x1="${length / 2}" y1="${length}" x2="${length / 2}" y2="5" 
                stroke="${color}" stroke-width="2" marker-end="url(#arrowhead-${direction}-${speed})"/>
          <defs>
            <marker id="arrowhead-${direction}-${speed}" markerWidth="10" markerHeight="10" 
                    refX="5" refY="5" orient="auto">
              <polygon points="0 0, 10 5, 0 10" fill="${color}" />
            </marker>
          </defs>
        </svg>
      </div>
    `;

    return new DivIcon({
      html,
      className: 'wind-arrow',
      iconSize: [length, length],
      iconAnchor: [length / 2, length / 2],
    });
  };

  const renderTemperatureView = () => {
    return weather
      .filter((w: Weather) =>
        w?.location?.latitude != null &&
        w?.location?.longitude != null &&
        !isNaN(w.location.latitude) &&
        !isNaN(w.location.longitude)
      )
      .map((w: Weather) => (
        <CircleMarker
          key={`temp-${w.id}`}
          center={[w.location.latitude, w.location.longitude]}
          radius={getTemperatureRadius(w.temperature)}
          pathOptions={{
            fillColor: getTemperatureColor(w.temperature),
            fillOpacity: 0.4,
            color: getTemperatureColor(w.temperature),
            weight: 2,
            opacity: 0.8,
          }}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-bold text-sm mb-1">Temperature</h4>
              <p className="text-lg font-bold" style={{ color: getTemperatureColor(w.temperature) }}>
                {w.temperature}°C
              </p>
              <p className="text-xs text-gray-600">{w.location.district}</p>
              <p className="text-xs mt-1">{w.condition}</p>
            </div>
          </Popup>
        </CircleMarker>
      ));
  };

  const renderPrecipitationView = () => {
    return weather
      .filter((w: Weather) =>
        w.rainfall > 0 &&
        w?.location?.latitude != null &&
        w?.location?.longitude != null &&
        !isNaN(w.location.latitude) &&
        !isNaN(w.location.longitude)
      )
      .map((w: Weather) => (
        <Marker
          key={`rain-${w.id}`}
          position={[w.location.latitude, w.location.longitude]}
          icon={createRainIcon(w.rainfall)}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-bold text-sm mb-1">Precipitation</h4>
              <p className="text-lg font-bold text-blue-600">{w.rainfall} mm/h</p>
              <p className="text-xs text-gray-600">{w.location.district}</p>
              <p className="text-xs mt-1">
                <span className="font-semibold">Temp:</span> {w.temperature}°C<br />
                <span className="font-semibold">Humidity:</span> {w.humidity}%
              </p>
            </div>
          </Popup>
        </Marker>
      ));
  };

  const renderWindView = () => {
    return weather
      .filter((w: Weather) =>
        w.windSpeed > 0 &&
        w?.location?.latitude != null &&
        w?.location?.longitude != null &&
        !isNaN(w.location.latitude) &&
        !isNaN(w.location.longitude)
      )
      .map((w: Weather) => (
        <Marker
          key={`wind-${w.id}`}
          position={[w.location.latitude, w.location.longitude]}
          icon={createWindArrow(w.windDirection, w.windSpeed)}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-bold text-sm mb-1">Wind</h4>
              <p className="text-lg font-bold">
                {w.windSpeed} km/h
              </p>
              <p className="text-sm">Direction: {w.windDirection}</p>
              <p className="text-xs text-gray-600">{w.location.district}</p>
              <p className="text-xs mt-1">
                <span className="font-semibold">Temp:</span> {w.temperature}°C<br />
                <span className="font-semibold">Condition:</span> {w.condition}
              </p>
            </div>
          </Popup>
        </Marker>
      ));
  };

  return (
    <>
      {(view === 'temperature' || view === 'all') && renderTemperatureView()}
      {(view === 'precipitation' || view === 'all') && renderPrecipitationView()}
      {(view === 'wind' || view === 'all') && renderWindView()}

      {isPanelVisible && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '280px',
            zIndex: 1000,
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>Weather View</h4>
            <button
              onClick={() => setIsPanelVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#666',
                borderRadius: '4px',
                lineHeight: '1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#3b82f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#666';
              }}
              title="Close panel"
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setView('all')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: view === 'all' ? '#3b82f6' : '#e5e7eb',
                color: view === 'all' ? 'white' : 'black',
                fontSize: '12px',
                fontWeight: view === 'all' ? 'bold' : 'normal',
              }}
            >
              All
            </button>
            <button
              onClick={() => setView('temperature')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: view === 'temperature' ? '#3b82f6' : '#e5e7eb',
                color: view === 'temperature' ? 'white' : 'black',
                fontSize: '12px',
                fontWeight: view === 'temperature' ? 'bold' : 'normal',
              }}
            >
              Temperature
            </button>
            <button
              onClick={() => setView('precipitation')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: view === 'precipitation' ? '#3b82f6' : '#e5e7eb',
                color: view === 'precipitation' ? 'white' : 'black',
                fontSize: '12px',
                fontWeight: view === 'precipitation' ? 'bold' : 'normal',
              }}
            >
              Rain
            </button>
            <button
              onClick={() => setView('wind')}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                backgroundColor: view === 'wind' ? '#3b82f6' : '#e5e7eb',
                color: view === 'wind' ? 'white' : 'black',
                fontSize: '12px',
                fontWeight: view === 'wind' ? 'bold' : 'normal',
              }}
            >
              Wind
            </button>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#666', borderTop: '1px solid #e5e7eb', paddingTop: '6px' }}>
            <div style={{ marginBottom: '4px' }}>
              <strong>Temperature:</strong> Blue (cold) → Red (hot)
            </div>
            <div style={{ marginBottom: '4px' }}>
              <strong>Rain:</strong> Marker size = intensity
            </div>
            <div>
              <strong>Wind:</strong> Arrow direction & length = speed
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WeatherOverlay;
