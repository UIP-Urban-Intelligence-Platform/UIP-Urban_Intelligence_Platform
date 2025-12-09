/**
 * ClusteredWeatherMarkers Component - Weather Station Clustering Layer
 *
 * UIP - Urban Intelligence Platform
 * Copyright (c) 2025 UIP Team. All rights reserved.
 * https://github.com/UIP-Urban-Intelligence-Platform/UIP-Urban_Intelligence_Platform
 *
 * SPDX-License-Identifier: MIT
 *
 * @module apps/traffic-web-app/frontend/src/components/ClusteredWeatherMarkers
 * @author Nguyen Dinh Anh Tuan
 * @created 2025-12-09
 * @modified 2025-12-09
 * @version 1.0.0
 * @license MIT
 *
 * @description
 * Renders weather observation markers with intelligent clustering and condition-based icons.
 * Displays real-time weather data including temperature, humidity, rainfall, and wind.
 * Uses emoji weather icons that adapt to current conditions.
 *
 * Features:
 * - Weather condition-based icons (☀️🌧️⛈️☁️🌫️)
 * - Temperature-based cluster coloring (red >35°C, cyan <20°C)
 * - Interactive popups with full weather details
 * - Wind speed and direction indicators
 *
 * Usage:
 *   <ClusteredWeatherMarkers
 *     weather={weatherData}
 *     zoom={mapZoom}
 *     bounds={mapBounds}
 *     visible={filters.showWeather}
 *   />
 *
 * @see {@link https://smartdatamodels.org/dataModel.Weather/WeatherObserved|NGSI-LD WeatherObserved}
 */

import React, { useMemo, useCallback } from 'react';
import { Marker, Popup, Tooltip, DivIcon } from './map';
import { useMap } from './map/useMap';
import { useSupercluster, ClusterPoint } from '../hooks/useSupercluster';
import { Weather } from '../types';
import { format, parseISO } from 'date-fns';

interface ClusteredWeatherMarkersProps {
    weather: Weather[];
    visible: boolean;
    zoom: number;
    bounds: [number, number, number, number];
}

// Create cluster icon
const createClusterIcon = (count: number, avgTemp: number) => {
    const size = count < 10 ? 40 : count < 50 ? 50 : 60;
    const fontSize = count < 10 ? 14 : count < 50 ? 16 : 18;

    // Color based on average temperature
    let bg = '#3B82F6'; // Default blue
    let border = '#2563EB';
    if (avgTemp > 35) {
        bg = '#EF4444'; // Hot - Red
        border = '#DC2626';
    } else if (avgTemp > 30) {
        bg = '#F59E0B'; // Warm - Orange
        border = '#D97706';
    } else if (avgTemp < 20) {
        bg = '#06B6D4'; // Cool - Cyan
        border = '#0891B2';
    }

    return new DivIcon({
        html: `
      <div style="
        background: ${bg};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 3px solid ${border};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${fontSize}px;
        font-family: system-ui, -apple-system, sans-serif;
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        ${count}
      </div>
    `,
        className: 'weather-cluster-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// Create individual weather icon
const createWeatherIcon = (weather: Weather) => {
    // Determine icon and color based on condition and temperature
    let emoji = '☁️';
    let bg = '#3B82F6';
    let border = '#2563EB';

    const condition = weather.condition?.toLowerCase() || '';
    const temp = weather.temperature;

    if (condition.includes('rain') || condition.includes('shower') || weather.rainfall > 0) {
        emoji = '🌧️';
        bg = '#6366F1';
        border = '#4F46E5';
    } else if (condition.includes('storm') || condition.includes('thunder')) {
        emoji = '⛈️';
        bg = '#7C3AED';
        border = '#6D28D9';
    } else if (condition.includes('cloud') || condition.includes('overcast')) {
        emoji = '☁️';
        bg = '#64748B';
        border = '#475569';
    } else if (condition.includes('clear') || condition.includes('sunny')) {
        emoji = '☀️';
        bg = temp > 35 ? '#EF4444' : '#F59E0B';
        border = temp > 35 ? '#DC2626' : '#D97706';
    } else if (condition.includes('fog') || condition.includes('mist')) {
        emoji = '🌫️';
        bg = '#9CA3AF';
        border = '#6B7280';
    }

    return new DivIcon({
        html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          background: ${bg};
          border: 2px solid ${border};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          ${emoji}
        </div>
      </div>
    `,
        className: 'weather-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
    });
};

export const ClusteredWeatherMarkers: React.FC<ClusteredWeatherMarkersProps> = ({
    weather,
    visible,
    zoom,
    bounds,
}) => {
    const map = useMap();

    if (!visible) return null;

    // Convert bounds to object
    const boundsObj = useMemo(() => ({
        west: bounds[0],
        south: bounds[1],
        east: bounds[2],
        north: bounds[3],
    }), [bounds]);

    // Convert weather to cluster points
    const clusterPoints: ClusterPoint[] = useMemo(() => {
        return weather
            .filter((w) => {
                const lat = (w?.location as any)?.lat || w?.location?.latitude;
                const lng = (w?.location as any)?.lng || w?.location?.longitude;
                return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
            })
            .map((w) => ({
                id: w.id,
                lat: (w.location as any).lat || w.location.latitude,
                lng: (w.location as any).lng || w.location.longitude,
                properties: {
                    weather: w,
                    temperature: w.temperature,
                },
            }));
    }, [weather]);

    // Use supercluster
    const { clusters, getClusterExpansionZoom } = useSupercluster(clusterPoints, boundsObj, zoom, {
        radius: 70,
        maxZoom: 16,
        minZoom: 0,
        minPoints: 3,
    });

    // Handle cluster click
    const handleClusterClick = useCallback((cluster: any) => {
        if (cluster.isCluster && typeof cluster.id === 'number' && map) {
            const expansionZoom = getClusterExpansionZoom(cluster.id);
            map.flyTo([cluster.lat, cluster.lng], Math.min(expansionZoom, 18));
        }
    }, [getClusterExpansionZoom, map]);

    console.log('☁️ ClusteredWeatherMarkers:', {
        total: weather.length,
        clusterPoints: clusterPoints.length,
        visibleClusters: clusters.length,
        zoom,
    });

    return (
        <>
            {clusters.map((cluster) => {
                if (cluster.isCluster) {
                    // Calculate average temperature for cluster
                    const temps = cluster.properties?.points?.map((p: any) => p.temperature) || [];
                    const avgTemp = temps.reduce((sum: number, t: number) => sum + t, 0) / temps.length || 25;

                    return (
                        <Marker
                            key={`weather-cluster-${cluster.id}`}
                            position={[cluster.lat, cluster.lng]}
                            icon={createClusterIcon(cluster.pointCount || 0, avgTemp)}
                            eventHandlers={{
                                click: () => handleClusterClick(cluster),
                            }}
                        >
                            <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
                                <strong>{cluster.pointCount} weather stations</strong>
                                <br />
                                <span style={{ fontSize: '11px' }}>Avg: {avgTemp.toFixed(1)}°C</span>
                            </Tooltip>
                        </Marker>
                    );
                }

                // Individual weather marker
                const w = cluster.properties?.weather as Weather;
                if (!w) return null;

                const lat = cluster.lat;
                const lng = cluster.lng;

                return (
                    <Marker
                        key={w.id}
                        position={[lat, lng]}
                        icon={createWeatherIcon(w)}
                    >
                        <Tooltip direction="top" offset={[0, -40]} opacity={0.9}>
                            {w.temperature}°C - {w.condition}
                        </Tooltip>
                        <Popup>
                            <div className="p-3 min-w-[240px] bg-white text-gray-900">
                                <h3 className="font-bold text-lg mb-2 text-sky-600">Weather</h3>
                                <p className="text-sm text-gray-600 mb-2">{w.location.district}</p>

                                <div className="space-y-1">
                                    <p className="text-sm">
                                        <span className="font-semibold">Temperature:</span> {w.temperature}°C
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Humidity:</span> {w.humidity}%
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Rainfall:</span> {w.rainfall}mm
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Wind:</span> {w.windSpeed}km/h {w.windDirection}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-semibold">Condition:</span> {w.condition}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {format(parseISO(w.timestamp || w.dateObserved || new Date().toISOString()), 'PPpp')}
                                    </p>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};

export default ClusteredWeatherMarkers;
